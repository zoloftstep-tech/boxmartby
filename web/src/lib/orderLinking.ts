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
  o: string; // orderId
  c: number; // targetChatId
  m: number; // targetMessageId
  d: ParsedOrderData;
  n: string; // managerFirstName
  t?: string; // original optopak text (optional, truncated)
};

/**
 * Вариант B: in-memory Map + durable `#oplink` в тексте confirmation-сообщения.
 * Map помогает в рамках одного инстанса; `#oplink` переживает cold start на Vercel.
 * Позже внутренности можно заменить на storage-backed вариант A без смены вызовов.
 */
const linksByOptopakMessageId = new Map<number, OrderCardLink>();

export function encodeOptopakLinkRef(link: OrderCardLink): string {
  const payload: DurableLinkPayload = {
    o: link.orderId,
    c: link.targetChatId,
    m: link.targetMessageId,
    d: link.orderData,
    n: link.managerFirstName,
    t: link.optopakOriginalText.slice(0, 400),
  };
  return `#oplink:${Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")}`;
}

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
      // cardText восстанавливается вызывающей стороной через buildParserCardText
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
}

export async function findOptopakOrderLinkForReply(params: {
  replyToMessageId: number;
  replyToText?: string | null;
}): Promise<OrderCardLink | null> {
  const fromMemory = linksByOptopakMessageId.get(params.replyToMessageId);
  if (fromMemory) return fromMemory;
  return parseOptopakLinkRef(params.replyToText);
}

export async function updateLinkedCard(params: {
  optopakMessageId: number;
  cardText: string;
  orderData?: ParsedOrderData;
}): Promise<void> {
  const link = linksByOptopakMessageId.get(params.optopakMessageId);
  if (!link) return;
  linksByOptopakMessageId.set(params.optopakMessageId, {
    ...link,
    cardText: params.cardText,
    orderData: params.orderData ?? link.orderData,
  });
}
