/**
 * =============================================================================
 * SERVER MODULE — тарифы и коэффициенты (local fallback)
 * =============================================================================
 * Do not import from "use client" / calculator-draft / @/lib/pricing barrel.
 * Live prod values come from BoxCalc org defaults on the server.
 * Bootstrap numbers mirror BoxCalc seed §3.3 (not a client price book).
 * =============================================================================
 */

import {
  type BoxCategory,
  type MaterialId,
  type PricingTierCategory,
  REFERENCE_MATERIAL,
} from "./public";

export type { BoxCategory, MaterialId, PricingTierCategory };
export { REFERENCE_MATERIAL };

export type MaterialInfo = {
  label: string;
  costPerSqM: number;
  isReference?: boolean;
};

export type OurDie = {
  id: string;
  name: string;
  formulaTypeId: string;
  A: number;
  B: number;
  H: number;
};

export type QtyTier = {
  id: string;
  min: number;
  max: number;
  coef: number;
};

export type AreaSurchargeRule = {
  /** false = правило не применяется */
  active: boolean;
  /** м²; null = без нижней границы */
  from: number | null;
  /** м²; null = без верхней границы */
  to: number | null;
  /** добавляется к базовому коэффициенту тиража (v2) */
  add: number;
};

/* -----------------------------------------------------------------------------
 * 1. MATERIAL_PRICES — стоимость марки картона, BYN за м² (без НДС)
 *    Local server fallback only — not published as Site client price book.
 * --------------------------------------------------------------------------- */
export const MATERIAL_PRICES: Record<string, MaterialInfo> = {
  t22: { label: "Т-22", costPerSqM: 0.87 },
  t23: { label: "Т-23", costPerSqM: 0.87, isReference: true },
  t24: { label: "Т-24", costPerSqM: 0.95 },
};

/* -----------------------------------------------------------------------------
 * 2. QTY_TIERS_OPT — 7 ступеней (TZ-PRICING-TIERS-2026 §3.3), только ОПТ
 *    Length is data-driven; do not hardcode step count in logic.
 * --------------------------------------------------------------------------- */
export const QTY_TIERS_OPT: Record<PricingTierCategory, QtyTier[]> = {
  fourFlap: [
    { id: "t50", min: 50, max: 99, coef: 2.52 },
    { id: "t100", min: 100, max: 199, coef: 2.45 },
    { id: "t200", min: 200, max: 299, coef: 2.38 },
    { id: "t300", min: 300, max: 499, coef: 2.3 },
    { id: "t500", min: 500, max: 999, coef: 2.26 },
    { id: "t1000", min: 1000, max: 1999, coef: 2.2 },
    { id: "t2000", min: 2000, max: Infinity, coef: 2.16 },
  ],
  selfLock: [
    { id: "t50", min: 50, max: 99, coef: 2.8 },
    { id: "t100", min: 100, max: 199, coef: 2.65 },
    { id: "t200", min: 200, max: 299, coef: 2.52 },
    { id: "t300", min: 300, max: 499, coef: 2.42 },
    { id: "t500", min: 500, max: 999, coef: 2.32 },
    { id: "t1000", min: 1000, max: 1999, coef: 2.22 },
    { id: "t2000", min: 2000, max: Infinity, coef: 2.16 },
  ],
};

/* -----------------------------------------------------------------------------
 * 3. AREA_SURCHARGE — server fallback only; do not activate commercial add here.
 *    Live rules come from BoxCalc org Publish.
 * --------------------------------------------------------------------------- */
export const AREA_SURCHARGE: AreaSurchargeRule[] = [
  { active: false, from: 0, to: 0.6, add: 0.12 },
  { active: false, from: null, to: null, add: 0 },
  { active: false, from: null, to: null, add: 0 },
];

/** НДС, % */
export const VAT_PERCENT = 20;
