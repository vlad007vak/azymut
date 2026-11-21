import { z } from "zod";

import { odpowiedzNaPytanie } from "@/features/asystent/odpowiedz";
import { AiUnavailableError } from "@/lib/ai/client";

// Darmowe modele potrafią odpowiadać wolno – dajemy funkcji więcej czasu na Vercelu.
export const maxDuration = 60;

const bodySchema = z.object({
  pytanie: z.string().trim().min(3, "Pytanie jest za krótkie.").max(1000, "Pytanie jest za długie (max 1000 znaków)."),
  historia: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      }),
    )
    .max(20)
    .optional(),
  rodzaj: z.enum(["pierwsza", "okresowa"]).optional(),
});

/** POST /api/asystent – odpowiedź z bazy wiedzy ze źródłami (AsystentZapytanie → AsystentOdpowiedz). */
export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message;
    return Response.json(
      { error: msg && !msg.startsWith("Invalid") ? msg : "Nieprawidłowe zapytanie." },
      { status: 400 },
    );
  }

  try {
    const odp = await odpowiedzNaPytanie(parsed.data);
    return Response.json(odp, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof AiUnavailableError) {
      return Response.json(
        { error: "Asystent AI jest chwilowo niedostępny (limit darmowych modeli). Spróbuj ponownie za chwilę." },
        { status: 503 },
      );
    }
    console.error("[asystent]", err);
    return Response.json({ error: "Nie udało się przygotować odpowiedzi. Spróbuj ponownie." }, { status: 500 });
  }
}
