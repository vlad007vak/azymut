"use client";

import { BookOpenTextIcon, InfoIcon, Loader2Icon, RotateCcwIcon, SendIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AsystentZapytanie } from "@/types/api";
import type { RodzajOceny } from "@/types/ocena";

import { przykladyDla } from "../przyklady";
import type { OdpowiedzAsystenta } from "../typy";
import { OdpowiedzAsystentaWidok } from "./odpowiedz-asystenta";

type Wiadomosc =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; odp: OdpowiedzAsystenta };

export interface AsystentPanelProps {
  /** Ścieżka, w której jest użytkownik – dobiera przykładowe pytania i podbija właściwe dokumenty. */
  rodzaj?: RodzajOceny;
  /** Klasy obszaru wiadomości (np. wysokość przy osadzeniu w kreatorze). */
  className?: string;
  /**
   * Czerwony przycisk „Wyślij pytanie” – tylko gdy asystent jest głównym działaniem ekranu (strona /asystent).
   * W kreatorze zostaje granatowy, bo główne działanie kroku ma tam inny przycisk.
   */
  glownyPrzycisk?: boolean;
}

const MAX_DLUGOSC = 1000;

/** Awatar asystenta obok jego dymków. */
function AwatarAsystenta() {
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm"
      aria-hidden
    >
      <BookOpenTextIcon className="size-4" strokeWidth={1.5} />
    </span>
  );
}

/** Asystent formalny: odpowiedzi z bazy wiedzy (rozporządzenia, poradniki KPRM, model kompetencji) ze źródłami. */
export function AsystentPanel({ rodzaj, className, glownyPrzycisk = false }: AsystentPanelProps) {
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [input, setInput] = useState("");
  const [laduje, setLaduje] = useState(false);
  const koniecRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const przyklady = przykladyDla(rodzaj);
  const inputId = `asystent-pytanie-${rodzaj ?? "wszystkie"}`;

  useEffect(() => {
    koniecRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [wiadomosci, laduje]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function wyslij(tekst: string) {
    const pytanie = tekst.trim();
    if (pytanie.length < 3 || laduje) return;

    const historia = wiadomosci.slice(-4).map((m) => ({ role: m.role, content: m.content }));
    setWiadomosci((prev) => [...prev, { role: "user", content: pytanie }]);
    setInput("");
    setLaduje(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const body: AsystentZapytanie = { pytanie, historia, ...(rodzaj ? { rodzaj } : {}) };
      const res = await fetch("/api/asystent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error ?? "Nie udało się uzyskać odpowiedzi asystenta.");
      const odp = data as OdpowiedzAsystenta;
      setWiadomosci((prev) => [...prev, { role: "assistant", content: odp.odpowiedz, odp }]);
    } catch (err) {
      if (controller.signal.aborted) return;
      // Bez sieci fetch rzuca TypeError z angielskim komunikatem przeglądarki („Failed to fetch”).
      toast.error(
        err instanceof TypeError
          ? "Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie."
          : err instanceof Error
            ? err.message
            : "Wystąpił nieznany błąd.",
      );
      // Cofamy pytanie do pola, żeby można było spróbować ponownie.
      setWiadomosci((prev) => prev.slice(0, -1));
      setInput(pytanie);
    } finally {
      setLaduje(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }

  function wyczysc() {
    abortRef.current?.abort();
    setWiadomosci([]);
    setLaduje(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          "flex max-h-[34rem] min-h-64 flex-col gap-4 overflow-y-auto rounded-xl border bg-muted/50 p-4",
          className,
        )}
        aria-live="polite"
        aria-busy={laduje}
        aria-label="Rozmowa z asystentem formalnym"
      >
        {wiadomosci.length === 0 && !laduje ? (
          <div className="m-auto flex max-w-xl flex-col items-center gap-4 py-6 text-center">
            <span
              className="flex size-12 items-center justify-center rounded-full bg-card text-primary shadow-sm ring-1 ring-foreground/10"
              aria-hidden
            >
              <BookOpenTextIcon className="size-6" strokeWidth={1.5} />
            </span>
            <p className="text-sm text-muted-foreground">
              Zapytaj o zasady {rodzaj === "pierwsza" ? "pierwszej oceny" : rodzaj === "okresowa" ? "oceny okresowej" : "pierwszej oceny lub oceny okresowej"}.
              Odpowiem na podstawie przepisów i poradników KPRM oraz wskażę źródło.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {przyklady.map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  className="h-auto rounded-full bg-card px-3 py-1.5 text-left whitespace-normal"
                  onClick={() => wyslij(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          wiadomosci.map((m, i) =>
            m.role === "user" ? (
              <div
                key={i}
                className="max-w-[80%] self-end rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-primary-foreground shadow-sm"
              >
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            ) : (
              <div key={i} className="flex w-full max-w-[92%] items-start gap-3 self-start">
                <AwatarAsystenta />
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border bg-card px-4 py-3 shadow-sm">
                  <OdpowiedzAsystentaWidok odp={m.odp} />
                </div>
              </div>
            ),
          )
        )}
        {laduje && (
          <div className="flex items-start gap-3 self-start">
            <AwatarAsystenta />
            <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border bg-card px-4 py-2.5 text-sm text-muted-foreground shadow-sm">
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Szukam w bazie wiedzy i przygotowuję odpowiedź…
            </div>
          </div>
        )}
        <div ref={koniecRef} />
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          wyslij(input);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Pytanie do asystenta formalnego
        </label>
        <Textarea
          id={inputId}
          ref={inputRef}
          value={input}
          maxLength={MAX_DLUGOSC}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              wyslij(input);
            }
          }}
          placeholder="Np. Ile kryteriów dodatkowych mogę wybrać? (Enter – wyślij, Shift+Enter – nowa linia)"
          className="max-h-40 min-h-11 rounded-xl px-3.5 py-3"
          disabled={laduje}
          aria-describedby={`${inputId}-opis`}
        />
        <Button
          type="submit"
          variant={glownyPrzycisk ? "brand" : "default"}
          size="icon-lg"
          className="size-11 rounded-xl"
          disabled={laduje || input.trim().length < 3}
          aria-label="Wyślij pytanie"
        >
          {laduje ? <Loader2Icon className="animate-spin" /> : <SendIcon strokeWidth={1.5} />}
        </Button>
        {wiadomosci.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="size-11 rounded-xl"
            onClick={wyczysc}
            aria-label="Wyczyść rozmowę"
          >
            <RotateCcwIcon strokeWidth={1.5} />
          </Button>
        )}
      </form>

      <p id={`${inputId}-opis`} className="flex gap-2 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">
        <InfoIcon className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <span>
          <strong className="font-medium text-foreground">
            Asystent ma charakter pomocniczy – decyzję podejmuje przełożony.
          </strong>{" "}
          Odpowiada wyłącznie na podstawie dokumentów z bazy wiedzy i zawsze wskazuje źródło – sprawdź je przed
          podjęciem decyzji. Nie wpisuj imion i nazwisk pracowników.
        </span>
      </p>
    </div>
  );
}
