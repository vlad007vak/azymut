import { z } from "zod";

import { komunikatNiedostepnosci, sekundyDoPonowienia } from "@/features/osp/prompt";
import { normalizujPlan, odpowiedzSchema, SYSTEM_PROMPT, zbudujPrompt } from "@/features/rozmowa/prompt";
import { AiUnavailableError, generateJson } from "@/lib/ai/client";
import { MODEL } from "@/lib/ocena/model";
import type { RozmowaPlan, RozmowaZapytanie } from "@/types/api";
import type { KompetencjaId } from "@/types/ocena";

// Darmowe modele potrafią odpowiadać wolno – dajemy funkcji więcej czasu na Vercelu.
export const maxDuration = 60;

const ID_KOMPETENCJI = MODEL.kompetencje.map((k) => k.id) as [KompetencjaId, ...KompetencjaId[]];

/** Bez imion i nazwisk – tylko stanowisko, kryteria, poziomy i przykłady (minimalizacja danych). */
const bodySchema = z.object({
  rodzaj: z.enum(["pierwsza", "okresowa"]),
  stanowisko: z.string().trim().min(1).max(200),
  kryteria: z
    .array(
      z.object({
        kompetencjaId: z.enum(ID_KOMPETENCJI),
        poziom: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable(),
        przyklady: z.array(z.string().trim().min(1).max(1000)).max(12),
      }),
    )
    .min(1)
    .max(10),
});

// Prosta pamięć podręczna (na instancję serwera) – oszczędzamy limity darmowych modeli.
const CACHE_MAX = 50;
const cache = new Map<string, RozmowaPlan>();

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Nieprawidłowe zapytanie." }, { status: 400 });
  }
  const zapytanie: RozmowaZapytanie = parsed.data;
  const klucz = JSON.stringify(zapytanie);

  const zCache = cache.get(klucz);
  if (zCache) {
    return Response.json(zCache, { headers: { "Cache-Control": "no-store", "X-AI-Cache": "hit" } });
  }

  try {
    const { data, provider, model } = await generateJson(odpowiedzSchema, {
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: zbudujPrompt(zapytanie) }],
      temperature: 0.2,
      maxTokens: 1800,
    });
    const plan = normalizujPlan(
      data,
      zapytanie.kryteria.map((k) => k.kompetencjaId),
    );
    if (plan.pytania.length === 0 && plan.tematy.length === 0) {
      return Response.json(
        { error: "Model zwrócił pusty plan. Spróbuj ponownie za chwilę." },
        { status: 502 },
      );
    }
    cache.set(klucz, plan);
    if (cache.size > CACHE_MAX) {
      const najstarszy = cache.keys().next().value;
      if (najstarszy !== undefined) cache.delete(najstarszy);
    }
    return Response.json(plan, {
      headers: { "Cache-Control": "no-store", "X-AI-Provider": provider, "X-AI-Model": model },
    });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      // Limit darmowego planu: podpowiadamy, za ile sekund ponowić (jak w /api/osp).
      const sekundy = sekundyDoPonowienia(err.attempts);
      const ponow: Record<string, string> = sekundy ? { "X-AI-Retry-After": String(sekundy) } : {};
      return Response.json({ error: komunikatNiedostepnosci(err.message, sekundy) }, { status: 503, headers: ponow });
    }
    console.error("[rozmowa]", err);
    return Response.json(
      { error: "Nie udało się przygotować planu rozmowy. Spróbuj ponownie." },
      { status: 500 },
    );
  }
}
