"use client";

import { SendIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pracownik, zapiszOcene } from "@/lib/ocena/store";
import type { Ocena } from "@/types/ocena";

import { szablonPrzypomnienia } from "./przypomnienia";

/** Zapisuje przypomnienie w historii procesu (wysyłka symulowana). */
export function wyslijPrzypomnienie(ocena: Ocena, tresc: string): void {
  zapiszOcene({
    ...ocena,
    przypomnienia: [...(ocena.przypomnienia ?? []), { data: new Date().toISOString(), tresc }],
  });
  toast.success("Przypomnienie wysłane (symulacja – docelowo e-mail / EZD)");
}

function FormularzPrzypomnienia({
  ocena,
  dzis,
  onZamknij,
}: {
  ocena: Ocena;
  dzis: string;
  onZamknij: () => void;
}) {
  const prac = pracownik(ocena.pracownikId);
  const [tresc, setTresc] = useState(() => szablonPrzypomnienia(ocena, prac, dzis));
  const [blad, setBlad] = useState<string | null>(null);
  const o = ocena.oceniajacy;

  function wyslij(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tresc.trim()) {
      setBlad("Treść przypomnienia nie może być pusta.");
      return;
    }
    wyslijPrzypomnienie(ocena, tresc.trim());
    onZamknij();
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Przypomnienie o zaległej czynności</DialogTitle>
        <DialogDescription>
          Adresat – osoba oceniająca: {o.imie} {o.nazwisko} ({o.stanowisko}). Treść przygotowano z
          szablonu dla bieżącego etapu; możesz ją zmienić przed wysłaniem.
        </DialogDescription>
      </DialogHeader>
      <form id="hr-przypomnienie" onSubmit={wyslij} className="grid gap-1.5">
        <Label htmlFor="hr-przypomnienie-tresc">Treść przypomnienia</Label>
        <Textarea
          id="hr-przypomnienie-tresc"
          value={tresc}
          onChange={(e) => {
            setTresc(e.target.value);
            setBlad(null);
          }}
          rows={9}
          className="max-h-80"
          aria-invalid={blad ? true : undefined}
          aria-describedby={blad ? "hr-przypomnienie-blad" : undefined}
        />
        {blad && (
          <p id="hr-przypomnienie-blad" className="text-xs text-destructive">
            {blad}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Prototyp: wysyłka jest symulowana – przypomnienie trafia do historii procesu. Docelowo e-mail lub EZD.
        </p>
      </form>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onZamknij}>
          Anuluj
        </Button>
        <Button type="submit" form="hr-przypomnienie">
          <SendIcon data-icon="inline-start" aria-hidden />
          Wyślij przypomnienie
        </Button>
      </DialogFooter>
    </>
  );
}

/** Dialog sterowany z panelu: `ocena = null` → zamknięty. */
export function PrzypomnienieDialog({
  ocena,
  dzis,
  onZamknij,
}: {
  ocena: Ocena | null;
  dzis: string;
  onZamknij: () => void;
}) {
  return (
    <Dialog open={ocena !== null} onOpenChange={(open) => !open && onZamknij()}>
      <DialogContent className="sm:max-w-lg">
        {ocena && <FormularzPrzypomnienia key={ocena.id} ocena={ocena} dzis={dzis} onZamknij={onZamknij} />}
      </DialogContent>
    </Dialog>
  );
}
