// Offline: dla każdego pytania z docs/test-asystenta.md – decyzja (AI/BRAK), pokrycie i ID fragmentów kontekstu.
// Ta sama logika co odpowiedz.ts (pełne pytanie + warianty sednoPytania, lepsze pokrycie wygrywa), bez AI.
// Użycie (z katalogu repozytorium): node --no-warnings --import ./scripts/baza-wiedzy/offline/rejestr.mjs scripts/baza-wiedzy/offline/zestaw.mjs wynik.json
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = process.env.REPO_ROOT ?? fileURLToPath(new URL("../../..", import.meta.url));
const zRepo = (plik) => pathToFileURL(path.join(ROOT, plik)).href;
const { szukajFragmentow } = await import(zRepo("src/features/asystent/baza.ts"));
const { sednoPytania } = await import(zRepo("src/features/asystent/wyszukiwanie.ts"));
const { anonimizuj, ZNACZNIK_OSOBY } = await import(zRepo("src/features/asystent/anonimizacja.ts"));

const wiersze = readFileSync(path.join(ROOT, "docs/test-asystenta.md"), "utf8")
  .split("\n")
  .filter((l) => /^\| \d+ \|/.test(l))
  .map((l) => {
    const [nr, sciezka, pytanie] = l.split("|").slice(1, -1).map((c) => c.trim());
    return { nr, rodzaj: { pierwsza: "pierwsza", okresowa: "okresowa" }[sciezka.toLowerCase()], pytanie };
  });

const wynik = {};
for (const w of wiersze) {
  const p = anonimizuj(w.pytanie).tekst.replaceAll(ZNACZNIK_OSOBY, " ");
  let s = szukajFragmentow(p, w.rodzaj);
  for (const sedno of sednoPytania(p)) {
    const z = szukajFragmentow(sedno, w.rodzaj);
    if (z.pokrycie > s.pokrycie) s = z;
  }
  wynik[w.nr] = {
    decyzja: s.fragmenty.length && s.pokrycie >= 0.4 ? "AI" : "BRAK",
    pokrycie: Number(s.pokrycie.toFixed(2)),
    ids: s.fragmenty.map((t) => t.item.id),
  };
}
writeFileSync(process.argv[2], JSON.stringify(wynik, null, 1));
console.log(`${wiersze.length} pytań → ${process.argv[2]}`);
