import { NextRequest, NextResponse } from "next/server";
import {
  buildMessageText,
  isAllowedOrigin,
  sendEmailNotification,
} from "@/lib/notifications";
import { buildSiteIdempotencyKey } from "@/lib/idempotency";
import { enrichQuotedItems } from "@/lib/enrich-quoted-items";
import { validateItem } from "@/lib/pricing/calculate";
import { calculateViaRemote } from "@/lib/pricing/remote-calculate";
import { getLivePricingConfig } from "@/lib/pricing/remote-defaults";
import type { CalcItemInput, OrderRequest, OrderResponse } from "@/lib/types";

type CrmIngestResponse = {
  status?: string;
  order_id?: string;
  duplicate?: boolean;
  ok?: boolean;
  error?: string;
};

async function ingestToCrm(
  order: Omit<OrderRequest, "personalDataConsent">,
  idempotencyKey: string,
): Promise<string> {
  const crmUrl = process.env.CRM_INGEST_URL?.trim();
  const secret = process.env.INGEST_SITE_SECRET?.trim();
  if (!crmUrl) {
    throw new Error("CRM_INGEST_URL не задан");
  }
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
 * Приём заявки: server re-quote (remote BoxCalc) → CRM ingest + email.
 * Client prices are ignored. Telegram notify отправляет CRM после ingest.
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
  if (order.personalDataConsent !== true) {
    return NextResponse.json(
      { error: "Нужно согласие на обработку персональных данных" },
      { status: 400 },
    );
  }
  if (!order.items?.length || !order.summary) {
    return NextResponse.json({ error: "Отсутствует состав заказа" }, { status: 400 });
  }

  const { pricing } = await getLivePricingConfig();
  const calcInputs: CalcItemInput[] = [];
  for (const raw of order.items) {
    const category = raw.category ?? "fourFlap";
    let dieId =
      "dieId" in raw && (raw as { dieId?: string }).dieId
        ? String((raw as { dieId?: string }).dieId)
        : undefined;
    // Calc results omit dieId; recover for ourDies so remote quote matches.
    if (category === "ourDies" && !dieId) {
      const L = Number(raw.length);
      const W = Number(raw.width);
      const H = Number(raw.height);
      const match = pricing.ourDies.find(
        (d) =>
          d.A === L &&
          d.B === W &&
          d.H === H &&
          (!raw.formulaTypeId || d.formulaTypeId === raw.formulaTypeId),
      );
      dieId = match?.id;
    }
    const item: CalcItemInput = {
      length: Number(raw.length),
      width: Number(raw.width),
      height: Number(raw.height),
      quantity: Number(raw.quantity),
      category,
      material: raw.material ?? "t22",
      dieId,
      formulaTypeId: raw.formulaTypeId ? String(raw.formulaTypeId) : undefined,
    };
    const err = validateItem(item, pricing);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }
    calcInputs.push(item);
  }

  const quoted = await calculateViaRemote(calcInputs);
  if (!quoted) {
    return NextResponse.json(
      { error: "Расчёт цен временно недоступен. Попробуйте позже." },
      { status: 503 },
    );
  }

  const enrichedItems = enrichQuotedItems(quoted.items, calcInputs, pricing);

  const { personalDataConsent: _, ...rest } = order;
  void _;
  const crmOrder: Omit<OrderRequest, "personalDataConsent"> = {
    ...rest,
    items: enrichedItems,
    summary: {
      total_no_vat: quoted.summary.total_no_vat,
      total_with_vat: quoted.summary.total_with_vat,
    },
  };

  if (!process.env.CRM_INGEST_URL?.trim() || !process.env.INGEST_SITE_SECRET?.trim()) {
    return NextResponse.json(
      { error: "Приём заявок временно недоступен" },
      { status: 503 },
    );
  }

  const idempotencyKey = buildSiteIdempotencyKey(
    req.headers.get("idempotency-key"),
    crmOrder,
  );
  let order_id: string;
  try {
    order_id = await ingestToCrm(crmOrder, idempotencyKey);
  } catch (err) {
    console.error("[submit-order] CRM ingest failed:", err);
    return NextResponse.json(
      { error: "Не удалось создать заказ в CRM" },
      { status: 502 },
    );
  }

  const pricedOrder: OrderRequest = {
    ...crmOrder,
    personalDataConsent: true,
  };
  const messageText = buildMessageText(pricedOrder, order_id);

  try {
    await sendEmailNotification(messageText, pricedOrder);
  } catch (err) {
    console.error("[submit-order] Email failed:", err);
    // Заказ уже в CRM — не откатываем из-за почты.
  }

  const response: OrderResponse = { status: "ok", order_id };
  return NextResponse.json(response);
}
