# Baza wiedzy asystenta formalnego

Asystent formalny (`/asystent`, `POST /api/asystent`) odpowiada **wyłącznie** na podstawie bazy wiedzy
i przy każdej odpowiedzi pokazuje źródło z dosłownym cytatem. Ten dokument opisuje, z czego składa się baza,
jak urząd może podmienić **bazę pytań i odpowiedzi** bez programowania i jak przebudować bazę po zmianie przepisów.

## Z czego składa się baza

| Część | Plik w repozytorium | Skąd się bierze | Wielkość (prototyp) |
|---|---|---|---|
| Ustawa o służbie cywilnej (t.j. Dz.U. 2026 poz. 590) – art. 38 i 81–83; rozporządzenia o pierwszej ocenie (Dz.U. 2015 poz. 1144) i o ocenach okresowych (Dz.U. 2016 poz. 470); poradniki KPRM „Pierwsza ocena…” i „Oceny okresowe…” (2016) | `src/data/baza-wiedzy/fragmenty.json` | skrypt `scripts/baza-wiedzy/zbuduj.mjs` z PDF | 200 fragmentów |
| Model kompetencji (materiał organizatora) | `src/data/model-kompetencji.json` | dokładany w locie przez `src/features/asystent/baza.ts` | 64 fragmenty |
| **Baza pytań i odpowiedzi (Q&A)** | `src/data/baza-wiedzy/pytania-odpowiedzi.json` | plik przygotowany przez urząd (JSON albo CSV z Excela) | 15 pozycji przykładowych |

Przykładowa baza Q&A zespołu powstała **wyłącznie z faktów, które już są w bazie** (przepisy, poradniki KPRM,
model kompetencji) – przy każdej pozycji w polu `zrodlo` jest artykuł, paragraf albo strona poradnika.

### Jak asystent korzysta z bazy Q&A
- Przepisy (ustawa, rozporządzenia) są **źródłem wiążącym**. Pozycje Q&A mają osobny indeks i są dokładane
  do kontekstu **obok** przepisów (najwyżej 2), nigdy zamiast nich – nie zmieniają wyboru fragmentów przepisów.
- Pozycja Q&A trafia do kontekstu, gdy pokrywa co najmniej 60% istotnych słów pytania. Pozycja oznaczona
  jako `pierwsza` nie jest używana przy pytaniu o ocenę okresową (i odwrotnie); `wspolne` – przy obu.
- Gdy pozycja Q&A odpowiada na pytanie, model cytuje ją i – jeśli ten sam fakt jest w przepisie – także przepis.
- W źródle odpowiedzi widać: „Baza pytań i odpowiedzi – *nazwa bazy*”, identyfikator i treść pytania oraz
  podstawę z pola `zrodlo`; po rozwinięciu – dosłowny cytat z odpowiedzi.
- Na stronie `/asystent` baza Q&A jest na liście dokumentów bazy wiedzy razem z liczbą pozycji.

## Format bazy pytań i odpowiedzi

Plik `src/data/baza-wiedzy/pytania-odpowiedzi.json` (UTF-8):

```json
{
  "nazwa": "baza Ministerstwa Cyfryzacji 2026",
  "wersja": 1,
  "pozycje": [
    {
      "id": "qa-001",
      "pytanie": "Kiedy w pierwszej ocenie przeprowadza się rozmowę oceniającą?",
      "odpowiedz": "Bezpośredni przełożony przeprowadza z ocenianym rozmowę oceniającą niezwłocznie po złożeniu sprawozdania …",
      "zrodlo": "§ 8 ust. 1 rozporządzenia w sprawie pierwszej oceny (Dz.U. 2015 poz. 1144)",
      "rodzaj": "pierwsza"
    }
  ]
}
```

| Pole | Wymagane | Zasady |
|---|---|---|
| `nazwa` | tak | do 150 znaków; w źródle odpowiedzi widać „Baza pytań i odpowiedzi – *nazwa*” |
| `wersja` | tak | zawsze `1` (format pliku) |
| `pozycje` | tak | od 1 do 5000 pozycji |
| `id` | tak | unikalny (bez względu na wielkość liter), litery, cyfry, `.`, `-`, `_`, np. `qa-001`, `MC-17` |
| `pytanie` | tak | do 500 znaków – tak, jak pytają przełożeni |
| `odpowiedz` | tak | do 3000 znaków – z tej treści asystent cytuje |
| `zrodlo` | tak | do 300 znaków – podstawa: artykuł / paragraf / strona poradnika |
| `rodzaj` | tak | `pierwsza`, `okresowa` albo `wspolne` |

Dobre pozycje: jedno pytanie = jedna sprawa, odpowiedź oparta na przepisach, w `zrodlo` dokładne miejsce.
Baza Q&A **uzupełnia** przepisy – nie powinna im przeczyć (aplikacja sprawdza format, a nie treść merytoryczną).

## Jak podmienić bazę pytań i odpowiedzi

Wymagania: repozytorium, Node.js (jak do uruchomienia aplikacji). Polecenia uruchamiamy w katalogu repozytorium.

### A. Z arkusza Excel (zalecane)
1. Arkusz z kolumnami (pierwszy wiersz = nagłówki): `pytanie`, `odpowiedz`, `zrodlo`, `rodzaj`
   (opcjonalnie `id`; polskie znaki w nagłówkach – „odpowiedź”, „źródło” – są dozwolone).
   `rodzaj` może być też zapisany jako „Pierwsza ocena”, „Ocena okresowa”, „wspólne”; pusta komórka = `wspolne`.
   Bez kolumny `id` pozycje dostaną numery `qa-001`, `qa-002`…
2. W Excelu: **Plik → Zapisz jako → „CSV UTF-8 (rozdzielany przecinkami)”** (separator `;` albo `,`).
3. Import (zastępuje obecną bazę – tylko gdy plik jest bezbłędny):
   ```bash
   node scripts/baza-wiedzy/qa-z-csv.mjs pytania.csv --nazwa "baza Ministerstwa Cyfryzacji 2026"
   ```
   Błędy są wypisywane po polsku z numerem wiersza CSV, np.
   `wiersz 7 pliku CSV: pole „rodzaj” musi mieć wartość: pierwsza, okresowa albo wspolne`.
4. Sprawdzenie i wdrożenie: `npm run build` (lokalnie), potem commit i wdrożenie jak każdej zmiany
   (na Vercelu – push / PR; po wdrożeniu nowa baza działa od razu).

### B. Poprawki w obecnej bazie
```bash
node scripts/baza-wiedzy/qa-z-csv.mjs --do-csv pytania.csv        # obecna baza → CSV do Excela
# … edycja w Excelu, zapis jako „CSV UTF-8” …
node scripts/baza-wiedzy/qa-z-csv.mjs pytania.csv --nazwa "…"     # z powrotem do JSON
```
Eksport i ponowny import bez zmian dają identyczny plik.

### C. Ręczna edycja JSON
Po każdej zmianie: `node scripts/baza-wiedzy/qa-z-csv.mjs --sprawdz` – wskaże błędy po polsku,
także błąd składni JSON (wiersz i kolumna, np. brakujący przecinek).

### Co się dzieje przy błędnym pliku
- **Błędna treść** (puste pole, zły `rodzaj`, powtórzone `id`…) – `npm run build` kończy się błędem:
  ```
  Błędny plik bazy pytań i odpowiedzi (src/data/baza-wiedzy/pytania-odpowiedzi.json):
    – pozycja nr 4 (id „qa-004”): pole „rodzaj” musi mieć wartość: pierwsza, okresowa albo wspolne
    – pozycja nr 5 (id „qa-005”): pole „zrodlo” nie może być puste
  Popraw plik według docs/BAZA-WIEDZY.md (…) i uruchom build ponownie.
  ```
  Asystent nie zostanie wdrożony na złych danych.
- **Błąd składni JSON** (np. przecinek na końcu listy) – build zatrzymuje się na etapie kompilacji
  komunikatem narzędzia Next.js (po angielsku, z plikiem, wierszem i kolumną, np. `trailing comma at line 11 column 5`).
  Opis po polsku daje `node scripts/baza-wiedzy/qa-z-csv.mjs --sprawdz`. Plik wygenerowany z CSV zawsze ma poprawną składnię.

### Sprawdzenie odpowiedzi asystenta
1. `npm run dev` → `/asystent` → pytanie z nowej bazy (najlepiej sformułowane trochę inaczej).
   W źródłach powinna być „Baza pytań i odpowiedzi – …”.
2. Pytania kontrolne z oczekiwaną odpowiedzią dopisz do `docs/test-asystenta.md` i uruchom
   `node scripts/baza-wiedzy/test-asystenta.mjs` (opis w tym pliku).

## Przebudowa bazy po zmianie przepisów (PDF)

1. Nowe PDF-y do katalogu `materialy` obok repozytorium (nazwy plików jak w tablicy `DOKUMENTY`
   w `scripts/baza-wiedzy/zbuduj.mjs` – tam też nazwa, rodzaj i zakres stron każdego dokumentu).
2. `node scripts/baza-wiedzy/zbuduj.mjs [katalog-z-materiałami]` – wymaga `pdftotext`
   (w Git for Windows: `/ucrt64/bin`; ścieżkę można podać w zmiennej `PDFTOTEXT`). Wynik: `fragmenty.json`.
   Z ustawy brane są tylko art. 38 i 81–83 (pole `artykuly` w `DOKUMENTY`).
3. Model kompetencji: `src/data/model-kompetencji.json` (aplikacja i asystent czytają go bezpośrednio).
4. `node scripts/baza-wiedzy/test-asystenta.mjs` – zestaw z `docs/test-asystenta.md` musi przechodzić;
   przy zmianie liczb (terminy, punkty) popraw oczekiwane odpowiedzi.
5. Zaktualizuj liczbę fragmentów w README i materiałach (liczba jest też na stronie `/asystent`).

## Ograniczenia prototypu
- Podmiana bazy Q&A wymaga nowego buildu i wdrożenia (plik jest częścią aplikacji). Docelowo: wgrywanie
  pliku w panelu administratora, baza danych, wersje i akceptacja treści przed publikacją.
- Aplikacja sprawdza **format** bazy Q&A, nie poprawność merytoryczną – za treść odpowiada urząd.
- Wyszukiwanie po słowach (BM25 + odmiana i synonimy w `src/features/asystent/wyszukiwanie.ts`), bez embeddingów:
  pytanie zadane zupełnie innymi słowami może nie trafić w pozycję Q&A. Synonimy można dopisać w `SYNONIMY`.
- Do odpowiedzi trafiają najwyżej 2 pozycje Q&A; odpowiedzi są zapamiętywane w pamięci serwera do jego restartu.
- Odpowiedzi formułują darmowe modele AI (limity zapytań) – źródło i cytat zawsze trzeba sprawdzić.
