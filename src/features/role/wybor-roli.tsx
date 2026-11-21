"use client";

import { Check, Loader2, LogOut, ShieldAlert, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { IkonaRoli } from "./ikona-roli";
import { bezpiecznyPowrot, chronionaSciezka, czyMaDostep, type RolaId } from "./rola";
import { ROLE, imieINazwisko, opisRoli, type OpisRoli } from "./role";
import { usunRole, useRola, zapiszRole } from "./use-rola";

const BLAD_COOKIE =
  "Nie udało się zapisać roli. Sprawdź, czy przeglądarka nie blokuje plików cookie dla tej strony.";

/** Karty ról na `/logowanie`. Wymaga `<Suspense>` wyżej (czyta parametr `powrot` z adresu). */
export function WyborRoli() {
  const parametry = useSearchParams();
  const powrot = bezpiecznyPowrot(parametry.get("powrot"));
  const chroniona = powrot ? chronionaSciezka(powrot) : null;
  const { rola: obecna, opis: obecnyOpis, gotowe } = useRola();
  const [wybierana, setWybierana] = useState<RolaId | null>(null);

  function wybierz(rola: RolaId) {
    setWybierana(rola);
    if (!zapiszRole(rola)) {
      setWybierana(null);
      toast.error(BLAD_COOKIE);
      return;
    }
    const cel = powrot && czyMaDostep(rola, powrot) ? powrot : opisRoli(rola).start;
    // Pełne przeładowanie: serwer i Proxy od razu widzą nowe cookie, a pamięć routera nie trzyma starego przekierowania.
    window.location.assign(cel);
  }

  function wyjdz() {
    if (!usunRole()) {
      toast.error("Nie udało się usunąć roli. Spróbuj odświeżyć stronę.");
      return;
    }
    toast.success("Rola demonstracyjna została usunięta. Oceny działają dalej bez wyboru roli.");
  }

  const brakDostepu = chroniona && gotowe && obecna !== chroniona.rola;
  // Najwyżej jeden czerwony przycisk: rola wymagana przez chronioną stronę, a bez niej – obecna rola.
  const wyrozniona = chroniona?.rola ?? (gotowe ? obecna : null);

  return (
    <div className="flex flex-col gap-6">
      {brakDostepu && (
        <Alert role="alert">
          <ShieldAlert aria-hidden />
          <AlertTitle>{chroniona.nazwa} jest dostępny tylko dla roli „{opisRoli(chroniona.rola).nazwa}”</AlertTitle>
          <AlertDescription>
            {obecnyOpis
              ? `Twoja obecna rola („${obecnyOpis.nazwa}”) nie ma do niego dostępu. Wybierz rolę HR, aby przejść dalej.`
              : "Wybierz rolę HR, aby przejść dalej – po wyborze wrócisz do panelu."}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {ROLE.map((r) => (
          <KartaRoli
            key={r.id}
            rola={r}
            aktywna={gotowe && obecna === r.id}
            wymagana={chroniona?.rola === r.id ? chroniona.nazwa : null}
            wyrozniona={wyrozniona === r.id}
            wybierana={wybierana}
            onWybierz={() => wybierz(r.id)}
          />
        ))}
      </div>

      {gotowe && obecnyOpis && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm text-muted-foreground shadow-xs">
          <span>
            Obecnie jesteś w roli: <strong className="text-foreground">{obecnyOpis.nazwa}</strong>.
          </span>
          <Button variant="ghost" size="sm" onClick={wyjdz} disabled={wybierana !== null}>
            <LogOut data-icon="inline-start" aria-hidden />
            Wyjdź z roli
          </Button>
        </div>
      )}
    </div>
  );
}

function KartaRoli({
  rola,
  aktywna,
  wymagana,
  wyrozniona,
  wybierana,
  onWybierz,
}: {
  rola: OpisRoli;
  aktywna: boolean;
  wymagana: string | null;
  wyrozniona: boolean;
  wybierana: RolaId | null;
  onWybierz: () => void;
}) {
  const idTytulu = `rola-${rola.id}`;
  const trwa = wybierana === rola.id;

  return (
    <Card
      aria-labelledby={idTytulu}
      className={cn(
        "gap-5 shadow-xs [--card-spacing:--spacing(6)]",
        aktywna && "ring-2 ring-primary",
        !aktywna && wymagana && "ring-2 ring-primary/50",
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
            <IkonaRoli rola={rola.id} className="size-6" strokeWidth={1.5} />
          </span>
          <CardTitle id={idTytulu} className="text-xl font-bold">
            {rola.nazwa}
          </CardTitle>
          {aktywna && <Badge className="ml-auto">Aktywna rola</Badge>}
          {!aktywna && wymagana && (
            <Badge variant="secondary" className="ml-auto">
              Wymagana: {wymagana}
            </Badge>
          )}
        </div>
        <CardDescription className="text-base">{rola.opis}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-5">
        {rola.osoba ? (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm">
            <p className="font-semibold">{imieINazwisko(rola.osoba)}</p>
            <p className="text-muted-foreground">{rola.osoba.stanowisko}</p>
            {rola.osoba.komorka && <p className="text-xs text-muted-foreground">{rola.osoba.komorka}</p>}
          </div>
        ) : (
          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
            Pracownik komórki kadrowej odpowiedzialny za organizację ocen w urzędzie.
          </div>
        )}

        <div className="grid gap-1.5 text-sm">
          <p className="font-semibold">Może:</p>
          <ul className="grid gap-1">
            {rola.uprawnienia.map((u) => (
              <li key={u} className="flex gap-2">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <span>{u}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 font-semibold">Nie może:</p>
          <ul className="grid gap-1">
            {rola.ograniczenia.map((o) => (
              <li key={o} className="flex gap-2 text-muted-foreground">
                <X aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          size="lg"
          className="w-full"
          variant={wyrozniona ? "brand" : "default"}
          onClick={onWybierz}
          disabled={wybierana !== null}
          aria-describedby={idTytulu}
        >
          {trwa ? (
            <>
              <Loader2 data-icon="inline-start" aria-hidden className="animate-spin" />
              Przechodzę…
            </>
          ) : (
            `${aktywna ? "Kontynuuj" : "Wejdź"} jako ${rola.kto}`
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export function WyborRoliSzkielet() {
  return (
    <div className="grid gap-6 md:grid-cols-2" aria-busy="true" aria-label="Wczytywanie ról">
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
