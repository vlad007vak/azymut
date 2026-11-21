import modelJson from "@/data/model-kompetencji.json";
import type {
  Kompetencja,
  KompetencjaId,
  ModelKompetencji,
  Poziom,
  PoziomId,
  Wskaznik,
} from "@/types/ocena";

/** Model kompetencji od organizatora (14 kompetencji, 49 wskaźników, 5 poziomów). */
export const MODEL = modelJson as ModelKompetencji;

export const POZIOMY: Poziom[] = MODEL.poziomy;

const byId = new Map(MODEL.kompetencje.map((k) => [k.id, k]));
const wskaznikById = new Map(
  MODEL.kompetencje.flatMap((k) => k.wskazniki.map((w) => [w.id, w] as const)),
);

export function kompetencja(id: KompetencjaId): Kompetencja {
  const k = byId.get(id);
  if (!k) throw new Error(`Nieznana kompetencja: ${id}`);
  return k;
}

export function wskaznik(id: string): Wskaznik | undefined {
  return wskaznikById.get(id);
}

/** Kompetencja, do której należy wskaźnik (id wskaźnika = "<kompetencjaId>-<nr>"). */
export function kompetencjaWskaznika(wskaznikId: string): Kompetencja | undefined {
  const k = MODEL.kompetencje.find((k) => wskaznikId.startsWith(`${k.id}-`));
  return k;
}

export function poziom(id: PoziomId): Poziom {
  return POZIOMY[id - 1];
}

export function nazwaPoziomu(id: PoziomId): string {
  return poziom(id).nazwa;
}
