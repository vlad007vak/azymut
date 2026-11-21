# Pitch finałowy (etap II) – scenariusz, plan B i ściąga na pytania jury

Etap II (top 5): niedziela **15:15**, **maks. 5 min pitchu + maks. 5 min pytań jury**; punkty z etapu I się nie liczą.
Pitch prowadzi **Andrey**. Demo: https://azymut-bubylda.vercel.app · Slajdy: `docs/PREZENTACJA.md` (numery slajdów poniżej).

Zasada ściągi: odpowiadamy **wyłącznie faktami z repozytorium**. Czego nie ma w repo – „DO USTALENIA z Vladem”,
na scenie: „Tego nie sprawdzaliśmy w prototypie – to element planu wdrożenia”. Nie podajemy kwot, liczby urzędów ani terminów.

---

## 0. Przygotowanie (15 min przed wejściem)

- [ ] Na pendrivie: slajdy w PDF i wideo 2 min (mp4) + zapasowa kopia. Slajdy i wideo pokazujemy z komputera na scenie.
- [ ] Komputer na scenie: zamknąć **wszystkie** okna incognito (w Chrome okna incognito współdzielą dane), otworzyć nowe okno
      incognito z https://azymut-bubylda.vercel.app. Świeże dane demo = Anna Kowalczyk w kroku „Ocena wskaźników”.
      Zły stan danych → Panel HR → „Resetuj dane demo”.
- [ ] Komputer na scenie: sprawdzić szerokość ekranu i okna przeglądarki – **min. 1024 px** (najlepiej ok. 1440 px);
      ukryte zakładki i powiadomienia systemowe.
- [ ] Test AI w **drugiej przeglądarce** (nie w oknie demo): asystent formalny → „Ile kryteriów dodatkowych można wybrać
      w ocenie okresowej?”. Odpowiedź ze źródłem = AI działa. Asystent ma pamięć podręczną po stronie serwera
      (`src/features/asystent/odpowiedz.ts`), więc to samo pytanie na scenie może przyjść szybciej (bez gwarancji – Vercel może użyć innej instancji).
- [ ] W schowku tekst do kroku „Uzasadnienie”: `Pracuje dobrze i jest zaangażowana. Ma trudny charakter.`
- [ ] Slajdy (PDF z pendrive'a) otwarte na komputerze na scenie obok okna demo.
- [ ] Diana: telefon z hotspotem i laptop zapasowy z wideo 2 min gotowe (plan B).

---

## 1. Scenariusz 5:00

Tempo planu: ok. 130 słów/min. Plan kończy się na **4:45** – 15 s rezerwy na odpowiedzi AI i przejścia.
**Pełna ścieżka, której wymaga mentorka MC** (#3, odpowiedzi mentorki): rozpoczęcie procesu, stanowisko i kryteria (0:40) →
ocena wskaźników i sugerowany poziom (1:00) → decyzja przełożonego (2:00) → arkusz (2:45).
Na scenie: **Andrey** mówi, **Vlad** przy komputerze na scenie klika demo według scenariusza, **Diana** – telefon z hotspotem
i laptop zapasowy z wideo.

| Czas | Kto mówi | Na ekranie | Tekst |
|---|---|---|---|
| 0:00–0:20 | Andrey | Slajd 1 → slajd 2 (Problem) | „Dzień dobry, jesteśmy zespół Azymut. Przełożony w służbie cywilnej ocenia swoich pracowników: nowych w pierwszej ocenie, pozostałych co dwa lata. Musi połączyć ustawę, dwa rozporządzenia, formularz i model kompetencji. Łatwo ocenić »na wrażenie«, a różni przełożeni różnie rozumieją te same kryteria.” |
| 0:20–0:40 | Andrey | Slajd 3 (Rozwiązanie) | „Azymut prowadzi przełożonego krok po kroku przez obie ścieżki – zgodnie z rozporządzeniami. Ocena opiera się na obserwowalnych zachowaniach z modelu kompetencji. System podpowiada poziom, pilnuje reguł i przygotowuje arkusz. AI doradza, decyzję podejmuje przełożony. Pokażę to na żywo.” |
| 0:40–1:00 | Andrey | **Demo:** strona główna → blok „Ocena okresowa” → **Anna Kowalczyk** → w pasku kroków **„Stanowisko i kryteria”** (arkusz C „podpowiedź ze stanowiska”) → przewinąć do „2. Kryteria oceny” → w pasku kroków **„Ocena wskaźników”** (nie klikać „Zatwierdź…”) | „To Anna Kowalczyk, radca – dane są fikcyjne. Proces zaczyna się od stanowiska: system podpowiada arkusz C, a z niego wynika pięć kryteriów obowiązkowych. Przełożony dodaje kryterium dodatkowe i dobiera wskaźniki z modelu kompetencji. Teraz – ocena wskaźników.” |
| 1:00–1:30 | Andrey | **Demo:** kryterium **Rzetelność** (średnia 4 pkt, „Poniżej oczekiwań”) → przy wskaźniku „Dotrzymywanie zobowiązań…” klik **„Na poziomie oczekiwań”** → sugestia zmienia się na „Na poziomie oczekiwań (5 pkt)” | „Przełożony nie wpisuje cyfry. Przy każdym wskaźniku wybiera zachowanie, które naprawdę obserwował, i zapisuje przykład. Rzetelność: średnia 4 punkty, czyli »poniżej oczekiwań«. Zmieniam jedno zachowanie – terminy dotrzymane z wyprzedzeniem – i sugestia od razu rośnie do »na poziomie oczekiwań«. Liczy ją prosta reguła oparta na przedziałach z rozporządzenia – nie AI.” |
| 1:30–2:00 | Andrey | **Demo:** „Przejdź do rozmowy oceniającej” → gotowe pytanie **„Ile kryteriów dodatkowych można wybrać w ocenie okresowej?”** → rozwinąć źródło **[1] … § 5** (cytat) | „Przed rozmową można zapytać asystenta formalnego. Odpowiada tylko z bazy wiedzy: ustawy, rozporządzeń, poradników KPRM i modelu kompetencji. Każda odpowiedź ma źródło – tu paragraf 5 – i dosłowny cytat. Cytaty buduje serwer, więc model ich nie zmyśli. Gdy bazie brakuje odpowiedzi, asystent mówi wprost: brak informacji.” |
| 2:00–2:20 | Andrey | **Demo:** „Rozmowa przeprowadzona – przejdź do decyzji” → **„Przyjmij sugestie dla kryteriów bez decyzji”** → „Ocena pozytywna”, średnia 5,33 pkt | „Decyzję podejmuje przełożony: przyjmuje sugestie albo wybiera inny poziom. Wynik liczy kod według paragrafu 11: średnia 5,33 – ocena pozytywna. Jedno kryterium na 1 punkt dałoby ocenę negatywną nawet przy dobrej średniej.” |
| 2:20–2:45 | Andrey | **Demo:** pole „Uzasadnienie oceny” → wkleić tekst ze schowka → **„Sprawdź uzasadnienie”** → uwagi „Ogólnik” i „Ocena osoby zamiast zachowania” | „Teraz typowe uzasadnienie. Kontrola jakości wskazuje ogólnik i ocenę osoby zamiast zachowania – z dosłownym cytatem i podpowiedzią, co poprawić. Wyłapuje też brak przykładów i ryzyko stronniczości. AI nie zmienia ani tekstu, ani poziomów.” |
| 2:45–3:05 | Andrey | **Demo:** **„Sporządź ocenę na piśmie”** → przewinąć do tabeli kryteriów (kolumny „Sugestia systemu” i „Ocena cząstkowa (decyzja)”) | „Gotowy arkusz według wzoru z rozporządzenia – do druku albo PDF. Dwie kolumny: sugestia systemu i decyzja przełożonego. Zawsze widać, kto zdecydował. Ten sam podział trafia do eksportu JSON dla systemu kadrowego i EZD.” |
| 3:05–3:30 | Andrey | Slajd 8 (AI wspiera, nie decyduje) | „AI działa u nas w czterech miejscach: asystent formalny, analiza opisu stanowiska, asystent rozmowy i kontrola uzasadnienia. Wszędzie AI nie liczy punktów i nie ustala poziomu, nie dostaje imion i nazwisk, a serwer sprawdza jego odpowiedzi – odrzuca na przykład uwagi bez dosłownego cytatu.” |
| 3:30–4:05 | Andrey | **Demo:** w nagłówku **„Panel HR”** → strona wyboru roli → **„Wejdź jako HR”** → Anna Kowalczyk: „Ocena sporządzona” → **„Przypomnij”** przy Julii Mazur → „Wyślij przypomnienie” | „Druga perspektywa to HR. Panel jest tylko dla roli HR – w prototypie role są demonstracyjne, docelowo logowanie przez system urzędu. HR zakłada procesy ocen i widzi wszystkie etapy i terminy – także ocenę, którą przed chwilą sporządziliśmy – i wysyła przypomnienia: dziś symulowane, docelowo e-mailem lub przez EZD.” |
| 4:05–4:30 | Andrey | Slajd 9 → slajd 10 | „Architektura jest gotowa na wdrożenie: reguły oceny w jednym module, udokumentowane API w OpenAPI i wymienna warstwa AI – również na model w infrastrukturze urzędu. Następne kroki: logowanie przez system urzędu, baza danych w urzędzie i integracje z EZD oraz systemem kadrowym, na przykład QNT.” |
| 4:30–4:45 | Andrey | Slajd 10 | „Azymut to spójniejsze, lepiej uzasadnione oceny i mniej błędów formalnych. **AI doradza – decyzję podejmuje przełożony.** Dziękujemy, zapraszamy do pytań.” |
| 4:45–5:00 | – | – | **Rezerwa** (wolna odpowiedź AI, przejścia między oknami) |

**Gdy brakuje czasu** (po kontroli jakości – plan 2:45 – zegar pokazuje więcej niż 3:10): pomijamy slajd 8 – jego treść padła już w demo.

### Co ma być na ekranie – sprawdzone na produkcji (21.11.2026, świeże dane demo)

| Krok | Oczekiwany wynik |
|---|---|
| Strona główna | W bloku „Ocena okresowa” → „Oceny w toku”: Anna Kowalczyk, radca · arkusz C · termin 15.12.2026, etap „Ocena wskaźników” |
| Stanowisko i kryteria | Pasek kroków → „Stanowisko i kryteria”: arkusz C z dopiskiem „podpowiedź ze stanowiska”; niżej „2. Kryteria oceny”: 5 kryteriów obowiązkowych, „Wybrano: 1/3”, dodatkowe „Myślenie analityczne”; „3. Dobór wskaźników behawioralnych”. Powrót przez pasek kroków → „Ocena wskaźników”: dane bez zmian (Rzetelność – „Poniżej oczekiwań (3 pkt)”) |
| Rzetelność | Przed zmianą: „Średnia 4 pkt z 2 ocenionych wskaźników”, sugestia „Poniżej oczekiwań (3 pkt)”; po zmianie: „Średnia 5 pkt”, „Na poziomie oczekiwań (5 pkt)” |
| Asystent formalny | „…nie więcej niż 3 kryteria dodatkowe [1]…”; źródła: [1] Rozporządzenie PRM w sprawie ocen okresowych (Dz.U. 2016 poz. 470) – § 5, [2] Poradnik KPRM „Oceny okresowe w służbie cywilnej” (2016) – s. 22; po rozwinięciu [1] dosłowny cytat. Odpowiedź w ok. 1,4 s |
| Decyzja | „Ocena pozytywna”, „Średnia arytmetyczna ocen cząstkowych: 5,33 pkt → … na poziomie oczekiwań”. Bez zmiany przy rzetelności: średnia 5 pkt |
| Reguła (tylko na pytanie jury) | „Komunikacja” → 1 pkt: „Ocena negatywna”, średnia 4,67 pkt, powód „Co najmniej jedna ocena cząstkowa na poziomie »znacznie poniżej oczekiwań«”, uzasadnienie staje się obowiązkowe. Potem przywrócić 5 pkt |
| Kontrola jakości | „Do doprecyzowania: 1 ogólnik, 1 ocena osoby zamiast zachowania”, cytaty „Pracuje dobrze i jest zaangażowana” i „Ma trudny charakter”. Odpowiedź w ok. 1 s |
| Arkusz | Tabela z kolumnami „Sugestia systemu” i „Ocena cząstkowa (decyzja)”, przyciski „Drukuj / zapisz PDF” i „Pobierz JSON” |
| Panel HR | `/hr` bez roli → „Wybierz rolę” z komunikatem „Panel HR jest dostępny tylko dla roli »HR / administrator procesu«” → „Wejdź jako HR” → panel; Anna Kowalczyk: „Ocena sporządzona”; po wysłaniu przypomnienia przy Julii Mazur: „Przypomnij (1)” |
| Pytanie spoza bazy (na pytanie jury) | „Ile dni urlopu wypoczynkowego przysługuje urzędnikowi?” → „Brak informacji w bazie wiedzy” (ok. 0,8 s) |

---

## 2. Plan B

Kto przełącza: **Vlad** (przy komputerze na scenie) decyduje i przełącza, **Andrey mówi dalej** bez przerwy;
**Diana** trzyma telefon z hotspotem i laptop zapasowy z wideo.

| Sytuacja | Po czym poznać | Co robimy |
|---|---|---|
| AI odpowiada wolno | Po 5 s nadal „Szukam w bazie wiedzy…” / brak uwag | Andrey mówi dalej tekst z tabeli. Po 10 s Vlad przechodzi do kroku „Decyzja” (nie potrzebuje AI), Andrey: „Odpowiedź z przykładem źródła jest na slajdzie 7” – pokazujemy slajd 7 na końcu. |
| Limit darmowych modeli | Czerwony komunikat „Asystent AI jest chwilowo niedostępny (limit darmowych modeli). Spróbuj ponownie za chwilę.” | Pokazujemy slajd 7 (zrzut odpowiedzi ze źródłem). Kontrola jakości przy limicie pokazuje żółty komunikat i same sprawdzenia automatyczne – mówimy: „reguły działają także bez AI”. Ocena, sugestia, wynik i arkusz **nie korzystają z AI** – demo idzie dalej. |
| Brak internetu | Strona się nie ładuje | 1) hotspot z telefonu (Diana); 2) jeśli nie działa w 20 s – **wideo 2 min z pendrive'a** na komputerze na scenie (albo z laptopa zapasowego Diany); slajdy PDF działają bez internetu. Andrey komentuje wideo tekstem z tabeli. |
| Zły stan danych demo | Anna nie jest w kroku „Ocena wskaźników” | Nowe okno incognito (po zamknięciu wszystkich) albo Panel HR → „Resetuj dane demo”. |
| Błąd strony / pusty ekran | Biała strona, komunikat błędu | Odświeżyć raz (dane zostają w przeglądarce). Nie pomogło → wideo 2 min. |

---

## 3. Kto odpowiada na co (pytania jury)

Andrey kieruje pytanie do osoby z tabeli („Na to odpowie …”). Gdy nikt nie zna odpowiedzi: „Nie sprawdzaliśmy tego w prototypie – to część planu wdrożenia.”

| Osoba | Tematy | Gdzie sprawdzić przed pitchem |
|---|---|---|
| **Vlad** | architektura, reguły oceny (punkty, wynik, sugerowany poziom), kreator obu ścieżek, wdrożenie i bezpieczeństwo | `src/lib/ocena/zasady.ts`, `README.md` (Architektura, Bezpieczeństwo), `docs/API.md` §4 |
| **Maks** | asystent formalny, baza wiedzy, kontrola jakości uzasadnienia, pytania do mentorów | `docs/test-asystenta.md`, `src/features/asystent`, `src/features/jakosc`, issue #3 |
| **Dima** | analiza opisu stanowiska (OSP), asystent rozmowy, eksport JSON i API | `docs/API.md`, `/dokumentacja-api`, `public/openapi.json` |
| **Andrey** | panel HR (statusy, terminy, przypomnienia), role i uprawnienia, prowadzenie pitchu | `docs/ROLE.md`, `src/features/hr` |
| **Diana** | testy: co i jak sprawdzaliśmy | issue #9 „Raport z testów” |

---

## 4. Ściąga – prawdopodobne pytania jury

### Zgodność merytoryczna (25%)

**1. Skąd pewność, że wynik jest zgodny z rozporządzeniami?** *(Vlad)*
Wszystkie reguły – skale punktowe, przedziały średniej, warunki oceny negatywnej i pierwszej oceny – są w jednym module
i nigdzie indziej. AI nie liczy punktów ani wyniku. Przykład: jedna ocena „znacznie poniżej oczekiwań” daje ocenę negatywną
nawet przy średniej 4,67 (§ 11 ust. 1 pkt 4) – sprawdzone na produkcji. Metodę sugerowanego poziomu, skalę pierwszej oceny
i arkusze B / C potwierdziła mentorka MC (#3, odpowiedzi mentorki) – pytania 2, 3 i 5 poniżej.
Źródło: `src/lib/ocena/zasady.ts` (`wynikOkresowej`, `wynikPierwszej`); `README.md` → „Gdzie AI nie działa”; issue #3.

**2. Jak liczycie sugerowany poziom? Czy wskaźniki mają wagi?** *(Vlad)*
Każde wybrane zachowanie zamieniamy na punkty 1/3/5/7/9, liczymy średnią ze wskaźników z obserwacją i stosujemy przedziały
z § 11 ust. 1 pkt 2; „brak podstaw do oceny” nie wchodzi do średniej. **Potwierdziła to mentorka MC:** wskaźniki mają równe
wagi, sugerowany poziom kompetencji to średnia ze wskaźników, a ostateczny poziom w ocenie okresowej – według § 11 ust. 1
pkt 2 rozporządzenia z 2016 r. (#3, odpowiedzi mentorki).
Źródło: `src/lib/ocena/zasady.ts` → `sugerowanyPoziom`, `poziomZeSredniej`; issue #3 (odpowiedzi mentorki, pyt. 4).

**3. Pierwsza ocena ma skalę 3/5/7 pkt, a model 5 poziomów. Jak to łączycie?** *(Vlad)*
Sugestię „znacznie poniżej” traktujemy jak „poniżej” (3 pkt), „na poziomie oczekiwań” to 5 pkt, a „znacznie powyżej” –
jak „powyżej” (7 pkt). **Mentorka MC potwierdziła** to przełożenie na skalę 3/5/7 (#3, odpowiedzi mentorki).
Źródło: `src/lib/ocena/zasady.ts` → `doSkaliPierwszejOceny`; issue #3 (odpowiedzi mentorki, pyt. 5).

**4. Skąd model kompetencji? Czy to wasz pomysł?** *(Maks)*
To model organizatora zadania: 14 kompetencji, 49 wskaźników behawioralnych, 5 poziomów. Plik JSON generujemy skryptem
z materiału organizatora, więc nie przepisujemy go ręcznie.
Źródło: `src/data/model-kompetencji.json`, `scripts/model-z-xlsx.py`; `README.md` → „Architektura”, „Wykorzystane zasoby”.

**5. Co z arkuszem A?** *(Vlad)*
Prototyp obsługuje arkusze B i C; arkusz wynika z tego, czy pracownik kieruje zespołem. **Mentorka MC potwierdziła:**
arkusza A nie bierzemy pod uwagę – tylko B i C (#3, odpowiedzi mentorki).
Źródło: `src/lib/ocena/zasady.ts` → `arkuszDlaStanowiska`, `KRYTERIA_OBOWIAZKOWE`; issue #3 (odpowiedzi mentorki, pyt. 7).

**6. Co z odwołaniem od oceny?** *(Maks / Andrey)*
Arkusz zawiera pouczenie o sprzeciwie do dyrektora generalnego w terminie 7 dni (art. 83 ustawy), a asystent odpowiada na pytania
o sprzeciw ze źródłem. Sam proces sprzeciwu (rola pracownika i dyrektora generalnego) jest w macierzy uprawnień jako rola docelowa.
Źródło: `docs/test-asystenta.md` (pytania 12, 22, 23); `docs/ROLE.md` → „Macierz uprawnień”.

### Użyteczność i UX (25%)

**7. Czym to się różni od formularza w Wordzie?** *(Andrey)*
Formularz zbiera wynik; Azymut prowadzi przez proces: pilnuje kolejności kroków, przy każdym wskaźniku pokazuje opisy zachowań,
na bieżąco podpowiada poziom, liczy wynik według przepisów, sprawdza uzasadnienie i na końcu tworzy arkusz oraz plik JSON.
Do tego asystent formalny i plan rozmowy w tym samym miejscu.
Źródło: `README.md` → „Rozwiązanie” (punkty 1–9).

**8. A smartfony?** *(Andrey)*
Zadanie mówi, że system nie ma być przeznaczony na smartfony. **Mentorka MC potwierdziła:** aplikacja webowa na komputer,
a blokada telefonu – według uznania zespołu (#3, odpowiedzi mentorki). Projektujemy pod komputer (od 1024 px). Na ekranie
węższym niż 768 px pokazujemy pasek „Azymut jest przeznaczony na komputer” – bez blokady; nawigacja zwija się do menu.
Źródło: `CLAUDE.md` → „Target is the desktop browser”; `src/components/uwaga-komputer.tsx` (PR #39); `src/components/mobile-nav.tsx`;
issue #3 (odpowiedzi mentorki, pyt. 1).

**9. Ile czasu zajmuje przełożonemu jedna ocena?** *(Andrey)*
Nie mierzyliśmy tego z prawdziwymi przełożonymi – **DO USTALENIA z Vladem**. Na scenie: „Nie mamy pomiarów z urzędu; w demo
kompletną ocenę okresową przechodzimy w ok. 2,5 minuty, ale na danych przygotowanych wcześniej.”
Źródło: scenariusz powyżej (demo 0:40–3:05).

**10. Czy aplikacja jest dostępna (WCAG)?** *(Andrey)*
Zasady projektu wymagają etykiet pól, atrybutów `aria-*` i obsługi klawiatury, ale pełnego audytu dostępności nie robiliśmy –
testy dostępności są na liście „przed wdrożeniem produkcyjnym”.
Źródło: `README.md` → „Bezpieczeństwo i ochrona danych” (ostatni punkt); `CLAUDE.md` → „Quality bar”.

### Jakość i użyteczność AI (20%)

**11. Co, gdy AI się pomyli albo zmyśli?** *(Maks)*
Asystent formalny: model wskazuje tylko numery fragmentów bazy, a źródła i cytaty buduje serwer; pytanie spoza bazy kończy się
komunikatem „Brak informacji”. Kontrola jakości: uwagę bez dosłownego cytatu z tekstu przełożonego serwer odrzuca. Analiza OSP:
serwer odrzuca kryteria obowiązkowe, nadmiarowe i nieistniejące wskaźniki. A poziomu i wyniku AI w ogóle nie ustala.
Źródło: `README.md` → „Wykorzystanie sztucznej inteligencji” (tabela).

**12. Jakie dane trafiają do AI? A RODO?** *(Vlad)*
Do AI trafia tylko stanowisko, kryteria i opisy zachowań – bez imion i nazwisk; asystent formalny usuwa je z pytania,
a kontrola jakości zamienia na „[osoba]”. W prototypie oceny są tylko w przeglądarce użytkownika, bez serwerowej bazy danych osobowych.
Przed wdrożeniem: ocena skutków dla ochrony danych (DPIA) z inspektorem ochrony danych.
Źródło: `README.md` → „Bezpieczeństwo i ochrona danych”; `docs/API.md` §4 „Minimalizacja danych”.

**13. Dlaczego darmowe modele i co przy wdrożeniu?** *(Vlad)*
Na hackathonie używamy darmowych API: Groq (`qwen/qwen3.8-27b`) z automatycznym przełączeniem na Google Gemini
(`gemini-3.5-flash-lite`). Warstwa AI jest wymienna – przy wdrożeniu model w infrastrukturze urzędu albo u dostawcy z umową
powierzenia i bez trenowania na danych urzędu. Koszt takiego modelu: **DO USTALENIA z Vladem**.
Źródło: `README.md` → „Wykorzystanie sztucznej inteligencji” (Modele); `docs/API.md` §4; `src/lib/ai/client.ts`.

**14. Co, gdy AI nie działa (limit, awaria)?** *(Maks / Dima)*
Ocena, sugestia poziomu, wynik i arkusz działają bez AI. Asystent pokazuje komunikat o chwilowej niedostępności, analiza OSP zwraca
sam arkusz odczytany regułą, a kontrola jakości wykonuje sprawdzenia automatyczne (brak przykładu, niespójność z poziomem).
Odpowiedzi AI są buforowane, żeby nie zużywać limitów.
Źródło: `docs/API.md` §1 (zasady wspólne, `/api/osp`); `README.md` → tabela AI, wiersz „Kontrola jakości”.

**15. Jak sprawdzaliście poprawność asystenta?** *(Maks / Diana)*
Mamy zestaw 30 pytań z oczekiwanymi odpowiedziami i źródłami – w tym 2 spoza bazy i 6 tych samych faktów zadanych innymi słowami,
tak jak pyta jury (po zgłoszeniu #26) – oraz skrypt, który zadaje je automatycznie.
Przebieg z prawdziwym AI (Groq / Gemini): **30/30**, a pytania spoza bazy nadal kończą się „brak informacji” (Maks, PR #33).
Po dodaniu bazy pytań i odpowiedzi zestaw ma 35 pytań: **34/35** w pełnym przebiegu – jedyny błąd to limit darmowych modeli
(brak odpowiedzi, nie zła odpowiedź), po ponowieniu pytanie zaliczone (Maks, PR #45).
Źródło: `docs/test-asystenta.md`; `scripts/baza-wiedzy/test-asystenta.mjs`; opisy PR #33 i PR #45 (wyniki testu).

**16. Co jest w bazie wiedzy?** *(Maks)*
Pięć dokumentów: ustawa o służbie cywilnej (art. 38 i 81–83), rozporządzenia o pierwszej ocenie i o ocenach okresowych, dwa poradniki
KPRM – razem 200 fragmentów z PDF – oraz model kompetencji (64 fragmenty), czyli **264 fragmenty**. Wyszukiwanie BM25 napisaliśmy sami,
bez zewnętrznych bibliotek. Do tego **baza pytań i odpowiedzi** – 12 przykładowych pozycji z podstawą prawną, którą urząd może
podmienić na własną (plik JSON albo CSV z Excela). O taką możliwość prosiła mentorka MC (#3, odpowiedzi mentorki, pyt. 2).
Źródło: `src/data/baza-wiedzy/fragmenty.json`, `src/data/baza-wiedzy/pytania-odpowiedzi.json`, `src/features/asystent/baza.ts`;
`docs/BAZA-WIEDZY.md`; `README.md` → „Wykorzystane zasoby”.

### Innowacyjność i jakość rozwiązania (20%)

**17. Co tu jest nowego?** *(Vlad)*
Trzy rzeczy: ocena przez wybór obserwowanych zachowań z podpowiedzią poziomu, która jest oddzielona od decyzji; kontrola jakości
uzasadnienia, która wskazuje ogólniki, ocenę osoby i ryzyko stronniczości z cytatem; asystent, który nie odpowie bez źródła.
W eksporcie sugestia systemu i decyzja przełożonego są osobnymi polami – widać, czy przełożony przyjął podpowiedź.
Źródło: `README.md` → „Rozwiązanie” (punkty 2, 4, 7); `docs/API.md` §2 (`sugestiaSystemu`, `ocenaCzastkowa`).

**18. Czy przełożony nie będzie bezrefleksyjnie klikał sugestii?** *(Vlad)*
Sugestia wynika z zachowań, które przełożony sam wybrał, a nie z AI. Ostateczny poziom wybiera człowiek przy każdym kryterium,
a w arkuszu i eksporcie widać, gdzie decyzja różni się od sugestii. Kontrola jakości wskazuje kryteria bez przykładu i poziom niespójny
z zaznaczonymi zachowaniami.
Źródło: `README.md` → „Rozwiązanie” (punkty 3 i 7); `docs/API.md` §2.

### Potencjał wdrożeniowy (10%)

**19. Jak to wdrożyć w urzędzie – logowanie, baza, EZD, system kadrowy?** *(Vlad)*
Logowanie przez system tożsamości urzędu (SSO, OpenID Connect / SAML) i uprawnienia sprawdzane na serwerze; oceny w bazie urzędu
z szyfrowaniem i dziennikiem dostępu. Integracje przez adapter po stronie urzędu: z systemu kadrowego dane pracownika i OSP,
do EZD arkusz PDF i plik `azymut.ocena`; proponowane endpointy `/api/v1` są opisane.
Źródło: `docs/ROLE.md` → „Co trzeba zrobić przed wdrożeniem”; `docs/API.md` §3 i §4.

**20. Co jest prototypem, a co działa już teraz?** *(Vlad / Andrey)*
Działa: obie ścieżki oceny z regułami z rozporządzeń, sugestia poziomu, cztery funkcje AI, arkusz do druku / PDF, eksport JSON,
dokumentacja API (`/dokumentacja-api`), panel HR i ochrona panelu rolą. Prototypowe: role bez hasła (wybór roli zapisany w cookie),
oceny tylko w przeglądarce, przypomnienia symulowane, integracje z EZD i systemem kadrowym tylko opisane.
Role demonstracyjne i symulowane przypomnienia to świadomy wybór na prototyp: jury testuje aplikację bez zakładania kont.
Docelowo logowanie przez system tożsamości urzędu (SSO, OpenID Connect / SAML) bez własnych haseł i powiadomienia e-mail –
opisane w `docs/ROLE.md` i `README.md`.
Źródło: `README.md` → „Rozwiązanie”; `docs/ROLE.md` → „Jak to działa w prototypie”; `docs/API.md` §3 (zastrzeżenie);
issue #3 (odpowiedzi mentorki, pyt. 8 i 9).

**21. Jak aktualizować przepisy i model kompetencji?** *(Maks)*
Baza wiedzy i model są generowane skryptami z plików źródłowych – po zmianie przepisów podmieniamy PDF i przebudowujemy pliki.
Reguły oceny zmienia się w jednym module.
Źródło: `README.md` → „Architektura” (Dane); `scripts/baza-wiedzy/zbuduj.mjs`, `scripts/model-z-xlsx.py`; `src/lib/ocena/zasady.ts`.

**22. Czy da się to przenieść do innych urzędów?** *(Andrey)*
Tak w założeniu – model kompetencji i baza wiedzy są konfigurowalnymi plikami, a wymiana danych idzie przez wersjonowany format
`azymut.ocena`. Konkretnych urzędów i harmonogramu nie podajemy – **DO USTALENIA z Vladem**.
Źródło: `README.md` → „Kierunki rozwoju i wdrożenia”; `docs/API.md` §2 „Wersjonowanie”.

**23. Ile będzie kosztować wdrożenie i utrzymanie?** *(Vlad)*
Nie mamy wyceny w repo – **DO USTALENIA z Vladem**. Na scenie: „Wycena zależy od infrastruktury urzędu i wybranego modelu AI;
architektura pozwala użyć modelu w infrastrukturze urzędu.”
Źródło: brak w repo.

**24. Czy testowaliście z prawdziwymi przełożonymi lub HR?** *(Andrey / Diana)*
W repo nie ma zapisów takich testów – **DO USTALENIA z Vladem**. Reguły oceny konsultowaliśmy z mentorką MC – potwierdziła
metodę sugerowanego poziomu, skalę pierwszej oceny i arkusze B / C (#3, odpowiedzi mentorki). Testy funkcjonalne prowadzi
Diana na każdej wersji preview i produkcji.
Źródło: issue #9 „Raport z testów”; issue #3 (odpowiedzi mentorki); `docs/WORKFLOW.md` (tabela ról – Diana).

---

## 5. Próba

**Próba demo na produkcji – 21.11.2026** (świeże dane, okno 1440 px): wszystkie kroki z tabeli „Co ma być na ekranie” przeszły.
Nowy krok „Stanowisko i kryteria” oraz panel HR (wejście bez roli, „Wejdź jako HR”) sprawdzone na produkcji 21.11 (#42).
Zmierzone czasy odpowiedzi AI: asystent formalny ok. 1,4 s, kontrola jakości ok. 1 s, pytanie spoza bazy ok. 0,8 s.
Plan liczony z liczby słów (ok. 130 słów/min). **Próba na głos z zegarem** – Andrey, 21.11.2026, demo na produkcji,
2 przebiegi: **4:56** i **4:32** – oba mieszczą się w 5:00, tekstu nie skracamy. Najdłużej trwa demo (w próbie 1 – 6 s ponad plan);
gdy na scenie po kontroli jakości zegar pokazuje więcej niż 3:10, pomijamy slajd 8 (zasada w sekcji 1).

| Fragment | Plan | Próba 1 (na głos) | Próba 2 (na głos) |
|---|---|---|---|
| Problem + rozwiązanie | 0:40 | 0:42 | 0:39 |
| Demo: ocena okresowa (kryteria → wskaźniki → arkusz) | 2:25 | 2:31 | 2:20 |
| AI wspiera, nie decyduje | 0:25 | 0:24 | 0:22 |
| Panel HR | 0:35 | 0:38 | 0:33 |
| Wdrożenie + zakończenie | 0:40 | 0:41 | 0:38 |
| **Razem** | **4:45** | **4:56** | **4:32** |

---

## 6. DO USTALENIA z Vladem

1. **Ustalone:** Vlad – komputer na scenie (klika demo według scenariusza), Andrey – mówi, Diana – telefon z hotspotem i laptop
   zapasowy z wideo.
2. **Ustalone** (#3, odpowiedzi mentorki MC, 21.11): sugerowany poziom – równe wagi, średnia ze wskaźników, § 11 ust. 1 pkt 2
   (ściąga pyt. 2); pierwsza ocena 3/5/7, „na poziomie oczekiwań” = 5 pkt (pyt. 3); tylko arkusze B i C (pyt. 5); aplikacja
   webowa na komputer, na ekranach < 768 px pasek bez blokady – PR #39 (pyt. 8). Wymóg do demo: co najmniej jedna kompletna
   ścieżka (rozpoczęcie procesu → kryteria → ocena wskaźników → sugerowany poziom → decyzja przełożonego) – scenariusz
   ją pokazuje (sekcja 1). Najlepiej obie ścieżki pełne – w aplikacji są obie, na scenie pokazujemy okresową.
3. **Ustalone:** automatyczny test asystenta (`scripts/baza-wiedzy/test-asystenta.mjs`) – **30/30** z prawdziwym AI (Maks, PR #33).
4. Koszty wdrożenia, liczba urzędów, harmonogram – brak w repo, na scenie nie podajemy liczb.
5. Czy ktoś testował aplikację z prawdziwymi przełożonymi / HR.
6. **Ustalone:** internet na scenie będzie; slajdy (PDF) i wideo (mp4) pokazujemy z pendrive'a na komputerze na scenie;
   demo lokalnego z Ollamą nie robimy (decyzja zespołu).
7. Linki do wideo i prezentacji (w `README.md` jeszcze „https://…”).
8. **Ustalone (decyzja zespołu):** logowanie – role demonstracyjne, docelowo system tożsamości urzędu (SSO); przypomnienia HR
   symulowane, docelowo powiadomienia e-mail. Mentorka prosiła o doprecyzowanie pytania (#3) – jeśli odpowie inaczej, wracamy do tematu.
