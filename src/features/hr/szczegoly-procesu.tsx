"use client";

import { BellIcon, CheckIcon, ArrowRightIcon } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { pracownik } from "@/lib/ocena/store";
import { ETAPY } from "@/lib/ocena/zasady";
import type { Ocena } from "@/types/ocena";

import { EtapBadge, OpisTerminu } from "./etap-badge";
import { moznaPrzypomniec } from "./przypomnienia";
import { formatujDate, formatujDateCzas } from "./terminy";

function Wiersz({ etykieta, children }: { etykieta: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[10rem_1fr] gap-2 py-1.5">
      <dt className="text-muted-foreground">{etykieta}</dt>
      <dd>{children}</dd>
    </div>
  );
}

const DATY: { klucz: keyof Ocena["daty"]; nazwa: string }[] = [
  { klucz: "rozmowaWstepna", nazwa: "Rozmowa wstępna" },
  { klucz: "rozmowaOceniajaca", nazwa: "Rozmowa oceniająca" },
  { klucz: "sporzadzenie", nazwa: "Sporządzenie oceny" },
  { klucz: "zapoznanie", nazwa: "Zapoznanie z oceną" },
];

export function SzczegolyProcesu({
  ocena,
  dzis,
  onZamknij,
  onPrzypomnij,
}: {
  ocena: Ocena | null;
  dzis: string;
  onZamknij: () => void;
  onPrzypomnij: (ocena: Ocena) => void;
}) {
  return (
    <Sheet open={ocena !== null} onOpenChange={(open) => !open && onZamknij()}>
      <SheetContent className="w-full overflow-y-auto data-[side=right]:sm:max-w-xl">
        {ocena && <Tresc ocena={ocena} dzis={dzis} onPrzypomnij={onPrzypomnij} />}
      </SheetContent>
    </Sheet>
  );
}

function Tresc({
  ocena,
  dzis,
  onPrzypomnij,
}: {
  ocena: Ocena;
  dzis: string;
  onPrzypomnij: (ocena: Ocena) => void;
}) {
  const p = pracownik(ocena.pracownikId);
  const indeksEtapu = ETAPY.findIndex((e) => e.id === ocena.etap);
  const historia = [...(ocena.przypomnienia ?? [])].sort((a, b) => b.data.localeCompare(a.data));
  const daty = DATY.filter((d) => ocena.daty[d.klucz]);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{p ? `${p.imie} ${p.nazwisko}` : "Nieznany pracownik"}</SheetTitle>
        <SheetDescription>
          {p ? `${p.stanowisko} · ${p.komorka}` : `Brak danych pracownika (id: ${ocena.pracownikId}).`}
        </SheetDescription>
      </SheetHeader>

      <div className="grid gap-6 px-4 text-sm">
        <section aria-labelledby="hr-sz-dane">
          <h3 id="hr-sz-dane" className="mb-1 font-medium">
            Proces
          </h3>
          <dl className="divide-y">
            <Wiersz etykieta="Rodzaj">{ocena.rodzaj === "okresowa" ? "Ocena okresowa" : "Pierwsza ocena"}</Wiersz>
            {ocena.rodzaj === "okresowa" && <Wiersz etykieta="Arkusz">{ocena.arkusz ?? "—"}</Wiersz>}
            <Wiersz etykieta="Etap">
              <EtapBadge etap={ocena.etap} />
            </Wiersz>
            <Wiersz etykieta="Oceniający">
              {ocena.oceniajacy.imie} {ocena.oceniajacy.nazwisko} ({ocena.oceniajacy.stanowisko})
            </Wiersz>
            <Wiersz etykieta="Okres oceny">
              {formatujDate(ocena.okres.od)} – {formatujDate(ocena.okres.do)}
            </Wiersz>
            <Wiersz etykieta={ocena.rodzaj === "okresowa" ? "Termin sporządzenia" : "Koniec okresu na ocenę"}>
              {formatujDate(ocena.terminOceny)} · <OpisTerminu ocena={ocena} dzis={dzis} />
            </Wiersz>
            {ocena.pierwsza?.terminSprawozdania && (
              <Wiersz etykieta="Termin sprawozdania">{formatujDate(ocena.pierwsza.terminSprawozdania)}</Wiersz>
            )}
            {ocena.wynik && (
              <Wiersz etykieta="Wynik">{ocena.wynik === "pozytywna" ? "Ocena pozytywna" : "Ocena negatywna"}</Wiersz>
            )}
            <Wiersz etykieta="Ostatnia zmiana">{formatujDateCzas(ocena.zmieniono)}</Wiersz>
          </dl>
        </section>

        <section aria-labelledby="hr-sz-etapy">
          <h3 id="hr-sz-etapy" className="mb-2 font-medium">
            Przebieg
          </h3>
          <ol className="grid gap-1.5">
            {ETAPY.map((e, i) => {
              const zrobione = i < indeksEtapu || ocena.etap === "zakonczona";
              const biezacy = i === indeksEtapu && ocena.etap !== "zakonczona";
              return (
                <li
                  key={e.id}
                  aria-current={biezacy ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-2",
                    biezacy && "font-medium",
                    !zrobione && !biezacy && "text-muted-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded-full border text-xs",
                      zrobione && "border-emerald-600 bg-emerald-600 text-white",
                      biezacy && "border-primary text-primary",
                    )}
                    aria-hidden
                  >
                    {zrobione ? <CheckIcon className="size-3" /> : i + 1}
                  </span>
                  {e.nazwa}
                  {biezacy && <span className="sr-only">(bieżący etap)</span>}
                  {zrobione && <span className="sr-only">(zakończony)</span>}
                </li>
              );
            })}
          </ol>
          {daty.length > 0 && (
            <dl className="mt-3 divide-y">
              {daty.map((d) => (
                <Wiersz key={d.klucz} etykieta={d.nazwa}>
                  {formatujDate(ocena.daty[d.klucz])}
                </Wiersz>
              ))}
            </dl>
          )}
        </section>

        <section aria-labelledby="hr-sz-historia">
          <h3 id="hr-sz-historia" className="mb-2 font-medium">
            Historia przypomnień ({historia.length})
          </h3>
          {historia.length === 0 ? (
            <p className="text-muted-foreground">Nie wysłano jeszcze żadnego przypomnienia.</p>
          ) : (
            <ul className="grid gap-3">
              {historia.map((h, i) => (
                <li key={`${h.data}-${i}`} className="rounded-lg border p-3">
                  <p className="mb-1 text-xs text-muted-foreground">
                    <time dateTime={h.data}>{formatujDateCzas(h.data)}</time> · wysłano (symulacja)
                  </p>
                  <p className="whitespace-pre-line">{h.tresc}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <SheetFooter className="flex-row justify-end gap-2">
        <Button
          variant="outline"
          disabled={!moznaPrzypomniec(ocena)}
          onClick={() => onPrzypomnij(ocena)}
          title={moznaPrzypomniec(ocena) ? undefined : "Proces zakończony – przypomnienie nie jest potrzebne"}
        >
          <BellIcon data-icon="inline-start" aria-hidden />
          Przypomnij
        </Button>
        <Link href={`/ocena/${ocena.id}`} className={buttonVariants()}>
          Otwórz ocenę <ArrowRightIcon data-icon="inline-end" aria-hidden />
        </Link>
      </SheetFooter>
    </>
  );
}
