import type { CalcItemInput, CalcItemResult, CalcResponse } from "@/lib/types";
import {
  AREA_SURCHARGE,
  CATEGORY_LABELS,
  MATERIAL_PRICES,
  MIN_DIMS,
  QTY_TIERS_OPT,
  REFERENCE_MATERIAL,
  VAT_PERCENT,
  type AreaSurchargeRule,
  type BoxCategory,
  type MaterialId,
  type QtyTier,
} from "./pricing-config";

export type PricingInput = CalcItemInput;

function blankAreaFourFlap(A: number, B: number, H: number): number {
  const L = 66 + 2 * A + 2 * B;
  const W = B + 8 + H;
  return (L / 1000) * (W / 1000);
}

function blankAreaSelfLock(A: number, B: number, H: number): number {
  const L = A + 2 * H + 6;
  const W = 2 * B + 3 * H + 12;
  return (L / 1000) * (W / 1000);
}

export function blankArea(category: BoxCategory, A: number, B: number, H: number): number {
  return category === "fourFlap" ? blankAreaFourFlap(A, B, H) : blankAreaSelfLock(A, B, H);
}

export function tierForQty(tiers: QtyTier[], qty: number): QtyTier {
  const match = tiers.find((t) => qty >= t.min && qty <= t.max);
  if (match) return match;
  return tiers[0];
}

export function areaSurchargeFor(area: number, rules: AreaSurchargeRule[] = AREA_SURCHARGE): number {
  for (const rule of rules) {
    if (!rule.active) continue;
    const fromOk = rule.from == null || area >= rule.from;
    const toOk = rule.to == null || area <= rule.to;
    if (fromOk && toOk) return rule.add;
  }
  return 0;
}

export function validateItem(item: PricingInput): string | null {
  const { length: A, width: B, height: H, quantity, category, material } = item;

  if (category !== "fourFlap" && category !== "selfLock") {
    return "category: ожидается fourFlap или selfLock";
  }
  if (material !== "t22" && material !== "t23" && material !== "t24") {
    return "material: ожидается t22, t23 или t24";
  }

  for (const [name, value] of [
    ["length", A],
    ["width", B],
    ["height", H],
  ] as const) {
    if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
      return `${name}: ожидается целое число мм`;
    }
  }

  if (A < MIN_DIMS.minL) {
    return `Длина (A) не менее ${MIN_DIMS.minL} мм`;
  }
  if (B < MIN_DIMS.minW) {
    return `Ширина (B) не менее ${MIN_DIMS.minW} мм`;
  }
  if (B + H < MIN_DIMS.minWH) {
    return `Сумма ширины и высоты (B+H) не менее ${MIN_DIMS.minWH} мм`;
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
    return "quantity: целое число 1–100000";
  }

  return null;
}

/**
 * unitNet = area × (baseCoef + areaSurcharge) + area × (cardCost − refCost)
 * совпадает с calculateResult() в boxcalculator (discount = 0, mode = opt)
 */
export function calculateItem(item: PricingInput): CalcItemResult {
  const A = item.length;
  const B = item.width;
  const H = item.height;
  const category = item.category as BoxCategory;
  const material = item.material as MaterialId;

  const area = blankArea(category, A, B, H);
  const tiers = QTY_TIERS_OPT[category];
  const baseCoef = tierForQty(tiers, item.quantity).coef;
  const surcharge = areaSurchargeFor(area);
  const finalCoef = baseCoef + surcharge;

  const cardCost = MATERIAL_PRICES[material].costPerSqM;
  const refCost = MATERIAL_PRICES[REFERENCE_MATERIAL].costPerSqM;
  const costDiff = area * (cardCost - refCost);

  const unitNet = area * finalCoef + costDiff;
  const totalNet = unitNet * item.quantity;
  const volume = (A * B * H) / 1_000_000;

  return {
    length: A,
    width: B,
    height: H,
    quantity: item.quantity,
    category,
    material,
    category_label: CATEGORY_LABELS[category],
    material_label: MATERIAL_PRICES[material].label,
    volume_liters: Math.round(volume * 10) / 10,
    area_m2: area,
    price_per_unit_no_vat: unitNet,
    total_price_no_vat: totalNet,
  };
}

export function calculateItems(items: PricingInput[]): CalcResponse {
  const results = items.map(calculateItem);
  const totalNoVat = results.reduce((sum, r) => sum + (r.total_price_no_vat ?? 0), 0);
  const vatRate = VAT_PERCENT / 100;

  return {
    items: results,
    summary: {
      total_no_vat: totalNoVat,
      vat_rate: vatRate,
      total_with_vat: totalNoVat * (1 + vatRate),
    },
  };
}
