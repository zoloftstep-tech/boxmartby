/**
 * Client-safe pricing surface — catalog meta + dim helpers only.
 * Commercial costs/tiers live in pricing-config.ts (server-only).
 * Server routes import calculate.ts / remote-defaults.ts / pricing-config.ts directly.
 */
export {
  CATEGORY_LABELS,
  FALLBACK_MATERIALS,
  MIN_DIMS,
  REFERENCE_MATERIAL,
  type BoxCategory,
  type MaterialId,
  type PricingTierCategory,
} from "./public";

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
