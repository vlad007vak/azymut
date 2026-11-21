/** Opis ról demonstracyjnych: kto to jest i co może w prototypie. Macierz docelowa: `docs/ROLE.md`. */
import { PRZELOZONY_DEMO } from "@/data/demo";
import type { Osoba } from "@/types/ocena";

import type { RolaId } from "./rola";

export type OpisRoli = {
  id: RolaId;
  /** Pełna nazwa, np. na karcie wyboru. */
  nazwa: string;
  /** Krótka nazwa do nagłówka. */
  nazwaKrotka: string;
  /** Do przycisku „Wejdź jako …”. */
  kto: string;
  /** Osoba demonstracyjna (jeśli rola ją ma). */
  osoba: Osoba | null;
  opis: string;
  uprawnienia: string[];
  ograniczenia: string[];
  /** Strona, na którą trafia się po wyborze roli. */
  start: string;
};

export const ROLE: readonly OpisRoli[] = [
  {
    id: "przelozony",
    nazwa: "Przełożony (oceniający)",
    nazwaKrotka: "Przełożony",
    kto: "przełożony",
    osoba: PRZELOZONY_DEMO,
    opis: "Prowadzi ocenę swoich pracowników krok po kroku – od przygotowania do dokumentu.",
    uprawnienia: [
      "Prowadzi pierwszą ocenę i ocenę okresową swoich pracowników",
      "Wybiera zachowania pracownika – system sugeruje poziom, decyzję podejmuje przełożony",
      "Przygotowuje rozmowę oceniającą i pobiera arkusz oceny",
      "Korzysta z asystenta formalnego (odpowiedzi ze źródłami)",
    ],
    ograniczenia: ["Nie ma dostępu do panelu HR"],
    start: "/",
  },
  {
    id: "hr",
    nazwa: "HR / administrator procesu",
    nazwaKrotka: "HR",
    kto: "HR",
    osoba: null,
    opis: "Pilnuje przebiegu ocen w całym urzędzie: etapów, terminów i przypomnień.",
    uprawnienia: [
      "Widzi wszystkie procesy ocen: etap, oceniającego i termin",
      "Zakłada nowe procesy oceny",
      "Wysyła przypomnienia do oceniających (w prototypie symulacja)",
      "Korzysta z asystenta formalnego",
    ],
    ograniczenia: ["Nie wystawia ocen – decyzję podejmuje przełożony"],
    start: "/hr",
  },
];

export function opisRoli(id: RolaId): OpisRoli {
  const opis = ROLE.find((r) => r.id === id);
  if (!opis) throw new Error(`Nieznana rola: ${id}`);
  return opis;
}

export function imieINazwisko(osoba: Osoba): string {
  return `${osoba.imie} ${osoba.nazwisko}`;
}
