import { formatMinskNow } from "@/lib/telegram-status";
import type { ParsedOrderData } from "@/lib/orderLinking";
import type { ParsedOrderChange } from "@/lib/perplexity";

const SOURCE_LABEL = "📋 Из группы «Оптопак»";
const STATUS_HISTORY_HEADER = "\n\n——— Статусы ———";
const EDIT_HISTORY_HEADER = "\n\n——— Уточнения ———";

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatDimensions(data: ParsedOrderData): string {
  return `${data.length}×${data.width}×${data.height} мм`;
}

function computeVolumeLiters(data: ParsedOrderData): number {
  // mm^3 -> liters: 1 liter = 1e6 mm^3
  return (data.length * data.width * data.height) / 1_000_000;
}

export function buildParserCardText(params: {
  orderData: ParsedOrderData;
  managerFirstName: string;
  createdAt?: string;
}): string {
  const at = params.createdAt ?? formatMinskNow();
  const sum = params.orderData.quantity * params.orderData.price_per_unit;
  const volumeLiters = computeVolumeLiters(params.orderData);

  return [
    SOURCE_LABEL,
    `Имя: ${params.managerFirstName || "—"}`,
    `Габариты: ${formatDimensions(params.orderData)}`,
    `Тираж: ${params.orderData.quantity} шт`,
    `Цена за штуку: ${formatMoney(params.orderData.price_per_unit)} BYN/шт`,
    `Сумма: ${formatMoney(sum)} BYN`,
    `Объём: ${volumeLiters.toFixed(2)} л`,
    `Дата/время: ${at}`,
  ].join("\n");
}

function extractLineValue(text: string, label: string): string | null {
  const re = new RegExp(`${label}\\\\s*:?\\\\s*(.+)`);
  const match = text.match(re);
  return match?.[1]?.trim() ?? null;
}

function splitByStatusHistory(text: string): { base: string; statusPart: string } {
  const idx = text.indexOf(STATUS_HISTORY_HEADER);
  if (idx === -1) return { base: text, statusPart: "" };
  return {
    base: text.slice(0, idx),
    statusPart: text.slice(idx),
  };
}

function splitByEditHistory(text: string): { prefix: string; editPart: string } {
  const idx = text.indexOf(EDIT_HISTORY_HEADER);
  if (idx === -1) return { prefix: text, editPart: "" };
  return {
    prefix: text.slice(0, idx),
    editPart: text.slice(idx),
  };
}

function buildEditLines(params: {
  change: ParsedOrderChange;
  clarifierFirstName: string;
  at: string;
}): string[] {
  if (!("has_change" in params.change) || params.change.has_change === false) return [];
  const clarifier = params.clarifierFirstName || "—";
  const at = params.at;

  const mk = (field: string, value: number): string => {
    const map: Record<string, string> = {
      length: "Длина",
      width: "Ширина",
      height: "Высота",
      quantity: "Тираж",
      price_per_unit: "Цена за штуку",
    };
    const human = map[field] ?? field;
    const unit =
      field === "quantity" ? " шт" : field === "price_per_unit" ? " BYN" : " мм";
    const pretty =
      field === "quantity" || field === "length" || field === "width" || field === "height"
        ? String(Math.round(value))
        : formatMoney(value);
    return `✏️ ${human} изменён на ${pretty}${unit} — уточнил ${clarifier}, ${at}`;
  };

  const lines: string[] = [];
  if (params.change.changes?.length) {
    for (const c of params.change.changes) {
      lines.push(mk(c.field, c.value));
    }
  } else if (params.change.field_changed && typeof params.change.new_value === "number") {
    lines.push(mk(params.change.field_changed, params.change.new_value));
  }

  return lines;
}

export function applyReplyChangeToCardText(params: {
  oldCardText: string;
  nextOrderData: ParsedOrderData;
  replyChange: ParsedOrderChange;
  clarifierFirstName: string;
  at?: string;
}): string {
  const at = params.at ?? formatMinskNow();
  const { base, statusPart } = splitByStatusHistory(params.oldCardText);

  // Preserve manager + created time from the existing card.
  const manager = extractLineValue(base, "Имя") ?? params.clarifierFirstName ?? "—";
  const createdAt = extractLineValue(base, "Дата/время") ?? at;

  const existing = splitByEditHistory(base);
  const prefixWithoutEdit = existing.prefix;
  const editPart = existing.editPart;

  // Rebuild the main card prefix (without edit history and without status history).
  const newBasePrefix = buildParserCardText({
    orderData: params.nextOrderData,
    managerFirstName: manager,
    createdAt,
  });

  const newEditLines = buildEditLines({
    change: params.replyChange,
    clarifierFirstName: params.clarifierFirstName,
    at,
  });

  let updatedEditPart = "";
  if (editPart) {
    updatedEditPart = `${editPart}\n${newEditLines.join("\n")}`;
  } else if (newEditLines.length) {
    updatedEditPart = `${EDIT_HISTORY_HEADER}\n${newEditLines.join("\n")}`;
  }

  // Keep whatever prefix existed before edit history, but ensure it matches our canonical builder.
  // (We already rebuild newBasePrefix fully, so prefixWithoutEdit is not used.)
  return `${newBasePrefix}${updatedEditPart}${statusPart}`;
}

/**
 * Дешевая эвристика до Perplexity:
 * - сообщение должно содержать хотя бы 1-2 числа
 * - и быть похожим на размеры/количество/цену
 */
export function looksLikeOrderMessage(text: string): boolean {
  const t = text.toLowerCase();
  if (!/\d/.test(t)) return false;

  const hasDims =
    /(\d+\s*[xх*×]\s*){2}\d+/.test(t) ||
    /\d+\s+на\s+\d+\s+на\s+\d+/.test(t) ||
    /(мм|д×ш×в|длина|ширина|высота)/.test(t);
  const hasQtyOrPrice = /(шт|штук|тираж)/.test(t) || /(руб|byn|за штуку|цена)/.test(t);
  // Fallback: several numbers in one message (e.g. "600 400 400 500 2.5")
  const numberCount = (t.match(/\d+(?:[.,]\d+)?/g) ?? []).length;
  return hasDims || hasQtyOrPrice || numberCount >= 4;
}

