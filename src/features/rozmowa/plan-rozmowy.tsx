"use client";

import { PlusIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { kompetencja } from "@/lib/ocena/model";
import { cn } from "@/lib/utils";
import type { RodzajOceny } from "@/types/ocena";

import { nowyPunkt, type Punkt, type SekcjaPlanu, type SzkicPlanu } from "./szkic";

function ListaPunktow({
  punkty,
  etykieta,
  onZmiana,
}: {
  punkty: Punkt[];
  /** Do etykiet dostępności, np. „Pytanie”. */
  etykieta: string;
  onZmiana: (punkty: Punkt[]) => void;
}) {
  const zmien = (id: string, zmiana: Partial<Punkt>) =>
    onZmiana(punkty.map((p) => (p.id === id ? { ...p, ...zmiana } : p)));

  return (
    <div className="flex flex-col gap-1">
      {punkty.length === 0 && <p className="text-sm text-muted-foreground">Brak propozycji – dodaj własny punkt.</p>}
      <ul className="flex flex-col gap-1">
        {punkty.map((p, i) => (
          <li key={p.id} className={cn("group flex items-start gap-2", !p.wybrany && "print:hidden")}>
            <Checkbox
              checked={p.wybrany}
              onCheckedChange={(v) => zmien(p.id, { wybrany: v })}
              aria-label={`${etykieta} ${i + 1}: uwzględnij w notatkach`}
              className="mt-2.5 print:hidden"
            />
            <Textarea
              value={p.tekst}
              onChange={(e) => zmien(p.id, { tekst: e.target.value })}
              aria-label={`${etykieta} ${i + 1}: treść`}
              placeholder="Wpisz treść…"
              rows={1}
              className={cn(
                "min-h-0 resize-none border-transparent bg-transparent px-2 py-1.5 shadow-none hover:border-input dark:bg-transparent",
                !p.wybrany && "text-muted-foreground line-through",
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => onZmiana(punkty.filter((x) => x.id !== p.id))}
              aria-label={`${etykieta} ${i + 1}: usuń`}
              className="mt-1 opacity-60 group-hover:opacity-100 focus-visible:opacity-100 print:hidden"
            >
              <XIcon />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onZmiana([...punkty, nowyPunkt()])}
        className="self-start print:hidden"
      >
        <PlusIcon data-icon="inline-start" /> Dodaj punkt
      </Button>
    </div>
  );
}

function Sekcja({ tytul, opis, children }: { tytul: string; opis?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 break-inside-avoid">
      <div>
        <h3 className="font-semibold">{tytul}</h3>
        {opis && <p className="text-xs text-muted-foreground">{opis}</p>}
      </div>
      {children}
    </section>
  );
}

export function PlanRozmowy({
  plan,
  rodzaj,
  onZmiana,
}: {
  plan: SzkicPlanu;
  rodzaj: RodzajOceny;
  onZmiana: (plan: SzkicPlanu) => void;
}) {
  const ustawSekcje = (sekcja: SekcjaPlanu) => (punkty: Punkt[]) => onZmiana({ ...plan, [sekcja]: punkty });

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Sekcja tytul="Pytania do pracownika" opis="Pytania otwarte – dają pracownikowi przestrzeń na własną ocenę.">
          <ListaPunktow punkty={plan.pytania} etykieta="Pytanie" onZmiana={ustawSekcje("pytania")} />
        </Sekcja>
        <Sekcja
          tytul="Kwestie do omówienia"
          opis="Np. wskaźniki poniżej oczekiwań, brak podstaw do oceny, brak przykładów."
        >
          <ListaPunktow punkty={plan.tematy} etykieta="Kwestia" onZmiana={ustawSekcje("tematy")} />
        </Sekcja>
      </div>

      <Sekcja
        tytul="Argumenty uzasadniające ocenę"
        opis="Uporządkowane według kryteriów, oparte na przykładach zapisanych w ocenie."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {plan.argumenty.map((a) => (
            <div key={a.kompetencjaId} className="rounded-lg border p-3">
              <h4 className="mb-1 text-sm font-medium">{kompetencja(a.kompetencjaId).nazwa}</h4>
              <ListaPunktow
                punkty={a.punkty}
                etykieta={`Argument (${kompetencja(a.kompetencjaId).nazwa})`}
                onZmiana={(punkty) =>
                  onZmiana({
                    ...plan,
                    argumenty: plan.argumenty.map((x) => (x.kompetencjaId === a.kompetencjaId ? { ...x, punkty } : x)),
                  })
                }
              />
            </div>
          ))}
        </div>
      </Sekcja>

      <Sekcja
        tytul={rodzaj === "okresowa" ? "Propozycje do wniosków rozwojowych (IPRZ)" : "Propozycje kierunków rozwoju zawodowego"}
        opis="Np. szkolenie, mentoring, coaching, nowe zadania. Zapiszemy je w polu wniosków rozwojowych oceny."
      >
        <ListaPunktow punkty={plan.rozwoj} etykieta="Propozycja rozwoju" onZmiana={ustawSekcje("rozwoj")} />
      </Sekcja>
    </div>
  );
}
