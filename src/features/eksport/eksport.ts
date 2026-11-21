/**
 * Eksport oceny do formatu wymiany `azymut.ocena` (JSON) – czysta funkcja, bez UI.
 * Wynik liczymy WYŁĄCZNIE przez zasady z rozporządzeń (`src/lib/ocena/zasady.ts`).
 * Nie eksportujemy notatek z rozmowy ani przypomnień HR – to robocze dane przełożonego / HR.
 */
import { APP_CONFIG } from "@/config/app";
import { kompetencja, MODEL, poziom, wskaznik } from "@/lib/ocena/model";
import { pracownik as znajdzPracownika } from "@/lib/ocena/store";
import { doSkaliPierwszejOceny, sugerowanyPoziom, wynikOkresowej, wynikPierwszej } from "@/lib/ocena/zasady";
import type { Ocena, OcenaKryterium, Pracownik, PoziomId } from "@/types/ocena";

import {
  type EksportOceny,
  FORMAT_EKSPORTU,
  type KryteriumEksportu,
  type PoziomEksportu,
  WERSJA_EKSPORTU,
  type WynikEksportu,
} from "./typy";

export interface OpcjeEksportu {
  /** Nazwa urzędu na arkuszu; domyślnie `APP_CONFIG.urzad` (ten sam co na arkuszu w kroku „Dokument”). */
  urzad?: string;
  /** Dane ocenianego; domyślnie z magazynu ocen (po `ocena.pracownikId`). */
  pracownik?: Pracownik;
  /** Chwila wygenerowania (do testów); domyślnie teraz. */
  teraz?: Date;
}

export class BladEksportu extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BladEksportu";
  }
}

const zaokraglij = (x: number) => Math.round(x * 100) / 100;

function poziomEksportu(p: PoziomId): PoziomEksportu {
  const { id, nazwa, punkty } = poziom(p);
  return { poziom: id, nazwa, punkty };
}

function kryteriumEksportu(k: OcenaKryterium, o: Ocena): KryteriumEksportu {
  const sugestia = sugerowanyPoziom(k.wskazniki.map((w) => k.obserwacje[w]).filter((x) => x !== undefined));
  const sugerowany =
    sugestia.poziom === null ? null : o.rodzaj === "pierwsza" ? doSkaliPierwszejOceny(sugestia.poziom) : sugestia.poziom;
  return {
    kompetencja: { id: k.kompetencjaId, nazwa: kompetencja(k.kompetencjaId).nazwa },
    dodatkowe: k.dodatkowe,
    sugestiaSystemu: sugerowany === null ? null : poziomEksportu(sugerowany),
    ocenaCzastkowa: k.decyzja === undefined ? null : poziomEksportu(k.decyzja),
    wskazniki: k.wskazniki.map((id) => {
      const w = wskaznik(id);
      const obs = k.obserwacje[id];
      const p = obs?.poziom ?? null;
      return {
        id,
        opis: w?.opis ?? id,
        poziom: p,
        zachowanie: p !== null && w ? w.zachowania[String(p) as "1" | "2" | "3" | "4" | "5"] : null,
        przyklad: obs?.przyklad?.trim() || null,
      };
    }),
  };
}

/** Wynik wg rozporządzeń – null, dopóki brakuje którejś decyzji przełożonego. */
function wynikEksportu(o: Ocena): WynikEksportu | null {
  const decyzje = o.kryteria.map((k) => k.decyzja);
  const komplet = decyzje.length > 0 && decyzje.every((d) => d !== undefined);

  if (komplet && o.rodzaj === "okresowa") {
    const w = wynikOkresowej(decyzje as PoziomId[]);
    return {
      srednia: zaokraglij(w.srednia),
      ocenaLaczna: null,
      poziomOgolny: { poziom: w.poziomOgolny, nazwa: poziom(w.poziomOgolny).nazwa },
      wynik: w.wynik,
      powody: w.powody,
    };
  }
  if (komplet && o.rodzaj === "pierwsza" && o.pierwsza) {
    const w = wynikPierwszej(decyzje as (2 | 3 | 4)[], o.pierwsza);
    return { srednia: null, ocenaLaczna: zaokraglij(w.ocenaLaczna), poziomOgolny: null, wynik: w.wynik, powody: w.powody };
  }
  // Ocena zapisana bez ocen cząstkowych w systemie (np. archiwalna) – przekazujemy sam wynik.
  if (o.wynik) return { srednia: null, ocenaLaczna: null, poziomOgolny: null, wynik: o.wynik, powody: [] };
  return null;
}

const tekst = (s: string | undefined) => s?.trim() || null;

/** Buduje dokument wymiany `azymut.ocena` v1 dla jednej oceny. */
export function eksportujOcene(ocena: Ocena, opcje: OpcjeEksportu = {}): EksportOceny {
  const osoba = opcje.pracownik ?? znajdzPracownika(ocena.pracownikId);
  if (!osoba) throw new BladEksportu("Nie znaleziono danych ocenianego pracownika.");

  return {
    format: FORMAT_EKSPORTU,
    wersja: WERSJA_EKSPORTU,
    wygenerowano: (opcje.teraz ?? new Date()).toISOString(),
    zrodlo: { aplikacja: APP_CONFIG.name, modelKompetencji: MODEL.zrodlo },
    id: ocena.id,
    urzad: opcje.urzad ?? APP_CONFIG.urzad,
    rodzaj: ocena.rodzaj,
    arkusz: ocena.rodzaj === "okresowa" ? (ocena.arkusz ?? null) : null,
    etap: ocena.etap,
    okres: { od: ocena.okres.od, do: ocena.okres.do },
    terminOceny: ocena.terminOceny,
    oceniany: {
      imie: osoba.imie,
      nazwisko: osoba.nazwisko,
      stanowisko: osoba.stanowisko,
      komorka: osoba.komorka,
      urzednikSC: osoba.urzednikSC,
    },
    oceniajacy: {
      imie: ocena.oceniajacy.imie,
      nazwisko: ocena.oceniajacy.nazwisko,
      stanowisko: ocena.oceniajacy.stanowisko,
      komorka: ocena.oceniajacy.komorka,
    },
    kryteria: ocena.kryteria.map((k) => kryteriumEksportu(k, ocena)),
    pierwsza:
      ocena.rodzaj === "pierwsza" && ocena.pierwsza
        ? {
            egzaminSluzbyPrzygotowawczej: ocena.pierwsza.egzaminSluzbyPrzygotowawczej,
            sprawozdanieWTerminie: ocena.pierwsza.sprawozdanieWTerminie,
            terminSprawozdania: ocena.pierwsza.terminSprawozdania ?? null,
          }
        : null,
    wynik: wynikEksportu(ocena),
    uzasadnienie: tekst(ocena.uzasadnienie),
    wnioskiRozwojowe: tekst(ocena.wnioskiRozwojowe),
    daty: {
      rozmowaWstepna: ocena.daty.rozmowaWstepna ?? null,
      rozmowaOceniajaca: ocena.daty.rozmowaOceniajaca ?? null,
      sporzadzenie: ocena.daty.sporzadzenie ?? null,
      zapoznanie: ocena.daty.zapoznanie ?? null,
    },
  };
}

/** Nazwa pliku bez danych osobowych, np. `azymut-ocena-o1-2026-11-21.json`. */
export function nazwaPlikuEksportu(e: Pick<EksportOceny, "id" | "wygenerowano">): string {
  const bezpieczneId = e.id.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 40) || "ocena";
  return `azymut-ocena-${bezpieczneId}-${e.wygenerowano.slice(0, 10)}.json`;
}
