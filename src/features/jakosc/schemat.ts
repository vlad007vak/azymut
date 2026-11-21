import { z } from "zod";

import { MODEL } from "@/lib/ocena/model";
import type { KompetencjaId } from "@/types/ocena";

const ID_KOMPETENCJI = new Set<string>(MODEL.kompetencje.map((k) => k.id));

export const czyKompetencja = (v: unknown): v is KompetencjaId => typeof v === "string" && ID_KOMPETENCJI.has(v);

const kompetencjaId = z.custom<KompetencjaId>(czyKompetencja, "Nieznana kompetencja.");
const poziom = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
const tekst = (max: number) => z.string().trim().max(max, `Tekst jest za długi (max ${max} znaków).`);

/**
 * Wejście POST /api/jakosc – celowo BEZ imion i nazwisk (minimalizacja danych):
 * tylko rodzaj oceny, stanowisko, kryteria z wybranymi zachowaniami i przykładami, uzasadnienie, wnioski.
 */
export const zapytanieJakosciSchema = z.object({
  rodzaj: z.enum(["pierwsza", "okresowa"]),
  stanowisko: tekst(200).optional(),
  kryteria: z
    .array(
      z.object({
        kompetencjaId,
        /** Ostateczny poziom wybrany przez przełożonego (jeśli już jest). */
        decyzja: poziom.optional(),
        /** Sugestia systemu z wybranych zachowań (gdy brak decyzji). */
        sugestia: poziom.nullable().optional(),
        wskazniki: z
          .array(
            z.object({
              id: z.string().max(60),
              /** Wybrane zachowanie; null = brak podstaw do oceny. */
              poziom: poziom.nullable(),
              przyklad: tekst(1500).optional(),
            }),
          )
          .max(12),
      }),
    )
    .min(1, "Ocena nie ma jeszcze kryteriów do sprawdzenia.")
    .max(10),
  uzasadnienie: tekst(4000).optional(),
  wnioskiRozwojowe: tekst(4000).optional(),
});

export type ZapytanieJakosci = z.infer<typeof zapytanieJakosciSchema>;
