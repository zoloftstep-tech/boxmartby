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

/**
 * Вариант B: in-memory Map.
 * На Vercel это не гарантирует 100% сохранность между инстансами,
 * но структура модуля позволяет заменить внутренности на storage-backed вариант A.
 */
const linksByOptopakMessageId = new Map<number, OrderCardLink>();

export async function saveOptopakOrderLink(params: {
  optopakMessageId: number;
  link: OrderCardLink;
}): Promise<void> {
  linksByOptopakMessageId.set(params.optopakMessageId, params.link);
}

export async function findOptopakOrderLinkForReply(params: {
  replyToMessageId: number;
}): Promise<OrderCardLink | null> {
  return linksByOptopakMessageId.get(params.replyToMessageId) ?? null;
}

export async function updateLinkedCard(params: { optopakMessageId: number; cardText: string }): Promise<void> {
  const link = linksByOptopakMessageId.get(params.optopakMessageId);
  if (!link) return;
  linksByOptopakMessageId.set(params.optopakMessageId, { ...link, cardText: params.cardText });
}

