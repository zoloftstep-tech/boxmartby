# HANDOFF — Boxmart Site (`boxmartby`)

**Дата:** 2026-08-25 (актуализация волны A–I)  
**Для агента:** в начале чата прочитай этот файл (`@HANDOFF.md`). Операционка/smoke/env — [`OPS.md`](OPS.md), деплой — [`DEPLOY.md`](DEPLOY.md) при наличии. Платформенные правила: [`.cursor/rules/05|06|07-*.mdc`](.cursor/rules/). Cross-audit: `BOXMART-Platform-AUDIT/BOXMART-PLATFORM-CROSS-AUDIT.md`.

## Роль в платформе

Витрина + публичный калькулятор + заявки в CRM.

- Цены: proxy BoxCalc `POST /api/calculate` (+ local fallback).
- Каталог: live defaults / `GET /api/live-catalog`.
- Заявки: `POST /api/submit-order` → server re-quote (remote BoxCalc only, 503 if down) → CRM ingest; `CRM_INGEST_URL`+`INGEST_SITE_SECRET` обязательны (без hardcoded URL); `Idempotency-Key` как был.
- Health: `GET /api/health` (defaults, calculate, ingest expect 401).
- TG на Site после Phase H: только **pricing-contract alert** (`sendTelegramAlert`), не Optopak/status webhooks.

## Что сделано в этой волне

| Фаза | Суть | Ориентир |
|------|------|----------|
| A | Аудит webhooks: parser → CRM | OPS |
| B | Стабильный Idempotency-Key (`site:uuid`) | Site |
| C | `GET /api/health` | Site |
| E | ESLint flat, `lint: eslint` | Site |
| F | Логи `[pricing]` / soft observability | Site |
| G | `pricing-contract` + cron (Hobby: daily `0 6 * * *` UTC) + TG alert | Site |
| H | Удалены legacy `/api/optopak-webhook`, `/api/telegram/webhook` | Site `d0ccd5b` |
| I.2 | Split Calculator → draft / Form / Results / OrderModal | Site `054bb46` |

**Контракты calculate/ingest не менялись** в I.2.

P2 hygiene: пустая папка `api/debug-health` удалена локально (в git не была).

## Текущая структура калькулятора

| Файл | Роль |
|------|------|
| `web/src/components/Calculator.tsx` | Оркестратор state / recalc / layout |
| `web/src/components/calculator-draft.ts` | DraftItem, toPayload, qty/dim guards |
| `web/src/components/CalculatorForm.tsx` | Ряды позиций |
| `web/src/components/CalculatorResults.tsx` | Итого + CTA |
| `web/src/components/OrderModal.tsx` | Заявка + idempotency |

Pricing логика: `web/src/lib/pricing/*` + `web/src/lib/api.ts`.

## Тесты

```bash
cd web && npm test && npm run lint
```

Suites: pricing golden, blank-types, idempotency, health, contract-calculate (live skip без `CALCULATOR_*`).

## Продуктовые решения

1. Цена на сайте уже из BoxCalc (proxy) — **не** дублировать «live price» ради CRM.
2. Legacy TG/Optopak на Site **не возвращать**.
3. `CRON_SECRET` нужен в Vercel для pricing cron; в `.env.example` секреты не коммитить (был инцидент — ротировать если светился).
4. SPA BoxCalc не дробили — Site от `index.html` не зависит.

## Рекомендации — дальше

### P0

- Smoke после деплоя: `GET https://boxmartby.vercel.app/api/health` → `ok: true`.
- Заявка с калькулятора → BM в CRM; double-submit не плодит дубли (idempotency).
- Legacy paths → 404.

### P1

- При правках calc UI — не склеивать обратно в один файл; держать split.
- При боли Form/OrderModal (~250+ LOC) — касательный split, не обязательно сейчас.

### P2 / skip

- Big-bang рефакторинг landings.
- Возврат Optopak webhook на Site.
- Жёсткий golden `0.24` в contract (org живой — shape + finite + remote).

## Env (имена, не значения)

| Переменная | Зачем |
|------------|--------|
| `CALCULATOR_DEFAULTS_URL` / `CALCULATOR_DEFAULTS_API_KEY` | BoxCalc |
| `CALCULATOR_CALCULATE_URL` | optional override |
| `INGEST_SITE_SECRET` | = CRM |
| `INGEST_SITE_URL` | CRM ingest |
| `CRON_SECRET` | pricing-contract cron |
| `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` | только pricing alert |

Устаревшие после H (можно убрать из Vercel Site): `TELEGRAM_PARSER_*`, `TELEGRAM_WEBHOOK_SECRET`, `PERPLEXITY_*`.

## Связанные репо

- BoxCalc: SoT цен/FEFCO; `HANDOFF.md` + `04-spa-calc.mdc`.
- CRM: ingest SoT заказов; `HANDOFF.md`.

Деплой при смене контракта calculate: **BoxCalc → Site → CRM**.
