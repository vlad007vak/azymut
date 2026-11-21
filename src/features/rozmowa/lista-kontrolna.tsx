"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { Ocena } from "@/types/ocena";

import { LISTA_KONTROLNA } from "./lista-kontrolna-dane";

function formatujDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("pl-PL");
}

/** Dane z oceny przydatne przy punkcie listy (tylko pierwsza ocena). */
function kontekst(id: string, ocena: Ocena): string | null {
  const p = ocena.pierwsza;
  if (!p) return null;
  if (id === "pie-egzamin") {
    return {
      tak: "W ocenie: egzamin zaliczony.",
      nie: "W ocenie: egzamin niezaliczony.",
      "nie-dotyczy": "W ocenie: oceniany nie był obowiązany do egzaminu.",
    }[p.egzaminSluzbyPrzygotowawczej];
  }
  if (id === "pie-sprawozdanie") {
    const termin = p.terminSprawozdania ? ` (termin: ${formatujDate(p.terminSprawozdania)})` : "";
    if (p.sprawozdanieWTerminie === true) return `W ocenie: sprawozdanie złożone w terminie${termin}.`;
    if (p.sprawozdanieWTerminie === false) return `W ocenie: sprawozdanie niezłożone w terminie${termin}.`;
    return `W ocenie: jeszcze nie odnotowano złożenia sprawozdania${termin}.`;
  }
  return null;
}

export function ListaKontrolnaRozmowy({
  ocena,
  zaznaczone,
  onZmiana,
}: {
  ocena: Ocena;
  zaznaczone: Record<string, boolean>;
  onZmiana: (id: string, wartosc: boolean) => void;
}) {
  const lista = LISTA_KONTROLNA[ocena.rodzaj];
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p>{lista.wstep}</p>
      <ol className="flex flex-col gap-3">
        {lista.punkty.map((p, i) => {
          const info = kontekst(p.id, ocena);
          return (
            <li key={p.id} className="flex gap-3">
              <Checkbox
                id={`lista-${p.id}`}
                aria-labelledby={`lista-${p.id}-etykieta`}
                checked={!!zaznaczone[p.id]}
                onCheckedChange={(v) => onZmiana(p.id, v)}
                className="mt-0.5 print:hidden"
              />
              <div className="flex flex-col gap-1">
                <label id={`lista-${p.id}-etykieta`} htmlFor={`lista-${p.id}`} className="cursor-pointer font-medium">
                  {i + 1}. {p.etykieta}
                  {!p.obowiazkowy && <span className="font-normal text-muted-foreground"> – opcjonalnie</span>}
                </label>
                <blockquote className="border-l-2 pl-2 text-muted-foreground italic">„{p.cytat}”</blockquote>
                {info && <p className="text-xs">{info}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted-foreground">
        Źródło: {lista.zrodlo.miejsce} – {lista.zrodlo.dokument}.
      </p>
      <div className="flex flex-col gap-2 border-t pt-3">
        <p className="font-medium">Warto pamiętać</p>
        <ul className="flex flex-col gap-2">
          {lista.uwagi.map((u) => (
            <li key={u.zrodlo.miejsce + u.tekst.slice(0, 20)}>
              <span className="italic">„{u.tekst}”</span>{" "}
              <span className="text-xs text-muted-foreground">
                ({u.zrodlo.miejsce}; {u.zrodlo.dokument})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
