# Jak pracujemy: 4 programistów + testerka

Czterech programistów, każdy z własnym asystentem Claude Code, **jedno publiczne repozytorium na GitHubie**.
Zasada główna: **pracę dzielimy według folderów funkcji**, a nie według plików – dzięki temu cztery osoby prawie nigdy
nie edytują tego samego pliku.

```
GitHub (publiczne repozytorium)
 ├── main ──────────────► Vercel – produkcja (link dla jury, zawsze działa)
 ├── vlad/<funkcja>   ─┐
 ├── maks/<funkcja>   ─┤
 ├── andrey/<funkcja> ─┼──► PR ──► CI (lint + build) + podgląd Vercel ──► testy Diany ──► merge do main
 └── dima/<funkcja>   ─┘
```

## Role
| Kto | Odpowiada za | Pliki / narzędzia |
|---|---|---|
| **Vlad – główny programista, integrator** | decyzje, kreator oceny (obie ścieżki), łączenie zmian, Vercel | **pliki wspólne**: `layout.tsx`, `globals.css`, `config/app.ts`, `lib/**`, `types/**`, `components/ui/**`, `package.json`, `.github/**` |
| **Główny asystent AI** (Claude Code Vlada) | zasady pracy, architektura i kontrakt typów, podział pracy na zadania (GitHub Issues), przegląd PR | zadania i komentarze z konta Vlada |
| **Maks** | asystent formalny AI i baza wiedzy, kontakt z mentorką | `src/features/asystent/`, `src/data/baza-wiedzy/` |
| **Andrey** | panel HR, role, pitch (`docs/PITCH.md`) | `src/features/hr/`, `src/features/role/` |
| **Dima** | asystent rozmowy, analiza opisu stanowiska (OSP), eksport JSON i API | `src/features/rozmowa/`, `src/features/osp/`, `src/features/eksport/` |
| **Diana – testy i raporty** | sprawdzenie każdego podglądu Vercel na komputerze, błędy jako GitHub Issues (formularz „Błąd”), raport końcowy w jednym przypiętym zgłoszeniu „Raport z testów” | GitHub Issues |
| **Zgłoszenie i pitch** | slajdy, HackTribe, wideo – Vlad; pitch – Andrey; README – główny asystent AI; teksty po polsku czytamy wspólnie | HackTribe |

Pliki wspólne zmienia **tylko Vlad / główny asystent AI**. Potrzebna zmiana we wspólnym pliku → komentarz w zadaniu
zaczynający się od `ZMIANA WSPÓLNA:`.

## Jak przydzielane są zadania
```
Główny asystent AI ──tworzy zadanie #12 (etykieta maks)──► GitHub Issues
Vlad ──„weź zadanie #12”──► Maks ──► jego Claude Code
Claude Maksa: czyta #12 → gałąź maks/12-... → kod → PR (opis = raport, Closes #12)
CI (lint + build) ──► zielone?
   ├─ mały PR tylko we własnych folderach → autor łączy sam
   └─ pliki wspólne / duży PR → etykieta review-needed → przegląd głównego asystenta AI → merge
```
- Pytanie do zadania → komentarz `PYTANIE:` w zadaniu i informacja dla Vlada.

## Cykl pracy programisty
```bash
git switch -c maks/12-kreator         # nowa gałąź dla zadania #12
# ... praca z Claude Code, małe commity ...
git pull --rebase origin main         # zmiany innych osób
npm run lint; npm run build           # musi przejść
git push -u origin HEAD
gh pr create --fill                   # Vercel tworzy podgląd → link dla Diany
gh pr merge --squash --delete-branch  # po sprawdzeniu
git switch main; git pull
```

## Zasady, żeby sobie nie przeszkadzać
- Nowa biblioteka → najpierw prośba `ZMIANA WSPÓLNA:` (zmiana `package.json`).
- Dwa PR gotowe jednocześnie → najpierw łączymy mniejszy, drugi robi `pull --rebase`.
- Konflikt w `package-lock.json`: wersja z `main`, potem ponownie `npm install <pakiet>`.
- Nie wolno: commitować prosto do `main`, `git push --force` do `main`, commitować `.env.local`, „poprawiać” cudzego kodu.
- Zepsuty `main` → naprawia autor ostatniego PR, pozostali nie łączą, dopóki nie jest zielony.
- Klucze darmowych API (Groq, Gemini) tylko w `.env.local` i w zmiennych środowiskowych Vercel – nigdy w repozytorium.

## Plan 24 godzin
| Czas | Programiści | Diana (testy) | Zgłoszenie |
|---|---|---|---|
| Sob 11:00–12:00 | analiza zadania, kontrakt, repozytorium, Vercel | czyta zadanie razem z zespołem | kryteria jury → lista kontrolna |
| 12:00–20:00 | główny scenariusz działa na Vercel | testy każdego podglądu, błędy w Issues | mentorzy, teksty po polsku |
| **do 20:00** | – | – | **szkic w HackTribe** (nazwa, zespół, repozytorium, stół, opis) |
| 20:00–07:00 | pozostałe funkcje, poprawki jakości | testy, raport | struktura prezentacji |
| Nd 07:00 | **zamrożenie funkcji**: dalej tylko poprawki błędów | pełny przebieg scenariusza jury na produkcji | – |
| 07:00–10:00 | błędy, dopracowanie | ponowne sprawdzenie produkcji | prezentacja, wideo ≤ 2 min, README |
| **10:30** | – | – | **końcowe zgłoszenie w HackTribe** |
| 11:00 | koniec – późniejsze zmiany nie są brane pod uwagę | – | – |

## Gdy zniknie internet
- Internet z telefonu (hotspot).
- Commitować lokalnie, wypchnąć, gdy sieć wróci.
