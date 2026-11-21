/**
 * Minimalizacja danych: zanim pytanie trafi do modelu AI, usuwamy z niego imiona i nazwiska.
 * Heurystyka (bez zewnętrznych usług): popularne imiona w dowolnej odmianie, słowo z wielkiej
 * litery tuż po imieniu albo po „pan/pani…” (nazwisko) oraz typowe nazwiska na -ski/-cki/-dzki.
 * Asystent formalny nie potrzebuje danych osobowych – w UI też o to prosimy.
 */

const IMIONA = (
  "Adam Adrian Agata Agnieszka Aleksander Aleksandra Alicja Andrzej Aneta Anna Antoni Arkadiusz Artur Barbara Bartłomiej Bartosz " +
  "Beata Bogdan Bogusław Bożena Cezary Damian Daniel Danuta Dariusz Dawid Dominik Dominika Dorota Edyta Elżbieta Emilia Ewelina " +
  "Filip Grażyna Grzegorz Halina Hanna Henryk Iwona Izabela Jacek Jadwiga Jakub Jan Janina Janusz Jarosław Jerzy Joanna Jolanta " +
  "Józef Julia Julian Justyna Kamil Kamila Karol Karolina Katarzyna Kazimierz Kinga Klaudia Konrad Krystyna Krzysztof Leszek " +
  "Lucyna Łukasz Maciej Magdalena Maja Małgorzata Marcin Marek Maria Mariusz Marta Martyna Mateusz Michał Mikołaj Mirosław " +
  "Monika Natalia Norbert Olga Oliwia Patrycja Paulina Paweł Piotr Przemysław Rafał Renata Robert Roman Ryszard Sebastian " +
  "Stanisław Stefan Sylwia Szymon Tadeusz Teresa Tomasz Urszula Wanda Weronika Wiesław Wiktor Wiktoria Wioletta Witold " +
  "Władysław Wojciech Zbigniew Zdzisław Zofia Zuzanna Ewa Igor Iga Oskar Kacper Hubert Maksymilian Dmitrij Andriej " +
  "Władimir Olena Oksana Iryna Dmytro Ołeksandr Diana Vlad Dima Andrey"
).split(" ");

export const ZNACZNIK_OSOBY = "[osoba]";

/** Rdzenie imion: „Anna” → „ann” (Anny, Annie, Anną), „Jan” → „jan” (Jana, Janowi). */
const RDZENIE = IMIONA.map((i) => {
  const r = /[aeo]$/.test(i) && i.length > 3 ? i.slice(0, -1) : i;
  return { rdzen: r.toLowerCase(), max: r.length + 4 };
});

function toImie(slowo: string): boolean {
  const s = slowo.toLowerCase();
  return RDZENIE.some(({ rdzen, max }) => s.startsWith(rdzen) && s.length <= max);
}

const WIELKA = /^\p{Lu}\p{Ll}+(?:-\p{Lu}\p{Ll}+)?$/u;
const NAZWISKO_SKI = /^\p{Lu}\p{Ll}*(?:ski|cki|dzki|ska|cka|dzka)(?:ego|iego|iej|im|ich|ą|a|i|y|emu)?$/u;
const NIE_NAZWISKA =
  /^(Polsk|Europejsk|Angielsk|Niemieck|Francusk|Krajow|Bydgosk|Warszawsk|Gdańsk|Krakowsk|Nisk|Wąsk|Blisk|Ludzk|Miejsk|Wiejsk|Męsk|Żeńsk|Morsk)/;
const GRZECZNOSC = /^(pan|pani|pana|panu|panią|panem|panie|państwo)$/i;
const SEPARATOR = /^(\s+|[.,;:!?()„”"«»])$/;

export function anonimizuj(tekst: string): { tekst: string; zmieniono: boolean } {
  const czesci = tekst.split(/(\s+|[.,;:!?()„”"«»])/);
  let zmieniono = false;
  let poprzednieSlowo = "";
  let poprzednioImie = false;

  for (let i = 0; i < czesci.length; i++) {
    const w = czesci[i];
    if (!w || SEPARATOR.test(w)) continue;

    const wielka = WIELKA.test(w);
    const imie = wielka && toImie(w);
    const nazwisko =
      wielka &&
      !imie &&
      (poprzednioImie || GRZECZNOSC.test(poprzednieSlowo) || (NAZWISKO_SKI.test(w) && !NIE_NAZWISKA.test(w)));

    if (imie || nazwisko) {
      // „Jan Kowalski” → jeden znacznik zamiast dwóch.
      czesci[i] = nazwisko && poprzednioImie ? "" : ZNACZNIK_OSOBY;
      zmieniono = true;
    }
    poprzednioImie = imie;
    poprzednieSlowo = w;
  }

  const wynik = czesci
    .join("")
    .replace(/ {2,}/g, " ")
    .replace(/ +([.,;:!?)])/g, "$1");
  return { tekst: wynik, zmieniono };
}
