/**
 * Szablony przypomnień HR – zależne od etapu procesu.
 * Wysyłka jest symulowana (wpis do `przypomnienia[]`); docelowo e-mail / EZD.
 * Treść powstaje lokalnie w przeglądarce – nic nie trafia do AI.
 */
import { nazwaEtapu } from "@/lib/ocena/zasady";
import type { EtapOceny, Ocena, Pracownik } from "@/types/ocena";

import { formatujDate, opisTerminu } from "./terminy";

/** Czego dotyczy przypomnienie na danym etapie (zakończony proces nie wymaga przypomnień). */
const CZYNNOSC: Record<Exclude<EtapOceny, "zakonczona">, (o: Ocena) => string> = {
  zaplanowana: (o) =>
    o.rodzaj === "okresowa"
      ? "przeprowadzenie rozmowy wstępnej i ustalenie kryteriów oceny"
      : "przeprowadzenie rozmowy wstępnej i wyznaczenie terminu złożenia sprawozdania",
  kryteria: (o) =>
    o.rodzaj === "okresowa"
      ? "zakończenie ustalania kryteriów oceny (obowiązkowych i dodatkowych)"
      : o.pierwsza?.terminSprawozdania
        ? `dopilnowanie złożenia sprawozdania (termin: ${formatujDate(o.pierwsza.terminSprawozdania)})`
        : "wyznaczenie terminu złożenia sprawozdania",
  obserwacje: () => "uzupełnienie oceny wskaźników behawioralnych na podstawie obserwacji z okresu oceny",
  rozmowa: () => "przeprowadzenie rozmowy oceniającej z pracownikiem",
  sporzadzona: () => "zapoznanie pracownika ze sporządzoną oceną",
};

export function moznaPrzypomniec(ocena: Ocena): boolean {
  return ocena.etap !== "zakonczona";
}

/** Domyślna treść przypomnienia (użytkownik może ją zmienić przed wysłaniem). */
export function szablonPrzypomnienia(ocena: Ocena, prac: Pracownik | undefined, dzis: string): string {
  if (ocena.etap === "zakonczona") return "";
  const kogo = prac ? `${prac.imie} ${prac.nazwisko} (${prac.stanowisko})` : "pracownika";
  const rodzaj = ocena.rodzaj === "okresowa" ? "oceny okresowej" : "pierwszej oceny";
  return [
    `Dzień dobry,`,
    ``,
    `przypominamy o procesie ${rodzaj}: ${kogo}.`,
    `Obecny etap: „${nazwaEtapu(ocena.etap)}”.`,
    `Do zrobienia: ${CZYNNOSC[ocena.etap](ocena)}.`,
    `Termin oceny: ${formatujDate(ocena.terminOceny)} – ${opisTerminu(ocena, dzis).toLowerCase()}.`,
    ``,
    `Z poważaniem`,
    `Komórka kadrowa (HR)`,
  ].join("\n");
}
