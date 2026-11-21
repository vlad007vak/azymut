"use client";

import { InfoIcon, Loader2Icon, RotateCcwIcon, SendIcon } from "lucide-react";
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
}

const MAX_DLUGOSC = 1000;

/** Asystent formalny: odpowiedzi z bazy wiedzy (rozporządzenia, poradniki KPRM, model kompetencji) ze źródłami. */
export function AsystentPanel({ rodzaj, className }: AsystentPanelProps) {
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
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "flex max-h-[34rem] min-h-64 flex-col gap-3 overflow-y-auto rounded-lg border bg-muted/30 p-3",
          className,
        )}
        aria-live="polite"
        aria-busy={laduje}
        aria-label="Rozmowa z asystentem formalnym"
      >
        {wiadomosci.length === 0 && !laduje ? (
          <div className="m-auto flex max-w-xl flex-col items-center gap-3 py-4 text-center">
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
                  className="h-auto py-1.5 text-left whitespace-normal"
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
              <div key={i} className="max-w-[85%] self-end rounded-lg bg-primary px-3 py-2 text-primary-foreground">
                <p className="text-sm whitespace-pre-wrap">{m.content}</p>
              </div>
            ) : (
              <div key={i} className="w-full max-w-[92%] self-start rounded-lg border bg-background px-3 py-2.5">
                <OdpowiedzAsystentaWidok odp={m.odp} />
              </div>
            ),
          )
        )}
        {laduje && (
          <div className="flex items-center gap-2 self-start rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
            <Loader2Icon className="size-4 animate-spin" aria-hidden />
            Szukam w bazie wiedzy i przygotowuję odpowiedź…
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
          className="max-h-40 min-h-11"
          disabled={laduje}
          aria-describedby={`${inputId}-opis`}
        />
        <Button type="submit" size="icon-lg" disabled={laduje || input.trim().length < 3} aria-label="Wyślij pytanie">
          {laduje ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
        </Button>
        {wiadomosci.length > 0 && (
          <Button type="button" variant="outline" size="icon-lg" onClick={wyczysc} aria-label="Wyczyść rozmowę">
            <RotateCcwIcon />
          </Button>
        )}
      </form>

      <p id={`${inputId}-opis`} className="flex gap-1.5 text-xs text-muted-foreground">
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
