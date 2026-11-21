import type { KompetencjaId } from "@/types/ocena";

/** Rodzaje uwag kontroli jakości uzasadnienia (zadanie #18). */
export type TypUwagi = "ogolnik" | "ocena-osoby" | "niespojnosc" | "brak-przykladu" | "ryzyko-stronniczosci";

export const TYPY_UWAG: TypUwagi[] = ["brak-przykladu", "niespojnosc", "ogolnik", "ocena-osoby", "ryzyko-stronniczosci"];

/** Gdzie w ocenie jest fragment, którego dotyczy uwaga. */
export type PoleUwagi = "przyklad" | "uzasadnienie" | "wnioski";

export interface UwagaJakosci {
  typ: TypUwagi;
  /** Kryterium, którego dotyczy uwaga (brak → uzasadnienie / wnioski ogólnie). */
  kompetencjaId?: KompetencjaId;
  /** Dosłowny fragment tekstu przełożonego – sprawdzony na serwerze. */
  cytat?: string;
  /** Co doprecyzować – podpowiedź, nie ocena. */
  sugestia: string;
  pole?: PoleUwagi;
  /** "regula" = sprawdzenie automatyczne bez AI, "ai" = uwaga modelu z potwierdzonym cytatem. */
  zrodlo: "regula" | "ai";
}

/** Odpowiedź POST /api/jakosc. */
export interface WynikKontroli {
  uwagi: UwagaJakosci[];
  podsumowanie: string;
  /** true → AI było niedostępne, pokazujemy tylko sprawdzenia automatyczne. */
  aiNiedostepne: boolean;
  /** true → w tekście wykryto i usunięto imiona / nazwiska przed wysłaniem do AI. */
  zanonimizowano: boolean;
  /** Dostawca AI, który odpowiedział. */
  dostawca?: string;
}
