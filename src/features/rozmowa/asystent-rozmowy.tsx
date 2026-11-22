"use client";

import {
  AlertTriangleIcon,
  ClipboardCopyIcon,
  ClipboardListIcon,
  InfoIcon,
  ListChecksIcon,
  Loader2Icon,
  type LucideIcon,
  MessagesSquareIcon,
  NotebookPenIcon,
  PrinterIcon,
  RefreshCwIcon,
  SaveIcon,
  SparklesIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useUprawnieniaOceny } from "@/features/role";
import { pobierzOcene, pracownik as znajdzPracownika, PRACOWNICY, useOcena, zapiszOcene } from "@/lib/ocena/store";
import { nazwaEtapu } from "@/lib/ocena/zasady";
import type { RozmowaPlan } from "@/types/api";
import type { Ocena } from "@/types/ocena";

import { ListaKontrolnaRozmowy } from "./lista-kontrolna";
import { LISTA_KONTROLNA } from "./lista-kontrolna-dane";
import { PlanRozmowy } from "./plan-rozmowy";
import { nazwaRodzaju, podsumujOcene, zbudujZapytanie } from "./podsumowanie";
import { PodsumowanieKryteriow } from "./podsumowanie-kryteriow";
import {
  liczWybrane,
  notatkiDoOceny,
  planDoSzkicu,
  wczytajSzkic,
  wnioskiDoOceny,
  zapiszSzkic,
  type SzkicRozmowy,
} from "./szkic";

const subskrypcjaPusta = () => () => {};

/** Ten sam identyfikator – kolejny komunikat zastępuje poprzedni zamiast piętrzyć toasty. */
const TOAST_AI = "rozmowa-ai";
const BLAD_OGOLNY = "Nie udało się przygotować planu rozmowy. Spróbuj ponownie.";

/** Widoczny fokus dla zwykłych linków tekstowych (przyciski mają go z komponentu). */
const FOKUS_LINKU ="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

/** Nagłówek sekcji w karcie: ikona + <h2> (redesign 21.11). */
function TytulKarty({ ikona: Ikona, children }: { ikona: LucideIcon; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
      <Ikona className="size-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
      <h2>{children}</h2>
    </CardTitle>
  );
}

/** false na serwerze i podczas hydracji, true po zamontowaniu w przeglądarce. */
function usePoHydracji(): boolean {
  return useSyncExternalStore(
    subskrypcjaPusta,
    () => true,
    () => false,
  );
}

/** Gdy Clipboard API jest zablokowane (np. w ramce) – stary sposób przez zaznaczenie tekstu. */
function kopiujAwaryjnie(tekst: string): boolean {
  const pole = document.createElement("textarea");
  pole.value = tekst;
  pole.setAttribute("readonly", "");
  pole.style.position = "fixed";
  pole.style.opacity = "0";
  document.body.appendChild(pole);
  pole.select();
  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    pole.remove();
  }
}

function formatujDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pl-PL");
}

export function LadowanieRozmowy() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Wczytywanie oceny…</span>
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

/**
 * Asystent rozmowy oceniającej dla jednej oceny: podsumowanie kryteriów, lista kontrolna z rozporządzenia,
 * plan rozmowy przygotowany przez AI (do edycji) i zapis wybranych punktów w ocenie.
 */
export function AsystentRozmowy({ ocenaId }: { ocenaId: string }) {
  const poHydracji = usePoHydracji();
  const ocena = useOcena(ocenaId);

  if (!poHydracji) return <LadowanieRozmowy />;
  if (!ocena) {
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Nie znaleziono oceny</AlertTitle>
        <AlertDescription>
          <p>
            Nie ma oceny o identyfikatorze „{ocenaId}”. Mogła zostać usunięta albo link jest niepełny.
          </p>
          <p>
            <Link href="/rozmowa" className={FOKUS_LINKU}>
              Wybierz ocenę z listy
            </Link>
          </p>
        </AlertDescription>
      </Alert>
    );
  }
  return <WidokRozmowy key={ocena.id} ocena={ocena} />;
}

type StanAi = { typ: "bezczynny" } | { typ: "ladowanie" } | { typ: "blad"; komunikat: string };

function WidokRozmowy({ ocena }: { ocena: Ocena }) {
  const osoba = znajdzPracownika(ocena.pracownikId);
  const kryteria = useMemo(() => podsumujOcene(ocena), [ocena]);
  // HR (i nie-oceniający) może przygotować plan dla siebie, ale nie zapisuje notatek ani wniosków w ocenie.
  const { edycja, powod } = useUprawnieniaOceny(ocena);
  const [szkic, setSzkic] = useState<SzkicRozmowy>(() => wczytajSzkic(ocena.id));
  const [stanAi, setStanAi] = useState<StanAi>({ typ: "bezczynny" });
  // Blokada podwójnego kliknięcia – stan Reacta zmienia się dopiero po ponownym renderze.
  const trwa = useRef(false);

  useEffect(() => {
    zapiszSzkic(ocena.id, szkic);
  }, [ocena.id, szkic]);

  const moznaGenerowac = kryteria.length > 0;
  const wybrane = liczWybrane(szkic.plan);
  const notatki = notatkiDoOceny(szkic.plan, szkic.wlasneNotatki);
  const wnioski = wnioskiDoOceny(szkic.plan);
  const nadpisze = !!(ocena.notatkiRozmowy || ocena.wnioskiRozwojowe);

  async function przygotujRozmowe() {
    if (trwa.current) return;
    trwa.current = true;
    // Do AI: tylko stanowisko, kryteria, poziomy i przykłady – bez imion i nazwisk.
    const inneOsoby = [...PRACOWNICY.filter((p) => p.id !== ocena.pracownikId), ocena.oceniajacy];
    const zapytanie = zbudujZapytanie(ocena, osoba, inneOsoby);
    setStanAi({ typ: "ladowanie" });
    try {
      const res = await fetch("/api/rozmowa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(zapytanie),
      });
      const dane: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const komunikat =
          dane && typeof dane === "object" && "error" in dane && typeof dane.error === "string"
            ? dane.error
            : BLAD_OGOLNY;
        throw new Error(komunikat);
      }
      setSzkic((s) => ({ ...s, plan: planDoSzkicu(dane as RozmowaPlan) }));
      setStanAi({ typ: "bezczynny" });
      toast.success("Plan rozmowy jest gotowy. Sprawdź go i zaznacz, co wykorzystasz.", { id: TOAST_AI });
    } catch (err) {
      const komunikat =
        err instanceof TypeError
          ? "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie."
          : err instanceof Error && err.message
            ? err.message
            : BLAD_OGOLNY;
      setStanAi({ typ: "blad", komunikat });
      toast.error(komunikat, { id: TOAST_AI });
    } finally {
      trwa.current = false;
    }
  }

  function zapiszWOcenie() {
    if (!edycja) {
      toast.error("Tryb podglądu – nie zapisano w ocenie.", { description: powod });
      return;
    }
    const aktualna = pobierzOcene(ocena.id);
    if (!aktualna) {
      toast.error("Nie znaleziono oceny – nie zapisano notatek.");
      return;
    }
    zapiszOcene({
      ...aktualna,
      notatkiRozmowy: notatki || undefined,
      wnioskiRozwojowe: wnioski || undefined,
    });
    toast.success("Zapisano w ocenie.");
  }

  function tekstDoSchowka(): string {
    const lista = LISTA_KONTROLNA[ocena.rodzaj];
    const czesci = [
      `Plan rozmowy oceniającej – ${nazwaRodzaju(ocena)}${osoba ? `, ${osoba.stanowisko}` : ""}`,
      ["Lista kontrolna (" + lista.zrodlo.miejsce + "):", ...lista.punkty.map((p) => `- ${p.etykieta}`)].join("\n"),
      notatki,
      wnioski ? ["Propozycje rozwoju:", wnioski].join("\n") : "",
    ];
    return czesci.filter(Boolean).join("\n\n");
  }

  async function kopiujPlan() {
    const tekst = tekstDoSchowka();
    try {
      await navigator.clipboard.writeText(tekst);
      toast.success("Skopiowano plan do schowka.");
    } catch {
      if (kopiujAwaryjnie(tekst)) toast.success("Skopiowano plan do schowka.");
      else toast.error("Nie udało się skopiować – przeglądarka zablokowała dostęp do schowka.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Nagłówek oceny */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{nazwaRodzaju(ocena)}</Badge>
            <Badge variant="secondary">Etap: {nazwaEtapu(ocena.etap)}</Badge>
          </div>
          <CardTitle className="text-xl font-semibold">
            <h2>{osoba ? `${osoba.imie} ${osoba.nazwisko}` : "Pracownik spoza listy"}</h2>
          </CardTitle>
          <CardDescription>
            {osoba ? `${osoba.stanowisko} · ${osoba.komorka}` : "Brak danych pracownika."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Okres oceny</dt>
              <dd>
                {formatujDate(ocena.okres.od)} – {formatujDate(ocena.okres.do)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                {ocena.rodzaj === "okresowa" ? "Termin sporządzenia oceny" : "Koniec okresu na dokonanie oceny"}
              </dt>
              <dd>{formatujDate(ocena.terminOceny)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Oceniający</dt>
              <dd>
                {ocena.oceniajacy.imie} {ocena.oceniajacy.nazwisko}, {ocena.oceniajacy.stanowisko}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Alert>
        <InfoIcon />
        <AlertTitle>AI tylko podpowiada – decyzję podejmujesz Ty</AlertTitle>
        <AlertDescription>
          Plan przygotowuje model językowy na podstawie przykładów zapisanych w ocenie. Może zawierać błędy – sprawdź
          każdy punkt przed rozmową. Asystent nie ustala poziomów ani wyniku oceny. Do AI wysyłamy tylko stanowisko,
          kryteria i przykłady – bez imion i nazwisk.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <TytulKarty ikona={ListChecksIcon}>Podsumowanie kryteriów</TytulKarty>
            <CardDescription>
              Wskaźniki, wybrane zachowania i przykłady. Sugerowany poziom to tylko podpowiedź systemu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PodsumowanieKryteriow kryteria={kryteria} rodzaj={ocena.rodzaj} />
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <TytulKarty ikona={ClipboardListIcon}>Co omówić – lista kontrolna</TytulKarty>
            <CardDescription>Zakres rozmowy oceniającej według rozporządzenia.</CardDescription>
          </CardHeader>
          <CardContent>
            <ListaKontrolnaRozmowy
              ocena={ocena}
              zaznaczone={szkic.lista}
              onZmiana={(id, v) => setSzkic((s) => ({ ...s, lista: { ...s.lista, [id]: v } }))}
            />
          </CardContent>
        </Card>
      </div>

      {/* Plan rozmowy (AI) */}
      <Card>
        <CardHeader>
          <TytulKarty ikona={MessagesSquareIcon}>Plan rozmowy</TytulKarty>
          <CardDescription>
            {szkic.plan
              ? `Przygotowano ${new Date(szkic.plan.wygenerowano).toLocaleString("pl-PL")}. Zaznacz, co wykorzystasz – możesz też edytować i dodawać punkty.`
              : "Pytania do pracownika, kwestie do omówienia, argumenty przy każdym kryterium i propozycje rozwoju."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!moznaGenerowac && (
            <p className="text-sm text-muted-foreground">
              Plan można przygotować, gdy ocena ma kryteria z obserwacjami.
            </p>
          )}

          {stanAi.typ === "ladowanie" && (
            <div className="flex flex-col gap-2" aria-live="polite">
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" aria-hidden /> Przygotowuję plan rozmowy – to może
                potrwać kilka sekund…
              </p>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-4/5" />
            </div>
          )}

          {stanAi.typ === "blad" && (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>Nie udało się przygotować planu</AlertTitle>
              <AlertDescription>
                {stanAi.komunikat} Możesz też przygotować notatki samodzielnie – zapis w ocenie działa bez AI.
              </AlertDescription>
            </Alert>
          )}

          {szkic.plan && stanAi.typ !== "ladowanie" && (
            <PlanRozmowy
              plan={szkic.plan}
              rodzaj={ocena.rodzaj}
              onZmiana={(plan) => setSzkic((s) => ({ ...s, plan }))}
            />
          )}

          {moznaGenerowac && (
            <div className="flex flex-wrap items-center gap-3 print:hidden">
              <Button
                onClick={przygotujRozmowe}
                disabled={stanAi.typ === "ladowanie"}
                variant={szkic.plan ? "outline" : "brand"}
                size="lg"
              >
                {stanAi.typ === "ladowanie" ? (
                  <Loader2Icon data-icon="inline-start" className="animate-spin" />
                ) : szkic.plan ? (
                  <RefreshCwIcon data-icon="inline-start" />
                ) : (
                  <SparklesIcon data-icon="inline-start" />
                )}
                {stanAi.typ === "ladowanie"
                  ? "Przygotowuję…"
                  : szkic.plan
                    ? "Przygotuj ponownie"
                    : "Przygotuj rozmowę"}
              </Button>
              {szkic.plan && (
                <span className="text-xs text-muted-foreground">
                  Nowy plan zastąpi obecny razem z Twoimi zmianami.
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zapis w ocenie */}
      <Card>
        <CardHeader>
          <TytulKarty ikona={NotebookPenIcon}>Notatki do oceny</TytulKarty>
          <CardDescription>
            Zapiszemy zaznaczone punkty planu w notatkach z rozmowy, a propozycje rozwoju – we wnioskach
            rozwojowych oceny.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="wlasne-notatki">Twoje notatki (opcjonalnie)</Label>
            <Textarea
              id="wlasne-notatki"
              value={szkic.wlasneNotatki}
              onChange={(e) => setSzkic((s) => ({ ...s, wlasneNotatki: e.target.value }))}
              placeholder="Np. ustalenia z rozmowy, opinia pracownika o własnej pracy, cele na kolejny okres…"
              rows={3}
            />
          </div>

          <div className="grid gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-medium">Notatki z rozmowy zapisane w ocenie</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {ocena.notatkiRozmowy || "Jeszcze nic nie zapisano."}
              </p>
            </div>
            <div>
              <p className="font-medium">Wnioski rozwojowe zapisane w ocenie</p>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {ocena.wnioskiRozwojowe || "Jeszcze nic nie zapisano."}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-3 print:hidden">
          {/* Czerwony jest zawsze tylko jeden: „Przygotuj rozmowę” przed planem, „Zapisz w ocenie” po nim. */}
          <Button
            onClick={zapiszWOcenie}
            disabled={!edycja || (!notatki && !wnioski)}
            variant={szkic.plan ? "brand" : "default"}
          >
            <SaveIcon data-icon="inline-start" /> Zapisz w ocenie
          </Button>
          <Button variant="outline" onClick={kopiujPlan}>
            <ClipboardCopyIcon data-icon="inline-start" /> Kopiuj plan
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon data-icon="inline-start" /> Drukuj
          </Button>
          <span className="text-xs text-muted-foreground">
            {!edycja
              ? `Tryb podglądu: ${powod}`
              : szkic.plan
                ? `Zaznaczone punkty planu: ${wybrane}.`
                : "Brak planu – zapiszesz tylko własne notatki."}
            {edycja && nadpisze && " Zapis zastąpi poprzednie notatki w ocenie."}
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}

/** Link do asystenta dla danej oceny (np. do osadzenia w kreatorze). */
export function LinkDoAsystenta({ ocenaId }: { ocenaId: string }) {
  return (
    <Link href={`/rozmowa/${encodeURIComponent(ocenaId)}`} className={buttonVariants({ variant: "outline" })}>
      <SparklesIcon data-icon="inline-start" /> Przygotuj rozmowę
    </Link>
  );
}
