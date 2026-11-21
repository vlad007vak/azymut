# API i wymiana danych – Azymut

Zadanie wymaga „możliwości bezpiecznej wymiany danych poprzez udokumentowane interfejsy (API)” oraz przyszłej
integracji z EZD i systemami kadrowymi. Ten dokument opisuje:

1. [interfejsy prototypu](#1-endpointy-prototypu) – szczegóły w specyfikacji OpenAPI 3.1,
2. [format eksportu oceny](#2-eksport-oceny--format-azymutocena-wersja-1) `azymut.ocena` (JSON, wersja 1),
3. [integracje docelowe](#3-integracje-docelowe-propozycja) z EZD i systemem kadrowym (propozycja),
4. [bezpieczeństwo przed wdrożeniem](#4-bezpieczeństwo-przed-wdrożeniem).

| Gdzie | Co |
|---|---|
| [`public/openapi.json`](../public/openapi.json) – w aplikacji pod adresem `/openapi.json` | Specyfikacja OpenAPI 3.1: wszystkie endpointy, przykłady, kody błędów, schemat `EksportOceny` |
| Strona `/dokumentacja-api` | Czytelny opis endpointów generowany z tego samego pliku |
| [`src/features/eksport`](../src/features/eksport) | `eksportujOcene(ocena)` i przycisk `<EksportOceny ocena={ocena} />` („Pobierz JSON”) |

## 1. Endpointy prototypu

Zasady wspólne:
- żądania i odpowiedzi w JSON (UTF-8);
- błąd ma zawsze postać `{ "error": "komunikat po polsku" }`;
- treść każdego żądania jest walidowana (zod) – nieprawidłowe dane → `400`;
- **minimalizacja danych:** do endpointów AI nie wysyłamy imion ani nazwisk – tylko stanowisko, kryteria, poziomy
  i przykłady zachowań; asystent formalny dodatkowo usuwa imiona i nazwiska z pytania (`zanonimizowano: true`);
- odpowiedzi AI są **sugestiami** – ostateczny poziom każdego kryterium wybiera przełożony;
- odpowiedzi AI są buforowane po stronie serwera (te same dane → bez ponownego zapytania do modelu; w `/api/osp`
  i `/api/rozmowa` sygnalizuje to nagłówek `X-AI-Cache: hit`).

| Metoda i ścieżka | Do czego służy | Kody błędów |
|---|---|---|
| `POST /api/asystent` | Asystent formalny: odpowiedź z bazy wiedzy (rozporządzenia, poradniki KPRM, model kompetencji) ze źródłami i dosłownym cytatem; `brakInformacji: true`, gdy baza nie zawiera odpowiedzi | 400, 500, 503 |
| `POST /api/osp` | Analiza opisu stanowiska pracy: sugerowany arkusz (B/C), do 3 kryteriów dodatkowych, najważniejsze wskaźniki; gdy AI niedostępne – sam arkusz odczytany z OSP (`X-AI-Status: niedostepne`) | 400, 500, 503 |
| `POST /api/rozmowa` | Asystent rozmowy: pytania do pracownika, tematy do omówienia, argumenty per kryterium, propozycje do wniosków rozwojowych | 400, 500, 502, 503 |
| `GET /api/ai/status` | Lista skonfigurowanych dostawców AI (bez kluczy) | – |
| `POST /api/ai/status` | Test połączenia z każdym dostawcą AI | – |

Znaczenie kodów: `400` – nieprawidłowe dane wejściowe; `502` – model AI zwrócił pustą odpowiedź; `503` – żaden
dostawca AI nie odpowiedział (limit darmowych modeli albo brak kluczy); `500` – nieoczekiwany błąd serwera.
Komunikaty i przykłady – w `openapi.json`. Nowe endpointy (np. `/api/jakosc`) dopisujemy do specyfikacji razem z kodem.

## 2. Eksport oceny – format `azymut.ocena`, wersja 1

Dokument JSON z danymi jednej oceny (pierwszej albo okresowej) – do przekazania do systemu kadrowego lub do EZD.
Prototyp przechowuje oceny w przeglądarce, więc wymiana odbywa się plikiem: przycisk **„Pobierz JSON”** w kroku
„Dokument” kreatora oceny. W kodzie: `eksportujOcene(ocena)` z `src/features/eksport` (czysta funkcja – docelowo
ten sam wynik może zwracać endpoint API).

Zasady formatu:
- **pola są zawsze obecne**; brak wartości to `null` (a nie brak pola) – odbiorca nie musi zgadywać;
- daty w ISO 8601: `rrrr-mm-dd`, a `wygenerowano` z godziną w UTC;
- **wynik liczony wyłącznie wg rozporządzeń** (`src/lib/ocena/zasady.ts`), liczby punktów zaokrąglone do 2 miejsc
  po przecinku; `wynik` to `null`, dopóki przełożony nie wybierze ocen cząstkowych dla wszystkich kryteriów;
- `sugestiaSystemu` (podpowiedź z wybranych zachowań) i `ocenaCzastkowa` (decyzja przełożonego) są osobnymi polami –
  z pliku widać, czy przełożony przyjął sugestię, czy wybrał inny poziom;
- nazwa pliku nie zawiera danych osobowych: `azymut-ocena-<id>-<data>.json`.

**Czego nie eksportujemy:** notatek przełożonego z przygotowania i przebiegu rozmowy (`notatkiRozmowy`) ani
przypomnień HR – to dane robocze, które nie są częścią arkusza oceny (minimalizacja danych).

**Plik zawiera dane osobowe** (imię i nazwisko ocenianego i oceniającego) – przekazujemy go tylko kanałami
dopuszczonymi w urzędzie (patrz [bezpieczeństwo](#4-bezpieczeństwo-przed-wdrożeniem)).

### Pola główne

| Pole | Typ | Opis |
|---|---|---|
| `format` | `"azymut.ocena"` | Identyfikator formatu |
| `wersja` | `1` | Wersja formatu (patrz [wersjonowanie](#wersjonowanie)) |
| `wygenerowano` | string (date-time) | Data i godzina wygenerowania pliku (UTC) |
| `zrodlo` | `{ aplikacja, modelKompetencji }` | System źródłowy i źródło modelu kompetencji |
| `id` | string | Identyfikator oceny w systemie źródłowym |
| `urzad` | string | Nazwa urzędu |
| `rodzaj` | `"pierwsza"` \| `"okresowa"` | Rodzaj oceny |
| `arkusz` | `"B"` \| `"C"` \| `null` | Arkusz oceny okresowej; `null` dla pierwszej oceny |
| `etap` | `"zaplanowana"` … `"zakonczona"` | Etap procesu; przed `"sporzadzona"` plik jest wersją roboczą |
| `okres` | `{ od, do }` (date) | Okres podlegania ocenie |
| `terminOceny` | date | Okresowa: termin sporządzenia oceny na piśmie; pierwsza: koniec okresu na dokonanie oceny |
| `oceniany` | `{ imie, nazwisko, stanowisko, komorka, urzednikSC }` | Dane ocenianego; `urzednikSC: true` – urzędnik służby cywilnej |
| `oceniajacy` | `{ imie, nazwisko, stanowisko, komorka }` | Dane oceniającego (pierwsza ocena: bezpośredni przełożony) |
| `kryteria` | `KryteriumEksportu[]` | Okresowa: kryteria obowiązkowe dla arkusza + do 3 dodatkowych; pierwsza: 5 elementów oceny |
| `pierwsza` | obiekt \| `null` | Tylko pierwsza ocena: `egzaminSluzbyPrzygotowawczej` (`tak`/`nie`/`nie-dotyczy`), `sprawozdanieWTerminie`, `terminSprawozdania` |
| `wynik` | `WynikEksportu` \| `null` | Wynik oceny wg rozporządzeń |
| `uzasadnienie` | string \| `null` | Uzasadnienie (obowiązkowe przy ocenie negatywnej) |
| `wnioskiRozwojowe` | string \| `null` | Okresowa: wnioski do IPRZ; pierwsza: wnioski dotyczące rozwoju zawodowego |
| `daty` | `{ rozmowaWstepna, rozmowaOceniajaca, sporzadzenie, zapoznanie }` | Daty etapów (date \| `null`) |

### Kryterium (`kryteria[]`)

| Pole | Typ | Opis |
|---|---|---|
| `kompetencja` | `{ id, nazwa }` | Kompetencja z modelu (14 identyfikatorów – słownik `KompetencjaId` w OpenAPI) |
| `dodatkowe` | boolean | `true` – kryterium dodatkowe wybrane przez oceniającego (tylko ocena okresowa) |
| `sugestiaSystemu` | `{ poziom, nazwa, punkty }` \| `null` | Podpowiedź systemu – nie jest decyzją |
| `ocenaCzastkowa` | `{ poziom, nazwa, punkty }` \| `null` | Decyzja przełożonego; `null` – jeszcze nie wybrana. Pierwsza ocena: tylko poziomy 2–4 (3/5/7 pkt) |
| `wskazniki` | `WskaznikEksportu[]` | Wskaźniki dobrane do stanowiska |

Wskaźnik (`kryteria[].wskazniki[]`): `id` (np. `rzetelnosc-2`), `opis` (treść wskaźnika), `poziom` (1–5 albo `null` –
brak podstaw do oceny), `zachowanie` (opis wybranego zachowania z modelu), `przyklad` (przykład z okresu oceny).

Poziomy: `1` znacznie poniżej (1 pkt), `2` poniżej (3 pkt), `3` na poziomie (5 pkt), `4` powyżej (7 pkt),
`5` znacznie powyżej oczekiwań (9 pkt).

### Wynik (`wynik`)

| Pole | Ocena okresowa | Pierwsza ocena |
|---|---|---|
| `srednia` | średnia arytmetyczna ocen cząstkowych (1–9 pkt) | `null` |
| `ocenaLaczna` | `null` | ocena łączna (3–7 pkt) |
| `poziomOgolny` | `{ poziom, nazwa }` – ogólny poziom spełniania kryteriów | `null` |
| `wynik` | `"pozytywna"` \| `"negatywna"` | `"pozytywna"` \| `"negatywna"` |
| `powody` | powody oceny negatywnej (pusta lista przy pozytywnej) | jw. |

### Przykład (skrócony – jedno kryterium z sześciu)

```json
{
  "format": "azymut.ocena",
  "wersja": 1,
  "wygenerowano": "2026-11-21T14:30:00.000Z",
  "zrodlo": { "aplikacja": "Azymut", "modelKompetencji": "Model kompetencji – materiał organizatora zadania „Kompas kompetencji” (…)" },
  "id": "o1",
  "urzad": "Ministerstwo Cyfryzacji",
  "rodzaj": "okresowa",
  "arkusz": "C",
  "etap": "sporzadzona",
  "okres": { "od": "2024-12-01", "do": "2026-11-30" },
  "terminOceny": "2026-12-15",
  "oceniany": { "imie": "Anna", "nazwisko": "Kowalczyk", "stanowisko": "radca", "komorka": "Departament Rozwoju i Bezpieczeństwa Sztucznej Inteligencji, Wydział Wspierania Innowacyjności", "urzednikSC": true },
  "oceniajacy": { "imie": "Katarzyna", "nazwisko": "Wiśniewska", "stanowisko": "naczelnik wydziału", "komorka": "(…)" },
  "kryteria": [
    {
      "kompetencja": { "id": "rzetelnosc", "nazwa": "Rzetelność" },
      "dodatkowe": false,
      "sugestiaSystemu": { "poziom": 2, "nazwa": "Poniżej oczekiwań", "punkty": 3 },
      "ocenaCzastkowa": { "poziom": 2, "nazwa": "Poniżej oczekiwań", "punkty": 3 },
      "wskazniki": [
        {
          "id": "rzetelnosc-2",
          "opis": "Dotrzymywanie zobowiązań (realizacja zadań) w wyznaczonym czasie.",
          "poziom": 2,
          "zachowanie": "Realizuje zadania w terminie przy przypomnieniach lub zgłasza zagrożenie zbyt późno, by zmienić plan.",
          "przyklad": "Dwukrotnie (marzec i wrzesień 2026) zgłosiła ryzyko opóźnienia stanowiska do konsultacji dopiero w dniu terminu."
        }
      ]
    }
  ],
  "pierwsza": null,
  "wynik": { "srednia": 5, "ocenaLaczna": null, "poziomOgolny": { "poziom": 3, "nazwa": "Na poziomie oczekiwań" }, "wynik": "pozytywna", "powody": [] },
  "uzasadnienie": "(…)",
  "wnioskiRozwojowe": "(…)",
  "daty": { "rozmowaWstepna": "2024-12-05", "rozmowaOceniajaca": "2026-12-02", "sporzadzenie": "2026-12-04", "zapoznanie": null }
}
```

Pełny przykład (wszystkie kryteria oceny o1) – `openapi.json` → `components.schemas.EksportOceny.examples`.
Dane w przykładach są fikcyjne.

### Wersjonowanie

- `wersja` zwiększamy tylko przy **zmianie niekompatybilnej**: usunięcie pola, zmiana nazwy, typu albo znaczenia.
- Dodanie nowego pola nie zmienia wersji – odbiorca **ignoruje nieznane pola**.
- Odbiorca sprawdza `format` i `wersja` przed importem i odrzuca plik w nieobsługiwanej wersji.
- Schemat każdej wersji jest w `openapi.json` (`EksportOceny`), więc odbiorca może walidować plik automatycznie.

## 3. Integracje docelowe (propozycja)

> **Zastrzeżenie.** To propozycja architektury dla wdrożenia, a nie opis istniejących interfejsów. Nie opisujemy API
> EZD ani systemów kadrowych (np. QNT) – ich interfejsy, formaty i sposób uwierzytelniania trzeba ustalić
> z właścicielem i dostawcą danego systemu w urzędzie. Integrację realizuje **adapter po stronie urzędu**, który
> tłumaczy format Azymutu na interfejs udostępniany przez dany system.

```text
 System kadrowy (np. QNT)          Azymut                              EZD
 ────────────────────────          ──────                              ───
 dane pracownika, przełożony ──►  proces oceny (przełożony, HR)
 OSP, terminy ocen           ──►  analiza OSP (/api/osp)
                                  sporządzona ocena:
 wynik, daty, wnioski IPRZ   ◄──    plik / API  azymut.ocena  ──►   akta / sprawa: arkusz PDF
                                                                     + azymut.ocena jako metadane
                                  ◄── potwierdzenie (np. znak sprawy)
```

### Przepływy

| Kierunek | Dane | Po co | W prototypie dziś |
|---|---|---|---|
| system kadrowy → Azymut | stanowisko, komórka, data zatrudnienia, status urzędnika SC, czy kieruje zespołem, bezpośredni przełożony | bez ręcznego wpisywania; arkusz B/C wynika z danych | fikcyjne dane demo (`src/data/demo.ts`) |
| system kadrowy / EZD → Azymut | tekst opisu stanowiska pracy | analiza OSP bez kopiowania tekstu | OSP wklejany ręcznie do `/api/osp` |
| system kadrowy → Azymut | data poprzedniej oceny, data zatrudnienia | wyliczenie terminów (panel HR, przypomnienia) | terminy w danych demo |
| Azymut → EZD | arkusz oceny (PDF z kroku „Dokument”) + plik `azymut.ocena` | dołączenie do sprawy / akt osobowych; podpisy i zapoznanie się w EZD | druk / zapis PDF, „Pobierz JSON” |
| Azymut → system kadrowy | `wynik`, `daty.sporzadzenie`, `daty.zapoznanie`, `wnioskiRozwojowe`, `okres` | ewidencja ocen, termin następnej oceny, IPRZ | „Pobierz JSON” |
| EZD → Azymut | potwierdzenie przyjęcia (np. identyfikator dokumentu w EZD) | ślad, że arkusz trafił do akt | – |

### Proponowane endpointy (docelowe – nie istnieją w prototypie)

| Metoda i ścieżka | Opis |
|---|---|
| `GET /api/v1/oceny/{id}/eksport` | Ten sam dokument `azymut.ocena` co plik – do pobrania przez adapter |
| `GET /api/v1/oceny?etap=sporzadzona&zmienionoOd=…` | Lista ocen do synchronizacji (przyrostowo, po dacie zmiany) |
| `POST /api/v1/pracownicy/import` | Import danych pracowników z systemu kadrowego (przez adapter) |
| `POST /api/v1/oceny/{id}/potwierdzenie` | Zwrotne potwierdzenie z EZD / systemu kadrowego (identyfikator dokumentu, data) |

Zasady integracji: wersjonowana ścieżka (`/api/v1`), idempotentne importy (ten sam plik dwa razy = ten sam stan),
identyfikatory pracowników z systemu kadrowego zamiast imion i nazwisk w komunikacji między systemami, przekazywanie
tylko pól potrzebnych odbiorcy.

## 4. Bezpieczeństwo przed wdrożeniem

Prototyp działa bez logowania i przechowuje oceny w przeglądarce (dane nie opuszczają komputera użytkownika poza
anonimowymi zapytaniami do AI). Przed wdrożeniem w urzędzie potrzebne są:

**Uwierzytelnianie**
- użytkownicy: logowanie przez system tożsamości urzędu (SSO, np. OpenID Connect / SAML) – bez lokalnych haseł;
- systemy (API): wzajemne uwierzytelnianie certyfikatami (mTLS) albo OAuth 2.0 *client credentials*; osobne
  poświadczenia dla każdego systemu, krótkotrwałe tokeny, rotacja kluczy.

**Autoryzacja**
- role: przełożony – tylko oceny swoich podwładnych; HR – procesy w urzędzie; oceniany – wgląd we własną ocenę;
- uprawnienia sprawdzane na serwerze przy każdym żądaniu; zasada najmniejszych uprawnień (także dla adapterów);
- role demonstracyjne prototypu i macierz uprawnień: [`docs/ROLE.md`](ROLE.md).

**Szyfrowanie**
- cała komunikacja po HTTPS (TLS 1.2+, HSTS);
- szyfrowanie danych w spoczynku (baza, kopie zapasowe);
- plik eksportu przekazywany tylko kanałem szyfrowanym (API, EZD) – nie jako załącznik e-mail; w kolejnej wersji
  formatu można dodać podpis dokumentu (np. JWS), żeby odbiorca sprawdził integralność.

**Logi i audyt**
- dziennik zdarzeń: kto i kiedy otworzył, zmienił, sporządził i wyeksportował ocenę;
- w logach aplikacyjnych bez treści ocen i bez danych osobowych (tylko identyfikatory);
- okres przechowywania logów zgodny z polityką bezpieczeństwa urzędu.

**Minimalizacja danych**
- do AI tylko stanowisko, kryteria i obserwacje – bez imion i nazwisk (już w prototypie: walidacja i anonimizacja
  po stronie serwera);
- eksport tylko pól arkusza – bez notatek z rozmowy i przypomnień HR (już w prototypie);
- docelowo model AI w infrastrukturze urzędu albo u dostawcy z umową powierzenia przetwarzania i bez trenowania na
  danych urzędu;
- ocena skutków dla ochrony danych (DPIA) i okres przechowywania ocen – do ustalenia z inspektorem ochrony danych
  i komórką kadr.

**Ochrona API**
- walidacja każdego żądania (zod – już w prototypie), limity rozmiaru treści;
- limity liczby zapytań (rate limiting) na użytkownika i system;
- CORS tylko dla domen urzędu, nagłówki bezpieczeństwa (m.in. Content-Security-Policy);
- testy penetracyjne i regularny przegląd zależności przed uruchomieniem produkcyjnym.
