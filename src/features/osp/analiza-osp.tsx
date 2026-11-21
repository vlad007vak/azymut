"use client";

import {
  AlertTriangleIcon,
  CheckCheckIcon,
  FileTextIcon,
  InfoIcon,
  Loader2Icon,
  RefreshCwIcon,
  ShieldAlertIcon,
  SparklesIcon,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { kompetencja, kompetencjaWskaznika, wskaznik } from "@/lib/ocena/model";
import { KRYTERIA_OBOWIAZKOWE, MAX_KRYTERIOW_DODATKOWYCH } from "@/lib/ocena/zasady";
import { cn } from "@/lib/utils";
import type { OspSugestia } from "@/types/api";
import type { Arkusz, KompetencjaId } from "@/types/ocena";

import { MAX_DLUGOSC_OSP, MIN_DLUGOSC_OSP, odczytajArkusz, wyczyscOsp, type OdczytArkusza } from "./analiza";
import { PrzelacznikDecyzji } from "./przelacznik-decyzji";
import { PRZYKLADY_OSP } from "./przyklady";

type ArkuszBC = Exclude<Arkusz, "A">;
type StatusAi = "ok" | "niedostepne" | "niepelna";

interface Wynik {
  sugestia: OspSugestia;
  odczyt: OdczytArkusza | null;
  usuniete: string[];
  statusAi: StatusAi;
  /** Za ile sekund dostawca AI przyjmie kolejne zapytanie (limit darmowego planu). */
  ponowZa: number | null;
}

type Stan = { typ: "bezczynny" } | { typ: "ladowanie" } | { typ: "blad"; komunikat: string };

const OPIS_ARKUSZA: Record<ArkuszBC, { nazwa: string; podstawa: string; obowiazkowe: string }> = {
  B: {
    nazwa: "Arkusz B – stanowisko polegające na bezpośrednim kierowaniu pracownikami",
    podstawa: "§ 3 ust. 3",
    obowiazkowe: "§ 4 ust. 2",
  },
  C: { nazwa: "Arkusz C – pozostałe stanowiska", podstawa: "§ 3 ust. 4", obowiazkowe: "§ 4 ust. 3" },
};

const ROZPORZADZENIE = "rozporządzenia PRM z 4.04.2016 r. (Dz.U. 2016 poz. 470)";

/** Ten sam identyfikator – kolejny komunikat zastępuje poprzedni zamiast piętrzyć toasty. */
const TOAST_AI = "osp-ai";
const BLAD_OGOLNY = "Nie udało się przeanalizować opisu stanowiska. Spróbuj ponownie.";

/**
 * Analiza opisu stanowiska pracy (OSP): sugerowany arkusz, max 3 kryteria dodatkowe i najistotniejsze
 * wskaźniki. Przełożony przyjmuje lub odrzuca każdą sugestię; „Zastosuj” przekazuje wynik dalej.
 */
export function AnalizaOsp({ onZastosuj }: { onZastosuj: (sugestia: OspSugestia) => void }) {
  const idPola = useId();
  const [tekst, setTekst] = useState("");
  const [stan, setStan] = useState<Stan>({ typ: "bezczynny" });
  const [wynik, setWynik] = useState<Wynik | null>(null);
  const [arkusz, setArkusz] = useState<ArkuszBC>("C");
  const [decyzjeKryteria, setDecyzjeKryteria] = useState<Record<string, boolean>>({});
  const [decyzjeWskazniki, setDecyzjeWskazniki] = useState<Record<string, boolean>>({});
  const [wczytywanyPrzyklad, setWczytywanyPrzyklad] = useState<string | null>(null);
  const poleRef = useRef<HTMLTextAreaElement>(null);
  // Blokada podwójnego kliknięcia – stan Reacta zmienia się dopiero po ponownym renderze.
  const trwa = useRef(false);

  const ladowanie = stan.typ === "ladowanie";

  async function wczytajPrzyklad(p: (typeof PRZYKLADY_OSP)[number]) {
    setWczytywanyPrzyklad(p.id);
    try {
      setTekst(await p.wczytaj());
      setWynik(null);
      setStan({ typ: "bezczynny" });
    } catch {
      toast.error("Nie udało się wczytać przykładu. Odśwież stronę i spróbuj ponownie.");
    } finally {
      setWczytywanyPrzyklad(null);
    }
  }

  async function analizuj() {
    if (trwa.current) return;
    // Dane osobowe usuwamy w przeglądarce – nie opuszczają komputera.
    const { tekst: czysty, usuniete } = wyczyscOsp(tekst);
    if (czysty.length < MIN_DLUGOSC_OSP) {
      setStan({ typ: "blad", komunikat: "Opis stanowiska jest za krótki. Wklej cały tekst OSP albo wybierz przykład." });
      return;
    }
    if (czysty.length > MAX_DLUGOSC_OSP) {
      setStan({
        typ: "blad",
        komunikat: `Opis jest za długi (maks. ${MAX_DLUGOSC_OSP.toLocaleString("pl-PL")} znaków). Usuń fragmenty niezwiązane z zadaniami.`,
      });
      return;
    }
    const odczyt = odczytajArkusz(czysty);
    trwa.current = true;
    setStan({ typ: "ladowanie" });
    try {
      const res = await fetch("/api/osp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tekst: czysty }),
      });
      const dane: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const komunikat =
          dane && typeof dane === "object" && "error" in dane && typeof dane.error === "string"
            ? dane.error
            : BLAD_OGOLNY;
        throw new Error(komunikat);
      }
      const sugestia = dane as OspSugestia;
      const statusAi = (res.headers.get("X-AI-Status") as StatusAi | null) ?? "ok";
      const ponowZa = Number(res.headers.get("X-AI-Retry-After")) || null;
      setWynik({ sugestia, odczyt, usuniete, statusAi, ponowZa });
      setArkusz(sugestia.sugerowanyArkusz);
      setDecyzjeKryteria({});
      setDecyzjeWskazniki({});
      setStan({ typ: "bezczynny" });
      if (statusAi === "ok") {
        toast.success("Analiza gotowa. Przejrzyj sugestie i zdecyduj, które przyjmujesz.", { id: TOAST_AI });
      } else {
        toast.warning("AI nie przygotowało pełnych sugestii – sprawdź komunikat.", { id: TOAST_AI });
      }
    } catch (err) {
      const komunikat =
        err instanceof TypeError
          ? "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie."
          : err instanceof Error && err.message
            ? err.message
            : BLAD_OGOLNY;
      setStan({ typ: "blad", komunikat });
      toast.error(komunikat, { id: TOAST_AI });
    } finally {
      trwa.current = false;
    }
  }

  // ── Wynik po decyzjach przełożonego ────────────────────────────────────────
  const obowiazkowe: KompetencjaId[] = KRYTERIA_OBOWIAZKOWE[arkusz];
  const dodatkowe = (wynik?.sugestia.kryteriaDodatkowe ?? []).map((k) => ({
    ...k,
    kolizja: obowiazkowe.includes(k.kompetencjaId),
    przyjete: decyzjeKryteria[k.kompetencjaId] !== false,
  }));
  const przyjeteDodatkowe = dodatkowe.filter((k) => !k.kolizja && k.przyjete);
  const kryteriaOceny: { id: KompetencjaId; dodatkowe: boolean }[] = [
    ...obowiazkowe.map((id) => ({ id, dodatkowe: false })),
    ...dodatkowe.filter((k) => !k.kolizja).map((k) => ({ id: k.kompetencjaId, dodatkowe: true })),
  ];
  const wskaznikiWg = (id: KompetencjaId) =>
    (wynik?.sugestia.wskazniki ?? []).filter((w) => kompetencjaWskaznika(w.wskaznikId)?.id === id);
  const aktywne = new Set<KompetencjaId>([...obowiazkowe, ...przyjeteDodatkowe.map((k) => k.kompetencjaId)]);
  const wynikDoZastosowania: OspSugestia = {
    sugerowanyArkusz: arkusz,
    kryteriaDodatkowe: przyjeteDodatkowe.map(({ kompetencjaId, uzasadnienie }) => ({ kompetencjaId, uzasadnienie })),
    wskazniki: (wynik?.sugestia.wskazniki ?? []).filter((w) => {
      const k = kompetencjaWskaznika(w.wskaznikId);
      return !!k && aktywne.has(k.id) && decyzjeWskazniki[w.wskaznikId] !== false;
    }),
  };

  function zastosuj() {
    onZastosuj(wynikDoZastosowania);
    toast.success("Zastosowano wybrane sugestie.");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Opis stanowiska pracy</h2>
          </CardTitle>
          <CardDescription>
            Wklej treść OSP (np. skopiowaną z dokumentu Word) albo wczytaj jeden z przykładów od organizatora.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Alert>
            <ShieldAlertIcon />
            <AlertTitle>Nie wklejaj danych osobowych</AlertTitle>
            <AlertDescription>
              Analiza potrzebuje tylko zadań i wymagań na stanowisku. Część „Zapoznanie pracownika z opisem stanowiska
              pracy” (imię i nazwisko, podpis) oraz część III z podpisami usuwamy automatycznie, zanim tekst trafi do
              AI.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Wczytaj przykład</p>
            <div className="flex flex-wrap gap-2">
              {PRZYKLADY_OSP.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant="outline"
                  className="h-auto flex-col items-start gap-0 py-1.5 text-left"
                  onClick={() => wczytajPrzyklad(p)}
                  disabled={ladowanie || wczytywanyPrzyklad !== null}
                >
                  <span className="flex items-center gap-1.5">
                    {wczytywanyPrzyklad === p.id ? (
                      <Loader2Icon className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <FileTextIcon className="size-4" aria-hidden />
                    )}
                    {p.etykieta}
                  </span>
                  <span className="text-xs font-normal text-muted-foreground">{p.opis}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={idPola}>Treść opisu stanowiska pracy</Label>
            <Textarea
              ref={poleRef}
              id={idPola}
              value={tekst}
              onChange={(e) => setTekst(e.target.value)}
              placeholder="OPIS STANOWISKA PRACY… CEL ISTNIENIA STANOWISKA PRACY… LICZBA PODLEGŁYCH PRACOWNIKÓW… GŁÓWNE ZADANIA…"
              className="h-72 [field-sizing:fixed] font-mono text-xs md:text-xs"
              aria-describedby={`${idPola}-licznik`}
              disabled={ladowanie}
            />
            <p
              id={`${idPola}-licznik`}
              className={cn(
                "text-xs text-muted-foreground",
                tekst.length > MAX_DLUGOSC_OSP && "font-medium text-destructive",
              )}
            >
              {tekst.length.toLocaleString("pl-PL")} / {MAX_DLUGOSC_OSP.toLocaleString("pl-PL")} znaków
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button onClick={analizuj} disabled={ladowanie || tekst.trim().length === 0} size="lg">
            {ladowanie ? (
              <Loader2Icon data-icon="inline-start" className="animate-spin" />
            ) : (
              <SparklesIcon data-icon="inline-start" />
            )}
            {ladowanie ? "Analizuję…" : "Analizuj opis stanowiska"}
          </Button>
          {tekst && !ladowanie && (
            <Button
              variant="ghost"
              onClick={() => {
                setTekst("");
                setWynik(null);
                setStan({ typ: "bezczynny" });
                // Przycisk znika po wyczyszczeniu – fokus wraca do pola, żeby nie zgubić go z klawiatury.
                poleRef.current?.focus();
              }}
            >
              Wyczyść
            </Button>
          )}
        </CardFooter>
      </Card>

      {ladowanie && (
        <Card aria-live="polite" aria-busy="true">
          <CardContent className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden /> Analizuję zadania na stanowisku – to może
              potrwać kilka sekund…
            </p>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      )}

      {stan.typ === "blad" && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>Nie udało się przeanalizować opisu</AlertTitle>
          <AlertDescription>{stan.komunikat}</AlertDescription>
        </Alert>
      )}

      {wynik && !ladowanie && (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Sugestie dla oceny okresowej</h2>
            </CardTitle>
            <CardDescription>
              Przyjmij albo odrzuć każdą sugestię, a potem kliknij „Zastosuj”. AI tylko podpowiada – decyzję podejmujesz
              Ty.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {wynik.usuniete.length > 0 && (
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Przed wysłaniem usunięto: {wynik.usuniete.join(", ")}.
              </p>
            )}
            {wynik.statusAi !== "ok" && (
              <Alert>
                <AlertTriangleIcon />
                <AlertTitle>
                  {wynik.statusAi === "niedostepne" ? "AI jest chwilowo niedostępne" : "AI zwróciło niepełne sugestie"}
                </AlertTitle>
                <AlertDescription>
                  <p>
                    Arkusz odczytaliśmy z opisu stanowiska. Kryteria dodatkowe i wskaźniki możesz dobrać ręcznie w
                    kreatorze albo spróbować analizy ponownie
                    {wynik.ponowZa ? ` za ok. ${wynik.ponowZa} s (limit darmowego planu AI).` : " za chwilę."}
                  </p>
                  <Button variant="outline" size="sm" onClick={analizuj} className="mt-1">
                    <RefreshCwIcon data-icon="inline-start" /> Analizuj ponownie
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Arkusz */}
            <section aria-labelledby="osp-arkusz" className="flex flex-col gap-3">
              <h3 id="osp-arkusz" className="font-semibold">
                Arkusz oceny
              </h3>
              <div role="group" aria-label="Wybór arkusza" className="flex flex-wrap gap-2">
                {(["B", "C"] as const).map((a) => (
                  <Button
                    key={a}
                    type="button"
                    variant={arkusz === a ? "default" : "outline"}
                    aria-pressed={arkusz === a}
                    onClick={() => setArkusz(a)}
                  >
                    {OPIS_ARKUSZA[a].nazwa}
                    {wynik.sugestia.sugerowanyArkusz === a && (
                      <Badge variant="secondary" className="ml-1">
                        sugerowany
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {wynik.odczyt ? (
                  <>
                    Odczytano z sekcji „Liczba podległych pracowników”: <strong>☒ {wynik.odczyt.zaznaczone}</strong>.
                    Podstawa: {OPIS_ARKUSZA[wynik.odczyt.arkusz].podstawa} {ROZPORZADZENIE}.
                  </>
                ) : (
                  <>
                    Nie udało się odczytać sekcji „Liczba podległych pracowników” – arkusz zasugerowało AI. Sprawdź,
                    czy stanowisko polega na bezpośrednim kierowaniu pracownikami.
                  </>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Kryteria obowiązkowe ({OPIS_ARKUSZA[arkusz].obowiazkowe}):
                </span>
                {obowiazkowe.map((id) => (
                  <Badge key={id} variant="outline">
                    {kompetencja(id).nazwa}
                  </Badge>
                ))}
              </div>
            </section>

            {/* Kryteria dodatkowe */}
            <section aria-labelledby="osp-kryteria" className="flex flex-col gap-3">
              <div>
                <h3 id="osp-kryteria" className="font-semibold">
                  Kryteria dodatkowe
                </h3>
                <p className="text-xs text-muted-foreground">
                  Nie więcej niż {MAX_KRYTERIOW_DODATKOWYCH}, najistotniejsze ze względu na charakter obowiązków (§ 5
                  ust. 2 rozporządzenia).
                </p>
              </div>
              {dodatkowe.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Brak sugestii kryteriów dodatkowych – ocena może obejmować tylko kryteria obowiązkowe.
                </p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {dodatkowe.map((k) => (
                    <li
                      key={k.kompetencjaId}
                      className={cn(
                        "flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3",
                        (k.kolizja || !k.przyjete) && "bg-muted/40",
                      )}
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                        <p className={cn("font-medium", !k.przyjete && !k.kolizja && "line-through")}>
                          {kompetencja(k.kompetencjaId).nazwa}
                        </p>
                        <p className="text-muted-foreground">{k.uzasadnienie}</p>
                        {k.kolizja && (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            Przy arkuszu {arkusz} to kryterium jest obowiązkowe – nie może być dodatkowe.
                          </p>
                        )}
                      </div>
                      <PrzelacznikDecyzji
                        przyjete={k.przyjete && !k.kolizja}
                        disabled={k.kolizja}
                        etykieta={`kryterium dodatkowe ${kompetencja(k.kompetencjaId).nazwa}`}
                        onZmiana={(v) => setDecyzjeKryteria((d) => ({ ...d, [k.kompetencjaId]: v }))}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Wskaźniki */}
            <section aria-labelledby="osp-wskazniki" className="flex flex-col gap-3">
              <div>
                <h3 id="osp-wskazniki" className="font-semibold">
                  Wskaźniki najistotniejsze dla zadań na stanowisku
                </h3>
                <p className="text-xs text-muted-foreground">
                  Wskaźniki z modelu kompetencji, dobrane do zadań z OSP. Na ich podstawie ocenisz zachowania
                  pracownika.
                </p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {kryteriaOceny.map(({ id, dodatkowe: czyDodatkowe }) => {
                  const lista = wskaznikiWg(id);
                  const nieaktywne = !aktywne.has(id);
                  return (
                    <div key={id} className={cn("flex flex-col gap-2 rounded-lg border p-3", nieaktywne && "opacity-60")}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-medium">{kompetencja(id).nazwa}</h4>
                        <Badge variant="outline">{czyDodatkowe ? "dodatkowe" : "obowiązkowe"}</Badge>
                      </div>
                      {nieaktywne ? (
                        <p className="text-xs text-muted-foreground">Kryterium odrzucone – wskaźniki nie zostaną użyte.</p>
                      ) : lista.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Brak sugestii – w kreatorze zostaną wszystkie wskaźniki tego kryterium.
                        </p>
                      ) : (
                        <ul className="flex flex-col gap-3">
                          {lista.map((w) => {
                            const przyjety = decyzjeWskazniki[w.wskaznikId] !== false;
                            return (
                              <li key={w.wskaznikId} className="flex flex-col gap-2 text-sm">
                                <div>
                                  <p className={cn("font-medium", !przyjety && "text-muted-foreground line-through")}>
                                    {wskaznik(w.wskaznikId)?.opis}
                                  </p>
                                  {w.uzasadnienie && <p className="text-xs text-muted-foreground">{w.uzasadnienie}</p>}
                                </div>
                                <PrzelacznikDecyzji
                                  przyjete={przyjety}
                                  etykieta={`wskaźnik ${wskaznik(w.wskaznikId)?.opis ?? w.wskaznikId}`}
                                  onZmiana={(v) => setDecyzjeWskazniki((d) => ({ ...d, [w.wskaznikId]: v }))}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center gap-3">
            <Button onClick={zastosuj} size="lg">
              <CheckCheckIcon data-icon="inline-start" /> Zastosuj
            </Button>
            <span className="text-sm text-muted-foreground">
              Arkusz {wynikDoZastosowania.sugerowanyArkusz} · kryteria dodatkowe:{" "}
              {wynikDoZastosowania.kryteriaDodatkowe.length} · wskaźniki: {wynikDoZastosowania.wskazniki.length}
            </span>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
