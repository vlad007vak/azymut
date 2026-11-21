"use client";

import { AlertTriangleIcon, CheckCircle2Icon, FileCheckIcon, ScaleIcon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { KontrolaJakosci } from "@/features/jakosc";
import { kompetencja, poziom } from "@/lib/ocena/model";
import { poziomZeSredniej, wynikOkresowej, wynikPierwszej } from "@/lib/ocena/zasady";
import { cn } from "@/lib/utils";
import type { KompetencjaId, Ocena, PoziomId, WynikOceny } from "@/types/ocena";

import type { KrokProps } from "./kreator";
import { doEtapu, dozwolonePoziomy, dzisIso, etykietaPoziomu, liczba, sugestiaKryterium } from "./logika";

export interface Rozstrzygniecie {
  wynik: WynikOceny;
  /** Okresowa: średnia 1–9; pierwsza: ocena łączna 3–7. */
  punkty: number;
  poziomOgolny?: PoziomId;
  powody: string[];
  uzasadnienieWymagane: boolean;
}

/** Wynik oceny wg rozporządzeń – null, dopóki brakuje decyzji. */
export function rozstrzygnij(o: Ocena): Rozstrzygniecie | null {
  const decyzje = o.kryteria.map((k) => k.decyzja);
  if (decyzje.length === 0 || decyzje.some((d) => d === undefined)) return null;
  if (o.rodzaj === "okresowa") {
    const w = wynikOkresowej(decyzje as PoziomId[]);
    return { wynik: w.wynik, punkty: w.srednia, poziomOgolny: w.poziomOgolny, powody: w.powody, uzasadnienieWymagane: w.uzasadnienieWymagane };
  }
  if (!o.pierwsza) return null;
  const w = wynikPierwszej(decyzje as (2 | 3 | 4)[], o.pierwsza);
  return { wynik: w.wynik, punkty: w.ocenaLaczna, powody: w.powody, uzasadnienieWymagane: w.uzasadnienieWymagane };
}

export function KrokDecyzja({ ocena, zmien, przejdz }: KrokProps) {
  const dozwolone = dozwolonePoziomy(ocena.rodzaj);
  const wynik = rozstrzygnij(ocena);
  const brakSprawozdania = ocena.rodzaj === "pierwsza" && ocena.pierwsza?.sprawozdanieWTerminie == null;
  const brakUzasadnienia = !!wynik?.uzasadnienieWymagane && !ocena.uzasadnienie?.trim();
  const zablokowana = ocena.etap === "sporzadzona" || ocena.etap === "zakonczona";

  const ustawDecyzje = (kid: KompetencjaId, p: PoziomId) =>
    zmien((o) => ({ ...o, kryteria: o.kryteria.map((k) => (k.kompetencjaId === kid ? { ...k, decyzja: p } : k)) }));

  const przyjmijWszystkie = () =>
    zmien((o) => ({
      ...o,
      kryteria: o.kryteria.map((k) => {
        const s = sugestiaKryterium(k, o.rodzaj);
        return k.decyzja === undefined && s.pokaz ? { ...k, decyzja: s.pokaz } : k;
      }),
    }));

  const sporzadz = () => {
    if (!wynik) return toast.error("Wybierz ostateczny poziom dla każdego kryterium.");
    if (brakSprawozdania) return toast.error("Uzupełnij informację, czy sprawozdanie złożono w terminie (krok 1).");
    if (brakUzasadnienia) return toast.error("Przy ocenie negatywnej uzasadnienie jest obowiązkowe.");
    zmien((o) => doEtapu({ ...o, wynik: wynik.wynik, daty: { ...o.daty, sporzadzenie: dzisIso() } }, "sporzadzona"));
    toast.success("Ocena sporządzona", { description: "Możesz wydrukować arkusz i zapoznać z nim pracownika." });
    przejdz("dokument");
  };

  return (
    <div className="grid gap-6">
      <Alert>
        <ScaleIcon />
        <AlertTitle>Decyzja należy do Ciebie</AlertTitle>
        <AlertDescription>
          System pokazuje sugestię wyliczoną z wybranych zachowań. Ostateczny poziom każdego kryterium wybiera przełożony –
          możesz przyjąć sugestię albo wybrać inny poziom, uwzględniając wnioski z rozmowy oceniającej.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div className="grid gap-1">
            <CardTitle>Oceny cząstkowe</CardTitle>
            <CardDescription>
              Skala: {ocena.rodzaj === "pierwsza" ? "3 / 5 / 7 pkt (§ 9 ust. 1 rozporządzenia o pierwszej ocenie)" : "1 / 3 / 5 / 7 / 9 pkt (§ 11 ust. 1 pkt 1 rozporządzenia o ocenach okresowych)"}
            </CardDescription>
          </div>
          {!zablokowana && (
            <Button variant="outline" onClick={przyjmijWszystkie}>
              Przyjmij sugestie dla kryteriów bez decyzji
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-3">
          {ocena.kryteria.map((k) => {
            const s = sugestiaKryterium(k, ocena.rodzaj);
            return (
              <div key={k.kompetencjaId} className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="grid gap-1">
                  <span className="font-medium">
                    {kompetencja(k.kompetencjaId).nazwa}{" "}
                    {k.dodatkowe && <Badge variant="outline">dodatkowe</Badge>}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Sugestia systemu: {s.pokaz ? etykietaPoziomu(s.pokaz) : "brak danych (brak ocenionych wskaźników)"}
                  </span>
                </div>
                <div role="radiogroup" aria-label={`Ostateczny poziom: ${kompetencja(k.kompetencjaId).nazwa}`} className="flex flex-wrap gap-1.5">
                  {dozwolone.map((p) => {
                    const x = poziom(p);
                    const wybrany = k.decyzja === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        role="radio"
                        aria-checked={wybrany}
                        disabled={zablokowana}
                        onClick={() => ustawDecyzje(k.kompetencjaId, p)}
                        title={x.nazwa}
                        className={cn(
                          "grid min-w-24 justify-items-center rounded-md border px-2 py-1.5 text-xs transition-colors hover:bg-muted disabled:cursor-not-allowed",
                          wybrany && "border-primary bg-primary text-primary-foreground hover:bg-primary",
                          !wybrany && s.pokaz === p && "border-primary/60 border-dashed",
                        )}
                      >
                        <span className="font-semibold">{x.punkty} pkt</span>
                        <span className="max-w-28 text-center leading-tight">{x.nazwa}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <WynikKarta ocena={ocena} wynik={wynik} brakSprawozdania={brakSprawozdania} />

      <Card>
        <CardHeader>
          <CardTitle>Uzasadnienie i wnioski</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="uzasadnienie">
              Uzasadnienie oceny {wynik?.uzasadnienieWymagane ? "(obowiązkowe przy ocenie negatywnej)" : "(opcjonalne przy ocenie pozytywnej)"}
            </Label>
            <Textarea
              id="uzasadnienie"
              rows={4}
              disabled={zablokowana}
              aria-invalid={brakUzasadnienia || undefined}
              value={ocena.uzasadnienie ?? ""}
              onChange={(e) => zmien((o) => ({ ...o, uzasadnienie: e.target.value || undefined }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="wnioski">
              {ocena.rodzaj === "okresowa" ? "Wnioski dotyczące indywidualnego programu rozwoju zawodowego" : "Wnioski dotyczące rozwoju zawodowego"}
            </Label>
            <Textarea
              id="wnioski"
              rows={4}
              disabled={zablokowana}
              value={ocena.wnioskiRozwojowe ?? ""}
              onChange={(e) => zmien((o) => ({ ...o, wnioskiRozwojowe: e.target.value || undefined }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Kontrola jakości uzasadnienia (Maks, #18) – po wpisaniu przykładów i uzasadnienia, przed sporządzeniem oceny. */}
      <KontrolaJakosci ocena={ocena} />

      <div className="flex justify-end">
        {zablokowana ? (
          <Button size="lg" onClick={() => przejdz("dokument")}>
            <FileCheckIcon data-icon="inline-start" /> Przejdź do dokumentu
          </Button>
        ) : (
          <Button variant="brand" size="lg" onClick={sporzadz} disabled={!wynik || brakSprawozdania || brakUzasadnienia}>
            <FileCheckIcon data-icon="inline-start" /> Sporządź ocenę na piśmie
          </Button>
        )}
      </div>
    </div>
  );
}

function WynikKarta({ ocena, wynik, brakSprawozdania }: { ocena: Ocena; wynik: Rozstrzygniecie | null; brakSprawozdania: boolean }) {
  if (!wynik) {
    const brak = ocena.kryteria.filter((k) => k.decyzja === undefined).length;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wynik oceny</CardTitle>
          <CardDescription>Wynik pojawi się po wybraniu poziomu dla wszystkich kryteriów (brakuje: {brak}).</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const pozytywna = wynik.wynik === "pozytywna";
  return (
    <Card className={cn(pozytywna ? "border-emerald-500/50" : "border-destructive/50")}>
      <CardHeader>
        <CardDescription>Wynik wyliczony wg rozporządzenia – na podstawie Twoich decyzji</CardDescription>
        <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
          {pozytywna ? <CheckCircle2Icon className="size-6 text-emerald-600" aria-hidden /> : <XCircleIcon className="size-6 text-destructive" aria-hidden />}
          Ocena {wynik.wynik}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm">
        {ocena.rodzaj === "okresowa" ? (
          <p>
            Średnia arytmetyczna ocen cząstkowych: <strong>{liczba(wynik.punkty)} pkt</strong> → ogólny poziom spełniania
            kryteriów: <strong>{poziom(wynik.poziomOgolny ?? poziomZeSredniej(wynik.punkty)).nazwa.toLowerCase()}</strong> (§ 11 ust. 1 pkt 2–4).
          </p>
        ) : (
          <p>
            Ocena łączna (średnia ocen cząstkowych): <strong>{liczba(wynik.punkty)} pkt</strong> (§ 7 pkt 3 i § 10 rozporządzenia o pierwszej ocenie).
          </p>
        )}
        {wynik.powody.length > 0 && (
          <ul className="list-disc pl-5 text-destructive">
            {wynik.powody.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
        {brakSprawozdania && (
          <Alert variant="destructive">
            <AlertTriangleIcon />
            <AlertDescription>Brak informacji o terminowym złożeniu sprawozdania – uzupełnij w kroku 1.</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
