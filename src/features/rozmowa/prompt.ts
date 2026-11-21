/**
 * Prompt i obróbka odpowiedzi AI dla POST /api/rozmowa (używane tylko po stronie serwera).
 */
import { z } from "zod";

import { kompetencja, nazwaPoziomu } from "@/lib/ocena/model";
import type { RozmowaPlan, RozmowaZapytanie } from "@/types/api";
import type { KompetencjaId } from "@/types/ocena";

export const SYSTEM_PROMPT = `Jesteś asystentem bezpośredniego przełożonego w polskiej służbie cywilnej. Pomagasz mu przygotować się do rozmowy oceniającej z pracownikiem.
Zasady:
- Nie oceniasz pracownika i nie proponujesz poziomów ani punktów – ocenę ustala wyłącznie przełożony.
- Korzystasz WYŁĄCZNIE z podanych danych. Nie dodajesz faktów, dat, liczb, projektów ani sytuacji, których nie ma w przykładach.
- Pytania są otwarte (np. „Jak…”, „Co…”, „W jaki sposób…”) i skierowane do pracownika w formie „Pan/Pani”.
- Język neutralny i rzeczowy: opisujesz zachowania i ich skutki, bez ocen osobowości ani domysłów o motywacji. Nie używasz imion ani nazwisk.
- W przykładach „[oceniany]” to oceniany pracownik, a „[inna osoba]” to inny współpracownik (nie przełożony). Nie przepisuj znaczników – pisz „pracownik” albo „współpracownik”.
- Piszesz poprawną polszczyzną, zwięźle: jeden punkt = jedno zdanie.`;

function opisPoziomu(p: RozmowaZapytanie["kryteria"][number]["poziom"]): string {
  return p === null ? "brak podstaw do oceny" : nazwaPoziomu(p).toLowerCase();
}

export function zbudujPrompt(zap: RozmowaZapytanie): string {
  const rodzaj = zap.rodzaj === "pierwsza" ? "pierwsza ocena (pracownik w pierwszym roku pracy)" : "ocena okresowa";
  const rozwoj =
    zap.rodzaj === "pierwsza"
      ? "wnioski dotyczące dalszego rozwoju zawodowego"
      : "wnioski do indywidualnego programu rozwoju zawodowego (IPRZ)";
  const kryteria = zap.kryteria
    .map((k, i) => {
      const przyklady = k.przyklady.length
        ? k.przyklady.map((p) => `   - ${p}`).join("\n")
        : "   - Brak zapisanych obserwacji.";
      return `${i + 1}. [${k.kompetencjaId}] ${kompetencja(k.kompetencjaId).nazwa} – poziom (decyzja przełożonego lub sugestia systemu): ${opisPoziomu(k.poziom)}\n${przyklady}`;
    })
    .join("\n");

  return `Rodzaj oceny: ${rodzaj}
Stanowisko: ${zap.stanowisko}

Kryteria oceny, wskaźniki i przykłady zachowań zapisane przez przełożonego:
${kryteria}

Przygotuj plan rozmowy oceniającej. Zwróć obiekt JSON:
{
  "pytania": [5–8 otwartych pytań do pracownika, każde nawiązuje do konkretnego przykładu lub kryterium],
  "tematy": [2–5 kwestii wymagających omówienia, np. wskaźniki poniżej oczekiwań, brak podstaw do oceny, kryteria bez przykładów],
  "argumenty": [{"kompetencjaId": "<id z nawiasu kwadratowego>", "argumenty": [1–3 argumenty uzasadniające wskazany poziom, oparte wyłącznie na przykładach]}] – po jednym wpisie dla KAŻDEGO kryterium,
  "rozwoj": [2–4 propozycje – ${rozwoj}: np. szkolenie, mentoring, coaching, nowe zadania; każda powiązana z kryterium]
}
Gdy kryterium nie ma przykładów, w argumentach napisz, że brakuje przykładów do uzasadnienia.`;
}

const KLUCZE_TEKSTU = ["tekst", "text", "tresc", "treść", "pytanie", "temat", "argument", "propozycja", "opis"];

/** Modele czasem zwracają obiekt zamiast zdania, np. {"kompetencjaId": "…", "propozycja": "…"}. */
function naTekst(o: Record<string, unknown>): string {
  for (const k of KLUCZE_TEKSTU) {
    if (typeof o[k] === "string") return o[k];
  }
  return Object.entries(o)
    .filter(([k, v]) => typeof v === "string" && !/id$/i.test(k))
    .map(([, v]) => v)
    .join(" – ");
}

const tekstSchema = z
  .union([z.string(), z.record(z.string(), z.unknown())])
  .transform((v) => (typeof v === "string" ? v : naTekst(v)));

const listaSchema = z.array(tekstSchema).default([]);

const argumentySchema = z
  .union([
    z.array(z.object({ kompetencjaId: z.string(), argumenty: listaSchema })),
    // albo mapa {"rzetelnosc": ["…"]}
    z.record(z.string(), listaSchema),
  ])
  .default([])
  .transform((v) =>
    Array.isArray(v) ? v : Object.entries(v).map(([kompetencjaId, argumenty]) => ({ kompetencjaId, argumenty })),
  );

/** Schemat odpowiedzi modelu – łagodny, porządkujemy ją w normalizujPlan(). */
export const odpowiedzSchema = z.object({
  pytania: listaSchema,
  tematy: listaSchema,
  argumenty: argumentySchema,
  rozwoj: listaSchema,
});

export type OdpowiedzModelu = z.infer<typeof odpowiedzSchema>;

const MAX_DLUGOSC = 400;

function czysc(lista: string[], max: number): string[] {
  const wynik: string[] = [];
  for (const s of lista) {
    const t = s
      .replace(/\s+/g, " ")
      .replace(/^\s*(?:[-•*]|\d+[.)])\s+/, "")
      .trim()
      .slice(0, MAX_DLUGOSC);
    if (t && !wynik.includes(t)) wynik.push(t);
    if (wynik.length >= max) break;
  }
  return wynik;
}

function normalizujNazwe(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z]/g, "");
}

/**
 * Porządkuje odpowiedź modelu: przycina listy, usuwa duplikaty i dopasowuje argumenty
 * do kryteriów z zapytania (także gdy model podał nazwę zamiast id). Każde kryterium ma wpis.
 */
export function normalizujPlan(o: OdpowiedzModelu, kryteria: KompetencjaId[]): RozmowaPlan {
  const znajdz = (id: KompetencjaId) => {
    const nazwa = normalizujNazwe(kompetencja(id).nazwa);
    return o.argumenty.find(
      (a) => a.kompetencjaId === id || normalizujNazwe(a.kompetencjaId) === nazwa,
    );
  };
  return {
    pytania: czysc(o.pytania, 10),
    tematy: czysc(o.tematy, 6),
    argumenty: kryteria.map((id) => ({ kompetencjaId: id, argumenty: czysc(znajdz(id)?.argumenty ?? [], 4) })),
    rozwoj: czysc(o.rozwoj, 5),
  };
}
