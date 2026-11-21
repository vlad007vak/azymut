import type { RodzajOceny } from "@/types/ocena";

/** Przykładowe pytania do kliknięcia – każde sprawdzone na bazie wiedzy (docs/test-asystenta.md). */
export const PRZYKLADY: Record<RodzajOceny, string[]> = {
  pierwsza: [
    "Kiedy przeprowadza się rozmowę wstępną z nowym pracownikiem?",
    "Jakie są warunki pozytywnej pierwszej oceny?",
    "Jaka jest skala ocen w pierwszej ocenie?",
    "Jaki okres obejmuje sprawozdanie nowego pracownika?",
  ],
  okresowa: [
    "Ile kryteriów dodatkowych można wybrać w ocenie okresowej?",
    "Jakie kryteria obowiązkowe ma arkusz C?",
    "Kiedy ocena okresowa jest negatywna?",
    "Jak pracownik może odwołać się od oceny okresowej?",
  ],
};

export function przykladyDla(rodzaj?: RodzajOceny): string[] {
  if (rodzaj) return PRZYKLADY[rodzaj];
  return [...PRZYKLADY.pierwsza.slice(0, 3), ...PRZYKLADY.okresowa.slice(0, 3)];
}
