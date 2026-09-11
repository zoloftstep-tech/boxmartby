import type { CalcItemInput, CalcItemResult, CalcResponse } from "@/lib/types";
import {
  AREA_SURCHARGE,
  type AreaSurchargeRule,
  type BoxCategory,
  type MaterialId,
  type OurDie,
  type PricingTierCategory,
  type QtyTier,
} from "./pricing-config";
import { CATEGORY_LABELS } from "./public";
import { blankAreaForFormula, defaultFormulaForCategory } from "./fefco-formulas";
import { isBuiltinFormulaForCategory, isKnownBlankTypeId } from "./fefco-catalog";
import { localPricingConfig, type LivePricingConfig } from "./remote-defaults";
import { dimWarningsForItem } from "./dim-warnings";
import { roundAreaForPrice, roundPrice } from "./round";

export { dimWarningsForItem, roundAreaForPrice, roundPrice };
export type PricingInput = CalcItemInput;

function blankAreaFourFlap(A: number, B: number, H: number, formulaTypeId?: string): number {
  const id =
    formulaTypeId && isBuiltinFormulaForCategory(formulaTypeId, "fourFlap")
      ? formulaTypeId
      : defaultFormulaForCategory("fourFlap");
  return blankAreaForFormula(id, A, B, H);
}

function blankAreaSelfLock(A: number, B: number, H: number, formulaTypeId?: string): number {
  const id =
    formulaTypeId && isBuiltinFormulaForCategory(formulaTypeId, "selfLock")
      ? formulaTypeId
      : defaultFormulaForCategory("selfLock");
  return blankAreaForFormula(id, A, B, H);
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
  return category === "fourFlap"
    ? blankAreaFourFlap(A, B, H, formulaTypeId)
    : blankAreaSelfLock(A, B, H, formulaTypeId);
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
  if (!tiers.length) {
    throw new Error("tierForQty: empty tiers");
  }
  const match = tiers.find((t) => qty >= t.min && qty <= t.max);
  if (match) return match;
  // qty below first band → first (most expensive); above last open band → last
  if (qty < tiers[0].min) return tiers[0];
  return tiers[tiers.length - 1];
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
  if (!material || typeof material !== "string" || !pricing.materials[material]) {
    return "material: неизвестная марка картона";
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
    if (
      item.formulaTypeId &&
      (category === "fourFlap" || category === "selfLock") &&
      !isKnownBlankTypeId(item.formulaTypeId, category, pricing.blankTypes)
    ) {
      return "formulaTypeId: не соответствует категории";
    }
  }

  // minL / minW / minWH — не блокируют расчёт (как в BoxCalc):
  // fourFlap → предупреждение на клиенте; selfLock / ourDies → пороги не применяются.

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
    return "quantity: целое число 1–100000";
  }

  return null;
}

/**
 * unitNet = round2(areaPrice × cardCost × (baseCoef + areaSurcharge))
 * Matches BoxCalc calculateItem (discount = 0, mode = opt).
 */
export function calculateItem(
  item: PricingInput,
  pricing: LivePricingConfig = localPricingConfig(),
): CalcItemResult {
  const { A, B, H, die } = resolveItemDims(item, pricing);
  const category = item.category as BoxCategory;
  const material = item.material as MaterialId;

  const formulaTypeId = category === "ourDies" ? die?.formulaTypeId : item.formulaTypeId;
  const resolvedFormulaId =
    category === "ourDies"
      ? die?.formulaTypeId || "fefco_0409"
      : formulaTypeId && isKnownBlankTypeId(formulaTypeId, category, pricing.blankTypes)
        ? formulaTypeId
        : defaultFormulaForCategory(category);
  const rawArea = blankArea(category, A, B, H, formulaTypeId);
  const area = rawArea;
  const tiers = pricing.tiersOpt[tierCategoryId(category)];
  const baseCoef = tierForQty(tiers, item.quantity).coef;
  const surcharge = areaSurchargeFor(area, pricing.areaSurcharge);
  const finalCoef = baseCoef + surcharge;

  const cardCost = pricing.materials[material].costPerSqM;
  const areaPrice = roundAreaForPrice(area);
  const unitNet = roundPrice(areaPrice * cardCost * finalCoef);
  const totalNet = roundPrice(unitNet * item.quantity);
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
    formulaTypeId: resolvedFormulaId,
    ...(category === "ourDies" && die
      ? { die_id: die.id, die_label: die.name }
      : {}),
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
