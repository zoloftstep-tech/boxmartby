/**
 * Client-safe pricing/catalog constants — no costPerSqM, coef, or tiers.
 * Server pricing-config.ts holds commercial fallback numbers.
 */

export type PricingTierCategory = "fourFlap" | "selfLock";
export type BoxCategory = PricingTierCategory | "ourDies";
/** Cardboard grade id from BoxCalc cardTypes (e.g. t22, e). */
export type MaterialId = string;

export const REFERENCE_MATERIAL: MaterialId = "t23";

/**
 * Минимальные габариты (мм), как в boxcalculator:
 * A ≥ minL, B ≥ minW, B+H ≥ minWH
 */
export const MIN_DIMS = {
  minL: 240,
  minW: 80,
  minWH: 280,
};

export const CATEGORY_LABELS: Record<BoxCategory, string> = {
  fourFlap: "Четырёхклапанная",
  selfLock: "Самосборная",
  ourDies: "Наши штанцформы",
};

/** Offline catalog for UI selects — labels only, never costs. */
export const FALLBACK_MATERIALS: Array<{
  id: MaterialId;
  label: string;
  isReference?: boolean;
}> = [
  { id: "t22", label: "Т-22" },
  { id: "t23", label: "Т-23", isReference: true },
  { id: "t24", label: "Т-24" },
];
