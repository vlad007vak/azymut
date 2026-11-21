"use client";

import { CheckIcon, PrinterIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EksportOceny } from "@/features/eksport";
import { kompetencja, poziom } from "@/lib/ocena/model";
import { pracownik as znajdzPracownika } from "@/lib/ocena/store";
import type { Osoba } from "@/types/ocena";

import { rozstrzygnij } from "./krok-decyzja";
import type { KrokProps } from "./kreator";
import { data, doEtapu, dzisIso, liczba, NAZWA_URZEDU_DEMO, sugestiaKryterium } from "./logika";

export function KrokDokument({ ocena, zmien }: KrokProps) {
  const osoba = znajdzPracownika(ocena.pracownikId);
  const wynik = rozstrzygnij(ocena);
  const okresowa = ocena.rodzaj === "okresowa";

  const zapoznany = () => {
    zmien((o) => doEtapu({ ...o, daty: { ...o.daty, zapoznanie: dzisIso() } }, "zakonczona"));
    toast.success("Proces zakończony", { description: "Pracownik zapoznał się z oceną." });
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Alert className="max-w-2xl">
          <AlertDescription>
            Podgląd dokumentu według wzoru arkusza. „Drukuj / zapisz PDF” otwiera okno drukowania przeglądarki – wybierz
            „Zapisz jako PDF”. Dokument zawiera dane osobowe – przechowuj go zgodnie z zasadami urzędu.
          </AlertDescription>
        </Alert>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <PrinterIcon data-icon="inline-start" /> Drukuj / zapisz PDF
          </Button>
          <EksportOceny ocena={ocena} urzad={NAZWA_URZEDU_DEMO} />
          {ocena.etap === "sporzadzona" && (
            <Button onClick={zapoznany}>
              <CheckIcon data-icon="inline-start" /> Pracownik zapoznał się z oceną
            </Button>
          )}
        </div>
      </div>

      <article className="mx-auto grid w-full max-w-4xl gap-5 rounded-lg border bg-card p-8 text-sm print:max-w-none print:border-0 print:p-0">
        <header className="grid gap-1 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{NAZWA_URZEDU_DEMO}</p>
          <h2 className="text-lg font-semibold uppercase">
            {okresowa ? `Arkusz ${ocena.arkusz} – ocena okresowa` : "Arkusz pierwszej oceny w służbie cywilnej"}
          </h2>
          <p className="text-muted-foreground">
            Okres podlegania ocenie: {data(ocena.okres.od)} – {data(ocena.okres.do)}
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <DaneOsoby tytul="Dane ocenianego" osoba={osoba} />
          <DaneOsoby tytul={okresowa ? "Dane oceniającego" : "Dane bezpośredniego przełożonego"} osoba={ocena.oceniajacy} />
        </section>

        <section className="grid gap-1">
          <Wiersz etykieta={okresowa ? "Data rozmowy o kryteriach oceny" : "Data rozmowy wstępnej"} wartosc={data(ocena.daty.rozmowaWstepna)} />
          {!okresowa && <Wiersz etykieta="Termin złożenia sprawozdania" wartosc={data(ocena.pierwsza?.terminSprawozdania)} />}
          <Wiersz etykieta="Data rozmowy oceniającej" wartosc={data(ocena.daty.rozmowaOceniajaca)} />
          {okresowa && <Wiersz etykieta="Termin sporządzenia oceny" wartosc={data(ocena.terminOceny)} />}
        </section>

        <section className="grid gap-2">
          <h3 className="font-semibold uppercase">{okresowa ? "Kryteria oceny i oceny cząstkowe" : "Elementy oceny i oceny cząstkowe"}</h3>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b">
                <th className="py-1.5 pr-2 font-medium">Kryterium</th>
                <th className="py-1.5 pr-2 font-medium">Rodzaj</th>
                <th className="py-1.5 pr-2 font-medium">Sugestia systemu</th>
                <th className="py-1.5 font-medium">Ocena cząstkowa (decyzja)</th>
              </tr>
            </thead>
            <tbody>
              {ocena.kryteria.map((k) => {
                const s = sugestiaKryterium(k, ocena.rodzaj);
                return (
                  <tr key={k.kompetencjaId} className="border-b align-top">
                    <td className="py-1.5 pr-2">{kompetencja(k.kompetencjaId).nazwa}</td>
                    <td className="py-1.5 pr-2">{okresowa ? (k.dodatkowe ? "dodatkowe" : "obowiązkowe") : "element oceny"}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{s.pokaz ? poziom(s.pokaz).nazwa.toLowerCase() : "—"}</td>
                    <td className="py-1.5 font-medium">
                      {k.decyzja ? `${poziom(k.decyzja).nazwa.toLowerCase()} – ${poziom(k.decyzja).punkty} pkt` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {wynik && (
          <section className="grid gap-1">
            {okresowa ? (
              <>
                <Wiersz etykieta="Średnia arytmetyczna ocen cząstkowych" wartosc={`${liczba(wynik.punkty)} pkt`} />
                <Wiersz
                  etykieta="Ogólny poziom spełnienia kryteriów"
                  wartosc={wynik.poziomOgolny ? poziom(wynik.poziomOgolny).nazwa.toLowerCase() : "—"}
                />
              </>
            ) : (
              <>
                <Wiersz etykieta="Ocena łączna" wartosc={`${liczba(wynik.punkty)} pkt`} />
                <Wiersz
                  etykieta="Egzamin ze służby przygotowawczej zaliczony"
                  wartosc={{ tak: "tak", nie: "nie", "nie-dotyczy": "nie dotyczy" }[ocena.pierwsza?.egzaminSluzbyPrzygotowawczej ?? "tak"]}
                />
                <Wiersz
                  etykieta="Sprawozdanie złożone w terminie"
                  wartosc={ocena.pierwsza?.sprawozdanieWTerminie == null ? "—" : ocena.pierwsza.sprawozdanieWTerminie ? "tak" : "nie"}
                />
              </>
            )}
            <Wiersz etykieta={okresowa ? "Ocena okresowa" : "Pierwsza ocena"} wartosc={(ocena.wynik ?? wynik.wynik).toUpperCase()} mocno />
          </section>
        )}

        <Blok tytul={okresowa ? "Uzasadnienie przyznanej oceny okresowej" : "Uzasadnienie przyznanej oceny"} tresc={ocena.uzasadnienie} />
        <Blok
          tytul={okresowa ? "Wnioski dotyczące indywidualnego programu rozwoju zawodowego" : "Wnioski dotyczące rozwoju zawodowego"}
          tresc={ocena.wnioskiRozwojowe}
        />

        <section className="grid gap-1">
          <Wiersz etykieta="Data sporządzenia oceny" wartosc={data(ocena.daty.sporzadzenie)} />
          <Wiersz etykieta="Data zapoznania ocenianego z oceną" wartosc={data(ocena.daty.zapoznanie)} />
        </section>

        <section className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-muted-foreground">
          <p className="border-t pt-1">podpis {okresowa ? "oceniającego" : "bezpośredniego przełożonego"}</p>
          <p className="border-t pt-1">podpis ocenianego</p>
        </section>

        {okresowa && (
          <p className="text-xs text-muted-foreground">
            Pouczenie: Zgodnie z art. 83 ust. 1 ustawy z dnia 21 listopada 2008 r. o służbie cywilnej od oceny okresowej
            służy, w terminie 7 dni od dnia zapoznania się z oceną, sprzeciw do dyrektora generalnego urzędu.
          </p>
        )}
        <p className="text-xs text-muted-foreground print:hidden">
          Prototyp: dokument przygotowany w aplikacji Azymut na podstawie wzoru arkusza z rozporządzenia; dane są fikcyjne.
        </p>
      </article>
    </div>
  );
}

function DaneOsoby({ tytul, osoba }: { tytul: string; osoba?: Osoba }) {
  return (
    <div className="grid gap-1">
      <h3 className="font-semibold uppercase">{tytul}</h3>
      <Wiersz etykieta="Imię i nazwisko" wartosc={osoba ? `${osoba.imie} ${osoba.nazwisko}` : "—"} />
      <Wiersz etykieta="Stanowisko" wartosc={osoba?.stanowisko ?? "—"} />
      <Wiersz etykieta="Komórka organizacyjna" wartosc={osoba?.komorka ?? "—"} />
    </div>
  );
}

function Wiersz({ etykieta, wartosc, mocno }: { etykieta: string; wartosc: string; mocno?: boolean }) {
  return (
    <p className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-2">
      <span className="text-muted-foreground">{etykieta}</span>
      <span className={mocno ? "font-semibold" : undefined}>{wartosc}</span>
    </p>
  );
}

function Blok({ tytul, tresc }: { tytul: string; tresc?: string }) {
  return (
    <section className="grid gap-1">
      <h3 className="font-semibold uppercase">{tytul}</h3>
      <p className="min-h-10 whitespace-pre-line rounded border p-2">{tresc?.trim() || "—"}</p>
    </section>
  );
}
