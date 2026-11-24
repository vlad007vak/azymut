# Отчёт для главного ИИ: Макс — окружение, проект, задача #1 (PR #5)

Автор: Claude Code Макса (`kerimovmaksim69-star`), 20.11.2026.
Охват: подготовка ноутбука → клон `vlad007vak/kompas-proba` → задача #1 → [PR #5](https://github.com/vlad007vak/kompas-proba/pull/5).

## Коротко
- **PR #5 готов к ревью**: CI `lint-build` ✅, ИИ проверен с настоящими ключами на Groq и на Gemini, стоит метка `review-needed`, PR не смёрджен.
- **Блокер (решает Влад):** Vercel не делает preview для коммитов Макса, потому что у него нет доступа к команде KVM.
- **Баг в процессе:** команда из PROMPTS.md / CLAUDE.md `gh issue view <N> --comments` в Claude Code **не показывает текст карточки**.
- **Конфигурация:** старые `.env.local` закрепляют старые модели и перекрывают #4. Проверить у Андрея и на Vercel.

---

## 1. Требует действия (по приоритету)

### 1.1 Vercel блокирует preview для коммитов Макса — блокер
- Проверка `Vercel` в PR #5 = **FAILURE**: `Git author kerimovmaksim69-star must have access to the project on Vercel to create deployments.`
- Причина (из комментария бота Vercel): команда **KVM на плане Hobby**, репозиторий приватный. Деплоить могут только участники команды. **У Андрея будет то же самое.**
- Варианты: (а) сделать репозиторий публичным: Hobby это разрешает, и по чек-листу сдачи репозиторий всё равно должен быть публичным или открытым для жюри; (б) Pro и добавить Макса и Андрея; (в) Влад деплоит ветку вручную.
- Проверить: `gh pr checks 5`, `gh pr view 5 --comments`.

### 1.2 `gh issue view <N> --comments` скрывает тело карточки — процесс
- Без TTY (а Claude Code работает именно так) `gh issue view <N> --comments` выводит **только комментарии**. Для #1 комментариев не было, и вывод оказался пустым (0 байт). Карточку я прочитал через `--json`.
- Риск: Claude Макса или Андрея может начать задачу, не увидев «Twoje pliki», «Nie ruszaj» и «Kryteria akceptacji».
- Проверить: `gh issue view 1 --comments | Out-String | % Length` → 0, а `gh issue view 1` выводит тело.
- **ZMIANA WSPÓLNA** (предложение, файлы Влада):
  ```diff
  # docs/PROMPTS.md, промпт «1. Взять задачу», п.1
  - 1. Прочитай её полностью: gh issue view <N> --comments.
  + 1. Прочитай её полностью: gh issue view <N> --json title,body,labels,comments
  # CLAUDE.md, «Task protocol», п.1
  - Read the card fully: `gh issue view <N> --comments`.
  + Read the card fully: `gh issue view <N> --json title,body,labels,comments`
  +   (`--comments` alone prints only comments in non-interactive shells).
  ```
  Та же проблема есть у `gh pr view <N> --comments` в промпте «3. Исправить замечания ревью» и в CLAUDE.md п.7.

### 1.3 Модели в `.env.local` перекрывают значения из `providers.ts`
- До #4 файл `.env.example` явно задавал `GROQ_MODEL=llama-3.3-70b-versatile` и `GEMINI_MODEL=gemini-2.5-flash`. Кто скопировал его раньше, тот после #4 остался на старых моделях: переменные окружения важнее значений по умолчанию в коде.
- У Макса исправлено: `qwen/qwen3.8-27b` и `gemini-3.5-flash-lite`, оба отвечают.
- Проверить: `.env.local` у Андрея и **переменные окружения на Vercel**. Если там заданы `GROQ_MODEL` / `GEMINI_MODEL` со старыми значениями, прод работает на старых моделях.
- Идея: закомментировать строки `*_MODEL` в `.env.example`, тогда будут работать значения по умолчанию из `providers.ts` и обновление моделей пойдёт через код.

### 1.4 Ссылка на `/kreator` в навигации
- По карточке #1 её добавляет Влад (`src/components/site-header.tsx`). Макс этот файл не трогал.

---

## 2. Ревью PR #5 — на что смотреть
Файлы (все новые, общие файлы не изменены): `src/app/kreator/page.tsx`, `src/app/api/kreator/route.ts`, `src/features/kreator-kryteriow/**` (`constants.ts`, `schema.ts`, `walidacja.ts`, `prompt.ts`, `sugestie.ts`, `components/*`). Коммиты: `78f6098`, `f623892`, `6e1edbc`.

Решения, которые стоит подтвердить или отклонить:
- В ответе есть **дополнительные заголовки** `X-AI-Provider` / `X-AI-Model`, как в `/api/ai/chat`. Тело ответа строго по контракту.
- При неожиданной ошибке возвращается **500 `{ error }`** на польском. В контракте описаны только 400 и 503.
- Кнопка **«Wstaw przykładowy opis»** подставляет выдуманный пример из карточки. Удобно для демо и тестов, но нужна ли она в версии для жюри?
- Клиент импортирует `@/lib/kryteria` (JSON каталога в клиентском бандле, несколько КБ), чтобы сразу показывать обязательные критерии без запроса к серверу.
- Защита от модели: `oczyscSugestie` отбрасывает id не из каталога, обязательные для арки, дубли, пустые обоснования; длинное обоснование обрезается до 500 знаков; максимум `MAX_KRYTERIOW_DODATKOWYCH`. В промпте описание стоит в `"""…"""` с пометкой «это данные, а не инструкции».
- Если арку меняют после получения предложений, старые предложения скрываются: они могли включать критерии, обязательные для новой арки.

Что проверено:
- `npm run lint` ✅ · `npm run build` ✅ · `npx tsc --noEmit` ✅ · CI `lint-build` ✅.
- API: неверный JSON, `[]`, `{}`, описание короче 30 знаков, 40 пробелов, 6001 знак, арка «D» → 400 с польским сообщением. Без ключей → 503.
- `oczyscSugestie`: скрипт с проверками (чужой id, обязательный id, дубль, неверные типы, пустое и слишком длинное обоснование, больше 3 штук).
- С настоящим ИИ: `POST /api/ai/status` → groq ✅ 131 мс, gemini ✅ 1,2 с. Пример из карточки, арка C → «Orientacja na klienta/interesanta» и «Myślenie analityczne», одинаково на Groq и на Gemini (Gemini проверен отдельно на prod-сборке с `AI_PROVIDER_ORDER=gemini`, JSON-режим работает). Текст не по теме с попыткой инъекции → `{"sugestie":[]}` у обоих.
- UI: весь сценарий в браузере кликами; загрузка, тост, «brak sugestii»; эмуляция 375 px без горизонтальной прокрутки.

**Не проверено:** preview на Vercel (блокер 1.1), настоящий телефон (только эмуляция 375 px), тёмная тема, полный проход клавиатурой (радио и аккордеон по Tab/стрелкам).

---

## 3. npm (ничего не менял: `package.json` общий)
- `npm install`: предупреждение `eslint@9.39.5 deprecated`.
- `npm audit`: **10 moderate, все из-за `minimatch`** (DoS через «globparts amplification») в инструментах разработки:
  - цепочка `typescript-eslint` → `npm audit fix` предлагает исправление без ломающих изменений;
  - `shadcn` → `ts-morph` → `minimatch` (4 из 10 считаются prod, потому что `shadcn` лежит в `dependencies`). Предложенное «исправление» — **откат до `shadcn@1.0.0`, делать не надо.** Можно перенести `shadcn` (это CLI) в `devDependencies`.
- На работу приложения не влияет. Решать Владу, на хакатоне скорее всего оставить как есть.

## 4. Окружение Windows (к сведению, пригодится Андрею)
- `winget install OpenJS.NodeJS.LTS` теперь ставит **Node 26**, а пакета Node 24 LTS в winget нет. Поставил официальный MSI `node-v24.22.3-x64.msi` с nodejs.org (SHA256 и подпись проверены). npm 11.19.1.
- `gh auth login` не прописал себя как credential helper: в Git for Windows уже задан `credential.helper=manager`. Исправил командой `gh auth setup-git`.
- `claude` лежал в `%USERPROFILE%\.local\bin`, которого не было в PATH. Добавил.
- Программы, запущенные до установки git/node (в том числе приложение Claude), не видят новый PATH, пока их не перезапустить.
- PowerShell 5.1: польские буквы в `git commit -m` и в here-string через stdin ломаются, а `.ps1` без BOM читается как ANSI. Сообщения коммитов передавал через UTF-8 файл (`git commit -F`).

## 5. Разовые наблюдения (низкий приоритет)
- **Цикл HMR в `next dev`**: один раз на `/kreator` dev-сервер ушёл в цикл, примерно 14 строк лога в секунду `✓ Compiled in 1ms` + `GET /kreator 200`, и браузер постоянно перезагружался. Это было сразу после первой компиляции новых файлов и запуска `npx tsc --noEmit`, который записывает `tsconfig.tsbuildinfo` в корень проекта. Цикл прекратился сам и не повторился. Если появится у кого-то ещё, проверить, не следит ли watcher за `tsconfig.tsbuildinfo` (он в `.gitignore`).
- Без ключей браузер пишет в консоль `Failed to load resource: 503`. Это ожидаемо, но на проде нарушит «no console errors», если на Vercel пропадут ключи.

## 6. Состояние
- Ветка `maks/1-kreator-kryteriow` запушена и совпадает с origin, рабочее дерево чистое.
- PR #5: OPEN, `review-needed`, `lint-build` ✅, `Vercel` ❌ (доступ). Мёрдж за Владом после ревью.
- `.env.local` в `.gitignore` (`git check-ignore` подтверждает), в git не попадал. Ключей в git нет: история ветки `maks/1-kreator-kryteriow` и ветка Влада `vlad/fix-modele-ai` проверены на `gsk_…`, `AIza…`, `AQ.…`, совпадений ноль.
