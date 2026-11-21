"use client";

import { CheckCheckIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalizaOsp } from "@/features/osp";
import { kompetencja, wskaznik } from "@/lib/ocena/model";
import type { OspSugestia } from "@/types/api";

/** Strona testowa: komponent analizy + podgląd danych, które trafią do kreatora po „Zastosuj”. */
export function PodgladOsp() {
  const [zastosowane, setZastosowane] = useState<OspSugestia | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <AnalizaOsp onZastosuj={setZastosowane} />
      {zastosowane && (
        <Card aria-live="polite">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <CheckCheckIcon className="size-5 shrink-0 text-primary" strokeWidth={1.5} aria-hidden />
              <h2>Zastosowano – dane dla kreatora oceny</h2>
            </CardTitle>
            <CardDescription>Podgląd tego, co komponent przekazuje dalej (onZastosuj).</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>
              <span className="text-muted-foreground">Arkusz:</span> <Badge>{zastosowane.sugerowanyArkusz}</Badge>
            </p>
            <div>
              <p className="text-muted-foreground">Kryteria dodatkowe:</p>
              {zastosowane.kryteriaDodatkowe.length ? (
                <ul className="list-disc pl-5">
                  {zastosowane.kryteriaDodatkowe.map((k) => (
                    <li key={k.kompetencjaId}>{kompetencja(k.kompetencjaId).nazwa}</li>
                  ))}
                </ul>
              ) : (
                <p>brak</p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground">Wskaźniki ({zastosowane.wskazniki.length}):</p>
              <ul className="list-disc pl-5">
                {zastosowane.wskazniki.map((w) => (
                  <li key={w.wskaznikId}>
                    <code className="text-xs">{w.wskaznikId}</code> – {wskaznik(w.wskaznikId)?.opis}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
