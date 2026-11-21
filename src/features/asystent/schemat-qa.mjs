/**
 * Schemat bazy pytań i odpowiedzi (Q&A), którą urząd może podmienić bez programowania.
 * Plik .mjs (a nie .ts), bo korzystają z niego i aplikacja (baza.ts – walidacja przy buildzie),
 * i skrypt `scripts/baza-wiedzy/qa-z-csv.mjs` uruchamiany zwykłym Node. Opis formatu: docs/BAZA-WIEDZY.md.
 */
import { z } from "zod";

/** Ścieżka pliku bazy w repozytorium (do komunikatów). */
export const PLIK_QA = "src/data/baza-wiedzy/pytania-odpowiedzi.json";

/**
 * @param {string} pole
 * @param {number} max
 */
function tekst(pole, max) {
  return z
    .string({
      error: (iss) => (iss.input === undefined ? `brak pola „${pole}”` : `pole „${pole}” musi być tekstem`),
    })
    .trim()
    .min(1, `pole „${pole}” nie może być puste`)
    .max(max, `pole „${pole}” jest za długie (najwyżej ${max} znaków)`);
}

const pozycja = z.object(
  {
    id: tekst("id", 40).regex(
      /^[\p{L}\p{N}._-]+$/u,
      "pole „id” może zawierać tylko litery, cyfry, kropkę, myślnik i podkreślenie (np. qa-001)",
    ),
    pytanie: tekst("pytanie", 500),
    odpowiedz: tekst("odpowiedz", 3000),
    zrodlo: tekst("zrodlo", 300),
    rodzaj: z.enum(["pierwsza", "okresowa", "wspolne"], {
      error: (iss) =>
        iss.input === undefined
          ? "brak pola „rodzaj”"
          : "pole „rodzaj” musi mieć wartość: pierwsza, okresowa albo wspolne",
    }),
  },
  { error: "pozycja musi być obiektem z polami id, pytanie, odpowiedz, zrodlo, rodzaj" },
);

export const schematQa = z
  .object(
    {
      nazwa: tekst("nazwa", 150),
      wersja: z.literal(1, { error: "pole „wersja” musi mieć wartość 1" }),
      pozycje: z
        .array(pozycja, {
          error: (iss) => (iss.input === undefined ? "brak pola „pozycje”" : "pole „pozycje” musi być listą pytań"),
        })
        .min(1, "baza musi zawierać co najmniej jedno pytanie")
        .max(5000, "baza może zawierać najwyżej 5000 pytań"),
    },
    { error: "plik musi zawierać obiekt z polami nazwa, wersja, pozycje" },
  )
  .superRefine((baza, ctx) => {
    /** @type {Map<string, number>} */
    const widziane = new Map();
    baza.pozycje.forEach((p, i) => {
      const klucz = p.id.toLowerCase();
      const wczesniej = widziane.get(klucz);
      if (wczesniej === undefined) widziane.set(klucz, i);
      else
        ctx.addIssue({
          code: "custom",
          path: ["pozycje", i, "id"],
          message: `identyfikator „${p.id}” powtarza się (pierwszy raz w pozycji nr ${wczesniej + 1})`,
        });
    });
  });

/**
 * Sprawdza dane bazy Q&A. Zwraca bazę albo listę błędów po polsku.
 * @param {unknown} dane
 * @param {(indeks: number) => string} [etykieta] opis pozycji w komunikacie (np. wiersz pliku CSV)
 */
export function sprawdzBazeQa(dane, etykieta) {
  const wynik = schematQa.safeParse(dane);
  if (wynik.success) return /** @type {const} */ ({ ok: true, baza: wynik.data, bledy: [] });

  const pozycje = dane && typeof dane === "object" && "pozycje" in dane && Array.isArray(dane.pozycje) ? dane.pozycje : [];
  const opisz =
    etykieta ??
    ((/** @type {number} */ i) => {
      const id = pozycje[i] && typeof pozycje[i] === "object" ? pozycje[i].id : undefined;
      return `pozycja nr ${i + 1}${typeof id === "string" && id ? ` (id „${id}”)` : ""}`;
    });
  const bledy = wynik.error.issues.slice(0, 20).map((iss) => {
    const [pierwszy, indeks] = iss.path;
    return pierwszy === "pozycje" && typeof indeks === "number" ? `${opisz(indeks)}: ${iss.message}` : iss.message;
  });
  if (wynik.error.issues.length > 20) bledy.push(`…i ${wynik.error.issues.length - 20} kolejnych błędów`);
  return /** @type {const} */ ({ ok: false, baza: null, bledy });
}
