import {
  defaultFormulaForCategory,
  dimWarningsForItem,
  blankTypesForCategory,
  MATERIAL_PRICES,
  MIN_DIMS,
  REFERENCE_MATERIAL,
  type BlankTypeMeta,
} from "@/lib/pricing";
import type { BoxCategory, CatalogMaterial, MaterialId, OurDie } from "@/lib/types";

export const DEFAULT_SELF_LOCK_FORMULA = defaultFormulaForCategory("selfLock");
export const FALLBACK_SELF_LOCK_TYPES = blankTypesForCategory(undefined, "selfLock");

export const FALLBACK_MATERIALS: CatalogMaterial[] = Object.entries(MATERIAL_PRICES).map(
  ([id, info]) => ({
    id,
    label: info.label,
    isReference: info.isReference,
  }),
);

/** UI default grade (independent of BoxCalc isReference / REFERENCE_MATERIAL). */
export const DEFAULT_CALCULATOR_MATERIAL: MaterialId = "t22";

export function defaultMaterialId(materials: CatalogMaterial[]): MaterialId {
  if (materials.some((m) => m.id === DEFAULT_CALCULATOR_MATERIAL)) {
    return DEFAULT_CALCULATOR_MATERIAL;
  }
  const ref = materials.find((m) => m.isReference);
  return ref?.id ?? materials[0]?.id ?? REFERENCE_MATERIAL;
}

export type DraftItem = {
  id: string;
  length: string;
  width: string;
  height: string;
  quantity: string;
  category: BoxCategory;
  material: MaterialId;
  dieId: string;
  formulaTypeId: string;
};

export function emptyItem(
  material: MaterialId = defaultMaterialId(FALLBACK_MATERIALS),
): DraftItem {
  return {
    id: crypto.randomUUID(),
    length: "",
    width: "",
    height: "",
    quantity: "100",
    category: "fourFlap",
    material,
    dieId: "",
    formulaTypeId: "",
  };
}

export function applyDieDims(item: DraftItem, die: OurDie | undefined): DraftItem {
  if (!die) return { ...item, dieId: "", length: "", width: "", height: "" };
  return {
    ...item,
    dieId: die.id,
    length: String(die.A),
    width: String(die.B),
    height: String(die.H),
  };
}

export function toPayload(items: DraftItem[]) {
  return items.map((item) => ({
    length: Number(item.length),
    width: Number(item.width),
    height: Number(item.height),
    quantity: Number(item.quantity),
    category: item.category ?? "fourFlap",
    material: item.material || defaultMaterialId(FALLBACK_MATERIALS),
    dieId: item.category === "ourDies" && item.dieId ? item.dieId : undefined,
    formulaTypeId:
      item.category === "selfLock"
        ? item.formulaTypeId || DEFAULT_SELF_LOCK_FORMULA
        : undefined,
  }));
}

export function isComplete(item: DraftItem) {
  if (item.category === "ourDies") {
    if (!item.dieId) return false;
  }
  const vals = [item.length, item.width, item.height, item.quantity].map(Number);
  return vals.every((n) => Number.isFinite(n) && n > 0);
}

/** 600×400×400 в любом порядке полей — инф. предупреждение (п. 4.3), цена не скрывается */
export function isSpecialRetailDims(
  length: string,
  width: string,
  height: string,
): boolean {
  const dims = [Number(length), Number(width), Number(height)].sort((a, b) => a - b);
  return dims[0] === 400 && dims[1] === 400 && dims[2] === 600;
}

export const SPECIAL_RETAIL_NOTICE =
  "Это специальная розничная позиция. Пожалуйста, позвоните или напишите нам, и мы предложим вам наиболее актуальную и выгодную цену. Вы также можете оставить заявку через форму — менеджер уточнит условия.";

export const OUR_DIES_NOTICE =
  "Нет нужного размера? Выберите «Самосборные», укажите параметры и оставьте заявку — менеджер согласует детали.";

/** Shown for selfLock after L×W×H are entered (no stock of that blank). */
export const SELF_LOCK_STOCK_NOTICE =
  "Такой формы сейчас нет в наличии. Оставьте заявку — менеджер свяжется и подберёт удобный вариант.";

/** ±mm per axis (L↔A, W↔B, H↔H) to suggest a similar ourDie. */
export const SELF_LOCK_DIE_MATCH_MM = 10;

export const MIN_POSITION_QUANTITY = 15;
export const MIN_POSITION_QUANTITY_NOTICE = `Минимальный тираж позиции — ${MIN_POSITION_QUANTITY} шт.`;
export const MIN_ORDER_NOTICE = `Оформление заявки доступно от ${MIN_POSITION_QUANTITY} шт. на позицию.`;

/** L×W×H only — quantity not required (unlike isComplete). */
export function hasSelfLockDims(item: DraftItem): boolean {
  const vals = [item.length, item.width, item.height].map(Number);
  return vals.every((n) => Number.isFinite(n) && n > 0);
}

/**
 * Nearest ourDie within SELF_LOCK_DIE_MATCH_MM on each axis (strict L↔A, W↔B, H↔H).
 * Tie-break: first in catalog order.
 */
export function findNearestOurDie(
  length: number,
  width: number,
  height: number,
  dies: OurDie[],
  matchMm: number = SELF_LOCK_DIE_MATCH_MM,
): OurDie | null {
  if (
    !Number.isFinite(length) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    length <= 0 ||
    width <= 0 ||
    height <= 0 ||
    !Array.isArray(dies) ||
    dies.length === 0
  ) {
    return null;
  }
  let best: OurDie | null = null;
  let bestDist = Infinity;
  for (const die of dies) {
    const A = Number(die.A);
    const B = Number(die.B);
    const H = Number(die.H);
    if (!Number.isFinite(A) || !Number.isFinite(B) || !Number.isFinite(H)) continue;
    const dL = Math.abs(length - A);
    const dW = Math.abs(width - B);
    const dH = Math.abs(height - H);
    if (dL > matchMm || dW > matchMm || dH > matchMm) continue;
    const dist = dL + dW + dH;
    if (dist < bestDist) {
      bestDist = dist;
      best = die;
    }
  }
  return best;
}

/** null = do not show; otherwise notice text (React-safe plain string). */
export function selfLockStockNotice(item: DraftItem, dies: OurDie[]): string | null {
  if (item.category !== "selfLock" || !hasSelfLockDims(item)) return null;
  const L = Number(item.length);
  const W = Number(item.width);
  const H = Number(item.height);
  const die = findNearestOurDie(L, W, H, dies);
  if (!die) return SELF_LOCK_STOCK_NOTICE;
  const name = String(die.name || "").trim() || die.id;
  return `Такой формы сейчас нет в наличии. Похожий вариант в «Наши штанцформы»: «${name}» (${die.A}×${die.B}×${die.H} мм).`;
}

export function draftDimWarnings(item: DraftItem): string[] {
  if (item.category !== "fourFlap" || !isComplete(item)) return [];
  return dimWarningsForItem(
    {
      length: Number(item.length),
      width: Number(item.width),
      height: Number(item.height),
      category: item.category,
    },
    MIN_DIMS,
  );
}

export function isQuantityBelowMinimum(item: DraftItem): boolean {
  const quantity = Number(item.quantity);
  return Number.isFinite(quantity) && quantity > 0 && quantity < MIN_POSITION_QUANTITY;
}

export function hasQuantityBelowMinimum(items: DraftItem[]): boolean {
  return items.some(isQuantityBelowMinimum);
}

export type { BlankTypeMeta };
