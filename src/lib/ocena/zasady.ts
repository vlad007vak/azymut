/**
 * Zasady oceny z rozporządzeń – czyste funkcje, bez UI i bez AI.
 * Okresowa: rozporządzenie PRM z 4.04.2016 (Dz.U. 2016 poz. 470), § 3, § 4, § 5 ust. 2, § 11.
 * Pierwsza: rozporządzenie PRM z 23.07.2015 (Dz.U. 2015 poz. 1144), § 7, § 9, § 10.
 */
import type {
  Arkusz,
  DanePierwszejOceny,
  EtapOceny,
  KompetencjaId,
  Obserwacja,
  PoziomId,
  WynikOceny,
} from "@/types/ocena";

import { poziom } from "./model";

// ── Kryteria ─────────────────────────────────────────────────────────────────

/** Kryteria obowiązkowe dla arkusza (§ 4 ust. 1–3, kolejność jak w arkuszach). */
export const KRYTERIA_OBOWIAZKOWE: Record<Arkusz, KompetencjaId[]> = {
  A: [
    "zarzadzanie-ludzmi",
    "podejmowanie-decyzji",
    "organizacja-pracy",
    "wspolpraca",
    "komunikacja",
    "zarzadzanie-strategiczne",
  ],
  B: ["zarzadzanie-ludzmi", "podejmowanie-decyzji", "organizacja-pracy", "wspolpraca", "komunikacja"],
  C: ["wykorzystywanie-wiedzy", "rzetelnosc", "organizacja-pracy", "wspolpraca", "komunikacja"],
};

/** § 5 ust. 2: nie więcej niż 3 kryteria dodatkowe. */
export const MAX_KRYTERIOW_DODATKOWYCH = 3;

/** Elementy pierwszej oceny – kolejność jak w arkuszu pierwszej oceny. */
export const ELEMENTY_PIERWSZEJ_OCENY: KompetencjaId[] = [
  "rzetelnosc",
  "wykorzystywanie-wiedzy",
  "organizacja-pracy",
  "komunikacja",
  "wspolpraca",
];

/** Arkusz wynikający ze stanowiska (§ 3): kierowanie pracownikami → B, w pozostałych przypadkach C. */
export function arkuszDlaStanowiska(kierujeZespolem: boolean): Exclude<Arkusz, "A"> {
  return kierujeZespolem ? "B" : "C";
}

// ── Sugestia poziomu z obserwacji wskaźników ─────────────────────────────────

/** Przedziały średniej punktów → poziom (§ 11 ust. 1 pkt 2). */
export function poziomZeSredniej(srednia: number): PoziomId {
  if (srednia <= 2) return 1;
  if (srednia <= 4) return 2;
  if (srednia <= 6) return 3;
  if (srednia <= 8) return 4;
  return 5;
}

export interface Sugestia {
  /** null = żaden wskaźnik nie ma obserwacji (brak podstaw do oceny). */
  poziom: PoziomId | null;
  /** Średnia punktów z ocenionych wskaźników (1–9). */
  srednia: number | null;
  ocenione: number;
  brakPodstaw: number;
}

/**
 * Sugerowany poziom kompetencji z wybranych zachowań.
 * Potwierdzone przez mentorkę MC (21.11.2026): wskaźniki mają równe wagi, sugerowany poziom to średnia
 * z ocen wskaźników. Każde wybrane zachowanie zamieniamy na punkty z tej samej skali co oceny cząstkowe
 * (1/3/5/7/9), liczymy średnią z wskaźników z obserwacją i stosujemy przedziały z § 11 ust. 1 pkt 2.
 * „Brak podstaw do oceny” nie wchodzi do średniej.
 * To tylko podpowiedź – ostateczny poziom zawsze wybiera przełożony.
 */
export function sugerowanyPoziom(obserwacje: Obserwacja[]): Sugestia {
  const ocenione = obserwacje.filter((o): o is Obserwacja & { poziom: PoziomId } => o.poziom !== null);
  const brakPodstaw = obserwacje.length - ocenione.length;
  if (ocenione.length === 0) return { poziom: null, srednia: null, ocenione: 0, brakPodstaw };
  const srednia = ocenione.reduce((s, o) => s + poziom(o.poziom).punkty, 0) / ocenione.length;
  return { poziom: poziomZeSredniej(srednia), srednia, ocenione: ocenione.length, brakPodstaw };
}

/**
 * Pierwsza ocena ma skalę 3 / 5 / 7 pkt (§ 9 ust. 1) = poziomy 2 / 3 / 4 modelu.
 * Potwierdzone przez mentorkę MC (21.11.2026): sugestię 1 traktujemy jak 2 (3 pkt), a 5 jak 4 (7 pkt);
 * „na poziomie oczekiwań” = 5 pkt.
 */
export function doSkaliPierwszejOceny(p: PoziomId): 2 | 3 | 4 {
  if (p <= 2) return 2;
  if (p >= 4) return 4;
  return 3;
}

// ── Wynik oceny okresowej (§ 11 ust. 1) ──────────────────────────────────────

export interface WynikOkresowej {
  srednia: number;
  poziomOgolny: PoziomId;
  wynik: WynikOceny;
  /** Powody oceny negatywnej (puste przy pozytywnej). */
  powody: string[];
  /** Uzasadnienie jest obowiązkowe przy ocenie negatywnej (§ 11 ust. 3). */
  uzasadnienieWymagane: boolean;
}

export function wynikOkresowej(oceny: PoziomId[]): WynikOkresowej {
  if (oceny.length === 0) throw new Error("Brak ocen cząstkowych");
  const srednia = oceny.reduce((s, p) => s + poziom(p).punkty, 0) / oceny.length;
  const poziomOgolny = poziomZeSredniej(srednia);
  const powody: string[] = [];
  if (poziomOgolny <= 2) {
    powody.push(`Ogólny poziom spełniania kryteriów: „${poziom(poziomOgolny).nazwa.toLowerCase()}”.`);
  }
  if (oceny.includes(1)) {
    powody.push("Co najmniej jedna ocena cząstkowa na poziomie „znacznie poniżej oczekiwań”.");
  }
  const wynik: WynikOceny = powody.length === 0 ? "pozytywna" : "negatywna";
  return { srednia, poziomOgolny, wynik, powody, uzasadnienieWymagane: wynik === "negatywna" };
}

// ── Wynik pierwszej oceny (§ 7 pkt 3, § 10) ──────────────────────────────────

export interface WynikPierwszej {
  /** Ocena łączna = średnia arytmetyczna ocen cząstkowych (3/5/7 pkt). */
  ocenaLaczna: number;
  wynik: WynikOceny;
  /** Niespełnione warunki oceny pozytywnej. */
  powody: string[];
  uzasadnienieWymagane: boolean;
}

export function wynikPierwszej(oceny: (2 | 3 | 4)[], dane: DanePierwszejOceny): WynikPierwszej {
  if (oceny.length === 0) throw new Error("Brak ocen cząstkowych");
  const pkt = oceny.map((p) => poziom(p).punkty);
  const ocenaLaczna = pkt.reduce((s, x) => s + x, 0) / pkt.length;
  const powody: string[] = [];
  if (dane.egzaminSluzbyPrzygotowawczej === "nie") {
    powody.push("Oceniany nie zaliczył egzaminu ze służby przygotowawczej.");
  }
  if (dane.sprawozdanieWTerminie === false) {
    powody.push("Sprawozdanie nie zostało złożone w wyznaczonym terminie.");
  }
  if (pkt.filter((x) => x === 3).length > 1) {
    powody.push("Więcej niż jedna ocena cząstkowa w wysokości 3 punktów.");
  }
  if (ocenaLaczna < 5) {
    powody.push("Ocena łączna niższa niż 5 punktów.");
  }
  const wynik: WynikOceny = powody.length === 0 ? "pozytywna" : "negatywna";
  return { ocenaLaczna, wynik, powody, uzasadnienieWymagane: wynik === "negatywna" };
}

// ── Etapy (etykiety do UI) ───────────────────────────────────────────────────

export const ETAPY: { id: EtapOceny; nazwa: string }[] = [
  { id: "zaplanowana", nazwa: "Zaplanowana" },
  { id: "kryteria", nazwa: "Rozmowa wstępna i kryteria" },
  { id: "obserwacje", nazwa: "Ocena wskaźników" },
  { id: "rozmowa", nazwa: "Rozmowa oceniająca" },
  { id: "sporzadzona", nazwa: "Ocena sporządzona" },
  { id: "zakonczona", nazwa: "Zakończona" },
];

export function nazwaEtapu(id: EtapOceny): string {
  return ETAPY.find((e) => e.id === id)?.nazwa ?? id;
}
