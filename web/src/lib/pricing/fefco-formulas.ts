/**
 * FEFCO blank geometry — mirrors BoxCalc SPA FEFCO_TYPES (calc/index.html).
 * Area = (L/1000) × (W/1000) m². Unknown formulaTypeId → fefco_0409.
 */

type DimFn = (A: number, B: number, H: number) => number;

type FefcoFormula = {
  id: string;
  f1: DimFn;
  f2: DimFn;
};

export type FefcoPricingCategory = "fourFlap" | "selfLock";

export type FefcoTypeMeta = {
  id: string;
  fefco: string;
  category: FefcoPricingCategory;
  name: string;
};

/** Catalog metadata (labels + category) — same ids as SPA FEFCO_TYPES. */
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

export function isFormulaForCategory(
  formulaTypeId: string | undefined,
  category: FefcoPricingCategory,
): boolean {
  if (!formulaTypeId) return false;
  return FEFCO_TYPE_CATALOG.some((t) => t.id === formulaTypeId && t.category === category);
}

const FEFCO_FORMULAS: Record<string, FefcoFormula> = {
  fefco_0201: {
    id: "fefco_0201",
    f1: (A, B) => 66 + 2 * A + 2 * B,
    f2: (_A, B, H) => 2 * (B / 2 + 4) + H,
  },
  fefco_0203: {
    id: "fefco_0203",
    f1: (A, B) => 2 * A + 2 * B + 60,
    f2: (_A, B, H) => 2 * B + H + 6,
  },
  fefco_0215: {
    id: "fefco_0215",
    f1: (A, B) => 2 * A + 2 * B + 60,
    f2: (_A, B, H) => 2 * B + H + 30,
  },
  fefco_0216: {
    id: "fefco_0216",
    f1: (A, B) => 2 * A + 2 * B + 80,
    f2: (_A, B, H) => 2 * B + H + 26,
  },
  fefco_0217: {
    id: "fefco_0217",
    f1: (A, B) => 2 * A + 2 * B + 80,
    f2: (_A, B, H) => 2 * B + H + 26,
  },
  fefco_0409: {
    id: "fefco_0409",
    f1: (A, _B, H) => A + 2 * H + 6,
    f2: (_A, B, H) => 2 * B + 3 * H + 12,
  },
  fefco_0422: {
    id: "fefco_0422",
    f1: (_A, B, H) => B + 2 * H + 66,
    f2: (A, _B, H) => A + 4 * H + 66,
  },
  fefco_0426: {
    id: "fefco_0426",
    f1: (A, _B, H) => A + 2 * H + 30,
    f2: (_A, B, H) => 2 * B + 4 * H + 50,
  },
  fefco_0427: {
    id: "fefco_0427",
    f1: (A, _B, H) => A + 4 * H + 70,
    f2: (_A, B, H) => 2 * B + 3 * H + 40,
  },
  fefco_0443: {
    id: "fefco_0443",
    f1: (_A, B, H) => 2 * B + 2 * H + 67,
    f2: (A, _B, H) => A + 2 * H + 27,
  },
  fefco_0469: {
    id: "fefco_0469",
    f1: (A, _B, H) => A + 4 * H + 120,
    f2: (_A, B, H) => 2 * B + 2 * H + 66,
  },
  fefco_0470: {
    id: "fefco_0470",
    f1: (_A, B, H) => 2 * B + 2 * H + 66 + 30,
    f2: (A, B) => A + 2 * B + 25 + 30,
  },
};

const DEFAULT_FORMULA_ID = "fefco_0409";

export function resolveFefcoFormula(formulaTypeId: string | undefined): FefcoFormula {
  const id = formulaTypeId || DEFAULT_FORMULA_ID;
  return FEFCO_FORMULAS[id] ?? FEFCO_FORMULAS[DEFAULT_FORMULA_ID];
}

/** Blank area in m² for a FEFCO formulaTypeId (same as BoxCalc makeBuiltinType.calc). */
export function blankAreaForFormula(
  formulaTypeId: string | undefined,
  A: number,
  B: number,
  H: number,
): number {
  const formula = resolveFefcoFormula(formulaTypeId);
  const L = formula.f1(A, B, H);
  const W = formula.f2(A, B, H);
  return (L / 1000) * (W / 1000);
}
