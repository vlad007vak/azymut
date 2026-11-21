import "server-only";

import { z } from "zod";

import { AiUnavailableError, generateJson } from "@/lib/ai/client";
import { kompetencja, nazwaPoziomu, wskaznik } from "@/lib/ocena/model";
import { doSkaliPierwszejOceny } from "@/lib/ocena/zasady";
import type { KompetencjaId, PoziomId } from "@/types/ocena";

import { anonimizuj } from "../asystent/anonimizacja";
import type { ZapytanieJakosci } from "./schemat";
import { TYPY_UWAG, type PoleUwagi, type TypUwagi, type UwagaJakosci, type WynikKontroli } from "./typy";

/** Odstęp przed ponowną próbą, gdy wszyscy dostawcy AI odmówili (limit / przeciążenie). */
const PONOW_PO_MS = 3500;
const MAX_UWAG_AI = 8;

// ── tekst przełożonego ──────────────────────────────────────────────────────
interface Tekst {
  pole: PoleUwagi;
  kompetencjaId?: KompetencjaId;
  tekst: string;
}

/** Zbiera wszystkie teksty przełożonego (po anonimizacji) – tylko z nich wolno cytować. */
function teksty(z: ZapytanieJakosci): Tekst[] {
  const out: Tekst[] = [];
  for (const k of z.kryteria)
    for (const w of k.wskazniki) if (w.przyklad) out.push({ pole: "przyklad", kompetencjaId: k.kompetencjaId, tekst: w.przyklad });
  if (z.uzasadnienie) out.push({ pole: "uzasadnienie", tekst: z.uzasadnienie });
  if (z.wnioskiRozwojowe) out.push({ pole: "wnioski", tekst: z.wnioskiRozwojowe });
  return out;
}

/** Usuwa imiona i nazwiska, których przeglądarka nie znała (np. współpracowników). */
function anonimizujZapytanie(z: ZapytanieJakosci): { z: ZapytanieJakosci; zmieniono: boolean } {
  let zmieniono = false;
  const a = (t?: string) => {
    if (!t) return t;
    const r = anonimizuj(t);
    zmieniono ||= r.zmieniono;
    return r.tekst;
  };
  return {
    z: {
      ...z,
      kryteria: z.kryteria.map((k) => ({ ...k, wskazniki: k.wskazniki.map((w) => ({ ...w, przyklad: a(w.przyklad) })) })),
      uzasadnienie: a(z.uzasadnienie),
      wnioskiRozwojowe: a(z.wnioskiRozwojowe),
    },
    zmieniono,
  };
}

// ── cytaty ──────────────────────────────────────────────────────────────────
/** Ujednolica tekst do porównania, zachowując mapę pozycji do oryginału. */
function normalizujZMapa(s: string): { n: string; mapa: number[] } {
  let n = "";
  const mapa: number[] = [];
  let spacja = false;
  for (let i = 0; i < s.length; i++) {
    let c = s[i].toLowerCase();
    if (/[„”"«»'‘’]/.test(c)) c = '"';
    if (/[–—]/.test(c)) c = "-";
    if (/\s/.test(c)) {
      if (spacja || n.length === 0) continue;
      spacja = true;
      c = " ";
    } else spacja = false;
    n += c;
    mapa.push(i);
  }
  return { n, mapa };
}

/** Szuka cytatu modelu w tekstach przełożonego; zwraca dokładny fragment oryginału i jego miejsce. */
function znajdzCytat(cytat: string, wszystkie: Tekst[]): { cytat: string; zrodlo: Tekst } | null {
  const szukany = normalizujZMapa(cytat.replace(/^[\s"„”'….]+|[\s"„”'….]+$/g, "")).n.trim();
  if (szukany.length < 4) return null;
  for (const t of wszystkie) {
    const { n, mapa } = normalizujZMapa(t.tekst);
    const idx = n.indexOf(szukany);
    if (idx >= 0) {
      const od = mapa[idx];
      const doZn = mapa[idx + szukany.length - 1] + 1;
      return { cytat: t.tekst.slice(od, doZn), zrodlo: t };
    }
  }
  return null;
}

// ── sprawdzenia automatyczne (bez AI) ───────────────────────────────────────
const nazwa = (id: KompetencjaId) => kompetencja(id).nazwa;
const poziomTekst = (p: PoziomId) => `„${nazwaPoziomu(p).toLowerCase()}”`;

/** Kryteria bez żadnego przykładu. */
function brakPrzykladow(z: ZapytanieJakosci): UwagaJakosci[] {
  return z.kryteria
    .filter((k) => k.wskazniki.length > 0 && !k.wskazniki.some((w) => w.przyklad?.trim()))
    .map((k) => {
      const ocenione = k.wskazniki.filter((w) => w.poziom !== null).length;
      return {
        typ: "brak-przykladu" as const,
        kompetencjaId: k.kompetencjaId,
        sugestia:
          `Przy kryterium „${nazwa(k.kompetencjaId)}” nie ma żadnego przykładu` +
          (ocenione ? ` (zaznaczone zachowania: ${ocenione})` : "") +
          ". Dopisz co najmniej jeden konkretny przykład z okresu oceny: sytuacja – działanie – rezultat.",
        zrodlo: "regula" as const,
      };
    });
}

/** Ostateczny poziom poza zakresem zaznaczonych zachowań (wyżej niż najwyższe albo niżej niż najniższe). */
function niespojnePoziomy(z: ZapytanieJakosci): UwagaJakosci[] {
  const out: UwagaJakosci[] = [];
  for (const k of z.kryteria) {
    if (!k.decyzja) continue;
    const poziomy = k.wskazniki
      .map((w) => w.poziom)
      .filter((p): p is PoziomId => p !== null)
      .map((p) => (z.rodzaj === "pierwsza" ? doSkaliPierwszejOceny(p) : p));
    if (poziomy.length === 0) continue;
    const min = Math.min(...poziomy) as PoziomId;
    const max = Math.max(...poziomy) as PoziomId;
    if (k.decyzja > max || k.decyzja < min) {
      const wyzej = k.decyzja > max;
      out.push({
        typ: "niespojnosc",
        kompetencjaId: k.kompetencjaId,
        sugestia:
          `Wybrany poziom ${poziomTekst(k.decyzja)} jest ${wyzej ? "wyższy" : "niższy"} niż wszystkie zaznaczone zachowania ` +
          `(${wyzej ? "najwyższe" : "najniższe"}: ${poziomTekst(wyzej ? max : min)}). Dopisz przykład, który uzasadnia ten poziom ` +
          "(np. z rozmowy oceniającej), albo sprawdź wybór – decyzja należy do Ciebie.",
        zrodlo: "regula",
      });
    }
  }
  return out;
}

/** Typowe ogólniki bez konkretu („pracuje dobrze”, „jest zaangażowana”). */
const OGOLNIKI =
  /(?<!\p{L})(?:(?:bardzo |zawsze )?(?:pracuje|radzi sobie|wywiązuje się|sprawdza się|współpracuje) (?:bardzo )?(?:dobrze|poprawnie|prawidłowo|należycie|bez zarzutu)|(?:bardzo )?dobrze (?:pracuje|sobie radzi|się sprawdza|współpracuje)|jest (?:bardzo )?(?:zaangażowan|sumienn|rzeteln|pomocn|pracowit|kompetentn|solidn)\p{L}*|(?:dobr|świetn)\p{L}* (?:pracowni(?:k|czk|c)\p{L}*|specjalist\p{L}*)|stara się|bez (?:większych )?zastrzeżeń|nie (?:ma|mam|budzi) (?:żadnych )?zastrzeżeń)(?!\p{L})/giu;

function ogolniki(wszystkie: Tekst[]): UwagaJakosci[] {
  const out: UwagaJakosci[] = [];
  for (const t of wszystkie) {
    // Zdania (z pozycją), żeby cytować całe krótkie zdanie z ogólnikiem.
    for (const m of t.tekst.matchAll(/[^.!?;\n]+[.!?;]?/g)) {
      const zdanie = m[0].trim();
      const slowa = zdanie.split(/\s+/).length;
      // Zdanie z liczbą / datą albo długie zwykle zawiera konkret – nie zgłaszamy.
      if (/\d/.test(zdanie) || slowa > 15) continue;
      OGOLNIKI.lastIndex = 0;
      if (!OGOLNIKI.test(zdanie)) continue;
      out.push({
        typ: "ogolnik",
        kompetencjaId: t.kompetencjaId,
        pole: t.pole,
        cytat: zdanie.replace(/[.;]$/, ""),
        sugestia:
          "Ogólne sformułowanie bez konkretu. Opisz zachowanie na przykładzie z okresu oceny: jaka była sytuacja, co pracownik zrobił i z jakim rezultatem.",
        zrodlo: "regula",
      });
    }
  }
  return out;
}

// ── AI ──────────────────────────────────────────────────────────────────────
const SYSTEM = `Jesteś asystentem jakości ocen pracowników w służbie cywilnej w aplikacji „Azymut”.
Sprawdzasz TEKST przełożonego (przykłady przy kryteriach, uzasadnienie, wnioski) i wskazujesz, co doprecyzować, aby ocena była konkretna, spójna i obiektywna.
Nie oceniasz pracownika, nie proponujesz poziomów i ich nie zmieniasz – decyzja należy do przełożonego.
Typy uwag:
- "ogolnik": ogólne sformułowanie bez konkretu (brak sytuacji, działania i rezultatu), np. „pracuje dobrze”, „jest zaangażowana”.
- "ocena-osoby": ocena cech osobowości lub charakteru zamiast opisu zachowania w pracy, np. „jest leniwy”, „ma trudny charakter”.
- "niespojnosc": treść przykładu przeczy zachowaniu lub poziomowi zaznaczonemu przy nim (np. „powyżej oczekiwań”, a przykład opisuje opóźnienia); cytatem jest fragment tego przykładu.
- "ryzyko-stronniczosci": odwołania do wieku, płci, wyglądu, zdrowia, ciąży, rodziny, życia prywatnego, pochodzenia lub poglądów – rzeczy niezwiązanych z wykonywaniem obowiązków.
Zasady:
1. "cytat" przepisz DOSŁOWNIE z tekstu przełożonego (2–15 słów). Bez dosłownego cytatu nie zgłaszaj uwagi.
2. "sugestia": 1–2 zdania po polsku, co dopisać lub jak przeformułować (sytuacja – działanie – rezultat). Nie wymyślaj faktów o pracowniku i nie powołuj się na przepisy ani skutki prawne.
3. "kompetencjaId" podaj, gdy cytat pochodzi z przykładu przy kryterium (id z nawiasu), w innym razie null.
4. Zgłaszaj tylko rzeczywiste problemy. Konkretny przykład z sytuacją, działaniem i efektem jest poprawny – nie zgłaszaj go. Najwyżej ${MAX_UWAG_AI} uwag; brak problemów = pusta lista.
Zwróć JSON: {"uwagi": [{"typ": "ogolnik", "kompetencjaId": "rzetelnosc", "cytat": "…", "sugestia": "…"}]}`;

const odpowiedzModelu = z.object({
  uwagi: z.array(
    z.object({
      typ: z.string().catch(""),
      kompetencjaId: z.string().nullish().catch(null),
      cytat: z.string().nullish().catch(null),
      sugestia: z.string().nullish().catch(null),
    }),
  ),
});

/** „Ocena osoby” / „ogólnik” / „ryzyko_stronniczości” → id typu. */
function typZModelu(t: string): TypUwagi | null {
  const s = t
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l")
    .replace(/[\s_]+/g, "-");
  return (TYPY_UWAG as string[]).includes(s) ? (s as TypUwagi) : null;
}

const DOMYSLNA_SUGESTIA: Record<TypUwagi, string> = {
  ogolnik: "Zastąp ogólne sformułowanie konkretnym przykładem: sytuacja – działanie – rezultat.",
  "ocena-osoby": "Opisz obserwowane zachowanie w pracy zamiast cechy osoby.",
  niespojnosc: "Sprawdź, czy przykład pasuje do wybranego poziomu, albo dopisz przykład, który go uzasadnia.",
  "brak-przykladu": "Dopisz konkretny przykład z okresu oceny.",
  "ryzyko-stronniczosci": "Usuń odwołanie do cech niezwiązanych z wykonywaniem obowiązków i oprzyj ocenę na zachowaniach w pracy.",
};

function opisDlaModelu(z: ZapytanieJakosci): string {
  const linie = [
    `Rodzaj oceny: ${z.rodzaj === "pierwsza" ? "pierwsza ocena (skala 3/5/7 pkt)" : "ocena okresowa (skala 1/3/5/7/9 pkt)"}.` +
      (z.stanowisko ? ` Stanowisko ocenianego: ${z.stanowisko}.` : ""),
    "",
  ];
  for (const k of z.kryteria) {
    const p = k.decyzja
      ? `poziom wybrany przez przełożonego: ${nazwaPoziomu(k.decyzja).toLowerCase()}`
      : k.sugestia
        ? `poziom jeszcze nie wybrany (sugestia systemu: ${nazwaPoziomu(k.sugestia).toLowerCase()})`
        : "poziom jeszcze nie wybrany";
    linie.push(`Kryterium: ${nazwa(k.kompetencjaId)} (id: ${k.kompetencjaId}) – ${p}.`);
    for (const w of k.wskazniki) {
      const opis = wskaznik(w.id)?.opis ?? w.id;
      const zach = w.poziom ? `zaznaczone zachowanie: ${nazwaPoziomu(w.poziom).toLowerCase()}` : "brak podstaw do oceny";
      linie.push(`  - Wskaźnik „${opis}” – ${zach}. Przykład: ${w.przyklad ? `„${w.przyklad}”` : "brak"}.`);
    }
  }
  linie.push("", `UZASADNIENIE OCENY: ${z.uzasadnienie ? `„${z.uzasadnienie}”` : "brak"}`);
  linie.push(`WNIOSKI ROZWOJOWE: ${z.wnioskiRozwojowe ? `„${z.wnioskiRozwojowe}”` : "brak"}`);
  return linie.join("\n");
}

async function uwagiAi(z: ZapytanieJakosci, wszystkie: Tekst[]): Promise<{ uwagi: UwagaJakosci[]; dostawca: string }> {
  const zapytanie = {
    system: SYSTEM,
    messages: [{ role: "user" as const, content: opisDlaModelu(z) }],
    temperature: 0.1,
    maxTokens: 1200,
  };
  let wynik;
  try {
    wynik = await generateJson(odpowiedzModelu, zapytanie);
  } catch (err) {
    // Darmowe limity zwalniają się po kilku sekundach – jedna ponowna próba.
    if (!(err instanceof AiUnavailableError)) throw err;
    await new Promise((r) => setTimeout(r, PONOW_PO_MS));
    wynik = await generateJson(odpowiedzModelu, zapytanie);
  }

  const uwagi: UwagaJakosci[] = [];
  for (const u of wynik.data.uwagi.slice(0, MAX_UWAG_AI * 2)) {
    const typ = typZModelu(u.typ);
    // Brak przykładu sprawdzamy regułą – bez dublowania przez AI.
    if (!typ || typ === "brak-przykladu") continue;
    // Każda uwaga AI musi wskazać dosłowny fragment tekstu przełożonego – bez niego jest prawdopodobnie
    // zmyślona albo ogólnikowa. Rozbieżność poziomów bez cytatu sprawdza reguła (niespojnePoziomy).
    const znaleziony = u.cytat ? znajdzCytat(u.cytat, wszystkie) : null;
    if (!znaleziony) continue;
    uwagi.push({
      typ,
      // Kryterium bierzemy z miejsca, w którym naprawdę stoi cytat, a nie z odpowiedzi modelu.
      kompetencjaId: znaleziony.zrodlo.kompetencjaId,
      pole: znaleziony.zrodlo.pole,
      cytat: znaleziony.cytat,
      sugestia: u.sugestia?.trim() || DOMYSLNA_SUGESTIA[typ],
      zrodlo: "ai",
    });
  }
  return { uwagi: uwagi.slice(0, MAX_UWAG_AI), dostawca: wynik.provider };
}

// ── wynik ───────────────────────────────────────────────────────────────────
const n = (s?: string) => normalizujZMapa(s ?? "").n;

/** Usuwa powtórzenia: ta sama uwaga z reguły i z AI (nakładające się cytaty) – zostaje wersja AI. */
function bezPowtorzen(uwagi: UwagaJakosci[]): UwagaJakosci[] {
  const out: UwagaJakosci[] = [];
  for (const u of uwagi) {
    const dubel = out.some(
      (x) =>
        x.typ === u.typ &&
        x.kompetencjaId === u.kompetencjaId &&
        (x.cytat && u.cytat ? n(x.cytat).includes(n(u.cytat)) || n(u.cytat).includes(n(x.cytat)) : !x.cytat && !u.cytat),
    );
    if (!dubel) out.push(u);
  }
  return out;
}

const ODMIANA: Record<TypUwagi, [string, string, string]> = {
  ogolnik: ["ogólnik", "ogólniki", "ogólników"],
  "ocena-osoby": ["ocena osoby zamiast zachowania", "oceny osoby zamiast zachowania", "ocen osoby zamiast zachowania"],
  niespojnosc: ["niespójność", "niespójności", "niespójności"],
  "brak-przykladu": ["kryterium bez przykładu", "kryteria bez przykładu", "kryteriów bez przykładu"],
  "ryzyko-stronniczosci": ["ryzyko stronniczości", "ryzyka stronniczości", "ryzyk stronniczości"],
};

function odmien(liczba: number, [jeden, kilka, wiele]: [string, string, string]): string {
  const d = liczba % 10;
  const s = liczba % 100;
  if (liczba === 1) return jeden;
  return d >= 2 && d <= 4 && (s < 12 || s > 14) ? kilka : wiele;
}

function podsumuj(uwagi: UwagaJakosci[], aiNiedostepne: boolean): string {
  if (uwagi.length === 0) {
    return aiNiedostepne
      ? "Sprawdzenia automatyczne nie wykazały problemów. Analiza AI była chwilowo niedostępna – spróbuj ponownie za chwilę."
      : "Nie znaleziono uwag. Przykłady i uzasadnienie wyglądają na konkretne – przeczytaj je jednak jeszcze raz przed sporządzeniem oceny.";
  }
  const czesci = TYPY_UWAG.map((t) => [t, uwagi.filter((u) => u.typ === t).length] as const)
    .filter(([, l]) => l > 0)
    .map(([t, l]) => `${l} ${odmien(l, ODMIANA[t])}`);
  return `Do doprecyzowania: ${czesci.join(", ")}. Poprawki dotyczą tylko opisu – poziomy wybierasz Ty.`;
}

// ── cache (te same dane → bez ponownego wywołania AI) ───────────────────────
const CACHE_MAX = 100;
const cache = new Map<string, WynikKontroli>();

export async function sprawdzJakosc(wejscie: ZapytanieJakosci): Promise<WynikKontroli> {
  // Odrzucamy wskaźniki spoza kryterium (np. ręcznie spreparowane zapytanie).
  const czyste: ZapytanieJakosci = {
    ...wejscie,
    kryteria: wejscie.kryteria.map((k) => ({
      ...k,
      wskazniki: k.wskazniki.filter((w) => w.id.startsWith(`${k.kompetencjaId}-`) && !!wskaznik(w.id)),
    })),
  };
  const { z, zmieniono } = anonimizujZapytanie(czyste);
  const klucz = JSON.stringify(z);
  const zCache = cache.get(klucz);
  if (zCache) return { ...zCache, zanonimizowano: zmieniono };

  const wszystkie = teksty(z);
  // Reguły bez cytatu są dokładniejsze niż AI (konkretne poziomy) – mają pierwszeństwo przy dublach;
  // przy ogólnikach z cytatem zostawiamy wersję AI (lepsza sugestia).
  const regulyKryteriow = [...brakPrzykladow(z), ...niespojnePoziomy(z)];
  const regulyOgolnikow = ogolniki(wszystkie);

  let ai: UwagaJakosci[] = [];
  let dostawca: string | undefined;
  let aiNiedostepne = false;
  if (wszystkie.length > 0) {
    try {
      const r = await uwagiAi(z, wszystkie);
      ai = r.uwagi;
      dostawca = r.dostawca;
    } catch (err) {
      if (!(err instanceof AiUnavailableError)) throw err;
      aiNiedostepne = true;
    }
  }

  // Kolejność: kryteria jak w ocenie, potem uzasadnienie i wnioski; w grupie wg typu.
  const kolejnosc = new Map(z.kryteria.map((k, i) => [k.kompetencjaId, i]));
  // Ogólnik z reguły pomijamy, jeśli AI zgłosiło już (dowolną) uwagę do tego samego zdania.
  const nakladaSie = (a?: string, b?: string) => !!a && !!b && (n(a).includes(n(b)) || n(b).includes(n(a)));
  const ogolnikiBezAi = regulyOgolnikow.filter((r) => !ai.some((u) => nakladaSie(u.cytat, r.cytat)));
  const uwagi = bezPowtorzen([...regulyKryteriow, ...ai, ...ogolnikiBezAi]).sort(
    (a, b) =>
      (a.kompetencjaId ? (kolejnosc.get(a.kompetencjaId) ?? 99) : 100) -
        (b.kompetencjaId ? (kolejnosc.get(b.kompetencjaId) ?? 99) : 100) ||
      TYPY_UWAG.indexOf(a.typ) - TYPY_UWAG.indexOf(b.typ),
  );

  const wynik: WynikKontroli = { uwagi, podsumowanie: podsumuj(uwagi, aiNiedostepne), aiNiedostepne, zanonimizowano: zmieniono, dostawca };
  if (!aiNiedostepne) {
    cache.set(klucz, wynik);
    if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value!);
  }
  return wynik;
}
