# Техническое задание — Дополнение
## Прямая интеграция уведомлений (Вариант А, без n8n)
### ООО «БОКСМАРТ» — API калькулятора и заявок

**Версия:** 1.1
**Дата:** 28 июля 2026

Этот документ заменяет раздел 6 файла `BoxMart-Website-TZ.md` (инструкция по n8n) и дополняет раздел 3.2 файла `BoxMart-API-TZ.md`. Вместо промежуточного сервиса автоматизации (n8n) уведомления отправляются напрямую из кода API-эндпоинта `/api/submit-order`.

---

## 1. Общая логика

При вызове `/api/submit-order` сервер параллельно выполняет два действия:
1. Отправляет сообщение в приватную Telegram-группу через прямой HTTP-запрос к Telegram Bot API.
2. Отправляет email на корпоративный Gmail-адрес через SMTP (библиотека `nodemailer`) с использованием Gmail App Password.

Оба действия выполняются в одном обработчике запроса, без внешних вебхуков и визуальных конструкторов.

---

## 2. Подготовительные шаги (не меняются)

### 2.1. Telegram-бот и приватная группа
1. Создать бота через `@BotFather` (`/newbot`), сохранить `TELEGRAM_BOT_TOKEN`.
2. Создать приватную Telegram-группу «БОКСМАРТ — заявки с сайта», тип **Private**.
3. Добавить бота в группу, выдать права администратора.
4. Получить `Chat ID` группы (отрицательное число вида `-1001234567890`) через `@getidsbot` или из логов первого сообщения.
5. В `@BotFather` выполнить `/setjoingroups` → `Disable`, чтобы исключить самостоятельное добавление бота в посторонние группы.
6. Ссылки-приглашения в группу выдавать коллегам через Group Info → Invite Links (с ограничением по времени/числу использований при необходимости).

### 2.2. Gmail App Password
1. Включить двухфакторную аутентификацию в Google-аккаунте.
2. Google Account → Security → App Passwords → создать пароль для категории "Mail".
3. Сохранить 16-значный пароль как `GMAIL_APP_PASSWORD`.

---

## 3. Переменные окружения (.env)

```
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_CHAT_ID=-1001234567890
GMAIL_USER=info@boxmart.by
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
ALLOWED_ORIGIN=https://boxmart.by
```

---

## 4. Установка зависимостей

```bash
npm install nodemailer
```
(Для Telegram отдельная библиотека не нужна — используется встроенный `fetch`.)

---

## 5. Реализация: Next.js API Route

Файл: `app/api/submit-order/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface OrderItem {
  length: number;
  width: number;
  height: number;
  quantity: number;
  price_per_unit_no_vat: number | null;
  total_price_no_vat: number | null;
  is_special: boolean;
}

interface OrderPayload {
  name: string;
  phone: string;
  email?: string;
  comment?: string;
  items: OrderItem[];
  summary: { total_no_vat: number; total_with_vat: number };
}

function buildMessageText(order: OrderPayload, orderId: string): string {
  const itemsText = order.items
    .map((it, i) => {
      if (it.is_special) {
        return `${i + 1}. ${it.length}x${it.width}x${it.height} мм, ${it.quantity} шт — цена по запросу`;
      }
      return `${i + 1}. ${it.length}x${it.width}x${it.height} мм, ${it.quantity} шт — ${it.price_per_unit_no_vat} BYN/шт, итого ${it.total_price_no_vat} BYN`;
    })
    .join("\n");

  return `Новый заказ с сайта #${orderId}

Имя: ${order.name}
Телефон: ${order.phone}
Email: ${order.email || "не указан"}
Комментарий: ${order.comment || "нет"}

Позиции:
${itemsText}

Итого без НДС: ${order.summary.total_no_vat} BYN
Итого с НДС: ${order.summary.total_with_vat} BYN`;
}

async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  if (!response.ok) {
    throw new Error(`Telegram API error: ${response.status}`);
  }
}

async function sendEmailNotification(text: string, order: OrderPayload): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: process.env.GMAIL_USER,
    subject: `Новая заявка с сайта — ${order.name}`,
    text,
  });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin !== process.env.ALLOWED_ORIGIN) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const order: OrderPayload = await req.json();

  if (!order.name || !order.phone) {
    return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
  }

  const orderId = `BM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const messageText = buildMessageText(order, orderId);

  const results = await Promise.allSettled([
    sendTelegramMessage(messageText),
    sendEmailNotification(messageText, order),
  ]);

  const telegramFailed = results[0].status === "rejected";
  const emailFailed = results[1].status === "rejected";

  if (telegramFailed && emailFailed) {
    return NextResponse.json({ error: "Failed to deliver notification" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", order_id: orderId });
}
```

---

## 6. Обработка сбоев (важно для надёжности)

- Используется `Promise.allSettled`, а не `Promise.all` — если Telegram недоступен, email всё равно отправится, и наоборот.
- Заявка считается неуспешной только если **оба** канала не сработали одновременно.
- Рекомендуется логировать ошибки отправки в консоль/систему логирования сервера (например, через `console.error(results)`), чтобы не пропустить сбой одного из каналов.

---

## 7. Критерии готовности (Definition of Done)

- При отправке тестовой заявки сообщение приходит и в Telegram-группу, и на Gmail в течение нескольких секунд.
- При отключении интернета у Telegram-бота (симуляция сбоя) заявка всё равно доходит на email, и наоборот.
- Запрос с постороннего домена (не `ALLOWED_ORIGIN`) отклоняется с кодом 403.
- Токены и пароли не присутствуют в коде — только в переменных окружения `.env` (файл добавлен в `.gitignore`).
