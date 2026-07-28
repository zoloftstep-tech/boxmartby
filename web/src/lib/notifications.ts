import nodemailer from "nodemailer";
import type { CalcItemResult, OrderRequest } from "@/lib/types";
import { buildStatusKeyboard } from "@/lib/telegram-status";

/** 600×400×400 в любом порядке — пометка в тексте уведомления */
export function isSpecialRetailDims(length: number, width: number, height: number): boolean {
  const dims = [length, width, height].sort((a, b) => a - b);
  return dims[0] === 400 && dims[1] === 400 && dims[2] === 600;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatItemLine(item: CalcItemResult, index: number): string {
  const special = isSpecialRetailDims(item.length, item.width, item.height);
  const base = `${index + 1}. ${item.length}×${item.width}×${item.height} мм · ${item.category_label} · ${item.material_label} · ${item.quantity} шт — ${formatMoney(item.price_per_unit_no_vat)} BYN/шт, итого ${formatMoney(item.total_price_no_vat)} BYN`;
  return special ? `${base} (специальная розничная позиция — уточнить цену)` : base;
}

export function buildMessageText(order: OrderRequest, orderId: string): string {
  const itemsText = order.items.map((it, i) => formatItemLine(it, i)).join("\n");

  return `Новый заказ с сайта #${orderId}

Имя: ${order.name}
Телефон: ${order.phone}
Email: ${order.email || "не указан"}
Комментарий: ${order.comment || "нет"}

Позиции:
${itemsText}

Итого без НДС: ${formatMoney(order.summary.total_no_vat)} BYN
Итого с НДС: ${formatMoney(order.summary.total_with_vat)} BYN`;
}

export async function sendTelegramMessage(text: string, orderId: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы");
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: buildStatusKeyboard(orderId),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Telegram API error: ${response.status} ${body}`);
  }
}

export async function sendEmailNotification(text: string, order: OrderRequest): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL_USER / GMAIL_APP_PASSWORD не заданы");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: user,
    to: user,
    subject: `Новая заявка с сайта — ${order.name}`,
    text,
  });
}

/** Разрешённые Origin: ALLOWED_ORIGIN + опционально ALLOWED_ORIGINS (через запятую) + localhost в development */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    // same-origin / некоторые клиенты без Origin — в production отклоняем
    return process.env.NODE_ENV !== "production";
  }

  const allowed = new Set<string>();
  if (process.env.ALLOWED_ORIGIN) allowed.add(process.env.ALLOWED_ORIGIN.trim());
  if (process.env.ALLOWED_ORIGINS) {
    for (const part of process.env.ALLOWED_ORIGINS.split(",")) {
      const v = part.trim();
      if (v) allowed.add(v);
    }
  }

  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost:3000");
    allowed.add("http://127.0.0.1:3000");
  }

  return allowed.has(origin);
}
