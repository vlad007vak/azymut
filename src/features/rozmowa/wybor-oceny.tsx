"use client";

import { ArrowRightIcon, UserRoundIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { pracownik, useOceny } from "@/lib/ocena/store";
import { nazwaEtapu } from "@/lib/ocena/zasady";

import { nazwaRodzaju } from "./podsumowanie";

/** Lista ocen – wybór, dla której przygotować rozmowę. */
export function WyborOcenyRozmowy() {
  const oceny = useOceny();
  if (oceny.length === 0) {
    return (
      <p className="rounded-xl bg-card p-6 text-sm text-muted-foreground ring-1 ring-foreground/10">
        Brak ocen. Utwórz ocenę w kreatorze oceny.
      </p>
    );
  }
  return (
    <ul className="flex flex-col divide-y rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
      {oceny.map((o) => {
        const p = pracownik(o.pracownikId);
        const kryteria = o.kryteria.length;
        return (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div className="flex min-w-0 items-start gap-4">
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-primary"
              >
                <UserRoundIcon className="size-5" strokeWidth={1.5} />
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <p className="font-medium">
                  {p ? `${p.imie} ${p.nazwisko}` : "Pracownik spoza listy"}
                  {p && <span className="font-normal text-muted-foreground"> · {p.stanowisko}</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{nazwaRodzaju(o)}</Badge>
                  <Badge variant="outline">Etap: {nazwaEtapu(o.etap)}</Badge>
                  <Badge variant="outline">
                    {kryteria === 0 ? "brak kryteriów" : `kryteria: ${kryteria}`}
                  </Badge>
                </div>
              </div>
            </div>
            <Link
              href={`/rozmowa/${encodeURIComponent(o.id)}`}
              className={buttonVariants({ variant: kryteria > 0 ? "default" : "outline" })}
            >
              Otwórz asystenta <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
