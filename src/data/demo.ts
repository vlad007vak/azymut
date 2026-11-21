/**
 * FIKCYJNE dane demonstracyjne (osoby nie istnieją). Stanowiska i komórki – z przykładowych
 * opisów stanowisk pracy udostępnionych przez organizatora (Ministerstwo Cyfryzacji).
 */
import type { Ocena, Osoba, Pracownik } from "@/types/ocena";

export const PRZELOZONY_DEMO: Osoba = {
  imie: "Katarzyna",
  nazwisko: "Wiśniewska",
  stanowisko: "naczelnik wydziału",
  komorka: "Departament Rozwoju i Bezpieczeństwa Sztucznej Inteligencji, Wydział Wspierania Innowacyjności",
};

export const PRACOWNICY: Pracownik[] = [
  {
    id: "p1",
    imie: "Anna",
    nazwisko: "Kowalczyk",
    stanowisko: "radca",
    komorka: "Departament Rozwoju i Bezpieczeństwa Sztucznej Inteligencji, Wydział Wspierania Innowacyjności",
    kierujeZespolem: false,
    urzednikSC: true,
    dataZatrudnienia: "2021-03-01",
  },
  {
    id: "p2",
    imie: "Tomasz",
    nazwisko: "Zieliński",
    stanowisko: "starszy specjalista",
    komorka: "Departament Cyberbezpieczeństwa, Wydział Zarządzania Kryzysowego, Spraw Obronnych i Cyberbezpieczeństwa",
    kierujeZespolem: false,
    urzednikSC: false,
    dataZatrudnienia: "2022-09-15",
  },
  {
    id: "p3",
    imie: "Marek",
    nazwisko: "Nowicki",
    stanowisko: "naczelnik wydziału",
    komorka: "Departament Współpracy Międzynarodowej, Wydział Koordynacji Aktywności Międzynarodowych",
    kierujeZespolem: true,
    urzednikSC: true,
    dataZatrudnienia: "2019-01-02",
  },
  {
    id: "p4",
    imie: "Julia",
    nazwisko: "Mazur",
    stanowisko: "specjalista",
    komorka: "Departament Rozwoju i Bezpieczeństwa Sztucznej Inteligencji, Wydział Wspierania Innowacyjności",
    kierujeZespolem: false,
    urzednikSC: false,
    dataZatrudnienia: "2026-06-01",
  },
];

const T = "2026-11-21T10:00:00.000Z";

/** Procesy na różnych etapach – żeby panel HR miał co pokazać. */
export const OCENY_DEMO: Ocena[] = [
  {
    id: "o1",
    rodzaj: "okresowa",
    arkusz: "C",
    pracownikId: "p1",
    oceniajacy: PRZELOZONY_DEMO,
    etap: "kryteria",
    okres: { od: "2024-12-01", do: "2026-11-30" },
    terminOceny: "2026-12-15",
    kryteria: [],
    daty: {},
    utworzono: T,
    zmieniono: T,
  },
  {
    id: "o2",
    rodzaj: "okresowa",
    arkusz: "C",
    pracownikId: "p2",
    oceniajacy: PRZELOZONY_DEMO,
    etap: "zaplanowana",
    okres: { od: "2024-12-10", do: "2026-12-09" },
    terminOceny: "2026-12-20",
    kryteria: [],
    daty: {},
    utworzono: T,
    zmieniono: T,
  },
  {
    id: "o3",
    rodzaj: "okresowa",
    arkusz: "B",
    pracownikId: "p3",
    oceniajacy: PRZELOZONY_DEMO,
    etap: "zakonczona",
    okres: { od: "2023-11-01", do: "2025-10-31" },
    terminOceny: "2025-11-14",
    kryteria: [],
    daty: { sporzadzenie: "2025-11-12", zapoznanie: "2025-11-13" },
    wynik: "pozytywna",
    utworzono: T,
    zmieniono: T,
  },
  {
    id: "o4",
    rodzaj: "pierwsza",
    pracownikId: "p4",
    oceniajacy: PRZELOZONY_DEMO,
    etap: "kryteria",
    okres: { od: "2026-06-01", do: "2026-11-30" },
    terminOceny: "2026-12-10",
    kryteria: [],
    pierwsza: {
      egzaminSluzbyPrzygotowawczej: "tak",
      sprawozdanieWTerminie: null,
      terminSprawozdania: "2026-11-25",
    },
    daty: { rozmowaWstepna: "2026-06-05" },
    utworzono: T,
    zmieniono: T,
  },
];
