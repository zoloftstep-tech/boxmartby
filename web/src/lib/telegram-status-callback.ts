import {
  appendStatusHistory,
  formatStatusActor,
  parseCallbackData,
  STATUS_META,
  buildStatusKeyboard,
} from "@/lib/telegram-status";
import { syncOrderLinkCardText } from "@/lib/orderLinking";

export type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

export type TelegramCallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
  };
};

export type TelegramUpdate = {
  callback_query?: TelegramCallbackQuery;
};

async function telegramApi(
  botToken: string,
  method: string,
  body: Record<string, unknown>,
): Promise<void> {
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

/**
 * Обрабатывает callback_query inline-кнопок статусов:
 * - answerCallbackQuery (короткое подтверждение)
 * - editMessageText (редактирует то же сообщение и дописывает накопительную историю)
 */
export async function handleStatusCallbackUpdate(botToken: string, update: TelegramUpdate): Promise<void> {
  const cq = update.callback_query;
  if (!cq) return;

  const parsed = cq.data ? parseCallbackData(cq.data) : null;
  if (!parsed || !cq.message?.text) {
    await telegramApi(botToken, "answerCallbackQuery", {
      callback_query_id: cq.id,
      text: "Не удалось обработать статус",
      show_alert: false,
    }).catch(() => undefined);
    return;
  }

  const actor = formatStatusActor(cq.from);
  const newText = appendStatusHistory(cq.message.text, parsed.code, actor);
  const label = STATUS_META[parsed.code].label;

  try {
    await telegramApi(botToken, "answerCallbackQuery", {
      callback_query_id: cq.id,
      text: label,
      show_alert: false,
    });
    await telegramApi(botToken, "editMessageText", {
      chat_id: cq.message.chat.id,
      message_id: cq.message.message_id,
      text: newText,
      reply_markup: buildStatusKeyboard(parsed.orderId),
    });
    await syncOrderLinkCardText(parsed.orderId, newText).catch(() => undefined);
  } catch (err) {
    console.error("[telegram/status-callback]", err);
    await telegramApi(botToken, "answerCallbackQuery", {
      callback_query_id: cq.id,
      text: "Ошибка обновления статуса",
      show_alert: true,
    }).catch(() => undefined);
  }
}

