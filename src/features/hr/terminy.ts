/**
 * Terminy procesów oceny – czyste funkcje (bez UI).
 * Termin bierzemy wyłącznie z pola `terminOceny` (nie liczymy go z przepisów).
 */
import type { Ocena } from "@/types/ocena";

/** Termin „zbliża się”, gdy zostało tyle dni albo mniej. */
export const DNI_OSTRZEZENIA = 7;

const DZIEN_MS = 24 * 60 * 60 * 1000;

/** Dzisiejsza data w strefie użytkownika jako ISO yyyy-mm-dd. */
export function dzisiajIso(teraz: Date = new Date()): string {
  const r = teraz.getFullYear();
  const m = String(teraz.getMonth() + 1).padStart(2, "0");
  const d = String(teraz.getDate()).padStart(2, "0");
  return `${r}-${m}-${d}`;
}

function naDzien(iso: string): number {
  const [r, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Date.UTC(r, m - 1, d);
}

/** Liczba dni od `dzis` do `termin` (ujemna = po terminie). Obie daty ISO yyyy-mm-dd. */
export function dniDoTerminu(termin: string, dzis: string): number {
  return Math.round((naDzien(termin) - naDzien(dzis)) / DZIEN_MS);
}

export type StatusTerminu = "zakonczona" | "po-terminie" | "zbliza-sie" | "w-terminie";

export function statusTerminu(ocena: Ocena, dzis: string): StatusTerminu {
  if (ocena.etap === "zakonczona") return "zakonczona";
  const dni = dniDoTerminu(ocena.terminOceny, dzis);
  if (dni < 0) return "po-terminie";
  if (dni <= DNI_OSTRZEZENIA) return "zbliza-sie";
  return "w-terminie";
}

/** „1 dzień”, „2 dni”, „5 dni”. */
export function dniTekst(n: number): string {
  return Math.abs(n) === 1 ? `${n} dzień` : `${n} dni`;
}

/** „został 1 dzień”, „zostały 3 dni”, „zostało 12 dni” (poprawna odmiana). */
function zostaloTekst(n: number): string {
  if (n === 1) return "został 1 dzień";
  const j = n % 10;
  const d = n % 100;
  if (j >= 2 && j <= 4 && (d < 12 || d > 14)) return `zostały ${n} dni`;
  return `zostało ${n} dni`;
}

/** Opis czasu do terminu do tabeli i szczegółów. */
export function opisTerminu(ocena: Ocena, dzis: string): string {
  if (ocena.etap === "zakonczona") return "Proces zakończony";
  const dni = dniDoTerminu(ocena.terminOceny, dzis);
  if (dni === 0) return "Termin dziś";
  if (dni < 0) return `Po terminie ${dniTekst(-dni)}`;
  const t = zostaloTekst(dni);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Kolejność w tabeli: po terminie → najbliższe terminy → zakończone na końcu. */
export function porownajPilnosc(a: Ocena, b: Ocena): number {
  const za = a.etap === "zakonczona" ? 1 : 0;
  const zb = b.etap === "zakonczona" ? 1 : 0;
  if (za !== zb) return za - zb;
  if (za === 1) return b.terminOceny.localeCompare(a.terminOceny);
  return a.terminOceny.localeCompare(b.terminOceny);
}

const fmtData = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDataCzas = new Intl.DateTimeFormat("pl-PL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

/** ISO yyyy-mm-dd → „15.12.2026” (bez przesunięć strefy czasowej). */
export function formatujDate(iso: string | undefined): string {
  if (!iso) return "—";
  const [r, m, d] = iso.slice(0, 10).split("-").map(Number);
  return fmtData.format(new Date(r, m - 1, d));
}

/** Pełny znacznik czasu ISO → „21.11.2026, 11:00” (czas lokalny). */
export function formatujDateCzas(iso: string): string {
  return fmtDataCzas.format(new Date(iso));
}
