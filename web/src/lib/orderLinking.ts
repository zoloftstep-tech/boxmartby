export type ParsedOrderData = {
  length: number;
  width: number;
  height: number;
  quantity: number; // integer
  price_per_unit: number; // numeric (BYN)
};

export type OrderCardLink = {
  orderId: string;
  targetChatId: number;
  targetMessageId: number;
  cardText: string;
  orderData: ParsedOrderData;
  optopakOriginalText: string;
  managerFirstName: string;
};

type DurableLinkPayload = {
  o: string;
  c: number;
  m: number;
  d: ParsedOrderData;
  n: string;
  t?: string;
};

/**
 * Вариант B: in-memory индексы по message_id и orderId.
 * Подтверждения бота без #oplink в тексте; reply ищет связь по памяти
 * или по BM-… в тексте подтверждения. Позже можно заменить на storage (вариант A).
 */
const linksByOptopakMessageId = new Map<number, OrderCardLink>();
const linksByOrderId = new Map<string, OrderCardLink>();

const ORDER_ID_RE = /\bBM-\d{8}-\d+\b/;

export function extractOrderIdFromText(text: string | undefined | null): string | null {
  if (!text) return null;
  return text.match(ORDER_ID_RE)?.[0] ?? null;
}

/** Legacy: старые подтверждения могли содержать #oplink — оставляем разбор. */
export function parseOptopakLinkRef(text: string | undefined | null): OrderCardLink | null {
  if (!text) return null;
  const match = text.match(/#oplink:([A-Za-z0-9_-]+)/);
  if (!match?.[1]) return null;
  try {
    const raw = Buffer.from(match[1], "base64url").toString("utf8");
    const payload = JSON.parse(raw) as DurableLinkPayload;
    if (!payload?.o || !payload?.c || !payload?.m || !payload?.d) return null;
    const d = payload.d;
    if (
      typeof d.length !== "number" ||
      typeof d.width !== "number" ||
      typeof d.height !== "number" ||
      typeof d.quantity !== "number" ||
      typeof d.price_per_unit !== "number"
    ) {
      return null;
    }
    return {
      orderId: payload.o,
      targetChatId: payload.c,
      targetMessageId: payload.m,
      orderData: d,
      managerFirstName: payload.n || "—",
      optopakOriginalText: payload.t || "",
      cardText: "",
    };
  } catch {
    return null;
  }
}

export async function saveOptopakOrderLink(params: {
  optopakMessageId: number;
  link: OrderCardLink;
}): Promise<void> {
  linksByOptopakMessageId.set(params.optopakMessageId, params.link);
  linksByOrderId.set(params.link.orderId, params.link);
}

export async function findOptopakOrderLinkForReply(params: {
  replyToMessageId: number;
  replyToText?: string | null;
}): Promise<OrderCardLink | null> {
  const fromMemory = linksByOptopakMessageId.get(params.replyToMessageId);
  if (fromMemory) return fromMemory;

  const orderId = extractOrderIdFromText(params.replyToText);
  if (orderId) {
    const byOrder = linksByOrderId.get(orderId);
    if (byOrder) return byOrder;
  }

  // Back-compat for older confirmations that still contain #oplink
  return parseOptopakLinkRef(params.replyToText);
}

export async function updateLinkedCard(params: {
  optopakMessageId: number;
  cardText: string;
  orderData?: ParsedOrderData;
}): Promise<void> {
  const link = linksByOptopakMessageId.get(params.optopakMessageId);
  if (!link) {
    // Try update by scanning order index if message map missed
    return;
  }
  const next = {
    ...link,
    cardText: params.cardText,
    orderData: params.orderData ?? link.orderData,
  };
  linksByOptopakMessageId.set(params.optopakMessageId, next);
  linksByOrderId.set(next.orderId, next);
}

/** После нажатия статус-кнопки: обновить cardText у всех in-memory ссылок на заказ. */
export async function syncOrderLinkCardText(orderId: string, cardText: string): Promise<void> {
  const byOrder = linksByOrderId.get(orderId);
  if (byOrder) {
    linksByOrderId.set(orderId, { ...byOrder, cardText });
  }
  for (const [messageId, link] of linksByOptopakMessageId) {
    if (link.orderId === orderId) {
      linksByOptopakMessageId.set(messageId, { ...link, cardText });
    }
  }
}
