"use client";

import { useSyncExternalStore } from "react";

import { ROLA_COOKIE, ROLA_COOKIE_MAX_AGE, czyRolaId, type RolaId } from "./rola";
import { opisRoli, type OpisRoli } from "./role";

/** Zdarzenie wysyłane po zmianie roli w tej karcie (cookie same z siebie nie powiadamiają). */
const ZDARZENIE_ZMIANY = "azymut:rola";

export function odczytajRole(): RolaId | null {
  const wpis = document.cookie.split("; ").find((c) => c.startsWith(`${ROLA_COOKIE}=`));
  if (!wpis) return null;
  try {
    const wartosc = decodeURIComponent(wpis.slice(ROLA_COOKIE.length + 1));
    return czyRolaId(wartosc) ? wartosc : null;
  } catch {
    return null;
  }
}

function zapiszCookie(wartosc: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ROLA_COOKIE}=${encodeURIComponent(wartosc)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  window.dispatchEvent(new Event(ZDARZENIE_ZMIANY));
}

/** Zapisuje rolę w cookie. Zwraca `false`, gdy przeglądarka nie przyjęła cookie (np. blokada). */
export function zapiszRole(rola: RolaId): boolean {
  zapiszCookie(rola, ROLA_COOKIE_MAX_AGE);
  return odczytajRole() === rola;
}

/** Usuwa wybór roli (powrót do trybu „bez roli”). */
export function usunRole(): boolean {
  zapiszCookie("", 0);
  return odczytajRole() === null;
}

function subskrybuj(onChange: () => void) {
  // Zmiana w tej karcie → własne zdarzenie; w innej karcie → odświeżenie przy powrocie do okna.
  window.addEventListener(ZDARZENIE_ZMIANY, onChange);
  window.addEventListener("focus", onChange);
  return () => {
    window.removeEventListener(ZDARZENIE_ZMIANY, onChange);
    window.removeEventListener("focus", onChange);
  };
}

export type StanRoli = {
  /** Wybrana rola albo `null`, gdy użytkownik jej nie wybrał. */
  rola: RolaId | null;
  /** Opis wybranej roli (nazwa, osoba, uprawnienia). */
  opis: OpisRoli | null;
  /** `false` na serwerze i podczas hydracji – cookie odczytujemy dopiero w przeglądarce. */
  gotowe: boolean;
};

/** Rola demonstracyjna z cookie `azymut_rola` – po stronie klienta, aktualizuje się po zmianie roli. */
export function useRola(): StanRoli {
  const rola = useSyncExternalStore<RolaId | null | undefined>(subskrybuj, odczytajRole, () => undefined);
  if (rola === undefined) return { rola: null, opis: null, gotowe: false };
  return { rola, opis: rola ? opisRoli(rola) : null, gotowe: true };
}
