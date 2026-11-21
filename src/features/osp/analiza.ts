/**
 * Analiza tekstu OSP bez AI: usuwanie danych osobowych i odczyt arkusza z sekcji
 * „LICZBA PODLEGŁYCH PRACOWNIKÓW”. Czyste funkcje – działają w przeglądarce i na serwerze.
 */
import { arkuszDlaStanowiska } from "@/lib/ocena/zasady";
import type { Arkusz } from "@/types/ocena";

export const MAX_DLUGOSC_OSP = 15_000;
export const MIN_DLUGOSC_OSP = 80;

// ── Normalizacja i dane osobowe ──────────────────────────────────────────────

/** Ujednolica znaki pól wyboru z Worda / przeglądarki do ☒ (zaznaczone) i ☐ (puste). */
export function normalizujZnaczniki(tekst: string): string {
  return tekst
    .replace(/\r\n?/g, "\n")
    .replace(/[☑✓✔⊠■▣]|\[[xX]\]|\([xX]\)/g, "☒")
    .replace(/[□▢]|\[ \]|\( \)/g, "☐")
    .replace(/☒{2,}/g, "☒")
    .replace(/☐{2,}/g, "☐");
}

export interface WynikCzyszczenia {
  tekst: string;
  /** Nazwy usuniętych fragmentów (do pokazania użytkownikowi). */
  usuniete: string[];
}

/**
 * Usuwa fragmenty z danymi osobowymi przed wysłaniem do AI:
 * część „Zapoznanie pracownika z opisem stanowiska pracy” (imię i nazwisko, podpis)
 * oraz część III (podpisy kierującego komórką i osoby zatwierdzającej).
 */
export function wyczyscOsp(wejscie: string): WynikCzyszczenia {
  let tekst = normalizujZnaczniki(wejscie);
  const usuniete: string[] = [];

  const zapoznanie = tekst.search(/ZAPOZNANIE PRACOWNIKA Z OPISEM STANOWISKA/i);
  if (zapoznanie !== -1) {
    const reszta = tekst.slice(zapoznanie);
    const koniec = reszta.search(/CZĘŚĆ\s+II\b|CZESC\s+II\b|CEL ISTNIENIA STANOWISKA/i);
    // Bez znacznika końca usuwamy kilka linii po nagłówku (tam są imię, nazwisko i podpis).
    const dlugosc = koniec > 0 ? koniec : reszta.split("\n").slice(0, 8).join("\n").length;
    tekst = `${tekst.slice(0, zapoznanie)}${tekst.slice(zapoznanie + dlugosc)}`;
    usuniete.push("część „Zapoznanie pracownika z opisem stanowiska pracy”");
  }

  const czescIII = tekst.search(/CZĘŚĆ\s+III\b|CZESC\s+III\b/i);
  if (czescIII !== -1) {
    tekst = tekst.slice(0, czescIII);
    usuniete.push("część III (podpisy i zatwierdzenie opisu)");
  } else {
    const zatwierdzenie = tekst.search(/Osoba zatwierdzająca opis stanowiska/i);
    if (zatwierdzenie !== -1) {
      tekst = tekst.slice(0, zatwierdzenie);
      usuniete.push("zatwierdzenie opisu (podpisy)");
    }
  }

  // Pozostałe linie z nagłówkiem „imię i nazwisko” – na wszelki wypadek.
  const linie = tekst.split("\n");
  const bezNazwisk = linie.filter((l) => !/imi[ęe] i nazwisko/i.test(l));
  if (bezNazwisk.length !== linie.length && !usuniete.length) usuniete.push("pola „imię i nazwisko”");

  tekst = bezNazwisk
    .join("\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { tekst, usuniete };
}

/** Sekcje OSP istotne dla doboru kryteriów i limit znaków każdej z nich (0 = pomijamy). */
const SEKCJE_DLA_AI: { wzorzec: RegExp; limit: number }[] = [
  { wzorzec: /CEL ISTNIENIA STANOWISKA/i, limit: 900 },
  { wzorzec: /LICZBA PODLEG[ŁL]YCH PRACOWNIK/i, limit: 300 },
  { wzorzec: /G[ŁL][ÓO]WNE ZADANIA REALIZOWANE/i, limit: 3800 },
  { wzorzec: /UPOWA[ŻZ]NIENIA I PE[ŁL]NOMOCNICTWA/i, limit: 300 },
  { wzorzec: /Z[ŁL]O[ŻZ]ONO[ŚS][ĆC] I KREATYWNO/i, limit: 350 },
  { wzorzec: /NIEZB[ĘE]DNA SAMODZIELNO/i, limit: 350 },
  { wzorzec: /HORYZONT CZASOWY/i, limit: 0 },
  { wzorzec: /KONTAKTY ZEWN[ĘE]TRZNE/i, limit: 300 },
  { wzorzec: /CZYNNIKI SZCZEG[ÓO]LNIE/i, limit: 0 },
  { wzorzec: /WYMAGANE KOMPETENCJE/i, limit: 1100 },
];

function przytnij(tekst: string, limit: number): string {
  if (tekst.length <= limit) return tekst;
  const ciecie = tekst.lastIndexOf(" ", limit);
  return `${tekst.slice(0, ciecie > limit * 0.7 ? ciecie : limit)}…`;
}

/**
 * Tekst dla modelu (darmowe modele mają małe limity tokenów): tylko sekcje istotne dla doboru
 * kryteriów, każda przycięta, bez niezaznaczonych opcji pól wyboru. Tekst bez nagłówków OSP – przycięty w całości.
 */
export function tekstDlaAi(tekst: string, limitCalosci = 6500): string {
  const bezPustychOpcji = tekst.replace(/☐[^☐☒\n]*/g, "").replace(/[ \t]{2,}/g, " ");
  const pozycje = SEKCJE_DLA_AI.map((s) => ({ ...s, start: bezPustychOpcji.search(s.wzorzec) }))
    .filter((s) => s.start !== -1)
    .sort((a, b) => a.start - b.start);
  if (pozycje.length < 3) return przytnij(bezPustychOpcji.trim(), limitCalosci);

  const czesci = pozycje.map((s, i) => {
    if (s.limit === 0) return "";
    const koniec = pozycje[i + 1]?.start ?? bezPustychOpcji.length;
    return przytnij(bezPustychOpcji.slice(s.start, koniec).trim(), s.limit);
  });
  return przytnij(czesci.filter(Boolean).join("\n\n"), limitCalosci);
}

// ── Arkusz z sekcji „LICZBA PODLEGŁYCH PRACOWNIKÓW” ──────────────────────────

const OPCJE = [
  { id: "brak", wzorzec: /brak podleg[łl]ych pracownik/i, etykieta: "brak podległych pracowników" },
  { id: "do4", wzorzec: /do 4 pracownik/i, etykieta: "kieruje lub koordynuje pracę do 4 pracowników" },
  { id: "5-9", wzorzec: /od 5 do 9 pracownik/i, etykieta: "kieruje lub koordynuje pracę od 5 do 9 pracowników" },
  { id: "9+", wzorzec: /powy[żz]ej 9 pracownik/i, etykieta: "kieruje lub koordynuje pracę powyżej 9 pracowników" },
  {
    id: "kierownicy",
    wzorzec: /podlegaj[ąa] osoby kieruj[ąa]ce/i,
    etykieta: "bezpośrednio podlegają osoby kierujące pracą innych pracowników",
  },
] as const;

export interface OdczytArkusza {
  arkusz: Exclude<Arkusz, "A">;
  /** Zaznaczona opcja, np. „brak podległych pracowników”. */
  zaznaczone: string;
}

function rozpoznajOpcje(fragment: string) {
  return OPCJE.find((o) => o.wzorzec.test(fragment));
}

/**
 * Arkusz wg § 3 rozporządzenia z 2016 r.: zaznaczone „brak podległych pracowników” → C,
 * każda inna zaznaczona opcja (kierowanie / koordynowanie pracą) → B.
 * Zwraca null, gdy sekcji nie da się jednoznacznie odczytać – wtedy decyduje AI.
 */
export function odczytajArkusz(wejscie: string): OdczytArkusza | null {
  const tekst = normalizujZnaczniki(wejscie);
  const start = tekst.search(/LICZBA PODLEG[ŁL]YCH PRACOWNIK[ÓO]W/i);
  if (start === -1) return null;
  let sekcja = tekst.slice(start, start + 900);
  const koniec = sekcja.search(/G[ŁL][ÓO]WNE ZADANIA|ZADANIA DOMINUJ/i);
  if (koniec > 0) sekcja = sekcja.slice(0, koniec);

  let zaznaczone: (typeof OPCJE)[number][] = [];
  if (/[☒☐]/.test(sekcja)) {
    // Pary [znacznik, tekst opcji]
    const czesci = sekcja.split(/([☒☐])/);
    for (let i = 1; i < czesci.length; i += 2) {
      const opcja = rozpoznajOpcje(czesci[i + 1] ?? "");
      if (czesci[i] === "☒" && opcja) zaznaczone.push(opcja);
    }
  } else {
    // Bez pól wyboru: w sekcji została tylko jedna opcja (np. ktoś usunął pozostałe).
    const znalezione = OPCJE.filter((o) => o.wzorzec.test(sekcja));
    if (znalezione.length === 1) zaznaczone = znalezione;
  }

  if (zaznaczone.length === 0) return null;
  const brak = zaznaczone.some((o) => o.id === "brak");
  if (brak && zaznaczone.length > 1) return null; // sprzeczne zaznaczenia
  return {
    arkusz: arkuszDlaStanowiska(!brak),
    zaznaczone: zaznaczone.map((o) => o.etykieta).join(", "),
  };
}
