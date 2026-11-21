/**
 * Role demonstracyjne – stałe i reguły wspólne dla `src/proxy.ts` (serwer) i przeglądarki.
 * Bez Reacta i bez danych demo, żeby Proxy ładował tylko ten mały moduł.
 * To prototyp: rola leży w zwykłym cookie, które użytkownik może zmienić – patrz `docs/ROLE.md`.
 */

export const ROLA_COOKIE = "azymut_rola";

/** Jak długo przeglądarka pamięta wybór roli (30 dni). */
export const ROLA_COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export const ID_ROL = ["przelozony", "hr"] as const;

export type RolaId = (typeof ID_ROL)[number];

export function czyRolaId(wartosc: unknown): wartosc is RolaId {
  return typeof wartosc === "string" && (ID_ROL as readonly string[]).includes(wartosc);
}

export type ChronionaSciezka = {
  /** Początek ścieżki, np. `/hr` (obejmuje też `/hr/...`). */
  prefiks: string;
  /** Rola, która ma dostęp. */
  rola: RolaId;
  /** Nazwa sekcji w komunikatach. */
  nazwa: string;
};

/** Sekcje dostępne tylko dla wybranej roli. Proxy przekierowuje stąd na `/logowanie`. */
export const CHRONIONE_SCIEZKI: readonly ChronionaSciezka[] = [{ prefiks: "/hr", rola: "hr", nazwa: "Panel HR" }];

export function chronionaSciezka(sciezka: string): ChronionaSciezka | null {
  return CHRONIONE_SCIEZKI.find((c) => sciezka === c.prefiks || sciezka.startsWith(`${c.prefiks}/`)) ?? null;
}

/** Czy rola (lub jej brak) wystarcza, żeby wejść na ścieżkę. Strony oceny działają bez roli. */
export function czyMaDostep(rola: RolaId | null, sciezka: string): boolean {
  const chroniona = chronionaSciezka(sciezka);
  return !chroniona || chroniona.rola === rola;
}

const BAZA = "http://azymut.local";

/**
 * Adres powrotu po wyborze roli – tylko ścieżka w obrębie aplikacji
 * (blokuje `//inna-domena`, `https://...` itp., czyli open redirect).
 */
export function bezpiecznyPowrot(wartosc: string | null | undefined): string | null {
  if (!wartosc || !wartosc.startsWith("/") || wartosc.startsWith("//") || wartosc.startsWith("/\\")) return null;
  try {
    const url = new URL(wartosc, BAZA);
    if (url.origin !== BAZA || url.pathname === "/logowanie") return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** Adres strony wyboru roli z powrotem, np. `/logowanie?powrot=/hr`. */
export function adresLogowania(powrot?: string | null): string {
  const cel = bezpiecznyPowrot(powrot);
  return cel ? `/logowanie?powrot=${encodeURIComponent(cel).replaceAll("%2F", "/")}` : "/logowanie";
}
