/**
 * Szkic przygotowania do rozmowy (plan z AI + zaznaczenia + notatki) – trzymany w przeglądarce,
 * żeby po odświeżeniu nie trzeba było ponownie pytać AI (limity darmowych modeli).
 * Do oceny trafia dopiero to, co przełożony zapisze przyciskiem „Zapisz w ocenie”.
 */
import { kompetencja } from "@/lib/ocena/model";
import { nowyId } from "@/lib/ocena/store";
import type { RozmowaPlan } from "@/types/api";
import type { KompetencjaId } from "@/types/ocena";

export interface Punkt {
  id: string;
  tekst: string;
  wybrany: boolean;
}

export interface SzkicPlanu {
  /** ISO – kiedy AI przygotowało plan. */
  wygenerowano: string;
  pytania: Punkt[];
  tematy: Punkt[];
  argumenty: { kompetencjaId: KompetencjaId; punkty: Punkt[] }[];
  rozwoj: Punkt[];
}

export interface SzkicRozmowy {
  plan: SzkicPlanu | null;
  /** Zaznaczone punkty listy kontrolnej (id punktu → true). */
  lista: Record<string, boolean>;
  wlasneNotatki: string;
}

export type SekcjaPlanu = "pytania" | "tematy" | "rozwoj";

const PUSTY: SzkicRozmowy = { plan: null, lista: {}, wlasneNotatki: "" };

const klucz = (ocenaId: string) => `azymut:rozmowa:${ocenaId}:v1`;

export function wczytajSzkic(ocenaId: string): SzkicRozmowy {
  try {
    const raw = window.localStorage.getItem(klucz(ocenaId));
    if (!raw) return PUSTY;
    const s = JSON.parse(raw) as Partial<SzkicRozmowy>;
    return {
      plan: s.plan ?? null,
      lista: s.lista ?? {},
      wlasneNotatki: typeof s.wlasneNotatki === "string" ? s.wlasneNotatki : "",
    };
  } catch {
    return PUSTY;
  }
}

export function zapiszSzkic(ocenaId: string, szkic: SzkicRozmowy): void {
  try {
    window.localStorage.setItem(klucz(ocenaId), JSON.stringify(szkic));
  } catch {
    // tryb prywatny / brak miejsca – szkic zostaje tylko w pamięci
  }
}

export function nowyPunkt(tekst = ""): Punkt {
  return { id: nowyId(), tekst, wybrany: true };
}

export function planDoSzkicu(plan: RozmowaPlan): SzkicPlanu {
  const punkty = (lista: string[]) => lista.map((t) => nowyPunkt(t));
  return {
    wygenerowano: new Date().toISOString(),
    pytania: punkty(plan.pytania),
    tematy: punkty(plan.tematy),
    argumenty: plan.argumenty.map((a) => ({ kompetencjaId: a.kompetencjaId, punkty: punkty(a.argumenty) })),
    rozwoj: punkty(plan.rozwoj),
  };
}

// ── Teksty do zapisu w ocenie / do schowka ───────────────────────────────────

function linie(punkty: Punkt[]): string[] {
  return punkty.filter((p) => p.wybrany && p.tekst.trim()).map((p) => `- ${p.tekst.trim()}`);
}

export function liczWybrane(plan: SzkicPlanu | null): number {
  if (!plan) return 0;
  return [plan.pytania, plan.tematy, plan.rozwoj, ...plan.argumenty.map((a) => a.punkty)]
    .flat()
    .filter((p) => p.wybrany && p.tekst.trim()).length;
}

/** Treść pola `notatkiRozmowy`: wybrane pytania, tematy, argumenty + notatki własne. */
export function notatkiDoOceny(plan: SzkicPlanu | null, wlasne: string): string {
  const czesci: string[] = [];
  if (plan) {
    const pytania = linie(plan.pytania);
    if (pytania.length) czesci.push(["Pytania do pracownika:", ...pytania].join("\n"));
    const tematy = linie(plan.tematy);
    if (tematy.length) czesci.push(["Kwestie do omówienia:", ...tematy].join("\n"));
    const argumenty = plan.argumenty.flatMap((a) => {
      const l = linie(a.punkty);
      return l.length ? [`${kompetencja(a.kompetencjaId).nazwa}:`, ...l] : [];
    });
    if (argumenty.length) czesci.push(["Argumenty uzasadniające ocenę:", ...argumenty].join("\n"));
  }
  if (wlasne.trim()) czesci.push(["Notatki własne:", wlasne.trim()].join("\n"));
  return czesci.join("\n\n");
}

/** Treść pola `wnioskiRozwojowe`: wybrane propozycje rozwoju. */
export function wnioskiDoOceny(plan: SzkicPlanu | null): string {
  return plan ? linie(plan.rozwoj).join("\n") : "";
}
