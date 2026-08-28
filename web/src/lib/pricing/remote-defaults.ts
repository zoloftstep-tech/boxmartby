import {
  AREA_SURCHARGE,
  MATERIAL_PRICES,
  MIN_DIMS,
  QTY_TIERS_OPT,
  REFERENCE_MATERIAL,
  VAT_PERCENT,
  type AreaSurchargeRule,
  type MaterialId,
  type MaterialInfo,
  type OurDie,
  type PricingTierCategory,
  type QtyTier,
} from "./pricing-config";
import {
  FEFCO_TYPE_CATALOG,
  type BlankTypeMeta,
  type FefcoPricingCategory,
} from "./fefco-catalog";

export type LivePricingConfig = {
  vat: number;
  minL: number;
  minW: number;
  minWH: number;
  areaSurcharge: AreaSurchargeRule[];
  tiersOpt: Record<PricingTierCategory, QtyTier[]>;
  materials: Record<string, MaterialInfo>;
  referenceMaterial: MaterialId;
  ourDies: OurDie[];
  blankTypes: BlankTypeMeta[];
};

function defaultBlankTypes(): BlankTypeMeta[] {
  return FEFCO_TYPE_CATALOG.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
  }));
}

export function localPricingConfig(): LivePricingConfig {
  return {
    vat: VAT_PERCENT,
    minL: MIN_DIMS.minL,
    minW: MIN_DIMS.minW,
    minWH: MIN_DIMS.minWH,
    areaSurcharge: AREA_SURCHARGE.map((r) => ({ ...r })),
    tiersOpt: {
      fourFlap: QTY_TIERS_OPT.fourFlap.map((t) => ({ ...t })),
      selfLock: QTY_TIERS_OPT.selfLock.map((t) => ({ ...t })),
    },
    materials: { ...MATERIAL_PRICES },
    referenceMaterial: REFERENCE_MATERIAL,
    ourDies: [],
    blankTypes: defaultBlankTypes(),
  };
}

type RemoteDefaults = {
  vat?: number;
  minL?: number;
  minW?: number;
  minWH?: number;
  areaSurcharge?: AreaSurchargeRule[];
  tiers?: {
    opt?: Record<
      string,
      Array<{ id: string; min: number; max: number | null; coef: number; label?: string }>
    >;
  };
  cardTypes?: Array<{
    id?: string;
    label?: string;
    costPerSqM?: number;
    isReference?: boolean;
  }>;
  ourDies?: Array<{
    id?: string;
    name?: string;
    formulaTypeId?: string;
    A?: number;
    B?: number;
    H?: number;
  }>;
  blankTypes?: Array<{
    id?: string;
    name?: string;
    category?: string;
  }>;
};

function normalizeBlankTypes(raw: RemoteDefaults["blankTypes"]): BlankTypeMeta[] {
  if (!Array.isArray(raw) || !raw.length) return defaultBlankTypes();
  const out: BlankTypeMeta[] = [];
  const seen = new Set<string>();
  for (const row of raw) {
    const id = String(row?.id ?? "").trim();
    const name = String(row?.name ?? "").trim();
    const category = (row?.category === "fourFlap" ? "fourFlap" : "selfLock") as FefcoPricingCategory;
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, name, category });
  }
  return out.length ? out : defaultBlankTypes();
}

function normalizeOurDies(raw: RemoteDefaults["ourDies"]): OurDie[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => ({
      id: String(d?.id ?? ""),
      name: String(d?.name || "Штанцформа"),
      formulaTypeId: String(d?.formulaTypeId || "fefco_0409"),
      A: Math.max(1, Math.round(Number(d?.A) || 1)),
      B: Math.max(1, Math.round(Number(d?.B) || 1)),
      H: Math.max(1, Math.round(Number(d?.H) || 1)),
    }))
    .filter((d) => d.id);
}

function normalizeTiers(
  remote: RemoteDefaults["tiers"],
): Record<PricingTierCategory, QtyTier[]> {
  const base = structuredClone(QTY_TIERS_OPT);
  if (!remote?.opt) return base;
  for (const cat of ["fourFlap", "selfLock"] as PricingTierCategory[]) {
    const rows = remote.opt[cat];
    if (!Array.isArray(rows) || !rows.length) continue;
    base[cat] = rows.map((t) => ({
      id: t.id,
      min: t.min,
      max: t.max == null ? Infinity : t.max,
      coef: t.coef,
    }));
  }
  return base;
}

function normalizeMaterials(
  cardTypes: RemoteDefaults["cardTypes"],
): { materials: Record<string, MaterialInfo>; referenceMaterial: MaterialId } {
  if (!Array.isArray(cardTypes) || cardTypes.length === 0) {
    return { materials: { ...MATERIAL_PRICES }, referenceMaterial: REFERENCE_MATERIAL };
  }

  const materials: Record<string, MaterialInfo> = {};
  let referenceMaterial: MaterialId | null = null;
  let firstId: MaterialId | null = null;

  for (const row of cardTypes) {
    const id = String(row?.id ?? "").trim();
    if (!id) continue;
    if (!firstId) firstId = id;
    materials[id] = {
      label: String(row?.label || id),
      costPerSqM: Number(row?.costPerSqM ?? 0),
      isReference: !!row?.isReference,
    };
    if (row?.isReference) referenceMaterial = id;
  }

  if (!Object.keys(materials).length) {
    return { materials: { ...MATERIAL_PRICES }, referenceMaterial: REFERENCE_MATERIAL };
  }

  return {
    materials,
    referenceMaterial: referenceMaterial || firstId || REFERENCE_MATERIAL,
  };
}

/** Ordered catalog entries for UI select. */
export function materialsListFromPricing(
  pricing: LivePricingConfig,
): Array<{ id: string; label: string; isReference?: boolean }> {
  return Object.entries(pricing.materials).map(([id, info]) => ({
    id,
    label: info.label,
    isReference: info.isReference,
  }));
}

export function pricingFromRemote(data: RemoteDefaults): LivePricingConfig {
  const { materials, referenceMaterial } = normalizeMaterials(data.cardTypes);
  return {
    vat: data.vat ?? VAT_PERCENT,
    minL: data.minL ?? MIN_DIMS.minL,
    minW: data.minW ?? MIN_DIMS.minW,
    minWH: data.minWH ?? MIN_DIMS.minWH,
    areaSurcharge: data.areaSurcharge ?? AREA_SURCHARGE,
    tiersOpt: normalizeTiers(data.tiers),
    materials,
    referenceMaterial,
    ourDies: normalizeOurDies(data.ourDies),
    blankTypes: normalizeBlankTypes(data.blankTypes),
  };
}

let cache: { at: number; value: LivePricingConfig; source: "remote" } | null = null;
const TTL_MS = 60_000;

export type PricingSource = "remote" | "local";

export async function getLivePricingConfig(): Promise<{
  pricing: LivePricingConfig;
  source: PricingSource;
}> {
  const url = process.env.CALCULATOR_DEFAULTS_URL;
  const key = process.env.CALCULATOR_DEFAULTS_API_KEY;
  if (!url || !key) {
    console.warn("[pricing] CALCULATOR_DEFAULTS_URL/API_KEY not set, using local pricing-config");
    return { pricing: localPricingConfig(), source: "local" };
  }

  if (cache && Date.now() - cache.at < TTL_MS) {
    return { pricing: cache.value, source: cache.source };
  }

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`defaults HTTP ${res.status}`);
    const data = (await res.json()) as RemoteDefaults;
    const value = pricingFromRemote(data);
    cache = { at: Date.now(), value, source: "remote" };
    return { pricing: value, source: "remote" };
  } catch (e) {
    console.error("[pricing] CALCULATOR_DEFAULTS fetch failed, using local", e);
    return { pricing: localPricingConfig(), source: "local" };
  }
}
