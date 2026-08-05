import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  buildMessageText,
  isAllowedOrigin,
  sendEmailNotification,
} from "@/lib/notifications";
import type { OrderRequest, OrderResponse } from "@/lib/types";

type CrmIngestResponse = {
  status?: string;
  order_id?: string;
  duplicate?: boolean;
  ok?: boolean;
  error?: string;
};

async function ingestToCrm(order: OrderRequest, idempotencyKey: string): Promise<string> {
  const crmUrl =
    process.env.CRM_INGEST_URL?.trim() ||
    "https://boxmart-crm.vercel.app/api/ingest/site";
  const secret = process.env.INGEST_SITE_SECRET?.trim();
  if (!secret) {
    throw new Error("INGEST_SITE_SECRET не задан");
  }

  const response = await fetch(crmUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(order),
  });

  const data = (await response.json().catch(() => null)) as CrmIngestResponse | null;
  if (!response.ok) {
    const detail = data?.error || response.statusText || "CRM ingest failed";
    throw new Error(detail);
  }

  const orderId = data?.order_id;
  if (!orderId) {
    throw new Error("CRM не вернул order_id");
  }
  return orderId;
}

/**
 * Приём заявки: CRM ingest (source of truth) + email-уведомление.
 * Telegram notify отправляет CRM после ingest.
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

  const idempotencyKey =
    req.headers.get("idempotency-key")?.trim() || `site:${randomUUID()}`;

  let order_id: string;
  try {
    order_id = await ingestToCrm(order, idempotencyKey);
  } catch (err) {
    console.error("[submit-order] CRM ingest failed:", err);
    return NextResponse.json(
      { error: "Не удалось создать заказ в CRM" },
      { status: 502 },
    );
  }

  const messageText = buildMessageText(order, order_id);

  try {
    await sendEmailNotification(messageText, order);
  } catch (err) {
    console.error("[submit-order] Email failed:", err);
    // Заказ уже в CRM — не откатываем из-за почты.
  }

  const response: OrderResponse = { status: "ok", order_id };
  return NextResponse.json(response);
}
