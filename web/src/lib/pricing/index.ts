/**
 * Client-safe pricing surface — no FEFCO formula bodies.
 * Server routes must import calculate.ts / fefco-formulas.ts directly.
 */
export {
  AREA_SURCHARGE,
  CATEGORY_LABELS,
  MATERIAL_PRICES,
  MIN_DIMS,
  QTY_TIERS_OPT,
  REFERENCE_MATERIAL,
  VAT_PERCENT,
  type BoxCategory,
  type MaterialId,
  type MaterialInfo,
  type OurDie,
  type PricingTierCategory,
} from "./pricing-config";

export {
  FEFCO_TYPE_CATALOG,
  fefcoTypesForCategory,
  defaultFormulaForCategory,
  isFormulaForCategory,
  isBuiltinFormulaForCategory,
  blankTypesForCategory,
  isKnownBlankTypeId,
  type FefcoTypeMeta,
  type FefcoPricingCategory,
  type BlankTypeMeta,
} from "./fefco-catalog";

export { dimWarningsForItem } from "./dim-warnings";
