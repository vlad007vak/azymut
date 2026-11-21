/**
 * Podsumowanie kryteriów oceny i budowa zapytania do POST /api/rozmowa.
 * Czyste funkcje (bez UI) – działają w przeglądarce i na serwerze.
 */
import { kompetencja, nazwaPoziomu, poziom, wskaznik } from "@/lib/ocena/model";
import { doSkaliPierwszejOceny, sugerowanyPoziom, type Sugestia } from "@/lib/ocena/zasady";
import type { RozmowaZapytanie } from "@/types/api";
import type {
  KompetencjaId,
  Obserwacja,
  Ocena,
  OcenaKryterium,
  PoziomId,
  RodzajOceny,
} from "@/types/ocena";

export interface WskaznikPodsumowanie {
  id: string;
  opis: string;
  /** undefined = wskaźnik jeszcze nieoceniony, null = brak podstaw do oceny. */
  poziom: PoziomId | null | undefined;
  /** Opis wybranego zachowania z modelu kompetencji. */
  zachowanie?: string;
  przyklad?: string;
}

export interface KryteriumPodsumowanie {
  kompetencjaId: KompetencjaId;
  nazwa: string;
  dodatkowe: boolean;
  wskazniki: WskaznikPodsumowanie[];
  sugestia: Sugestia;
  /** Sugestia systemu w skali danej oceny (pierwsza ocena: tylko 2 | 3 | 4). */
  sugerowany: PoziomId | null;
  decyzja?: PoziomId;
}

export function podsumujKryterium(k: OcenaKryterium, rodzaj: RodzajOceny): KryteriumPodsumowanie {
  const wskazniki: WskaznikPodsumowanie[] = k.wskazniki.map((id) => {
    const w = wskaznik(id);
    const obs: Obserwacja | undefined = k.obserwacje[id];
    const p = obs?.poziom;
    return {
      id,
      opis: w?.opis ?? id,
      poziom: obs ? p : undefined,
      zachowanie: w && p ? w.zachowania[String(p) as keyof typeof w.zachowania] : undefined,
      przyklad: obs?.przyklad?.trim() || undefined,
    };
  });
  const obserwacje = k.wskazniki.map((id) => k.obserwacje[id]).filter((o): o is Obserwacja => !!o);
  const sugestia = sugerowanyPoziom(obserwacje);
  const sugerowany =
    sugestia.poziom === null
      ? null
      : rodzaj === "pierwsza"
        ? doSkaliPierwszejOceny(sugestia.poziom)
        : sugestia.poziom;
  return {
    kompetencjaId: k.kompetencjaId,
    nazwa: kompetencja(k.kompetencjaId).nazwa,
    dodatkowe: k.dodatkowe,
    wskazniki,
    sugestia,
    sugerowany,
    decyzja: k.decyzja,
  };
}

export function podsumujOcene(ocena: Ocena): KryteriumPodsumowanie[] {
  return ocena.kryteria.map((k) => podsumujKryterium(k, ocena.rodzaj));
}

/** „Na poziomie oczekiwań (5 pkt)”. */
export function etykietaPoziomu(p: PoziomId): string {
  return `${nazwaPoziomu(p)} (${poziom(p).punkty} pkt)`;
}

export function nazwaRodzaju(ocena: Pick<Ocena, "rodzaj" | "arkusz">): string {
  if (ocena.rodzaj === "pierwsza") return "Pierwsza ocena";
  return ocena.arkusz ? `Ocena okresowa – arkusz ${ocena.arkusz}` : "Ocena okresowa";
}

// ── Minimalizacja danych ─────────────────────────────────────────────────────

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Wzorzec słowa z prostą odmianą (Anna → Anny, Annie, Anną; Kowalczyk → Kowalczyka…). */
function wzorzecSlowa(slowo: string): string | null {
  if (slowo.length < 3) return null;
  const rdzen = /[aeiouyąę]$/i.test(slowo) ? slowo.slice(0, -1) : slowo;
  return `${escapeRegExp(rdzen)}\\p{L}{0,3}`;
}

/**
 * Zastępuje imiona i nazwiska znanych osób znacznikiem „[osoba]”, zanim tekst trafi do AI.
 * Przełożony mógł wpisać imię w przykładzie – do modelu wysyłamy tylko treść zachowania.
 */
export function anonimizuj(tekst: string, osoby: { imie: string; nazwisko: string }[]): string {
  const wzorce = osoby
    .flatMap((o) => [o.imie, o.nazwisko])
    .flatMap((s) => s.split(/[\s-]+/))
    .map((s) => s.trim())
    .map(wzorzecSlowa)
    .filter((w): w is string => w !== null);
  if (wzorce.length === 0) return tekst;
  const re = new RegExp(`(?<!\\p{L})(?:${wzorce.join("|")})(?!\\p{L})`, "gu");
  return tekst.replace(re, "[osoba]");
}

// ── Zapytanie do AI ──────────────────────────────────────────────────────────

const MAX_DLUGOSC_PRZYKLADU = 600;

type WskaznikOceniony = WskaznikPodsumowanie & { poziom: PoziomId | null };

function opisWskaznikaDlaAi(w: WskaznikOceniony): string {
  const poziomTekst = w.poziom === null ? "brak podstaw do oceny" : nazwaPoziomu(w.poziom).toLowerCase();
  const przyklad = w.przyklad ? `Przykład: ${w.przyklad}` : "Brak zapisanego przykładu.";
  return `${w.opis} – ${poziomTekst}. ${przyklad}`.slice(0, MAX_DLUGOSC_PRZYKLADU);
}

/**
 * RozmowaZapytanie BEZ imienia i nazwiska: stanowisko, kryteria, poziomy i przykłady (zanonimizowane).
 * Poziom = decyzja przełożonego, a gdy jej brak – sugestia systemu (null = brak podstaw).
 */
export function zbudujZapytanie(
  ocena: Ocena,
  stanowisko: string,
  osoby: { imie: string; nazwisko: string }[],
): RozmowaZapytanie {
  return {
    rodzaj: ocena.rodzaj,
    stanowisko: stanowisko.trim() || "nie podano",
    kryteria: podsumujOcene(ocena).map((k) => ({
      kompetencjaId: k.kompetencjaId,
      poziom: k.decyzja ?? k.sugerowany,
      przyklady: k.wskazniki
        .filter((w): w is WskaznikOceniony => w.poziom !== undefined)
        .map((w) => anonimizuj(opisWskaznikaDlaAi(w), osoby)),
    })),
  };
}
