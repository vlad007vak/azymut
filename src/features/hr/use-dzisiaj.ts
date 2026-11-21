"use client";

import { useSyncExternalStore } from "react";

import { dzisiajIso } from "./terminy";

const brakSubskrypcji = () => () => {};

/**
 * Dzisiejsza data (ISO yyyy-mm-dd) – tylko w przeglądarce.
 * Na serwerze / przy hydracji zwraca null: dane ocen leżą w localStorage, a „dziś”
 * zależy od strefy użytkownika, więc tabelę renderujemy dopiero po stronie klienta.
 */
export function useDzisiaj(): string | null {
  return useSyncExternalStore(brakSubskrypcji, () => dzisiajIso(), () => null);
}
