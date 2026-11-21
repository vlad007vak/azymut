/**
 * Format wymiany danych oceny: `azymut.ocena`, wersja 1.
 * Opis pól i zasady wersjonowania: docs/API.md → „Eksport oceny”; schemat: public/openapi.json → EksportOceny.
 *
 * Zasady formatu: brakujące wartości to `null` (pola są zawsze obecne), daty ISO 8601,
 * liczby punktów zaokrąglone do 2 miejsc po przecinku.
 */
import type { Arkusz, EtapOceny, KompetencjaId, PoziomId, RodzajOceny, WynikOceny } from "@/types/ocena";

export const FORMAT_EKSPORTU = "azymut.ocena";
export const WERSJA_EKSPORTU = 1;

export interface PoziomEksportu {
  poziom: PoziomId;
  nazwa: string;
  punkty: number;
}

export interface WskaznikEksportu {
  id: string;
  opis: string;
  /** Wybrane zachowanie (1–5) albo null = brak podstaw do oceny wskaźnika / brak obserwacji. */
  poziom: PoziomId | null;
  /** Opis wybranego zachowania z modelu kompetencji. */
  zachowanie: string | null;
  /** Przykład z okresu oceny zapisany przez przełożonego. */
  przyklad: string | null;
}

export interface KryteriumEksportu {
  kompetencja: { id: KompetencjaId; nazwa: string };
  /** true = kryterium dodatkowe (tylko ocena okresowa). */
  dodatkowe: boolean;
  /** Podpowiedź systemu wyliczona z wybranych zachowań – nie jest decyzją. */
  sugestiaSystemu: PoziomEksportu | null;
  /** Ostateczna ocena cząstkowa wybrana przez przełożonego (null = jeszcze nie wybrana). */
  ocenaCzastkowa: PoziomEksportu | null;
  wskazniki: WskaznikEksportu[];
}

export interface WynikEksportu {
  /** Ocena okresowa: średnia arytmetyczna ocen cząstkowych (1–9 pkt). */
  srednia: number | null;
  /** Pierwsza ocena: ocena łączna (3–7 pkt). */
  ocenaLaczna: number | null;
  /** Ocena okresowa: ogólny poziom spełniania kryteriów. */
  poziomOgolny: { poziom: PoziomId; nazwa: string } | null;
  wynik: WynikOceny;
  /** Powody oceny negatywnej (pusta lista przy pozytywnej). */
  powody: string[];
}

export interface OsobaEksportu {
  imie: string;
  nazwisko: string;
  stanowisko: string;
  komorka: string;
}

export interface EksportOceny {
  format: typeof FORMAT_EKSPORTU;
  wersja: typeof WERSJA_EKSPORTU;
  /** Data i godzina wygenerowania pliku (ISO 8601). */
  wygenerowano: string;
  zrodlo: { aplikacja: string; modelKompetencji: string };
  /** Identyfikator oceny w systemie źródłowym. */
  id: string;
  urzad: string;
  rodzaj: RodzajOceny;
  /** Ocena okresowa: arkusz B albo C; pierwsza ocena: null. */
  arkusz: Arkusz | null;
  etap: EtapOceny;
  okres: { od: string; do: string };
  terminOceny: string;
  oceniany: OsobaEksportu & { urzednikSC: boolean };
  oceniajacy: OsobaEksportu;
  kryteria: KryteriumEksportu[];
  /** Tylko pierwsza ocena – dodatkowe warunki oceny pozytywnej. */
  pierwsza: {
    egzaminSluzbyPrzygotowawczej: "tak" | "nie" | "nie-dotyczy";
    sprawozdanieWTerminie: boolean | null;
    terminSprawozdania: string | null;
  } | null;
  /** null, dopóki przełożony nie wybierze ocen cząstkowych dla wszystkich kryteriów. */
  wynik: WynikEksportu | null;
  uzasadnienie: string | null;
  wnioskiRozwojowe: string | null;
  daty: {
    rozmowaWstepna: string | null;
    rozmowaOceniajaca: string | null;
    sporzadzenie: string | null;
    zapoznanie: string | null;
  };
}
