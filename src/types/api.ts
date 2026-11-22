/**
 * KONTRAKT API (body żądań walidujemy zod-em w route.ts; tu są kształty wymieniane między funkcjami).
 * Zmienia tylko Vlad – prośba przez „ZMIANA WSPÓLNA:”.
 *
 * Zasada minimalizacji danych: do żadnego endpointu AI nie wysyłamy imion i nazwisk.
 */
import type { Arkusz, KompetencjaId, PoziomId, RodzajOceny } from "./ocena";

// ── POST /api/asystent – asystent formalny (Maks) ───────────────────────────
export interface AsystentZapytanie {
  pytanie: string;
  /** Ostatnie wiadomości rozmowy (krótko – limity darmowych modeli). */
  historia?: { role: "user" | "assistant"; content: string }[];
  /** Kontekst ścieżki, w której użytkownik jest (opcjonalnie). */
  rodzaj?: RodzajOceny;
}

export interface ZrodloOdpowiedzi {
  /** Np. „Rozporządzenie o ocenach okresowych (Dz.U. 2016 poz. 470)”. */
  dokument: string;
  /** Miejsce w dokumencie, np. „§ 11 ust. 1” albo „s. 14”. */
  miejsce?: string;
  /** Krótki cytat, na którym oparto odpowiedź. */
  fragment: string;
}

export interface AsystentOdpowiedz {
  odpowiedz: string;
  zrodla: ZrodloOdpowiedzi[];
  /** true → w bazie wiedzy brak informacji; odpowiedź mówi to wprost zamiast zgadywać. */
  brakInformacji: boolean;
}

// ── POST /api/osp – analiza opisu stanowiska pracy (Dima) ───────────────────
export interface OspZapytanie {
  /** Tekst opisu stanowiska (bez danych osobowych). */
  tekst: string;
}

export interface OspSugestia {
  /** Na podstawie liczby podległych pracowników w OSP. */
  sugerowanyArkusz: Exclude<Arkusz, "A">;
  /** Max 3 kryteria dodatkowe (spoza obowiązkowych dla arkusza). */
  kryteriaDodatkowe: { kompetencjaId: KompetencjaId; uzasadnienie: string }[];
  /** Wskaźniki najistotniejsze dla zadań na stanowisku. */
  wskazniki: { wskaznikId: string; uzasadnienie: string }[];
}

// ── POST /api/rozmowa – asystent rozmowy (Dima) ─────────────────────────────
export interface RozmowaZapytanie {
  rodzaj: RodzajOceny;
  stanowisko: string;
  kryteria: {
    kompetencjaId: KompetencjaId;
    /** Sugerowany lub wybrany poziom (null = brak podstaw). */
    poziom: PoziomId | null;
    /** Przykłady zachowań zapisane przez przełożonego. */
    przyklady: string[];
  }[];
}

export interface RozmowaPlan {
  /** Pytania do zadania pracownikowi. */
  pytania: string[];
  /** Kwestie wymagające omówienia (np. rozbieżności, brak podstaw do oceny). */
  tematy: string[];
  /** Uporządkowane argumenty uzasadniające ocenę – per kryterium. */
  argumenty: { kompetencjaId: KompetencjaId; argumenty: string[] }[];
  /** Propozycje do wniosków rozwojowych (IPRZ). */
  rozwoj: string[];
}
