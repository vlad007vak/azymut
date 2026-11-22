"use client";

import { PRZELOZONY_DEMO } from "@/data/demo";
import { uprawnieniaDoOceny, type UprawnieniaOceny } from "@/lib/ocena/uprawnienia";
import type { Ocena } from "@/types/ocena";

import { useRola } from "./use-rola";

/**
 * Uprawnienia bieżącej roli demonstracyjnej do treści tej oceny – używają ich kreator oceny i asystent rozmowy
 * (reguły w jednym miejscu: `src/lib/ocena/uprawnienia.ts`).
 */
export function useUprawnieniaOceny(ocena: Ocena): UprawnieniaOceny {
  const { rola } = useRola();
  return uprawnieniaDoOceny(rola, ocena, PRZELOZONY_DEMO);
}
