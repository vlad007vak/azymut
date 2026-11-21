"use client";

import { ArrowRightIcon, CalendarDaysIcon, PlayIcon, UserRoundCheckIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { RodzajOceny } from "@/types/ocena";

import { data, utworzOcene } from "./logika";

const pusta = () => () => {};

const SCIEZKI: { rodzaj: RodzajOceny; tytul: string; opis: string; ikona: typeof PlayIcon }[] = [
  {
    rodzaj: "pierwsza",
    tytul: "Pierwsza ocena w służbie cywilnej",
    opis: "Rozmowa wstępna, sprawozdanie, 5 stałych elementów oceny (3/5/7 pkt), warunki oceny pozytywnej.",
    ikona: UserRoundCheckIcon,
  },
  {
    rodzaj: "okresowa",
    tytul: "Ocena okresowa w służbie cywilnej",
    opis: "Analiza opisu stanowiska, arkusz B lub C, kryteria obowiązkowe i do 3 dodatkowych (1–9 pkt).",
    ikona: CalendarDaysIcon,
  },
];

export function StartOcen() {
  const poHydracji = useSyncExternalStore(pusta, () => true, () => false);
  const oceny = useOceny();

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 md:grid-cols-2">
        {SCIEZKI.map(({ rodzaj, tytul, opis, ikona: Ikona }) => {
          const lista = oceny.filter((o) => o.rodzaj === rodzaj && o.etap !== "zakonczona");
          return (
            <Card key={rodzaj} className="flex flex-col">
              <CardHeader>
                <Ikona className="mb-1 size-7 text-primary" aria-hidden />
                <CardTitle className="text-xl">{tytul}</CardTitle>
                <CardDescription>{opis}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto grid gap-4">
                <NowaOcenaDialog rodzaj={rodzaj} />
                <div className="grid gap-2">
                  <p className="text-sm font-medium">Oceny w toku</p>
                  {!poHydracji ? (
                    <Skeleton className="h-16" />
                  ) : lista.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Brak ocen w toku.</p>
                  ) : (
                    <ul className="grid gap-2">
                      {lista.map((o) => {
                        const p = pracownik(o.pracownikId);
                        return (
                          <li key={o.id}>
                            <Link
                              href={`/ocena/${o.id}`}
                              className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-muted/50"
                            >
                              <span className="grid">
                                <span className="font-medium">{p ? `${p.imie} ${p.nazwisko}` : "Pracownik"}</span>
                                <span className="text-xs text-muted-foreground">
                                  {p?.stanowisko}
                                  {o.arkusz ? ` · arkusz ${o.arkusz}` : ""} · termin {data(o.terminOceny)}
                                </span>
                              </span>
                              <span className="flex items-center gap-2">
                                <Badge variant="secondary">{nazwaEtapu(o.etap)}</Badge>
                                <ArrowRightIcon className="size-4 text-muted-foreground" aria-hidden />
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
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
      <DialogTrigger render={<Button size="lg" />}>
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
