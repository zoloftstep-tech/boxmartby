import type { CalcItemInput, CalcItemResult, CalcResponse } from "@/lib/types";
import {
  AREA_SURCHARGE,
  CATEGORY_LABELS,
  type AreaSurchargeRule,
  type BoxCategory,
  type MaterialId,
  type OurDie,
  type PricingTierCategory,
  type QtyTier,
} from "./pricing-config";
import { blankAreaForFormula } from "./fefco-formulas";
import { localPricingConfig, type LivePricingConfig } from "./remote-defaults";

export type PricingInput = CalcItemInput;

function blankAreaFourFlap(A: number, B: number, H: number): number {
  return blankAreaForFormula("fefco_0201", A, B, H);
}

function blankAreaSelfLock(A: number, B: number, H: number): number {
  return blankAreaForFormula("fefco_0409", A, B, H);
}

/** ourDies берёт коэффициенты самосборных. */
export function tierCategoryId(category: BoxCategory): PricingTierCategory {
  return category === "ourDies" ? "selfLock" : category;
}

export function blankArea(
  category: BoxCategory,
  A: number,
  B: number,
  H: number,
  formulaTypeId?: string,
): number {
  if (category === "ourDies") {
    return blankAreaForFormula(formulaTypeId || "fefco_0409", A, B, H);
  }
  return category === "fourFlap" ? blankAreaFourFlap(A, B, H) : blankAreaSelfLock(A, B, H);
}

export function findDie(dies: OurDie[], dieId: string | undefined): OurDie | undefined {
  if (!dieId) return undefined;
  return dies.find((d) => d.id === dieId);
}

export function resolveItemDims(
  item: PricingInput,
  pricing: LivePricingConfig = localPricingConfig(),
): { A: number; B: number; H: number; die?: OurDie } {
  if (item.category === "ourDies") {
    const die = findDie(pricing.ourDies, item.dieId);
    if (die) return { A: die.A, B: die.B, H: die.H, die };
  }
  return { A: item.length, B: item.width, H: item.height };
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

export function validateItem(item: PricingInput, pricing: LivePricingConfig = localPricingConfig()): string | null {
  const { quantity, category, material } = item;

  if (category !== "fourFlap" && category !== "selfLock" && category !== "ourDies") {
    return "category: ожидается fourFlap, selfLock или ourDies";
  }
  if (material !== "t22" && material !== "t23" && material !== "t24") {
    return "material: ожидается t22, t23 или t24";
  }

  if (category === "ourDies") {
    if (!item.dieId) return "dieId: обязателен для категории ourDies";
    const die = findDie(pricing.ourDies, item.dieId);
    if (!die) return "dieId: штанцформа не найдена";
  } else {
    for (const [name, value] of [
      ["length", item.length],
      ["width", item.width],
      ["height", item.height],
    ] as const) {
      if (!Number.isFinite(value) || !Number.isInteger(value) || value < 1) {
        return `${name}: ожидается целое число мм`;
      }
    }
  }

  // minL / minW / minWH — не блокируют расчёт (как в BoxCalc):
  // fourFlap → предупреждение на клиенте; selfLock / ourDies → пороги не применяются.

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
    return "quantity: целое число 1–100000";
  }

  return null;
}

/** Предупреждения по порогам размеров — только четырёхклапанные, без блокировки. */
export function dimWarningsForItem(
  item: Pick<PricingInput, "length" | "width" | "height" | "category">,
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

/**
 * unitNet = area × (baseCoef + areaSurcharge) + area × (cardCost − refCost)
 * совпадает с calculateResult() в boxcalculator (discount = 0, mode = opt)
 */
export function calculateItem(
  item: PricingInput,
  pricing: LivePricingConfig = localPricingConfig(),
): CalcItemResult {
  const { A, B, H, die } = resolveItemDims(item, pricing);
  const category = item.category as BoxCategory;
  const material = item.material as MaterialId;

  const area = blankArea(category, A, B, H, die?.formulaTypeId);
  const tiers = pricing.tiersOpt[tierCategoryId(category)];
  const baseCoef = tierForQty(tiers, item.quantity).coef;
  const surcharge = areaSurchargeFor(area, pricing.areaSurcharge);
  const finalCoef = baseCoef + surcharge;

  const cardCost = pricing.materials[material].costPerSqM;
  const refCost = pricing.materials[pricing.referenceMaterial].costPerSqM;
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
    material_label: pricing.materials[material].label,
    volume_liters: Math.round(volume * 10) / 10,
    area_m2: area,
    price_per_unit_no_vat: unitNet,
    total_price_no_vat: totalNet,
  };
}

export function calculateItems(
  items: PricingInput[],
  pricing: LivePricingConfig = localPricingConfig(),
): CalcResponse {
  const results = items.map((item) => calculateItem(item, pricing));
  const totalNoVat = results.reduce((sum, r) => sum + (r.total_price_no_vat ?? 0), 0);
  const vatRate = pricing.vat / 100;

  return {
    items: results,
    summary: {
      total_no_vat: totalNoVat,
      vat_rate: vatRate,
      total_with_vat: totalNoVat * (1 + vatRate),
    },
  };
}
