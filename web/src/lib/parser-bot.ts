import { formatMinskNow } from "@/lib/telegram-status";
import type { ParsedOrderData } from "@/lib/orderLinking";
import type { ParsedOrderChange } from "@/lib/perplexity";

const SOURCE_LABEL = "📋 Из группы «Оптопак»";
const STATUS_HISTORY_HEADER = "\n\n——— Статусы ———";
const EDIT_HISTORY_HEADER = "\n\n——— Уточнения ———";

/** Краткая инструкция для менеджеров (закреп в группе / ответ на /help|/start). */
export const MANAGER_HELP_TEXT = `Как работать с заявками БОКСМАРТ

1) Новая заявка
Одним сообщением в группу укажите все три параметра:
• габариты Д×Ш×В в мм
• тираж
• цена за штуку (BYN)

Как писать надёжнее:
• тираж — с пробелом перед «шт»: 500 шт (не 500шт)
• или явно: тираж 500 / тираж 1000
• цена отдельно: 2.5 или цена 2.5 / 2,5 BYN

Примеры (рабочие):
600x400x400 500 шт 2.5
600×400×400, тираж 1000, цена 3.00
600 на 400 на 400 — 200 шт — 1.8

Габариты: 600x400x400, 600х400х400, 600*400*400, 600 на 400 на 400.

После распознавания бот ответит: «Заявка BM-… отправлена…» (габариты, тираж, цена).
Карточка уйдёт в группу заявок.

Если чего-то не хватает — бот попросит уточнить или проигнорирует сообщение.
Одной фразы вроде «100 штук готовы» для новой заявки недостаточно.

2) Как изменить параметры карточки
Только reply на сообщение бота «Заявка BM-… отправлена…»
(или на следующее «Карточка … обновлена»).

Пишите явно, что меняем:
• тираж 600
• поставь 800 шт
• цена 1.5
• высота 350 / длину 500 / ширину 300
• изменить высоту на 300
• вместо 50 сделай 80

Бот обновит карточку и покажет «было → стало».
Следующие правки — снова reply на последнее подтверждение бота.

3) Статус заказа (карточка заявки не меняется)
Reply на подтверждение бота:
• какой статус
• на каком этапе
• где заказ / готов?

Бот ответит текущим статусом из CRM / карточки заказа.
Если статус ещё не выставлен в CRM: «статус ещё не проставляли».

4) Что писать, чтобы бот НЕ менял карточку
Операционные сообщения (даже с числами) — без слов «изменить / поставь / тираж … / цена …»:
• 100 шт есть / 100шт есть
• можно забрать / самовывоз
• нужно срочно 50 шт
• готовы / на склад
• комментарии без явной правки параметров

Такие reply карточку не обновляют.

5) Кратко
• Новая заявка: Д×Ш×В + тираж + цена в одном сообщении; тираж лучше «500 шт» или «тираж 500».
• Правка: только reply + явная формулировка (тираж / цена / размер / поставь / измени).
• Не правка: есть / готовы / срочно / забрать / самовывоз без команды изменить.

Справка: /help`;

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function formatDimensions(data: ParsedOrderData): string {
  return `${data.length}×${data.width}×${data.height} мм`;
}

function formatDimensionsPair(data: ParsedOrderData): string {
  return `${data.length}×${data.width}×${data.height}`;
}

function computeVolumeLiters(data: ParsedOrderData): number {
  // mm^3 -> liters: 1 liter = 1e6 mm^3
  return (data.length * data.width * data.height) / 1_000_000;
}

/** Строки параметров для подтверждения создания заявки. */
export function formatOrderConfirmSummary(orderData: ParsedOrderData): string {
  return [
    `Габариты: ${formatDimensions(orderData)}`,
    `Тираж: ${orderData.quantity} шт`,
    `Цена за штуку: ${formatMoney(orderData.price_per_unit)} BYN/шт`,
  ].join("\n");
}

/** Diff «было → стало» только по изменившимся полям. */
export function formatOrderChangeDiff(
  before: ParsedOrderData,
  after: ParsedOrderData,
): string {
  const lines: string[] = [];
  const dimsChanged =
    before.length !== after.length ||
    before.width !== after.width ||
    before.height !== after.height;

  if (dimsChanged) {
    lines.push(
      `Габариты: ${formatDimensionsPair(before)} → ${formatDimensionsPair(after)} мм`,
    );
  }
  if (before.quantity !== after.quantity) {
    lines.push(`Тираж: ${before.quantity} → ${after.quantity} шт`);
  }
  if (before.price_per_unit !== after.price_per_unit) {
    lines.push(
      `Цена за штуку: ${formatMoney(before.price_per_unit)} → ${formatMoney(after.price_per_unit)} BYN/шт`,
    );
  }
  return lines.join("\n");
}

export function buildCreateConfirmText(orderId: string, orderData: ParsedOrderData): string {
  return [
    `Заявка ${orderId} отправлена в группу заявок.`,
    formatOrderConfirmSummary(orderData),
    "Чтобы уточнить параметры — сделайте reply на это сообщение.",
  ].join("\n");
}

export function buildUpdateConfirmText(
  orderId: string,
  before: ParsedOrderData,
  after: ParsedOrderData,
): string {
  const diff = formatOrderChangeDiff(before, after);
  return [
    `Карточка ${orderId} обновлена.`,
    ...(diff ? [diff] : []),
    "Чтобы уточнить ещё — reply на это сообщение.",
  ].join("\n");
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
 * Есть ли в тексте явные габариты заказа (Д×Ш×В и т.п.).
 */
export function hasOrderDimensions(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /(\d+\s*[xх*×]\s*){2}\d+/.test(t) ||
    /\d+\s+на\s+\d+\s+на\s+\d+/.test(t) ||
    /(мм|д×ш×в|длина|ширина|высота)/.test(t)
  );
}

/**
 * Дешевая эвристика до Perplexity:
 * в парсинг идут только сообщения с габаритами или с ≥4 числами.
 * Одного «шт/тираж» недостаточно (отсекает «100 штук готовы»).
 */
export function looksLikeOrderMessage(text: string): boolean {
  const t = text.toLowerCase();
  if (!/\d/.test(t)) return false;

  const numberCount = (t.match(/\d+(?:[.,]\d+)?/g) ?? []).length;
  return hasOrderDimensions(text) || numberCount >= 4;
}

/** Reply: вопрос о статусе / этапе заказа. */
export function isStatusQueryReply(text: string): boolean {
  const t = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!t) return false;
  return (
    /статус/.test(t) ||
    /на каком этапе/.test(t) ||
    /какой этап/.test(t) ||
    /где заказ/.test(t) ||
    /готов\s*\?/.test(t) ||
    /готово\s*\?/.test(t) ||
    /когда будет/.test(t)
  );
}

/**
 * Операционный шум без явной правки полей карточки
 * («100шт есть», «можно забрать», «нужно срочно 50шт»).
 */
export function looksLikeOperationalNoise(text: string): boolean {
  const t = text.toLowerCase().replace(/\s+/g, " ").trim();
  if (!t) return false;

  const hasExplicitChange =
    /измен(и|ить|яем|ите)/.test(t) ||
    /поставь|поставить|поставьте/.test(t) ||
    /вместо/.test(t) ||
    /\bцена\b/.test(t) ||
    /тираж\s+.+\s+на\b/.test(t) ||
    /сделай\s+\d/.test(t) ||
    /длину|ширину|высоту/.test(t);

  if (hasExplicitChange) return false;

  return (
    /\bесть\b/.test(t) ||
    /готов(ы|о|а)?\b/.test(t) ||
    /можно забрать|забрать/.test(t) ||
    /срочн/.test(t) ||
    /самовывоз/.test(t) ||
    /на склад/.test(t)
  );
}

