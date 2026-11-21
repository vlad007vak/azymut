#!/usr/bin/env node
/**
 * Automatyczny przebieg zestawu testowego z docs/test-asystenta.md przez POST /api/asystent.
 *
 *   node scripts/baza-wiedzy/test-asystenta.mjs [adres-aplikacji]   (domyślnie http://localhost:3000)
 *
 * Wiersz zalicza się, gdy:
 *  - odpowiedź zawiera każdą **pogrubioną** frazę z kolumny „Oczekiwana odpowiedź”,
 *  - wśród źródeł jest miejsce z kolumny „Źródło” (`§ 3`, `s. 32` – wystarczy jedno),
 *  - pytania spoza bazy („**brak informacji**”) kończą się brakInformacji = true.
 * Między pytaniami jest przerwa – darmowe limity AI (Groq ~7000 tokenów wejścia / min na klucz).
 *
 * Zmienne środowiskowe (opcjonalne):
 *   WIERSZE=36-62      tylko wybrane wiersze (zakres albo lista: 1,5,36-40)
 *   WYNIK_JSON=plik    zapisuje pełne odpowiedzi i źródła każdego wiersza (do ręcznej oceny)
 *   PRZERWA_MS=4000    przerwa między pytaniami
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const PRZERWA_MS = Number(process.env.PRZERWA_MS ?? 4000);

const norm = (s) => s.toLowerCase().replace(/ /g, " ").replace(/\s+/g, " ");

const wiersze = readFileSync(path.join(ROOT, "docs/test-asystenta.md"), "utf8")
  .split("\n")
  .filter((l) => /^\|\s*\d+\s*\|/.test(l))
  .map((l) => {
    const [nr, sciezka, pytanie, oczekiwana, zrodlo] = l.split("|").slice(1, -1).map((c) => c.trim());
    return {
      nr,
      rodzaj: { pierwsza: "pierwsza", okresowa: "okresowa" }[sciezka.toLowerCase()],
      pytanie,
      frazy: [...oczekiwana.matchAll(/\*\*(.+?)\*\*/g)].map((m) => m[1]),
      miejsca: [...zrodlo.matchAll(/`([^`]+)`/g)].map((m) => m[1]),
    };
  });

/** WIERSZE=1,5,36-40 → zbiór numerów; bez zmiennej – wszystkie wiersze. */
function wybraneNumery(spec) {
  if (!spec) return null;
  const numery = new Set();
  for (const czesc of spec.split(",")) {
    const [od, doNr = od] = czesc.split("-").map((s) => Number(s.trim()));
    for (let n = od; n <= doNr; n++) numery.add(String(n));
  }
  return numery;
}
const numery = wybraneNumery(process.env.WIERSZE);
const doTestu = numery ? wiersze.filter((w) => numery.has(w.nr)) : wiersze;
const zapis = [];

let ok = 0;
for (const [i, w] of doTestu.entries()) {
  if (i > 0) await new Promise((r) => setTimeout(r, PRZERWA_MS));
  const t0 = Date.now();
  let wynik;
  try {
    const res = await fetch(`${BASE}/api/asystent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pytanie: w.pytanie, ...(w.rodzaj ? { rodzaj: w.rodzaj } : {}) }),
    });
    wynik = await res.json();
    if (!res.ok) throw new Error(wynik?.error ?? `HTTP ${res.status}`);
  } catch (err) {
    console.log(`✗ ${w.nr}. ${w.pytanie}\n    błąd: ${err.message}`);
    zapis.push({ nr: w.nr, pytanie: w.pytanie, ok: false, bledy: [`błąd: ${err.message}`] });
    continue;
  }
  const ms = Date.now() - t0;
  const bledy = [];
  const oczekujeBraku = w.frazy.some((f) => norm(f) === "brak informacji");
  if (oczekujeBraku) {
    if (!wynik.brakInformacji) bledy.push("oczekiwano komunikatu o braku informacji");
  } else {
    if (wynik.brakInformacji) bledy.push("asystent odpowiedział „brak informacji”");
    for (const f of w.frazy) if (!norm(wynik.odpowiedz).includes(norm(f))) bledy.push(`brak frazy „${f}”`);
    const miejsca = wynik.zrodla.map((z) => norm(z.miejsce ?? ""));
    const trafione = w.miejsca.some((p) => miejsca.some((m) => m.startsWith(norm(p)) && !/\d/.test(m[p.length] ?? "")));
    if (w.miejsca.length && !trafione) bledy.push(`brak źródła ${w.miejsca.join(" / ")} (są: ${miejsca.join("; ") || "–"})`);
  }
  if (bledy.length === 0) ok++;
  console.log(`${bledy.length ? "✗" : "✓"} ${w.nr}. ${w.pytanie} (${ms} ms${wynik.dostawca ? `, ${wynik.dostawca}` : ", bez AI"})`);
  for (const b of bledy) console.log(`    ${b}`);
  if (bledy.length) console.log(`    odpowiedź: ${wynik.odpowiedz.slice(0, 300)}`);
  zapis.push({
    nr: w.nr,
    pytanie: w.pytanie,
    ok: bledy.length === 0,
    bledy,
    brakInformacji: wynik.brakInformacji,
    odpowiedz: wynik.odpowiedz,
    zrodla: wynik.zrodla.map((z) => `${z.dokument} – ${z.miejsce ?? ""}`),
    dostawca: wynik.dostawca,
    ms,
  });
}
if (process.env.WYNIK_JSON) writeFileSync(process.env.WYNIK_JSON, JSON.stringify(zapis, null, 2));
console.log(`\nWynik: ${ok}/${doTestu.length} zaliczonych`);
process.exit(ok === doTestu.length ? 0 : 1);
