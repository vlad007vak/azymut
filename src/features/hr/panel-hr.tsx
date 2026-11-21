"use client";

import { BellIcon, InfoIcon, RotateCcwIcon } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { pracownik, resetujDemo, useOceny } from "@/lib/ocena/store";
import { ETAPY } from "@/lib/ocena/zasady";
import type { Id } from "@/types";
import type { EtapOceny, Ocena, RodzajOceny } from "@/types/ocena";

import { EtapBadge, OpisTerminu } from "./etap-badge";
import { NowyProcesDialog } from "./nowy-proces-dialog";
import { moznaPrzypomniec } from "./przypomnienia";
import { PrzypomnienieDialog } from "./przypomnienie-dialog";
import { SzczegolyProcesu } from "./szczegoly-procesu";
import { DNI_OSTRZEZENIA, formatujDate, formatujDateCzas, porownajPilnosc, statusTerminu } from "./terminy";
import { useDzisiaj } from "./use-dzisiaj";

type FiltrEtapu = "wszystkie" | EtapOceny;
type FiltrRodzaju = "wszystkie" | RodzajOceny;
type Licznik = "w-toku" | "zbliza-sie" | "po-terminie" | "zakonczona";

const ETAPY_ITEMS: Record<FiltrEtapu, string> = {
  wszystkie: "Wszystkie etapy",
  ...(Object.fromEntries(ETAPY.map((e) => [e.id, e.nazwa])) as Record<EtapOceny, string>),
};
const RODZAJE_ITEMS: Record<FiltrRodzaju, string> = {
  wszystkie: "Wszystkie rodzaje",
  okresowa: "Ocena okresowa",
  pierwsza: "Pierwsza ocena",
};

const LICZNIKI: { id: Licznik; nazwa: string; opis: string; kolor: string }[] = [
  { id: "w-toku", nazwa: "W toku", opis: "procesy niezakończone", kolor: "text-foreground" },
  {
    id: "zbliza-sie",
    nazwa: "Zbliża się termin",
    opis: `≤ ${DNI_OSTRZEZENIA} dni do terminu`,
    kolor: "text-amber-700 dark:text-amber-400",
  },
  { id: "po-terminie", nazwa: "Po terminie", opis: "termin minął", kolor: "text-destructive" },
  { id: "zakonczona", nazwa: "Zakończone", opis: "pracownik zapoznał się z oceną", kolor: "text-emerald-700 dark:text-emerald-400" },
];

function pasujeDoLicznika(o: Ocena, licznik: Licznik, dzis: string): boolean {
  if (licznik === "w-toku") return o.etap !== "zakonczona";
  return statusTerminu(o, dzis) === licznik;
}

export function PanelHr() {
  const oceny = useOceny();
  const dzis = useDzisiaj();

  if (dzis === null) return <PanelSzkielet />;
  return <PanelTresc oceny={oceny} dzis={dzis} />;
}

function PanelSzkielet() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-label="Wczytywanie procesów ocen">
      <div className="grid grid-cols-4 gap-3">
        {LICZNIKI.map((l) => (
          <Skeleton key={l.id} className="h-20" />
        ))}
      </div>
      <Skeleton className="h-10" />
      <Skeleton className="h-64" />
    </div>
  );
}

function PanelTresc({ oceny, dzis }: { oceny: Ocena[]; dzis: string }) {
  const [filtrEtapu, setFiltrEtapu] = useState<FiltrEtapu>("wszystkie");
  const [filtrRodzaju, setFiltrRodzaju] = useState<FiltrRodzaju>("wszystkie");
  const [licznik, setLicznik] = useState<Licznik | null>(null);
  const [szczegolyId, setSzczegolyId] = useState<Id | null>(null);
  const [przypomnijId, setPrzypomnijId] = useState<Id | null>(null);

  const liczby = useMemo(
    () =>
      Object.fromEntries(
        LICZNIKI.map((l) => [l.id, oceny.filter((o) => pasujeDoLicznika(o, l.id, dzis)).length]),
      ) as Record<Licznik, number>,
    [oceny, dzis],
  );

  const widoczne = useMemo(
    () =>
      oceny
        .filter((o) => filtrEtapu === "wszystkie" || o.etap === filtrEtapu)
        .filter((o) => filtrRodzaju === "wszystkie" || o.rodzaj === filtrRodzaju)
        .filter((o) => licznik === null || pasujeDoLicznika(o, licznik, dzis))
        .sort(porownajPilnosc),
    [oceny, filtrEtapu, filtrRodzaju, licznik, dzis],
  );

  const filtrAktywny = filtrEtapu !== "wszystkie" || filtrRodzaju !== "wszystkie" || licznik !== null;
  const szczegoly = szczegolyId ? (oceny.find((o) => o.id === szczegolyId) ?? null) : null;
  const przypominana = przypomnijId ? (oceny.find((o) => o.id === przypomnijId) ?? null) : null;

  function wyczyscFiltry() {
    setFiltrEtapu("wszystkie");
    setFiltrRodzaju("wszystkie");
    setLicznik(null);
  }

  return (
    <div className="grid gap-6">
      <section aria-label="Podsumowanie procesów" className="grid grid-cols-4 gap-3">
        {LICZNIKI.map((l) => {
          const aktywny = licznik === l.id;
          return (
            <button
              key={l.id}
              type="button"
              aria-pressed={aktywny}
              onClick={() => setLicznik(aktywny ? null : l.id)}
              className={cn(
                "rounded-xl border bg-card p-4 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50",
                aktywny && "border-primary ring-1 ring-primary",
              )}
            >
              <span className="block text-sm text-muted-foreground">{l.nazwa}</span>
              <span className={cn("block text-3xl font-semibold tabular-nums", l.kolor)}>{liczby[l.id]}</span>
              <span className="block text-xs text-muted-foreground">{l.opis}</span>
            </button>
          );
        })}
      </section>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="hr-filtr-etap" className="text-xs font-medium text-muted-foreground">
              Etap
            </label>
            <Select
              items={ETAPY_ITEMS}
              value={filtrEtapu}
              onValueChange={(v) => setFiltrEtapu((v as FiltrEtapu | null) ?? "wszystkie")}
            >
              <SelectTrigger id="hr-filtr-etap" className="w-60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(ETAPY_ITEMS) as FiltrEtapu[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {ETAPY_ITEMS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="hr-filtr-rodzaj" className="text-xs font-medium text-muted-foreground">
              Rodzaj oceny
            </label>
            <Select
              items={RODZAJE_ITEMS}
              value={filtrRodzaju}
              onValueChange={(v) => setFiltrRodzaju((v as FiltrRodzaju | null) ?? "wszystkie")}
            >
              <SelectTrigger id="hr-filtr-rodzaj" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RODZAJE_ITEMS) as FiltrRodzaju[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {RODZAJE_ITEMS[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {filtrAktywny && (
            <Button variant="ghost" onClick={wyczyscFiltry}>
              Wyczyść filtry
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <ResetDemo />
          <NowyProcesDialog oceny={oceny} />
        </div>
      </div>

      {oceny.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <p className="font-medium">Brak procesów ocen</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Utwórz pierwszy proces przyciskiem „Nowy proces” albo przywróć dane demonstracyjne.
          </p>
        </div>
      ) : (
        <div className="min-w-0 rounded-xl border">
          <Table>
            <TableCaption className="sr-only">
              Procesy ocen pracowników: etap, termin i przypomnienia. Kliknij pracownika, aby zobaczyć szczegóły.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Pracownik</TableHead>
                <TableHead>Rodzaj i arkusz</TableHead>
                <TableHead>Etap</TableHead>
                <TableHead>Termin</TableHead>
                <TableHead>Ostatnia zmiana</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Akcje</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {widoczne.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center whitespace-normal">
                    <p className="text-muted-foreground">Brak procesów spełniających wybrane filtry.</p>
                    <Button variant="link" onClick={wyczyscFiltry}>
                      Wyczyść filtry
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                widoczne.map((o) => (
                  <WierszProcesu
                    key={o.id}
                    ocena={o}
                    dzis={dzis}
                    onSzczegoly={() => setSzczegolyId(o.id)}
                    onPrzypomnij={() => setPrzypomnijId(o.id)}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Prototyp: dane osób są fikcyjne i zapisują się tylko w tej przeglądarce. Terminy pochodzą z pola
        „termin oceny” ustawionego przy tworzeniu procesu. Wysyłka przypomnień jest symulowana.
      </p>

      <SzczegolyProcesu
        ocena={szczegoly}
        dzis={dzis}
        onZamknij={() => setSzczegolyId(null)}
        onPrzypomnij={(o) => setPrzypomnijId(o.id)}
      />
      <PrzypomnienieDialog ocena={przypominana} dzis={dzis} onZamknij={() => setPrzypomnijId(null)} />
    </div>
  );
}

function WierszProcesu({
  ocena,
  dzis,
  onSzczegoly,
  onPrzypomnij,
}: {
  ocena: Ocena;
  dzis: string;
  onSzczegoly: () => void;
  onPrzypomnij: () => void;
}) {
  const p = pracownik(ocena.pracownikId);
  const nazwa = p ? `${p.imie} ${p.nazwisko}` : "Nieznany pracownik";
  const wyslane = ocena.przypomnienia?.length ?? 0;
  const status = statusTerminu(ocena, dzis);

  return (
    <TableRow className={cn(status === "po-terminie" && "bg-destructive/5")}>
      <TableCell className="pl-4">
        <div className="w-44 whitespace-normal xl:w-72">
        <button
          type="button"
          onClick={onSzczegoly}
          className="rounded-sm text-left font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label={`Szczegóły procesu: ${nazwa}`}
        >
          {nazwa}
        </button>
        {p && (
          <>
            <span className="block text-xs text-muted-foreground">{p.stanowisko}</span>
            <span className="line-clamp-2 text-xs text-muted-foreground" title={p.komorka}>
              {p.komorka}
            </span>
          </>
        )}
        </div>
      </TableCell>
      <TableCell>
        <span className="block">{ocena.rodzaj === "okresowa" ? "Okresowa" : "Pierwsza"}</span>
        <span className="block text-xs text-muted-foreground">
          {ocena.rodzaj === "okresowa" ? `arkusz ${ocena.arkusz ?? "—"}` : "arkusz pierwszej oceny"}
        </span>
      </TableCell>
      <TableCell>
        <EtapBadge etap={ocena.etap} />
      </TableCell>
      <TableCell>
        <span className="block tabular-nums">{formatujDate(ocena.terminOceny)}</span>
        <span className="block text-xs">
          <OpisTerminu ocena={ocena} dzis={dzis} />
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        <time dateTime={ocena.zmieniono} title={formatujDateCzas(ocena.zmieniono)}>
          {formatujDate(ocena.zmieniono)}
        </time>
      </TableCell>
      <TableCell className="pr-4">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!moznaPrzypomniec(ocena)}
            onClick={onPrzypomnij}
            aria-label={`Przypomnij – ${nazwa}${wyslane ? ` (wysłano ${wyslane})` : ""}`}
            title={moznaPrzypomniec(ocena) ? undefined : "Proces zakończony – przypomnienie nie jest potrzebne"}
          >
            <BellIcon data-icon="inline-start" aria-hidden />
            Przypomnij
            {wyslane > 0 && <span className="text-muted-foreground tabular-nums">({wyslane})</span>}
          </Button>
          <Link
            href={`/ocena/${ocena.id}`}
            className={buttonVariants({ size: "sm" })}
            aria-label={`Otwórz ocenę – ${nazwa}`}
          >
            Otwórz
          </Link>
        </div>
      </TableCell>
    </TableRow>
  );
}

function ResetDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <RotateCcwIcon data-icon="inline-start" aria-hidden />
        Resetuj dane demo
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Przywrócić dane demonstracyjne?</DialogTitle>
          <DialogDescription>
            Procesy utworzone w tej przeglądarce i wysłane przypomnienia zostaną usunięte. Tej operacji nie
            można cofnąć.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Anuluj</DialogClose>
          <DialogClose
            render={<Button variant="destructive" />}
            onClick={() => {
              resetujDemo();
              toast.success("Przywrócono dane demonstracyjne.");
            }}
          >
            Przywróć dane demo
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
