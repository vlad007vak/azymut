/**
 * Odczyt public/openapi.json na potrzeby strony /dokumentacja-api – strona renderuje się
 * z tej samej specyfikacji, którą pobiera integrator (jedno źródło prawdy).
 */
import specJson from "../../../public/openapi.json";

export interface Schemat {
  type?: string | string[];
  $ref?: string;
  title?: string;
  description?: string;
  enum?: unknown[];
  const?: unknown;
  format?: string;
  anyOf?: Schemat[];
  allOf?: Schemat[];
  items?: Schemat;
  properties?: Record<string, Schemat>;
  required?: string[];
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  examples?: unknown[];
}

export interface Media {
  schema?: Schemat;
  example?: unknown;
  examples?: Record<string, { summary?: string; value: unknown }>;
}

export interface Odpowiedz {
  $ref?: string;
  description?: string;
  headers?: Record<string, { $ref?: string; description?: string }>;
  content?: Record<string, Media>;
}

export interface Operacja {
  tags?: string[];
  operationId: string;
  summary: string;
  description?: string;
  requestBody?: { required?: boolean; content: Record<string, Media> };
  responses: Record<string, Odpowiedz>;
}

type Metoda = "get" | "post" | "put" | "patch" | "delete";

interface Spec {
  openapi: string;
  info: { title: string; version: string; summary?: string };
  paths: Record<string, Partial<Record<Metoda, Operacja>>>;
  components: {
    schemas: Record<string, Schemat>;
    responses: Record<string, Odpowiedz>;
    headers: Record<string, { description?: string }>;
  };
}

export const SPEC = specJson as unknown as Spec;

export interface Endpoint {
  metoda: Metoda;
  sciezka: string;
  operacja: Operacja;
  kotwica: string;
}

export const ENDPOINTY: Endpoint[] = Object.entries(SPEC.paths).flatMap(([sciezka, metody]) =>
  (Object.entries(metody) as [Metoda, Operacja][]).map(([metoda, operacja]) => ({
    metoda,
    sciezka,
    operacja,
    kotwica: operacja.operationId,
  })),
);

/** Ostatni człon referencji, np. "#/components/schemas/Blad" → "Blad". */
export function nazwaRef(ref: string): string {
  return ref.slice(ref.lastIndexOf("/") + 1);
}

function pobierzRef<T>(ref: string): T {
  return ref
    .replace(/^#\//, "")
    .split("/")
    .reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], SPEC) as T;
}

export function rozwinSchemat(s: Schemat): Schemat {
  return s.$ref ? rozwinSchemat(pobierzRef<Schemat>(s.$ref)) : s;
}

export function rozwinOdpowiedz(o: Odpowiedz): Odpowiedz {
  return o.$ref ? pobierzRef<Odpowiedz>(o.$ref) : o;
}

/** Czytelny opis typu, np. „string (date) | null”, „KompetencjaId”, „string[]”. */
export function opisTypu(s: Schemat): string {
  if (s.$ref) return nazwaRef(s.$ref);
  if (s.anyOf) return s.anyOf.map(opisTypu).join(" | ");
  if (s.allOf) {
    const czesci = s.allOf.map(opisTypu);
    if (s.properties) czesci.push(`{ ${Object.keys(s.properties).join(", ")} }`);
    return czesci.join(" + ");
  }
  if (s.const !== undefined) return JSON.stringify(s.const);
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ");
  const typy = Array.isArray(s.type) ? s.type : s.type ? [s.type] : [];
  if (typy.length === 0) return "dowolny";
  return typy
    .map((t) => {
      if (t === "array") return `${opisTypu(s.items ?? {})}[]`;
      if (t === "object") return "obiekt";
      if (t === "string" && s.format) return `string (${s.format})`;
      return t;
    })
    .join(" | ");
}

function zakres(min: number | undefined, max: number | undefined): string | null {
  if (min !== undefined && max !== undefined) return `${min}–${max}`;
  if (min !== undefined) return `min. ${min}`;
  if (max !== undefined) return `max ${max}`;
  return null;
}

/** Ograniczenia z walidacji, np. „długość 3–1000 znaków”. */
export function ograniczenia(s: Schemat): string | null {
  const dlugosc = zakres(s.minLength, s.maxLength);
  if (dlugosc) return `długość ${dlugosc} znaków`;
  const elementy = zakres(s.minItems, s.maxItems);
  if (elementy) return `elementów: ${elementy}`;
  return null;
}

export interface Pole {
  nazwa: string;
  typ: string;
  wymagane: boolean;
  opis: string;
  ograniczenia: string | null;
}

/** Pola obiektu (z rozwinięciem $ref i allOf) – do tabel na stronie. */
export function pola(s0: Schemat): Pole[] {
  const s = rozwinSchemat(s0);
  const wynik: Pole[] = (s.allOf ?? []).flatMap(pola);
  const wymagane = new Set(s.required ?? []);
  for (const [nazwa, p] of Object.entries(s.properties ?? {})) {
    wynik.push({
      nazwa,
      typ: opisTypu(p),
      wymagane: wymagane.has(nazwa),
      opis: p.description ?? rozwinSchemat(p).description ?? "",
      ograniczenia: ograniczenia(p),
    });
  }
  return wynik;
}

/** Przykłady z obiektu media (pojedynczy `example` albo nazwane `examples`). */
export function przyklady(m: Media): { nazwa: string; wartosc: unknown }[] {
  if (m.examples) return Object.values(m.examples).map((e) => ({ nazwa: e.summary ?? "Przykład", wartosc: e.value }));
  if (m.example !== undefined) return [{ nazwa: "Przykład", wartosc: m.example }];
  return [];
}
