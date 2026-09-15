# HANDOFF — Boxmart Site (`boxmartby`)

**Дата:** 2026-09-15  
**Для агента:** в начале чата прочитай этот файл (`@HANDOFF.md`). Операционка/smoke/env — [`OPS.md`](OPS.md), деплой — [`DEPLOY.md`](DEPLOY.md) при наличии. Платформенные правила: [`.cursor/rules/05|06|07-*.mdc`](.cursor/rules/). Cross-audit: `BOXMART-Platform-AUDIT/BOXMART-PLATFORM-CROSS-AUDIT.md`.

Исторические ТЗ (`BoxMart-*-TZ.md`) — исходный бриф; **актуальный контракт** = этот файл + OPS + код.

## Роль в платформе

Витрина + публичный калькулятор + заявки в CRM.

- Цены: `POST /api/calculate` → remote BoxCalc (+ server local-fallback для UI); public DTO **без** `costPerSqM` / `coef` / `matCost`.
- Каталог: `GET /api/live-catalog` — materials `{id,label,isReference}`, ourDies, blankTypes meta; **без** costs/tiers/areaSurcharge.
- Клиентский бандл: только `pricing/public.ts` (+ catalog); `pricing-config.ts` (costs/tiers) — server modules.
- Заявки: `POST /api/submit-order` → validate → **server re-quote** (remote BoxCalc only, иначе 503) → `enrichQuotedItems` (гарантия `category_label` / `material_label`) → CRM ingest → email. `CRM_INGEST_URL` + `INGEST_SITE_SECRET` обязательны; `Idempotency-Key` как был.
- Health: `GET /api/health` (defaults, calculate, ingest expect 401).
- TG на Site: только **pricing-contract alert** (`sendTelegramAlert`), не Optopak/status webhooks.
- FAQ / контакты: SoT текстов `web/src/lib/site.ts` (`FAQ_ITEMS`, `MESSENGERS`).

## Что сделано (волны)

| Фаза / коммит | Суть |
|---------------|------|
| A–I (2026-08) | Webhooks audit, Idempotency, health, ESLint, pricing logs, contract cron, remove legacy TG, Calculator split |
| `38b6de9` | Server re-quote before CRM; no hardcoded CRM URL |
| `4ab6b0a` | Costs/tiers out of client bundle; public DTO + leak regression |
| `c752907` | Guaranteed category/material labels for CRM invoices |
| `17d8297` | FAQ: ЕРИП; доставка Европочта / Белпочта / АвтолайтЭкспресс |
| Messengers | Header + calculator help links (`MessengerLinks`) |

## Структура калькулятора

| Файл | Роль |
|------|------|
| `web/src/components/Calculator.tsx` | Оркестратор state / recalc / layout |
| `web/src/components/calculator-draft.ts` | DraftItem, toPayload, qty/dim guards; FALLBACK_MATERIALS без costs |
| `web/src/components/CalculatorForm.tsx` | Ряды позиций |
| `web/src/components/CalculatorResults.tsx` | Итого + CTA (+ next-tier hint при наличии) |
| `web/src/components/OrderModal.tsx` | Заявка + idempotency |
| `web/src/lib/enrich-quoted-items.ts` | Labels для CRM после re-quote |
| `web/src/lib/pricing/public.ts` / `public-dto.ts` | Client-safe constants + API sanitizers |

## Тесты

```bash
cd web && npm test && npm run lint
```

Suites: pricing golden, blank-types, idempotency, health, contract-calculate (live skip без `CALCULATOR_*`), order-item-spec, self-lock-notice, **public-catalog-leak**, **enrich-quoted-items**.

## Продуктовые решения

1. Live-цены = BoxCalc org после Publish; Site не «зашивает» целевые coef как актуальный прайс в git.
2. Client money fields на submit **игнорируются**; remote down → 503 (не submit с client prices).
3. Legacy TG/Optopak на Site **не возвращать**.
4. `CRON_SECRET` в Vercel; в `.env.example` секреты не коммитить.
5. FAQ SoT = `site.ts` (не дублировать длинные ответы в лендингах без нужды).

## Рекомендации — дальше

### P0

- Smoke: `GET /api/health` → `ok: true`; Network: live-catalog/calculate без commercial keys.
- Заявка → BM в CRM с непустыми labels; double-submit не плодит дубли.

### P1 (открыто)

- Server-side min qty ≥ 15 на `submit-order` (сейчас UI-only).
- Rate limit на `calculate` / `submit-order`.
- Prod policy: UI `/api/calculate` local-fallback vs жёсткий 503 (submit уже remote-only).

### P2 / skip

- Big-bang landings; возврат Optopak на Site; жёсткий golden `0.24` в contract.

## Env (имена, не значения)

| Переменная | Зачем |
|------------|--------|
| `CALCULATOR_DEFAULTS_URL` / `CALCULATOR_DEFAULTS_API_KEY` | BoxCalc defaults |
| `CALCULATOR_CALCULATE_URL` | optional calculate override |
| `CRM_INGEST_URL` | CRM `…/api/ingest/site` |
| `INGEST_SITE_SECRET` | = CRM ingest secret |
| `CRON_SECRET` | pricing-contract cron |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | только pricing alert |
| `ALLOWED_ORIGIN` / `ALLOWED_ORIGINS` | submit-order Origin check |
| `GMAIL_*` | email после ingest |

Устаревшие после Phase H (можно убрать из Vercel Site): `TELEGRAM_PARSER_*`, `TELEGRAM_WEBHOOK_SECRET`, `PERPLEXITY_*`.

## Связанные репо

- BoxCalc: SoT цен/FEFCO.
- CRM: ingest SoT заказов.

Деплой при смене контракта calculate: **BoxCalc → Site → CRM**.
