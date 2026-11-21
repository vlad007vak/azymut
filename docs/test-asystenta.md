# Zestaw testowy – asystent formalny (`/asystent`)

Pytania, jakie może zadać jury, z oczekiwaną odpowiedzią i źródłem w bazie wiedzy.
Baza: rozporządzenie o pierwszej ocenie (Dz.U. 2015 poz. 1144), rozporządzenie o ocenach okresowych
(Dz.U. 2016 poz. 470), poradniki KPRM „Pierwsza ocena w służbie cywilnej” i „Oceny okresowe w służbie cywilnej” (2016),
model kompetencji organizatora.

## Jak testować

**Ręcznie (Diana):** otwórz `/asystent`, wpisz pytanie z tabeli i sprawdź:
1. odpowiedź zawiera fakty z kolumny „Oczekiwana odpowiedź” (pogrubione = muszą wystąpić),
2. pod odpowiedzią jest źródło z kolumny „Źródło” – po kliknięciu widać dokument, miejsce i dosłowny cytat,
3. pytania 18–19 (spoza bazy) kończą się żółtym komunikatem „Brak informacji w bazie wiedzy” – bez zmyślonej odpowiedzi,
4. odpowiedź pojawia się zwykle w < 5 s; w trakcie widać „Szukam w bazie wiedzy…”.

**Automatycznie:** przy działającej aplikacji
```bash
node scripts/baza-wiedzy/test-asystenta.mjs                     # lokalnie (npm run dev)
node scripts/baza-wiedzy/test-asystenta.mjs https://<preview>.vercel.app
```
Skrypt robi 4 s przerwy między pytaniami (darmowe limity AI) i wypisuje ✓/✗ dla każdego wiersza.

## Pytania

| Nr | Ścieżka | Pytanie | Oczekiwana odpowiedź | Źródło |
|---|---|---|---|---|
| 1 | pierwsza | Kiedy przeprowadza się rozmowę wstępną z nowym pracownikiem? | W terminie **21 dni** od dnia nawiązania stosunku pracy (przy zastępstwie – od ustalenia, że pracownik podlega pierwszej ocenie); prowadzi ją bezpośredni przełożony. | Rozporządzenie 2015 `§ 3`, poradnik „Pierwsza ocena” `s. 19` |
| 2 | pierwsza | Jakie są warunki pozytywnej pierwszej oceny? | Zaliczenie **egzamin**u ze służby przygotowawczej, złożenie **sprawozdani**a w wyznaczonym terminie, najwyżej jedna ocena cząstkowa w wysokości 3 punktów, ocena łączna nie niższa niż **5 punktów**. | Rozporządzenie 2015 `§ 10` |
| 3 | pierwsza | Jaka jest skala ocen w pierwszej ocenie? | **3 punkty** – poniżej oczekiwań, 5 punktów – na poziomie oczekiwań, **7 punktów** – powyżej oczekiwań. | Rozporządzenie 2015 `§ 9` |
| 4 | pierwsza | Jaki okres obejmuje sprawozdanie nowego pracownika? | Przepracowany okres nie krótszy niż **7 miesięcy**. | Rozporządzenie 2015 `§ 6`, poradnik `s. 22` |
| 5 | pierwsza | Jakie elementy ocenia się w pierwszej ocenie? | **Rzetelnoś**ć, **wykorzystywani**e wiedzy i doskonalenie zawodowe, **organizacj**a pracy i orientacja na osiąganie celów, **komunikacj**a, **współprac**a; pod uwagę bierze się też wynik egzaminu ze służby przygotowawczej i sprawozdanie. | Rozporządzenie 2015 `§ 2` lub `zał. nr 1` |
| 6 | pierwsza | Czy negatywną pierwszą ocenę trzeba uzasadnić? | Tak – przy negatywnej pierwszej ocenie bezpośredni przełożony sporządza **uzasadnienie**; przy pozytywnej może je sporządzić. | Rozporządzenie 2015 `§ 10`, poradnik `s. 32` |
| 7 | pierwsza | Kiedy powinien przypadać termin na złożenie sprawozdania? | Po upływie **8 miesięcy** od dnia nawiązania stosunku pracy, tak aby pierwsza ocena mogła zostać dokonana w terminie z ustawy. | Rozporządzenie 2015 `§ 4`, poradnik `s. 8` |
| 8 | okresowa | Ile kryteriów dodatkowych można wybrać w ocenie okresowej? | Nie więcej niż **3 kryteria** dodatkowe, najistotniejsze ze względu na obowiązki z opisu stanowiska pracy. | Rozporządzenie 2016 `§ 5`, poradnik „Oceny okresowe” `s. 21` |
| 9 | okresowa | Jakie kryteria obowiązkowe ma arkusz C? | **Wykorzystywani**e wiedzy i doskonalenie zawodowe, **rzetelnoś**ć, organizacja pracy i orientacja na osiąganie celów, **współprac**a, **komunikacj**a. | Rozporządzenie 2016 `§ 4` |
| 10 | okresowa | Kiedy ocena okresowa jest negatywna? | Gdy ogólny poziom spełniania kryteriów jest **poniżej oczekiwań** albo znacznie poniżej oczekiwań, a także gdy choć jedna ocena cząstkowa jest na poziomie **znacznie poniżej oczekiwań**. | Rozporządzenie 2016 `§ 11` |
| 11 | okresowa | Jaka jest skala ocen cząstkowych w ocenie okresowej? | **1 punkt** – znacznie poniżej, 3 – poniżej, 5 – na poziomie, 7 – powyżej, **9 punktów** – znacznie powyżej oczekiwań. | Rozporządzenie 2016 `§ 11` |
| 12 | okresowa | Jak pracownik może odwołać się od oceny okresowej? | Wnosi **sprzeciw** do **dyrektora generalnego** urzędu w terminie **7 dni** od dnia zapoznania się z oceną; sprzeciw rozpatruje się w 14 dni. | Poradnik „Oceny okresowe” `s. 32` |
| 13 | okresowa | Co ile miesięcy sporządza się ocenę okresową? | Co **24 miesiące** – od dnia sporządzenia poprzedniej oceny albo od zatrudnienia na czas nieokreślony. | Poradnik „Oceny okresowe” `s. 8` lub `s. 10` |
| 14 | okresowa | W jakim terminie trzeba ustalić z pracownikiem kryteria oceny okresowej? | W ciągu **30 dni** od sporządzenia poprzedniej oceny albo od zatrudnienia na czas nieokreślony; 7 dni od sporządzenia oceny negatywnej. | Rozporządzenie 2016 `§ 7`, poradnik `s. 20` |
| 15 | okresowa | Kiedy sporządza się kolejną ocenę po ocenie negatywnej? | Po upływie **6 miesięcy** od dnia zapoznania się z negatywną oceną. | Poradnik „Oceny okresowe” `s. 13` lub `s. 34` |
| 16 | okresowa | Na którym arkuszu ocenia się naczelnika wydziału, który kieruje pracownikami? | Na arkuszu **B** – stanowisko polegające na bezpośrednim **kierowaniu pracownikami**. | Rozporządzenie 2016 `§ 3`, poradnik `s. 19` |
| 17 | – | Jakie wskaźniki obejmuje kompetencja współpraca? | M.in. **włączanie się w działania** realizowane razem z innymi, dbanie o **przepływ informacji**, o dobrą atmosferę, dostrzeganie wkładu pracy innych, branie pod uwagę zdania innych, dzielenie się wiedzą. | Model kompetencji `Współpraca` lub rozporządzenie `zał. nr 1` |
| 18 | – | Ile wynosi dodatek za wysługę lat w służbie cywilnej? | **brak informacji** – baza nie obejmuje wynagrodzeń. | – |
| 19 | – | Ile dni urlopu wypoczynkowego przysługuje urzędnikowi? | **brak informacji** – baza nie obejmuje urlopów. | – |

## Dodatkowo do sprawdzenia w UI
- Pytanie z imieniem i nazwiskiem (np. „Jak ocenić Annę Kowalczyk, która się spóźnia?”) – pod odpowiedzią informacja,
  że imiona i nazwiska usunięto przed wysłaniem do AI.
- Dopytanie bez kontekstu: po pytaniu 3 wpisz „A w ocenie okresowej?” – odpowiedź o skali 1–9 punktów.
- Pod polem pytania zawsze widać: „Asystent ma charakter pomocniczy – decyzję podejmuje przełożony.”
- Błąd sieci / limit AI → czerwony toast po polsku, pytanie wraca do pola.
