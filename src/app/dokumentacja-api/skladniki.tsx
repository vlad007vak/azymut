import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { type Endpoint, type Media, nazwaRef, pola, przyklady, rozwinOdpowiedz, type Schemat } from "./spec";

const KOLOR_METODY: Record<string, string> = {
  get: "bg-emerald-600/10 text-emerald-800 dark:text-emerald-300",
  post: "bg-sky-600/10 text-sky-800 dark:text-sky-300",
};

export function MetodaBadge({ metoda }: { metoda: string }) {
  return (
    <Badge variant="outline" className={cn("font-mono uppercase", KOLOR_METODY[metoda])}>
      {metoda}
    </Badge>
  );
}

function KodBadge({ kod }: { kod: string }) {
  const kolor = kod.startsWith("2")
    ? "bg-emerald-600/10 text-emerald-800 dark:text-emerald-300"
    : kod.startsWith("4")
      ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
      : "bg-destructive/10 text-destructive";
  return (
    <Badge variant="outline" className={cn("font-mono", kolor)}>
      {kod}
    </Badge>
  );
}

export function BlokKodu({ wartosc, etykieta }: { wartosc: unknown; etykieta: string }) {
  const tekst = typeof wartosc === "string" ? wartosc : JSON.stringify(wartosc, null, 2);
  return (
    <pre
      tabIndex={0}
      aria-label={etykieta}
      className="max-h-96 overflow-auto rounded-md bg-muted p-3 font-mono text-xs leading-relaxed focus-visible:outline-2 focus-visible:outline-ring"
    >
      <code>{tekst}</code>
    </pre>
  );
}

export function TabelaPol({ schemat, podpis }: { schemat: Schemat; podpis: string }) {
  const lista = pola(schemat);
  if (lista.length === 0) return null;
  return (
    <Table aria-label={podpis}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="w-48">Pole</TableHead>
          <TableHead scope="col" className="w-56">Typ</TableHead>
          <TableHead scope="col" className="w-24">Wymagane</TableHead>
          <TableHead scope="col">Opis</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lista.map((p) => (
          <TableRow key={p.nazwa} className="align-top">
            <TableCell className="font-mono text-xs font-medium">{p.nazwa}</TableCell>
            <TableCell className="whitespace-normal font-mono text-xs text-muted-foreground">{p.typ}</TableCell>
            <TableCell className="text-xs">{p.wymagane ? "tak" : "nie"}</TableCell>
            <TableCell className="whitespace-normal text-xs">
              {p.opis || "—"}
              {p.ograniczenia && <span className="text-muted-foreground"> ({p.ograniczenia})</span>}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Przyklady({ media, otwarte, kontekst }: { media: Media; otwarte: boolean; kontekst: string }) {
  return przyklady(media).map((p, i) => (
    <details key={i} open={otwarte && i === 0} className="group grid gap-2">
      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
        {p.nazwa}
      </summary>
      <BlokKodu wartosc={p.wartosc} etykieta={`${kontekst}: ${p.nazwa}`} />
    </details>
  ));
}

function NazwaSchematu({ schemat }: { schemat?: Schemat }) {
  if (!schemat?.$ref) return null;
  return (
    <span className="text-xs text-muted-foreground">
      schemat <code className="font-mono">{nazwaRef(schemat.$ref)}</code>
    </span>
  );
}

export function KartaEndpointu({ endpoint }: { endpoint: Endpoint }) {
  const { metoda, sciezka, operacja, kotwica } = endpoint;
  const zadanie = operacja.requestBody?.content["application/json"];
  const nazwa = `${metoda.toUpperCase()} ${sciezka}`;

  return (
    <Card id={kotwica} className="scroll-mt-24">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <MetodaBadge metoda={metoda} />
          <code className="font-mono text-sm font-semibold">{sciezka}</code>
          {operacja.tags?.map((t) => (
            <Badge key={t} variant="secondary">
              {t}
            </Badge>
          ))}
        </div>
        <CardTitle>
          <h3>{operacja.summary}</h3>
        </CardTitle>
        {operacja.description && <CardDescription className="max-w-4xl">{operacja.description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-6">
        <section className="grid gap-3" aria-label={`Żądanie ${nazwa}`}>
          <h4 className="text-sm font-semibold">Żądanie</h4>
          {zadanie ? (
            <>
              <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                Treść <code className="font-mono">application/json</code>
                <NazwaSchematu schemat={zadanie.schema} />
              </p>
              {zadanie.schema && <TabelaPol schemat={zadanie.schema} podpis={`Pola żądania ${nazwa}`} />}
              <Przyklady media={zadanie} otwarte kontekst={`Przykładowe żądanie ${nazwa}`} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Bez treści żądania.</p>
          )}
        </section>

        <section className="grid gap-3" aria-label={`Odpowiedzi ${nazwa}`}>
          <h4 className="text-sm font-semibold">Odpowiedzi</h4>
          <ul className="grid gap-3">
            {Object.entries(operacja.responses).map(([kod, o]) => {
              const odp = rozwinOdpowiedz(o);
              const naglowki = Object.keys(odp.headers ?? {});
              return (
                <li key={kod} className="grid gap-2 rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <KodBadge kod={kod} />
                    <span className="text-sm">{odp.description}</span>
                  </div>
                  {naglowki.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nagłówki:{" "}
                      {naglowki.map((n, i) => (
                        <span key={n}>
                          {i > 0 && ", "}
                          <code className="font-mono">{n}</code>
                        </span>
                      ))}
                    </p>
                  )}
                  {Object.entries(odp.content ?? {}).map(([typ, media]) => (
                    <div key={typ} className="grid gap-2">
                      <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        Treść <code className="font-mono">{typ}</code>
                        <NazwaSchematu schemat={media.schema} />
                      </p>
                      <Przyklady media={media} otwarte={kod.startsWith("2")} kontekst={`Odpowiedź ${kod} ${nazwa}`} />
                    </div>
                  ))}
                </li>
              );
            })}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
