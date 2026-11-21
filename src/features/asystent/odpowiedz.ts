import "server-only";

import { z } from "zod";

import { generateJson } from "@/lib/ai/client";
import type { AsystentOdpowiedz, AsystentZapytanie, ZrodloOdpowiedzi } from "@/types/api";

import { anonimizuj, ZNACZNIK_OSOBY } from "./anonimizacja";
import { szukajFragmentow, type Fragment } from "./baza";
import { bezPolskichZnakow, tokeny } from "./wyszukiwanie";

/** Źródło z dodatkowymi polami do podglądu w UI (pełny fragment). Zgodne z kontraktem. */
export interface ZrodloAsystenta extends ZrodloOdpowiedzi {
  id: string;
  tekst: string;
}

export interface OdpowiedzAsystenta extends AsystentOdpowiedz {
  zrodla: ZrodloAsystenta[];
  /** true → z pytania usunięto imiona/nazwiska przed wysłaniem do AI. */
  zanonimizowano: boolean;
  /** Dostawca AI, który odpowiedział (brak → odpowiedź bez AI). */
  dostawca?: string;
}

export const BRAK_INFORMACJI =
  "Nie znalazłem odpowiedzi na to pytanie w bazie wiedzy asystenta (rozporządzenia o pierwszej ocenie i o ocenach okresowych, poradniki KPRM, model kompetencji), więc nie będę zgadywać. Spróbuj zadać pytanie inaczej albo skontaktuj się z komórką kadr.";

/** Poniżej tego pokrycia słów pytania nie pytamy nawet modelu – to pytanie spoza bazy. */
const MIN_POKRYCIE = 0.4;

const SYSTEM = `Jesteś asystentem formalnym w aplikacji „Azymut” dla przełożonych w służbie cywilnej.
Odpowiadasz na pytania o pierwszą ocenę i ocenę okresową WYŁĄCZNIE na podstawie fragmentów bazy wiedzy z wiadomości użytkownika (oznaczonych [F1], [F2]…).
Zasady:
1. Nie korzystaj z wiedzy spoza fragmentów i nie zgaduj. Jeśli fragmenty nie odpowiadają na pytanie, ustaw "brakInformacji": true.
2. Po każdym zdaniu z faktem (termin, liczba, warunek, obowiązek) wstaw numer fragmentu, np. [F2].
3. Pisz po polsku, zwięźle: 2–6 zdań albo krótka lista. Podawaj konkretne terminy, liczby i paragrafy z fragmentów.
4. Nie oceniasz pracowników i nie proponujesz poziomu oceny – decyzję zawsze podejmuje przełożony.
5. W "zrodla" wypisz wykorzystane fragmenty: numer i krótki cytat (do 200 znaków) przepisany DOSŁOWNIE z fragmentu.
Zwróć JSON: {"odpowiedz": "…", "brakInformacji": false, "zrodla": [{"fragment": 1, "cytat": "…"}]}`;

const numer = z.preprocess(
  (v) => (typeof v === "string" ? Number(v.replace(/\D/g, "")) : v),
  z.number().int(),
);

const odpowiedzModelu = z.object({
  odpowiedz: z.string().catch(""),
  brakInformacji: z.preprocess((v) => v === true || v === "true", z.boolean()),
  zrodla: z
    .array(z.object({ fragment: numer, cytat: z.string().catch("") }))
    .catch([]),
});

// ── cache (te same pytania jury → bez ponownego wywołania AI) ───────────────
const CACHE_MAX = 200;
const cache = new Map<string, OdpowiedzAsystenta>();
function zCache(klucz: string) {
  const v = cache.get(klucz);
  if (v) {
    cache.delete(klucz);
    cache.set(klucz, v);
  }
  return v;
}
function doCache(klucz: string, v: OdpowiedzAsystenta) {
  cache.set(klucz, v);
  if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
}

// ── cytaty ──────────────────────────────────────────────────────────────────
const MAX_CYTAT = 260;

function przytnij(s: string, max = MAX_CYTAT): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 0 ? cut.lastIndexOf(" ") : max)}…`;
}

/**
 * Cytat MUSI pochodzić z fragmentu: jeśli tekst od modelu występuje we fragmencie (po ujednoliceniu
 * spacji i wielkości liter) – bierzemy oryginalny kawałek fragmentu; w przeciwnym razie wybieramy
 * zdanie fragmentu najbardziej podobne do odpowiedzi.
 */
function cytatZFragmentu(fragment: Fragment, cytatModelu: string, kontekst: string): string {
  const tekst = fragment.tekst;
  const szukany = cytatModelu.replace(/^[\s"„”'…]+|[\s"„”'….]+$/g, "").replace(/\s+/g, " ");
  if (szukany.length >= 15) {
    const idx = tekst.toLowerCase().indexOf(szukany.toLowerCase());
    if (idx >= 0) return przytnij(tekst.slice(idx, idx + szukany.length));
  }
  const zdania = tekst.match(/[^.;!?]+[.;!?]*/g) ?? [tekst];
  const cel = new Set(tokeny(`${cytatModelu} ${kontekst}`));
  let najlepsze = zdania[0];
  let max = -1;
  for (const z of zdania) {
    const t = tokeny(z);
    const wspolne = t.filter((x) => cel.has(x)).length;
    const wynik = wspolne / Math.sqrt(t.length + 1);
    if (wynik > max) {
      max = wynik;
      najlepsze = z;
    }
  }
  return przytnij(najlepsze.trim());
}

/** Zbiera numery [F2], [F1, F3], [F1][F2] z odpowiedzi; zamienia je na kolejne [1], [2]… źródeł. */
function przenumeruj(odpowiedz: string, dozwolone: number, zListy: number[]) {
  const kolejnosc: number[] = [];
  const dodaj = (n: number) => {
    if (n >= 1 && n <= dozwolone && !kolejnosc.includes(n)) kolejnosc.push(n);
  };
  const wzor = /\[\s*(F?\s*\d+(?:\s*[,;]\s*F?\s*\d+)*)\s*\]/gi;
  for (const m of odpowiedz.matchAll(wzor)) for (const d of m[1].match(/\d+/g) ?? []) dodaj(Number(d));
  zListy.forEach(dodaj);

  const tekst = odpowiedz
    .replace(wzor, (_, grupa: string) => {
      const nowe = [...new Set((grupa.match(/\d+/g) ?? []).map(Number))]
        .map((n) => kolejnosc.indexOf(n) + 1)
        .filter((n) => n > 0);
      return nowe.length ? `[${nowe.join(", ")}]` : "";
    })
    .replace(/ +([.,;:])/g, "$1")
    .trim();
  return { tekst, kolejnosc };
}

// ── główna funkcja ──────────────────────────────────────────────────────────
export async function odpowiedzNaPytanie(z: AsystentZapytanie): Promise<OdpowiedzAsystenta> {
  const pytanie = anonimizuj(z.pytanie.trim());
  const historia = (z.historia ?? []).slice(-4).map((m) => {
    const a = anonimizuj(m.content);
    return { role: m.role, content: a.tekst.slice(0, 600), zmieniono: a.zmieniono };
  });
  const zanonimizowano = pytanie.zmieniono || historia.some((h) => h.zmieniono);

  // Krótkie dopytanie („a w ocenie okresowej?”) – szukamy razem z poprzednim pytaniem.
  const poprzednie = [...historia].reverse().find((h) => h.role === "user")?.content ?? "";
  const doSzukania = (
    tokeny(pytanie.tekst).length <= 3 && poprzednie ? `${poprzednie} ${pytanie.tekst}` : pytanie.tekst
  ).replaceAll(ZNACZNIK_OSOBY, " ");

  const klucz = `${z.rodzaj ?? "-"}|${bezPolskichZnakow(pytanie.tekst).replace(/\s+/g, " ")}`;
  if (historia.length === 0) {
    const c = zCache(klucz);
    if (c) return c;
  }

  const { fragmenty, pokrycie } = szukajFragmentow(doSzukania, z.rodzaj);
  const brak: OdpowiedzAsystenta = { odpowiedz: BRAK_INFORMACJI, zrodla: [], brakInformacji: true, zanonimizowano };
  if (fragmenty.length === 0 || pokrycie < MIN_POKRYCIE) return brak;

  const kontekst = fragmenty
    .map((t, i) => `[F${i + 1}] ${t.item.dokument}, ${t.item.miejsce}:\n${t.item.tekst}`)
    .join("\n\n");
  const sciezka = z.rodzaj ? `\nUżytkownik jest w ścieżce: ${z.rodzaj === "pierwsza" ? "pierwsza ocena" : "ocena okresowa"}.` : "";

  const { data, provider } = await generateJson(odpowiedzModelu, {
    system: SYSTEM,
    messages: [
      ...historia.map(({ role, content }) => ({ role, content })),
      { role: "user", content: `Fragmenty bazy wiedzy:\n\n${kontekst}\n${sciezka}\n\nPytanie: ${pytanie.tekst}` },
    ],
    temperature: 0.1,
    maxTokens: 900,
  });

  if (data.brakInformacji || !data.odpowiedz.trim()) return { ...brak, dostawca: provider };

  const { tekst, kolejnosc } = przenumeruj(
    data.odpowiedz,
    fragmenty.length,
    data.zrodla.map((s) => s.fragment),
  );
  // Odpowiedź bez żadnego wskazanego fragmentu traktujemy jak brak informacji – nie pokazujemy niczego bez źródła.
  if (kolejnosc.length === 0) return { ...brak, dostawca: provider };

  const zrodla: ZrodloAsystenta[] = kolejnosc.map((n) => {
    const f = fragmenty[n - 1].item;
    const cytat = data.zrodla.find((s) => s.fragment === n)?.cytat ?? "";
    return {
      id: f.id,
      dokument: f.dokument,
      miejsce: f.miejsce,
      fragment: cytatZFragmentu(f, cytat, `${pytanie.tekst} ${tekst}`),
      tekst: f.tekst,
    };
  });

  const wynik: OdpowiedzAsystenta = { odpowiedz: tekst, zrodla, brakInformacji: false, zanonimizowano, dostawca: provider };
  if (historia.length === 0) doCache(klucz, wynik);
  return wynik;
}
