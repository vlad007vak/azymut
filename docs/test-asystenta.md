# Zestaw testowy – asystent formalny (`/asystent`)

Pytania, jakie może zadać jury, z oczekiwaną odpowiedzią i źródłem w bazie wiedzy.
Baza: ustawa o służbie cywilnej (t.j. Dz.U. 2026 poz. 590) – art. 38 i 81–83, rozporządzenie o pierwszej ocenie
(Dz.U. 2015 poz. 1144), rozporządzenie o ocenach okresowych (Dz.U. 2016 poz. 470), poradniki KPRM „Pierwsza ocena
w służbie cywilnej” i „Oceny okresowe w służbie cywilnej” (2016), model kompetencji organizatora.

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
| 7 | pierwsza | Kiedy powinien przypadać termin na złożenie sprawozdania? | Po upływie **8 miesięcy** od dnia nawiązania stosunku pracy, tak aby pierwsza ocena mogła zostać dokonana w terminie z ustawy. | Rozporządzenie 2015 `§ 4`, poradnik `s. 8`, ustawa `art. 38` |
| 8 | okresowa | Ile kryteriów dodatkowych można wybrać w ocenie okresowej? | Nie więcej niż **3 kryteria** dodatkowe, najistotniejsze ze względu na obowiązki z opisu stanowiska pracy. | Rozporządzenie 2016 `§ 5`, poradnik „Oceny okresowe” `s. 21` |
| 9 | okresowa | Jakie kryteria obowiązkowe ma arkusz C? | **Wykorzystywani**e wiedzy i doskonalenie zawodowe, **rzetelnoś**ć, organizacja pracy i orientacja na osiąganie celów, **współprac**a, **komunikacj**a. | Rozporządzenie 2016 `§ 4` |
| 10 | okresowa | Kiedy ocena okresowa jest negatywna? | Gdy ogólny poziom spełniania kryteriów jest **poniżej oczekiwań** albo znacznie poniżej oczekiwań, a także gdy choć jedna ocena cząstkowa jest na poziomie **znacznie poniżej oczekiwań**. | Rozporządzenie 2016 `§ 11` |
| 11 | okresowa | Jaka jest skala ocen cząstkowych w ocenie okresowej? | **1 punkt** – znacznie poniżej, 3 – poniżej, 5 – na poziomie, 7 – powyżej, **9 punktów** – znacznie powyżej oczekiwań. | Rozporządzenie 2016 `§ 11` |
| 12 | okresowa | Jak pracownik może odwołać się od oceny okresowej? | Wnosi **sprzeciw** do **dyrektora generalnego** urzędu w terminie **7 dni** od dnia zapoznania się z oceną; sprzeciw rozpatruje się w 14 dni. | Ustawa `art. 83`, poradnik „Oceny okresowe” `s. 32` |
| 13 | okresowa | Co ile miesięcy sporządza się ocenę okresową? | Co **24 miesiące** – od dnia sporządzenia poprzedniej oceny albo od zatrudnienia na czas nieokreślony. | Ustawa `art. 81 ust. 4`, poradnik „Oceny okresowe” `s. 8` lub `s. 10` |
| 14 | okresowa | W jakim terminie trzeba ustalić z pracownikiem kryteria oceny okresowej? | W ciągu **30 dni** od sporządzenia poprzedniej oceny albo od zatrudnienia na czas nieokreślony; 7 dni od sporządzenia oceny negatywnej. | Rozporządzenie 2016 `§ 7`, poradnik `s. 20` |
| 15 | okresowa | Kiedy sporządza się kolejną ocenę po ocenie negatywnej? | Po upływie **6 miesięcy** od dnia zapoznania się z negatywną oceną. | Ustawa `art. 81 ust. 9`, poradnik „Oceny okresowe” `s. 13` lub `s. 34` |
| 16 | okresowa | Na którym arkuszu ocenia się naczelnika wydziału, który kieruje pracownikami? | Na arkuszu **B** – stanowisko polegające na bezpośrednim **kierowaniu pracownikami**. | Rozporządzenie 2016 `§ 3`, poradnik `s. 19` |
| 17 | – | Jakie wskaźniki obejmuje kompetencja współpraca? | M.in. **włączanie się w działania** realizowane razem z innymi, dbanie o **przepływ informacji**, o dobrą atmosferę, dostrzeganie wkładu pracy innych, branie pod uwagę zdania innych, dzielenie się wiedzą. | Model kompetencji `Współpraca` lub rozporządzenie `zał. nr 1` |
| 18 | – | Ile wynosi dodatek za wysługę lat w służbie cywilnej? | **brak informacji** – baza nie obejmuje wynagrodzeń. | – |
| 19 | – | Ile dni urlopu wypoczynkowego przysługuje urzędnikowi? | **brak informacji** – baza nie obejmuje urlopów. | – |
| 20 | pierwsza | Kiedy najwcześniej i najpóźniej można dokonać pierwszej oceny? | Nie wcześniej niż po upływie **8 miesięcy** od nawiązania stosunku pracy i nie później niż **miesiąc** przed upływem okresu, na który zawarto umowę. | Ustawa `art. 38 ust. 1` |
| 21 | pierwsza | Co dzieje się po pozytywnej pierwszej ocenie? | Kierujący komórką wnioskuje do dyrektora generalnego o zawarcie umowy o pracę **na czas nieokreślony**; po negatywnej – o jej niezawieranie albo rozwiązanie umowy na czas określony. | Ustawa `art. 38 ust. 3` |
| 22 | okresowa | W jakim terminie rozpatruje się sprzeciw od oceny okresowej? | W terminie **14 dni** od dnia wniesienia sprzeciwu. | Ustawa `art. 83 ust. 3` |
| 23 | okresowa | Co może zrobić pracownik, gdy jego sprzeciw od oceny okresowej nie został uwzględniony? | Może odwołać się do **sądu pracy** w terminie 14 dni od doręczenia decyzji. | Ustawa `art. 83 ust. 5` |
| 24 | okresowa | Czy długa nieobecność pracownika wpływa na termin oceny okresowej? | Tak – przy usprawiedliwionej nieobecności dłuższej niż miesiąc termin oceny ulega **przedłuż**eniu o czas tej nieobecności. | Ustawa `art. 81 ust. 7` |

## Dodatkowo do sprawdzenia w UI
- Pytanie z imieniem i nazwiskiem (np. „Jak ocenić Annę Kowalczyk, która się spóźnia?”) – pod odpowiedzią informacja,
  że imiona i nazwiska usunięto przed wysłaniem do AI.
- Dopytanie bez kontekstu: po pytaniu 3 wpisz „A w ocenie okresowej?” – odpowiedź o skali 1–9 punktów.
- Pod polem pytania zawsze widać: „Asystent ma charakter pomocniczy – decyzję podejmuje przełożony.”
- Błąd sieci / limit AI → czerwony toast po polsku, pytanie wraca do pola.

## Kontrola jakości uzasadnienia (`POST /api/jakosc`, zadanie #18)

Komponent `<KontrolaJakosci ocena={ocena} />` w kroku „Decyzja i wynik” kreatora (osadza Vlad). Na demo `o1`:

| Nr | Co zrobić | Oczekiwany wynik |
|---|---|---|
| J1 | W uzasadnieniu wpisz „Pani Kowalczyk pracuje dobrze i jest zaangażowana.” → „Sprawdź uzasadnienie” | Uwaga **Ogólnik** „w uzasadnieniu” z cytatem „pracuje dobrze i jest zaangażowana”; informacja, że imiona i nazwiska zastąpiono „[osoba]” |
| J2 | Usuń wszystkie przykłady przy kryterium „Komunikacja” (krok 2) i sprawdź ponownie | Uwaga **Brak przykładu** przy „Komunikacja” (sprawdzenie automatyczne) |
| J3 | Dla „Rzetelność” wybierz „Znacznie powyżej oczekiwań” (zachowania: na poziomie / poniżej) | Uwaga **Niespójność z poziomem** – poziom wyższy niż wszystkie zaznaczone zachowania |
| J4 | Dopisz „Mimo młodego wieku i małego dziecka w domu…” oraz „Ma trudny charakter.” | **Ryzyko stronniczości** i **Ocena osoby zamiast zachowania** z cytatami |
| J5 | Oryginalne `o1` bez uzasadnienia i wniosków | Zielony komunikat „Nie znaleziono uwag” |
| J6 | Zmień tekst po sprawdzeniu | Żółta informacja „Treść oceny zmieniła się…”, przycisk „Sprawdź ponownie” |

Zawsze: cytat jest dosłownym fragmentem tekstu przełożonego, AI nie zmienia poziomów, widać zastrzeżenie
„AI podpowiada – nie ocenia”. Limit AI → żółty komunikat i tylko sprawdzenia automatyczne (bez błędu).
