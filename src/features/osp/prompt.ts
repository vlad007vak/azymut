/**
 * Prompt i obróbka odpowiedzi AI dla POST /api/osp (używane tylko po stronie serwera).
 */
import { z } from "zod";

import { kompetencja, kompetencjaWskaznika, MODEL, wskaznik } from "@/lib/ocena/model";
import { KRYTERIA_OBOWIAZKOWE, MAX_KRYTERIOW_DODATKOWYCH } from "@/lib/ocena/zasady";
import type { OspSugestia } from "@/types/api";
import type { Arkusz, KompetencjaId } from "@/types/ocena";

type ArkuszBC = Exclude<Arkusz, "A">;

export const SYSTEM_PROMPT = `Jesteś specjalistą HR w polskiej służbie cywilnej. Pomagasz bezpośredniemu przełożonemu przygotować ocenę okresową na podstawie opisu stanowiska pracy (OSP).
Zasady:
- Opierasz się WYŁĄCZNIE na zadaniach, celu stanowiska i wymaganiach zapisanych w OSP. Nie wymyślasz zadań.
- Każde uzasadnienie to jedno zdanie, które wskazuje konkretne zadanie lub wymaganie z OSP (np. „Zadanie 3: koordynuje obsługę spraw budżetowych…”).
- Używasz tylko identyfikatorów kompetencji i wskaźników z podanej listy.
- Piszesz poprawną polszczyzną, zwięźle.`;

function listaKompetencji(): string {
  return MODEL.kompetencje
    .map((k) => `[${k.id}] ${k.nazwa}\n${k.wskazniki.map((w) => `  - ${w.id}: ${w.opis}`).join("\n")}`)
    .join("\n");
}

function nazwy(ids: KompetencjaId[]): string {
  return ids.map((id) => `${id} (${kompetencja(id).nazwa})`).join(", ");
}

export function zbudujPrompt(tekstOsp: string, arkusz: ArkuszBC | null): string {
  const arkuszInfo = arkusz
    ? `Arkusz: ${arkusz} (odczytany z OSP). Kryteria obowiązkowe dla tego arkusza: ${nazwy(KRYTERIA_OBOWIAZKOWE[arkusz])}.`
    : `Arkusz: nieznany – ustal go. "B", jeśli praca na stanowisku polega na bezpośrednim kierowaniu pracownikami; w przeciwnym razie "C".
Kryteria obowiązkowe arkusza B: ${nazwy(KRYTERIA_OBOWIAZKOWE.B)}.
Kryteria obowiązkowe arkusza C: ${nazwy(KRYTERIA_OBOWIAZKOWE.C)}.`;

  return `${arkuszInfo}

Kompetencje (kryteria oceny) i ich wskaźniki behawioralne – id: opis:
${listaKompetencji()}

Opis stanowiska pracy (OSP):
"""
${tekstOsp}
"""

Zwróć obiekt JSON:
{
  "arkusz": "B" albo "C",
  "kryteriaDodatkowe": [0–${MAX_KRYTERIOW_DODATKOWYCH} obiektów {"kompetencjaId": "<id>", "uzasadnienie": "<zadanie z OSP>"}] – tylko kompetencje SPOZA obowiązkowych dla arkusza, najistotniejsze ze względu na charakter obowiązków; pusta lista, jeśli żadna nie jest uzasadniona,
  "wskazniki": [{"wskaznikId": "<id>", "uzasadnienie": "<zadanie z OSP>"}] – dla KAŻDEGO kryterium obowiązkowego i każdego wybranego kryterium dodatkowego 1–3 wskaźniki najistotniejsze dla zadań na stanowisku
}`;
}

// ── Odpowiedź modelu ─────────────────────────────────────────────────────────

const poleTekstu = z.unknown().transform((v) => (typeof v === "string" ? v.trim() : ""));

// Model czasem zwraca samo id zamiast obiektu – przyjmujemy oba kształty.
const kryteriumSchema = z.union([
  z.string().transform((id) => ({ kompetencjaId: id, id: undefined, nazwa: undefined, uzasadnienie: "" })),
  z.object({
    kompetencjaId: poleTekstu.optional(),
    id: poleTekstu.optional(),
    nazwa: poleTekstu.optional(),
    uzasadnienie: poleTekstu.optional(),
  }),
]);

const wskaznikSchema = z.union([
  z.string().transform((id) => ({ wskaznikId: id, id: undefined, uzasadnienie: "" })),
  z.object({
    wskaznikId: poleTekstu.optional(),
    id: poleTekstu.optional(),
    uzasadnienie: poleTekstu.optional(),
  }),
]);

const odpowiedzSchema = z.object({
  arkusz: z.unknown().optional(),
  kryteriaDodatkowe: z.array(kryteriumSchema).catch([]),
  wskazniki: z.array(wskaznikSchema).catch([]),
});

export { odpowiedzSchema };
export type OdpowiedzModelu = z.infer<typeof odpowiedzSchema>;

function normalizujNazwe(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z]/g, "");
}

const ID_KOMPETENCJI = new Set<string>(MODEL.kompetencje.map((k) => k.id));

/** Id kompetencji z odpowiedzi modelu (także gdy podał nazwę zamiast id). */
function dopasujKompetencje(...kandydaci: (string | undefined)[]): KompetencjaId | null {
  for (const k of kandydaci) {
    if (!k) continue;
    if (ID_KOMPETENCJI.has(k)) return k as KompetencjaId;
    const n = normalizujNazwe(k);
    const znaleziona = MODEL.kompetencje.find((x) => normalizujNazwe(x.nazwa) === n || normalizujNazwe(x.id) === n);
    if (znaleziona) return znaleziona.id;
  }
  return null;
}

function arkuszZOdpowiedzi(v: unknown): ArkuszBC | null {
  if (typeof v !== "string") return null;
  const t = v.trim().toUpperCase();
  if (t.startsWith("B")) return "B";
  if (t.startsWith("C")) return "C";
  return null;
}

const MAX_WSKAZNIKOW_NA_KRYTERIUM = 4;
const MAX_DLUGOSC_UZASADNIENIA = 400;

/**
 * Walidacja po stronie serwera: arkusz z OSP ma pierwszeństwo przed AI; kryteria dodatkowe bez
 * obowiązkowych, bez duplikatów, max 3, z uzasadnieniem; wskaźniki tylko istniejące w modelu
 * i należące do kryteriów oceny (obowiązkowe + dodatkowe).
 */
export function normalizujSugestie(o: OdpowiedzModelu, arkuszZOsp: ArkuszBC | null): OspSugestia {
  const sugerowanyArkusz = arkuszZOsp ?? arkuszZOdpowiedzi(o.arkusz) ?? "C";
  const obowiazkowe = new Set<KompetencjaId>(KRYTERIA_OBOWIAZKOWE[sugerowanyArkusz]);

  const kryteriaDodatkowe: OspSugestia["kryteriaDodatkowe"] = [];
  for (const k of o.kryteriaDodatkowe) {
    const id = dopasujKompetencje(k.kompetencjaId, k.id, k.nazwa);
    const uzasadnienie = (k.uzasadnienie ?? "").slice(0, MAX_DLUGOSC_UZASADNIENIA);
    if (!id || obowiazkowe.has(id) || !uzasadnienie) continue;
    if (kryteriaDodatkowe.some((x) => x.kompetencjaId === id)) continue;
    kryteriaDodatkowe.push({ kompetencjaId: id, uzasadnienie });
    if (kryteriaDodatkowe.length >= MAX_KRYTERIOW_DODATKOWYCH) break;
  }

  const oceniane = new Set<KompetencjaId>([...obowiazkowe, ...kryteriaDodatkowe.map((k) => k.kompetencjaId)]);
  const naKryterium = new Map<KompetencjaId, number>();
  const wskazniki: OspSugestia["wskazniki"] = [];
  for (const w of o.wskazniki) {
    const id = w.wskaznikId || w.id || "";
    const komp = wskaznik(id) ? kompetencjaWskaznika(id) : undefined;
    if (!komp || !oceniane.has(komp.id)) continue;
    if (wskazniki.some((x) => x.wskaznikId === id)) continue;
    const ile = naKryterium.get(komp.id) ?? 0;
    if (ile >= MAX_WSKAZNIKOW_NA_KRYTERIUM) continue;
    naKryterium.set(komp.id, ile + 1);
    wskazniki.push({ wskaznikId: id, uzasadnienie: (w.uzasadnienie ?? "").slice(0, MAX_DLUGOSC_UZASADNIENIA) });
  }

  return { sugerowanyArkusz, kryteriaDodatkowe, wskazniki };
}
