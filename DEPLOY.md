# Деплой на Vercel

Приложение Next.js находится в папке **`web/`**, а не в корне репозитория.

## Обязательная настройка

В проекте Vercel:

1. **Settings → General → Root Directory** → `web` (без `./`) → Save
2. **Framework Preset** → **Next.js** (не Node.js и не Other)
3. **Output Directory** — оставьте пустым
4. **Deployments → Redeploy** (обязательно после смены preset — иначе Production останется со старым конфигом)

Файл `web/vercel.json` задаёт `"framework": "nextjs"` — его нужно закоммитить и запушить в GitHub.

Без Root Directory = `web` и Framework = Next.js сайт отдаёт `404: NOT_FOUND` или ошибку `No entrypoint found`.

## Environment Variables

В **Settings → Environment Variables** добавьте (Production / Preview):

- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` — только для **pricing-contract** alert (Phase G), не для webhook статусов
- `GMAIL_USER` / `GMAIL_APP_PASSWORD`
- `ALLOWED_ORIGIN` — URL сайта на Vercel, например `https://your-project.vercel.app` (без слэша в конце)
- **CRM ingest:**
  - `CRM_INGEST_URL` — `https://boxmart-crm.vercel.app/api/ingest/site`
  - `INGEST_SITE_SECRET` — тот же секрет, что на CRM (`INGEST_SITE_SECRET`)
- `CALCULATOR_DEFAULTS_URL` — `https://YOUR-CALC-HOST/api/defaults` (BoxCalc)
- `CALCULATOR_DEFAULTS_API_KEY` — тот же секрет, что `DEFAULTS_API_KEY` у BoxCalc
- `CALCULATOR_CALCULATE_URL` — опционально; иначе сайт дергает `{host}/api/calculate` из defaults URL
- **`CRON_SECRET`** — Bearer для `GET /api/cron/pricing-contract` (Phase G; `openssl rand -hex 32`). Без него cron отвечает 401.

**Не нужны на Site (Phase H, удалены routes):** `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_PARSER_*`, `PERPLEXITY_API_KEY` — парсер/Optopak и status webhook живут в **CRM**. Можно удалить эти env из Vercel Site после деплоя H.

Сайт проксирует `POST /api/calculate` на BoxCalc (единая формула). Каталог — `GET /api/live-catalog` (без costs/tiers). Без env — server fallback `pricing-config.ts`. Submit: remote re-quote → CRM (`CRM_INGEST_URL` обязателен).

Проверка после деплоя:

```bash
curl -s "https://YOUR-SITE/api/health" | jq .
curl -s -H "Authorization: Bearer $KEY" "$CALCULATOR_DEFAULTS_URL" | jq '.ourDies | length'
curl -s -D- "https://YOUR-SITE/api/live-catalog" -o /tmp/live-catalog.json | grep -i X-Pricing-Source
# JSON live-catalog / calculate не должен содержать costPerSqM, coef, tiers, areaSurcharge
curl -sS -H "Authorization: Bearer $CRON_SECRET" "https://YOUR-SITE/api/cron/pricing-contract" | jq .
# Ожидание health.ok / cron: { "ok": true }; при fail cron — Telegram [pricing-contract] FAIL
```

Локальный `.env.local` на Vercel не попадает.

## Telegram (после Phase H)

- **Парсер Оптопак** — только CRM: webhook → `https://boxmart-crm.vercel.app/api/telegram/optopak` (секреты на CRM).
- **Статусы заказов** — только CRM UI (кнопки в TG с сайта сняты).
- **Site notify-бот:** после деплоя H снимите старый status webhook (иначе Telegram шлёт callback на 404):

```bash
export TOKEN="…"   # TELEGRAM_BOT_TOKEN (notify)
curl "https://api.telegram.org/bot$TOKEN/deleteWebhook"
curl "https://api.telegram.org/bot$TOKEN/getWebhookInfo"
```

Parser webhook **не** трогать. Инструкция менеджерам: [`web/docs/optopak-manager-guide.md`](web/docs/optopak-manager-guide.md) (поведение CRM).
