# Teksty do zgłoszenia w HackTribe (do akceptacji przez Vlada)

Szkic do **soboty 20:00** (po 20:00 nie można utworzyć projektu ani zmienić zadania), wersja finalna do **niedzieli 10:30**.

## Pola szkicu
- **Nazwa projektu:** Azymut
- **Zespół:** Azymut
- **Zadanie:** Kompas kompetencji (Ministerstwo Cyfryzacji)
- **Repozytorium:** https://github.com/vlad007vak/azymut
- **Demo:** https://azymut-bubylda.vercel.app
- **Numer stołu:** … (uzupełnia Vlad)

## Krótki opis (1–2 zdania)
Azymut prowadzi przełożonego w służbie cywilnej krok po kroku przez pierwszą ocenę i ocenę okresową: od doboru
kryteriów na podstawie opisu stanowiska, przez ocenę obserwowalnych zachowań z modelu kompetencji i sugerowany
poziom, po wynik zgodny z rozporządzeniami i gotowy arkusz. Asystent AI wyjaśnia przepisy ze wskazaniem źródła
i pomaga przygotować rozmowę – decyzję zawsze podejmuje przełożony.

## Opis projektu (koncepcja i najważniejsze funkcje)
Ocena kompetencji w służbie cywilnej wymaga połączenia przepisów, formularzy, modelu kompetencji i dobrej rozmowy
z pracownikiem. Azymut łączy to w jednym narzędziu dla przełożonego (i panelu dla HR):

- **Dwie ścieżki zgodne z rozporządzeniami:** pierwsza ocena (5 elementów, skala 3/5/7 pkt, warunki oceny
  pozytywnej) i ocena okresowa (arkusz B lub C, kryteria obowiązkowe i maks. 3 dodatkowe, skala 1–9 pkt).
- **Ocena przez zachowania:** przy każdym z wybranych wskaźników behawioralnych przełożony wskazuje opis
  zachowania, które obserwował, i zapisuje przykład; system pokazuje sugerowany poziom z wyjaśnieniem.
- **Decyzja przełożonego:** ostateczny poziom wybiera człowiek; aplikacja liczy średnią lub ocenę łączną i wynik
  dokładnie według przepisów oraz wymaga uzasadnienia przy ocenie negatywnej.
- **Asystent formalny AI** z bazą wiedzy (rozporządzenia, poradniki KPRM, model kompetencji): każda odpowiedź
  ze źródłem i cytatem, a gdy w bazie nie ma odpowiedzi – jasny komunikat zamiast zgadywania.
- **Analiza opisu stanowiska** (podpowiedź arkusza, kryteriów dodatkowych i wskaźników) oraz **asystent rozmowy**
  (pytania, kwestie do omówienia, argumenty, propozycje rozwoju).
- **Kontrola jakości uzasadnienia:** przed sporządzeniem oceny wskazuje ogólniki, ocenę osoby zamiast zachowania,
  niespójności z poziomem, kryteria bez przykładu i ryzyko stronniczości – z cytatem i podpowiedzią.
- **Arkusz** według wzoru do wydruku / PDF i **panel HR** ze statusami, terminami i przypomnieniami.

## Opis wykorzystania AI
AI działa w czterech miejscach: asystent formalny (odpowiedzi wyłącznie z bazy wiedzy, źródła i cytaty budowane
przez serwer, komunikat „brak informacji” poza bazą), analiza opisu stanowiska (podpowiedzi kryteriów dodatkowych
i wskaźników, weryfikowane regułami po stronie serwera), asystent rozmowy (plan rozmowy na podstawie przykładów
zachowań) oraz kontrola jakości uzasadnienia (uwagi tylko z dosłownym cytatem tekstu przełożonego, sprawdzanym
przez serwer). AI nie liczy punktów i nie ustala poziomu – robi to kod zgodny z rozporządzeniami, a decyzję podejmuje
przełożony. Do AI nie trafiają imiona i nazwiska. Modele: darmowe API Groq (qwen3.8-27b) z automatycznym
przełączeniem na Google Gemini (gemini-3.5-flash-lite).

## Technologie i architektura
Next.js 16 (React 19, TypeScript), Tailwind CSS 4, shadcn/ui; hosting Vercel. Moduły funkcji z jednym kontraktem
typów, reguły oceny w osobnym module, API walidowane schematami zod, warstwa AI zgodna z OpenAI (łatwa podmiana na
model w infrastrukturze urzędu). Model kompetencji i baza wiedzy generowane skryptami z plików źródłowych – łatwa
aktualizacja po zmianie przepisów. Przed wdrożeniem: logowanie przez system urzędu i role po stronie serwera, baza
danych w infrastrukturze urzędu z szyfrowaniem i dziennikiem dostępu, integracje z EZD i systemem kadrowym (np. QNT)
przez udokumentowane API, analiza ryzyka dla danych osobowych.
