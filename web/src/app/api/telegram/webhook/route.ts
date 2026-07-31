import { NextRequest, NextResponse } from "next/server";
import { handleStatusCallbackUpdate } from "@/lib/telegram-status-callback";

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
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN not configured" }, { status: 500 });
  }

  await handleStatusCallbackUpdate(botToken, update);

  return NextResponse.json({ ok: true });
}
