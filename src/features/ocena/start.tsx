"use client";

import { ArrowRightIcon, CalendarDaysIcon, PlayIcon, UserRoundCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PRZELOZONY_DEMO } from "@/data/demo";
import { PRACOWNICY, pracownik, useOceny, zapiszOcene } from "@/lib/ocena/store";
import { arkuszDlaStanowiska, nazwaEtapu } from "@/lib/ocena/zasady";
import { cn } from "@/lib/utils";
import type { RodzajOceny } from "@/types/ocena";

import { data, KROKI, krokStartowy, utworzOcene } from "./logika";

const pusta = () => () => {};

const SCIEZKI: { rodzaj: RodzajOceny; tytul: string; opis: string; fakty: string[]; ikona: typeof PlayIcon }[] = [
  {
    rodzaj: "pierwsza",
    tytul: "Pierwsza ocena w służbie cywilnej",
    opis: "Rozmowa wstępna, sprawozdanie, 5 stałych elementów oceny (3/5/7 pkt), warunki oceny pozytywnej.",
    fakty: ["5 elementów", "skala 3/5/7 pkt"],
    ikona: UserRoundCheckIcon,
  },
  {
    rodzaj: "okresowa",
    tytul: "Ocena okresowa w służbie cywilnej",
    opis: "Analiza opisu stanowiska, arkusz B lub C, kryteria obowiązkowe i do 3 dodatkowych (1–9 pkt).",
    fakty: ["arkusz B lub C", "skala 1–9 pkt"],
    ikona: CalendarDaysIcon,
  },
];

/** Dzisiejsza data (yyyy-mm-dd, czas lokalny) – tylko w przeglądarce, po hydracji. */
function dzisiajLokalnie(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** „za 24 dni”, „za 1 dzień”, „termin dziś”, „po terminie” + czy termin jest blisko (≤ 14 dni). */
function ileDoTerminu(termin: string | undefined, dzis: string): { tekst: string; pilne: boolean } | null {
  if (!termin) return null;
  const dni = Math.round((Date.parse(termin) - Date.parse(dzis)) / 86_400_000);
  if (Number.isNaN(dni)) return null;
  if (dni < 0) return { tekst: "po terminie", pilne: true };
  if (dni === 0) return { tekst: "termin dziś", pilne: true };
  return { tekst: `za ${dni} ${dni === 1 ? "dzień" : "dni"}`, pilne: dni <= 14 };
}

export function StartOcen() {
  const poHydracji = useSyncExternalStore(pusta, () => true, () => false);
  const oceny = useOceny();
  const dzis = poHydracji ? dzisiajLokalnie() : null;

  return (
    <section className="grid gap-6 md:grid-cols-2">
      {SCIEZKI.map(({ rodzaj, tytul, opis, fakty, ikona: Ikona }) => {
        const lista = oceny.filter((o) => o.rodzaj === rodzaj && o.etap !== "zakonczona");
        return (
          <div key={rodzaj} className="flex flex-col gap-4">
            {/* Granatowa karta ścieżki (klasa `dark` = granatowe tokeny – przycisk sam robi się jasny) */}
            <div className="dark relative flex flex-1 flex-col gap-4 overflow-hidden rounded-xl bg-background p-6 text-foreground shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-11 items-center justify-center rounded-lg bg-brand/15 text-brand">
                  <Ikona className="size-6" strokeWidth={1.75} aria-hidden />
                </span>
                {poHydracji && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    W toku: {lista.length}
                  </span>
                )}
              </div>
              <div className="grid gap-1.5">
                <h3 className="text-xl font-bold">{tytul}</h3>
                <p className="text-sm text-muted-foreground">{opis}</p>
              </div>
              <ul className="flex flex-wrap gap-2" aria-label="Najważniejsze zasady">
                {fakty.map((f) => (
                  <li key={f} className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
                    {f}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <NowaOcenaDialog rodzaj={rodzaj} />
              </div>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-semibold">Oceny w toku</p>
              {!poHydracji ? (
                <Skeleton className="h-16" />
              ) : lista.length === 0 ? (
                <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Brak ocen w toku.</p>
              ) : (
                <ul className="grid gap-2">
                  {lista.map((o) => {
                    const p = pracownik(o.pracownikId);
                    const nrKroku = KROKI.findIndex((k) => k.id === krokStartowy(o.etap)) + 1;
                    const termin = dzis ? ileDoTerminu(o.terminOceny, dzis) : null;
                    return (
                      <li key={o.id}>
                        <Link
                          href={`/ocena/${o.id}`}
                          className="group flex items-center gap-3 rounded-lg border bg-card p-3 text-sm shadow-xs transition-all outline-none hover:border-primary/40 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
                        >
                          <span
                            aria-hidden
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary"
                          >
                            {p ? `${p.imie[0]}${p.nazwisko[0]}` : "?"}
                          </span>
                          <span className="grid min-w-0 flex-1">
                            <span className="truncate font-semibold">{p ? `${p.imie} ${p.nazwisko}` : "Pracownik"}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {p?.stanowisko}
                              {o.arkusz ? ` · arkusz ${o.arkusz}` : ""} · termin {data(o.terminOceny)}
                            </span>
                          </span>
                          <span className="hidden w-36 shrink-0 gap-1 lg:grid">
                            <span className="flex min-w-0 justify-between gap-2 text-xs" title={nazwaEtapu(o.etap)}>
                              <span className="truncate font-medium">{nazwaEtapu(o.etap)}</span>
                              <span className="shrink-0 text-muted-foreground">
                                {nrKroku}/{KROKI.length}
                              </span>
                            </span>
                            <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <span
                                className="block h-full rounded-full bg-primary"
                                style={{ width: `${(nrKroku / KROKI.length) * 100}%` }}
                              />
                            </span>
                            <span className="sr-only">
                              Krok {nrKroku} z {KROKI.length}
                            </span>
                          </span>
                          {termin && (
                            <span
                              className={cn(
                                "hidden shrink-0 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap sm:inline",
                                termin.pilne ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
                              )}
                            >
                              {termin.tekst}
                            </span>
                          )}
                          <ArrowRightIcon
                            className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function NowaOcenaDialog({ rodzaj }: { rodzaj: RodzajOceny }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pracownikId, setPracownikId] = useState("");
  const [od, setOd] = useState("");
  const [doDnia, setDoDnia] = useState("");
  const [termin, setTermin] = useState("");

  const wybierz = (id: string) => {
    setPracownikId(id);
    const p = pracownik(id);
    if (p && rodzaj === "pierwsza" && !od) setOd(p.dataZatrudnienia);
  };

  const utworz = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const p = pracownik(pracownikId);
    if (!p || !od || !doDnia || !termin) {
      toast.error("Uzupełnij wszystkie pola.");
      return;
    }
    if (od > doDnia) {
      toast.error("Koniec okresu nie może być wcześniejszy niż początek.");
      return;
    }
    const ocena = utworzOcene({
      rodzaj,
      pracownik: p,
      arkusz: rodzaj === "okresowa" ? arkuszDlaStanowiska(p.kierujeZespolem) : undefined,
      oceniajacy: PRZELOZONY_DEMO,
      okres: { od, do: doDnia },
      terminOceny: termin,
    });
    zapiszOcene(ocena);
    setOpen(false);
    router.push(`/ocena/${ocena.id}`);
  };

  const idp = `nowa-${rodzaj}`;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="lg" className="h-10 px-4" />}>
        <PlayIcon data-icon="inline-start" aria-hidden /> Rozpocznij ocenę
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rodzaj === "pierwsza" ? "Nowa pierwsza ocena" : "Nowa ocena okresowa"}</DialogTitle>
          <DialogDescription>Wybierz pracownika i okres. Dalej kreator poprowadzi Cię krok po kroku.</DialogDescription>
        </DialogHeader>
        <form onSubmit={utworz} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor={`${idp}-pracownik`}>Pracownik</Label>
            <select
              id={`${idp}-pracownik`}
              value={pracownikId}
              onChange={(e) => wybierz(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">Wybierz pracownika…</option>
              {PRACOWNICY.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.imie} {p.nazwisko} – {p.stanowisko}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`${idp}-od`}>Okres oceny od</Label>
              <Input id={`${idp}-od`} type="date" value={od} onChange={(e) => setOd(e.target.value)} required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`${idp}-do`}>do</Label>
              <Input id={`${idp}-do`} type="date" value={doDnia} min={od || undefined} onChange={(e) => setDoDnia(e.target.value)} required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`${idp}-termin`}>{rodzaj === "okresowa" ? "Termin sporządzenia oceny" : "Termin dokonania pierwszej oceny"}</Label>
            <Input id={`${idp}-termin`} type="date" value={termin} onChange={(e) => setTermin(e.target.value)} required />
          </div>
          <DialogFooter>
            <Button type="submit">
              Utwórz i przejdź do kreatora <ArrowRightIcon data-icon="inline-end" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function KafelkiAsystentow() {
  const kafelki = [
    { href: "/asystent", tytul: "Asystent formalny", opis: "Zasady oceny z przepisów i poradników KPRM – ze wskazaniem źródła." },
    { href: "/rozmowa", tytul: "Asystent rozmowy", opis: "Plan rozmowy oceniającej: pytania, kwestie do omówienia, argumenty, rozwój." },
    { href: "/hr", tytul: "Panel HR", opis: "Statusy procesów, terminy i przypomnienia dla oceniających." },
  ];
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {kafelki.map((k) => (
        <Link key={k.href} href={k.href} className="group rounded-xl border p-5 transition-colors hover:bg-muted/50">
          <p className="font-medium">
            {k.tytul} <ArrowRightIcon className="inline size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{k.opis}</p>
        </Link>
      ))}
    </section>
  );
}
