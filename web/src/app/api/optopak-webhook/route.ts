import { NextRequest, NextResponse } from "next/server";
import { buildStatusKeyboard } from "@/lib/telegram-status";
import { handleStatusCallbackUpdate } from "@/lib/telegram-status-callback";
import { applyReplyChangeToCardText, buildParserCardText, hasOrderDimensions, looksLikeOrderMessage } from "@/lib/parser-bot";
import {
  parseOrderFromOptopak,
  parseReplyChange,
  type ParsedOrder,
  type ParsedOrderChange,
} from "@/lib/perplexity";
import {
  findOptopakOrderLinkForReply,
  saveOptopakOrderLink,
  updateLinkedCard,
  encodeOptopakLinkRef,
  type OrderCardLink,
  type ParsedOrderData,
} from "@/lib/orderLinking";

type TelegramUser = { id: number; username?: string; first_name?: string; last_name?: string };

type TelegramChat = { id: number };

type TelegramReplyToMessage = {
  message_id: number;
  text?: string;
};

type TelegramMessage = {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  text?: string;
  reply_to_message?: TelegramReplyToMessage;
};

type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: {
    message_id: number;
    chat: TelegramChat;
    text?: string;
  };
};

type TelegramUpdate = {
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
};

async function telegramApi(botToken: string, method: string, body: Record<string, unknown>): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Telegram ${method} failed: ${response.status} ${text}`);
  }
}

async function telegramSendMessage(params: {
  botToken: string;
  chatId: number;
  text: string;
  replyToMessageId?: number;
  replyMarkup?: Record<string, unknown>;
  parseMode?: "HTML" | "MarkdownV2";
}): Promise<number> {
  const response = await fetch(`https://api.telegram.org/bot${params.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: params.text,
      reply_to_message_id: params.replyToMessageId,
      reply_markup: params.replyMarkup,
      parse_mode: params.parseMode,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Telegram sendMessage failed: ${response.status} ${text}`);
  }

  const body = (await response.json()) as any;
  return body?.result?.message_id as number;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildConfirmWithHiddenLink(humanLines: string[], link: OrderCardLink): string {
  const human = humanLines.map(escapeHtml).join("\n");
  const ref = escapeHtml(encodeOptopakLinkRef(link));
  return `${human}\n<tg-spoiler>${ref}</tg-spoiler>`;
}

async function telegramEditMessageText(params: {
  botToken: string;
  chatId: number;
  messageId: number;
  text: string;
  replyMarkup?: Record<string, unknown>;
}): Promise<void> {
  await telegramApi(params.botToken, "editMessageText", {
    chat_id: params.chatId,
    message_id: params.messageId,
    text: params.text,
    reply_markup: params.replyMarkup,
  });
}

function normalizeParsedOrder(order: ParsedOrder): ParsedOrderData | null {
  const length = typeof order.length === "number" ? order.length : null;
  const width = typeof order.width === "number" ? order.width : null;
  const height = typeof order.height === "number" ? order.height : null;
  const quantityRaw = typeof order.quantity === "number" ? order.quantity : null;
  const priceRaw = typeof order.price_per_unit === "number" ? order.price_per_unit : null;

  if (length == null || width == null || height == null || quantityRaw == null || priceRaw == null) return null;

  const quantity = Math.round(quantityRaw);
  const price_per_unit = Math.round(priceRaw * 100) / 100;

  const inRange = (v: number) => Number.isFinite(v) && v >= 50 && v <= 2000;
  if (!inRange(length) || !inRange(width) || !inRange(height)) return null;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (!Number.isFinite(price_per_unit) || price_per_unit <= 0) return null;

  return {
    length: Math.round(length),
    width: Math.round(width),
    height: Math.round(height),
    quantity,
    price_per_unit,
  };
}

function getMissingFields(order: ParsedOrder): string[] {
  const missing: string[] = [];
  if (order.length == null) missing.push("length");
  if (order.width == null) missing.push("width");
  if (order.height == null) missing.push("height");
  if (order.quantity == null) missing.push("quantity");
  if (order.price_per_unit == null) missing.push("price_per_unit");
  return missing;
}

function humanizeMissingField(field: string): string {
  const map: Record<string, string> = {
    length: "Длину (мм)",
    width: "Ширину (мм)",
    height: "Высоту (мм)",
    quantity: "Тираж (шт)",
    price_per_unit: "Цену за штуку (BYN)",
  };
  return map[field] ?? field;
}

function applyChangeToOrderData(params: {
  current: ParsedOrderData;
  change: ParsedOrderChange;
}): ParsedOrderData | null {
  const next: ParsedOrderData = { ...params.current };

  if (params.change.has_change === false) return null;

  if (params.change.changes?.length) {
    for (const c of params.change.changes) {
      const field = c.field;
      const value = c.value;
      if (!Number.isFinite(value)) continue;
      if (field === "quantity") next.quantity = Math.round(value);
      else if (field === "length") next.length = Math.round(value);
      else if (field === "width") next.width = Math.round(value);
      else if (field === "height") next.height = Math.round(value);
      else if (field === "price_per_unit") next.price_per_unit = Math.round(value * 100) / 100;
    }
  } else if (params.change.field_changed && typeof (params.change as any).new_value === "number") {
    // single-field mode
    const field = params.change.field_changed;
    const value = (params.change as any).new_value as number;
    if (field === "quantity") next.quantity = Math.round(value);
    else if (field === "length") next.length = Math.round(value);
    else if (field === "width") next.width = Math.round(value);
    else if (field === "height") next.height = Math.round(value);
    else if (field === "price_per_unit") next.price_per_unit = Math.round(value * 100) / 100;
  }

  // Re-validate by re-normalizing
  const normalized = normalizeParsedOrder({
    is_order_data: true,
    is_new_order: true,
    length: next.length,
    width: next.width,
    height: next.height,
    quantity: next.quantity,
    price_per_unit: next.price_per_unit,
  });
  return normalized;
}

// In-memory context for is_new_order classification.
const recentTextsByChatId = new Map<number, string[]>();
const RECENT_LIMIT = 5;

function pushRecentText(chatId: number, text: string) {
  const arr = recentTextsByChatId.get(chatId) ?? [];
  arr.push(text);
  while (arr.length > RECENT_LIMIT) arr.shift();
  recentTextsByChatId.set(chatId, arr);
}

function getRecentContext(chatId: number, excludingNewest: string): string[] {
  const arr = recentTextsByChatId.get(chatId) ?? [];
  // Exclude the most recent matching text if it equals current; best-effort only.
  return arr.filter((t) => t !== excludingNewest).slice(-3);
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_PARSER_WEBHOOK_SECRET;
  const botToken = process.env.TELEGRAM_PARSER_BOT_TOKEN;
  const targetChatIdRaw = process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
  const targetChatId = targetChatIdRaw ? Number(targetChatIdRaw) : null;

  if (!secret || !botToken || !targetChatId || Number.isNaN(targetChatId)) {
    console.error("[optopak-webhook] env missing", {
      hasSecret: Boolean(secret),
      hasBotToken: Boolean(botToken),
      targetChatIdRaw,
    });
    return NextResponse.json({ ok: false, error: "parser bot env not configured" }, { status: 500 });
  }

  const header = request.headers.get("x-telegram-bot-api-secret-token");
  if (header !== secret) {
    console.error("[optopak-webhook] secret mismatch");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  try {
    // 1) Callback queries: status buttons edit the same message.
    if (update.callback_query) {
      await handleStatusCallbackUpdate(botToken, update);
      return NextResponse.json({ ok: true });
    }

    // 2) Ordinary messages from Optopak.
    const msg = update.message;
    if (!msg || typeof msg.text !== "string" || !msg.text.trim()) {
      console.log("[optopak-webhook] ignore: no text message", {
        hasMessage: Boolean(msg),
        keys: Object.keys(update),
      });
      return NextResponse.json({ ok: true });
    }

    const optopakChatId = msg.chat.id;
    const managerFirstName = msg.from?.first_name ?? "—";
    const text = msg.text.trim();

    console.log("[optopak-webhook] message", {
      chatId: optopakChatId,
      messageId: msg.message_id,
      textPreview: text.slice(0, 120),
      isReply: Boolean(msg.reply_to_message?.message_id),
    });

    // Keep recent context no matter what, so is_new_order can use it.
    const previousContext = getRecentContext(optopakChatId, text);
    pushRecentText(optopakChatId, text);

    // Reply updates: edit already created parser card.
    if (msg.reply_to_message?.message_id) {
      const replyToMessageId = msg.reply_to_message.message_id;
      const replyToText = msg.reply_to_message.text ?? "";
      let link = await findOptopakOrderLinkForReply({
        replyToMessageId,
        replyToText,
      });

      if (link && !link.cardText) {
        link = {
          ...link,
          cardText: buildParserCardText({
            orderData: link.orderData,
            managerFirstName: link.managerFirstName,
          }),
        };
      }

      if (!link) {
        await telegramSendMessage({
          botToken,
          chatId: optopakChatId,
          text:
            "Не удалось найти связанную карточку. Для уточнения сделайте reply на сообщение бота «Заявка BM-… отправлена…» (не на исходный текст заказа).",
          replyToMessageId: msg.message_id,
        }).catch(() => undefined);
        return NextResponse.json({ ok: true });
      }

      // Perplexity parse changes
      if (!/\d/.test(text)) {
        return NextResponse.json({ ok: true });
      }

      const replyChange = await parseReplyChange({
        originalText: link.optopakOriginalText || replyToText,
        replyText: text,
      });

      const nextOrderData = replyChange.has_change
        ? applyChangeToOrderData({ current: link.orderData, change: replyChange })
        : null;
      if (!nextOrderData) {
        await telegramSendMessage({
          botToken,
          chatId: optopakChatId,
          text: "Не удалось распознать уточнение. Укажите конкретно, что меняем (например: «тираж 600»).",
          replyToMessageId: msg.message_id,
        }).catch(() => undefined);
        return NextResponse.json({ ok: true });
      }

      const updatedCardText = applyReplyChangeToCardText({
        oldCardText: link.cardText,
        nextOrderData,
        replyChange,
        clarifierFirstName: managerFirstName,
      });

      try {
        await telegramEditMessageText({
          botToken,
          chatId: link.targetChatId,
          messageId: link.targetMessageId,
          text: updatedCardText,
          replyMarkup: buildStatusKeyboard(link.orderId),
        });
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        console.error("[optopak-webhook] edit target failed", detail);
        await telegramSendMessage({
          botToken,
          chatId: optopakChatId,
          text: `Не удалось обновить карточку ${link.orderId}: ${detail.slice(0, 300)}`,
          replyToMessageId: msg.message_id,
        }).catch(() => undefined);
        return NextResponse.json({ ok: true });
      }

      const updatedLink: OrderCardLink = {
        ...link,
        cardText: updatedCardText,
        orderData: nextOrderData,
      };

      await updateLinkedCard({
        optopakMessageId: replyToMessageId,
        cardText: updatedCardText,
        orderData: nextOrderData,
      });
      await saveOptopakOrderLink({
        optopakMessageId: msg.message_id,
        link: updatedLink,
      }).catch(() => undefined);

      const confirmId = await telegramSendMessage({
        botToken,
        chatId: optopakChatId,
        text: buildConfirmWithHiddenLink(
          [`Карточка ${link.orderId} обновлена.`, "Чтобы уточнить ещё — reply на это сообщение."],
          updatedLink,
        ),
        replyToMessageId: msg.message_id,
        parseMode: "HTML",
      }).catch(() => undefined);

      if (typeof confirmId === "number") {
        await saveOptopakOrderLink({
          optopakMessageId: confirmId,
          link: updatedLink,
        }).catch(() => undefined);
      }

      return NextResponse.json({ ok: true });
    }

    // New order messages
    if (!looksLikeOrderMessage(text)) {
      console.log("[optopak-webhook] ignore: heuristic miss");
      return NextResponse.json({ ok: true });
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      console.error("[optopak-webhook] PERPLEXITY_API_KEY missing");
      await telegramSendMessage({
        botToken,
        chatId: optopakChatId,
        text: "Парсер временно не может распознать заявку: не задан PERPLEXITY_API_KEY.",
        replyToMessageId: msg.message_id,
      }).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }

    const parsed = await parseOrderFromOptopak({
      text,
      recentContext: previousContext,
    });

    console.log("[optopak-webhook] perplexity result", {
      is_order_data: parsed.is_order_data,
      is_new_order: parsed.is_new_order,
      length: parsed.length,
      width: parsed.width,
      height: parsed.height,
      quantity: parsed.quantity,
      price_per_unit: parsed.price_per_unit,
    });

    if (!parsed.is_order_data) {
      console.log("[optopak-webhook] ignore: not order data");
      return NextResponse.json({ ok: true });
    }

    const normalizedOrder = normalizeParsedOrder(parsed);
    if (!normalizedOrder) {
      // Incomplete without dimensions = noise/status update — ignore silently.
      if (!hasOrderDimensions(text)) {
        console.log("[optopak-webhook] ignore: incomplete without dimensions");
        return NextResponse.json({ ok: true });
      }

      const missing = getMissingFields(parsed);
      const missingText =
        missing.length === 0
          ? "Проверьте диапазоны: ДШВ (50–2000 мм), тираж (целое > 0), цена ( > 0)."
          : missing.map(humanizeMissingField).join(", ");
      await telegramSendMessage({
        botToken,
        chatId: optopakChatId,
        text: `Не хватает данных для заказа. Уточните: ${missingText}.`,
        replyToMessageId: msg.message_id,
      }).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }

    // Full valid order in a non-reply message is treated as a new card even if
    // the LLM marked is_new_order=false (common false negative with chat context).
    if (!parsed.is_new_order) {
      console.log("[optopak-webhook] is_new_order=false but fields complete — publishing anyway");
    }

    const orderId = `BM-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const cardText = buildParserCardText({
      orderData: normalizedOrder,
      managerFirstName,
    });

    let targetMessageId: number;
    try {
      targetMessageId = await telegramSendMessage({
        botToken,
        chatId: targetChatId,
        text: cardText,
        replyMarkup: buildStatusKeyboard(orderId),
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("[optopak-webhook] send to target failed", { targetChatId, detail });
      await telegramSendMessage({
        botToken,
        chatId: optopakChatId,
        text: `Не удалось отправить карточку в группу заявок (chat_id=${targetChatId}). Проверьте, что парсер-бот добавлен в целевую группу и TELEGRAM_CHAT_ID верный.\n\n${detail.slice(0, 300)}`,
        replyToMessageId: msg.message_id,
      }).catch(() => undefined);
      return NextResponse.json({ ok: true });
    }

    const link: OrderCardLink = {
      orderId,
      targetChatId,
      targetMessageId,
      cardText,
      orderData: normalizedOrder,
      optopakOriginalText: text,
      managerFirstName,
    };

    await saveOptopakOrderLink({ optopakMessageId: msg.message_id, link });
    console.log("[optopak-webhook] published", { orderId, targetChatId, targetMessageId, fromChatId: optopakChatId });

    const confirmId = await telegramSendMessage({
      botToken,
      chatId: optopakChatId,
      text: buildConfirmWithHiddenLink(
        [
          `Заявка ${orderId} отправлена в группу заявок.`,
          "Чтобы уточнить параметры — сделайте reply на это сообщение.",
        ],
        link,
      ),
      replyToMessageId: msg.message_id,
      parseMode: "HTML",
    }).catch(() => undefined);

    if (typeof confirmId === "number") {
      await saveOptopakOrderLink({ optopakMessageId: confirmId, link }).catch(() => undefined);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[optopak-webhook] unhandled error", err);
    return NextResponse.json({ ok: true });
  }
}

