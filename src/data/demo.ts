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
  {
    id: "p5",
    imie: "Paweł",
    nazwisko: "Grabowski",
    stanowisko: "specjalista",
    komorka: "Departament Cyberbezpieczeństwa, Wydział Zarządzania Kryzysowego, Spraw Obronnych i Cyberbezpieczeństwa",
    kierujeZespolem: false,
    urzednikSC: false,
    dataZatrudnienia: "2026-09-01",
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
    etap: "obserwacje",
    okres: { od: "2024-12-01", do: "2026-11-30" },
    terminOceny: "2026-12-15",
    kryteria: [
      {
        kompetencjaId: "wykorzystywanie-wiedzy",
        dodatkowe: false,
        wskazniki: ["wykorzystywanie-wiedzy-1", "wykorzystywanie-wiedzy-3"],
        obserwacje: {
          "wykorzystywanie-wiedzy-1": {
            poziom: 4,
            przyklad:
              "Przy opiniowaniu projektu programu wsparcia innowacji połączyła wiedzę o pomocy publicznej i o regulacjach AI; uzasadniła przyjętą metodę w notatce dla dyrektora.",
          },
          "wykorzystywanie-wiedzy-3": {
            poziom: 3,
            przyklad: "Do analizy rynku korzystała z dopuszczonych źródeł i sprawdzała aktualność danych przed przekazaniem.",
          },
        },
      },
      {
        kompetencjaId: "rzetelnosc",
        dodatkowe: false,
        wskazniki: ["rzetelnosc-1", "rzetelnosc-2"],
        obserwacje: {
          "rzetelnosc-1": {
            poziom: 3,
            przyklad: "Pisma do partnerów przygotowywała zgodnie z instrukcją kancelaryjną; przed wysyłką weryfikowała załączniki.",
          },
          "rzetelnosc-2": {
            poziom: 2,
            przyklad:
              "Dwukrotnie (marzec i wrzesień 2026) zgłosiła ryzyko opóźnienia stanowiska do konsultacji dopiero w dniu terminu.",
          },
        },
      },
      {
        kompetencjaId: "organizacja-pracy",
        dodatkowe: false,
        wskazniki: ["organizacja-pracy-1", "organizacja-pracy-2", "organizacja-pracy-4"],
        obserwacje: {
          "organizacja-pracy-1": {
            poziom: 3,
            przyklad: "Dla naboru wniosków przygotowała harmonogram z etapami i terminami.",
          },
          "organizacja-pracy-2": { poziom: 3 },
          "organizacja-pracy-4": { poziom: null },
        },
      },
      {
        kompetencjaId: "wspolpraca",
        dodatkowe: false,
        wskazniki: ["wspolpraca-2", "wspolpraca-6"],
        obserwacje: {
          "wspolpraca-2": {
            poziom: 4,
            przyklad: "Prowadziła wspólny rejestr ustaleń z departamentem prawnym, dzięki czemu nie powtarzano uzgodnień.",
          },
          "wspolpraca-6": {
            poziom: 4,
            przyklad: "Przygotowała dla zespołu krótkie szkolenie z nowych wytycznych dotyczących AI.",
          },
        },
      },
      {
        kompetencjaId: "komunikacja",
        dodatkowe: false,
        wskazniki: ["komunikacja-2", "komunikacja-3"],
        obserwacje: {
          "komunikacja-2": { poziom: 3 },
          "komunikacja-3": {
            poziom: 3,
            przyklad: "Notatki dla kierownictwa mają cel, kluczowe informacje i proponowane dalsze kroki.",
          },
        },
      },
      {
        kompetencjaId: "myslenie-analityczne",
        dodatkowe: true,
        wskazniki: ["myslenie-analityczne-2", "myslenie-analityczne-3"],
        obserwacje: {
          "myslenie-analityczne-2": {
            poziom: 4,
            przyklad: "W analizie zgłoszeń do programu wskazała zależność między wielkością firmy a odsetkiem odrzuconych wniosków.",
          },
          "myslenie-analityczne-3": { poziom: 3 },
        },
      },
    ],
    daty: { rozmowaWstepna: "2024-12-05" },
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
    etap: "obserwacje",
    okres: { od: "2026-06-01", do: "2026-11-30" },
    terminOceny: "2026-12-10",
    kryteria: [
      {
        kompetencjaId: "rzetelnosc",
        dodatkowe: false,
        wskazniki: ["rzetelnosc-1", "rzetelnosc-2"],
        obserwacje: {
          "rzetelnosc-1": {
            poziom: 3,
            przyklad: "Przygotowując zestawienia wniosków do programu, sprawdzała kompletność danych przed przekazaniem.",
          },
          "rzetelnosc-2": { poziom: 3 },
        },
      },
      {
        kompetencjaId: "wykorzystywanie-wiedzy",
        dodatkowe: false,
        wskazniki: ["wykorzystywanie-wiedzy-1", "wykorzystywanie-wiedzy-2"],
        obserwacje: {
          "wykorzystywanie-wiedzy-1": {
            poziom: 2,
            przyklad: "Przy pierwszej analizie ofert potrzebowała wskazania właściwej metody porównania.",
          },
          "wykorzystywanie-wiedzy-2": {
            poziom: 4,
            przyklad: "Z własnej inicjatywy ukończyła kurs z zamówień publicznych i zastosowała go przy kolejnym naborze.",
          },
        },
      },
      {
        kompetencjaId: "organizacja-pracy",
        dodatkowe: false,
        wskazniki: ["organizacja-pracy-1", "organizacja-pracy-2"],
        obserwacje: {
          "organizacja-pracy-1": { poziom: 3 },
          "organizacja-pracy-2": {
            poziom: 3,
            przyklad: "W tygodniu zamknięcia naboru ustaliła kolejność zadań według terminów i wpływu na innych.",
          },
        },
      },
      {
        kompetencjaId: "komunikacja",
        dodatkowe: false,
        wskazniki: ["komunikacja-1", "komunikacja-3"],
        obserwacje: {
          "komunikacja-1": { poziom: 3 },
          "komunikacja-3": { poziom: null },
        },
      },
      {
        kompetencjaId: "wspolpraca",
        dodatkowe: false,
        wskazniki: ["wspolpraca-1", "wspolpraca-2"],
        obserwacje: {
          "wspolpraca-1": {
            poziom: 4,
            przyklad: "Zgłosiła się do zespołu przygotowującego konferencję i przejęła kontakt z prelegentami.",
          },
          "wspolpraca-2": { poziom: 3 },
        },
      },
    ],
    pierwsza: {
      egzaminSluzbyPrzygotowawczej: "tak",
      sprawozdanieWTerminie: true,
      terminSprawozdania: "2026-11-15",
    },
    daty: { rozmowaWstepna: "2026-06-05" },
    utworzono: T,
    zmieniono: T,
  },
  {
    id: "o5",
    rodzaj: "pierwsza",
    pracownikId: "p5",
    oceniajacy: PRZELOZONY_DEMO,
    etap: "kryteria",
    okres: { od: "2026-09-01", do: "2027-02-28" },
    terminOceny: "2027-03-10",
    kryteria: [],
    pierwsza: {
      egzaminSluzbyPrzygotowawczej: "tak",
      sprawozdanieWTerminie: null,
      terminSprawozdania: "2027-02-20",
    },
    daty: { rozmowaWstepna: "2026-09-04" },
    utworzono: T,
    zmieniono: T,
  },
];
