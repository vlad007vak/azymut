"use client";

import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  CalendarDaysIcon,
  CheckIcon,
  LockIcon,
  UserRoundCheckIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { NaglowekStrony } from "@/components/naglowek-strony";
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
    <div aria-busy="true">
      <span className="sr-only">Wczytywanie oceny…</span>
      <div className="dark bg-background print:hidden">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-10">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export function KreatorOceny({ ocenaId }: { ocenaId: string }) {
  const poHydracji = usePoHydracji();
  const ocena = useOcena(ocenaId);

  if (!poHydracji) return <LadowanieKreatora />;
  if (!ocena) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
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
      </div>
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
  const nrAktywnego = KROKI.findIndex((x) => x.id === krok);

  return (
    <>
      <NaglowekStrony
        ikona={ocena.rodzaj === "okresowa" ? CalendarDaysIcon : UserRoundCheckIcon}
        nadtytul={
          <>
            {ocena.rodzaj === "okresowa" ? "Ocena okresowa w służbie cywilnej" : "Pierwsza ocena w służbie cywilnej"}
            {ocena.arkusz ? ` · arkusz ${ocena.arkusz}` : ""}
          </>
        }
        tytul={osoba ? `${osoba.imie} ${osoba.nazwisko}` : "Pracownik"}
        opis={osoba ? `${osoba.stanowisko} · ${osoba.komorka}` : undefined}
        powrot={
          <Link
            href="/"
            className="flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeftIcon className="size-4" aria-hidden /> Wróć do listy ocen
          </Link>
        }
        akcje={
          <div className="grid min-w-56 gap-2 rounded-xl border bg-card/60 px-4 py-3 text-sm">
            <Badge variant="secondary" className="w-fit">
              {nazwaEtapu(ocena.etap)}
            </Badge>
            <span className="text-muted-foreground">
              Okres oceny: {data(ocena.okres.od)} – {data(ocena.okres.do)}
            </span>
            <span className="text-muted-foreground">Termin: {data(ocena.terminOceny)}</span>
          </div>
        }
        className="pb-8"
      />

      <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-8">
        <nav aria-label="Kroki oceny" className="relative -mt-8 rounded-xl border bg-card px-2 py-4 shadow-md print:hidden">
          <ol className="grid grid-cols-5">
            {KROKI.map((k, i) => {
              const dostepny = krokDostepny(k.id, ocena.etap);
              const aktywny = k.id === krok;
              const zrobiony = dostepny && i < nrAktywnego;
              return (
                <li key={k.id} className="relative">
                  {/* Linia łącząca z poprzednim krokiem */}
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2",
                        i <= nrAktywnego && dostepny ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                  <button
                    type="button"
                    disabled={!dostepny}
                    onClick={() => przejdz(k.id)}
                    aria-current={aktywny ? "step" : undefined}
                    className={cn(
                      "group relative flex w-full flex-col items-center gap-2 rounded-lg px-2 pb-1 text-center text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                      !dostepny && "cursor-not-allowed",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                        aktywny && "border-primary bg-primary text-primary-foreground ring-4 ring-primary/15",
                        zrobiony && "border-primary bg-card text-primary",
                        !aktywny && !zrobiony && dostepny && "border-border bg-card text-foreground group-hover:border-primary/60",
                        !dostepny && "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {!dostepny ? <LockIcon className="size-3.5" /> : zrobiony ? <CheckIcon className="size-4" /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "leading-snug",
                        aktywny && "font-semibold text-foreground",
                        !aktywny && dostepny && "text-foreground/80 group-hover:text-foreground",
                        !dostepny && "text-muted-foreground",
                      )}
                    >
                      {k.nazwa(ocena.rodzaj)}
                    </span>
                    {aktywny && <span aria-hidden className="h-0.5 w-8 rounded-full bg-brand" />}
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
    </>
  );
}
