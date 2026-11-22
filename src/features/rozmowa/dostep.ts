"use client";

import { useRola, useUprawnieniaOceny } from "@/features/role";
import type { Ocena } from "@/types/ocena";

export interface DostepRozmowy {
  /** Czy można przygotowywać plan i zapisywać notatki w ocenie. */
  edycja: boolean;
  /** Dlaczego tylko podgląd – null przy edycji. */
  powod: string | null;
  /** false na serwerze i podczas hydracji (rola z cookie jest znana dopiero w przeglądarce). */
  gotowe: boolean;
}

/**
 * Uprawnienia w asystencie rozmowy – decyzja według wspólnych zasad `useUprawnieniaOceny`
 * (`src/lib/ocena/uprawnienia.ts`: HR tylko przegląda, przełożony edytuje oceny swoich pracowników,
 * bez wybranej roli – jak przełożony demonstracyjny). Tu dochodzi tylko komunikat dla roli HR
 * dopasowany do tego ekranu i `gotowe` (do czasu odczytu roli nie pokazujemy pól edycji).
 * Prototyp: rola jest w cookie przeglądarki, to nie jest autoryzacja serwerowa.
 */
export function useDostepRozmowy(ocena: Ocena): DostepRozmowy {
  const { rola, gotowe } = useRola();
  const { edycja, powod } = useUprawnieniaOceny(ocena);
  if (!gotowe) return { edycja: false, powod: null, gotowe: false };
  if (edycja) return { edycja: true, powod: null, gotowe: true };
  return {
    edycja: false,
    powod:
      rola === "hr"
        ? "Jesteś w roli HR: widzisz kryteria, listę kontrolną i zapisane notatki, ale rozmowę przygotowuje i notatki zapisuje przełożony."
        : (powod ?? null),
    gotowe: true,
  };
}
