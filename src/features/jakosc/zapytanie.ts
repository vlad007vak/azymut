/**
 * Budowa zapytania do kontroli jakości z oceny zapisanej w przeglądarce.
 * Minimalizacja danych: imiona i nazwiska ocenianego i oceniającego (znane z oceny) zamieniamy
 * na „[osoba]” jeszcze w przeglądarce; serwer dodatkowo usuwa inne imiona i nazwiska heurystyką.
 */
import { pracownik } from "@/lib/ocena/store";
import { doSkaliPierwszejOceny, sugerowanyPoziom } from "@/lib/ocena/zasady";
import type { Obserwacja, Ocena, Osoba } from "@/types/ocena";

import type { ZapytanieJakosci } from "./schemat";

const ZNACZNIK = "[osoba]";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** „Anna” → wzorzec na Anna/Anny/Annie/Anną; „Kowalczyk” → Kowalczyk/Kowalczyka/Kowalczykiem. */
function wzorzecSlowa(slowo: string): string {
  const rdzen = /[aeoiy]$/i.test(slowo) && slowo.length > 3 ? slowo.slice(0, -1) : slowo;
  return `(?<!\\p{L})${escape(rdzen)}\\p{L}{0,4}(?!\\p{L})`;
}

export function usunDaneOsobowe(tekst: string, osoby: Partial<Osoba>[]): { tekst: string; zmieniono: boolean } {
  const slowa = osoby
    .flatMap((o) => [o.imie, ...(o.nazwisko ?? "").split(/[\s-]+/)])
    .filter((s): s is string => !!s && s.trim().length >= 3);
  if (slowa.length === 0 || !tekst) return { tekst, zmieniono: false };
  const re = new RegExp(slowa.map(wzorzecSlowa).join("|"), "giu");
  const wynik = tekst.replace(re, ZNACZNIK).replace(/\[osoba\](\s+\[osoba\])+/g, ZNACZNIK);
  return { tekst: wynik, zmieniono: wynik !== tekst };
}

/** Zapytanie POST /api/jakosc z oceny (bez imion i nazwisk); `zmieniono` = usunięto imię / nazwisko. */
export function zapytanieZOceny(ocena: Ocena): { zapytanie: ZapytanieJakosci; zmieniono: boolean } {
  const p = pracownik(ocena.pracownikId);
  const osoby = [p ?? {}, ocena.oceniajacy];
  let zmieniono = false;
  const czysc = (t?: string) => {
    const s = t?.trim();
    if (!s) return undefined;
    const r = usunDaneOsobowe(s, osoby);
    zmieniono ||= r.zmieniono;
    return r.tekst;
  };

  const zapytanie: ZapytanieJakosci = {
    rodzaj: ocena.rodzaj,
    stanowisko: p?.stanowisko,
    kryteria: ocena.kryteria.map((k) => {
      const obserwacje: Obserwacja[] = k.wskazniki.map((id) => k.obserwacje[id] ?? { poziom: null });
      const s = sugerowanyPoziom(obserwacje).poziom;
      return {
        kompetencjaId: k.kompetencjaId,
        decyzja: k.decyzja,
        sugestia: s && ocena.rodzaj === "pierwsza" ? doSkaliPierwszejOceny(s) : s,
        wskazniki: k.wskazniki.map((id) => ({
          id,
          poziom: k.obserwacje[id]?.poziom ?? null,
          przyklad: czysc(k.obserwacje[id]?.przyklad),
        })),
      };
    }),
    uzasadnienie: czysc(ocena.uzasadnienie),
    wnioskiRozwojowe: czysc(ocena.wnioskiRozwojowe),
  };
  return { zapytanie, zmieniono };
}
