/**
 * Wyszukiwanie fragmentów bazy wiedzy bez płatnych embeddingów: BM25 po polsku.
 * Normalizacja: małe litery, bez polskich znaków, odcięcie typowych końcówek fleksyjnych,
 * rdzeń skrócony do 6 znaków (proste, ale skuteczne dla polskiej odmiany).
 * Plik bez importów – można go testować bezpośrednio w Node.
 */

const STOP = new Set(
  (
    "a aby albo ale ani az bo by byc byl byla bylo byly bez czy co dla do gdy gdzie go i ich ile im ja jak jaka jaki jakie jakiej jakich " +
    "jako je jego jej jesli jest jestem jeszcze juz ktora ktore ktory ktorej ktorych kto kiedy lub mi mnie moge moze mozna mu na nad " +
    "nie nim niz o od oraz po pod przez przy sa sie sobie ta tak takze te tego tej to tu ty w we wiec wszystko z za ze zeby " +
    "czym czego ktorym takie jakim mam mamy ma maja trzeba nalezy powinien powinna musi " +
    // Słowa pytające i modalne – nie występują w przepisach, a zaniżały pokrycie pytania („do kogo można wnieść…”).
    "kogo komu kim czyj czyja czyje jakiego jakiemu jakimi ktorego ktoremu ktorzy ktorymi dlaczego czemu skad dokad " +
    "wolno moga mozemy musze musza powinno powinni miec"
  ).split(" "),
);

// Kolejność: najdłuższe najpierw. Celowo bez „-owa/-owy” – rdzeń „okresow” ≠ „okres”.
// Rzeczowniki odczasownikowe i bezokoliczniki („ustalenie”, „ustalić” → „ustal”).
const KONCOWKI = [
  "aniem", "eniem", "ania", "enia", "aniu", "eniu", "anie", "enie",
  "ami", "ach", "ego", "emu", "ich", "imi", "ymi", "ych", "owi", "iem",
  "om", "em", "ie", "ia", "iu", "ii", "ej", "ym", "im", "ow", "ic", "ac", "ec",
  "a", "e", "i", "o", "u", "y",
];

/** Synonimy pytań użytkowników → słownictwo dokumentów (po rdzeniowaniu). */
const SYNONIMY: Record<string, string[]> = {
  odwol: ["sprzec"], // odwołać się, odwołanie od oceny → sprzeciw
  zaskar: ["sprzec"],
  iprz: ["indywi", "progra", "rozwoj"],
  szef: ["przelo"],
  punkta: ["punkt", "skal"],
  now: ["pierws"], // nowy pracownik → pierwsza ocena
  porozm: ["rozmow"], // porozmawiać z pracownikiem → rozmowa (wstępna, oceniająca)
  rozmaw: ["rozmow"],
};

export function bezPolskichZnakow(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l");
}

/**
 * Oboczności, których nie złapie odcinanie końcówek (miesiąc/miesięcy, dzień/dni),
 * i formy ucięte za krótko („zmianie” → „zmi”, choć „zmiana”, „zmiany” → „zmian”).
 */
const ALIASY: Record<string, string> = { miesie: "miesia", miesi: "miesia", dzien: "dni", stopie: "stopn", zmi: "zmian" };

export function rdzen(slowo: string): string {
  let w = slowo;
  if (w.length > 4) {
    for (const k of KONCOWKI) {
      if (w.endsWith(k) && w.length - k.length >= 3) {
        w = w.slice(0, -k.length);
        break;
      }
    }
  }
  const r = w.slice(0, 6);
  return ALIASY[r] ?? r;
}

/** Tekst → lista rdzeni (bez słów nieistotnych). Liczby zostają (terminy, punkty). */
export function tokeny(tekst: string): string[] {
  const out: string[] = [];
  // „arkusz C” – jednoliterowa nazwa arkusza jest istotna, sklejamy ją w jeden token.
  const t = bezPolskichZnakow(tekst).replace(/\b(arkusz\w*)\s+([abc])\b/g, "$1 ark$2");
  for (const w of t.split(/[^a-z0-9]+/)) {
    if (!w || STOP.has(w)) continue;
    if (w.length < 2 && !/\d/.test(w)) continue;
    out.push(rdzen(w));
  }
  return out;
}

/** Słowa pytania (bez powtórzeń), każde razem ze swoimi synonimami ze słownictwa dokumentów. */
export function grupyPytania(tekst: string): string[][] {
  return [...new Set(tokeny(tekst))].map((t) => [t, ...(SYNONIMY[t] ?? [])]);
}

export function tokenyPytania(tekst: string): string[] {
  return grupyPytania(tekst).flat();
}

/**
 * Do pokrycia wystarczy wspólny początek rdzenia – inna forma tego samego słowa
 * („wnieść” ~ „wniesienie”, „zatrudniony” ~ „zatrudnienie”). Na ranking BM25 nie wpływa.
 */
const PREFIKS = 5;

export interface Dokumentowalny {
  id: string;
  /** Tekst indeksowany (np. rozdział + treść). */
  indeks: string;
}

export interface Trafienie<T> {
  item: T;
  wynik: number;
  /** Jaka część istotnych słów pytania wystąpiła we fragmencie (0–1). */
  pokrycie: number;
}

export class Bm25<T extends Dokumentowalny> {
  private readonly docs: { item: T; tf: Map<string, number>; prefiksy: Set<string>; len: number }[];
  private readonly df = new Map<string, number>();
  private readonly avgLen: number;
  private readonly k1 = 1.2;
  private readonly b = 0.75;

  constructor(items: T[]) {
    this.docs = items.map((item) => {
      const tf = new Map<string, number>();
      const toks = tokeny(item.indeks);
      for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
      const prefiksy = new Set(toks.filter((t) => t.length >= PREFIKS).map((t) => t.slice(0, PREFIKS)));
      return { item, tf, prefiksy, len: toks.length };
    });
    this.avgLen = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length);
  }

  idf(term: string): number {
    const n = this.docs.length;
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  szukaj(
    pytanie: string,
    opcje: {
      limit?: number;
      waga?: (item: T) => number;
      /** Które słowa pytania liczą się do pokrycia; domyślnie rzadkie w tym indeksie (idf > 1). */
      istotne?: (term: string) => boolean;
    } = {},
  ): Trafienie<T>[] {
    const grupy = grupyPytania(pytanie);
    const terms = [...new Set(grupy.flat())];
    if (terms.length === 0) return [];
    // Słowa obecne w prawie każdym fragmencie („ocena”, „służba”) mało mówią o pokryciu pytania.
    // Synonim nie jest osobnym wymaganiem: słowo pytania jest pokryte, gdy we fragmencie jest ono albo jego synonim.
    const czyIstotne = opcje.istotne ?? ((t: string) => this.idf(t) > 1);
    const istotne = grupy.filter(([t]) => czyIstotne(t));
    const wynik: Trafienie<T>[] = [];
    for (const d of this.docs) {
      let s = 0;
      for (const t of terms) {
        const f = d.tf.get(t);
        if (!f) continue;
        const idf = this.idf(t);
        s += (idf * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * d.len) / this.avgLen));
      }
      if (s <= 0) continue;
      s *= opcje.waga?.(d.item) ?? 1;
      const zawiera = (t: string) => d.tf.has(t) || (t.length >= PREFIKS && d.prefiksy.has(t.slice(0, PREFIKS)));
      const trafione = istotne.filter((g) => g.some(zawiera)).length;
      wynik.push({ item: d.item, wynik: s, pokrycie: istotne.length ? trafione / istotne.length : 0 });
    }
    wynik.sort((a, b) => b.wynik - a.wynik);
    return wynik.slice(0, opcje.limit ?? 6);
  }
}

/** Od tylu znaków pytanie traktujemy jako „opis sytuacji + właściwe pytanie”. */
const DLUGIE_PYTANIE = 250;

/**
 * Sedno długiego pytania – warianty do osobnego wyszukania: same zdania pytające (od pierwszego z „?”)
 * oraz te zdania razem ze zdaniem tuż przed nimi (często niesie kontekst: „zbliża się ocena okresowa…”).
 * Bez „?” – ostatnie zdanie i dwa ostatnie. Długi opis sytuacji (pracownica, departament, projekty…)
 * ma wiele słów spoza przepisów i rozmywa pokrycie, przez co trafne pytanie dostawało „brak informacji”.
 * Dla krótkich pytań – pusta lista (zachowanie bez zmian).
 */
export function sednoPytania(tekst: string): string[] {
  if (tekst.length < DLUGIE_PYTANIE) return [];
  const zdania = (tekst.match(/[^.!?]+[.!?]*/g) ?? []).map((s) => s.trim()).filter(Boolean);
  if (zdania.length < 3) return [];
  const pierwszePytanie = zdania.findIndex((s) => s.endsWith("?"));
  const od = pierwszePytanie >= 0 ? pierwszePytanie : zdania.length - 1;
  const warianty = [zdania.slice(od).join(" "), zdania.slice(Math.max(0, od - 1)).join(" ")];
  return [...new Set(warianty)].filter((w) => w.length < tekst.length);
}
