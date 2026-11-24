# Materiały źródłowe

Pliki od organizatora zadania „Kompas kompetencji” (Ministerstwo Cyfryzacji, HackNation 2026) oraz akty
prawne, z których zbudowana jest baza wiedzy asystenta formalnego. Aplikacja nie czyta tych plików w czasie
działania – korzysta z wygenerowanych plików JSON w `src/data/`.

| Plik | Co to jest | Gdzie używany |
|---|---|---|
| `Rozporządzenie o pierwszej ocenie z 2015 r. (1).pdf` | rozporządzenie PRM, Dz.U. 2015 poz. 1144 | `zbuduj.mjs` → `fragmenty.json` |
| `Rozporządzenie o ocenach okresowych z 2016 r. (3).pdf` | rozporządzenie PRM, Dz.U. 2016 poz. 470 (pełny tekst) | `zbuduj.mjs` → `fragmenty.json` |
| `Rozporządzenie o ocenach okresowych z 2016 r. (4).pdf` | ten sam akt – tylko załącznik z kryteriami | materiał pomocniczy |
| `ustawa-o-sluzbie-cywilnej-tj-DzU-2026-590.pdf` | ustawa o służbie cywilnej, tekst jednolity Dz.U. 2026 poz. 590 (ISAP) | `zbuduj.mjs` (art. 38 i 81–83) |
| `Pierwsza ocena w służbie cywilnej - poradnik z 2016 r. (1).pdf` | poradnik KPRM | `zbuduj.mjs` → `fragmenty.json` |
| `Poradnik - oceny okresowe w służbie cywilnej (2).pdf` | poradnik KPRM | `zbuduj.mjs` → `fragmenty.json` |
| `Model_kompetencji.xlsx` | 14 kompetencji, 49 wskaźników behawioralnych, opisy 5 poziomów | `scripts/model-z-xlsx.py` → `src/data/model-kompetencji.json` |
| `Arkusz oceny B (2).docx`, `Arkusz oceny C (2).docx` | wzory arkuszy oceny okresowej (B – stanowiska kierownicze, C – pozostałe) | wzór dla arkusza w aplikacji |
| `Arkusz pierwszej oceny (2).docx` | wzór arkusza pierwszej oceny | materiał pomocniczy |
| `OSP/*.docx` | 3 przykładowe opisy stanowisk pracy w MC (naczelnik → arkusz B, 2 stanowiska → arkusz C) | dane przykładowe |
| `MC BDG - Pełna treść zadania konkursowego.pdf` | treść zadania i kryteria oceny jury | – |
| `MC BDG - Regulamin zadania konkursowego.pdf` | regulamin zadania | – |
| `Koncepcja aplikacji (grafika).webp` | grafika organizatora „Kompas Kompetencji: Ścieżki Oceny” | – |

## Przebudowa danych

```bash
# baza wiedzy asystenta (wymaga pdftotext; w Git Bash na Windows: PATH=/ucrt64/bin:$PATH)
node scripts/baza-wiedzy/zbuduj.mjs

# model kompetencji
python scripts/model-z-xlsx.py materialy/Model_kompetencji.xlsx
```

Szczegóły (nazwy plików, zakresy stron, test asystenta po zmianie): [docs/BAZA-WIEDZY.md](../docs/BAZA-WIEDZY.md).
