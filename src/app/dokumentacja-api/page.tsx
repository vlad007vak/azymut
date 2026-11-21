import { ExternalLinkIcon, FileJsonIcon } from "lucide-react";
import type { Metadata } from "next";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { BlokKodu, KartaEndpointu, MetodaBadge, TabelaPol } from "./skladniki";
import { ENDPOINTY, rozwinSchemat, SPEC } from "./spec";
import { WyprobujEksport } from "./wyprobuj-eksport";

export const metadata: Metadata = {
  title: "Dokumentacja API",
  description: "Interfejsy aplikacji Azymut (OpenAPI 3.1) i format eksportu oceny do JSON – do integracji z systemem kadrowym i EZD.",
};

const API_MD = "https://github.com/vlad007vak/azymut/blob/main/docs/API.md";

const SLOWNIKI = ["KompetencjaId", "PoziomId", "RodzajOceny", "Arkusz", "EtapOceny", "WynikOceny"];

const SCHEMATY_EKSPORTU: { nazwa: string; opis: string }[] = [
  { nazwa: "KryteriumEksportu", opis: "Element tablicy kryteria" },
  { nazwa: "WskaznikEksportu", opis: "Element tablicy kryteria[].wskazniki" },
  { nazwa: "PoziomEksportu", opis: "Pola sugestiaSystemu i ocenaCzastkowa" },
  { nazwa: "WynikEksportu", opis: "Pole wynik" },
  { nazwa: "OsobaEksportu", opis: "Pola oceniany i oceniajacy" },
];

const ZASADY = [
  "Żądania i odpowiedzi w formacie JSON (UTF-8).",
  "Błąd ma zawsze postać {\"error\": \"komunikat po polsku\"} z kodem 400 (dane wejściowe), 502/503 (AI) albo 500.",
  "Minimalizacja danych: do endpointów AI nie wysyłamy imion ani nazwisk – tylko stanowisko, kryteria, poziomy i przykłady zachowań.",
  "Odpowiedzi AI są sugestiami. Ostateczny poziom każdego kryterium zawsze wybiera przełożony.",
  "Oceny są przechowywane w przeglądarce. Do systemów zewnętrznych przekazujemy je plikiem eksportu azymut.ocena.",
  "Prototyp nie ma uwierzytelniania – wymagania przed wdrożeniem opisuje docs/API.md.",
];

export default function DokumentacjaApiPage() {
  const eksport = rozwinSchemat({ $ref: "#/components/schemas/EksportOceny" });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Dokumentacja API</h1>
        <p className="max-w-3xl text-muted-foreground">
          Interfejsy aplikacji Azymut opisane w standardzie OpenAPI {SPEC.openapi} – podstawa do bezpiecznej wymiany
          danych z systemem kadrowym i EZD. Poniżej każdy endpoint z przykładowym żądaniem i odpowiedzią oraz format
          eksportu oceny do JSON.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="/openapi.json" target="_blank" rel="noopener" className={buttonVariants()}>
            <FileJsonIcon data-icon="inline-start" /> Specyfikacja OpenAPI (openapi.json)
            <span className="sr-only"> – otwiera się w nowej karcie</span>
          </a>
          <a href={API_MD} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline" })}>
            <ExternalLinkIcon data-icon="inline-start" /> Integracje i bezpieczeństwo (docs/API.md)
            <span className="sr-only"> – otwiera się w nowej karcie</span>
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          Wersja API {SPEC.info.version}. Plik openapi.json można wczytać do dowolnego narzędzia zgodnego z OpenAPI 3.1
          (np. Swagger Editor) i wygenerować z niego klienta.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Zasady wspólne</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid list-disc gap-1.5 pl-5 text-sm">
              {ZASADY.map((z) => (
                <li key={z}>{z}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 id="spis">Spis endpointów</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <nav aria-labelledby="spis">
              <ul className="grid gap-2 text-sm">
                {ENDPOINTY.map((e) => (
                  <li key={e.kotwica}>
                    <a href={`#${e.kotwica}`} className="flex items-baseline gap-2 rounded outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                      <MetodaBadge metoda={e.metoda} />
                      <span className="min-w-0">
                        <code className="font-mono text-xs font-semibold">{e.sciezka}</code>{" "}
                        <span className="text-muted-foreground">– {e.operacja.summary}</span>
                      </span>
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#eksport-oceny" className="flex items-center gap-2 rounded outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                    <FileJsonIcon aria-hidden className="size-4 text-muted-foreground" />
                    Format eksportu oceny (azymut.ocena)
                  </a>
                </li>
              </ul>
            </nav>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4" aria-labelledby="endpointy">
        <h2 id="endpointy" className="text-xl font-semibold tracking-tight">
          Endpointy
        </h2>
        {ENDPOINTY.map((e) => (
          <KartaEndpointu key={e.kotwica} endpoint={e} />
        ))}
      </section>

      <section id="eksport-oceny" className="grid scroll-mt-24 gap-4" aria-labelledby="eksport-naglowek">
        <div className="grid gap-2">
          <h2 id="eksport-naglowek" className="text-xl font-semibold tracking-tight">
            Format eksportu oceny: azymut.ocena, wersja 1
          </h2>
          <p className="max-w-4xl text-sm text-muted-foreground">{eksport.description}</p>
          <p className="max-w-4xl text-sm text-muted-foreground">
            Plik pobiera się przyciskiem „Pobierz JSON” w kroku „Dokument” kreatora oceny. Nazwa pliku nie zawiera danych
            osobowych, np. <code className="font-mono">azymut-ocena-o1-2026-12-04.json</code>.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              <h3>EksportOceny – pola główne</h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TabelaPol schemat={eksport} podpis="Pola główne dokumentu EksportOceny" />
            <details className="grid gap-2">
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                Przykład: ocena okresowa o1 (arkusz C) po sporządzeniu
              </summary>
              <BlokKodu wartosc={eksport.examples?.[0]} etykieta="Przykładowy plik eksportu oceny o1" />
            </details>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Wypróbuj eksport</h3>
            </CardTitle>
            <CardDescription>
              Wybierz ocenę zapisaną w tej przeglądarce i pobierz plik albo obejrzyj jego treść. Dane demonstracyjne są
              fikcyjne.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WyprobujEksport />
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          {SCHEMATY_EKSPORTU.map((s) => (
            <Card key={s.nazwa} size="sm">
              <CardHeader>
                <CardTitle>
                  <h3 className="font-mono">{s.nazwa}</h3>
                </CardTitle>
                <CardDescription>{s.opis}</CardDescription>
              </CardHeader>
              <CardContent>
                <TabelaPol schemat={{ $ref: `#/components/schemas/${s.nazwa}` }} podpis={`Pola ${s.nazwa}`} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="slowniki">
        <h2 id="slowniki" className="text-xl font-semibold tracking-tight">
          Słowniki wartości
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {SLOWNIKI.map((nazwa) => {
            const s = rozwinSchemat({ $ref: `#/components/schemas/${nazwa}` });
            return (
              <Card key={nazwa} size="sm">
                <CardHeader>
                  <CardTitle>
                    <h3 className="font-mono">{nazwa}</h3>
                  </CardTitle>
                  {s.description && <CardDescription>{s.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-wrap gap-1.5" aria-label={`Wartości ${nazwa}`}>
                    {s.enum?.map((v) => (
                      <li key={String(v)}>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{JSON.stringify(v)}</code>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
