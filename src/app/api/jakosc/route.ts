import { sprawdzJakosc } from "@/features/jakosc/kontrola";
import { zapytanieJakosciSchema } from "@/features/jakosc/schemat";

// Darmowe modele potrafią odpowiadać wolno – dajemy funkcji więcej czasu na Vercelu.
export const maxDuration = 60;

/**
 * POST /api/jakosc – kontrola jakości uzasadnienia oceny (zadanie #18).
 * Wejście bez imion i nazwisk; AI tylko wskazuje fragmenty do doprecyzowania – nie zmienia poziomów.
 */
export async function POST(request: Request) {
  const parsed = zapytanieJakosciSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message;
    return Response.json(
      { error: msg && !msg.startsWith("Invalid") ? msg : "Nieprawidłowe dane oceny do sprawdzenia." },
      { status: 400 },
    );
  }

  try {
    const wynik = await sprawdzJakosc(parsed.data);
    return Response.json(wynik, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[jakosc]", err);
    return Response.json({ error: "Nie udało się sprawdzić uzasadnienia. Spróbuj ponownie." }, { status: 500 });
  }
}
