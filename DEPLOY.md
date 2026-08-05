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

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `TELEGRAM_WEBHOOK_SECRET` — случайная строка (защита webhook статусов заказа)
- `TELEGRAM_PARSER_BOT_TOKEN` — токен второго бота (парсер «Оптопак»)
- `TELEGRAM_PARSER_WEBHOOK_SECRET` — секрет webhook второго бота
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `PERPLEXITY_API_KEY`
- `ALLOWED_ORIGIN` — URL сайта на Vercel, например `https://your-project.vercel.app` (без слэша в конце)
- **CRM ingest (cutover):**
  - `CRM_INGEST_URL` — `https://boxmart-crm.vercel.app/api/ingest/site`
  - `INGEST_SITE_SECRET` — тот же секрет, что на CRM (`INGEST_SITE_SECRET`)
- `CALCULATOR_DEFAULTS_URL` — `https://YOUR-CALC-HOST/api/defaults` (BoxCalc)
- `CALCULATOR_DEFAULTS_API_KEY` — тот же секрет, что `DEFAULTS_API_KEY` у BoxCalc
- `CALCULATOR_CALCULATE_URL` — опционально; иначе сайт дергает `{host}/api/calculate` из defaults URL

Сайт проксирует `POST /api/calculate` на BoxCalc (единая формула). Каталог штанцформ — `GET /api/live-catalog` → org `ourDies`. Без env — fallback на локальный `pricing-config.ts` (`ourDies: []`).

Проверка после деплоя:

```bash
curl -s -H "Authorization: Bearer $KEY" "$CALCULATOR_DEFAULTS_URL" | jq '.ourDies | length'
curl -s -D- -X POST https://YOUR-SITE/api/live-catalog -o /dev/null | grep -i X-Pricing-Source
```

Локальный `.env.local` на Vercel не попадает.

## Telegram webhook (статусы заказа)

После деплоя и добавления `TELEGRAM_WEBHOOK_SECRET` один раз привяжите webhook бота к prod URL:

```bash
export TOKEN="…"          # TELEGRAM_BOT_TOKEN
export SECRET="…"         # тот же TELEGRAM_WEBHOOK_SECRET, что на Vercel

curl "https://api.telegram.org/bot$TOKEN/setWebhook" \
  -d "url=https://boxmartby.vercel.app/api/telegram/webhook" \
  -d "secret_token=$SECRET" \
  -d 'allowed_updates=["callback_query"]'
```

Проверка: `curl "https://api.telegram.org/bot$TOKEN/getWebhookInfo"`.

Заявки с сайта получают inline-кнопки статусов; нажатие редактирует то же сообщение (история в Europe/Minsk).

## Telegram webhook (парсер «Оптопак»)

После деплоя добавьте `TELEGRAM_PARSER_BOT_TOKEN` и `TELEGRAM_PARSER_WEBHOOK_SECRET`, затем один раз привяжите webhook второго бота к prod URL:

```bash
export TOKEN="…"          # TELEGRAM_PARSER_BOT_TOKEN
export SECRET="…"         # тот же TELEGRAM_PARSER_WEBHOOK_SECRET, что на Vercel

curl "https://api.telegram.org/bot$TOKEN/setWebhook" \
  -d "url=https://boxmartby.vercel.app/api/optopak-webhook" \
  -d "secret_token=$SECRET" \
  -d 'allowed_updates=["message","callback_query"]'
```

Проверка: `curl "https://api.telegram.org/bot$TOKEN/getWebhookInfo"`.

Парсер получает сообщения в группе «Оптопак», публикует карточки с inline-кнопками статусов в `TELEGRAM_CHAT_ID` и обрабатывает reply-уточнения.

**Cutover на CRM:** переключите webhook парсера на CRM (статусы только в CRM, без inline-кнопок):

```bash
export TOKEN="…"          # TELEGRAM_PARSER_BOT_TOKEN (тот же бот)
export SECRET="…"         # TELEGRAM_PARSER_WEBHOOK_SECRET с CRM

curl "https://api.telegram.org/bot$TOKEN/setWebhook" \
  -d "url=https://boxmart-crm.vercel.app/api/telegram/optopak" \
  -d "secret_token=$SECRET"
```

Откат: вернуть `url=https://boxmartby.vercel.app/api/optopak-webhook`.

Инструкция для менеджеров (закреп / `/help`): [`web/docs/optopak-manager-guide.md`](web/docs/optopak-manager-guide.md).
