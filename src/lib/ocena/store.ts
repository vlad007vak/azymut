/**
 * Magazyn ocen w PRZEGLĄDARCE (localStorage) – prototyp bez bazy danych:
 * dane pracowników nie opuszczają komputera użytkownika (minimalizacja danych).
 * Docelowo: API + baza w infrastrukturze urzędu (patrz README → architektura).
 *
 * Używaj tylko w komponentach klienckich ("use client").
 */
import { useSyncExternalStore } from "react";

import { OCENY_DEMO, PRACOWNICY } from "@/data/demo";
import type { Id } from "@/types";
import type { Ocena, Pracownik } from "@/types/ocena";

const KEY = "azymut:oceny:v1";
const EVENT = "azymut:oceny";

let cacheRaw: string | null | undefined;
let cache: Ocena[] = OCENY_DEMO;

function read(): Ocena[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return cache;
  }
  if (raw === cacheRaw) return cache;
  cacheRaw = raw;
  try {
    cache = raw ? (JSON.parse(raw) as Ocena[]) : OCENY_DEMO;
  } catch {
    cache = OCENY_DEMO;
  }
  return cache;
}

function write(oceny: Ocena[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(oceny));
  } catch {
    // tryb prywatny / brak miejsca – trzymamy tylko w pamięci
    cacheRaw = undefined;
    cache = oceny;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/** Wszystkie oceny (reaktywnie). Na serwerze / przy hydracji zwraca dane demo. */
export function useOceny(): Ocena[] {
  return useSyncExternalStore(subscribe, read, () => OCENY_DEMO);
}

export function useOcena(id: Id): Ocena | undefined {
  return useOceny().find((o) => o.id === id);
}

export function pobierzOceny(): Ocena[] {
  return read();
}

export function pobierzOcene(id: Id): Ocena | undefined {
  return read().find((o) => o.id === id);
}

/** Dodaje albo podmienia ocenę (po id) i ustawia `zmieniono`. */
export function zapiszOcene(ocena: Ocena): void {
  const teraz = new Date().toISOString();
  const nowa = { ...ocena, zmieniono: teraz };
  const lista = read();
  const i = lista.findIndex((o) => o.id === ocena.id);
  write(i === -1 ? [...lista, nowa] : lista.map((o, j) => (j === i ? nowa : o)));
}

export function usunOcene(id: Id): void {
  write(read().filter((o) => o.id !== id));
}

/** Przywraca dane demonstracyjne (przycisk „Resetuj dane demo”). */
export function resetujDemo(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignorujemy
  }
  cacheRaw = undefined;
  cache = OCENY_DEMO;
  window.dispatchEvent(new Event(EVENT));
}

export function nowyId(): Id {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function pracownik(id: Id): Pracownik | undefined {
  return PRACOWNICY.find((p) => p.id === id);
}

export { PRACOWNICY };
