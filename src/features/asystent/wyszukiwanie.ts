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
    "czym czego ktorym takie jakim mam mamy ma maja trzeba nalezy powinien powinna musi"
  ).split(" "),
);

// Kolejność: najdłuższe najpierw. Celowo bez „-owa/-owy” – rdzeń „okresow” ≠ „okres”.
const KONCOWKI = [
  "ami", "ach", "ego", "emu", "ich", "imi", "ymi", "ych", "owi", "iem",
  "om", "em", "ie", "ia", "iu", "ii", "ej", "ym", "im", "ow", "ia",
  "a", "e", "i", "o", "u", "y",
];

/** Synonimy pytań użytkowników → słownictwo dokumentów (po rdzeniowaniu). */
const SYNONIMY: Record<string, string[]> = {
  odwola: ["sprzec"], // odwołanie od oceny → sprzeciw
  odwoln: ["sprzec"],
  zaskar: ["sprzec"],
  iprz: ["indywi", "progra", "rozwoj"],
  szef: ["przelo"],
  punkta: ["punkt", "skal"],
  now: ["pierws"], // nowy pracownik → pierwsza ocena
};

export function bezPolskichZnakow(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/ł/g, "l");
}

/** Oboczności, których nie złapie odcinanie końcówek (miesiąc/miesięcy, dzień/dni). */
const ALIASY: Record<string, string> = { miesie: "miesia", dzien: "dni", stopie: "stopn" };

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

export function tokenyPytania(tekst: string): string[] {
  const t = tokeny(tekst);
  const extra = t.flatMap((x) => SYNONIMY[x] ?? []);
  return [...t, ...extra];
}

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
  private readonly docs: { item: T; tf: Map<string, number>; len: number }[];
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
      return { item, tf, len: toks.length };
    });
    this.avgLen = this.docs.reduce((s, d) => s + d.len, 0) / Math.max(1, this.docs.length);
  }

  idf(term: string): number {
    const n = this.docs.length;
    const df = this.df.get(term) ?? 0;
    return Math.log(1 + (n - df + 0.5) / (df + 0.5));
  }

  szukaj(pytanie: string, opcje: { limit?: number; waga?: (item: T) => number } = {}): Trafienie<T>[] {
    const terms = [...new Set(tokenyPytania(pytanie))];
    if (terms.length === 0) return [];
    // Słowa obecne w prawie każdym fragmencie („ocena”, „służba”) mało mówią o pokryciu pytania.
    const istotne = terms.filter((t) => this.idf(t) > 1);
    const wynik: Trafienie<T>[] = [];
    for (const d of this.docs) {
      let s = 0;
      let trafione = 0;
      for (const t of terms) {
        const f = d.tf.get(t);
        if (!f) continue;
        if (istotne.includes(t)) trafione++;
        const idf = this.idf(t);
        s += (idf * f * (this.k1 + 1)) / (f + this.k1 * (1 - this.b + (this.b * d.len) / this.avgLen));
      }
      if (s <= 0) continue;
      s *= opcje.waga?.(d.item) ?? 1;
      wynik.push({ item: d.item, wynik: s, pokrycie: istotne.length ? trafione / istotne.length : 0 });
    }
    wynik.sort((a, b) => b.wynik - a.wynik);
    return wynik.slice(0, opcje.limit ?? 6);
  }
}
