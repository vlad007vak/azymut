/**
 * KONTRAKT: model kompetencji i proces oceny (pierwsza ocena + ocena okresowa).
 * Zmienia tylko Vlad / lead AI. Potrzebujesz zmiany → komentarz „ZMIANA WSPÓLNA:” w swoim zadaniu.
 *
 * Źródła zasad: rozporządzenie PRM z 4.04.2016 (Dz.U. 2016 poz. 470) – ocena okresowa,
 * rozporządzenie PRM z 23.07.2015 (Dz.U. 2015 poz. 1144) – pierwsza ocena,
 * model kompetencji od organizatora (src/data/model-kompetencji.json).
 */
import type { Id } from "./index";

// ── Model kompetencji ────────────────────────────────────────────────────────

/** 1 = znacznie poniżej, 2 = poniżej, 3 = na poziomie, 4 = powyżej, 5 = znacznie powyżej oczekiwań. */
export type PoziomId = 1 | 2 | 3 | 4 | 5;

export type KompetencjaId =
  | "rzetelnosc"
  | "komunikacja"
  | "wykorzystywanie-wiedzy"
  | "organizacja-pracy"
  | "kreatywnosc"
  | "wspolpraca"
  | "myslenie-analityczne"
  | "negocjowanie"
  | "wystapienia-publiczne"
  | "orientacja-na-klienta"
  | "sytuacje-kryzysowe"
  | "zarzadzanie-strategiczne"
  | "zarzadzanie-ludzmi"
  | "podejmowanie-decyzji";

export interface Poziom {
  id: PoziomId;
  nazwa: string;
  /** Punkty wg § 11 ust. 1 pkt 1 rozporządzenia o ocenach okresowych. */
  punkty: 1 | 3 | 5 | 7 | 9;
}

export interface Wskaznik {
  /** np. "komunikacja-2" */
  id: string;
  /** Treść wskaźnika behawioralnego. */
  opis: string;
  /** Opis zachowania dla każdego z 5 poziomów (klucz "1"…"5" = PoziomId). */
  zachowania: Record<"1" | "2" | "3" | "4" | "5", string>;
}

export interface Kompetencja {
  id: KompetencjaId;
  lp: number;
  nazwa: string;
  wskazniki: Wskaznik[];
}

export interface ModelKompetencji {
  zrodlo: string;
  poziomy: Poziom[];
  /** Wskazówki organizatora: dobór wskaźników, przykłady, brak podstaw do oceny. */
  wskazowki: string[];
  kompetencje: Kompetencja[];
}

// ── Proces oceny ─────────────────────────────────────────────────────────────

export type RodzajOceny = "pierwsza" | "okresowa";

/**
 * Arkusz oceny okresowej (§ 3 rozporządzenia 2016):
 * A – kierownik urzędu (poza zakresem prototypu), B – bezpośrednio kieruje pracownikami, C – pozostali.
 */
export type Arkusz = "A" | "B" | "C";

export type WynikOceny = "pozytywna" | "negatywna";

/**
 * Etapy procesu (kolejność zgodna z rozporządzeniami: rozmowa oceniająca odbywa się
 * PRZED sporządzeniem oceny na piśmie, a ocena uwzględnia wnioski z rozmowy).
 */
export type EtapOceny =
  | "zaplanowana" // HR utworzył proces i termin
  | "kryteria" // rozmowa wstępna: kryteria (okresowa) / termin sprawozdania (pierwsza)
  | "obserwacje" // przełożony ocenia wskaźniki, system sugeruje poziomy
  | "rozmowa" // rozmowa oceniająca
  | "sporzadzona" // przełożony wybrał ostateczne poziomy, wynik, uzasadnienie
  | "zakonczona"; // pracownik zapoznał się z oceną

export interface Osoba {
  imie: string;
  nazwisko: string;
  stanowisko: string;
  komorka: string;
}

/** Dane fikcyjne (demo). Do AI NIGDY nie wysyłamy imienia ani nazwiska – tylko stanowisko i obserwacje. */
export interface Pracownik extends Osoba {
  id: Id;
  /** true → arkusz B (bezpośrednio kieruje pracownikami). */
  kierujeZespolem: boolean;
  /** Urzędnik SC (mianowany) vs pracownik SC – wpływa na część III arkusza. */
  urzednikSC: boolean;
  /** ISO yyyy-mm-dd */
  dataZatrudnienia: string;
}

export interface Obserwacja {
  /** Wybrane zachowanie (poziom 1–5) albo null = brak podstaw do oceny wskaźnika. */
  poziom: PoziomId | null;
  /** Konkretny przykład z okresu oceny: sytuacja – działanie – rezultat. */
  przyklad?: string;
}

export interface OcenaKryterium {
  kompetencjaId: KompetencjaId;
  /** true = kryterium dodatkowe wybrane przez oceniającego (max 3, tylko ocena okresowa). */
  dodatkowe: boolean;
  /** Wskaźniki dobrane do stanowiska (id wskaźników); domyślnie wszystkie. */
  wskazniki: string[];
  /** Klucz = id wskaźnika. */
  obserwacje: Record<string, Obserwacja>;
  /**
   * Ostateczny poziom – ZAWSZE wybiera przełożony (sugestia systemu jest tylko podpowiedzią).
   * Pierwsza ocena używa tylko 2 | 3 | 4 (3 / 5 / 7 pkt).
   */
  decyzja?: PoziomId;
}

export interface DanePierwszejOceny {
  egzaminSluzbyPrzygotowawczej: "tak" | "nie" | "nie-dotyczy";
  sprawozdanieWTerminie: boolean | null;
  /** ISO – termin złożenia sprawozdania wyznaczony w rozmowie wstępnej. */
  terminSprawozdania?: string;
}

export interface Ocena {
  id: Id;
  rodzaj: RodzajOceny;
  /** Tylko ocena okresowa. */
  arkusz?: Arkusz;
  pracownikId: Id;
  oceniajacy: Osoba;
  etap: EtapOceny;
  /** Okres podlegania ocenie (ISO). */
  okres: { od: string; do: string };
  /** Okresowa: termin sporządzenia oceny na piśmie. Pierwsza: koniec okresu na dokonanie oceny. */
  terminOceny: string;
  /** Kryteria obowiązkowe + dodatkowe (okresowa) albo 5 elementów oceny (pierwsza). */
  kryteria: OcenaKryterium[];
  pierwsza?: DanePierwszejOceny;
  daty: {
    rozmowaWstepna?: string;
    rozmowaOceniajaca?: string;
    sporzadzenie?: string;
    zapoznanie?: string;
  };
  wynik?: WynikOceny;
  uzasadnienie?: string;
  /** Okresowa: wnioski do IPRZ; pierwsza: wnioski dotyczące rozwoju zawodowego. */
  wnioskiRozwojowe?: string;
  /** Notatki przełożonego z przygotowania / przebiegu rozmowy. */
  notatkiRozmowy?: string;
  /** Przypomnienia wysłane przez HR (symulacja). */
  przypomnienia?: { data: string; tresc: string }[];
  utworzono: string;
  zmieniono: string;
}
