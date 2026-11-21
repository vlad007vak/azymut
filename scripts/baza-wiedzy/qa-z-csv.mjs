#!/usr/bin/env node
/**
 * Baza pytań i odpowiedzi (Q&A) asystenta formalnego – import z arkusza i sprawdzenie pliku.
 *
 *   node scripts/baza-wiedzy/qa-z-csv.mjs pytania.csv [--nazwa "Baza MC 2026"] [--wyjscie plik.json]
 *   node scripts/baza-wiedzy/qa-z-csv.mjs --sprawdz [plik.json]
 *   node scripts/baza-wiedzy/qa-z-csv.mjs --do-csv pytania.csv [plik.json]   (obecna baza → CSV do Excela)
 *
 * CSV (UTF-8, w Excelu: „Zapisz jako” → „CSV UTF-8”), separator „;” albo „,”, pierwszy wiersz = nagłówki:
 *   pytanie;odpowiedz;zrodlo;rodzaj      (+ opcjonalnie kolumna id; polskie znaki w nagłówkach są dozwolone)
 * rodzaj: pierwsza | okresowa | wspolne (puste = wspolne). Bez kolumny id pozycje dostają numery qa-001, qa-002…
 * Wynik domyślnie: src/data/baza-wiedzy/pytania-odpowiedzi.json. Opis: docs/BAZA-WIEDZY.md.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PLIK_QA, sprawdzBazeQa } from "../../src/features/asystent/schemat-qa.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function zakoncz(bledy, naglowek) {
  console.error(`✗ ${naglowek}`);
  for (const b of bledy) console.error(`  – ${b}`);
  process.exit(1);
}

/** 1 pozycja, 2–4 pozycje, 5 pozycji (12–14 pozycji). */
const pozycji = (n) => {
  const d = n % 10;
  const s = n % 100;
  return `${n} ${n === 1 ? "pozycja" : d >= 2 && d <= 4 && (s < 12 || s > 14) ? "pozycje" : "pozycji"}`;
};

/** Ścieżka do komunikatu: względna w repozytorium, pełna poza nim. */
const pokaz = (plik) => {
  const wzgledna = path.relative(ROOT, plik);
  return wzgledna && !wzgledna.startsWith("..") && !path.isAbsolute(wzgledna) ? wzgledna : plik;
};

/** Nagłówki i wartości bez wielkich liter i polskich znaków: „Odpowiedź” → „odpowiedz”. */
const proste = (s) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l");

/** CSV zgodny z Excelem: pola w cudzysłowach mogą zawierać separator, cudzysłów ("") i nowe linie. */
function parsujCsv(tekst, separator) {
  const wiersze = [];
  let pole = "";
  let wiersz = [];
  let wCudzyslowie = false;
  let linia = 1;
  let poczatek = 1;
  for (let i = 0; i < tekst.length; i++) {
    const z = tekst[i];
    if (wCudzyslowie) {
      if (z === '"' && tekst[i + 1] === '"') {
        pole += '"';
        i++;
      } else if (z === '"') wCudzyslowie = false;
      else {
        if (z === "\n") linia++;
        pole += z;
      }
    } else if (z === '"' && pole === "") wCudzyslowie = true;
    else if (z === separator) {
      wiersz.push(pole);
      pole = "";
    } else if (z === "\n" || z === "\r") {
      if (z === "\r" && tekst[i + 1] === "\n") i++;
      wiersz.push(pole);
      wiersze.push({ linia: poczatek, pola: wiersz });
      pole = "";
      wiersz = [];
      linia++;
      poczatek = linia;
    } else pole += z;
  }
  if (pole !== "" || wiersz.length) {
    wiersz.push(pole);
    wiersze.push({ linia: poczatek, pola: wiersz });
  }
  if (wCudzyslowie) zakoncz([`niezamknięty cudzysłów w polu zaczynającym się w wierszu ${poczatek}`], "Błędny plik CSV");
  return wiersze;
}

function rodzajZKomorki(wartosc) {
  // Dopuszczamy zapisy z arkusza: „Pierwsza ocena”, „ocena okresowa”, „wspólne”, „obie”.
  const r = proste(wartosc ?? "");
  if (r === "" || r.includes("wspol") || r === "obie") return "wspolne";
  if (r.includes("pierwsz")) return "pierwsza";
  if (r.includes("okresow")) return "okresowa";
  return wartosc.trim();
}

function zCsv(plikCsv, nazwa, wyjscie) {
  let surowy;
  try {
    surowy = readFileSync(plikCsv, "utf8");
  } catch {
    zakoncz([`nie można odczytać pliku „${plikCsv}”`], "Brak pliku CSV");
  }
  if (surowy.includes("�")) {
    zakoncz(
      ["plik nie jest zapisany w UTF-8 – w Excelu wybierz „Zapisz jako” → „CSV UTF-8 (rozdzielany przecinkami)”"],
      "Błędne kodowanie pliku CSV",
    );
  }
  const tekst = surowy.replace(/^﻿/, "");
  const pierwszaLinia = tekst.split(/\r?\n/, 1)[0];
  const separator = pierwszaLinia.includes(";") ? ";" : ",";
  const [naglowek, ...dane] = parsujCsv(tekst, separator);
  if (!naglowek) zakoncz(["plik jest pusty"], "Błędny plik CSV");

  const kolumny = naglowek.pola.map(proste);
  const kol = (nazwaKolumny) => kolumny.indexOf(nazwaKolumny);
  const brakujace = ["pytanie", "odpowiedz", "zrodlo"].filter((k) => kol(k) < 0);
  if (brakujace.length) {
    zakoncz(
      [
        `brak kolumn: ${brakujace.join(", ")} (są: ${naglowek.pola.join(", ") || "–"})`,
        "pierwszy wiersz musi zawierać nagłówki: pytanie;odpowiedz;zrodlo;rodzaj",
      ],
      "Błędne nagłówki pliku CSV",
    );
  }

  const wiersze = dane.filter((w) => w.pola.some((p) => p.trim() !== ""));
  // Nowe linie w komórce (Alt+Enter w Excelu) zapisujemy jako „\n”.
  const komorka = (w, k) => (kol(k) >= 0 ? (w.pola[kol(k)] ?? "").replace(/\r\n?/g, "\n") : "");
  const pozycje = wiersze.map((w, i) => ({
    id: kol("id") >= 0 ? komorka(w, "id").trim() : `qa-${String(i + 1).padStart(3, "0")}`,
    pytanie: komorka(w, "pytanie"),
    odpowiedz: komorka(w, "odpowiedz"),
    zrodlo: komorka(w, "zrodlo"),
    rodzaj: rodzajZKomorki(komorka(w, "rodzaj")),
  }));

  const baza = { nazwa, wersja: 1, pozycje };
  const wynik = sprawdzBazeQa(baza, (i) => `wiersz ${wiersze[i]?.linia ?? "?"} pliku CSV`);
  if (!wynik.ok) zakoncz(wynik.bledy, `Plik ${pokaz(plikCsv)} ma błędy – baza NIE została zapisana:`);

  writeFileSync(wyjscie, `${JSON.stringify(wynik.baza, null, 2)}\n`, "utf8");
  const ile = (r) => wynik.baza.pozycje.filter((p) => p.rodzaj === r).length;
  console.log(`✓ Zapisano ${pozycji(wynik.baza.pozycje.length)} do ${pokaz(wyjscie)}`);
  console.log(`  pierwsza ocena: ${ile("pierwsza")}, ocena okresowa: ${ile("okresowa")}, wspólne: ${ile("wspolne")}`);
  if (kol("rodzaj") < 0) console.log("  (brak kolumny „rodzaj” – wszystkie pozycje oznaczono jako wspólne)");
  console.log("  Dalej: npm run build (sprawdzenie) i wdrożenie – instrukcja w docs/BAZA-WIEDZY.md.");
}

function sprawdz(plik) {
  let tekst;
  try {
    tekst = readFileSync(plik, "utf8");
  } catch {
    zakoncz([`nie można odczytać pliku „${plik}”`], "Brak pliku bazy");
  }
  let dane;
  try {
    dane = JSON.parse(tekst.replace(/^﻿/, ""));
  } catch (err) {
    // V8 podaje pozycję znaku – zamieniamy ją na wiersz i kolumnę.
    const poz = Number(/position (\d+)/.exec(err.message)?.[1]);
    const gdzie = Number.isFinite(poz)
      ? (() => {
          const przed = tekst.slice(0, poz).split("\n");
          return ` w wierszu ${przed.length}, kolumnie ${przed.at(-1).length + 1}`;
        })()
      : "";
    zakoncz(
      [
        `niepoprawny JSON${gdzie} (np. brakujący przecinek, cudzysłów albo nawias)`,
        "najprościej przygotować bazę w Excelu i wygenerować plik tym skryptem z CSV",
      ],
      `Plik ${pokaz(plik)} nie jest poprawnym JSON-em:`,
    );
  }
  const wynik = sprawdzBazeQa(dane);
  if (!wynik.ok) zakoncz(wynik.bledy, `Plik ${pokaz(plik)} ma błędy:`);
  console.log(`✓ ${pokaz(plik)}: poprawna baza „${wynik.baza.nazwa}” – ${pozycji(wynik.baza.pozycje.length)}.`);
  return wynik.baza;
}

/** Obecna baza → CSV do edycji w Excelu (UTF-8 z BOM, separator „;”), potem z powrotem przez import. */
function doCsv(plikJson, plikCsv) {
  const baza = sprawdz(plikJson);
  const pole = (s) => (/[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const linie = [
    "id;pytanie;odpowiedz;zrodlo;rodzaj",
    ...baza.pozycje.map((p) => [p.id, p.pytanie, p.odpowiedz, p.zrodlo, p.rodzaj].map(pole).join(";")),
  ];
  writeFileSync(plikCsv, `﻿${linie.join("\r\n")}\r\n`, "utf8");
  console.log(`✓ Zapisano ${pozycji(baza.pozycje.length)} do ${pokaz(plikCsv)} – otwórz w Excelu, popraw i zaimportuj:`);
  console.log(`  node scripts/baza-wiedzy/qa-z-csv.mjs ${pokaz(plikCsv)} --nazwa "${baza.nazwa}"`);
}

// ── argumenty ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const opcja = (nazwa) => {
  const i = args.indexOf(nazwa);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};

const doCsvPlik = opcja("--do-csv");
if (doCsvPlik) {
  doCsv(path.resolve(args[0] ?? path.join(ROOT, PLIK_QA)), path.resolve(doCsvPlik));
} else if (args.includes("--sprawdz")) {
  args.splice(args.indexOf("--sprawdz"), 1);
  sprawdz(path.resolve(args[0] ?? path.join(ROOT, PLIK_QA)));
} else {
  const nazwaOpcja = opcja("--nazwa");
  const wyjscie = path.resolve(opcja("--wyjscie") ?? path.join(ROOT, PLIK_QA));
  const plikCsv = args[0];
  if (!plikCsv) {
    console.error("Użycie: node scripts/baza-wiedzy/qa-z-csv.mjs pytania.csv [--nazwa \"…\"] [--wyjscie plik.json]");
    console.error("        node scripts/baza-wiedzy/qa-z-csv.mjs --sprawdz [plik.json]");
    console.error("        node scripts/baza-wiedzy/qa-z-csv.mjs --do-csv pytania.csv [plik.json]");
    process.exit(1);
  }
  zCsv(path.resolve(plikCsv), nazwaOpcja ?? `z pliku ${path.basename(plikCsv)}`, wyjscie);
}
