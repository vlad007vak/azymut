/**
 * Uprawnienia do treści oceny – JEDNO miejsce dla kreatora oceny i asystenta rozmowy.
 *
 * Prototyp: rola demonstracyjna z cookie, sprawdzana w przeglądarce – w interfejsie (pola zablokowane)
 * i w funkcjach zapisu (zmiana odrzucana), więc bezpośredni link do oceny nie otwiera edycji.
 * To NIE jest autoryzacja serwerowa: oceny leżą w localStorage. Przed wdrożeniem uprawnienia sprawdza
 * serwer po zalogowaniu przez system urzędu (docs/ROLE.md → „Co trzeba zrobić przed wdrożeniem”).
 */
import type { Ocena, Osoba } from "@/types/ocena";

export type RolaDemo = "przelozony" | "hr";

export interface UprawnieniaOceny {
  /** Zmiana treści oceny: kryteria, zachowania, przykłady, poziomy, notatki, wynik i etapy kreatora. */
  edycja: boolean;
  /** Dlaczego edycja jest zablokowana – tekst dla użytkownika. */
  powod?: string;
}

export function czyTaSamaOsoba(a: Osoba, b: Osoba): boolean {
  return a.imie === b.imie && a.nazwisko === b.nazwisko;
}

/**
 * - HR / administrator procesu: tylko podgląd treści oceny (etapy, terminy, procesy i przypomnienia – w Panelu HR);
 * - przełożony: edytuje tylko oceny, w których jest oceniającym;
 * - bez wybranej roli: kreator działa jak dla przełożonego demo – jury wchodzi w scenariusz bez logowania.
 */
export function uprawnieniaDoOceny(rola: RolaDemo | null, ocena: Ocena, przelozony: Osoba): UprawnieniaOceny {
  if (rola === "hr") {
    return {
      edycja: false,
      powod:
        "Rola „HR / administrator procesu” nie wystawia ocen – możesz przeglądać etap, terminy i treść oceny. Zmiany wprowadza oceniający przełożony.",
    };
  }
  if (!czyTaSamaOsoba(ocena.oceniajacy, przelozony)) {
    return {
      edycja: false,
      powod: `Ocenę prowadzi ${ocena.oceniajacy.imie} ${ocena.oceniajacy.nazwisko} – zmiany może wprowadzać tylko oceniający przełożony.`,
    };
  }
  return { edycja: true };
}
