// Publiczne API funkcji „kontrola jakości uzasadnienia” (Maks, zadanie #18). Vlad osadza komponent
// w kroku „Decyzja i wynik” kreatora (src/features/ocena/krok-decyzja.tsx), np. nad kartą „Uzasadnienie i wnioski”:
//   <KontrolaJakosci ocena={ocena} />
export { KontrolaJakosci, type KontrolaJakosciProps } from "./components/kontrola-jakosci";
export type { PoleUwagi, TypUwagi, UwagaJakosci, WynikKontroli } from "./typy";
