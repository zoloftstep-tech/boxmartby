/**
 * Client-safe FEFCO catalog metadata only (id / name / category).
 * Formula bodies live in fefco-formulas.ts (server-only).
 */

export type FefcoPricingCategory = "fourFlap" | "selfLock";

export type FefcoTypeMeta = {
  id: string;
  fefco: string;
  category: FefcoPricingCategory;
  name: string;
};

/** Public blank type row from live-catalog / defaults (no formulas). */
export type BlankTypeMeta = {
  id: string;
  name: string;
  category: FefcoPricingCategory;
};

export const FEFCO_TYPE_CATALOG: FefcoTypeMeta[] = [
  { id: "fefco_0201", fefco: "0201", category: "fourFlap", name: "FEFCO 0201 — Четырёхклапанная (RSC)" },
  { id: "fefco_0203", fefco: "0203", category: "fourFlap", name: "FEFCO 0203 — С нахлёстом клапанов" },
  { id: "fefco_0215", fefco: "0215", category: "fourFlap", name: "FEFCO 0215 — С замковым дном" },
  { id: "fefco_0216", fefco: "0216", category: "fourFlap", name: "FEFCO 0216 — С замком и ручкой" },
  { id: "fefco_0217", fefco: "0217", category: "fourFlap", name: "FEFCO 0217 — С ручкой для переноски" },
  { id: "fefco_0409", fefco: "0409", category: "selfLock", name: "FEFCO 0409 — Самосборная + Лоток откидная крышка" },
  { id: "fefco_0422", fefco: "0422", category: "selfLock", name: "FEFCO 0422 — Лоток с ушками" },
  { id: "fefco_0426", fefco: "0426", category: "selfLock", name: "FEFCO 0426 — Короб для пиццы" },
  { id: "fefco_0427", fefco: "0427", category: "selfLock", name: "FEFCO 0427 — Самосборная, двойные стенки" },
  { id: "fefco_0443", fefco: "0443", category: "selfLock", name: "FEFCO 0443 — Самосборная, двойные стенки (alt)" },
  { id: "fefco_0469", fefco: "0469", category: "selfLock", name: "FEFCO 0469 — Архивный короб" },
  { id: "fefco_0470", fefco: "0470", category: "selfLock", name: "FEFCO 0470 — Самосборная Коробка откидная крышка" },
];

const DEFAULT_BY_CATEGORY: Record<FefcoPricingCategory, string> = {
  fourFlap: "fefco_0201",
  selfLock: "fefco_0409",
};

export function fefcoTypesForCategory(category: FefcoPricingCategory): FefcoTypeMeta[] {
  return FEFCO_TYPE_CATALOG.filter((t) => t.category === category);
}

export function defaultFormulaForCategory(category: FefcoPricingCategory): string {
  return DEFAULT_BY_CATEGORY[category];
}

export function isBuiltinFormulaForCategory(
  formulaTypeId: string | undefined,
  category: FefcoPricingCategory,
): boolean {
  if (!formulaTypeId) return false;
  return FEFCO_TYPE_CATALOG.some((t) => t.id === formulaTypeId && t.category === category);
}

/** @deprecated use isBuiltinFormulaForCategory — kept for callers that only know builtins */
export function isFormulaForCategory(
  formulaTypeId: string | undefined,
  category: FefcoPricingCategory,
): boolean {
  return isBuiltinFormulaForCategory(formulaTypeId, category);
}

export function blankTypesForCategory(
  blankTypes: BlankTypeMeta[] | undefined,
  category: FefcoPricingCategory,
): BlankTypeMeta[] {
  const list =
    Array.isArray(blankTypes) && blankTypes.length
      ? blankTypes.filter((t) => t.category === category)
      : fefcoTypesForCategory(category).map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
        }));
  return list;
}

export function isKnownBlankTypeId(
  formulaTypeId: string | undefined,
  category: FefcoPricingCategory,
  blankTypes?: BlankTypeMeta[],
): boolean {
  if (!formulaTypeId) return false;
  if (isBuiltinFormulaForCategory(formulaTypeId, category)) return true;
  if (!Array.isArray(blankTypes)) return false;
  return blankTypes.some((t) => t.id === formulaTypeId && t.category === category);
}
