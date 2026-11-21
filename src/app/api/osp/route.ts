import { z } from "zod";

import { MAX_DLUGOSC_OSP, MIN_DLUGOSC_OSP, odczytajArkusz, tekstDlaAi, wyczyscOsp } from "@/features/osp/analiza";
import { normalizujSugestie, odpowiedzSchema, SYSTEM_PROMPT, zbudujPrompt } from "@/features/osp/prompt";
import { AiUnavailableError, generateJson } from "@/lib/ai/client";
import type { OspSugestia, OspZapytanie } from "@/types/api";

// Darmowe modele potrafią odpowiadać wolno – dajemy funkcji więcej czasu na Vercelu.
export const maxDuration = 60;

const bodySchema = z.object({
  tekst: z.string().trim().min(MIN_DLUGOSC_OSP).max(MAX_DLUGOSC_OSP),
});

/**
 * Nagłówek X-AI-Status: „ok”, „niedostepne” (AI nie odpowiedziało – zwracamy tylko arkusz odczytany z OSP)
 * albo „niepelna” (AI nie wskazało żadnego poprawnego wskaźnika).
 */
type StatusAi = "ok" | "niedostepne" | "niepelna";

// Pamięć podręczna na instancję serwera – przykładowe OSP analizujemy raz (limity darmowych modeli).
const CACHE_MAX = 30;
const cache = new Map<string, OspSugestia>();

function odpowiedz(sugestia: OspSugestia, status: StatusAi, extra: Record<string, string> = {}) {
  return Response.json(sugestia, { headers: { "Cache-Control": "no-store", "X-AI-Status": status, ...extra } });
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: `Wklej opis stanowiska (od ${MIN_DLUGOSC_OSP} do ${MAX_DLUGOSC_OSP.toLocaleString("pl-PL")} znaków).` },
      { status: 400 },
    );
  }
  const zapytanie: OspZapytanie = parsed.data;

  // Dane osobowe (część „Zapoznanie pracownika…”, część III) usuwamy także tu – nie tylko w przeglądarce.
  const { tekst } = wyczyscOsp(zapytanie.tekst);
  const odczyt = odczytajArkusz(tekst);
  const tekstAi = tekstDlaAi(tekst);

  const zCache = cache.get(tekstAi);
  if (zCache) return odpowiedz(zCache, "ok", { "X-AI-Cache": "hit" });

  try {
    const { data, provider, model } = await generateJson(odpowiedzSchema, {
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: zbudujPrompt(tekstAi, odczyt?.arkusz ?? null) }],
      temperature: 0.1,
      maxTokens: 1800,
    });
    const sugestia = normalizujSugestie(data, odczyt?.arkusz ?? null);
    if (sugestia.wskazniki.length === 0) {
      return odpowiedz(sugestia, "niepelna", { "X-AI-Provider": provider });
    }
    cache.set(tekstAi, sugestia);
    if (cache.size > CACHE_MAX) {
      const najstarszy = cache.keys().next().value;
      if (najstarszy !== undefined) cache.delete(najstarszy);
    }
    return odpowiedz(sugestia, "ok", { "X-AI-Provider": provider, "X-AI-Model": model });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      // Arkusz da się ustalić bez AI – zwracamy przynajmniej to.
      if (odczyt) {
        return odpowiedz({ sugerowanyArkusz: odczyt.arkusz, kryteriaDodatkowe: [], wskazniki: [] }, "niedostepne");
      }
      return Response.json({ error: err.message }, { status: 503 });
    }
    console.error("[osp]", err);
    return Response.json({ error: "Nie udało się przeanalizować opisu stanowiska. Spróbuj ponownie." }, { status: 500 });
  }
}
