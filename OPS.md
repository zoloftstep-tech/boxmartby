# Boxmart Platform — OPS (операционный паспорт)

**Назначение:** единый контекст для людей и AI-агентов. Читать перед правками цен, заказов, Telegram, env, деплоя.  
**Копии:** одинаковый файл лежит в **обоих** репозиториях (`boxmartby` и `boxcalculator`). При правке — обновить обе копии в одном PR/сессии.  
**Дата актуализации:** 2026-08-11  
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
| **Цены / тарифы / ourDies для сайта** | BoxCalc `org_settings` после **Publish** | Сайт читает `/api/defaults` и проксирует `/api/calculate` |
| **Формула FEFCO 0201 (геометрия)** | BoxCalc `web/src/lib/calc/fefco-0201.ts` | В SPA попадает через `npm run sync:fefco` → `public/calc/fefco-0201.js` |
| **Локальный fallback цен на сайте** | Site `web/src/lib/pricing/*` | Используется если BoxCalc недоступен или нет env |
| **Статусы заказов** | **CRM** | Не полагаться на Telegram inline-кнопки сайта как на SoT |
| **Заявки с сайта** | `POST` Site `/api/submit-order` → CRM ingest | Email параллельно; сбой email ≠ откат заявки |
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
# = test:fefco + test:fefco-sync + test:pricing

# Site
cd web && npm test
# = test:pricing
```

Кейсы должны совпадать в `web/scripts/test-pricing-golden.ts` **обоих** репо.

### Пустые ourDies на сайте

Обычно: нет env defaults, или в org не опубликованы dies, или смотрите старый кэш (до 60 с). Не «чинить» каталог правкой только локального `pricing-config.ts` — publish org.

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

**Перед удалением:** `getWebhookInfo` для обоих ботов — куда реально смотрит prod.  
Cutover парсера на CRM описан в Site `DEPLOY.md` (URL `…/api/telegram/optopak` на CRM).

### Инструкции менеджерам (актуальное поведение)

- Пробел перед «шт» желателен для людей; код эвристики принимает и `40шт`, и `40 шт` — сбои чаще от LLM/Perplexity, не от жёсткого regex пробела.
- Статусы вести в **CRM**, не через старые Telegram-кнопки сайта (если cutover завершён).

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

# Сайт: источник цен
curl -s -D- -X POST "https://YOUR-SITE/api/live-catalog" -o /dev/null | grep -i X-Pricing-Source
# или calculate через сайт и смотреть X-Pricing-Source: remote
```

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
| `web/src/app/api/optopak-webhook/route.ts` | Legacy Optopak на сайте |
| `web/scripts/test-pricing-golden.ts` | Golden prices (lockstep с BoxCalc) |

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

### Дальше (по приоритету)

- [ ] **Аудит Telegram webhooks** (оба бота → `getWebhookInfo`) → план удаления legacy с Site
- [ ] Лёгкий **health** env (defaults/calculate/ingest ping, без утечки секретов)
- [ ] Contract-тест Site remote vs BoxCalc в CI (сейчас unit на defaults seed)
- [ ] Cron / дозаполнение CRM snapshots при сбое синхронного ingest (если будет боль)
- [ ] Audit log на `hiddenFeatures` (низкий приоритет)
- [ ] Ротация секретов по чеклисту (Doppler — только если ручная боль)

### Явно не делать сейчас

- Вынос pricing в отдельный microservice / npm package «ради чистоты»
- Очереди / CQRS / event bus под текущий объём
- Унификация ORM Site ↔ BoxCalc ↔ CRM
- Удаление Telegram/Optopak кода на сайте **до** проверки webhook
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
