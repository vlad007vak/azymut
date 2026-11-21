import { NextResponse, type NextRequest } from "next/server";

import { ROLA_COOKIE, adresLogowania, czyMaDostep, czyRolaId } from "@/features/role/rola";

/**
 * Role demonstracyjne (Andrey, zadanie #17) – sprawdzenie „optymistyczne”: czytamy tylko cookie z rolą.
 * Wejście do sekcji chronionej (Panel HR) bez właściwej roli → `/logowanie?powrot=<ścieżka>`.
 * Strony oceny nie są objęte matcherem, więc działają bez wyboru roli.
 * To nie jest autoryzacja produkcyjna – co trzeba zrobić przed wdrożeniem: `docs/ROLE.md`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const wartosc = request.cookies.get(ROLA_COOKIE)?.value;
  const rola = czyRolaId(wartosc) ? wartosc : null;

  if (czyMaDostep(rola, pathname)) return NextResponse.next();

  return NextResponse.redirect(new URL(adresLogowania(pathname), request.nextUrl));
}

export const config = {
  // Ta sama lista co CHRONIONE_SCIEZKI w src/features/role/rola.ts (matcher musi być stałą).
  matcher: ["/hr", "/hr/:path*"],
};
