# Role i uprawnienia

Zadanie wymaga mechanizmów uwierzytelniania, autoryzacji i zarządzania rolami. Prototyp pokazuje to na
**rolach demonstracyjnych**; poniżej: jak działa teraz, kto co docelowo może i co trzeba zrobić przed wdrożeniem.

> Role opisujemy **funkcjonalnie** (kto co robi w aplikacji). Zakres ról docelowych i ich podstawę prawną
> trzeba potwierdzić z urzędem – ten dokument nie interpretuje przepisów.

## Jak to działa w prototypie

| Element | Działanie |
|---|---|
| Wejście | `/logowanie` – wybór karty roli, bez hasła. Dopisek na stronie: „Prototyp – role demonstracyjne; docelowo logowanie przez system urzędu (np. SSO / Active Directory)”. |
| Zapis roli | Cookie `azymut_rola` (`przelozony` albo `hr`), ścieżka `/`, `SameSite=Lax`, 30 dni, `Secure` na HTTPS. Przetrwa odświeżenie i zamknięcie karty. |
| Ochrona trasy | `src/proxy.ts` (w Next.js 16 dawny Middleware): `/hr` bez roli HR → `/logowanie?powrot=/hr` z komunikatem; po wyborze HR – powrót na `/hr`. |
| Bez roli | Strona startowa, kreator oceny, asystenci działają bez logowania – jury wchodzi od razu w scenariusz. Nagłówek zachęca: „Wybierz rolę”. |
| Nagłówek | `<RolaWNaglowku />`: kim jestem (rola, przy przełożonym imię i nazwisko) + „Zmień rolę”. |
| Dane | Oceny leżą w przeglądarce (`localStorage`), więc w prototypie rola ogranicza **widok**, a nie dostęp do danych. |

### Role demonstracyjne

- **Przełożony (oceniający)** – Katarzyna Wiśniewska, naczelnik wydziału (osoba fikcyjna z `src/data/demo.ts`).
  Prowadzi ocenę swoich pracowników krok po kroku.
- **HR / administrator procesu** – pracownik komórki kadrowej: pilnuje przebiegu ocen w całym urzędzie.

## Macierz uprawnień

„Tak” / „—” = zamierzony zakres roli. W prototypie egzekwowany jest **tylko dostęp do panelu HR**;
role oznaczone „docelowo” nie są zaimplementowane.

| Czynność | Przełożony | HR | Pracownik oceniany *(docelowo)* | Kierujący komórką *(docelowo)* | Dyrektor generalny *(docelowo)* |
|---|---|---|---|---|---|
| Lista ocen | swoich pracowników | wszystkie procesy w urzędzie | tylko własna | oceny w swojej komórce (podgląd) | podgląd przy sprzeciwie |
| Ustalanie kryteriów, ocena wskaźników | tak | — | — | — | — |
| Decyzja o poziomie i wyniku (system tylko sugeruje) | tak | — | — | — | — |
| Przygotowanie rozmowy oceniającej | tak | — | udział w rozmowie | — | — |
| Arkusz oceny (PDF) | sporządza | podgląd, archiwum | otrzymuje do zapoznania | podgląd | podgląd przy sprzeciwie |
| Panel HR: etapy i terminy wszystkich procesów | — | tak | — | — | — |
| Zakładanie procesu oceny | — | tak | — | — | — |
| Przypomnienia dla oceniających | — | tak (symulacja) | — | — | — |
| Asystent formalny (odpowiedzi ze źródłami) | tak | tak | tak | tak | tak |
| Zapoznanie się z oceną, złożenie sprzeciwu | — | — | tak | — | — |
| Rozpatrzenie sprzeciwu | — | — | — | — | tak |
| Nadawanie i odbieranie ról | — | tak (administrator) | — | — | — |

## Co trzeba zrobić przed wdrożeniem

1. **Prawdziwe uwierzytelnianie.** Logowanie przez system urzędu (np. Active Directory / Entra ID przez
   OpenID Connect albo SAML), bez własnych haseł w aplikacji; wieloskładnikowe uwierzytelnianie zgodnie z polityką urzędu.
2. **Bezpieczna sesja.** Cookie `HttpOnly`, `Secure`, `SameSite=Lax`, podpisane lub szyfrowane, z krótkim czasem
   życia i wylogowaniem. Rola pochodzi z grup w katalogu / systemu kadrowego – **nie z wyboru użytkownika**, jak w prototypie.
3. **Autoryzacja po stronie serwera.** Każdy endpoint API i każda akcja serwera sprawdza rolę i zakres danych.
   Proxy zostaje tylko wstępnym filtrem przekierowań – dokumentacja Next.js wprost odradza traktowanie go
   jako jedynej ochrony.
4. **Dane w bazie, nie w przeglądarce.** Oceny przenieść z `localStorage` do bazy urzędu. Zakres widoczności
   na poziomie zapytań (przełożony – tylko swoi podwładni, wg relacji z systemu kadrowego), szyfrowanie,
   kopie zapasowe, okres przechowywania.
5. **Logi dostępu.** Kto, kiedy otworzył, zmienił lub wydrukował ocenę; zmiany ról; odmowy dostępu.
   Logi chronione przed modyfikacją i przeglądane okresowo.
6. **Zarządzanie rolami.** Nadawanie i odbieranie ról przez administratora, okresowy przegląd uprawnień,
   zastępstwa (np. nieobecność przełożonego).
7. **Ochrona danych osobowych.** Minimalizacja danych (już teraz do AI nie trafiają imię i nazwisko), analiza
   ryzyka i zgodność z polityką bezpieczeństwa informacji urzędu.

## Pliki

| Plik | Co robi |
|---|---|
| `src/proxy.ts` | ochrona `/hr` (matcher `"/hr"`, `"/hr/:path*"`) |
| `src/features/role/rola.ts` | nazwa cookie, lista ról, chronione ścieżki, bezpieczny adres powrotu |
| `src/features/role/role.ts` | `ROLE` – opisy ról i uprawnień pokazywane w aplikacji |
| `src/features/role/use-rola.ts` | `useRola()`, zapis i usunięcie roli w przeglądarce |
| `src/features/role/rola-w-naglowku.tsx` | `<RolaWNaglowku />` do nagłówka |
| `src/app/logowanie/page.tsx` | strona wyboru roli |
