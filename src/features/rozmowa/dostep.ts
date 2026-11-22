"use client";

import { opisRoli, useRola } from "@/features/role";
import type { Ocena, Osoba } from "@/types/ocena";

export interface DostepRozmowy {
  /** Czy można przygotowywać plan i zapisywać notatki w ocenie. */
  edycja: boolean;
  /** Dlaczego tylko podgląd – null przy edycji. */
  powod: string | null;
  /** false na serwerze i podczas hydracji (rola z cookie jest znana dopiero w przeglądarce). */
  gotowe: boolean;
}

function taSamaOsoba(a: Osoba, b: Osoba): boolean {
  return a.imie === b.imie && a.nazwisko === b.nazwisko && a.stanowisko === b.stanowisko;
}

/**
 * Uprawnienia roli demonstracyjnej w asystencie rozmowy: HR tylko przegląda, przełożony edytuje
 * oceny swoich pracowników, bez wybranej roli – jak przełożony demonstracyjny (jak dotąd).
 * Te same zasady proponujemy jako wspólne `dostepDoOceny` w `@/features/role` (ZMIANA WSPÓLNA w PR) –
 * po ich wdrożeniu ten hook zastąpi `useDostepDoOceny`.
 * Prototyp: rola jest w cookie przeglądarki, to nie jest autoryzacja serwerowa.
 */
export function useDostepRozmowy(ocena: Pick<Ocena, "oceniajacy">): DostepRozmowy {
  const { rola, gotowe } = useRola();
  if (!gotowe) return { edycja: false, powod: null, gotowe: false };
  if (rola === "hr") {
    return {
      edycja: false,
      powod: "Jesteś w roli HR: widzisz kryteria, listę kontrolną i zapisane notatki, ale rozmowę przygotowuje i notatki zapisuje przełożony.",
      gotowe: true,
    };
  }
  const przelozony = opisRoli("przelozony").osoba;
  if (przelozony && !taSamaOsoba(przelozony, ocena.oceniajacy)) {
    return { edycja: false, powod: "To ocena pracownika innego przełożonego – możesz ją tylko przeglądać.", gotowe: true };
  }
  return { edycja: true, powod: null, gotowe: true };
}
