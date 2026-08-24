/**
 * Client-safe dim warnings (no FEFCO formulas).
 */
import type { BoxCategory } from "./pricing-config";

export function dimWarningsForItem(
  item: Pick<{ length: number; width: number; height: number; category: BoxCategory }, "length" | "width" | "height" | "category">,
  mins: { minL: number; minW: number; minWH: number } = {
    minL: 240,
    minW: 80,
    minWH: 280,
  },
): string[] {
  if (item.category !== "fourFlap") return [];
  const A = item.length;
  const B = item.width;
  const H = item.height;
  if (![A, B, H].every((n) => Number.isFinite(n) && n > 0)) return [];
  const warn: string[] = [];
  if (A < mins.minL) warn.push(`Длина меньше рекомендуемого минимума ${mins.minL} мм`);
  if (B < mins.minW) warn.push(`Ширина меньше рекомендуемого минимума ${mins.minW} мм`);
  if (B + H < mins.minWH) {
    warn.push(`Сумма ширины и высоты меньше рекомендуемого минимума ${mins.minWH} мм (сейчас ${B + H})`);
  }
  return warn;
}
