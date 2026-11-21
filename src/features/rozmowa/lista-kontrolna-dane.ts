/**
 * Lista kontrolna rozmowy oceniającej – CYTATY z rozporządzeń (materiały organizatora, folder HackNation).
 * Nie parafrazujemy przepisów: pole `cytat` to dosłowny tekst, `zrodlo` + `miejsce` wskazują, skąd pochodzi.
 */
import type { RodzajOceny } from "@/types/ocena";

export interface ZrodloPrzepisu {
  dokument: string;
  miejsce: string;
}

export interface PunktListy {
  id: string;
  /** Krótka etykieta do listy kontrolnej. */
  etykieta: string;
  /** Dosłowny cytat z przepisu. */
  cytat: string;
  /** false = przepis mówi „może”, a nie „omawia”. */
  obowiazkowy: boolean;
}

export interface ListaKontrolna {
  wstep: string;
  zrodlo: ZrodloPrzepisu;
  punkty: PunktListy[];
  /** Dodatkowe wskazówki z przepisów / poradników (z cytatem i źródłem). */
  uwagi: { tekst: string; zrodlo: ZrodloPrzepisu }[];
}

const ROZPORZADZENIE_2016 =
  "Rozporządzenie Prezesa Rady Ministrów z dnia 4 kwietnia 2016 r. w sprawie warunków i sposobu przeprowadzania ocen okresowych urzędników służby cywilnej i pracowników służby cywilnej (Dz.U. 2016 poz. 470)";

const ROZPORZADZENIE_2015 =
  "Rozporządzenie Prezesa Rady Ministrów z dnia 23 lipca 2015 r. w sprawie szczegółowych warunków i sposobu dokonywania pierwszej oceny w służbie cywilnej (Dz.U. 2015 poz. 1144)";

const PORADNIK_OKRESOWA =
  "Poradnik „Oceny okresowe w służbie cywilnej”, KPRM – Departament Służby Cywilnej, wrzesień 2016";
const PORADNIK_PIERWSZA =
  "Poradnik „Pierwsza ocena w służbie cywilnej”, KPRM – Departament Służby Cywilnej, wrzesień 2016";

export const LISTA_KONTROLNA: Record<RodzajOceny, ListaKontrolna> = {
  okresowa: {
    wstep:
      "Przed sporządzeniem oceny na piśmie oceniający przeprowadza z ocenianym rozmowę oceniającą, podczas której omawia z nim:",
    zrodlo: { dokument: ROZPORZADZENIE_2016, miejsce: "§ 10" },
    punkty: [
      {
        id: "okr-obowiazki",
        etykieta: "Główne obowiązki i sposób ich realizacji wobec ustalonych kryteriów",
        cytat:
          "główne obowiązki wykonywane przez ocenianego w okresie, w którym podlegał ocenie, oraz sposób ich realizacji, z uwzględnieniem spełniania przez ocenianego ustalonych kryteriów oceny;",
        obowiazkowy: true,
      },
      {
        id: "okr-cele",
        etykieta: "Realizacja wyznaczonych celów (jeżeli je wyznaczono)",
        cytat:
          "sposób realizowania przez ocenianego celów do osiągnięcia w okresie, w którym oceniany podlegał ocenie, jeżeli cele te zostały wyznaczone;",
        obowiazkowy: true,
      },
      {
        id: "okr-rozwoj",
        etykieta: "Kierunki rozwoju zawodowego i potrzeby szkoleniowe",
        cytat:
          "kierunki dalszego rozwoju zawodowego i potrzeby ocenianego w zakresie podnoszenia kwalifikacji i doskonalenia umiejętności.",
        obowiazkowy: true,
      },
    ],
    uwagi: [
      {
        tekst: "Sporządzając ocenę na piśmie, oceniający bierze pod uwagę wnioski z rozmowy oceniającej.",
        zrodlo: { dokument: ROZPORZADZENIE_2016, miejsce: "§ 11 ust. 2" },
      },
      {
        tekst:
          "(…) ważne jest, aby rozmowa oceniająca nie była monologiem oceniającego, lecz dialogiem oceniającego z ocenianym.",
        zrodlo: { dokument: PORADNIK_OKRESOWA, miejsce: "rozdz. 6.2.4" },
      },
    ],
  },
  pierwsza: {
    wstep:
      "Dokonanie pierwszej oceny polega na przeprowadzeniu z ocenianym rozmowy oceniającej, w zakresie określonym w § 2 (§ 7 pkt 1). Pierwszej oceny dokonuje się, biorąc pod uwagę:",
    zrodlo: { dokument: ROZPORZADZENIE_2015, miejsce: "§ 2 i § 7 pkt 1" },
    punkty: [
      {
        id: "pie-postawa",
        etykieta: "Postawa, zaangażowanie, postępy, relacje, terminowość – według 5 elementów oceny",
        cytat:
          "postawę ocenianego, jego zaangażowanie i postępy w pracy, relacje ze współpracownikami oraz terminowość wykonywania zadań, oceniane za pomocą następujących elementów oceny: a) rzetelność, b) wykorzystywanie wiedzy i doskonalenie zawodowe, c) organizacja pracy i orientacja na osiąganie celów, d) komunikacja, e) współpraca;",
        obowiazkowy: true,
      },
      {
        id: "pie-egzamin",
        etykieta: "Wynik egzaminu ze służby przygotowawczej (jeżeli dotyczy)",
        cytat:
          "wynik egzaminu ze służby przygotowawczej, jeżeli oceniany był obowiązany do przystąpienia do tego egzaminu;",
        obowiazkowy: true,
      },
      {
        id: "pie-sprawozdanie",
        etykieta: "Sprawozdanie sporządzone przez ocenianego",
        cytat: "sprawozdanie sporządzone przez ocenianego.",
        obowiazkowy: true,
      },
      {
        id: "pie-rozwoj",
        etykieta: "Kierunki dalszego rozwoju zawodowego i potrzeby (opcjonalnie)",
        cytat:
          "(…) podczas której bezpośredni przełożony może omówić także kierunki dalszego rozwoju zawodowego i potrzeby ocenianego;",
        obowiazkowy: false,
      },
    ],
    uwagi: [
      {
        tekst:
          "Bezpośredni przełożony przeprowadza z ocenianym rozmowę oceniającą niezwłocznie po złożeniu sprawozdania przez ocenianego albo po upływie terminu wyznaczonego na złożenie sprawozdania.",
        zrodlo: { dokument: ROZPORZADZENIE_2015, miejsce: "§ 8 ust. 1" },
      },
      {
        tekst: "W rozmowie może uczestniczyć kierujący komórką organizacyjną, w której oceniany jest zatrudniony.",
        zrodlo: { dokument: ROZPORZADZENIE_2015, miejsce: "§ 8 ust. 2" },
      },
      {
        tekst: "Podczas dokonywania pierwszej oceny bierze się pod uwagę wnioski z rozmowy oceniającej.",
        zrodlo: { dokument: ROZPORZADZENIE_2015, miejsce: "§ 9 ust. 2" },
      },
      {
        tekst:
          "Pracownikowi należy dać możliwość wypowiedzenia się, jak on sam ocenia swoją postawę, zaangażowanie, postępy w pracy, relacje ze współpracownikami oraz terminowość wykonywania zadań.",
        zrodlo: { dokument: PORADNIK_PIERWSZA, miejsce: "rozdz. 6.5.1" },
      },
    ],
  },
};
