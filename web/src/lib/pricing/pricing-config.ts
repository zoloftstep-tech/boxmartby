/**
 * =============================================================================
 * OWNER EDIT — тарифы и коэффициенты калькулятора
 * =============================================================================
 * Источник: boxcalculator (режим ОПТ). Правите здесь цены, градации тиража
 * и надбавку по площади. Формулы геометрии заготовки — в calculate.ts.
 * =============================================================================
 */

export type PricingTierCategory = "fourFlap" | "selfLock";
export type BoxCategory = PricingTierCategory | "ourDies";
/** Cardboard grade id from BoxCalc cardTypes (e.g. t22, e). */
export type MaterialId = string;

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
  /** добавляется к базовому коэффициенту тиража */
  add: number;
};

/* -----------------------------------------------------------------------------
 * 1. MATERIAL_PRICES — стоимость марки картона, BYN за м² (без НДС)
 * --------------------------------------------------------------------------- */
export const MATERIAL_PRICES: Record<string, MaterialInfo> = {
  t22: { label: "Т-22", costPerSqM: 0.82 },
  t23: { label: "Т-23", costPerSqM: 0.87, isReference: true },
  t24: { label: "Т-24", costPerSqM: 0.95 },
};

export const REFERENCE_MATERIAL: MaterialId = "t23";

/* -----------------------------------------------------------------------------
 * 2. QTY_TIERS_OPT — коэффициенты по градации тиража (только ОПТ)
 *    fourFlap = четырёхклапанная (FEFCO 0201)
 *    selfLock = самосборная (FEFCO 0409)
 *    qty < min первой ступени → берётся первая ступень (t50)
 * --------------------------------------------------------------------------- */
export const QTY_TIERS_OPT: Record<PricingTierCategory, QtyTier[]> = {
  fourFlap: [
    { id: "t50", min: 50, max: 99, coef: 2.1 / 0.87 },
    { id: "t100", min: 100, max: 299, coef: 2.07 / 0.87 },
    { id: "t300", min: 300, max: 499, coef: 2.03 / 0.87 },
    { id: "t500", min: 500, max: 999, coef: 2.0 / 0.87 },
    { id: "t1000", min: 1000, max: Infinity, coef: 1.95 / 0.87 },
  ],
  selfLock: [
    { id: "t50", min: 50, max: 99, coef: 3.2 / 0.87 },
    { id: "t100", min: 100, max: 299, coef: 3.0 / 0.87 },
    { id: "t300", min: 300, max: 499, coef: 2.8 / 0.87 },
    { id: "t500", min: 500, max: 999, coef: 2.7 / 0.87 },
    { id: "t1000", min: 1000, max: Infinity, coef: 2.7 / 0.87 },
  ],
};

/* -----------------------------------------------------------------------------
 * 3. AREA_SURCHARGE — надбавка к коэффициенту по площади заготовки (м²)
 *    По умолчанию все правила выключены (как в приложении).
 *    Чтобы включить: active: true и задайте from/to/add.
 *    Чтобы убрать вовсе: оставьте active: false или обнулите add.
 *    Срабатывает первое подходящее активное правило сверху вниз.
 * --------------------------------------------------------------------------- */
export const AREA_SURCHARGE: AreaSurchargeRule[] = [
  { active: false, from: 0, to: 0.6, add: 0.1 / 0.87 },
  { active: false, from: null, to: null, add: 0 },
  { active: false, from: null, to: null, add: 0 },
];

/** НДС, % */
export const VAT_PERCENT = 20;

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
