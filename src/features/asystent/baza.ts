import "server-only";

import baza from "@/data/baza-wiedzy/fragmenty.json";
import surowaBazaQa from "@/data/baza-wiedzy/pytania-odpowiedzi.json";
import { MODEL } from "@/lib/ocena/model";
import type { RodzajOceny } from "@/types/ocena";

import { PLIK_QA, sprawdzBazeQa } from "./schemat-qa.mjs";
import { Bm25, bezPolskichZnakow, type Trafienie } from "./wyszukiwanie";

export interface Fragment {
  id: string;
  dokumentId: string;
  /** Pełna nazwa dokumentu – trafia do źródła odpowiedzi. */
  dokument: string;
  miejsce: string;
  rodzaj: RodzajOceny | "wspolne";
  /** „qa” = pozycja bazy pytań i odpowiedzi urzędu (pomocnicza, nie wiążąca). */
  typ: "ustawa" | "rozporzadzenie" | "poradnik" | "model" | "qa";
  tekst: string;
  /** Tekst indeksowany przez wyszukiwarkę. */
  indeks: string;
}

/** Polska odmiana po liczebniku: 1 pytanie, 2–4 pytania, 5 pytań (12–14 pytań). */
export function odmiana(n: number, [jeden, kilka, wiele]: [string, string, string]): string {
  if (n === 1) return `${n} ${jeden}`;
  const d = n % 10;
  const s = n % 100;
  return `${n} ${d >= 2 && d <= 4 && (s < 12 || s > 14) ? kilka : wiele}`;
}

const MODEL_DOKUMENT = "Model kompetencji (materiał organizatora – Ministerstwo Cyfryzacji)";

const dokumenty = new Map(baza.dokumenty.map((d) => [d.id, d]));

/** Przepisy (ustawa, rozporządzenia) są źródłem wiążącym – mają pierwszeństwo przed poradnikami. */
const wiazacy = (f: Fragment) => f.typ === "ustawa" || f.typ === "rozporzadzenie";

function zPdf(): Fragment[] {
  return baza.fragmenty.map((f) => {
    const d = dokumenty.get(f.dokumentId);
    if (!d) throw new Error(`Nieznany dokument w bazie wiedzy: ${f.dokumentId}`);
    const sekcja = "sekcja" in f ? f.sekcja : undefined;
    const slowa = "slowa" in f ? f.slowa : "";
    const typ = d.typ as Fragment["typ"];
    // Ustawa obejmuje obie ścieżki – ścieżkę ma każdy jej fragment (art. 38 – pierwsza, art. 81–83 – okresowa).
    const rodzaj = ("rodzaj" in f && f.rodzaj ? f.rodzaj : d.rodzaj) as Fragment["rodzaj"];
    // Paragrafy i artykuły rzadko powtarzają „ocena okresowa” / „pierwsza ocena”, więc dokładamy temat:
    // dla rozporządzeń z nazwy dokumentu, dla ustawy ze ścieżki fragmentu.
    const temat =
      typ === "rozporzadzenie" ? d.krotko : typ === "ustawa" ? { pierwsza: "pierwsza ocena", okresowa: "ocena okresowa", wspolne: "" }[rodzaj] : "";
    return {
      id: f.id,
      dokumentId: f.dokumentId,
      dokument: d.nazwa,
      miejsce: f.miejsce,
      rodzaj,
      typ,
      tekst: f.tekst,
      // Tytuł rozdziału liczy się podwójnie – dobrze opisuje temat fragmentu.
      indeks: `${sekcja ?? ""} ${sekcja ?? ""} ${temat} ${slowa} ${f.tekst}`,
    };
  });
}

/** Model kompetencji: jeden fragment = jeden wskaźnik z opisami zachowań na 5 poziomach. */
function zModelu(): Fragment[] {
  const out: Fragment[] = [
    {
      id: "model-zasady",
      dokumentId: "model",
      dokument: MODEL_DOKUMENT,
      miejsce: "poziomy i wskazówki",
      rodzaj: "wspolne",
      typ: "model",
      tekst: `Model kompetencji opisuje 5 poziomów: ${MODEL.poziomy.map((p) => `${p.id} – ${p.nazwa.toLowerCase()}`).join(", ")}. Wskazówki: ${MODEL.wskazowki.join(" ")}`,
      indeks: "",
    },
  ];
  for (const k of MODEL.kompetencje) {
    // Przegląd kompetencji: lista wszystkich wskaźników (pytania „jakie wskaźniki ma…”).
    out.push({
      id: `model-${k.id}`,
      dokumentId: "model",
      dokument: MODEL_DOKUMENT,
      miejsce: `${k.nazwa} – wskaźniki`,
      rodzaj: "wspolne",
      typ: "model",
      tekst: `Kompetencja „${k.nazwa}” – wskaźniki behawioralne (${k.wskazniki.length}): ${k.wskazniki.map((w, i) => `${i + 1}) ${w.opis}`).join(" ")}`,
      indeks: "",
    });
    k.wskazniki.forEach((w, i) => {
      const poziomy = MODEL.poziomy.map((p) => `${p.nazwa}: ${w.zachowania[String(p.id) as "1"]}`).join(" ");
      out.push({
        id: `model-${w.id}`,
        dokumentId: "model",
        dokument: MODEL_DOKUMENT,
        miejsce: `${k.nazwa} – wskaźnik ${i + 1}`,
        rodzaj: "wspolne",
        typ: "model",
        tekst: `Kompetencja „${k.nazwa}”, wskaźnik behawioralny: ${w.opis} Przykładowe zachowania na poziomach – ${poziomy}`,
        indeks: "",
      });
    });
  }
  return out.map((f) => ({ ...f, indeks: `${f.miejsce} ${f.tekst}` }));
}

/**
 * Baza pytań i odpowiedzi (Q&A) z pliku, który urząd może podmienić (docs/BAZA-WIEDZY.md).
 * Błędny plik zatrzymuje build czytelnym komunikatem – asystent nie może działać na złych danych.
 */
function zBazyQa() {
  const wynik = sprawdzBazeQa(surowaBazaQa as unknown);
  if (!wynik.ok) {
    throw new Error(
      [
        `Błędny plik bazy pytań i odpowiedzi (${PLIK_QA}):`,
        ...wynik.bledy.map((b) => `  – ${b}`),
        "Popraw plik według docs/BAZA-WIEDZY.md (sprawdzenie: node scripts/baza-wiedzy/qa-z-csv.mjs --sprawdz) i uruchom build ponownie.",
      ].join("\n"),
    );
  }
  const { nazwa, pozycje } = wynik.baza;
  const dokument = `Baza pytań i odpowiedzi – ${nazwa}`;
  const fragmenty: Fragment[] = pozycje.map((p) => ({
    id: `qa:${p.id}`,
    dokumentId: "qa",
    dokument,
    // Pytanie i podstawa prawna są widoczne w nagłówku źródła; cytat pochodzi z odpowiedzi.
    miejsce: `${p.id}: „${p.pytanie}” – podstawa: ${p.zrodlo}`,
    rodzaj: p.rodzaj,
    typ: "qa",
    tekst: p.odpowiedz,
    // Pytanie liczy się podwójnie – to ono najlepiej opisuje, o co chodzi w pozycji.
    indeks: `${p.pytanie} ${p.pytanie} ${p.odpowiedz}`,
  }));
  return { dokument, fragmenty };
}

const QA = zBazyQa();

/** Fragmenty dokumentów: ustawa, rozporządzenia, poradniki, model kompetencji. */
export const FRAGMENTY: Fragment[] = [...zPdf(), ...zModelu()];
/** Pozycje bazy pytań i odpowiedzi – osobny indeks, żeby nie zmieniały rankingu przepisów. */
export const FRAGMENTY_QA: Fragment[] = QA.fragmenty;

/** Lista dokumentów w bazie – do wyświetlenia użytkownikowi. */
export const DOKUMENTY_BAZY = [
  ...baza.dokumenty.map((d) => d.nazwa),
  MODEL_DOKUMENT,
  `${QA.dokument} (${odmiana(FRAGMENTY_QA.length, ["pytanie", "pytania", "pytań"])})`,
];

const indeks = new Bm25(FRAGMENTY);
const indeksQa = new Bm25(FRAGMENTY_QA);

/** Pozycja Q&A trafia do kontekstu, gdy pokrywa co najmniej tyle istotnych słów pytania. */
const MIN_POKRYCIE_QA = 0.6;
/** Najwyżej tyle pozycji Q&A w kontekście – dokładane obok przepisów, nie zamiast nich. */
const MAX_QA = 2;

export interface WynikWyszukiwania {
  fragmenty: Trafienie<Fragment>[];
  /** Najlepsze pokrycie istotnych słów pytania (0–1) – do wykrywania pytań spoza bazy. */
  pokrycie: number;
}

/**
 * Szuka fragmentów do odpowiedzi. Ścieżka oceny (z parametru albo z treści pytania)
 * podbija fragmenty z właściwych dokumentów; do kontekstu zawsze dokładamy najlepszy
 * fragment przepisów (ustawa, rozporządzenia), bo to one są źródłem wiążącym.
 */
export function szukajFragmentow(pytanie: string, rodzaj?: RodzajOceny, limit = 6): WynikWyszukiwania {
  const q = bezPolskichZnakow(pytanie);
  const wPytaniu: RodzajOceny | undefined = /pierwsz|nowy|nowego|nowej|sprawozdan|sluzb\w* przygotowawcz/.test(q)
    ? "pierwsza"
    : /okresow|arkusz|kryteri|sprzeciw|iprz|stopie|stopni/.test(q)
      ? "okresowa"
      : undefined;
  const cel = wPytaniu ?? rodzaj;
  const waga = (f: Fragment) => (cel && f.rodzaj === cel ? 1.3 : 1) * (wiazacy(f) ? 1.1 : 1);

  const wszystkie = indeks.szukaj(pytanie, { limit: 30, waga });
  // Ustępy ustawy są krótkie (zwykle 1–2 zdania), więc nie zajmują miejsca w limicie – inaczej wypychałyby
  // szczegółowe paragrafy rozporządzeń i poradników. Dokładamy najwyżej 3, które same weszłyby do czołówki
  // (pytanie „w jakim terminie i do kogo…” potrzebuje art. 83 ust. 1 obok ust. 3 i 5).
  const ustepy = wszystkie.filter((t) => t.item.typ === "ustawa");
  const reszta = wszystkie.filter((t) => t.item.typ !== "ustawa");

  const glowne = reszta.slice(0, limit - 1);
  // Jedno miejsce rezerwujemy dla najlepszego paragrafu rozporządzenia, jeśli jest choć w połowie tak trafny.
  const prog = (wszystkie[0]?.wynik ?? 0) * 0.5;
  const przepis = glowne.some((t) => t.item.typ === "rozporzadzenie")
    ? undefined
    : reszta.find((t) => t.item.typ === "rozporzadzenie" && !glowne.includes(t) && t.wynik >= prog);
  const wybrane = [...glowne, ...(przepis ? [przepis] : []), ...reszta.filter((t) => !glowne.includes(t) && t !== przepis)].slice(0, limit);

  const progUstawy = Math.max(prog, reszta[limit - 1]?.wynik ?? 0);
  const zUstawy = ustepy.filter((t) => t.wynik >= progUstawy).slice(0, 3);
  const fragmenty = [...wybrane, ...zUstawy].sort((a, b) => b.wynik - a.wynik);

  // Baza Q&A ma własny indeks i miejsca poza limitem: nie wypiera przepisów z kontekstu, a stoi za nimi.
  // Pozycja z innej ścieżki (pytanie o pierwszą ocenę → Q&A o okresowej) nie trafia do kontekstu.
  // Istotność słów oceniamy na dużym indeksie dokumentów – w kilkunastu pozycjach Q&A nawet „rozmowa” byłaby „częsta”.
  const zQa = indeksQa
    .szukaj(pytanie, { limit: 20, waga, istotne: (t) => indeks.idf(t) > 1 })
    .filter((t) => t.pokrycie >= MIN_POKRYCIE_QA && (!cel || t.item.rodzaj === cel || t.item.rodzaj === "wspolne"))
    .slice(0, MAX_QA);

  return {
    fragmenty: [...fragmenty, ...zQa],
    pokrycie: Math.max(0, ...fragmenty.slice(0, 3).map((t) => t.pokrycie), ...zQa.map((t) => t.pokrycie)),
  };
}
