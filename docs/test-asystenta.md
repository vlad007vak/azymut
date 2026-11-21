# Zestaw testowy – asystent formalny (`/asystent`)

Pytania, jakie może zadać jury, z oczekiwaną odpowiedzią i źródłem w bazie wiedzy.
Baza: ustawa o służbie cywilnej (t.j. Dz.U. 2026 poz. 590) – art. 38 i 81–83, rozporządzenie o pierwszej ocenie
(Dz.U. 2015 poz. 1144), rozporządzenie o ocenach okresowych (Dz.U. 2016 poz. 470), poradniki KPRM „Pierwsza ocena
w służbie cywilnej” i „Oceny okresowe w służbie cywilnej” (2016), model kompetencji organizatora oraz przykładowa
baza pytań i odpowiedzi (`src/data/baza-wiedzy/pytania-odpowiedzi.json`, opis: `docs/BAZA-WIEDZY.md`).

## Jak testować

**Ręcznie (Diana):** otwórz `/asystent`, wpisz pytanie z tabeli i sprawdź:
1. odpowiedź zawiera fakty z kolumny „Oczekiwana odpowiedź” (pogrubione = muszą wystąpić),
2. pod odpowiedzią jest źródło z kolumny „Źródło” – po kliknięciu widać dokument, miejsce i dosłowny cytat,
3. pytania 18, 19, 35 i 58–62 (spoza bazy) kończą się żółtym komunikatem „Brak informacji w bazie wiedzy” – bez zmyślonej odpowiedzi,
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
| 25 | okresowa | W jakim terminie i do kogo można wnieść sprzeciw od oceny okresowej? | W terminie **7 dni** od dnia zapoznania się z oceną, do **dyrektora generalnego** urzędu. | Ustawa `art. 83 ust. 1`, poradnik „Oceny okresowe” `s. 32` |
| 26 | okresowa | Kto decyduje o sprzeciwie od oceny okresowej i ile ma na to czasu? | **Dyrektor** generalny urzędu; sprzeciw rozpatruje się w terminie **14 dni** od dnia wniesienia. | Ustawa `art. 83`, poradnik „Oceny okresowe” `s. 32` |
| 27 | pierwsza | Ile punktów trzeba zdobyć, żeby pierwsza ocena była pozytywna? | Ocena łączna nie niższa niż **5 punktów** (najwyżej jedna ocena cząstkowa w wysokości 3 punktów, zaliczony egzamin, złożone sprawozdanie). | Rozporządzenie 2015 `§ 10` |
| 28 | okresowa | Jak często ocenia się urzędnika w służbie cywilnej? | Co **24 miesi**ące – od dnia sporządzenia poprzedniej oceny albo od zatrudnienia na czas nieokreślony. | Ustawa `art. 81 ust. 4`, poradnik „Oceny okresowe” `s. 8` lub `s. 10` |
| 29 | okresowa | Po jakim czasie od negatywnej oceny ocenia się pracownika ponownie? | Po upływie **6 miesi**ęcy od dnia zapoznania się z negatywną oceną. | Ustawa `art. 81 ust. 9`, poradnik „Oceny okresowe” `s. 13` lub `s. 34` |
| 30 | okresowa | Ile czasu ma przełożony na ustalenie kryteriów po zatrudnieniu pracownika na czas nieokreślony? | **30 dni** od dnia zatrudnienia na czas nieokreślony (albo od sporządzenia poprzedniej oceny). | Rozporządzenie 2016 `§ 7`, poradnik `s. 20` |
| 31 | pierwsza | Kiedy odbywa się rozmowa oceniająca z nowym pracownikiem? | **Niezwłocznie** po złożeniu **sprawozdani**a albo po upływie terminu wyznaczonego na jego złożenie. | Baza Q&A `qa-001` albo rozporządzenie 2015 `§ 8` |
| 32 | okresowa | Kiedy mogę złożyć wniosek o kolejny stopień służbowy dla urzędnika? | Przy ocenie **pozytywn**ej – umotywowany wniosek w części **III** arkusza. | Baza Q&A `qa-009` albo rozporządzenie 2016 `§ 11` (ust. 5) |
| 33 | okresowa | Co się dzieje z oryginałem arkusza oceny okresowej? | Oryginał włącza się do **akt osobowych** ocenianego, a **kopi**ę oceniający doręcza ocenianemu. | Baza Q&A `qa-010` albo rozporządzenie 2016 `§ 12` |
| 34 | okresowa | Czy po zmianie stanowiska pracownik musi mieć nową ocenę okresową? | Tak, gdy zmiana wiąże się z istotną zmianą zakresu obowiązków, a od ostatniej oceny minęło ponad **6 miesi**ęcy; ocenę sporządza się nie wcześniej niż 7 dni przed zmianą i nie później niż **30 dni** od niej. | Baza Q&A `qa-011` albo ustawa `art. 81 ust. 6` |
| 35 | – | Czy urzędnik może pracować zdalnie? | **brak informacji** – baza nie obejmuje pracy zdalnej. | – |
| 36 | – | Co właściwie nowy pracownik ma opisać w sprawozdaniu? | Zadania z opisu stanowiska (i inne istotne), **problem**y i sposób ich rozwiązania, zdobyte nowe **umiejętności** i wiedzę, **wnioski** dotyczące usprawnienia wykonywania zadań. | Rozporządzenie 2015 `§ 6`, poradnik „Pierwsza ocena” `s. 22` |
| 37 | – | A co jeśli nowy pracownik był długo na L4 i nie zdąży oddać sprawozdania w terminie? | Przełożony wyznacza **nowy termin**, przedłużając dotychczasowy o okres usprawiedliwionej nieobecności, i niezwłocznie zawiadamia ocenianego pisemnie (kopia pisma do arkusza). | Rozporządzenie 2015 `§ 5`, poradnik „Pierwsza ocena” `s. 10`, baza Q&A `qa-013` |
| 38 | – | Czy nowy pracownik musi coś podpisać po rozmowie wstępnej? | Tak – potwierdza **podpis**em przeprowadzenie rozmowy wstępnej i zapoznanie się z terminem złożenia sprawozdania; dostaje też kopię części I i II arkusza. | Rozporządzenie 2015 `§ 4` |
| 39 | – | jak sie liczy ocene laczna w pierwszej ocenie? | Ocena łączna to **średni**a **arytmetyczn**a z ocen cząstkowych za pięć elementów oceny. | Rozporządzenie 2015 `§ 7` |
| 40 | – | Czy absolwent KSAP musi zdać egzamin ze służby przygotowawczej, żeby dostać pozytywną pierwszą ocenę? | Nie – warunku zaliczenia **egzamin**u nie stosuje się do absolwenta Krajowej Szkoły Administracji Publicznej, który nie złożył wniosku o mianowanie (ani do zatrudnionego na zastępstwo i na wyższym stanowisku). | Rozporządzenie 2015 `§ 10` |
| 41 | – | Kto oprócz bezpośredniego przełożonego ma wpływ na pierwszą ocenę? | Pierwszej oceny dokonuje bezpośredni przełożony w porozumieniu z **kierując**ym komórką organizacyjną; kierujący komórką może też uczestniczyć w rozmowie oceniającej. | Ustawa `art. 38 ust. 2`, rozporządzenie 2015 `§ 8`, poradnik „Pierwsza ocena” `s. 26` |
| 42 | – | Co pracownik dostaje po pierwszej ocenie i gdzie ląduje oryginał arkusza? | Oceniany dostaje **kopi**ę arkusza; oryginał wraz ze sprawozdaniem i pismami o zmianie terminów włącza się do **akt osobowych**. | Rozporządzenie 2015 `§ 11` |
| 43 | – | Zatrudniam kogoś na zastępstwo – od kiedy liczę 21 dni na rozmowę wstępną? | Od dnia **ustaleni**a przez strony stosunku pracy, że oceniany będzie podlegać pierwszej ocenie. | Rozporządzenie 2015 `§ 3` |
| 44 | – | O czym mam porozmawiać z nowym pracownikiem na rozmowie wstępnej? | Zapoznać ze sposobem dokonywania oceny, omówić główne **obowiązki** z opisu stanowiska i oczekiwania (postawa, zaangażowanie, relacje, terminowość), wyznaczyć termin złożenia **sprawozdani**a. | Rozporządzenie 2015 `§ 3` |
| 45 | – | A co jeśli pracownik w ogóle nie odda sprawozdania – może dostać pozytywną ocenę? | Nie – złożenie sprawozdania w wyznaczonym terminie jest warunkiem pozytywnej oceny, więc przyznaje się ocenę **negatywn**ą; rozmowę oceniającą prowadzi się po upływie terminu na złożenie sprawozdania. | Rozporządzenie 2015 `§ 10` lub `§ 8` |
| 46 | – | Jakie kryteria obowiązkowe są w arkuszu B dla kierownika zespołu? | **Zarządzanie ludźmi**, **podejmowanie decyzji** i odpowiedzialność, organizacja pracy i orientacja na osiąganie celów, współpraca, komunikacja. | Rozporządzenie 2016 `§ 4` |
| 47 | – | Co poza punktami musi się znaleźć w ocenie okresowej? Chodzi mi o rozwój pracownika | Wnioski dotyczące **indywidualn**ego programu rozwoju zawodowego (IPRZ), wpisywane do arkusza. | Ustawa `art. 81 ust. 5`, rozporządzenie 2016 `§ 11` |
| 48 | – | W trakcie okresu oceny zmienił się naczelnik – według jakich kryteriów oceni pracownika nowy szef? | Ocenę sporządza się na podstawie kryteriów wybranych **wcześniej**; zmiana na stanowisku oceniającego pozwala też zmienić termin oceny. | Rozporządzenie 2016 `§ 9`, ustawa `art. 81 ust. 8`, poradnik „Oceny okresowe” `s. 17`, baza Q&A `qa-014` |
| 49 | – | Idę na dłuższe zwolnienie – czy mogę przesunąć termin oceny okresowej pracownika? | Tak – oceniający może zmienić termin przy przewidywanej dłuższej usprawiedliwionej **nieobecnoś**ci oceniającego; o nowym terminie niezwłocznie zawiadamia ocenianego pisemnie. | Ustawa `art. 81 ust. 8`, rozporządzenie 2016 `§ 8` |
| 50 | – | Pracownik ma z jednego kryterium 1 pkt, ale średnia wyszła 5,4 – to ocena pozytywna czy negatywna? | **Negatywn**a – co najmniej jedna ocena cząstkowa na poziomie znacznie poniżej oczekiwań (1 pkt) daje ocenę negatywną niezależnie od średniej. | Rozporządzenie 2016 `§ 11` |
| 51 | – | Średnia z ocen cząstkowych w ocenie okresowej wyszła 6,5 – jaki to ogólny poziom? | **Powyżej oczekiwań** (powyżej 6 do 8 punktów). | Rozporządzenie 2016 `§ 11` |
| 52 | – | czy pracownik na umowie na czas okreslony tez podlega ocenie okresowej? | Nie – ocenie okresowej podlega urzędnik oraz pracownik zatrudniony na umowę na czas **nieokreślon**y. | Ustawa `art. 81 ust. 1` |
| 53 | – | Czy pracownik musi podpisać ustalone kryteria oceny okresowej i co dostaje do ręki? | Tak – potwierdza **podpis**em rozmowę i zapoznanie się z kryteriami i terminem oceny; oryginał arkusza trafia do akt osobowych, a oceniany dostaje **kopi**ę części I arkusza. | Rozporządzenie 2016 `§ 6` |
| 54 | – | Dyrektor uwzględnił sprzeciw pracownika – co się dzieje z oceną? | Ocenę zmienia się albo sporządza **po raz drugi**; od oceny sporządzonej po raz drugi znów przysługuje sprzeciw. | Ustawa `art. 83 ust. 4` |
| 55 | – | Czy każdemu pracownikowi muszę wyznaczać cele na okres oceny? | Nie – cele wyznacza się, jeżeli ich określenie jest **uzasadnion**e charakterem obowiązków z opisu stanowiska. | Rozporządzenie 2016 `§ 5` |
| 56 | – | A co jeśli 3 miesiące po ustaleniu kryteriów pracownik przeszedł na stanowisko z innymi obowiązkami? | W ciągu **30 dni** od zmiany stanowiska ponownie przeprowadza się rozmowę i ustala kryteria; termin sporządzenia oceny nie ulega zmianie. | Rozporządzenie 2016 `§ 9` |
| 57 | – | Czy ocena okresowa dotyczy tylko obowiązków z opisu stanowiska? I czy musi być na piśmie? | Tak – dotyczy wykonywania obowiązków z **opisu** zajmowanego stanowiska; sporządza się ją **na piśmie** i niezwłocznie zapoznaje z nią ocenionego. | Ustawa `art. 81 ust. 3` |
| 58 | – | Ile wynosi nagroda jubileuszowa za 20 lat pracy w urzędzie? | **brak informacji** – baza nie obejmuje nagród jubileuszowych. | – |
| 59 | – | Jaki jest okres wypowiedzenia dla urzędnika mianowanego? | **brak informacji** – baza nie obejmuje rozwiązywania stosunku pracy. | – |
| 60 | – | Jak rozliczyć delegację służbową pracownika? | **brak informacji** – baza nie obejmuje podróży służbowych. | – |
| 61 | – | Ile płaci się za nadgodziny w urzędzie? | **brak informacji** – baza nie obejmuje wynagrodzeń. | – |
| 62 | – | Jaka będzie jutro pogoda w Bydgoszczy? | **brak informacji** – pytanie spoza tematu. | – |

Wiersze 31–34 trafiają w pozycje bazy pytań i odpowiedzi (zadanie #40), zadane innymi słowami niż w bazie –
w źródłach powinna być „Baza pytań i odpowiedzi – …” z podanym identyfikatorem albo przepis, na którym pozycja się opiera
(model często woli cytować wiążący paragraf – to też poprawne źródło); wiersz 35 jest spoza bazy.

Wiersze 25–30 to te same fakty co wyżej, ale sformułowane innymi słowami (jak pyta jury) – sprawdzają, że asystent
nie odpowiada fałszywym „brak informacji” (zgłoszenie #26).

Wiersze 36–62 (zadanie #61) to pytania „jak jury”: potocznie, bez polskich znaków, dwa pytania w jednym, „a co jeśli…”.
Mają ścieżkę „–”, więc skrypt wysyła je **bez parametru `rodzaj`** – dokładnie tak jak strona `/asystent`.
36–45 dotyczą pierwszej oceny, 46–57 oceny okresowej, 58–62 są spoza bazy.

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
