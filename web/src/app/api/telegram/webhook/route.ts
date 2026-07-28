import { NextRequest, NextResponse } from "next/server";
import {
  appendStatusHistory,
  buildStatusKeyboard,
  formatStatusActor,
  parseCallbackData,
  STATUS_META,
} from "@/lib/telegram-status";

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type CallbackQuery = {
  id: string;
  from: TelegramUser;
  data?: string;
  message?: {
    message_id: number;
    chat: { id: number };
    text?: string;
  };
};

type TelegramUpdate = {
  callback_query?: CallbackQuery;
};

async function telegramApi(method: string, body: Record<string, unknown>): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN не задан");
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Telegram ${method} failed: ${response.status} ${text}`);
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "webhook secret not configured" }, { status: 500 });
  }

  const header = request.headers.get("x-telegram-bot-api-secret-token");
  if (header !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const cq = update.callback_query;
  if (!cq) {
    return NextResponse.json({ ok: true });
  }

  const parsed = cq.data ? parseCallbackData(cq.data) : null;
  if (!parsed || !cq.message?.text) {
    await telegramApi("answerCallbackQuery", {
      callback_query_id: cq.id,
      text: "Не удалось обработать статус",
      show_alert: false,
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  }

  const actor = formatStatusActor(cq.from);
  const newText = appendStatusHistory(cq.message.text, parsed.code, actor);
  const label = STATUS_META[parsed.code].label;

  try {
    await telegramApi("answerCallbackQuery", {
      callback_query_id: cq.id,
      text: label,
      show_alert: false,
    });
    await telegramApi("editMessageText", {
      chat_id: cq.message.chat.id,
      message_id: cq.message.message_id,
      text: newText,
      reply_markup: buildStatusKeyboard(parsed.orderId),
    });
  } catch (err) {
    console.error("[telegram/webhook]", err);
    await telegramApi("answerCallbackQuery", {
      callback_query_id: cq.id,
      text: "Ошибка обновления статуса",
      show_alert: true,
    }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
