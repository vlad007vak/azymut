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
 *  - poradniki KPRM: fragmenty ~800–1400 znaków z numerem strony i rozdziałem;
 *  - ustawa o służbie cywilnej: tylko art. 38 i 81–83, jeden fragment = jeden ustęp, miejsce „art. 81 ust. 4”.
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
  {
    id: "ustawa-sc",
    nazwa: "Ustawa z dnia 21 listopada 2008 r. o służbie cywilnej (t.j. Dz.U. 2026 poz. 590)",
    krotko: "Ustawa o służbie cywilnej",
    rodzaj: "wspolne",
    plik: "ustawa-o-sluzbie-cywilnej-tj-DzU-2026-590.pdf",
    typ: "ustawa",
    // Tylko przepisy o ocenach: art. 38 – pierwsza ocena, art. 81–83 – ocena okresowa i sprzeciw.
    artykuly: { 38: "pierwsza", 81: "okresowa", 82: "okresowa", 83: "okresowa" },
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
      if (a === b && group[0].tekst.length > MAX) {
        fragmenty.push(...punkty(dok, nr, group[0]));
      } else {
        const miejsce = a === b ? `§ ${nr} ust. ${a}` : `§ ${nr} ust. ${a}–${b}`;
        fragmenty.push(frag(dok, miejsce, `§ ${nr}. ${group.map((u) => `${u.nr}. ${u.tekst}`).join(" ")}`));
      }
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
  // Słowa kluczowe pomagają wyszukiwarce (nie są pokazywane użytkownikowi ani modelowi).
  for (const f of fragmenty) {
    const nrP = f.miejsce.match(/^§ (\d+)/)?.[1];
    const slowa = nrP && TEMATY[dok.id]?.[nrP];
    if (slowa) f.slowa = slowa;
  }
  return fragmenty;
}

/** Bardzo długi ustęp (np. § 11 ust. 1) dzielimy po punktach „1) … 5)”, powtarzając wstęp. */
function punkty(dok, nrP, u) {
  const czesci = u.tekst.split(/\s(?=\d+\) )/);
  const wstep = czesci[0];
  const pkt = czesci.slice(1).map((t) => ({ nr: Number(t.match(/^(\d+)\)/)[1]), tekst: t }));
  const out = [];
  let grupa = [];
  const flush = () => {
    if (!grupa.length) return;
    const a = grupa[0].nr;
    const b = grupa.at(-1).nr;
    const miejsce = `§ ${nrP} ust. ${u.nr} ${a === b ? `pkt ${a}` : `pkt ${a}–${b}`}`;
    out.push(frag(dok, miejsce, `§ ${nrP}. ${u.nr}. ${wstep} ${grupa.map((p) => p.tekst).join(" ")}`));
    grupa = [];
  };
  for (const p of pkt) {
    const len = grupa.reduce((s, g) => s + g.tekst.length, 0);
    if (grupa.length && len + p.tekst.length > MAX * 0.6) flush();
    grupa.push(p);
  }
  flush();
  return out;
}

/** Słowa kluczowe do indeksu dla paragrafów rozporządzeń (tematy, o które pytają przełożeni). */
const TEMATY = {
  "rozp-pierwsza": {
    2: "elementy pierwszej oceny co bierze się pod uwagę egzamin służba przygotowawcza sprawozdanie",
    3: "rozmowa wstępna termin 21 dni nowy pracownik zastępstwo",
    4: "termin złożenia sprawozdania 8 miesięcy arkusz pierwszej oceny kopia",
    5: "nowy termin sprawozdania nieobecność przedłużenie umowy",
    6: "sprawozdanie zawartość okres 7 miesięcy co opisuje formularz",
    7: "na czym polega pierwsza ocena rozmowa oceniająca oceny cząstkowe ocena łączna średnia",
    8: "rozmowa oceniająca kiedy kto uczestniczy",
    9: "skala punktowa punkty 3 5 7 poniżej na poziomie powyżej oczekiwań",
    10: "warunki pozytywna negatywna pierwsza ocena uzasadnienie wnioski rozwój zawodowy egzamin KSAP",
    11: "zapoznanie z oceną akta osobowe kopia arkusza",
  },
  "rozp-okresowa": {
    2: "kryteria obowiązkowe dodatkowe kto ocenia bezpośredni przełożony oceniający",
    3: "arkusz A arkusz B arkusz C który arkusz kierownik urzędu kierowanie pracownikami",
    4: "kryteria obowiązkowe arkusz A arkusz B arkusz C kierownik urzędu kierujący pracownikami pozostali pracownicy",
    5: "rozmowa rozpoczynająca ustalenie kryteriów kryteria dodatkowe maksymalnie 3 cele oczekiwania",
    6: "zapoznanie z kryteriami podpis kopia części I arkusza akta osobowe",
    7: "termin 30 dni 7 dni po ocenie negatywnej ustalenie kryteriów zatrudnienie na czas nieokreślony",
    8: "zmiana terminu oceny zawiadomienie pisemne",
    9: "zmiana stanowiska zmiana oceniającego przełożonego 6 miesięcy",
    10: "rozmowa oceniająca co omówić rozwój zawodowy",
    11: "skala ocen punkty 1 3 5 7 9 średnia ogólny poziom ocena pozytywna negatywna IPRZ uzasadnienie stopień służbowy",
    12: "zapoznanie z oceną akta osobowe kopia arkusza",
  },
};

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

// ── ustawa ──────────────────────────────────────────────────────────────────
/** Słowa kluczowe do indeksu dla ustępów ustawy („art.ust”) – jak TEMATY dla rozporządzeń. */
const TEMATY_USTAWY = {
  "38.1": "termin pierwszej oceny najwcześniej najpóźniej kiedy dokonać 8 miesięcy miesiąc przed końcem umowy na czas określony nowy pracownik",
  "38.2": "kto dokonuje pierwszej oceny bezpośredni przełożony kierujący komórką co bierze się pod uwagę egzamin sprawozdanie",
  "38.3": "skutki pierwszej oceny pozytywna negatywna umowa na czas nieokreślony rozwiązanie umowy wniosek dyrektor generalny",
  "38.4": "rozporządzenie podstawa prawna pierwszej oceny obiektywizm ocen",
  "81.1": "kto podlega ocenie okresowej urzędnik pracownik umowa na czas nieokreślony kto ocenia bezpośredni przełożony",
  "81.3": "czego dotyczy ocena okresowa obowiązki z opisu stanowiska pracy na piśmie zapoznanie",
  "81.4": "jak często co ile miesięcy termin oceny okresowej 24 miesiące dwa lata",
  "81.5": "IPRZ indywidualny program rozwoju zawodowego wnioski",
  "81.6": "zmiana stanowiska zakres obowiązków 6 miesięcy ocena po raz pierwszy",
  "81.7": "nieobecność choroba urlop przedłużenie terminu oceny",
  "81.8": "zmiana terminu oceny zmiana oceniającego nieobecność wniosek ocenianego",
  "81.9": "ocena negatywna ponowna ocena 6 miesięcy",
  82: "rozporządzenie podstawa prawna oceny okresowej kryteria arkusz skala obiektywizm",
  "83.1": "sprzeciw odwołanie od oceny okresowej 7 dni dyrektor generalny",
  "83.3": "rozpatrzenie sprzeciwu termin 14 dni",
  "83.4": "uwzględnienie sprzeciwu zmiana oceny ocena po raz drugi",
  "83.5": "sąd pracy odwołanie 14 dni nieuwzględnienie sprzeciwu",
};

/**
 * Warstwa tekstowa PDF Dziennika Ustaw skleja „nie” z przysłówkiem przy justowaniu
 * („niewcześniej niż”, „niepóźniej niż”) – rozdzielamy tylko te znane przypadki.
 */
const rozklejNie = (s) => s.replace(/(?<!\p{L})nie(wcześniej|później|dłużej|krócej)(?!\p{L})/gu, "nie $1");

function ustawa(dok) {
  const linie = clean(pdfText(dok.plik))
    .split(/\n|\f/)
    .map((l) => l.trim())
    .filter((l) => l && !/^(Dziennik Ustaw|– \d+ –|Poz\. \d+)$/.test(l));
  const tekst = linie.join("\n");

  const fragmenty = [];
  for (const [nr, rodzaj] of Object.entries(dok.artykuly)) {
    // Treść artykułu: od „Art. 81.” na początku linii do następnego „Art. …”.
    const start = tekst.search(new RegExp(`^Art\\. ${nr}\\. `, "m"));
    if (start < 0) throw new Error(`${dok.id}: nie znaleziono art. ${nr}`);
    const reszta = tekst.slice(start);
    const koniec = reszta.slice(1).search(/^Art\. \d+[a-z]*\. /m);
    let art = reszta.slice(0, koniec < 0 ? undefined : koniec + 1).replace(/^Art\. \d+\.\s*/, "");

    const ustepy = [];
    if (/^1\. /.test(art)) {
      art = art.replace(/^1\.\s*/, "");
      for (let n = 1; ; n++) {
        const m = art.match(new RegExp(`\\n${n + 1}\\. `));
        ustepy.push({ nr: n, tekst: oneLine(m ? art.slice(0, m.index) : art) });
        if (!m) break;
        art = art.slice(m.index + m[0].length);
      }
    } else {
      ustepy.push({ nr: 0, tekst: oneLine(art) });
    }

    for (const u of ustepy) {
      if (/^\(uchylony\)$/.test(u.tekst)) continue;
      const miejsce = u.nr ? `art. ${nr} ust. ${u.nr}` : `art. ${nr}`;
      const f = frag(dok, miejsce, `${u.nr ? `Art. ${nr} ust. ${u.nr}` : `Art. ${nr}`}. ${rozklejNie(u.tekst)}`);
      f.rodzaj = rodzaj;
      const slowa = TEMATY_USTAWY[u.nr ? `${nr}.${u.nr}` : nr];
      if (slowa) f.slowa = slowa;
      fragmenty.push(f);
    }
  }
  return fragmenty;
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
  const f = dok.typ === "rozporzadzenie" ? rozporzadzenie(dok) : dok.typ === "ustawa" ? ustawa(dok) : poradnik(dok);
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
      dokumenty: DOKUMENTY.map(({ id, nazwa, krotko, rodzaj, typ }) => ({ id, nazwa, krotko, rodzaj, typ })),
      fragmenty,
    },
    null,
    1,
  ) + "\n",
);
console.log(`Zapisano ${fragmenty.length} fragmentów → ${path.relative(ROOT, OUT)}`);
