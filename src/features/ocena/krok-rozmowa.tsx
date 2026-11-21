"use client";

import { ArrowRightIcon, BookOpenIcon, MessagesSquareIcon } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { KrokProps } from "./kreator";
import { dzisIso } from "./logika";

export function KrokRozmowa({ ocena, zmien, przejdz }: KrokProps) {
  const dalej = () => {
    zmien((o) => ({ ...o, daty: { ...o.daty, rozmowaOceniajaca: o.daty.rozmowaOceniajaca ?? dzisIso() } }));
    przejdz("decyzja");
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <MessagesSquareIcon className="mb-1 size-6 text-primary" aria-hidden />
            <CardTitle>Asystent rozmowy</CardTitle>
            <CardDescription>
              Plan rozmowy oceniającej na podstawie Twoich obserwacji: pytania do pracownika, kwestie do omówienia,
              argumenty uzasadniające ocenę i propozycje rozwoju. Lista kontrolna z rozporządzenia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href={`/rozmowa/${ocena.id}`} className={buttonVariants()}>
              Przygotuj rozmowę <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <BookOpenIcon className="mb-1 size-6 text-primary" aria-hidden />
            <CardTitle>Asystent formalny</CardTitle>
            <CardDescription>
              Pytania o zasady {ocena.rodzaj === "pierwsza" ? "pierwszej oceny" : "oceny okresowej"} – odpowiedzi na
              podstawie przepisów i poradników KPRM, ze wskazaniem źródła.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/asystent" className={buttonVariants({ variant: "outline" })}>
              Zapytaj asystenta
            </Link>
          </CardContent>
        </Card>
      </div>

      {ocena.notatkiRozmowy && (
        <Card>
          <CardHeader>
            <CardTitle>Notatki z przygotowania do rozmowy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm">{ocena.notatkiRozmowy}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Rozmowa oceniająca</CardTitle>
          <CardDescription>
            Rozmowa odbywa się przed sporządzeniem oceny na piśmie, a przy ocenie bierze się pod uwagę wnioski z rozmowy
            ({ocena.rodzaj === "okresowa" ? "§ 10 i § 11 ust. 2 rozporządzenia o ocenach okresowych" : "§ 8 i § 9 ust. 2 rozporządzenia o pierwszej ocenie"}).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid max-w-xs gap-1.5">
          <Label htmlFor="data-rozmowy-oceniajacej">Data rozmowy oceniającej</Label>
          <Input
            id="data-rozmowy-oceniajacej"
            type="date"
            value={ocena.daty.rozmowaOceniajaca ?? ""}
            onChange={(e) => zmien((o) => ({ ...o, daty: { ...o.daty, rozmowaOceniajaca: e.target.value || undefined } }))}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={dalej}>
          Rozmowa przeprowadzona – przejdź do decyzji <ArrowRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
