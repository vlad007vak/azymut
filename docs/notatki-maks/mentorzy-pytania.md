# Шпаргалка: вопросы к менторам MC (задача #3)

Задавать по-польски (строки **PL**). Строка «U nas teraz» — сказать ментору, что уже сделано, чтобы он мог просто ответить «tak / nie».
**RU** — для тебя: что уже сказано в задании и что поменяется от ответа.
Ответы записывай коротко рядом с вопросом. Потом скажи мне, я оформлю комментарий в #3, и скажи Владу.

Если времени мало — сначала блок A (влияет на оценку жюри), блок B — быстрые подтверждения.

---

## A. Главное

### 4. Sugerowany poziom kompetencji
**PL:** Sugerowany poziom kompetencji: każde zachowanie w modelu ma poziom 1–5, czyli 1/3/5/7/9 pkt. Liczymy średnią z wybranych zachowań (bez wskaźników z „brakiem podstaw do oceny”) i przekładamy ją na poziom według przedziałów z § 11 ust. 1 pkt 2 rozporządzenia o ocenach okresowych. Czy to zgodne z intencją modelu? Czy wskaźniki mają różne wagi?
**U nas teraz:** dokładnie tak; system tylko sugeruje, poziom zawsze wybiera przełożony.
**RU:** ядро демо — жюри прямо проверяет «przedstawienie sugerowanego poziomu». Логика в `src/lib/ocena/zasady.ts` (файл Влада) — если ответ другой, меняет Влад.

### 6. Wszystkie wskaźniki czy wybrane?
**PL:** W modelu jest wskazówka „Dobierz wskaźniki do zadań i zakresu odpowiedzialności na stanowisku”, a w opisie testowania – „ocena wybranych wskaźników behawioralnych”. Czy przełożony może ocenić tylko część wskaźników kompetencji, czy musi ocenić wszystkie?
**U nas teraz:** przy każdym wskaźniku trzeba wybrać zachowanie albo „brak podstaw do oceny”.
**RU:** если «можно выбрать часть» — в мастере нужен выбор показателей (`features/ocena`, Влад).

### 5. Pierwsza ocena: 5 poziomów → 3/5/7 pkt
**PL:** Pierwsza ocena ma skalę 3/5/7 pkt, a model kompetencji – 5 poziomów. Czy sugestię „znacznie poniżej oczekiwań” traktujemy jak „poniżej oczekiwań” (3 pkt), a „znacznie powyżej” jak „powyżej oczekiwań” (7 pkt)?
**U nas teraz:** tak właśnie liczymy.
**RU:** в коде помечено «PROPOZYCJA ZESPOŁU – do potwierdzenia u mentorów».

### 1. Smartfony
**PL:** W zadaniu jest „System nie ma być dostępny na smartfonach”, a jednocześnie „czytelny i responsywny interfejs”. Czy wystarczy, że projektujemy pod komputer (i tablet?), czy na telefonie mamy blokować dostęp komunikatem „Aplikacja przeznaczona na komputer”?
**U nas teraz:** aplikacja jest robiona pod komputer (od 1024 px); na telefonie się otwiera, nie blokujemy.
**RU:** если «блокировать» — нужна заглушка для узких экранов (`layout.tsx`, Влад). Влияет и на тесты Дианы (по WORKFLOW она проверяет и телефон).

### 10. Która ścieżka w demo?
**PL:** Co najbardziej przekonałoby MC w demo – która ścieżka ma być wzorcowa: ocena okresowa czy pierwsza ocena? Na czym jury skupi się przy teście?
**RU:** в задании демо = «rozpoczęcie procesu, pracę z kryteriami i kompetencjami…» — критерии есть только в okresowej, так что скорее она. Ответ нужен Владу и Андрею (питч).

### 11. (предлагаю добавить) Scenariusze jury
**PL:** W zadaniu jest, że podczas testowania mogą zostać użyte „przykładowe, fikcyjne dane pracownika oraz przygotowane scenariusze oceny”. Czy możemy je dostać wcześniej, żeby sprawdzić na nich aplikację? Czy możecie podać kilka przykładowych pytań, które jury zada asystentowi?
**RU:** если дадут — прогоним сценарии и вопросы до сдачи. Самый полезный вопрос для моего ассистента.

---

## B. Быстрые подтверждения

### 2. Zestaw pytań i odpowiedzi
**PL:** Baza wiedzy ma obejmować „przygotowany zestaw pytań i odpowiedzi”. Czy organizator go udostępni? Jeśli nie – czy wystarczy nasz zestaw (30 pytań z odpowiedziami i źródłami z ustawy, rozporządzeń i poradników KPRM)?
**RU:** наш набор — `docs/test-asystenta.md`. Если дадут свой — добавлю в базу и в тест.

### 3. Ustawa o służbie cywilnej
**PL:** Ustawy nie było w paczce materiałów. Używamy tekstu jednolitego z ISAP (Dz.U. 2026 poz. 590), w bazie mamy art. 38 i 81–83. Czy to dobra wersja i czy potrzebne są inne przepisy ustawy?
**RU:** уже сделано (PR #23); если назовут другие статьи — добавлю.

### 7. Arkusz A
**PL:** Arkusz A (kierownik urzędu, § 3 ust. 2 rozporządzenia) – czy możemy go pominąć w prototypie? W materiałach są tylko arkusze B i C.
**U nas teraz:** tylko B i C.

### 8. Logowanie
**PL:** Czy wystarczą role demonstracyjne (przełożony / HR) z opisem docelowej integracji (np. SSO urzędu)? Zadanie wymaga, żeby linki były dostępne dla oceniających bez dodatkowych uprawnień.
**RU:** в задании «uwzględniać mechanizmy uwierzytelniania» + «linki… bez konieczności uzyskiwania dodatkowych uprawnień» → почти наверняка хватит демо-ролей (страница `/logowanie` уже так сделана).

### 9. Przypomnienia HR
**PL:** Czy przypomnienia HR mogą być symulowane w aplikacji (z opisem docelowej integracji z e-mailem / EZD)?
**RU:** в задании интеграции с EZD/QNT «nie jest wymagane w ramach prototypu». У Андрея отправка уже симулируется.

---

## Текст для Discord (если менторов нет на стойке)

```
Dzień dobry! Zespół Azymut (Kompas kompetencji) – kilka krótkich pytań:
1. Sugerowany poziom: liczymy średnią pkt (1/3/5/7/9) z wybranych zachowań przy wskaźnikach (bez „braku podstaw do oceny”) i przedziały z § 11 ust. 1 pkt 2 rozporządzenia z 2016 r. Czy to zgodne z intencją modelu? Czy wskaźniki mają różne wagi?
2. Czy przełożony może ocenić tylko wybrane wskaźniki kompetencji („dobierz wskaźniki do zadań na stanowisku”), czy wszystkie?
3. Pierwsza ocena (3/5/7 pkt) a 5 poziomów modelu: „znacznie poniżej” = 3 pkt, „znacznie powyżej” = 7 pkt – OK?
4. Smartfony: wystarczy projekt pod komputer, czy mamy blokować dostęp na telefonie?
5. Która ścieżka ma być wzorcowa w demo: ocena okresowa czy pierwsza ocena?
6. Czy udostępnicie przykładowe scenariusze oceny / pytania do asystenta, których użyje jury?
7. Czy będzie „przygotowany zestaw pytań i odpowiedzi” do bazy wiedzy? Jeśli nie – używamy własnego (30 pytań ze źródłami).
8. Ustawa o SC: tekst jednolity z ISAP (Dz.U. 2026 poz. 590), art. 38 i 81–83 – wystarczy?
9. Arkusz A (kierownik urzędu) – możemy pominąć w prototypie?
10. Wystarczą role demonstracyjne (przełożony/HR) z opisem docelowego SSO i symulowane przypomnienia HR (docelowo e-mail/EZD)?
Dziękujemy!
```

---

## Шаблон ответов (заполнить → я опубликую комментарием в #3)

```
1 (poziom):
2 (wybrane wskaźniki):
3 (pierwsza 3/5/7):
4 (smartfony):
5 (ścieżka demo):
6 (scenariusze jury):
7 (zestaw Q&A):
8 (ustawa):
9 (arkusz A):
10 (role / przypomnienia):
Kto odpowiedział, gdzie, o której:
```
