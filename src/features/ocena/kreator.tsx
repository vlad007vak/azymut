"use client";

import { AlertTriangleIcon, CheckIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { pracownik as znajdzPracownika, useOcena, zapiszOcene } from "@/lib/ocena/store";
import { nazwaEtapu } from "@/lib/ocena/zasady";
import { cn } from "@/lib/utils";
import type { Ocena } from "@/types/ocena";

import { KrokDecyzja } from "./krok-decyzja";
import { KrokDokument } from "./krok-dokument";
import { KrokObserwacje } from "./krok-obserwacje";
import { KrokPrzygotowanie } from "./krok-przygotowanie";
import { KrokRozmowa } from "./krok-rozmowa";
import { data, krokDostepny, KROKI, krokStartowy, uzupelnijOcene, type KrokId } from "./logika";

export interface KrokProps {
  ocena: Ocena;
  /** Zmiana oceny – zapis od razu w magazynie (localStorage). */
  zmien: (fn: (o: Ocena) => Ocena) => void;
  przejdz: (k: KrokId) => void;
}

const pusta = () => () => {};
function usePoHydracji() {
  return useSyncExternalStore(pusta, () => true, () => false);
}

export function LadowanieKreatora() {
  return (
    <div className="grid gap-4" aria-busy="true">
      <span className="sr-only">Wczytywanie oceny…</span>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export function KreatorOceny({ ocenaId }: { ocenaId: string }) {
  const poHydracji = usePoHydracji();
  const ocena = useOcena(ocenaId);

  if (!poHydracji) return <LadowanieKreatora />;
  if (!ocena) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Nie znaleziono oceny</AlertTitle>
        <AlertDescription>
          <p>Nie ma oceny o identyfikatorze „{ocenaId}”.</p>
          <p>
            <Link href="/">Wróć do listy ocen</Link>
          </p>
        </AlertDescription>
      </Alert>
    );
  }
  return <Kreator key={ocena.id} ocena={ocena} />;
}

function Kreator({ ocena }: { ocena: Ocena }) {
  const [krok, setKrok] = useState<KrokId>(() => krokStartowy(ocena.etap));
  const osoba = znajdzPracownika(ocena.pracownikId);

  // Proces z Panelu HR może nie mieć kryteriów / danych pierwszej oceny – uzupełniamy raz.
  useEffect(() => {
    const uzup = uzupelnijOcene(ocena);
    if (uzup) zapiszOcene(uzup);
  }, [ocena]);

  const zmien = (fn: (o: Ocena) => Ocena) => zapiszOcene(fn(ocena));
  const przejdz = (k: KrokId) => {
    setKrok(k);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const props: KrokProps = { ocena, zmien, przejdz };

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div className="grid gap-1">
          <p className="text-sm text-muted-foreground">
            {ocena.rodzaj === "okresowa" ? "Ocena okresowa w służbie cywilnej" : "Pierwsza ocena w służbie cywilnej"}
            {ocena.arkusz ? ` · arkusz ${ocena.arkusz}` : ""}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {osoba ? `${osoba.imie} ${osoba.nazwisko}` : "Pracownik"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {osoba ? `${osoba.stanowisko} · ${osoba.komorka}` : ""}
          </p>
        </div>
        <div className="grid justify-items-end gap-1 text-sm">
          <Badge variant="secondary">{nazwaEtapu(ocena.etap)}</Badge>
          <span className="text-muted-foreground">
            Okres oceny: {data(ocena.okres.od)} – {data(ocena.okres.do)}
          </span>
          <span className="text-muted-foreground">Termin: {data(ocena.terminOceny)}</span>
        </div>
      </header>

      <nav aria-label="Kroki oceny" className="print:hidden">
        <ol className="grid grid-cols-5 gap-2">
          {KROKI.map((k, i) => {
            const dostepny = krokDostepny(k.id, ocena.etap);
            const aktywny = k.id === krok;
            const nrAktywnego = KROKI.findIndex((x) => x.id === krok);
            const zrobiony = dostepny && i < nrAktywnego;
            return (
              <li key={k.id}>
                <button
                  type="button"
                  disabled={!dostepny}
                  onClick={() => przejdz(k.id)}
                  aria-current={aktywny ? "step" : undefined}
                  className={cn(
                    "flex h-full w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    aktywny && "border-primary bg-primary/5 font-medium",
                    !aktywny && dostepny && "hover:bg-muted",
                    !dostepny && "cursor-not-allowed opacity-50",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs",
                      aktywny && "border-primary bg-primary text-primary-foreground",
                      zrobiony && "border-primary text-primary",
                    )}
                    aria-hidden
                  >
                    {!dostepny ? <LockIcon className="size-3" /> : zrobiony ? <CheckIcon className="size-3" /> : i + 1}
                  </span>
                  <span>{k.nazwa(ocena.rodzaj)}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {krok === "przygotowanie" && <KrokPrzygotowanie {...props} />}
      {krok === "obserwacje" && <KrokObserwacje {...props} />}
      {krok === "rozmowa" && <KrokRozmowa {...props} />}
      {krok === "decyzja" && <KrokDecyzja {...props} />}
      {krok === "dokument" && <KrokDokument {...props} />}
    </div>
  );
}
