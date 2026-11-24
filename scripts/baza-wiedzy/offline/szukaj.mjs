// Offline: jakie fragmenty dostałby model i jakie pokrycie (bez AI).
// Użycie (z katalogu repozytorium): node --no-warnings --import ./scripts/baza-wiedzy/offline/rejestr.mjs scripts/baza-wiedzy/offline/szukaj.mjs "pytanie" [pierwsza|okresowa]
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = process.env.REPO_ROOT ?? fileURLToPath(new URL("../../..", import.meta.url));
const zRepo = (plik) => pathToFileURL(path.join(ROOT, plik)).href;
const { szukajFragmentow } = await import(zRepo("src/features/asystent/baza.ts"));
const { sednoPytania } = await import(zRepo("src/features/asystent/wyszukiwanie.ts"));

const pytanie = process.argv[2];
const rodzaj = process.argv[3] || undefined;
let w = szukajFragmentow(pytanie, rodzaj);
let zrodlo = "całe pytanie";
for (const s of sednoPytania(pytanie)) {
  const z = szukajFragmentow(s, rodzaj);
  console.log(`  sedno (${z.pokrycie.toFixed(2)}): ${s.slice(0, 120)}`);
  if (z.pokrycie > w.pokrycie) { w = z; zrodlo = "sedno"; }
}
console.log(`pokrycie ${w.pokrycie.toFixed(2)} (${zrodlo}) → ${w.pokrycie >= 0.4 ? "AI" : "BRAK"}`);
w.fragmenty.forEach((t, i) =>
  console.log(`F${i + 1} ${t.wynik.toFixed(2)} p=${t.pokrycie.toFixed(2)} ${t.item.id} | ${t.item.miejsce.slice(0, 90)}`),
);
