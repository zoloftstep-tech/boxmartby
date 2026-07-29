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

Инструкция для менеджеров (закреп / `/help`): [`web/docs/optopak-manager-guide.md`](web/docs/optopak-manager-guide.md).
