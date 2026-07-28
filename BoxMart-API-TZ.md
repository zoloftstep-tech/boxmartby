# Техническое задание
## API для калькулятора стоимости коробок (Backend)
### ООО «БОКСМАРТ» — сайт-визитка

**Версия:** 1.0
**Дата:** 28 июля 2026

---

## 1. Назначение

Backend-сервис принимает от фронтенда сайта исходные габариты и тираж, выполняет расчёт стоимости по внутренней формуле (площадь заготовки × тариф за м² × коэффициенты) и возвращает готовый результат. Формулы, коэффициенты и тарифы не передаются на клиент и не видны в исходном коде страницы.

## 2. Технологический стек

- **Рекомендуемый вариант:** Node.js (Express / Fastify) или Python (FastAPI).
- **Хостинг:** serverless-функция (Vercel Functions, Cloudflare Workers) либо отдельный VPS/контейнер.
- **Хранение тарифов:** JSON-конфиг на сервере или таблица в БД (SQLite/PostgreSQL) — недоступны публично, редактируются только через админ-доступ.

## 3. Структура эндпоинтов

### 3.1. `POST /api/calculate`
Расчёт одной или нескольких позиций.

**Request body:**
```json
{
  "items": [
    { "length": 400, "width": 300, "height": 250, "quantity": 500 },
    { "length": 600, "width": 400, "height": 400, "quantity": 100 }
  ]
}
```

**Response body (200 OK):**
```json
{
  "items": [
    {
      "length": 400,
      "width": 300,
      "height": 250,
      "quantity": 500,
      "volume_liters": 30.0,
      "is_special": false,
      "price_per_unit_no_vat": 1.85,
      "total_price_no_vat": 925.00
    },
    {
      "length": 600,
      "width": 400,
      "height": 400,
      "quantity": 100,
      "volume_liters": 96.0,
      "is_special": true,
      "price_per_unit_no_vat": null,
      "total_price_no_vat": null,
      "special_message": "Это специальная розничная позиция. Пожалуйста, позвоните или напишите нам, и мы предложим вам наиболее актуальную и выгодную цену."
    }
  ],
  "summary": {
    "total_no_vat": 925.00,
    "vat_rate": 0.20,
    "total_with_vat": 1110.00
  }
}
```

**Валидация:**
- `length`, `width`, `height` — целые числа, 50–2000 мм.
- `quantity` — целое число, 1–100000.
- При несоответствии диапазону — `400 Bad Request` с полем `error`.

### 3.2. `POST /api/submit-order`
Отправка оформленной заявки (вызывается из модального окна "Оформить заявку").

**Request body:**
```json
{
  "name": "Иван Иванов",
  "phone": "+375291112233",
  "email": "ivan@example.com",
  "comment": "Нужно срочно",
  "items": [ /* тот же массив items из /calculate с результатами */ ],
  "summary": { "total_no_vat": 925.00, "total_with_vat": 1110.00 }
}
```

**Response (200 OK):**
```json
{ "status": "ok", "order_id": "BM-20260728-0001" }
```

**Логика обработки:**
1. Валидация обязательных полей (`name`, `phone`).
2. Формирование текста уведомления.
3. Параллельная отправка: (a) Email через Gmail SMTP/OAuth2, (b) сообщение в приватную Telegram-группу через Bot API.
4. Возврат `order_id` фронтенду для отображения в сообщении об успехе.

## 4. Защита эндпоинтов

- **CORS:** разрешён только домен сайта (`Access-Control-Allow-Origin: https://boxmart.by`).
- **Rate limiting:** не более 20 запросов в минуту с одного IP на `/api/calculate`.
- **Origin/Referer check:** отклонять запросы без корректного заголовка `Origin`.
- **Опционально:** временный токен сессии, выдаваемый при загрузке страницы (`GET /api/session-token`), обязательный для последующих вызовов `/api/calculate`.
- Тарифы и коэффициенты хранятся в переменных окружения или закрытой БД, не логируются в открытом виде.

## 5. Переменные окружения (.env)

```
GMAIL_USER=info@boxmart.by
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_CHAT_ID=-1001234567890
ALLOWED_ORIGIN=https://boxmart.by
RATE_LIMIT_PER_MINUTE=20
```

## 6. Пример реализации логики расчёта (Node.js, псевдокод)

```javascript
function calculateItem({ length, width, height, quantity }) {
  const isSpecial = length === 600 && width === 400 && height === 400;
  const volumeLiters = (length * width * height) / 1000000;

  if (isSpecial) {
    return {
      length, width, height, quantity,
      volume_liters: round1(volumeLiters),
      is_special: true,
      price_per_unit_no_vat: null,
      total_price_no_vat: null,
      special_message: "Это специальная розничная позиция. Пожалуйста, позвоните или напишите нам, и мы предложим вам наиболее актуальную и выгодную цену."
    };
  }

  const areaM2 = calculateBlankArea(length, width, height); // внутренняя формула раскроя
  const pricePerUnit = areaM2 * TARIFF_PER_M2 * getQuantityCoefficient(quantity);

  return {
    length, width, height, quantity,
    volume_liters: round1(volumeLiters),
    is_special: false,
    price_per_unit_no_vat: round2(pricePerUnit),
    total_price_no_vat: round2(pricePerUnit * quantity)
  };
}
```

## 7. Критерии готовности (Definition of Done)

- Эндпоинты `/api/calculate` и `/api/submit-order` развёрнуты и доступны по HTTPS.
- Фронтенд не содержит расчётных формул и тарифов в исходном коде.
- Заявка одновременно приходит на Gmail и в приватную Telegram-группу.
- Rate limiting и проверка Origin протестированы (запрос с постороннего домена отклоняется).
