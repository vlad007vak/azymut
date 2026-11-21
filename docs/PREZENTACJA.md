# Prezentacja (maks. 10 slajdów) i scenariusz wideo

Wymóg zadania: **maksymalnie 10 slajdów** – logika działania, kluczowe funkcjonalności, kierunek dalszego rozwoju.
Pitch finałowy: maks. 5 min + 5 min pytań. Punkty oznaczone **[po merge]** wpisujemy tylko, jeśli funkcja jest na produkcji.

---

## Slajd 1 – Tytuł
**Azymut – Kompas kompetencji**
Przełożony krok po kroku przez pierwszą ocenę i ocenę okresową w służbie cywilnej.
Zespół Bubylda · HackNation 2026 · azymut-bubylda.vercel.app (kod QR do demo)

*Notatka do pitchu:* „Zbudowaliśmy narzędzie, które prowadzi przełożonego przez całą ocenę pracownika – i nie zabiera mu decyzji.”

## Slajd 2 – Problem
- Przełożony musi połączyć przepisy, formularze, model kompetencji i rozmowę z pracownikiem.
- Kompetencje są szerokie – łatwo ocenić „na wrażenie”, a nie na podstawie zachowań.
- Różni przełożeni różnie interpretują te same kryteria.
- Wiedza o procedurze jest rozproszona w rozporządzeniach i poradnikach.

*Notatka:* odwołać się do treści zadania – brakuje jednego narzędzia, które łączy te elementy.

## Slajd 3 – Rozwiązanie
- Jedno narzędzie dla **przełożonego** (ocena) i **HR** (monitorowanie procesów).
- Prowadzi krok po kroku zgodnie z rozporządzeniami.
- Ocena przez **obserwowalne zachowania** z modelu kompetencji.
- **AI doradza i wyjaśnia, decyzję zawsze podejmuje przełożony.**

*Notatka:* to zdanie o decyzji powtarzamy – jury ocenia bezpieczeństwo AI.

## Slajd 4 – Logika działania: dwie ścieżki
Schemat (jak na grafice organizatora):
- **Pierwsza ocena:** rozmowa wstępna i sprawozdanie → 5 elementów oceny → rozmowa oceniająca → decyzja (3/5/7 pkt, warunki § 10) → arkusz.
- **Ocena okresowa:** analiza opisu stanowiska → arkusz B lub C → kryteria obowiązkowe + maks. 3 dodatkowe → ocena wskaźników → rozmowa → decyzja (1–9 pkt, § 11) → arkusz.

*Notatka:* „Każdy krok odpowiada przepisom – aplikacja pilnuje kolejności i reguł.”

## Slajd 5 – Model kompetencji w praktyce (zrzut ekranu kroku „Ocena wskaźników”)
- 14 kompetencji, 49 wskaźników behawioralnych, 5 poziomów – z modelu organizatora.
- Przy wskaźniku przełożony wybiera zachowanie, które obserwował, i zapisuje przykład (sytuacja – działanie – rezultat).
- System pokazuje **sugerowany poziom** z wyjaśnieniem, np. rzetelność: średnia 4 pkt → „poniżej oczekiwań”.
- „Brak podstaw do oceny”, gdy nie było okazji zaobserwować zachowania.

*Notatka:* pokazać, że sugestia wynika z wyborów przełożonego, nie z AI.

## Slajd 6 – Decyzja i wynik zgodny z przepisami (zrzut ekranu kroku „Decyzja”)
- Przełożony wybiera ostateczny poziom (może przyjąć sugestię albo ją zmienić).
- Aplikacja liczy średnią / ocenę łączną i wynik dokładnie wg rozporządzeń.
- Przykład reguły: jedna ocena „znacznie poniżej oczekiwań” → ocena negatywna (§ 11 ust. 1 pkt 4).
- Uzasadnienie wymagane przy ocenie negatywnej; arkusz do wydruku / PDF.

## Slajd 7 – Asystent formalny AI (zrzut ekranu odpowiedzi ze źródłem)
- Odpowiada **wyłącznie z bazy wiedzy**: rozporządzenia, poradniki KPRM, model kompetencji (183 fragmenty).
- Przy każdej odpowiedzi: dokument, paragraf / strona i **dosłowny cytat**.
- Gdy w bazie brak odpowiedzi – **„Brak informacji”** zamiast zgadywania.
- Źródła buduje serwer – model nie może „wymyślić” cytatu.

*Notatka:* na żywo zadać pytanie „Ile kryteriów dodatkowych może wybrać oceniający?” → § 5 ust. 2.

## Slajd 8 – AI wspiera, nie decyduje
- **Analiza opisu stanowiska:** arkusz (regułą), kryteria dodatkowe i wskaźniki z uzasadnieniem – przełożony przyjmuje lub odrzuca.
- **Asystent rozmowy:** pytania do pracownika, kwestie do omówienia, argumenty do oceny, propozycje rozwoju + lista kontrolna z rozporządzenia.
- **Kontrola jakości uzasadnienia:** wskazuje kryteria bez przykładu, ogólniki, oceny osobowości, niespójności z poziomem i ryzyko stronniczości – zawsze z dosłownym cytatem; uwagi bez cytatu serwer odrzuca.
- Bezpieczeństwo: do AI nie trafiają imiona i nazwiska; AI nie liczy punktów; darmowe modele z automatycznym przełączaniem (Groq → Gemini).

## Slajd 9 – HR, architektura i wdrożenie
- **Panel HR:** statusy procesów, terminy (zbliżające się i przekroczone), przypomnienia, nowy proces.
- Role demonstracyjne (przełożony / HR), eksport oceny do JSON, dokumentacja API (OpenAPI).
- Architektura: Next.js 16, moduły funkcji, reguły oceny w osobnym module, API z walidacją, wymienna warstwa AI, model i baza wiedzy generowane skryptami z plików źródłowych.
- Przed wdrożeniem: logowanie przez system urzędu, baza w infrastrukturze urzędu, model AI w infrastrukturze lub z umową powierzenia, integracje EZD i systemy kadrowe (np. QNT).

## Slajd 10 – Kierunki rozwoju i podsumowanie
- Integracja z systemem kadrowym (dane pracownika, OSP) i EZD (arkusz do akt).
- Raporty dla urzędu, powiadomienia e-mail, kolejne urzędy – konfigurowalny model i baza wiedzy.
- **Wartość:** spójniejsze i bardziej obiektywne oceny, mniej błędów formalnych, lepsze rozmowy z pracownikami.
- Demo: azymut-bubylda.vercel.app · Kod: github.com/vlad007vak/azymut · Zespół Bubylda

*Notatka:* zakończyć zdaniem z slajdu 3 – „AI doradza, decyzję podejmuje przełożony”.

---

## Scenariusz wideo (do 2 minut, nagranie ekranu + lektor)

| Czas | Ekran | Lektor |
|---|---|---|
| 0:00–0:12 | Strona główna | „Azymut prowadzi przełożonego w służbie cywilnej przez pierwszą ocenę i ocenę okresową – od kryteriów po gotowy arkusz.” |
| 0:12–0:30 | Nowa ocena okresowa → krok 1 → przykład „Naczelnik wydziału” → Analizuj → Zastosuj | „Na podstawie opisu stanowiska system podpowiada arkusz, kryteria dodatkowe i najważniejsze wskaźniki. Przełożony każdą podpowiedź przyjmuje albo odrzuca.” |
| 0:30–0:55 | Anna Kowalczyk → Ocena wskaźników → zmiana zachowania → sugestia się zmienia | „Ocena opiera się na obserwowalnych zachowaniach z modelu kompetencji. Przełożony wybiera opis zachowania i zapisuje przykład, a system pokazuje sugerowany poziom z wyjaśnieniem.” |
| 0:55–1:15 | Rozmowa → asystent formalny: pytanie o kryteria dodatkowe → rozwinięte źródło | „Asystent formalny odpowiada tylko na podstawie przepisów i poradników KPRM – zawsze ze źródłem i cytatem. Gdy nie zna odpowiedzi, mówi to wprost.” |
| 1:15–1:30 | Asystent rozmowy → „Przygotuj rozmowę” | „Asystent rozmowy przygotowuje pytania, kwestie do omówienia i argumenty – na podstawie zapisanych przykładów.” |
| 1:30–1:45 | Decyzja → Przyjmij sugestie → wynik → Sporządź → arkusz | „Ostateczny poziom wybiera przełożony. Wynik jest liczony dokładnie według rozporządzenia, a arkusz gotowy do wydruku i PDF.” |
| 1:45–2:00 | Panel HR (po wyborze roli HR) → logo / link | „HR monitoruje terminy i wysyła przypomnienia. Azymut – AI doradza, decyzję podejmuje przełożony.” |

Przed nagraniem: tryb incognito (świeże dane demo), okno 1440 px, ukryte zakładki i powiadomienia; przy pytaniach do AI odczekać, aż odpowiedź się pojawi (limit darmowych modeli – najlepiej nagrywać fragmenty osobno i skleić).
