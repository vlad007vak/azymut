import { connection } from "next/server";

import { checkProviders } from "@/lib/ai/client";
import { describeProvider, getProviders } from "@/lib/ai/providers";

export const maxDuration = 60;

/**
 * Test dostawców zużywa limity darmowych planów, a endpoint jest publiczny – dostawców
 * pytamy najwyżej raz na minutę (na instancję serwera); w międzyczasie zwracamy ostatni wynik
 * z nagłówkiem `X-AI-Cache: hit`. Kształt odpowiedzi bez zmian (OpenAPI, docs/API.md).
 */
const PRZERWA_MS = 60_000;
type WynikTestu = Awaited<ReturnType<typeof checkProviders>>;
let ostatni: { at: number; results: WynikTestu } | null = null;
let trwa: Promise<WynikTestu> | null = null;

/** Lista skonfigurowanych dostawców (bez kluczy). */
export async function GET() {
  // Konfiguracja czytana przy każdym żądaniu, a nie zamrożona w czasie builda.
  await connection();
  return Response.json({ providers: getProviders().map(describeProvider) });
}

/** Test połączenia z każdym dostawcą (najwyżej raz na minutę). */
export async function POST() {
  if (ostatni && Date.now() - ostatni.at < PRZERWA_MS) {
    return Response.json({ results: ostatni.results }, { headers: { "X-AI-Cache": "hit" } });
  }
  // Równoległe żądania czekają na ten sam test zamiast odpalać kolejne.
  trwa ??= checkProviders().finally(() => {
    trwa = null;
  });
  const results = await trwa;
  ostatni = { at: Date.now(), results };
  return Response.json({ results });
}
