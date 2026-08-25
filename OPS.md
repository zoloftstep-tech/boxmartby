# Boxmart Platform — OPS (операционный паспорт)

**Назначение:** единый контекст для людей и AI-агентов. Читать перед правками цен, заказов, Telegram, env, деплоя.  
**Копии:** одинаковый файл лежит в **обоих** репозиториях (`boxmartby` и `boxcalculator`). При правке — обновить обе копии в одном PR/сессии.  
**Дата актуализации:** 2026-08-25  
**Не коммитить:** `.env.local`, секреты, `.vercel/` project tokens.

---

## 1. Карта систем

| Система | GitHub | Vercel (типично) | Роль |
|---------|--------|------------------|------|
| **Boxmart Site** | `zoloftstep-tech/boxmartby` | `boxmartby` / `boxmartby.vercel.app` | Витрина, калькулятор на сайте, заявки, legacy Telegram/Optopak |
| **BoxCalc** | `zoloftstep-tech/boxcalculator` | `boxcalculator` | Калькулятор менеджеров (SPA), org-тарифы, `POST /api/calculate`, FEFCO 0201 |
| **Boxmart CRM** | `zoloftstep-tech/boxmart-crm` | `boxmart-crm.vercel.app` | SoT статусов/заказов, ingest, Optopak — детальный OPS в репо CRM: [`OPS.md`](https://github.com/zoloftstep-tech/boxmart-crm/blob/main/OPS.md) |

Локальные пути (машина владельца):

- Site: `/Users/rostislav/Documents/Cursor Projects/Boxmart Site`
- BoxCalc: `/Users/rostislav/Documents/Cursor Projects/boxcalculator-main`
- CRM: `/Users/rostislav/Documents/Cursor Projects/boxmart-crm`

Root Directory на Vercel у Site, BoxCalc и CRM: **`web`**.

### Источники правды (SoT)

| Домен | SoT | Комментарий |
|-------|-----|-------------|
| **Цены / тарифы / ourDies / blankTypes (meta) для сайта** | BoxCalc `org_settings` после **Publish** | Сайт: `/api/defaults` → `blankTypes[{id,name,category}]` **без формул**; расчёт — `/api/calculate` |
| **Формулы развёртки (customTypes, overrides)** | BoxCalc `org_settings` (только сервер + SPA менеджеров) | **Не** публикуются в `/api/defaults`. Клиент сайта формул не получает |
| **Каталог форматов листа (склад)** | BoxCalc `org_settings.sheetFormats` | `GET /api/defaults` → `sheetFormats[]` (`cardTypeId`, `active`); cutover: wipe → ввод → Save → Publish |
| **Раскладка заготовки на лист** | BoxCalc `POST /api/layout` (`lib/calc/layout.ts`) | `blanksPerSheet`; без авто-выбора формата; CRM `fetchSheetLayout` |
| **Формула FEFCO 0201 (геометрия)** | BoxCalc `web/src/lib/calc/fefco-0201.ts` | В SPA попадает через `npm run sync:fefco` → `public/calc/fefco-0201.js` |
| **Локальный fallback цен на сайте** | Site `web/src/lib/pricing/*` | Используется если BoxCalc недоступен или нет env |
| **Статусы заказов** | **CRM** | Не полагаться на Telegram inline-кнопки сайта как на SoT |
| **Заявки с сайта** | `POST` Site `/api/submit-order` → CRM ingest | Email **после** CRM ingest; сбой email ≠ откат заявки |
| **Парсер «Оптопак»** | Зависит от **webhook URL** | Может смотреть на Site *или* CRM — проверить `getWebhookInfo` перед правками |

---

## 2. Деньги и синхронизация тарифов

### Как должно работать в проде

1. Суперадмин в BoxCalc правит настройки → **Сохранить** (личная копия).
2. **«Применить для всех»** (`POST /api/me/settings/publish`) → пишет shared в `org_settings`.
3. Менеджеры видят баннер «Орг. обновлены» → **Применить** (сброс локального к их org; история/пресеты сохраняются).
4. Сайт:
   - `GET` BoxCalc `/api/defaults` (кэш ~**60 с**) — каталог/тарифы для live-catalog;
   - `POST` BoxCalc `/api/calculate` — единый расчёт (Bearer = `DEFAULTS_API_KEY`).
5. Заголовок ответа сайта: `X-Pricing-Source: remote | local-fallback | local`.
   - `remote` — ок;
   - `local-fallback` — defaults/remote были, но calculate proxy упал → **warn в логах Vercel**;
   - `local` — нет `CALCULATOR_DEFAULTS_URL` / API key.

### Golden-кейс (регрессия)

`220 × 70 × 100 мм`, qty `50`, `fourFlap`, `t22`, defaults seed → **0,24** BYN/шт (округление до 2 знаков).

Тесты:

```bash
# BoxCalc
cd web && npm test
# = test:fefco + test:fefco-sync + test:pricing + test:layout

# Site
cd web && npm test
# = test:pricing + test:blank-types + test:idempotency + test:health + test:contract-calculate
# test:contract-calculate: без CALCULATOR_* → skip; с env — live BoxCalc (+ SITE_ORIGIN → remote header)
```

Кейсы должны совпадать в `web/scripts/test-pricing-golden.ts` **обоих** репо.

### Пустые ourDies на сайте

Обычно: нет env defaults, или в org не опубликованы dies, или смотрите старый кэш (до 60 с). Не «чинить» каталог правкой только локального `pricing-config.ts` — publish org.

### Новый тип развёртки на сайте

1. В BoxCalc → Настройки → Типы развёртки: добавить пользовательский тип (формулы) **или** системный FEFCO в коде.
2. **Сохранить** → **Применить для всех** (publish org).
3. Сайт через `live-catalog` получает только `{ id, name, category }` в `blankTypes`.
4. Цена считается через BoxCalc `/api/calculate` (формулы остаются на сервере).
5. Если BoxCalc calculate недоступен — custom тип даёт 503 на сайте; builtin FEFCO может идти local-fallback.

### FEFCO sync

- Канон: `boxcalculator/web/src/lib/calc/fefco-0201.ts`
- Артефакт SPA: `web/public/calc/fefco-0201.js`
- После правки TS: `npm run sync:fefco` (также на `npm run build`)
- CI-гард: `npm run test:fefco-sync` — падает, если JS не совпадает с генерацией

---

## 3. Env-матрица (секреты должны совпадать)

| Секрет | BoxCalc | Site | CRM |
|--------|---------|------|-----|
| `DEFAULTS_API_KEY` | ✅ | = `CALCULATOR_DEFAULTS_API_KEY` | — |
| `CALCULATOR_DEFAULTS_URL` | — | ✅ `…/api/defaults` | — |
| `CALCULATOR_CALCULATE_URL` | — | опционально; иначе из defaults URL → `/api/calculate` | — |
| `INGEST_SITE_SECRET` | — | ✅ | ✅ тот же |
| `CRM_INGEST_URL` | — | ✅ `…/api/ingest/site` | — |
| `ALLOWED_ORIGIN` / `ALLOWED_ORIGINS` | — | URL(ы) сайта **без** trailing slash, без кавычек в Vercel | — |
| `CRON_SECRET` | — | ✅ Bearer для `GET /api/cron/pricing-contract` (`openssl rand -hex 32`) | свой для CRM crons |
| Telegram bot tokens / webhook secrets | — | Site и/или CRM в зависимости от cutover | Optopak cutover |
| `DATABASE_URL`, Better Auth | ✅ Neon | — | свой |

**Правило:** после смены ключа обновить **все** проекты Vercel (Production), иначе silent fallback или 401/403.

`ALLOWED_ORIGIN`: если открывают `https://boxmartby.vercel.app`, этот Origin должен быть разрешён (или в `ALLOWED_ORIGINS`), иначе `submit-order` → Forbidden.

---

## 4. Заявки и Telegram

### Сайт → CRM

- `web/src/app/api/submit-order/route.ts` шлёт ingest в CRM (`CRM_INGEST_URL` + `INGEST_SITE_SECRET`).
- Синхронный HTTP: при падении CRM заявка может не попасть в CRM (email отдельно).
- Страница «спасибо»: `/spasibo`.

### Legacy на Site (не удалять вслепую)

Ещё есть код:

- `/api/telegram/webhook` — статусы (исторически)
- `/api/optopak-webhook` — парсер Оптопак на сайте
- гайд менеджеров: `web/docs/optopak-manager-guide.md`

Cutover парсера на CRM описан в Site `DEPLOY.md` (URL `…/api/telegram/optopak` на CRM).

### Cutover status (2026-08-25)

Аудит: `getWebhookInfo` (токены Site = CRM; `setWebhook` не вызывался).

| Бот | Webhook URL | pending | last_error |
|-----|-------------|---------|------------|
| Notify (`TELEGRAM_BOT_TOKEN`) | `https://boxmartby.vercel.app/api/telegram/webhook` (`allowed_updates`: `callback_query`) | 0 | — |
| Parser (`TELEGRAM_PARSER_BOT_TOKEN`) | `https://boxmart-crm.vercel.app/api/telegram/optopak` (`message`, `callback_query`) | 0 | — |

- **Вердикт:** `parser_on_crm`
- **Legacy Site code:** `keep` (удаление — только отдельная P2-сессия)
- **Gate:** удаление `/api/optopak-webhook` и `/api/telegram/webhook` на Site разрешено планировать только при `parser_on_crm` (сейчас выполнено); notify status webhook на Site — legacy, не SoT статусов

### Инструкции менеджерам (актуальное поведение)

- Пробел перед «шт» желателен для людей; код эвристики принимает и `40шт`, и `40 шт` — сбои чаще от LLM/Perplexity, не от жёсткого regex пробела.
- Статусы вести в **CRM**, не через старые Telegram-кнопки сайта (cutover парсера на CRM подтверждён 2026-08-25).

---

## 5. Деплой и проверки

### Деплой

- Пуш в `main` → Vercel Production (Root Directory `web`).
- Детали: Site `DEPLOY.md`, BoxCalc `web/DEPLOY.md`.

### Быстрый smoke после деплоя

```bash
# Defaults
curl -s -H "Authorization: Bearer $KEY" "$CALCULATOR_DEFAULTS_URL" | jq '.ourDies | length'

# Calculate (ожидание ~0.24)
curl -s -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d '{"items":[{"length":220,"width":70,"height":100,"quantity":50,"category":"fourFlap","material":"t22"}]}' \
  "${CALC_HOST}/api/calculate" | jq '.items[0].price_per_unit_no_vat'

# Сайт: источник цен (GET)
curl -s -D- "https://YOUR-SITE/api/live-catalog" -o /dev/null | grep -i X-Pricing-Source
# или calculate через сайт и смотреть X-Pricing-Source: remote

# Health (defaults + calculate returns price + ingest expect 401)
curl -sS "https://YOUR-SITE/api/health" | jq .
# Ожидание: HTTP 200 и "ok": true. Внешний uptime-монитор — только этот URL (без секретов в ответе).
```

### Мониторинг и фильтры Vercel (Phase F)

| Где | Что | Фильтр логов |
|-----|-----|----------------|
| Site | Health down / upstream fail | `[health]` |
| Site | Цены не с BoxCalc | `[pricing]` (`source=local-fallback` / `source=local`) |
| Site | Заявка не ушла в CRM | `[submit-order]` |
| CRM | Ingest 401/500/400 | `[ingest] unauthorized` / `misconfigured` / `bad_request` |
| CRM | Нет снимков FEFCO | `[ingest] BOXCALC_* missing` |
| Site | Pricing contract cron fail | `[cron/pricing-contract]`; TG `[pricing-contract] FAIL` |

**Post-deploy smoke (Phase F):** `GET /api/health` → 200 + `ok: true`; `POST` CRM `/api/ingest/site` с `Authorization: Bearer wrong` → **401**, в логах CRM `[ingest] unauthorized`, **без** нового BM.

**Contract + TG cron (Phase G):**

```bash
# Live script (локально / CI с секретами)
CALCULATOR_DEFAULTS_URL=… CALCULATOR_DEFAULTS_API_KEY=… \
  SITE_ORIGIN=https://boxmartby.vercel.app \
  npm run test:contract-calculate

# Cron smoke (после CRON_SECRET в Vercel Site)
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://boxmartby.vercel.app/api/cron/pricing-contract" | jq .
# Ожидание: { "ok": true, ... }; в Telegram тишина.
# При fail: ok:false + сообщение в TELEGRAM_CHAT_ID (без кнопок статуса заказа).
```

Расписание Vercel (Hobby: не чаще 1×/сутки): `0 6 * * *` UTC (= 09:00 Минск) → `/api/cron/pricing-contract`.

Локально перед пушем: `cd web && npm test` в затронутом репо.

---

## 6. Ключевые пути кода

### BoxCalc

| Путь | Зачем |
|------|--------|
| `web/public/calc/index.html` | SPA; publish → `markOrgApplied`; org stale banner |
| `web/src/lib/org-settings.ts` | `publishSharedSettingsToOrg` |
| `web/src/app/api/me/settings/publish/route.ts` | Publish API |
| `web/src/app/api/calculate/route.ts` | Публичный расчёт для сайта |
| `web/src/lib/pricing/calculate.ts` | Серверный расчёт |
| `web/src/lib/calc/fefco-0201.ts` | Канон FEFCO 0201 |
| `web/scripts/sync-fefco-0201-to-spa.ts` | Sync в SPA |
| `web/scripts/check-fefco-sync.ts` | CI guard |
| `web/scripts/test-pricing-golden.ts` | Golden prices |

### Site

| Путь | Зачем |
|------|--------|
| `web/src/app/api/calculate/route.ts` | Proxy → BoxCalc + local fallback + warn |
| `web/src/lib/pricing/*` | Локальный расчёт / fallback |
| `web/src/lib/pricing/remote-defaults.ts` | Defaults fetch, TTL 60s |
| `web/src/app/api/submit-order/route.ts` | CRM ingest + email |
| `web/src/app/api/health/route.ts` | Env/upstream ping (defaults, calculate, ingest 401) |
| `web/src/lib/health-checks.ts` | Логика health (тестируемая) |
| `web/src/lib/pricing/pricing-contract.ts` | Live contract BoxCalc + Site remote |
| `web/src/app/api/cron/pricing-contract/route.ts` | Cron + TG alert при fail |
| `web/src/app/api/optopak-webhook/route.ts` | Legacy Optopak на сайте |
| `web/scripts/test-pricing-golden.ts` | Golden prices (lockstep с BoxCalc) |
| `web/scripts/test-idempotency-key.ts` | Idempotency-Key helper |
| `web/scripts/test-contract-calculate.ts` | Contract calculate (skip без env) |
| `web/scripts/test-health-checks.ts` | Health checks (mocked fetch) |

---

## 7. Decision log (не переоткрывать без причины)

| Когда | Решение | Почему |
|-------|---------|--------|
| 2026 | Сайт **проксирует** calculate на BoxCalc | Один SoT формулы; локальная копия только fallback |
| 2026 | Площадь в цене **без** раннего округления до 2 знаков | Иначе 0,23 vs 0,24 на кейсе 220×70×100×50 |
| 2026 | Publish org отдельной кнопкой суперадмина | Личные пресеты/история менеджеров не затираются publish’ем |
| 2026 | После publish у суперадмина — `markOrgApplied`, не `ingestOrgUpdatedAt` | Иначе ложный баннер «орг. обновлены» у издателя |
| 2026 | Статусы заказов → CRM SoT | Сайт Telegram — legacy / cutover |
| 2026 | Optopak «40шт» — править **инструкции**, не эвристику парсера | Эвристика уже допускает оба варианта; шум от LLM |
| 2026 | Не npm-пакет pricing / не очереди / не унификация ORM | Масштаб не оправдывает; см. бриф Perplexity §9 |
| 2026-08-11 | Добавлены golden tests + FEFCO sync guard + warn `local-fallback` | Коммиты BoxCalc `fc00d84`, Site `929fb82` |
| 2026-08-25 | Prod webhook audit: parser → CRM; notify status → Site legacy | `getWebhookInfo`; вердикт `parser_on_crm`; `setWebhook` не вызывался; legacy Site code `keep` до P2 |
| 2026-08-25 | Site Idempotency-Key: client UUID per attempt + server body-hash fallback | Phase B; убран `randomUUID` на каждый POST; double-click/retry не плодят BM |
| 2026-08-25 | Site `GET /api/health` + OPS Site↔BoxCalc sync | Phase C; ping defaults/calculate/ingest(401); email wording «после CRM»; live-catalog smoke = GET |
| 2026-08-25 | Site ESLint flat config (`eslint.config.mjs` + `lint: eslint`) | Phase E; неинтерактивный lint как CRM/BoxCalc; без split Calculator/Optopak |
| 2026-08-25 | Soft observability: `[pricing]`/`[ingest]` tags + health uptime doc | Phase F; без Sentry/admin banner; контракты API не менялись |
| 2026-08-25 | Site contract calculate + cron TG alert | Phase G; shape/finite/`remote`; cron daily `0 6 * * *` UTC (Hobby); без жёсткого 0.24 |

---

## 8. Backlog рисков

### Сделано

- [x] Proxy calculate Site → BoxCalc
- [x] Publish org + Apply для менеджеров
- [x] Golden pricing tests (оба репо)
- [x] FEFCO sync CI guard (`test:fefco-sync`)
- [x] Warn в логах при `local-fallback` / `local`
- [x] Фикс баннера у суперадмина после publish
- [x] Этот OPS.md
- [x] Аудит Telegram webhooks (2026-08-25): parser → CRM (`parser_on_crm`); notify status → Site legacy
- [x] Стабильный Idempotency-Key на Site (2026-08-25, Phase B): client key + server body-hash; `test:idempotency`
- [x] Лёгкий health env на Site (2026-08-25, Phase C): `GET /api/health`; `test:health`; OPS sync sheetFormats/layout
- [x] Site ESLint flat config (2026-08-25, Phase E): `eslint.config.mjs`; `npm run lint` без prompt
- [x] Soft observability (2026-08-25, Phase F): Vercel log tags + health ping checklist
- [x] Contract Site↔BoxCalc + TG cron (2026-08-25, Phase G): `test:contract-calculate`; `/api/cron/pricing-contract`

### Дальше (по приоритету)

- [ ] План удаления legacy TG/Optopak с Site (P2; gate `parser_on_crm` выполнен; код пока `keep`)
- [ ] Cron / дозаполнение CRM snapshots при сбое синхронного ingest (если будет боль)
- [ ] Audit log на `hiddenFeatures` (низкий приоритет)
- [ ] Ротация секретов по чеклисту (Doppler — только если ручная боль)

### Явно не делать сейчас

- Вынос pricing в отдельный microservice / npm package «ради чистоты»
- Очереди / CQRS / event bus под текущий объём
- Унификация ORM Site ↔ BoxCalc ↔ CRM
- Удаление Telegram/Optopak кода на сайте **без** отдельного P2-согласования (audit 2026-08-25: `parser_on_crm`)
- Широкий рефакторинг парсера под один кейс LLM

---

## 9. Как работать с AI / следующим чатом

1. Открыть **этот `OPS.md`** (и при необходимости `DEPLOY.md`).
2. Не начинать с «аудита архитектуры» — сначала SoT и backlog §8.
3. Менять цены/формулы только с `npm test` в затронутом репо.
4. Секреты и webhook — ops-чеклист, не «заодно в том же PR с рефакторингом».
5. Бриф Perplexity (`BOXMART-WEAKSPOTS-AND-FINDINGS.md`) — входной список рисков; часть уже закрыта (§8). Не делать всё из брифа подряд.

### Связанные документы

| Документ | Где |
|----------|-----|
| Деплой Site | `Boxmart Site/DEPLOY.md` |
| Деплой BoxCalc | `boxcalculator/web/DEPLOY.md` |
| Гайд Optopak менеджерам | `Boxmart Site/web/docs/optopak-manager-guide.md` |
| ТЗ калькулятора | `boxcalculator/BoxCalc-TZ-v5.md` |
| ТЗ сайта / API / статусы | `BoxMart-*-TZ.md` в корнях репо |
| Бриф weakspots | локально Downloads / паспорт Perplexity |
| **CRM OPS (детальный)** | `/Users/rostislav/Documents/Cursor Projects/boxmart-crm/OPS.md` |

---

## 10. Чеклист владельца (короткий)

**Смена тарифа на сайте:** BoxCalc → Save → «Применить для всех» → менеджеры Apply → подождать до 60 с → проверить `X-Pricing-Source: remote` и цену 0,24 на golden-кейсе.

**Сайт не считает / странная цена:** логи Vercel Site на `local-fallback`; env `CALCULATOR_*`; ключ = BoxCalc `DEFAULTS_API_KEY`; org published.

**Заявка 403 Forbidden:** `ALLOWED_ORIGIN` / `ALLOWED_ORIGINS` для реального Origin браузера.

**Заявка не в CRM:** `CRM_INGEST_URL`, `INGEST_SITE_SECRET`, логи submit-order / CRM ingest.

**После правки FEFCO:** `npm run sync:fefco` + `npm test` в BoxCalc.

---

*Конец OPS. При существенных изменениях платформы — дописать §7 Decision log и §8 Backlog, синхронизировать копии в обоих репо.*
