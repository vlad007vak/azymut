/**
 * Publiczne API funkcji „Role demonstracyjne” (Andrey, zadanie #17). Inne foldery importują tylko stąd.
 * - `useRola()` – rola z cookie po stronie klienta: `{ rola, opis, gotowe }`
 * - `<RolaWNaglowku />` – do nagłówka: nazwa roli + „Zmień rolę” (bez roli: „Wybierz rolę”)
 * - `ROLE` – lista ról z opisem uprawnień
 * Ochrona tras: `src/proxy.ts`. Macierz uprawnień i plan wdrożenia: `docs/ROLE.md`.
 */
export { useRola, type StanRoli } from "./use-rola";
export { RolaWNaglowku } from "./rola-w-naglowku";
export { WyborRoli, WyborRoliSzkielet } from "./wybor-roli";
export { ROLE, opisRoli, type OpisRoli } from "./role";
export { ROLA_COOKIE, adresLogowania, czyMaDostep, type RolaId } from "./rola";
