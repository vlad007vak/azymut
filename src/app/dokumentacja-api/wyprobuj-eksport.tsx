"use client";

import { useId, useMemo, useState } from "react";

import { Label } from "@/components/ui/label";
import { eksportujOcene, PrzyciskEksportu } from "@/features/eksport";
import { pracownik, useOceny } from "@/lib/ocena/store";
import { nazwaEtapu } from "@/lib/ocena/zasady";
import type { Ocena } from "@/types/ocena";

import { BlokKodu } from "./skladniki";

function etykieta(o: Ocena): string {
  const p = pracownik(o.pracownikId);
  const rodzaj = o.rodzaj === "okresowa" ? `ocena okresowa (arkusz ${o.arkusz ?? "—"})` : "pierwsza ocena";
  return `${o.id} – ${p?.stanowisko ?? "stanowisko nieznane"}, ${rodzaj} – etap: ${nazwaEtapu(o.etap).toLowerCase()}`;
}

/** Eksport dowolnej oceny zapisanej w tej przeglądarce – ten sam przycisk, który trafia do kroku „Dokument”. */
export function WyprobujEksport() {
  const oceny = useOceny();
  const [wybrana, setWybrana] = useState("o1");
  // Podgląd liczymy dopiero po otwarciu (w przeglądarce) – eksport zawiera bieżącą datę wygenerowania.
  const [otwarty, setOtwarty] = useState(false);
  const idPola = useId();
  const ocena = oceny.find((o) => o.id === wybrana) ?? oceny[0];

  const podglad = useMemo(() => {
    if (!ocena || !otwarty) return undefined;
    try {
      return eksportujOcene(ocena);
    } catch {
      return null;
    }
  }, [ocena, otwarty]);

  if (!ocena) return <p className="text-sm text-muted-foreground">Brak ocen zapisanych w tej przeglądarce.</p>;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-0 flex-1 gap-1.5">
          <Label htmlFor={idPola}>Ocena</Label>
          <select
            id={idPola}
            value={ocena.id}
            onChange={(e) => setWybrana(e.target.value)}
            className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {oceny.map((o) => (
              <option key={o.id} value={o.id}>
                {etykieta(o)}
              </option>
            ))}
          </select>
        </div>
        <PrzyciskEksportu ocena={ocena} />
      </div>
      <details className="grid gap-2" onToggle={(e) => setOtwarty(e.currentTarget.open)}>
        <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          Podgląd pliku dla oceny {ocena.id}
        </summary>
        {podglad === null ? (
          <p className="text-sm text-destructive">Nie udało się przygotować podglądu tej oceny.</p>
        ) : (
          podglad && <BlokKodu wartosc={podglad} etykieta={`Podgląd eksportu oceny ${ocena.id}`} />
        )}
      </details>
    </div>
  );
}
