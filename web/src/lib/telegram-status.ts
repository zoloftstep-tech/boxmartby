/** Shared Telegram order-status buttons and message helpers */

export type StatusCode = "accept" | "prod" | "ready" | "done" | "cancel";

export const STATUS_META: Record<StatusCode, { label: string; button: string }> = {
  accept: { label: "Принят в работу", button: "🟡 Принять в работу" },
  prod: { label: "На производстве", button: "🏭 На производстве" },
  ready: { label: "Готов к отгрузке", button: "✅ Готов к отгрузке" },
  done: { label: "Завершён", button: "📦 Завершён" },
  cancel: { label: "Отменён", button: "❌ Отменить" },
};

const STATUS_CODES = new Set<string>(Object.keys(STATUS_META));

/** callback_data: st:{orderId}:{code} — must stay ≤ 64 bytes */
export function buildCallbackData(orderId: string, code: StatusCode): string {
  return `st:${orderId}:${code}`;
}

export function parseCallbackData(
  data: string,
): { orderId: string; code: StatusCode } | null {
  const parts = data.split(":");
  if (parts.length < 3 || parts[0] !== "st") return null;
  const code = parts[parts.length - 1];
  const orderId = parts.slice(1, -1).join(":");
  if (!orderId || !STATUS_CODES.has(code)) return null;
  return { orderId, code: code as StatusCode };
}

export function buildStatusKeyboard(orderId: string) {
  return {
    inline_keyboard: [
      [
        { text: STATUS_META.accept.button, callback_data: buildCallbackData(orderId, "accept") },
        { text: STATUS_META.prod.button, callback_data: buildCallbackData(orderId, "prod") },
      ],
      [
        { text: STATUS_META.ready.button, callback_data: buildCallbackData(orderId, "ready") },
        { text: STATUS_META.done.button, callback_data: buildCallbackData(orderId, "done") },
      ],
      [{ text: STATUS_META.cancel.button, callback_data: buildCallbackData(orderId, "cancel") }],
    ],
  };
}

const HISTORY_HEADER = "\n\n——— Статусы ———";

export function formatStatusActor(from: {
  username?: string;
  first_name?: string;
  last_name?: string;
}): string {
  if (from.username) return `@${from.username}`;
  // Per TZ: name should come from `from.username` / `from.first_name`.
  // If username is missing, we prefer first_name (last_name as a fallback).
  if (from.first_name) return from.first_name;
  if (from.last_name) return from.last_name;
  return "админ";
}

export function formatMinskNow(date = new Date()): string {
  return new Intl.DateTimeFormat("ru-BY", {
    timeZone: "Europe/Minsk",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

export function appendStatusHistory(
  messageText: string,
  code: StatusCode,
  actor: string,
  at: string = formatMinskNow(),
): string {
  // TZ format: "статус · кто · когда"
  const line = `${STATUS_META[code].button} · ${actor} · ${at}`;
  if (messageText.includes(HISTORY_HEADER)) {
    return `${messageText}\n${line}`;
  }
  return `${messageText}${HISTORY_HEADER}\n${line}`;
}
