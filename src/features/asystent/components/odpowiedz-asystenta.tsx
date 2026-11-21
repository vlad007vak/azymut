"use client";

import { BookOpenTextIcon, ChevronRightIcon, SearchXIcon, ShieldCheckIcon } from "lucide-react";

import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

import type { OdpowiedzAsystenta, ZrodloAsystenta } from "../typy";

function Zrodlo({ zrodlo, nr }: { zrodlo: ZrodloAsystenta; nr: number }) {
  return (
    <li>
      <details className="group/zrodlo rounded-md border bg-muted/30">
        <summary className="flex cursor-pointer list-none items-start gap-2 rounded-md px-2.5 py-2 text-xs outline-none select-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <ChevronRightIcon
            className="mt-0.5 size-3.5 shrink-0 transition-transform group-open/zrodlo:rotate-90"
            aria-hidden
          />
          <span className="font-mono text-muted-foreground">[{nr}]</span>
          <span className="min-w-0">
            <span className="font-medium">{zrodlo.dokument}</span>
            {zrodlo.miejsce && <span className="text-muted-foreground"> – {zrodlo.miejsce}</span>}
          </span>
        </summary>
        <div className="space-y-2 px-2.5 pb-2.5 pl-8 text-xs">
          <blockquote className="border-l-2 border-primary/60 pl-2.5 leading-relaxed text-foreground">
            „{zrodlo.fragment}”
          </blockquote>
          <details className="group/pelny">
            <summary className="cursor-pointer list-none text-muted-foreground underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
              <span className="group-open/pelny:hidden">Pokaż cały fragment z bazy wiedzy</span>
              <span className="hidden group-open/pelny:inline">Ukryj cały fragment</span>
            </summary>
            <p className="mt-1.5 max-h-56 overflow-y-auto rounded bg-background p-2 leading-relaxed whitespace-pre-line text-muted-foreground">
              {zrodlo.tekst}
            </p>
          </details>
        </div>
      </details>
    </li>
  );
}

/** Dymek odpowiedzi asystenta: treść, źródła z cytatem albo wyraźny komunikat o braku informacji. */
export function OdpowiedzAsystentaWidok({ odp }: { odp: OdpowiedzAsystenta }) {
  return (
    <div className="flex flex-col gap-2.5">
      {odp.brakInformacji ? (
        <div
          className="flex gap-2.5 rounded-md border border-amber-300 bg-amber-50 p-2.5 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
        >
          <SearchXIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Brak informacji w bazie wiedzy</p>
            <p className="mt-0.5 leading-relaxed">{odp.odpowiedz}</p>
          </div>
        </div>
      ) : (
        <Markdown>{odp.odpowiedz}</Markdown>
      )}

      {odp.zrodla.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <BookOpenTextIcon className="size-3.5" aria-hidden />
            Źródła ({odp.zrodla.length}) – kliknij, aby zobaczyć cytat
          </p>
          <ol className="flex flex-col gap-1.5">
            {odp.zrodla.map((z, i) => (
              <Zrodlo key={z.id} zrodlo={z} nr={i + 1} />
            ))}
          </ol>
        </div>
      )}

      {(odp.zanonimizowano || odp.dostawca) && (
        <p className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground")}>
          {odp.zanonimizowano && (
            <span className="inline-flex items-center gap-1">
              <ShieldCheckIcon className="size-3" aria-hidden />
              Imiona i nazwiska usunięto z pytania przed wysłaniem do AI.
            </span>
          )}
          {odp.dostawca && <span>Odpowiedź sformułowana przez AI ({odp.dostawca}) wyłącznie na podstawie źródeł.</span>}
        </p>
      )}
    </div>
  );
}
