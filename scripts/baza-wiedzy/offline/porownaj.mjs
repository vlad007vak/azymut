// Porównanie dwóch zrzutów zestaw.mjs: zmiany decyzji, pokrycia i kontekstu (fragmenty dodane / usunięte).
// Użycie: node scripts/baza-wiedzy/offline/porownaj.mjs przed.json po.json
import { readFileSync } from "node:fs";
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, "utf8")));
let bez = 0;
for (const nr of Object.keys(a)) {
  const x = a[nr], y = b[nr];
  const dodane = y.ids.filter((i) => !x.ids.includes(i));
  const usuniete = x.ids.filter((i) => !y.ids.includes(i));
  const kolejnosc = !dodane.length && !usuniete.length && x.ids.join() !== y.ids.join();
  if (x.decyzja === y.decyzja && x.pokrycie === y.pokrycie && !dodane.length && !usuniete.length && !kolejnosc) { bez++; continue; }
  console.log(`${nr}: ${x.decyzja} ${x.pokrycie} → ${y.decyzja} ${y.pokrycie}` +
    (dodane.length ? ` | +${dodane.join(" +")}` : "") + (usuniete.length ? ` | -${usuniete.join(" -")}` : "") +
    (kolejnosc ? " | tylko kolejność" : ""));
}
console.log(`bez zmian: ${bez}/${Object.keys(a).length}`);
