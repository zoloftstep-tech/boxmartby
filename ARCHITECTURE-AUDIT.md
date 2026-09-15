# Аудит архитектуры — Boxmart Site (`boxmartby`)

**Дата аудита (snapshot):** 2026-08-31  
**Статус follow-up:** 2026-09-15 (см. блок ниже)  
**Объект:** репозиторий `/Users/rostislav/Documents/Cursor Projects/Boxmart Site`  
**Ограничения аудита:** только чтение кода на дату snapshot; значения секретов не приводятся.

---

## Status 2026-09-15 (не переписывать snapshot ниже)

| Finding (аудит 08-31) | Статус | Где |
|------------------------|--------|-----|
| Подмена цены в `submit-order` | **Closed** | server re-quote remote BoxCalc; client prices ignored |
| Hardcoded `CRM_INGEST_URL` fallback | **Closed** | env required → 503 |
| `MATERIAL_PRICES` / costs в client bundle | **Closed** | `pricing/public.ts` + DTO; `test:public-catalog-leak` |
| Пустые labels в CRM invoice | **Closed** | `enrichQuotedItems` |
| Min qty 15 только UI | **Open** | ещё нет server check на submit |
| Rate limit calculate/submit | **Open** | — |
| UI `/api/calculate` local-fallback policy | **Open** | submit уже remote-only; UI может fallback |
| README / HANDOFF drift | **Closed** | docs sync 2026-09-15 |
| No CI workflows | **Open** | — |

Актуальное описание системы: [`HANDOFF.md`](HANDOFF.md), [`OPS.md`](OPS.md). Текст §1–§13 ниже — **исторический snapshot** аудита; отдельные пункты P1 могут быть уже закрыты (см. таблицу).

---

# 1. Краткое резюме

- **Стек:** Next.js **15** (App Router) + React **19** + TypeScript + Tailwind CSS **v4** + nodemailer; деплой на **Vercel** (Root Directory `web`, `vercel.json` → `"framework": "nextjs"`). Отдельной БД в этом репозитории **нет**.
- **Тип архитектуры:** **Next.js full-stack monolith / serverless** на одном деплое: RSC-страницы витрины + клиентский калькулятор + Route Handlers (`web/src/app/api/*`) как backend BFF. Не SPA-only и не отдельный frontend/backend-репозиторий. Часть бизнес-логики цен делегирована внешнему **BoxCalc**; заказы — внешнему **CRM**.
- **Запуск frontend/backend:** оба в одном процессе Next.
  - Локально: `cd web && npm run dev` → `next dev` (UI + API на одном origin).
  - Prod: `next build` / `next start` на Vercel Functions для API routes + cron `GET /api/cron/pricing-contract` (`0 6 * * *` UTC).
- **Данные и интеграции:**
  - **Данные цен/каталога:** не в Site DB; SoT — BoxCalc `org_settings` после Publish → Site тянет `GET …/api/defaults` (`getLivePricingConfig` в `web/src/lib/pricing/remote-defaults.ts`), кэш ~60 с.
  - **Расчёт цены:** Site `POST /api/calculate` → proxy BoxCalc `POST /api/calculate` (Bearer `CALCULATOR_DEFAULTS_API_KEY`); при сбое — local fallback `calculateItems` (`web/src/lib/pricing/calculate.ts`) или 503 для custom blank types.
  - **Заказы:** `POST /api/submit-order` → CRM `CRM_INGEST_URL` + `INGEST_SITE_SECRET` + `Idempotency-Key`; email через Gmail SMTP (`sendEmailNotification`); Telegram на Site только ops-alert (`sendTelegramAlert`), не заказные статусы.
  - **Публичный клиент:** Google tag (`NEXT_PUBLIC_GTAG_*`), cookie consent.

---

# 2. Карта проекта

| Папка или файл | Роль | Где исполняется | Почему так определено | Связи |
|----------------|------|-----------------|----------------------|-------|
| `web/src/app/page.tsx`, `layout.tsx`, `*/page.tsx` (лендинги, `/spasibo`) | frontend | Server (RSC) + HTML | Нет `"use client"`; композиция секций | → `components/sections/*`, `Calculator` |
| `web/src/components/Calculator.tsx`, `CalculatorForm.tsx`, `OrderModal.tsx`, `sections/Header.tsx`, `Faq.tsx`, `CookieConsent.tsx`, `GoogleAnalytics.tsx` | frontend | Browser (Client Components) | Директива `"use client"`; state/hooks/fetch | → `@/lib/api` (browser → same-origin API) |
| `web/src/components/calculator-draft.ts` | shared | Browser (+ импорт из client) | Чистые хелперы draft/payload/min qty; без Node API | Calculator / OrderModal |
| `web/src/app/api/calculate/route.ts` (`POST`) | backend | Vercel/Node Route Handler | `NextRequest`/`NextResponse`; server `fetch` к BoxCalc; `process.env` | → `validateItem`, `getLivePricingConfig`, `proxyToBoxCalc`, `calculateItems` |
| `web/src/app/api/live-catalog/route.ts` (`GET`) | backend | Server | Отдаёт каталог без формул/себестоимости в UI-форме | → `getLivePricingConfig`, `materialsListFromPricing` |
| `web/src/app/api/submit-order/route.ts` (`POST`) | backend + integration | Server | Origin check, валидация контакта, CRM ingest, email | → `ingestToCrm`, `sendEmailNotification`, `buildSiteIdempotencyKey` |
| `web/src/app/api/health/route.ts` (`GET`) | backend | Server | Публичный probe без секретов в теле | → `runHealthChecks` |
| `web/src/app/api/cron/pricing-contract/route.ts` (`GET`) | backend + integration | Server (cron) | Bearer `CRON_SECRET`; TG alert при fail | → `runPricingContractCheck`, `sendTelegramAlert` |
| `web/src/lib/pricing/*` | shared / backend | Server (API + scripts); формулы также как fallback | Импортируется Route Handlers и `tsx` tests; **не** импортируется напрямую в `"use client"` для расчёта цены (клиент зовёт `/api/calculate`) | BoxCalc mirror / fallback |
| `web/src/lib/api.ts` | frontend | Browser | `fetch("/api/…")` без server secrets | Calculator, OrderModal |
| `web/src/lib/notifications.ts` | integration | Server | `nodemailer`, Telegram Bot API, `process.env.GMAIL_*` / `TELEGRAM_*` | submit-order, cron |
| `web/src/lib/idempotency.ts` | shared / backend | Server (+ unit script) | `crypto.createHash` — Node | submit-order |
| `web/src/lib/health-checks.ts`, `pricing/pricing-contract.ts` | backend / tests | Server + CLI | Live HTTP к BoxCalc/Site | health, cron, scripts |
| `web/src/lib/site.ts`, `landings.ts`, `types.ts` | shared / frontend content | Build + RSC / types | Контент SEO/FAQ/лендинги; типы контрактов | pages, JsonLd |
| `web/src/app/robots.txt/route.ts`, `sitemap.ts` | frontend / config | Server | SEO routes | Content Signals |
| `web/scripts/test-*.ts` | tests | CLI (`tsx`) | `npm test` в `package.json` | pricing, blank-types, idempotency, health, contract |
| `web/package.json`, `next.config.ts`, `vercel.json`, `eslint.config.mjs`, `tsconfig.json` | config | Build/CI/deploy | Next/Vercel/ESLint | — |
| `web/.env.example` | config | Документация env | Имена переменных без значений prod | OPS / DEPLOY |
| `OPS.md`, `HANDOFF.md`, `DEPLOY.md`, `BoxMart-*-TZ.md` | config / docs | Документация | Операционный паспорт платформы | BoxCalc + CRM |
| `web/public/*` | frontend | CDN/static | Статика логотипы/каталог/docs | — |
| Root `.env.local`, `web/.env.local` | config (local secrets) | Local only | В `.gitignore`; **не коммитить** | — |
| ORM / миграции / Prisma | unknown | — | **В репозитории отсутствуют** | Данные во внешних системах |
| `middleware.ts` | unknown | — | **Отсутствует** — нет edge middleware auth/rate-limit | — |
| `.github/workflows` | unknown | — | **CI workflows в репо не найдены**; тесты — локально/ручные | — |

---

# 3. Потоки данных

## Поток A — Онлайн-расчёт цены

Пользователь → `Calculator` / `CalculatorForm` (`"use client"`) → debounce → `calculateQuote` (`web/src/lib/api.ts`) → `POST /api/calculate` (`route.ts` `POST`) → `validateItem` + `getLivePricingConfig` → **предпочтительно** `proxyToBoxCalc` (BoxCalc `/api/calculate`) → иначе `calculateItems` (local) или **503** для custom `formulaTypeId` → JSON `CalcResponse` + заголовок `X-Pricing-Source` → UI Results.

## Поток B — Каталог марок / штанцформ / blankTypes

Пользователь открывает калькулятор → `fetchLiveCatalog` → `GET /api/live-catalog` → `getLivePricingConfig` (BoxCalc `/api/defaults` или local `pricing-config`) → `{ ourDies, materials[{id,label,isReference}], blankTypes }` **без** `costPerSqM` в UI-списке (`materialsListFromPricing`) → селекты в Form.

## Поток C — Оформление заявки

Пользователь → `OrderModal.onSubmit` → клиентская валидация телефона/согласия/min qty → `submitOrder` + `Idempotency-Key: site:uuid` → `POST /api/submit-order` → `isAllowedOrigin` → валидация name/phone/consent/items → `ingestToCrm` (CRM `/api/ingest/site`) → `buildMessageText` + `sendEmailNotification` (Gmail) → `{ status, order_id }` → `router.push("/spasibo")` (+ Ads conversion на странице).

## Поток D — Мониторинг цен (cron)

Vercel Cron → `GET /api/cron/pricing-contract` + `Authorization: Bearer CRON_SECRET` → `runPricingContractCheck` (BoxCalc calculate + опционально Site proxy) → при fail `sendTelegramAlert` → JSON `{ ok, reasons, notified }`.

Если поток «прямое обращение браузера к БД Site» — **не найден** (БД в репо нет). Проверять: CRM/BoxCalc репозитории.

---

# 4. Ответственность слоёв

| Функция или модуль | Сейчас находится | Должен находиться | Оценка | Причина и риск |
|--------------------|------------------|-------------------|--------|----------------|
| `POST` `web/src/app/api/calculate/route.ts` + `proxyToBoxCalc` | backend BFF | backend BFF | OK | Секрет BoxCalc только на сервере; клиент бьёт same-origin |
| `calculateItems` / `blankAreaForFormula` (`pricing/calculate.ts`, `fefco-formulas.ts`) | backend fallback (+ тесты) | backend fallback (осознанный) | желательно улучшить | Дубль формул с BoxCalc; drift → расхождение цен при `local-fallback` |
| `validateItem` | backend | backend | OK | Серверная валидация входа calculate |
| `MIN_POSITION_QUANTITY` в `calculator-draft.ts` | frontend only | backend (+ frontend UX) | желательно улучшить | Min 15 шт можно обойти прямым `submit-order` |
| `OrderModal` → `items: results` / `summary` в CRM | frontend формирует сумму | backend должен пересчитать или пометить «quote from calculate» | критично перенести / ужесточить | Клиент может подменить `price_per_unit_no_vat` / totals в теле заявки |
| `submit-order` `isAllowedOrigin` | backend | backend | OK | CSRF-подобная защита Origin; нет Origin в prod → 403 |
| `INGEST_SITE_SECRET` / `CALCULATOR_DEFAULTS_API_KEY` / Gmail / TG | server env | server env | OK | Не в `NEXT_PUBLIC_*`; `.env.local` в gitignore |
| `materialsListFromPricing` | backend → frontend catalog | backend | OK | Себестоимость м² **не** отдаётся в live-catalog UI |
| `sendEmailNotification` / `sendTelegramAlert` | integration на Site | integration (Site или CRM) | OK | Email после CRM; TG заказов — CRM (по HANDOFF) |
| `runHealthChecks` / pricing-contract cron | backend ops | backend ops | OK | Без секретов в health body |
| SEO/лендинги `landings.ts` | shared content | content layer | OK | Нет смешения с ценами |
| Rate limiting `/api/calculate`, `/api/submit-order` | отсутствует | backend/edge | желательно улучшить | Публичный abuse / spam заявок |
| Auth / роли на Site | отсутствует | N/A для витрины | OK | Публичный сайт; auth в BoxCalc/CRM |
| Server Actions | не используются | не обязательны | OK | Паттерн Route Handlers достаточен |
| Прямой доступ frontend → DB | не найден | запрещён | OK | — |

---

# 5. Риски безопасности и надёжности

## P1

1. **Подмена цены в заявке**  
   - **Путь:** `OrderModal.onSubmit` → `items: results`, `summary`; `submit-order/route.ts` принимает `order.items` / `order.summary` без повторного `calculate`.  
   - **Что происходит:** сервер валидирует контакты и наличие массива, но не пересчитывает стоимость.  
   - **Сценарий:** злоумышленник POST с заниженными `price_per_unit_no_vat` → в CRM/email уходит ложный quote (менеджер может не заметить).  
   - **Исправление:** на submit пересчитать по `length/width/height/qty/category/material/formulaTypeId/dieId` через тот же calculate/BoxCalc **или** передавать в CRM только dimensions + server-side quote snapshot; цены из клиента игнорировать.  
   - **Размер:** **M**.

2. **Min тираж 15 только на клиенте**  
   - **Путь:** `calculator-draft.ts` `MIN_POSITION_QUANTITY` / `hasQuantityBelowMinimum`; в `submit-order` проверки qty≥15 нет.  
   - **Сценарий:** API-заявка с qty=1 обходит UI.  
   - **Исправление:** дублировать правило в `submit-order` (и при желании в calculate).  
   - **Размер:** **S**.

3. **Нет rate limit на публичные API**  
   - **Путь:** `calculate/route.ts`, `submit-order/route.ts`.  
   - **Сценарий:** flood расчётов (нагрузка на BoxCalc) или спам заявок/email.  
   - **Исправление:** Vercel WAF / Upstash rate limit / простая IP-квота в route.  
   - **Размер:** **M**.

4. **Local-fallback ценообразования**  
   - **Путь:** `calculate/route.ts` при недоступности BoxCalc → `calculateItems` + `X-Pricing-Source: local-fallback`.  
   - **Сценарий:** пользователь видит цену по устаревшим локальным тарифам/формулам.  
   - **Исправление:** для prod жёстко 503 без remote (или баннер «ориентир»); уже есть отказ custom types (хорошо).  
   - **Размер:** **S–M**.

## P2

5. **Дублирование FEFCO/pricing с BoxCalc**  
   - **Путь:** `web/src/lib/pricing/*` vs boxcalculator.  
   - **Риск:** drift golden/fallback.  
   - **Исправление:** держать `npm test` lockstep; не расширять local formulas для custom; SoT remote (уже в OPS).  
   - **Размер:** **S** (процесс) / **L** (общий пакет — не сейчас).

6. **Хардкод дефолтного CRM URL**  
   - **Путь:** `submit-order/route.ts` fallback `https://boxmart-crm.vercel.app/api/ingest/site`; то же в `health-checks.ts`.  
   - **Риск:** неверный ingest при забытом env на staging.  
   - **Исправление:** требовать `CRM_INGEST_URL` в production без default.  
   - **Размер:** **S**.

7. **README устарел по уведомлениям**  
   - **Путь:** `web/README.md` всё ещё говорит «Telegram Bot API + Gmail» как Variant A для заказов; HANDOFF: TG заказных карточек Site не шлёт.  
   - **Риск:** путаница у агентов/людей.  
   - **Исправление:** синхронизировать README с HANDOFF.  
   - **Размер:** **S**.

8. **Нет CI в репозитории**  
   - **Путь:** отсутствует `.github/workflows`.  
   - **Риск:** `npm test`/`lint` не блокируют merge автоматически.  
   - **Исправление:** GitHub Action на push/PR.  
   - **Размер:** **S**.

## P0

**По коду этого репозитория критичных P0 (секреты в git, прямой доступ к чужим данным через Site DB, SQL-инъекции) не выявлено.**  
Секреты ожидаются в env; `.env.local` игнорируется gitignore. Публичные `NEXT_PUBLIC_GTAG_*` — норма для Ads.

*(Ручная проверка: что `.env.local` никогда не попадал в историю git / Vercel logs — вне scope статического аудита.)*

---

# 6. План действий

## 1. Быстрые исправления (до 1 дня)

- Серверная проверка `quantity >= 15` (и согласованности items) в `submit-order`.
- Обновить `web/README.md` под Phase H (TG только pricing alert).
- Prod: запретить hardcode CRM URL без env; fail fast если нет `INGEST_SITE_SECRET`.
- Smoke-чеклист из OPS: `/api/health`, `X-Pricing-Source: remote`.

## 2. Улучшения на 2–5 дней

- **Пересчёт цены на submit** (или отказ принимать money fields от клиента) — главный архитектурный hardening.
- Rate limiting на `/api/calculate` и `/api/submit-order`.
- GitHub Action: `npm test && npm run lint` в `web/`.
- Политика fallback: в production при недоступности BoxCalc → 503 вместо тихого local price (кроме явного feature-flag).

## 3. Архитектурные изменения позже

- Не выносить microservice pricing «ради чистоты» (согласовано с OPS decision log).
- При росте: shared contract-пакет типов `CalcItem*` Site↔BoxCalc↔CRM; не общий runtime ORM.
- Опционально: edge middleware только для rate-limit/security headers — не обязателен сейчас.
- Не возвращать Optopak/status webhooks на Site (HANDOFF).

**Переписывать проект с нуля не нужно:** текущий Next BFF + внешние SoT (BoxCalc/CRM) соответствуют масштабу витрины.

---

# 7. Вопросы и неопределённости

### Нельзя подтвердить только по этому репо

- Фактические значения и ротация секретов в Vercel Production.
- Поведение CRM ingest при подменённых ценах (отклоняет ли / логирует ли).
- Полный список `blankTypes`/`cardTypes` в live org (меняется Publish’ем).
- Нагрузка и лимиты BoxCalc API.
- Есть ли WAF/rate limit на стороне Vercel вне репо.

### Проверить вручную

| Что | Зачем |
|-----|--------|
| Vercel Site env: `CALCULATOR_*`, `CRM_INGEST_URL`, `INGEST_SITE_SECRET`, `ALLOWED_ORIGIN(S)`, `CRON_SECRET`, Gmail, TG | Совпадение с BoxCalc/CRM |
| `GET /api/health` → `ok: true` | Готовность upstream |
| `POST /api/calculate` header `X-Pricing-Source` | remote vs fallback |
| CRM: double-submit с одним Idempotency-Key | нет дублей BM |
| Git history на утечки `.env` | ротация при инциденте (HANDOFF упоминал) |

### Предположения

1. Prod деплой соответствует ветке `main` и Root Directory `web`.
2. Менеджеры **не** считают сумму из заявки юридически финальной без сверки в CRM/BoxCalc (смягчает риск подмены цены, но не отменяет hardening).
3. Копии `OPS.md` в BoxCalc синхронизированы с прочитанной (дата в файле 2026-08-25).
4. Отсутствие middleware — осознанный минимализм, не упущение auth (сайт публичный).

---

## Оценка зрелости (1–5)

| Область | Оценка | Комментарий |
|---------|--------|-------------|
| **frontend** | **4** | Чистый App Router + split Calculator; хорошая UX-валидация; мало клиентской бизнес-логики цен |
| **backend** | **4** | Тонкий BFF, чёткие Route Handlers, health/cron; нет своей БД (и не нужна) |
| **безопасность** | **3** | Секреты на сервере, Origin check, idempotency; минус trust client prices, нет rate limit, min qty только UI |
| **тестирование** | **4** | Golden pricing, blank-types, idempotency, health mocks, contract-calculate; нет e2e/CI в репо |
| **документация** | **5** | `OPS.md` + `HANDOFF.md` + `DEPLOY.md` + `.env.example` — выше среднего для такого масштаба |
| **сопровождаемость** | **4** | Плоская структура, понятные SoT, малый surface API; риск — drift fallback pricing и устаревание README |

---

# 8. Аудит смешения frontend / backend (2026-08-31)

**Область:** только границы client ↔ server в этом репозитории. Код не менялся в рамках анализа; раздел добавлен к отчёту по запросу.

Проверены критерии: секреты в браузере; критичные значения с клиента; client-only валидация; доверие API к полям прав/цены; прямой UI→БД/секрет; дубль формул; импорт server в `"use client"`.

## Таблица находок

| Приоритет P0/P1/P2 | Файл и функция | Текущая проблема | Возможная атака/ошибка | Куда перенести или как исправить | Размер S/M/L |
|--------------------|----------------|------------------|------------------------|----------------------------------|--------------|
| **P1** | `OrderModal.onSubmit` (`web/src/components/OrderModal.tsx`) → `POST` `web/src/app/api/submit-order/route.ts` | Клиент отправляет уже посчитанные `items[].price_per_unit_no_vat`, `total_price_no_vat` и `summary.total_*`; сервер проверяет только name/phone/consent/наличие массива, **цены не пересчитывает** | Подмена суммы в CRM/email через прямой POST | На `submit-order`: принимать габариты/qty/material/category/formulaTypeId/dieId, вызвать тот же путь что `calculate` / BoxCalc, в CRM класть server quote; money-поля с клиента игнорировать | **M** |
| **P1** | `hasQuantityBelowMinimum` / `MIN_POSITION_QUANTITY` в `web/src/components/calculator-draft.ts`; отсутствует аналог в `submit-order/route.ts` | Min 15 шт только в UI/OrderModal; API заявки правило не enforcement | Заявка с `quantity: 1` в обход UI | Дублировать проверку в `submit-order` (и опционально в `calculate`) | **S** |
| **P1** | `MATERIAL_PRICES` в `web/src/lib/pricing/pricing-config.ts` импортируется в `calculator-draft.ts` → в клиентский бандл через `Calculator` (`"use client"`) | В браузер попадают `costPerSqM` (и при полном модуле — соседние константы тарифов из того же файла, если не вырезаны tree-shake) | Утечка себестоимости/внутренних тарифов fallback; облегчает подбор атак на quote | Клиенту отдавать только `{id,label,isReference}` (как `live-catalog`); `costPerSqM` / `QTY_TIERS_OPT` не импортировать в client entry | **S** |
| **P2** | `GoogleAnalytics.tsx`, `AdsConversionEvent.tsx` — `process.env.NEXT_PUBLIC_GTAG_*` (+ hardcoded fallback ID) | Публичные идентификаторы Ads в клиенте | Не секрет; возможен только «шум» аналитики | Оставить как есть; fallback ID лучше только из env без дубля в коде (гигиена) | **S** |
| **P2** | `FEFCO_TYPE_CATALOG` / `blankTypesForCategory` в `fefco-catalog.ts` + fallback в `calculator-draft.ts` vs серверные формулы в `fefco-formulas.ts` + BoxCalc | Метаданные blank types дублируются на клиенте как fallback; **формулы f1/f2 на клиент не импортируются** (barrel `@/lib/pricing` помечен client-safe) | Устаревший список типов при offline fallback; не подмена площади (площадь считает server/BoxCalc) | Ок как UX fallback; не добавлять `fefco-formulas` в client imports | **S** (процесс) |
| **P2** | Дубль расчёта: BoxCalc SoT + local `calculateItems` (`pricing/calculate.ts`) на **сервере** Site | Не client/server mix внутри браузера, но два server SoT при fallback | Расхождение цены при `X-Pricing-Source: local-fallback` | Prod: 503 без remote; держать golden tests | **S–M** |
| — | Прямой UI → БД / UI → Telegram/Gmail/BoxCalc с секретом | **Не найдено** | — | Клиент зовёт только `fetch("/api/…")` в `web/src/lib/api.ts` | — |
| — | API принимает `userId` / `role` / `organisationId` и доверяет | **Не найдено** на Site | — | Публичная витрина без ролей | — |
| — | Импорт `notifications.ts` / `idempotency.ts` / `calculate.ts` / `remote-defaults.ts` в `"use client"` | **Не найдено** | — | `web/src/lib/pricing/index.ts` явно без server modules; routes импортируют `calculate.ts` напрямую | — |

### По критериям (сводка)

1. **Секреты/ключи/служебные URL в браузере:** секреты API (`CALCULATOR_DEFAULTS_API_KEY`, `INGEST_SITE_SECRET`, Gmail, TG, `CRON_SECRET`) — только server routes/`notifications`/`remote-defaults`. В браузере — `NEXT_PUBLIC_GTAG_*` (ожидаемо) и **внутренние `costPerSqM` через `MATERIAL_PRICES`**.
2. **Фронт задаёт цену/статус/роль:** цену для UI получает с `/api/calculate`; **в заявку снова кладёт эти money-поля без server re-quote**. Статус заказа / роль / organisationId клиент не назначает.
3. **Client validation без server:** phone, name, `personalDataConsent` — есть на обоих; **min qty 15 — только client**.
4. **Доверие API к price/role/userId:** доверяет **price/totals** в теле order; userId/role/organisationId нет.
5. **UI с секретным ключом к внешнему сервису:** нет.
6. **Дубль бизнес-формул client/server:** формулы площади **не** на клиенте; на клиенте каталог meta + costs fallback; полный calculate — server (+ дубль с BoxCalc).
7. **Server в client по ошибке:** barrel pricing разделён; nodemailer/`createHash` в client не тянутся.

## Целевая схема потока данных

```text
Browser (Calculator / OrderModal)
  │  только: dimensions, category, material, formulaTypeId|dieId, qty, контакты
  │  fetch same-origin /api/*  — без секретов
  ▼
Next Route Handlers (BFF)
  │  calculate: validate → BoxCalc Bearer (env) → prices
  │  submit-order: Origin check → validate contacts + min qty
  │                → re-calculate quote server-side
  │                → CRM ingest (INGEST_SITE_SECRET) + email (Gmail env)
  ▼
BoxCalc (SoT цен)     CRM (SoT заказов)     Gmail / TG alert (ops)
```

Браузер **никогда** не является источником истины для money fields и не вызывает BoxCalc/CRM/Telegram напрямую.

## 5 самых важных исправлений (по приоритету)

1. **Server-side re-quote на `submit-order`** — не принимать `price_*` / `summary` от клиента (`OrderModal.tsx` + `submit-order/route.ts`).
2. **Серверный min qty ≥ 15** — зеркало `MIN_POSITION_QUANTITY` из `calculator-draft.ts` в `submit-order/route.ts`.
3. **Убрать `MATERIAL_PRICES` (с `costPerSqM`) из client import path** — `calculator-draft.ts` должен использовать публичный каталог без себестоимости.
4. **Rate limit** на `POST /api/calculate` и `POST /api/submit-order` (сейчас любой origin-allowed клиент может flood’ить BFF/BoxCalc).
5. **Prod-политика без тихого local price** при недоступности BoxCalc (уже частично: 503 для custom blank; расширить на обычный calculate или явный banner) — файл `calculate/route.ts`.

Обоснование только файлами этого репо: пункты 1–3 и 5 привязаны к путям выше; пункт 4 — к отсутствию ограничений в тех же route handlers.

---

# 9. Security-аудит (2026-08-31)

**Объект:** только репозиторий Boxmart Site (`web/` + корневые docs).  
**Не изменялся код** при подготовке раздела; значения секретов **не** приводятся.

## 1. Краткое резюме

- **Стек:** Next.js 15 App Router (RSC + Client Components) + Route Handlers на Vercel; **своей БД/ORM/auth в репо нет**.
- **Модель авторизации на Site:** **отсутствует** (публичная витрина). Нет ролей пользователя сайта, нет session/JWT/cookie-auth для посетителей. Защищены только служебные вызовы: cron (`CRON_SECRET`), исходящие вызовы к BoxCalc/CRM с server env secrets.
- **Хранение сессии:** не применимо для end-user auth. Cookie consent хранится в **localStorage** (`web/src/lib/cookie-consent.ts`) — только UX для Google tags, не auth-токен.
- **Общая оценка риска для этого репо:** **средний** (нет auth-bypass к чужим аккаунтам на Site, но есть подмена quote в заявке, публичные write/calculate без rate limit, инцидент утечки `CRON_SECRET` в git history).
- **Пять наиболее опасных находок:**
  1. Подмена money-полей в `POST /api/submit-order` (клиентские цены уходят в CRM).
  2. Утечка типа секрета `CRON_SECRET` в git history `.env.example` (нужна ротация, если ещё не сделана).
  3. Нет rate limiting на `calculate` / `submit-order` (spam / DoS upstream).
  4. Min тираж 15 только на клиенте.
  5. В клиентский бандл попадают `costPerSqM` из `MATERIAL_PRICES` (утечка внутренних тарифов fallback).

## 2. Карта доверия и данных

| Компонент или маршрут | Frontend/backend | Кто вызывает | Какие данные принимает | Какие данные/действия защищает | Как сейчас проверяется |
|-----------------------|------------------|--------------|------------------------|--------------------------------|------------------------|
| `POST /api/calculate` `route.ts` `POST` | backend | Браузер (`calculateQuote`) | items: dims, qty, category, material, dieId?, formulaTypeId? | Цена (через BoxCalc/local) | `validateItem`; **без** user auth; секрет BoxCalc только server→BoxCalc |
| `GET /api/live-catalog` | backend | Браузер | — | Каталог ourDies/materials/blankTypes (без cost в UI list) | Публичный; defaults с server Bearer |
| `POST /api/submit-order` `POST` | backend | Браузер (`submitOrder`) | name, phone, email?, comment?, personalDataConsent, **items+summary (с ценами)** | Создание заказа в CRM + email | Origin allowlist; phone/name/consent; **цены не пересчитываются**; Idempotency-Key |
| `GET /api/health` | backend | Мониторинг/публично | — | Готовность upstream | Без секретов в ответе; ingest probe с **невалидным** Bearer |
| `GET /api/cron/pricing-contract` | backend | Vercel Cron | Authorization Bearer | Contract check + TG alert | `authorizeCron` ↔ `CRON_SECRET` |
| `Calculator` / `OrderModal` | frontend | Пользователь | Формы | UX only | Клиентская валидация; цены с API |
| CRM / BoxCalc / Gmail / Telegram | integration (server) | Site server | см. env | Внешние SoT | Secrets в `process.env`; не в `NEXT_PUBLIC_*` |

## 3. Матрица ролей

**На Site ролей end-user / admin / manager не найдено** — нет login, session, `isAdmin`, `permissions`, tenant/organisation в коде `web/src`.

| «Роль» | Доступные действия на Site |
|--------|----------------------------|
| Анонимный посетитель | Читать витрину; `GET live-catalog`; `POST calculate`; `POST submit-order` (с Origin); `GET health` |
| Vercel Cron / ops с `CRON_SECRET` | `GET /api/cron/pricing-contract` |
| Server process (env) | Исходящие BoxCalc/CRM/Gmail/TG |

**Дыры относительно классической RBAC:** не применимы к витрине; **нельзя** повысить роль через API Site — полей role/isAdmin **нет**. Проверки «менеджер А не видит заказ менеджера Б» относятся к **CRM**, не к этому репо (нужно аудитить CRM отдельно).

## 4. Уязвимости и риски

| Приоритет | Категория | Файл:строка/функция | Что происходит | Реальный сценарий атаки/ошибки | Конкретное исправление | Размер S/M/L |
|-----------|-----------|---------------------|----------------|--------------------------------|------------------------|--------------|
| **P0** | Утечка секрета (история git) | Коммит `fb8cb59` → правка `web/.env.example`; удаление `d0bb5d8` («Remove accidental CRON_SECRET») | В историю попало значение `CRON_SECRET` (тип: shared secret cron Bearer). В текущем `.env.example` — только комментарий `# CRON_SECRET=` | Кто клонировал историю до/после может вызвать cron, спамить TG alerts / разведывать contract fail | Подтвердить ротацию `CRON_SECRET` в Vercel Site; отозвать старое значение; при необходимости `git filter` / считать секрет скомпрометированным | **S** (ops) |
| **P0** | Подмена итоговой цены в заявке | `OrderModal.onSubmit` → `items: results`, `summary`; `submit-order/route.ts` принимает body без re-calculate | CRM/email получают клиентские `price_per_unit_no_vat` / totals | Злоумышленник POST с заниженной суммой → ложный quote в CRM | Server re-quote по dimensions; money с клиента discard | **M** |
| **P1** | Нет server-side validation (qty) | `calculator-draft.ts` `MIN_POSITION_QUANTITY`; нет в `submit-order` | Min 15 только UI | Заявка с qty=1 | Валидация на сервере | **S** |
| **P1** | Нет rate limiting | `calculate/route.ts`, `submit-order/route.ts` | Публичные write/compute без лимита | Flood BoxCalc / spam заказов / email | Rate limit (Vercel/WAF/Upstash) по IP | **M** |
| **P1** | Утечка бизнес-данных на клиент | `pricing-config.ts` `MATERIAL_PRICES` ← `calculator-draft.ts` | `costPerSqM` в JS bundle | Утечка внутренних тарифов fallback | Не импортировать costs в client | **S** |
| **P1** | Mass assignment quote fields | `submit-order` → `ingestToCrm(crmOrder)` | Почти весь order (кроме consent) уходит в CRM | Подмена labels/цен/summary | Whitelist полей + server prices | **M** |
| **P1** | CSRF-like / Origin | `isAllowedOrigin` в `notifications.ts` | Prod требует Origin из allowlist; без Origin → forbid | При неверном `ALLOWED_ORIGIN` — ложные 403; при дыре в allowlist — CSRF-подобные POST с чужого origin | Держать точный Origin; SameSite не заменяет Origin check здесь (нет cookie-auth) | **S** |
| **P2** | Placeholder «секреты» в TZ docs | `BoxMart-Notifications-VariantA-TZ.md`, `BoxMart-API-TZ.md` | Примеры вида `TELEGRAM_BOT_TOKEN=123456789:ABC…` | Путаница / риск копипасты реальных значений в docs | Явно пометить FAKE; не класть prod secrets в md | **S** |
| **P2** | Local-fallback цены | `calculate/route.ts` | При падении BoxCalc — local `calculateItems` | Пользователь видит не org-цену | Prod 503 или явный disclaimer | **S–M** |
| **P2** | Hardcoded CRM URL fallback | `submit-order/route.ts`, `health-checks.ts` | Default ingest URL если env пуст | Staging пишет не туда / маскирует misconfig | Require env in production | **S** |
| **P2** | XSS через JSON-LD | `JsonLd.tsx`, `LandingContent.tsx` `dangerouslySetInnerHTML` + `JSON.stringify` | Статический контент из кода | При будущем user-generated HTML — риск; сейчас данные из `site.ts`/`landings.ts` | Ок; не вставлять сырой HTML пользователей | — |
| **P2** | Нет security/CI tests | нет `.github/workflows` | Тесты вручную `npm test` | Регрессии security не блокируют merge | CI + тесты re-quote / min qty | **S** |
| — | Auth / session / MFA / password | — | **не найдено** | — | — | — |
| — | SQL/NoSQL injection (Site DB) | — | **не найдено** (нет БД) | — | — | — |
| — | Webhook inbound на Site | — | **не найдено** (удалены Phase H) | — | — | — |
| — | SSRF по user URL | — | **не найдено** | — | — | — |
| — | Повышение роли через payload | — | **не найдено** | — | — | — |
| — | Tenant isolation на Site | — | **не найдено** (один бренд) | Аудит CRM | — | — |
| — | Журнал аудита ролей/цен на Site | — | **не найдено** (логи `console.*` только) | SoT настроек — BoxCalc | — | — |

**Финальные формулы цен на фронте:** площадь/coef **считаются на сервере** (`/api/calculate` → BoxCalc или `calculateItems`). Клиент **отображает** ответ API, но **повторно доверяет** этим числам при submit — это и есть главный security gap.

## 5. Конкретные исправления (P0/P1)

### P0 — Ротация `CRON_SECRET`
- **Патч:** ops, не код: сгенерировать новый secret (`openssl rand -hex 32`), обновить Vercel Site env, убедиться что cron ходит с новым Bearer; старый считать скомпрометированным.
- **Тесты:** ручной `curl` cron → 401 со старым, 200/JSON с новым.
- **Риск поломки:** низкий, если обновить env и cron вместе.
- **Порядок:** немедленно (если ротация после `d0bb5d8` не подтверждена).

### P0/P1 — Server re-quote на submit
- **Псевдокод** в `submit-order/route.ts` после валидации контактов:
  ```ts
  // Из order.items взять только length,width,height,quantity,category,material,dieId,formulaTypeId
  // const priced = await calculateItems(...) или proxyToBoxCalc(...)
  // crmOrder.items = priced.items; crmOrder.summary = priced.summary
  ```
- **Тесты:** `submit-order rejects / ignores client prices` — body с `price_per_unit_no_vat: 0.01`, в CRM/mock уходит server price.
- **Риск:** расхождение UI vs CRM при race тарифов; смягчить повторным calculate непосредственно перед ingest.
- **Порядок:** после фикса ротации secret; до публичных кампаний с большим трафиком.

### P1 — Min qty на сервере
- Проверка `quantity >= 15` для каждой позиции в `submit-order`.
- Тест: `submit-order returns 400 when quantity < 15`.
- Риск: низкий (UI уже блокирует).

### P1 — Убрать costs из client bundle
- В `calculator-draft.ts` не импортировать `MATERIAL_PRICES`; fallback labels из отдельного `materials-public.ts` без `costPerSqM`.
- Тест/проверка бандла: в client chunk нет строк `costPerSqM` из pricing-config (или snapshot import graph).

### P1 — Rate limit
- Middleware или обёртка на `calculate`/`submit-order` (IP + window).
- Тест: N+1 запрос → 429.

## 6. Security-тесты (предложения с именами)

Адаптировано под **фактическую** модель Site (без admin/session):

| Предложенное имя | Статус относительно Site |
|------------------|---------------------------|
| `anonymous can POST calculate without auth` | ожидаемо allowed (документировать) |
| `submit-order without allowed Origin returns 403` | добавить/есть логика `isAllowedOrigin` |
| `submit-order ignores client price_per_unit_no_vat and uses server quote` | **критичный новый** |
| `submit-order returns 400 when quantity below MIN_POSITION_QUANTITY` | **новый** |
| `submit-order returns 400 without personalDataConsent` | уже есть поведение |
| `cron/pricing-contract without Bearer returns 401` | покрыть unit/integration |
| `cron/pricing-contract with wrong secret returns 401` | то же |
| `live-catalog response materials have no costPerSqM field` | регрессия утечки |
| `health response does not embed API keys` | smoke |
| `user without role admin gets 403 on admin API` | **N/A на Site** — перенести в CRM/BoxCalc audit |
| `manager cannot read other manager order` | **N/A на Site** — CRM |
| `blocked user cannot use old session` | **N/A** — нет session |
| `login/reset-password brute-force protected` | **N/A** |
| `webhook without signature rejected` | **N/A** — inbound webhooks удалены |

## 7. План исправлений

1. **P0 до деплоя / немедленно:** подтвердить ротацию `CRON_SECRET`; server re-quote (или временный reject money-only tampering detection).
2. **P1 в неделю:** min qty server-side; убрать costs из client imports; rate limit; require `CRM_INGEST_URL` in production.
3. **P2 в месяц:** CI security/regression tests; политика local-fallback; вычистить/пометить fake tokens в TZ md; согласовать security-аудит CRM/BoxCalc (роли, RLS, webhook signatures).

## 8. Неопределённости (нужна ручная проверка)

| Что | Почему не видно из репо |
|-----|-------------------------|
| Production Vercel env фактически ротирован ли `CRON_SECRET` после `d0bb5d8` | Только UI Vercel / ops |
| HTTPS, HSTS, WAF, IP allowlist | Хостинг |
| Поведение CRM при подменённых ценах | Код CRM |
| BoxCalc auth/RBAC, org isolation | Репо boxcalculator |
| CI/CD secrets store | Нет workflows в этом репо |
| Мониторинг алертов TG / логи Vercel retention | Вне репо |
| Содержимое незакоммиченных `.env.local` | Игнорируется git; не читалось в отчёт |

---

*Конец отчёта. При существенных изменениях API calculate/ingest — обновить этот файл и `HANDOFF.md`/`OPS.md`.*
