#!/usr/bin/env node
/**
 * Buduje bazę wiedzy asystenta formalnego z PDF-ów organizatora.
 *
 *   node scripts/baza-wiedzy/zbuduj.mjs [katalog-z-materiałami]
 *
 * Domyślny katalog: ../materialy (obok repozytorium) albo zmienna BAZA_MATERIALY.
 * Wymaga `pdftotext` (Poppler; jest w Git for Windows: /ucrt64/bin) – ścieżkę można podać w PDFTOTEXT.
 * Wynik: src/data/baza-wiedzy/fragmenty.json (commitujemy go – PDF-y nie trafiają do repozytorium).
 *
 * Fragmenty:
 *  - rozporządzenia: jeden fragment = paragraf (§) albo grupa ustępów, miejsce „§ 11 ust. 1–2”;
 *  - załącznik nr 1 do rozporządzeń: opisy elementów / kryteriów oceny (sprawdzane co do słowa
 *    z treścią PDF i z modelem kompetencji);
 *  - poradniki KPRM: fragmenty ~800–1400 znaków z numerem strony i rozdziałem.
 * Model kompetencji (src/data/model-kompetencji.json) dokładany jest w locie przez src/features/asystent.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MATERIALY = path.resolve(process.argv[2] ?? process.env.BAZA_MATERIALY ?? path.join(ROOT, "../materialy"));
const PDFTOTEXT = process.env.PDFTOTEXT ?? "pdftotext";
const OUT = path.join(ROOT, "src/data/baza-wiedzy/fragmenty.json");
const MODEL = JSON.parse(readFileSync(path.join(ROOT, "src/data/model-kompetencji.json"), "utf8"));

const DOKUMENTY = [
  {
    id: "rozp-pierwsza",
    nazwa: "Rozporządzenie PRM w sprawie pierwszej oceny w służbie cywilnej (Dz.U. 2015 poz. 1144)",
    krotko: "Rozporządzenie o pierwszej ocenie",
    rodzaj: "pierwsza",
    plik: "Rozporządzenie o pierwszej ocenie z 2015 r. (1).pdf",
    typ: "rozporzadzenie",
  },
  {
    id: "rozp-okresowa",
    nazwa: "Rozporządzenie PRM w sprawie ocen okresowych w służbie cywilnej (Dz.U. 2016 poz. 470)",
    krotko: "Rozporządzenie o ocenach okresowych",
    rodzaj: "okresowa",
    plik: "Rozporządzenie o ocenach okresowych z 2016 r. (3).pdf",
    typ: "rozporzadzenie",
  },
  {
    id: "poradnik-pierwsza",
    nazwa: "Poradnik KPRM „Pierwsza ocena w służbie cywilnej” (2016)",
    krotko: "Poradnik „Pierwsza ocena”",
    rodzaj: "pierwsza",
    plik: "Pierwsza ocena w służbie cywilnej - poradnik z 2016 r. (1).pdf",
    typ: "poradnik",
    // s. 1–2 to okładka i spis treści, od s. 36 – wzory dokumentów (załączniki).
    strony: [3, 35],
  },
  {
    id: "poradnik-okresowa",
    nazwa: "Poradnik KPRM „Oceny okresowe w służbie cywilnej” (2016)",
    krotko: "Poradnik „Oceny okresowe”",
    rodzaj: "okresowa",
    plik: "Poradnik - oceny okresowe w służbie cywilnej (2).pdf",
    typ: "poradnik",
    strony: [3, 35],
  },
];

const MAX = 1400; // docelowa długość fragmentu (znaki)
const MIN = 500; // krótsze kawałki łączymy z następnymi

// ── pomocnicze ──────────────────────────────────────────────────────────────
function pdfText(file) {
  const full = path.join(MATERIALY, file);
  if (!existsSync(full)) throw new Error(`Brak pliku: ${full}`);
  return execFileSync(PDFTOTEXT, ["-enc", "UTF-8", full, "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
}

/** Ujednolica tekst z PDF: BOM, znaki prywatne (punktory), dzielenie wyrazów, spacje. */
function clean(text) {
  return text
    .replace(/\ufeff/g, "")
    .replace(/[\ue000-\uf8ff]/g, "•")
    .replace(/(\p{Ll})-\n(?=\p{Ll})/gu, "$1") // „cywil-\nnej” → „cywilnej”
    .replace(/[ \t]+/g, " ");
}

const oneLine = (s) => s.replace(/\s+/g, " ").trim();
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9]+/g, "");

/** Dzieli długi tekst na kawałki ≤ max na granicach zdań. */
function splitSentences(text, max = MAX) {
  const sentences = text.match(/[^.!?;]+(?:[.!?;]+|$)\s*/g) ?? [text];
  const out = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && (cur + s).length > max) {
      out.push(cur.trim());
      cur = "";
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

// ── rozporządzenia ──────────────────────────────────────────────────────────
function rozporzadzenie(dok) {
  const raw = clean(pdfText(dok.plik));
  const pages = raw.split("\f");
  // Usuń nagłówki stron Dziennika Ustaw.
  const body = pages
    .map((p) =>
      p
        .split("\n")
        .filter((l) => {
          const t = l.trim();
          return !/^(Dziennik Ustaw|– \d+ –|Poz\. \d+|Dokument podpisany.*)$/.test(t);
        })
        .join("\n"),
    )
    .join("\n");

  const start = body.search(/^§ 1\. /m);
  const end = body.search(/^Prezes Rady Ministrów:/m);
  const main = body.slice(start, end);

  const fragmenty = [];
  const paragraphs = main.split(/^(?=§ \d+[a-z]?\. )/m).filter((p) => p.trim());
  for (const p of paragraphs) {
    const nr = p.match(/^§ (\d+[a-z]?)\./)[1];
    let rest = p.replace(/^§ \d+[a-z]?\.\s*/, "");

    // Ustępy: „1. Tekst” na początku linii, numerowane po kolei.
    const ust = [];
    if (/^1\. \p{Lu}/u.test(rest)) {
      let n = 1;
      let cur = rest.replace(/^1\.\s*/, "");
      for (;;) {
        const re = new RegExp(`\\n\\s*${n + 1}\\. (?=\\p{Lu})`, "u");
        const m = cur.match(re);
        if (!m) break;
        ust.push({ nr: n, tekst: oneLine(cur.slice(0, m.index)) });
        cur = cur.slice(m.index + m[0].length);
        n++;
      }
      ust.push({ nr: n, tekst: oneLine(cur) });
    }

    if (ust.length === 0) {
      fragmenty.push(frag(dok, `§ ${nr}`, `§ ${nr}. ${oneLine(rest)}`));
      continue;
    }

    const full = ust.map((u) => `${u.nr}. ${u.tekst}`).join(" ");
    if (full.length <= MAX + 300) {
      fragmenty.push(frag(dok, `§ ${nr}`, `§ ${nr}. ${full}`));
      continue;
    }
    // Grupuj ustępy do ~MAX znaków.
    let group = [];
    const flush = () => {
      if (!group.length) return;
      const a = group[0].nr;
      const b = group.at(-1).nr;
      const miejsce = a === b ? `§ ${nr} ust. ${a}` : `§ ${nr} ust. ${a}–${b}`;
      fragmenty.push(frag(dok, miejsce, `§ ${nr}. ${group.map((u) => `${u.nr}. ${u.tekst}`).join(" ")}`));
      group = [];
    };
    for (const u of ust) {
      const len = group.reduce((s, g) => s + g.tekst.length, 0);
      if (group.length && len + u.tekst.length > MAX) flush();
      group.push(u);
    }
    flush();
  }

  fragmenty.push(...zalacznik1(dok, body.slice(end)));
  return fragmenty;
}

/**
 * Załącznik nr 1: opisy elementów oceny (2015) / wykaz kryteriów oceny (2016).
 * Tabela z PDF ma rozsypane kolumny, więc opisy bierzemy z modelu kompetencji,
 * ale TYLKO po sprawdzeniu, że każdy opis występuje dosłownie w treści załącznika.
 */
function zalacznik1(dok, annexRaw) {
  const z1 = annexRaw.slice(annexRaw.search(/Załącznik nr 1/), annexRaw.search(/Załącznik nr 2/));
  // Nagłówki kolumny „KRYTERIUM” (wersaliki) potrafią wpaść w środek opisu – usuwamy je przed porównaniem.
  const z1norm = norm(z1.replace(/(?<!\p{L})I (?=\p{Lu}{2,})/gu, "").replace(/(?<!\p{L})\p{Lu}{2,}(?!\p{L})/gu, ""));
  const nazwy =
    dok.id === "rozp-pierwsza"
      ? ["Rzetelność", "Wykorzystywanie wiedzy i doskonalenie zawodowe", "Organizacja pracy i orientacja na osiąganie celów", "Komunikacja", "Współpraca"]
      : [...z1.matchAll(/^(\d+)\. ([A-ZĄĆĘŁŃÓŚŹŻ][A-ZĄĆĘŁŃÓŚŹŻ /]+?)\s*$/gm)].map((m) => m[2]);
  // „6. PODEJMOWANIE / DECYZJI / I ODPOWIEDZIALNOŚĆ” jest rozbite na linie – uzupełniamy wg modelu.
  const out = [];
  const lista = [];
  for (const k of MODEL.kompetencje) {
    const pasuje = nazwy.some((n) => norm(n).startsWith(norm(k.nazwa).slice(0, 10)));
    const opisy = k.wskazniki.map((w) => w.opis);
    const wszystkieWTekscie = opisy.every((o) => z1norm.includes(norm(o)));
    if (dok.id === "rozp-pierwsza" && !pasuje) continue;
    if (!wszystkieWTekscie) {
      if (pasuje) console.warn(`  ! ${dok.id}: opis „${k.nazwa}” nie zgadza się z załącznikiem – pomijam`);
      continue;
    }
    lista.push(k.nazwa);
    const co = dok.id === "rozp-pierwsza" ? "Element pierwszej oceny" : "Kryterium oceny okresowej";
    out.push(
      frag(
        dok,
        `zał. nr 1 – ${k.nazwa.toLowerCase()}`,
        `${co}: ${k.nazwa}. Opis (załącznik nr 1 do rozporządzenia): ${opisy.map((o) => `– ${o}`).join(" ")}`,
      ),
    );
  }
  const tytul = dok.id === "rozp-pierwsza" ? "Opisy elementów oceny" : "Wykaz kryteriów oceny";
  out.unshift(
    frag(
      dok,
      "zał. nr 1",
      `${tytul} (załącznik nr 1 do rozporządzenia) obejmuje ${lista.length} pozycji: ${lista.join(", ")}.`,
    ),
  );
  return out;
}

// ── poradniki ───────────────────────────────────────────────────────────────
function poradnik(dok) {
  const pages = clean(pdfText(dok.plik)).split("\f");

  // Spis treści (s. 2) → mapa „6.2.1” → „6.2.1. Rozmowa rozpoczynająca proces oceny”.
  const toc = new Map();
  for (const m of oneLine(pages[1]).matchAll(/(\d+(?:\.\d+)*)\.\s+([^.]+?)\s*\.{3,}\s*\d+/g)) {
    toc.set(m[1], `${m[1]}. ${m[2].trim()}`);
  }

  const [od, doStr] = dok.strony;
  const paras = []; // { strona, sekcja, tekst }
  let sekcja = "";
  for (let s = od; s <= doStr; s++) {
    const lines = pages[s - 1].split("\n").map((l) => l.trim());
    // Ostatnia niepusta linia to numer strony.
    while (lines.length && !lines.at(-1)) lines.pop();
    if (/^\d+$/.test(lines.at(-1) ?? "")) lines.pop();

    let buf = [];
    const push = () => {
      const t = oneLine(buf.join(" "));
      if (t) paras.push({ strona: s, sekcja, tekst: t });
      buf = [];
    };
    for (const line of lines) {
      const h = line.match(/^(\d+(?:\.\d+)*)\.\s+\S/);
      if (h && toc.has(h[1]) && norm(line).startsWith(norm(toc.get(h[1])).slice(0, 12))) {
        push();
        sekcja = toc.get(h[1]);
      }
      if (!line) push();
      else buf.push(line);
    }
    push();
  }

  // Sklejanie akapitów w fragmenty ~MIN..MAX znaków (nowy fragment przy zmianie rozdziału).
  const out = [];
  let cur = null;
  const flush = () => {
    if (!cur) return;
    const strony = cur.od === cur.do ? `s. ${cur.od}` : `s. ${cur.od}–${cur.do}`;
    out.push(frag(dok, cur.sekcja ? `${strony} (rozdz. ${cur.sekcja})` : strony, cur.tekst.trim(), cur.sekcja));
    cur = null;
  };
  for (const p of paras) {
    for (const kawalek of splitSentences(p.tekst)) {
      if (cur && cur.sekcja !== p.sekcja && cur.tekst.length >= MIN / 2) flush();
      if (cur && cur.tekst.length + kawalek.length > MAX && cur.tekst.length >= MIN) flush();
      if (!cur) cur = { od: p.strona, do: p.strona, sekcja: p.sekcja, tekst: "" };
      cur.tekst += (cur.tekst ? " " : "") + kawalek;
      cur.do = p.strona;
    }
  }
  flush();
  return out;
}

// ── budowa ──────────────────────────────────────────────────────────────────
const licznik = new Map();
function frag(dok, miejsce, tekst, sekcja) {
  const n = (licznik.get(dok.id) ?? 0) + 1;
  licznik.set(dok.id, n);
  return { id: `${dok.id}-${String(n).padStart(3, "0")}`, dokumentId: dok.id, miejsce, ...(sekcja ? { sekcja } : {}), tekst };
}

const fragmenty = [];
for (const dok of DOKUMENTY) {
  const f = dok.typ === "rozporzadzenie" ? rozporzadzenie(dok) : poradnik(dok);
  const dl = f.map((x) => x.tekst.length);
  console.log(
    `${dok.id}: ${f.length} fragmentów (długość ${Math.min(...dl)}–${Math.max(...dl)}, śr. ${Math.round(dl.reduce((a, b) => a + b, 0) / dl.length)})`,
  );
  fragmenty.push(...f);
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify(
    {
      opis: "Baza wiedzy asystenta formalnego – generowana przez scripts/baza-wiedzy/zbuduj.mjs z materiałów organizatora. Nie edytuj ręcznie.",
      dokumenty: DOKUMENTY.map(({ id, nazwa, krotko, rodzaj }) => ({ id, nazwa, krotko, rodzaj })),
      fragmenty,
    },
    null,
    1,
  ) + "\n",
);
console.log(`Zapisano ${fragmenty.length} fragmentów → ${path.relative(ROOT, OUT)}`);
