import "server-only";

import baza from "@/data/baza-wiedzy/fragmenty.json";
import { MODEL } from "@/lib/ocena/model";
import type { RodzajOceny } from "@/types/ocena";

import { Bm25, bezPolskichZnakow, type Trafienie } from "./wyszukiwanie";

export interface Fragment {
  id: string;
  dokumentId: string;
  /** Pełna nazwa dokumentu – trafia do źródła odpowiedzi. */
  dokument: string;
  miejsce: string;
  rodzaj: RodzajOceny | "wspolne";
  typ: "ustawa" | "rozporzadzenie" | "poradnik" | "model";
  tekst: string;
  /** Tekst indeksowany przez wyszukiwarkę. */
  indeks: string;
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

export const FRAGMENTY: Fragment[] = [...zPdf(), ...zModelu()];

/** Lista dokumentów w bazie – do wyświetlenia użytkownikowi. */
export const DOKUMENTY_BAZY = [...baza.dokumenty.map((d) => d.nazwa), MODEL_DOKUMENT];

const indeks = new Bm25(FRAGMENTY);

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
  // szczegółowe paragrafy rozporządzeń i poradników. Dokładamy najwyżej 2, które same weszłyby do czołówki.
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
  const zUstawy = ustepy.filter((t) => t.wynik >= progUstawy).slice(0, 2);
  const fragmenty = [...wybrane, ...zUstawy].sort((a, b) => b.wynik - a.wynik);

  return {
    fragmenty,
    pokrycie: Math.max(0, ...fragmenty.slice(0, 3).map((t) => t.pokrycie)),
  };
}
