# Azymut

> Kompas kompetencji – przełożony krok po kroku przez pierwszą ocenę i ocenę okresową w służbie cywilnej.

Projekt zespołu **Bubylda** przygotowany podczas **HackNation 2026** (Bydgoszcz, 21–22.11.2026)
w ramach zadania **Kompas kompetencji** (Ministerstwo Cyfryzacji).

- 🌐 **Demo:** https://azymut-bubylda.vercel.app
- 🎬 **Wideo (do 2 min):** https://…
- 📊 **Prezentacja:** https://…

## Problem
Opis problemu z perspektywy użytkownika (2–3 zdania).

## Rozwiązanie
Co robi aplikacja i dlaczego to pomaga. Najważniejsze funkcje:

1. …
2. …
3. …

## Jak przetestować (dla jury)
1. Otwórz link demo.
2. …
3. …

## Technologie
- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui (Base UI)
- Modele językowe przez darmowe API zgodne z OpenAI: Groq, Google Gemini; awaryjnie lokalnie Ollama
- Hosting: Vercel

## Uruchomienie lokalne
```bash
npm install
cp .env.example .env.local   # uzupełnij klucze API
npm run dev                  # http://localhost:3000
```

## Wykorzystane zasoby
Zgodnie z zasadami HackNation informujemy o zasobach przygotowanych lub użytych poza czasem hackathonu:

- **Szablon startowy** przygotowany przez zespół przed wydarzeniem: konfiguracja Next.js + Tailwind + shadcn/ui,
  układ strony po polsku, warstwa AI z przełączaniem darmowych dostawców (`src/lib/ai`), komponent czatu.
  Cała logika związana z zadaniem powstała podczas hackathonu.
- **Biblioteki open source:** Next.js, React, Tailwind CSS, shadcn/ui, Base UI, lucide-react, sonner, zod,
  openai (klient API), react-markdown, remark-gfm.
- **Narzędzia AI:** kod powstawał z pomocą asystenta Claude Code.
- **Źródła danych i wiedzy:** model kompetencji (14 kompetencji, 49 wskaźników behawioralnych) oraz wzory arkuszy,
  poradniki KPRM i przykładowe opisy stanowisk – materiały organizatora zadania (Ministerstwo Cyfryzacji);
  rozporządzenie Prezesa Rady Ministrów z 4.04.2016 w sprawie ocen okresowych (Dz.U. 2016 poz. 470);
  rozporządzenie Prezesa Rady Ministrów z 23.07.2015 w sprawie pierwszej oceny (Dz.U. 2015 poz. 1144);
  ustawa o służbie cywilnej (t.j. Dz.U. 2026 poz. 590). Dane pracowników w wersji demo są fikcyjne.

## Zespół
- Imię Nazwisko – rola
- …
