import {
  AREA_SURCHARGE,
  MATERIAL_PRICES,
  MIN_DIMS,
  QTY_TIERS_OPT,
  REFERENCE_MATERIAL,
  VAT_PERCENT,
  type AreaSurchargeRule,
  type BoxCategory,
  type MaterialId,
  type QtyTier,
} from "./pricing-config";

export type LivePricingConfig = {
  vat: number;
  minL: number;
  minW: number;
  minWH: number;
  areaSurcharge: AreaSurchargeRule[];
  tiersOpt: Record<BoxCategory, QtyTier[]>;
  materials: Record<
    MaterialId,
    { label: string; costPerSqM: number; isReference?: boolean }
  >;
  referenceMaterial: MaterialId;
};

export function localPricingConfig(): LivePricingConfig {
  return {
    vat: VAT_PERCENT,
    minL: MIN_DIMS.minL,
    minW: MIN_DIMS.minW,
    minWH: MIN_DIMS.minWH,
    areaSurcharge: AREA_SURCHARGE,
    tiersOpt: QTY_TIERS_OPT,
    materials: MATERIAL_PRICES,
    referenceMaterial: REFERENCE_MATERIAL,
  };
}

type RemoteDefaults = {
  vat?: number;
  minL?: number;
  minW?: number;
  minWH?: number;
  areaSurcharge?: AreaSurchargeRule[];
  tiers?: { opt?: Record<string, Array<{ id: string; min: number; max: number | null; coef: number; label?: string }>> };
  cardTypes?: Array<{
    id: string;
    label: string;
    costPerSqM: number;
    isReference?: boolean;
  }>;
};

function normalizeTiers(
  remote: RemoteDefaults["tiers"],
): Record<BoxCategory, QtyTier[]> {
  const base = structuredClone(QTY_TIERS_OPT);
  if (!remote?.opt) return base;
  for (const cat of ["fourFlap", "selfLock"] as BoxCategory[]) {
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

export function pricingFromRemote(data: RemoteDefaults): LivePricingConfig {
  const materials = { ...MATERIAL_PRICES };
  let referenceMaterial: MaterialId = REFERENCE_MATERIAL;
  if (Array.isArray(data.cardTypes)) {
    for (const id of ["t22", "t23", "t24"] as MaterialId[]) {
      const row = data.cardTypes.find((c) => c.id === id);
      if (row) {
        materials[id] = {
          label: row.label || materials[id].label,
          costPerSqM: Number(row.costPerSqM),
          isReference: !!row.isReference,
        };
        if (row.isReference) referenceMaterial = id;
      }
    }
  }
  return {
    vat: data.vat ?? VAT_PERCENT,
    minL: data.minL ?? MIN_DIMS.minL,
    minW: data.minW ?? MIN_DIMS.minW,
    minWH: data.minWH ?? MIN_DIMS.minWH,
    areaSurcharge: data.areaSurcharge ?? AREA_SURCHARGE,
    tiersOpt: normalizeTiers(data.tiers),
    materials,
    referenceMaterial,
  };
}

let cache: { at: number; value: LivePricingConfig } | null = null;
const TTL_MS = 60_000;

export async function getLivePricingConfig(): Promise<LivePricingConfig> {
  const url = process.env.CALCULATOR_DEFAULTS_URL;
  const key = process.env.CALCULATOR_DEFAULTS_API_KEY;
  if (!url || !key) return localPricingConfig();

  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`defaults HTTP ${res.status}`);
    const data = (await res.json()) as RemoteDefaults;
    const value = pricingFromRemote(data);
    cache = { at: Date.now(), value };
    return value;
  } catch (e) {
    console.error("CALCULATOR_DEFAULTS fetch failed, using local", e);
    return localPricingConfig();
  }
}
