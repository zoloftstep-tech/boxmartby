import type { CalcItemResult, CalcResponse, CalcSummary, BoxCategory, MaterialId } from "@/lib/types";

const FORBIDDEN_COMMERCIAL_KEYS = [
  "costPerSqM",
  "cardPrice",
  "coef",
  "matCost",
  "tiers",
  "areaSurcharge",
  "overhead",
] as const;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Deep scan: true if any forbidden commercial key appears. */
export function jsonContainsForbiddenCommercialKeys(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = jsonContainsForbiddenCommercialKeys(item);
      if (hit) return hit;
    }
    return null;
  }
  if (!isPlainObject(value)) return null;
  for (const key of Object.keys(value)) {
    if ((FORBIDDEN_COMMERCIAL_KEYS as readonly string[]).includes(key)) return key;
    const hit = jsonContainsForbiddenCommercialKeys(value[key]);
    if (hit) return hit;
  }
  return null;
}

function pickPublicItem(raw: Record<string, unknown>): CalcItemResult {
  const category = (raw.category as BoxCategory) ?? "fourFlap";
  const material = String(raw.material ?? "t22") as MaterialId;
  const item: CalcItemResult = {
    length: Number(raw.length),
    width: Number(raw.width),
    height: Number(raw.height),
    quantity: Number(raw.quantity),
    category,
    material,
    category_label: String(raw.category_label ?? ""),
    material_label: String(raw.material_label ?? ""),
    volume_liters: Number(raw.volume_liters),
    area_m2: Number(raw.area_m2),
    price_per_unit_no_vat: Number(raw.price_per_unit_no_vat),
    total_price_no_vat: Number(raw.total_price_no_vat),
  };
  if (raw.formulaTypeId != null) item.formulaTypeId = String(raw.formulaTypeId);
  if (raw.die_id != null) item.die_id = String(raw.die_id);
  if (raw.die_label != null) item.die_label = String(raw.die_label);
  const hintRaw = raw.next_tier_hint;
  if (hintRaw === null) {
    item.next_tier_hint = null;
  } else if (isPlainObject(hintRaw)) {
    const addQty = Number(hintRaw.add_qty);
    const nextQty = Number(hintRaw.next_qty);
    const unit = Number(hintRaw.unit_price_no_vat);
    if (Number.isFinite(addQty) && addQty > 0 && Number.isFinite(nextQty) && Number.isFinite(unit)) {
      item.next_tier_hint = {
        add_qty: addQty,
        next_qty: nextQty,
        unit_price_no_vat: unit,
      };
    }
  }
  return item;
}

function pickPublicSummary(raw: Record<string, unknown>): CalcSummary {
  return {
    total_no_vat: Number(raw.total_no_vat),
    vat_rate: Number(raw.vat_rate),
    total_with_vat: Number(raw.total_with_vat),
  };
}

/**
 * Strip commercial internals from calculate payloads (remote or local)
 * before sending to the browser.
 */
export function toPublicCalcResponse(raw: unknown): CalcResponse | null {
  if (!isPlainObject(raw)) return null;
  const itemsRaw = raw.items;
  const summaryRaw = raw.summary;
  if (!Array.isArray(itemsRaw) || !isPlainObject(summaryRaw)) return null;
  const items = itemsRaw
    .filter(isPlainObject)
    .map((row) => pickPublicItem(row));
  if (!items.length) return null;
  return {
    items,
    summary: pickPublicSummary(summaryRaw),
  };
}

export type PublicLiveCatalog = {
  ourDies: Array<{
    id: string;
    name: string;
    formulaTypeId: string;
    A: number;
    B: number;
    H: number;
  }>;
  materials: Array<{ id: string; label: string; isReference?: boolean }>;
  blankTypes: Array<{ id: string; name: string; category: string }>;
};

export function toPublicLiveCatalog(raw: {
  ourDies: PublicLiveCatalog["ourDies"];
  materials: PublicLiveCatalog["materials"];
  blankTypes: PublicLiveCatalog["blankTypes"];
}): PublicLiveCatalog {
  return {
    ourDies: raw.ourDies.map((d) => ({
      id: d.id,
      name: d.name,
      formulaTypeId: d.formulaTypeId,
      A: d.A,
      B: d.B,
      H: d.H,
    })),
    materials: raw.materials.map((m) => ({
      id: m.id,
      label: m.label,
      ...(m.isReference ? { isReference: true } : {}),
    })),
    blankTypes: raw.blankTypes.map((b) => ({
      id: b.id,
      name: b.name,
      category: b.category,
    })),
  };
}

export { FORBIDDEN_COMMERCIAL_KEYS };
