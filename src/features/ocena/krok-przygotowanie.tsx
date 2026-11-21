"use client";

import { ArrowRightIcon, InfoIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AnalizaOsp } from "@/features/osp";
import { kompetencja, MODEL } from "@/lib/ocena/model";
import { pracownik as znajdzPracownika } from "@/lib/ocena/store";
import { arkuszDlaStanowiska, KRYTERIA_OBOWIAZKOWE, MAX_KRYTERIOW_DODATKOWYCH } from "@/lib/ocena/zasady";
import { cn } from "@/lib/utils";
import type { OspSugestia } from "@/types/api";
import type { Arkusz, DanePierwszejOceny, KompetencjaId, Ocena, OcenaKryterium } from "@/types/ocena";

import type { KrokProps } from "./kreator";
import { doEtapu, dzisIso, kryteriaDlaArkusza, nowyKryterium } from "./logika";

export function KrokPrzygotowanie({ ocena, zmien, przejdz }: KrokProps) {
  const zatwierdz = () => {
    const bezWskaznikow = ocena.kryteria.filter((k) => k.wskazniki.length === 0);
    if (bezWskaznikow.length > 0) {
      toast.error("Każde kryterium musi mieć co najmniej jeden wskaźnik.", {
        description: bezWskaznikow.map((k) => kompetencja(k.kompetencjaId).nazwa).join(", "),
      });
      return;
    }
    zmien((o) => doEtapu({ ...o, daty: { ...o.daty, rozmowaWstepna: o.daty.rozmowaWstepna ?? dzisIso() } }, "obserwacje"));
    przejdz("obserwacje");
  };

  return (
    <div className="grid gap-6">
      {ocena.rodzaj === "okresowa" ? <ArkuszIKryteria ocena={ocena} zmien={zmien} /> : <PierwszaWstep ocena={ocena} zmien={zmien} />}
      <DoborWskaznikow ocena={ocena} zmien={zmien} />
      <div className="flex justify-end">
        <Button variant="brand" size="lg" onClick={zatwierdz}>
          Zatwierdź i przejdź do oceny wskaźników <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}

// ── Ocena okresowa: arkusz + kryteria dodatkowe ──────────────────────────────

function ArkuszIKryteria({ ocena, zmien }: Pick<KrokProps, "ocena" | "zmien">) {
  const osoba = znajdzPracownika(ocena.pracownikId);
  const sugerowany = osoba ? arkuszDlaStanowiska(osoba.kierujeZespolem) : null;
  const arkusz = ocena.arkusz ?? "C";
  const obowiazkowe = KRYTERIA_OBOWIAZKOWE[arkusz];
  const dodatkowe = ocena.kryteria.filter((k) => k.dodatkowe).map((k) => k.kompetencjaId);
  const dostepneDodatkowe = MODEL.kompetencje.filter((k) => !obowiazkowe.includes(k.id));

  const ustawArkusz = (a: Exclude<Arkusz, "A">) =>
    zmien((o) => ({ ...o, arkusz: a, kryteria: kryteriaDlaArkusza(a, o.kryteria) }));

  /** Podpowiedź z analizy OSP (tylko to, co przełożony przyjął). */
  const zastosujOsp = (s: OspSugestia) => {
    zmien((o) => {
      const a = s.sugerowanyArkusz;
      const obow = KRYTERIA_OBOWIAZKOWE[a];
      const dodatkowe = s.kryteriaDodatkowe
        .map((k) => k.kompetencjaId)
        .filter((id) => !obow.includes(id))
        .slice(0, MAX_KRYTERIOW_DODATKOWYCH);
      const bazowe = kryteriaDlaArkusza(a, o.kryteria.filter((k) => !k.dodatkowe));
      const kryteria = [...bazowe, ...dodatkowe.map((id) => o.kryteria.find((k) => k.kompetencjaId === id) ?? nowyKryterium(id, true))].map(
        (k) => {
          const sug = s.wskazniki.map((w) => w.wskaznikId).filter((id) => id.startsWith(`${k.kompetencjaId}-`));
          if (sug.length === 0) return k;
          const kolejnosc = kompetencja(k.kompetencjaId).wskazniki.map((w) => w.id);
          return { ...k, wskazniki: kolejnosc.filter((id) => sug.includes(id)) };
        },
      );
      return { ...o, arkusz: a, kryteria };
    });
    toast.success("Zastosowano podpowiedzi z analizy opisu stanowiska", {
      description: "Sprawdź kryteria i wskaźniki poniżej – możesz je jeszcze zmienić.",
    });
  };

  const przelaczDodatkowe = (id: KompetencjaId, wlacz: boolean) => {
    if (wlacz && dodatkowe.length >= MAX_KRYTERIOW_DODATKOWYCH) {
      toast.error(`Można wybrać najwyżej ${MAX_KRYTERIOW_DODATKOWYCH} kryteria dodatkowe (§ 5 ust. 2 rozporządzenia).`);
      return;
    }
    zmien((o) => ({
      ...o,
      kryteria: wlacz
        ? [...o.kryteria, nowyKryterium(id, true)]
        : o.kryteria.filter((k) => !(k.dodatkowe && k.kompetencjaId === id)),
    }));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>1. Analiza opisu stanowiska pracy i wybór arkusza</CardTitle>
          <CardDescription>
            Arkusz zależy od stanowiska (§ 3 rozporządzenia o ocenach okresowych): B – osoba bezpośrednio kieruje
            pracownikami, C – pozostałe stanowiska.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Arkusz oceny">
            {(["B", "C"] as const).map((a) => (
              <label
                key={a}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50",
                  arkusz === a && "border-primary bg-primary/5",
                )}
              >
                <input
                  type="radio"
                  name="arkusz"
                  className="mt-1 accent-[var(--primary)]"
                  checked={arkusz === a}
                  onChange={() => ustawArkusz(a)}
                />
                <span className="grid gap-1">
                  <span className="font-medium">
                    Arkusz {a} {sugerowany === a && <Badge variant="secondary">podpowiedź ze stanowiska</Badge>}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {a === "B" ? "Stanowisko bezpośrednio kierujące pracownikami" : "Pozostałe stanowiska (bez kierowania zespołem)"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Kryteria obowiązkowe: {KRYTERIA_OBOWIAZKOWE[a].map((id) => kompetencja(id).nazwa).join(", ")}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <Alert>
            <InfoIcon />
            <AlertDescription>
              Wklej opis stanowiska pracy (albo wybierz przykład) – AI podpowie arkusz, kryteria dodatkowe i najważniejsze
              wskaźniki. Każdą podpowiedź przyjmujesz albo odrzucasz; „Zastosuj” wpisze je poniżej.
            </AlertDescription>
          </Alert>
          <AnalizaOsp onZastosuj={zastosujOsp} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Kryteria oceny</CardTitle>
          <CardDescription>
            Kryteria obowiązkowe wynikają z arkusza. Możesz dodać najwyżej {MAX_KRYTERIOW_DODATKOWYCH} kryteria dodatkowe,
            najistotniejsze dla obowiązków na stanowisku (§ 5 ust. 2). Wybrano: {dodatkowe.length}/{MAX_KRYTERIOW_DODATKOWYCH}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {obowiazkowe.map((id) => (
              <Badge key={id}>{kompetencja(id).nazwa}</Badge>
            ))}
          </div>
          <fieldset className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <legend className="sr-only">Kryteria dodatkowe</legend>
            {dostepneDodatkowe.map((k) => {
              const wybrane = dodatkowe.includes(k.id);
              return (
                <label
                  key={k.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm hover:bg-muted/50",
                    wybrane && "border-primary bg-primary/5",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--primary)]"
                    checked={wybrane}
                    onChange={(e) => przelaczDodatkowe(k.id, e.target.checked)}
                  />
                  <span>
                    {k.nazwa}
                    <span className="block text-xs text-muted-foreground">{k.wskazniki.length} wskaźniki</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
          <TerminyOkresowej ocena={ocena} zmien={zmien} />
        </CardContent>
      </Card>
    </>
  );
}

function TerminyOkresowej({ ocena, zmien }: Pick<KrokProps, "ocena" | "zmien">) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="data-rozmowy-wstepnej">Data rozmowy o kryteriach (§ 5 ust. 1)</Label>
        <Input
          id="data-rozmowy-wstepnej"
          type="date"
          value={ocena.daty.rozmowaWstepna ?? ""}
          onChange={(e) => zmien((o) => ({ ...o, daty: { ...o.daty, rozmowaWstepna: e.target.value || undefined } }))}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="termin-oceny">Termin sporządzenia oceny</Label>
        <Input
          id="termin-oceny"
          type="date"
          value={ocena.terminOceny}
          onChange={(e) => e.target.value && zmien((o) => ({ ...o, terminOceny: e.target.value }))}
        />
      </div>
    </div>
  );
}

// ── Pierwsza ocena: rozmowa wstępna, sprawozdanie, egzamin ───────────────────

function PierwszaWstep({ ocena, zmien }: Pick<KrokProps, "ocena" | "zmien">) {
  const p: DanePierwszejOceny = ocena.pierwsza ?? { egzaminSluzbyPrzygotowawczej: "tak", sprawozdanieWTerminie: null };
  const ustaw = (zm: Partial<DanePierwszejOceny>) => zmien((o) => ({ ...o, pierwsza: { ...p, ...zm } }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozmowa wstępna i warunki pierwszej oceny</CardTitle>
        <CardDescription>
          Elementy pierwszej oceny są stałe: rzetelność, wykorzystywanie wiedzy i doskonalenie zawodowe, organizacja pracy
          i orientacja na osiąganie celów, komunikacja, współpraca (arkusz pierwszej oceny). Skala: 3 / 5 / 7 punktów.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="pw-rozmowa">Data rozmowy wstępnej</Label>
            <Input
              id="pw-rozmowa"
              type="date"
              value={ocena.daty.rozmowaWstepna ?? ""}
              onChange={(e) => zmien((o) => ({ ...o, daty: { ...o.daty, rozmowaWstepna: e.target.value || undefined } }))}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pw-sprawozdanie">Termin złożenia sprawozdania</Label>
            <Input
              id="pw-sprawozdanie"
              type="date"
              value={p.terminSprawozdania ?? ""}
              onChange={(e) => ustaw({ terminSprawozdania: e.target.value || undefined })}
            />
          </div>
        </div>
        <WyborOpcji
          legenda="Czy oceniany zaliczył egzamin ze służby przygotowawczej?"
          nazwa="egzamin"
          wartosc={p.egzaminSluzbyPrzygotowawczej}
          opcje={[
            ["tak", "Tak"],
            ["nie", "Nie"],
            ["nie-dotyczy", "Nie dotyczy"],
          ]}
          onZmiana={(v) => ustaw({ egzaminSluzbyPrzygotowawczej: v as DanePierwszejOceny["egzaminSluzbyPrzygotowawczej"] })}
        />
        <WyborOpcji
          legenda="Czy sprawozdanie zostało złożone w wyznaczonym terminie?"
          nazwa="sprawozdanie"
          wartosc={p.sprawozdanieWTerminie === null ? "brak" : p.sprawozdanieWTerminie ? "tak" : "nie"}
          opcje={[
            ["tak", "Tak"],
            ["nie", "Nie"],
            ["brak", "Jeszcze nie wiadomo"],
          ]}
          onZmiana={(v) => ustaw({ sprawozdanieWTerminie: v === "brak" ? null : v === "tak" })}
        />
      </CardContent>
    </Card>
  );
}

function WyborOpcji({
  legenda,
  nazwa,
  wartosc,
  opcje,
  onZmiana,
}: {
  legenda: string;
  nazwa: string;
  wartosc: string;
  opcje: [string, string][];
  onZmiana: (v: string) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-1 text-sm font-medium">{legenda}</legend>
      <div className="flex flex-wrap gap-2">
        {opcje.map(([v, l]) => (
          <label
            key={v}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted/50",
              wartosc === v && "border-primary bg-primary/5",
            )}
          >
            <input
              type="radio"
              name={nazwa}
              className="accent-[var(--primary)]"
              checked={wartosc === v}
              onChange={() => onZmiana(v)}
            />
            {l}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

// ── Dobór wskaźników do stanowiska ───────────────────────────────────────────

function DoborWskaznikow({ ocena, zmien }: Pick<KrokProps, "ocena" | "zmien">) {
  const przelacz = (k: OcenaKryterium, wid: string, wlacz: boolean) =>
    zmien((o: Ocena) => ({
      ...o,
      kryteria: o.kryteria.map((x) =>
        x.kompetencjaId !== k.kompetencjaId
          ? x
          : {
              ...x,
              wskazniki: wlacz
                ? kompetencja(x.kompetencjaId)
                    .wskazniki.map((w) => w.id)
                    .filter((id) => id === wid || x.wskazniki.includes(id))
                : x.wskazniki.filter((id) => id !== wid),
            },
      ),
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ocena.rodzaj === "okresowa" ? "3. " : ""}Dobór wskaźników behawioralnych</CardTitle>
        <CardDescription>{MODEL.wskazowki[0]}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-2">
        {ocena.kryteria.map((k) => {
          const komp = kompetencja(k.kompetencjaId);
          return (
            <fieldset key={k.kompetencjaId} className="grid gap-2 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">
                {komp.nazwa}{" "}
                <span className="font-normal text-muted-foreground">
                  ({k.wskazniki.length}/{komp.wskazniki.length}
                  {k.dodatkowe ? ", dodatkowe" : ""})
                </span>
              </legend>
              {komp.wskazniki.map((w) => (
                <label key={w.id} className="flex cursor-pointer items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--primary)]"
                    checked={k.wskazniki.includes(w.id)}
                    onChange={(e) => przelacz(k, w.id, e.target.checked)}
                  />
                  <span>{w.opis}</span>
                </label>
              ))}
            </fieldset>
          );
        })}
      </CardContent>
    </Card>
  );
}
