/**
 * Logika kreatora oceny (bez UI): tworzenie oceny, kryteria startowe, kroki, sugestie.
 * Zasady punktacji są TYLKO w src/lib/ocena/zasady.ts – tu je wywołujemy.
 */
import { APP_CONFIG } from "@/config/app";
import { kompetencja, poziom } from "@/lib/ocena/model";
import { nowyId } from "@/lib/ocena/store";
import {
  doSkaliPierwszejOceny,
  ELEMENTY_PIERWSZEJ_OCENY,
  KRYTERIA_OBOWIAZKOWE,
  sugerowanyPoziom,
  type Sugestia,
} from "@/lib/ocena/zasady";
import type {
  Arkusz,
  EtapOceny,
  KompetencjaId,
  Ocena,
  OcenaKryterium,
  Osoba,
  PoziomId,
  Pracownik,
  RodzajOceny,
} from "@/types/ocena";

export const NAZWA_URZEDU_DEMO = APP_CONFIG.urzad;

export function dzisIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const fmt = new Intl.DateTimeFormat("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric" });

/** ISO yyyy-mm-dd → „15.12.2026”. */
export function data(iso?: string): string {
  if (!iso) return "—";
  const [r, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!r || !m || !d) return iso;
  return fmt.format(new Date(r, m - 1, d));
}

export function liczba(n: number): string {
  return n.toLocaleString("pl-PL", { maximumFractionDigits: 2 });
}

export function nowyKryterium(id: KompetencjaId, dodatkowe: boolean): OcenaKryterium {
  return {
    kompetencjaId: id,
    dodatkowe,
    wskazniki: kompetencja(id).wskazniki.map((w) => w.id),
    obserwacje: {},
  };
}

/** Kryteria obowiązkowe dla arkusza + zachowane dodatkowe (bez dublowania obowiązkowych). */
export function kryteriaDlaArkusza(arkusz: Arkusz, obecne: OcenaKryterium[]): OcenaKryterium[] {
  const obowiazkowe = KRYTERIA_OBOWIAZKOWE[arkusz];
  const zachowaj = (id: KompetencjaId, dodatkowe: boolean) => {
    const bylo = obecne.find((k) => k.kompetencjaId === id);
    return bylo ? { ...bylo, dodatkowe } : nowyKryterium(id, dodatkowe);
  };
  const dodatkowe = obecne.filter((k) => k.dodatkowe && !obowiazkowe.includes(k.kompetencjaId));
  return [...obowiazkowe.map((id) => zachowaj(id, false)), ...dodatkowe];
}

export function kryteriaStartowe(rodzaj: RodzajOceny, arkusz?: Arkusz): OcenaKryterium[] {
  if (rodzaj === "pierwsza") return ELEMENTY_PIERWSZEJ_OCENY.map((id) => nowyKryterium(id, false));
  return kryteriaDlaArkusza(arkusz ?? "C", []);
}

export function utworzOcene(params: {
  rodzaj: RodzajOceny;
  pracownik: Pracownik;
  arkusz?: Arkusz;
  oceniajacy: Osoba;
  okres: { od: string; do: string };
  terminOceny: string;
}): Ocena {
  const teraz = new Date().toISOString();
  const { rodzaj, pracownik, arkusz, oceniajacy, okres, terminOceny } = params;
  return {
    id: nowyId(),
    rodzaj,
    ...(rodzaj === "okresowa" ? { arkusz: arkusz ?? "C" } : {}),
    pracownikId: pracownik.id,
    oceniajacy,
    etap: "kryteria",
    okres,
    terminOceny,
    kryteria: kryteriaStartowe(rodzaj, arkusz),
    ...(rodzaj === "pierwsza"
      ? { pierwsza: { egzaminSluzbyPrzygotowawczej: "tak" as const, sprawozdanieWTerminie: null } }
      : {}),
    daty: {},
    utworzono: teraz,
    zmieniono: teraz,
  };
}

/** Uzupełnia brakujące pola (np. proces utworzony w Panelu HR bez kryteriów). */
export function uzupelnijOcene(o: Ocena): Ocena | null {
  let zmiana = false;
  let wynik = o;
  if (o.kryteria.length === 0) {
    wynik = { ...wynik, kryteria: kryteriaStartowe(o.rodzaj, o.arkusz) };
    zmiana = true;
  }
  if (o.rodzaj === "pierwsza" && !o.pierwsza) {
    wynik = { ...wynik, pierwsza: { egzaminSluzbyPrzygotowawczej: "tak", sprawozdanieWTerminie: null } };
    zmiana = true;
  }
  if (o.etap === "zaplanowana") {
    wynik = { ...wynik, etap: "kryteria" };
    zmiana = true;
  }
  return zmiana ? wynik : null;
}

// ── Kroki kreatora ───────────────────────────────────────────────────────────

export type KrokId = "przygotowanie" | "obserwacje" | "rozmowa" | "decyzja" | "dokument";

export const KROKI: { id: KrokId; nazwa: (r: RodzajOceny) => string }[] = [
  {
    id: "przygotowanie",
    nazwa: (r) => (r === "okresowa" ? "Stanowisko i kryteria" : "Rozmowa wstępna i elementy oceny"),
  },
  { id: "obserwacje", nazwa: () => "Ocena wskaźników" },
  { id: "rozmowa", nazwa: () => "Rozmowa oceniająca" },
  { id: "decyzja", nazwa: () => "Decyzja i wynik" },
  { id: "dokument", nazwa: () => "Dokument" },
];

const KOLEJNOSC_ETAPOW: EtapOceny[] = ["zaplanowana", "kryteria", "obserwacje", "rozmowa", "sporzadzona", "zakonczona"];

export function etapNr(e: EtapOceny): number {
  return KOLEJNOSC_ETAPOW.indexOf(e);
}

/** Etap, który dany krok „odblokowuje”. */
const ETAP_KROKU: Record<KrokId, EtapOceny> = {
  przygotowanie: "kryteria",
  obserwacje: "obserwacje",
  rozmowa: "rozmowa",
  decyzja: "rozmowa",
  dokument: "sporzadzona",
};

export function krokDostepny(k: KrokId, etap: EtapOceny): boolean {
  return etapNr(etap) >= etapNr(ETAP_KROKU[k]);
}

export function krokStartowy(etap: EtapOceny): KrokId {
  if (etap === "obserwacje") return "obserwacje";
  if (etap === "rozmowa") return "rozmowa";
  if (etap === "sporzadzona" || etap === "zakonczona") return "dokument";
  return "przygotowanie";
}

/** Przesuwa etap do przodu (nigdy nie cofa). */
export function doEtapu(o: Ocena, e: EtapOceny): Ocena {
  return etapNr(e) > etapNr(o.etap) ? { ...o, etap: e } : o;
}

// ── Sugestie ─────────────────────────────────────────────────────────────────

export interface SugestiaKryterium extends Sugestia {
  /** Poziom do pokazania (w pierwszej ocenie przeliczony na skalę 3/5/7). */
  pokaz: PoziomId | null;
  nieocenione: number;
}

export function sugestiaKryterium(k: OcenaKryterium, rodzaj: RodzajOceny): SugestiaKryterium {
  const obs = k.wskazniki.map((w) => k.obserwacje[w]).filter((o) => o !== undefined);
  const s = sugerowanyPoziom(obs);
  const pokaz = s.poziom === null ? null : rodzaj === "pierwsza" ? doSkaliPierwszejOceny(s.poziom) : s.poziom;
  return { ...s, pokaz, nieocenione: k.wskazniki.length - obs.length };
}

export function etykietaPoziomu(p: PoziomId): string {
  const x = poziom(p);
  return `${x.nazwa} (${x.punkty} pkt)`;
}

/** Dozwolone decyzje: pierwsza ocena 3/5/7 pkt, okresowa 1–9 pkt. */
export function dozwolonePoziomy(rodzaj: RodzajOceny): PoziomId[] {
  return rodzaj === "pierwsza" ? [2, 3, 4] : [1, 2, 3, 4, 5];
}
