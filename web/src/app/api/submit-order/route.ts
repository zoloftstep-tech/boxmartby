import { NextRequest, NextResponse } from "next/server";
import {
  buildMessageText,
  isAllowedOrigin,
  sendEmailNotification,
  sendTelegramMessage,
} from "@/lib/notifications";
import type { OrderRequest, OrderResponse } from "@/lib/types";

/**
 * Приём заявки + прямые уведомления (Вариант А):
 * Telegram Bot API + Gmail SMTP (nodemailer), без n8n.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  let order: OrderRequest;
  try {
    order = (await req.json()) as OrderRequest;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  if (!order?.name?.trim()) {
    return NextResponse.json({ error: "Укажите имя" }, { status: 400 });
  }
  if (!order?.phone || !/^\+375\d{9}$/.test(order.phone)) {
    return NextResponse.json({ error: "Телефон в формате +375XXXXXXXXX" }, { status: 400 });
  }
  if (!order.items?.length || !order.summary) {
    return NextResponse.json({ error: "Отсутствует состав заказа" }, { status: 400 });
  }

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const order_id = `BM-${stamp}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const messageText = buildMessageText(order, order_id);

  const results = await Promise.allSettled([
    sendTelegramMessage(messageText),
    sendEmailNotification(messageText, order),
  ]);

  if (results[0].status === "rejected") {
    console.error("[submit-order] Telegram failed:", results[0].reason);
  }
  if (results[1].status === "rejected") {
    console.error("[submit-order] Email failed:", results[1].reason);
  }

  if (results[0].status === "rejected" && results[1].status === "rejected") {
    return NextResponse.json({ error: "Failed to deliver notification" }, { status: 500 });
  }

  const response: OrderResponse = { status: "ok", order_id };
  return NextResponse.json(response);
}
