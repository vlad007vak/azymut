"use client";

import { ArrowRightIcon, LightbulbIcon } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { kompetencja, MODEL, POZIOMY } from "@/lib/ocena/model";
import { cn } from "@/lib/utils";
import type { KompetencjaId, Obserwacja, OcenaKryterium, PoziomId, RodzajOceny } from "@/types/ocena";

import type { KrokProps } from "./kreator";
import { doEtapu, etykietaPoziomu, liczba, sugestiaKryterium } from "./logika";

export function KrokObserwacje({ ocena, zmien, przejdz }: KrokProps) {
  const [aktywne, setAktywne] = useState<KompetencjaId>(ocena.kryteria[0]?.kompetencjaId ?? "rzetelnosc");
  const kryterium = ocena.kryteria.find((k) => k.kompetencjaId === aktywne) ?? ocena.kryteria[0];

  const ustawObserwacje = (kid: KompetencjaId, wid: string, zm: Partial<Obserwacja>) =>
    zmien((o) => ({
      ...o,
      kryteria: o.kryteria.map((k) =>
        k.kompetencjaId !== kid
          ? k
          : {
              ...k,
              obserwacje: {
                ...k.obserwacje,
                [wid]: { ...(k.obserwacje[wid] ?? { poziom: null }), ...zm },
              },
            },
      ),
    }));

  const dalej = () => {
    zmien((o) => doEtapu(o, "rozmowa"));
    przejdz("rozmowa");
  };

  const nieocenione = ocena.kryteria.reduce((s, k) => s + sugestiaKryterium(k, ocena.rodzaj).nieocenione, 0);

  if (!kryterium) return null;

  return (
    <div className="grid gap-6">
      <Alert>
        <LightbulbIcon />
        <AlertTitle>Jak oceniać</AlertTitle>
        <AlertDescription>
          <p>
            Przy każdym wskaźniku wybierz zachowanie, które najlepiej opisuje to, co obserwowałeś(-aś) w okresie oceny.
            {" "}
            {MODEL.wskazowki[1]}
          </p>
          <p>{MODEL.wskazowki[2]}</p>
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <nav aria-label="Kryteria" className="grid content-start gap-2">
          {ocena.kryteria.map((k) => {
            const s = sugestiaKryterium(k, ocena.rodzaj);
            const ocenione = k.wskazniki.length - s.nieocenione;
            return (
              <button
                key={k.kompetencjaId}
                type="button"
                onClick={() => setAktywne(k.kompetencjaId)}
                aria-current={k.kompetencjaId === kryterium.kompetencjaId ? "true" : undefined}
                className={cn(
                  "grid gap-1 rounded-lg border p-3 text-left text-sm transition-colors hover:bg-muted/50",
                  k.kompetencjaId === kryterium.kompetencjaId && "border-primary bg-primary/5",
                )}
              >
                <span className="font-medium">{kompetencja(k.kompetencjaId).nazwa}</span>
                <span className="text-xs text-muted-foreground">
                  Ocenione wskaźniki: {ocenione}/{k.wskazniki.length}
                  {k.dodatkowe ? " · dodatkowe" : ""}
                </span>
                <span className="text-xs">
                  {s.pokaz ? (
                    <>
                      Sugestia: <strong>{etykietaPoziomu(s.pokaz)}</strong>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Sugestia: brak danych</span>
                  )}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="grid content-start gap-4">
          <SugestiaKarta kryterium={kryterium} rodzaj={ocena.rodzaj} />
          {kryterium.wskazniki.map((wid) => {
            const w = kompetencja(kryterium.kompetencjaId).wskazniki.find((x) => x.id === wid);
            if (!w) return null;
            const obs = kryterium.obserwacje[wid];
            const nazwaGrupy = `${ocena.id}-${wid}`;
            const ustaw = (zm: Partial<Obserwacja>) => ustawObserwacje(kryterium.kompetencjaId, wid, zm);
            return (
              <Card key={wid}>
                <CardHeader>
                  <CardTitle className="text-base">{w.opis}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <fieldset className="grid gap-2">
                    <legend className="sr-only">Zachowanie najlepiej opisujące pracownika: {w.opis}</legend>
                    {POZIOMY.map((p) => (
                      <label
                        key={p.id}
                        className={cn(
                          "flex cursor-pointer gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50",
                          obs?.poziom === p.id && "border-primary bg-primary/5",
                        )}
                      >
                        <input
                          type="radio"
                          name={nazwaGrupy}
                          className="mt-1 accent-[var(--primary)]"
                          checked={obs?.poziom === p.id}
                          onChange={() => ustaw({ poziom: p.id })}
                        />
                        <span className="grid gap-0.5">
                          <span className="text-xs font-medium text-muted-foreground">{p.nazwa}</span>
                          <span>{w.zachowania[String(p.id) as "1" | "2" | "3" | "4" | "5"]}</span>
                        </span>
                      </label>
                    ))}
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-3 text-sm hover:bg-muted/50",
                        obs !== undefined && obs.poziom === null && "border-primary bg-primary/5",
                      )}
                    >
                      <input
                        type="radio"
                        name={nazwaGrupy}
                        className="accent-[var(--primary)]"
                        checked={obs !== undefined && obs.poziom === null}
                        onChange={() => ustaw({ poziom: null })}
                      />
                      Brak podstaw do oceny (nie było okazji zaobserwować zachowania)
                    </label>
                  </fieldset>
                  <div className="grid gap-1.5">
                    <label htmlFor={`${nazwaGrupy}-przyklad`} className="text-sm font-medium">
                      Przykład z okresu oceny: sytuacja – działanie – rezultat
                    </label>
                    <Textarea
                      id={`${nazwaGrupy}-przyklad`}
                      rows={2}
                      disabled={obs === undefined}
                      placeholder={
                        obs === undefined
                          ? "Najpierw wybierz zachowanie albo „brak podstaw do oceny”."
                          : "Np. Przy naborze wniosków (marzec) przygotował harmonogram… w efekcie…"
                      }
                      value={obs?.przyklad ?? ""}
                      onChange={(e) => ustaw({ przyklad: e.target.value || undefined })}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {nieocenione > 0 && (
          <span className="text-sm text-muted-foreground">
            Bez wyboru zostało {nieocenione} wskaźn. – możesz do nich wrócić później.
          </span>
        )}
        <Button variant="brand" size="lg" onClick={dalej}>
          Przejdź do rozmowy oceniającej <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}

function SugestiaKarta({ kryterium, rodzaj }: { kryterium: OcenaKryterium; rodzaj: RodzajOceny }) {
  const s = sugestiaKryterium(kryterium, rodzaj);
  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardHeader>
        <CardDescription>Podpowiedź systemu – decyzję podejmuje przełożony</CardDescription>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {kompetencja(kryterium.kompetencjaId).nazwa}:{" "}
          {s.pokaz ? <Badge className="text-sm">{etykietaPoziomu(s.pokaz as PoziomId)}</Badge> : <span className="text-base font-normal text-muted-foreground">brak danych do sugestii</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {s.srednia !== null ? (
          <p>
            Średnia {liczba(s.srednia)} pkt z {s.ocenione} ocenionych wskaźników (zachowania przeliczone na skalę 1/3/5/7/9,
            przedziały z § 11 ust. 1 pkt 2 rozporządzenia o ocenach okresowych
            {rodzaj === "pierwsza" ? "; w pierwszej ocenie wynik pokazujemy na skali 3/5/7 pkt" : ""}).
            {s.brakPodstaw > 0 ? ` Bez podstaw do oceny: ${s.brakPodstaw}.` : ""}
            {s.nieocenione > 0 ? ` Jeszcze bez wyboru: ${s.nieocenione}.` : ""}
          </p>
        ) : (
          <p>Wybierz zachowania przy wskaźnikach, aby zobaczyć sugerowany poziom.</p>
        )}
      </CardContent>
    </Card>
  );
}
