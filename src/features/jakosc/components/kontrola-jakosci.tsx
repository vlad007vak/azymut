"use client";

import { AlertTriangleIcon, CheckCircle2Icon, ClipboardCheckIcon, Loader2Icon, RotateCcwIcon, ShieldCheckIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { kompetencja, MODEL } from "@/lib/ocena/model";
import { cn } from "@/lib/utils";
import type { KompetencjaId, Ocena } from "@/types/ocena";

import type { PoleUwagi, TypUwagi, UwagaJakosci, WynikKontroli } from "../typy";
import { zapytanieZOceny } from "../zapytanie";

const ETYKIETA: Record<TypUwagi, string> = {
  ogolnik: "Ogólnik",
  "ocena-osoby": "Ocena osoby zamiast zachowania",
  niespojnosc: "Niespójność z poziomem",
  "brak-przykladu": "Brak przykładu",
  "ryzyko-stronniczosci": "Ryzyko stronniczości",
};

const GDZIE: Record<PoleUwagi, string> = {
  przyklad: "w przykładzie",
  uzasadnienie: "w uzasadnieniu",
  wnioski: "we wnioskach rozwojowych",
};

/** Wskazówka organizatora (model kompetencji): przykłady = sytuacja, działanie, rezultat. */
const WSKAZOWKA = MODEL.wskazowki[1];

export interface KontrolaJakosciProps {
  ocena: Ocena;
  className?: string;
}

/**
 * „Kontrola jakości uzasadnienia” – przed sporządzeniem oceny przełożony prosi o wskazanie słabych miejsc
 * w przykładach i uzasadnieniu. AI tylko podpowiada, co doprecyzować – nie zmienia poziomów ani treści.
 */
export function KontrolaJakosci({ ocena, className }: KontrolaJakosciProps) {
  const { zapytanie, zmieniono } = useMemo(() => zapytanieZOceny(ocena), [ocena]);
  const klucz = useMemo(() => JSON.stringify(zapytanie), [zapytanie]);
  const [wynik, setWynik] = useState<{ dane: WynikKontroli; klucz: string } | null>(null);
  const [laduje, setLaduje] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function sprawdz() {
    if (laduje) return;
    if (zapytanie.kryteria.length === 0) {
      toast.error("Ocena nie ma jeszcze kryteriów do sprawdzenia.");
      return;
    }
    setLaduje(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch("/api/jakosc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: klucz,
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error ?? "Nie udało się sprawdzić uzasadnienia.");
      const dane = data as WynikKontroli;
      setWynik({ dane: { ...dane, zanonimizowano: dane.zanonimizowano || zmieniono }, klucz });
    } catch (err) {
      if (controller.signal.aborted) return;
      // Bez sieci fetch rzuca TypeError z angielskim komunikatem przeglądarki („Failed to fetch”).
      toast.error(
        err instanceof TypeError
          ? "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie."
          : err instanceof Error
            ? err.message
            : "Wystąpił nieznany błąd.",
      );
    } finally {
      setLaduje(false);
      abortRef.current = null;
    }
  }

  const nieaktualny = !!wynik && wynik.klucz !== klucz;

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="grid max-w-2xl gap-1">
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheckIcon className="size-5" aria-hidden />
            Kontrola jakości uzasadnienia
          </CardTitle>
          <CardDescription>
            Przed sporządzeniem oceny sprawdź przykłady i uzasadnienie: ogólniki bez konkretów, oceny osoby zamiast zachowań,
            rozbieżności z wybranym poziomem, kryteria bez przykładów i sformułowania mogące świadczyć o stronniczości.
          </CardDescription>
        </div>
        <Button onClick={sprawdz} disabled={laduje} variant={wynik && !nieaktualny ? "outline" : "default"}>
          {laduje ? (
            <Loader2Icon className="animate-spin" data-icon="inline-start" aria-hidden />
          ) : wynik ? (
            <RotateCcwIcon data-icon="inline-start" aria-hidden />
          ) : (
            <ClipboardCheckIcon data-icon="inline-start" aria-hidden />
          )}
          {laduje ? "Sprawdzam…" : wynik ? "Sprawdź ponownie" : "Sprawdź uzasadnienie"}
        </Button>
      </CardHeader>

      <CardContent className="grid gap-4">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheckIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            <strong className="font-medium text-foreground">AI podpowiada – nie ocenia.</strong> Nie zmienia poziomów ani treści
            oceny – decyzja należy do przełożonego. Do AI nie wysyłamy imion i nazwisk. AI może się mylić – traktuj uwagi jako
            wskazówki.
          </span>
        </p>

        <div aria-live="polite" aria-busy={laduje} className="grid gap-4">
          {laduje && !wynik && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden /> Sprawdzam przykłady i uzasadnienie…
            </p>
          )}
          {wynik && <Wyniki dane={wynik.dane} ocena={ocena} nieaktualny={nieaktualny} />}
        </div>
      </CardContent>
    </Card>
  );
}

function Wyniki({ dane, ocena, nieaktualny }: { dane: WynikKontroli; ocena: Ocena; nieaktualny: boolean }) {
  const grupy: { id: KompetencjaId | "ogolne"; tytul: string; uwagi: UwagaJakosci[] }[] = [
    ...ocena.kryteria.map((k) => ({
      id: k.kompetencjaId,
      tytul: kompetencja(k.kompetencjaId).nazwa,
      uwagi: dane.uwagi.filter((u) => u.kompetencjaId === k.kompetencjaId),
    })),
    {
      id: "ogolne" as const,
      tytul: "Uzasadnienie i wnioski",
      uwagi: dane.uwagi.filter((u) => !u.kompetencjaId || !ocena.kryteria.some((k) => k.kompetencjaId === u.kompetencjaId)),
    },
  ].filter((g) => g.uwagi.length > 0);

  return (
    <>
      {nieaktualny && (
        <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangleIcon className="size-4 shrink-0" aria-hidden />
          Treść oceny zmieniła się od ostatniego sprawdzenia – kliknij „Sprawdź ponownie”.
        </p>
      )}
      {dane.aiNiedostepne && (
        <div className="flex gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            Analiza AI jest chwilowo niedostępna (limit darmowych modeli) – pokazuję tylko sprawdzenia automatyczne. Spróbuj
            ponownie za chwilę.
          </p>
        </div>
      )}

      {dane.uwagi.length === 0 ? (
        <div
          role="status"
          className="flex gap-2.5 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
        >
          <CheckCircle2Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Nie znaleziono uwag</p>
            <p className="mt-0.5 leading-relaxed">{dane.podsumowanie}</p>
          </div>
        </div>
      ) : (
        <>
          <p role="status" className="text-sm font-medium">
            {dane.podsumowanie}
          </p>
          <div className={cn("grid gap-4", nieaktualny && "opacity-60")}>
            {grupy.map((g) => (
              <section key={g.id} aria-label={g.tytul} className="grid gap-2">
                <h4 className="text-sm font-semibold">
                  {g.tytul} <span className="font-normal text-muted-foreground">({g.uwagi.length})</span>
                </h4>
                <ul className="grid gap-2">
                  {g.uwagi.map((u, i) => (
                    <Uwaga key={`${u.typ}-${u.cytat ?? ""}-${i}`} uwaga={u} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Wskazówka z modelu kompetencji: {WSKAZOWKA}</p>
        </>
      )}
      {dane.zanonimizowano && (
        <p className="text-xs text-muted-foreground">Imiona i nazwiska wykryte w tekście zastąpiono „[osoba]” przed wysłaniem do AI.</p>
      )}
    </>
  );
}

function Uwaga({ uwaga }: { uwaga: UwagaJakosci }) {
  return (
    <li className="grid gap-1.5 rounded-md border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={uwaga.typ === "ryzyko-stronniczosci" ? "destructive" : "secondary"}>{ETYKIETA[uwaga.typ]}</Badge>
        {uwaga.pole && uwaga.cytat && <span className="text-xs text-muted-foreground">{GDZIE[uwaga.pole]}</span>}
        <span className="ml-auto text-xs text-muted-foreground">{uwaga.zrodlo === "ai" ? "podpowiedź AI" : "sprawdzenie automatyczne"}</span>
      </div>
      {uwaga.cytat && (
        <blockquote className="border-l-2 border-primary/60 pl-2.5 leading-relaxed text-foreground">„{uwaga.cytat}”</blockquote>
      )}
      <p className="leading-relaxed text-muted-foreground">{uwaga.sugestia}</p>
    </li>
  );
}
