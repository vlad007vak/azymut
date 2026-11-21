"use client";

import { PlusIcon } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRZELOZONY_DEMO } from "@/data/demo";
import { nowyId, PRACOWNICY, pracownik, zapiszOcene } from "@/lib/ocena/store";
import { arkuszDlaStanowiska } from "@/lib/ocena/zasady";
import type { Arkusz, Ocena, RodzajOceny } from "@/types/ocena";

import { formatujDate } from "./terminy";

type ArkuszBC = Exclude<Arkusz, "A">;

const PRACOWNICY_ITEMS = Object.fromEntries(
  PRACOWNICY.map((p) => [p.id, `${p.imie} ${p.nazwisko} – ${p.stanowisko}`]),
);
const ARKUSZE_ITEMS: Record<ArkuszBC, string> = {
  B: "Arkusz B – bezpośrednio kieruje pracownikami",
  C: "Arkusz C – pozostali pracownicy",
};

interface Bledy {
  pracownik?: string;
  okres?: string;
  termin?: string;
}

function waliduj(pracownikId: string | null, od: string, doDnia: string, termin: string): Bledy {
  const b: Bledy = {};
  if (!pracownikId) b.pracownik = "Wybierz pracownika.";
  if (!od || !doDnia) b.okres = "Podaj początek i koniec okresu oceny.";
  else if (od > doDnia) b.okres = "Koniec okresu nie może być wcześniejszy niż początek.";
  if (!termin) b.termin = "Podaj termin.";
  else if (od && termin < od) b.termin = "Termin nie może być wcześniejszy niż początek okresu oceny.";
  return b;
}

/** Formularz „Nowy proces oceny” – zapisuje ocenę na etapie „zaplanowana”. */
export function NowyProcesDialog({ oceny }: { oceny: Ocena[] }) {
  const [open, setOpen] = useState(false);
  const [pracownikId, setPracownikId] = useState<string | null>(null);
  const [rodzaj, setRodzaj] = useState<RodzajOceny>("okresowa");
  const [arkusz, setArkusz] = useState<ArkuszBC>("C");
  const [od, setOd] = useState("");
  const [doDnia, setDoDnia] = useState("");
  const [termin, setTermin] = useState("");
  const [bledy, setBledy] = useState<Bledy>({});

  const wybrany = pracownikId ? pracownik(pracownikId) : undefined;
  const sugerowanyArkusz = wybrany ? arkuszDlaStanowiska(wybrany.kierujeZespolem) : null;
  const trwajacy = pracownikId
    ? oceny.find((o) => o.pracownikId === pracownikId && o.rodzaj === rodzaj && o.etap !== "zakonczona")
    : undefined;

  function wyczysc() {
    setPracownikId(null);
    setRodzaj("okresowa");
    setArkusz("C");
    setOd("");
    setDoDnia("");
    setTermin("");
    setBledy({});
  }

  function wybierzPracownika(id: string | null) {
    setPracownikId(id);
    const p = id ? pracownik(id) : undefined;
    if (p) setArkusz(arkuszDlaStanowiska(p.kierujeZespolem));
    setBledy((b) => ({ ...b, pracownik: undefined }));
  }

  function zapisz(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const b = waliduj(pracownikId, od, doDnia, termin);
    setBledy(b);
    if (Object.values(b).some(Boolean) || !pracownikId) {
      toast.error("Popraw zaznaczone pola formularza.");
      return;
    }
    const teraz = new Date().toISOString();
    const ocena: Ocena = {
      id: nowyId(),
      rodzaj,
      ...(rodzaj === "okresowa" ? { arkusz } : {}),
      pracownikId,
      oceniajacy: PRZELOZONY_DEMO,
      etap: "zaplanowana",
      okres: { od, do: doDnia },
      terminOceny: termin,
      kryteria: [],
      daty: {},
      przypomnienia: [],
      utworzono: teraz,
      zmieniono: teraz,
    };
    zapiszOcene(ocena);
    const p = pracownik(pracownikId);
    toast.success(`Utworzono proces ${rodzaj === "okresowa" ? "oceny okresowej" : "pierwszej oceny"}`, {
      description: p ? `${p.imie} ${p.nazwisko} – etap „Zaplanowana”.` : undefined,
    });
    setOpen(false);
    wyczysc();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setBledy({});
      }}
    >
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" aria-hidden />
        Nowy proces
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nowy proces oceny</DialogTitle>
          <DialogDescription>
            Proces trafi do tabeli na etapie „Zaplanowana”. Kolejne kroki przeprowadza przełożony.
          </DialogDescription>
        </DialogHeader>

        <form id="hr-nowy-proces" onSubmit={zapisz} noValidate className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="hr-pracownik">Pracownik</Label>
            <Select items={PRACOWNICY_ITEMS} value={pracownikId} onValueChange={wybierzPracownika}>
              <SelectTrigger
                id="hr-pracownik"
                className="w-full"
                aria-invalid={bledy.pracownik ? true : undefined}
                aria-describedby={bledy.pracownik ? "hr-pracownik-blad" : undefined}
              >
                <SelectValue placeholder="Wybierz pracownika" />
              </SelectTrigger>
              <SelectContent>
                {PRACOWNICY.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {PRACOWNICY_ITEMS[p.id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {wybrany && <p className="text-xs text-muted-foreground">{wybrany.komorka}</p>}
            {bledy.pracownik && (
              <p id="hr-pracownik-blad" className="text-xs text-destructive">
                {bledy.pracownik}
              </p>
            )}
          </div>

          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Rodzaj oceny</legend>
            <RadioGroup
              value={rodzaj}
              onValueChange={(v) => setRodzaj(v as RodzajOceny)}
              className="flex flex-wrap gap-6"
            >
              <Label className="flex items-center gap-2 font-normal">
                <RadioGroupItem value="okresowa" /> Ocena okresowa
              </Label>
              <Label className="flex items-center gap-2 font-normal">
                <RadioGroupItem value="pierwsza" /> Pierwsza ocena
              </Label>
            </RadioGroup>
          </fieldset>

          {rodzaj === "okresowa" && (
            <div className="grid gap-1.5">
              <Label htmlFor="hr-arkusz">Arkusz</Label>
              <Select items={ARKUSZE_ITEMS} value={arkusz} onValueChange={(v) => v && setArkusz(v as ArkuszBC)}>
                <SelectTrigger id="hr-arkusz" className="w-full" aria-describedby="hr-arkusz-podpowiedz">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ARKUSZE_ITEMS) as ArkuszBC[]).map((a) => (
                    <SelectItem key={a} value={a}>
                      {ARKUSZE_ITEMS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p id="hr-arkusz-podpowiedz" className="text-xs text-muted-foreground">
                {sugerowanyArkusz
                  ? `Podpowiedź na podstawie stanowiska: arkusz ${sugerowanyArkusz} (${
                      sugerowanyArkusz === "B" ? "pracownik kieruje zespołem" : "pracownik nie kieruje zespołem"
                    }) – § 3 rozporządzenia o ocenach okresowych.`
                  : "Po wybraniu pracownika podpowiemy arkusz na podstawie stanowiska."}
                {sugerowanyArkusz && arkusz !== sugerowanyArkusz && " Wybrano inny arkusz niż podpowiedź."}
              </p>
            </div>
          )}

          <div className="grid gap-1.5">
            <span id="hr-okres-etykieta" className="text-sm font-medium">
              Okres podlegania ocenie
            </span>
            <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="hr-okres-etykieta">
              <div className="grid gap-1">
                <Label htmlFor="hr-od" className="text-xs font-normal text-muted-foreground">
                  Od
                </Label>
                <Input
                  id="hr-od"
                  type="date"
                  value={od}
                  onChange={(e) => setOd(e.target.value)}
                  aria-invalid={bledy.okres ? true : undefined}
                  aria-describedby={bledy.okres ? "hr-okres-blad" : undefined}
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor="hr-do" className="text-xs font-normal text-muted-foreground">
                  Do
                </Label>
                <Input
                  id="hr-do"
                  type="date"
                  value={doDnia}
                  min={od || undefined}
                  onChange={(e) => setDoDnia(e.target.value)}
                  aria-invalid={bledy.okres ? true : undefined}
                  aria-describedby={bledy.okres ? "hr-okres-blad" : undefined}
                />
              </div>
            </div>
            {bledy.okres && (
              <p id="hr-okres-blad" className="text-xs text-destructive">
                {bledy.okres}
              </p>
            )}
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="hr-termin">
              {rodzaj === "okresowa" ? "Termin sporządzenia oceny" : "Koniec okresu na dokonanie oceny"}
            </Label>
            <Input
              id="hr-termin"
              type="date"
              value={termin}
              min={od || undefined}
              onChange={(e) => setTermin(e.target.value)}
              aria-invalid={bledy.termin ? true : undefined}
              aria-describedby={bledy.termin ? "hr-termin-blad" : undefined}
            />
            {bledy.termin && (
              <p id="hr-termin-blad" className="text-xs text-destructive">
                {bledy.termin}
              </p>
            )}
          </div>

          {trwajacy && (
            <p role="status" className="rounded-lg bg-amber-50 p-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              Ten pracownik ma już trwający proces tego rodzaju (termin {formatujDate(trwajacy.terminOceny)}). Upewnij się,
              że nie tworzysz duplikatu.
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <Button type="submit" form="hr-nowy-proces">
            Utwórz proces
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
