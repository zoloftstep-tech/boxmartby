import type { BoxCategory, CalcItemResult } from "@/lib/types";

export const OUR_DIES_ORDER_CATEGORY_LABEL = "Наша штанцформа";

export function formatFefcoDisplay(formulaTypeId?: string | null): string | null {
  if (!formulaTypeId) return null;
  return formulaTypeId.replace(/^fefco_/, "");
}

export function isOurDiesCategory(category?: BoxCategory | string | null): boolean {
  return category === "ourDies";
}

export function orderCategoryLabel(item: Pick<CalcItemResult, "category" | "category_label">): string {
  if (isOurDiesCategory(item.category)) return OUR_DIES_ORDER_CATEGORY_LABEL;
  return item.category_label;
}

export function formatSiteOrderItemSpecLines(
  item: Pick<
    CalcItemResult,
    "category" | "category_label" | "material_label" | "formulaTypeId" | "die_label"
  >,
): string[] {
  const lines: string[] = [`Категория коробки: ${orderCategoryLabel(item)}`];
  if (isOurDiesCategory(item.category)) {
    if (item.die_label) lines.push(`Штанцформа: ${item.die_label}`);
  } else {
    const fefco = formatFefcoDisplay(item.formulaTypeId);
    if (fefco) lines.push(`Тип развёртки FEFCO: ${fefco}`);
  }
  lines.push(`Материал картона: ${item.material_label}`);
  return lines;
}

export function formatSiteOrderItemBlock(
  item: CalcItemResult,
  index: number,
  options?: { includePrice?: boolean; specialRetailNote?: string | null },
): string {
  const dimLine = `${item.length}×${item.width}×${item.height} мм · ${item.quantity} шт`;
  const lines = [
    `Позиция ${index + 1}:`,
    dimLine,
    ...formatSiteOrderItemSpecLines(item),
  ];
  if (options?.includePrice !== false) {
    lines.push(
      `Цена: ${item.price_per_unit_no_vat.toFixed(2)} BYN/шт, итого ${item.total_price_no_vat.toFixed(2)} BYN`,
    );
  }
  if (options?.specialRetailNote) {
    lines.push(options.specialRetailNote);
  }
  return lines.join("\n");
}
