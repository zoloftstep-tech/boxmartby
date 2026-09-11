/**
 * Regression: public live-catalog / calculate DTOs must not leak commercial keys.
 */
import assert from "node:assert/strict";
import {
  jsonContainsForbiddenCommercialKeys,
  toPublicCalcResponse,
  toPublicLiveCatalog,
} from "../src/lib/pricing/public-dto";
import { FALLBACK_MATERIALS } from "../src/lib/pricing/public";
import { materialsListFromPricing, localPricingConfig } from "../src/lib/pricing/remote-defaults";

function fail(msg: string): never {
  console.error("FAIL:", msg);
  process.exit(1);
}

// --- FALLBACK_MATERIALS: no costPerSqM ---
for (const m of FALLBACK_MATERIALS) {
  assert.ok(m.id && m.label, "fallback material needs id+label");
  assert.equal(
    "costPerSqM" in m,
    false,
    `FALLBACK_MATERIALS[${m.id}] must not have costPerSqM`,
  );
}

// --- live-catalog shape from local pricing ---
const { materials, ...rest } = (() => {
  const pricing = localPricingConfig();
  return toPublicLiveCatalog({
    ourDies: pricing.ourDies,
    materials: materialsListFromPricing(pricing),
    blankTypes: pricing.blankTypes,
  });
})();

const catalogJson = { materials, ...rest };
const leak = jsonContainsForbiddenCommercialKeys(catalogJson);
if (leak) fail(`live-catalog public JSON contains forbidden key: ${leak}`);

// Poisoned payload must be detected
const poisoned = {
  materials: [{ id: "t22", label: "Т-22", costPerSqM: 0.99 }],
};
assert.equal(jsonContainsForbiddenCommercialKeys(poisoned), "costPerSqM");

// --- calculate public DTO strips commercial extras ---
const dirty = {
  items: [
    {
      length: 400,
      width: 300,
      height: 250,
      quantity: 100,
      category: "fourFlap",
      material: "t22",
      category_label: "Четырёхклапанная",
      material_label: "Т-22",
      volume_liters: 30,
      area_m2: 1.2,
      price_per_unit_no_vat: 2.5,
      total_price_no_vat: 250,
      costPerSqM: 0.82,
      coef: 2.4,
      matCost: 1,
      next_tier_hint: { add_qty: 1, next_qty: 100, unit_price_no_vat: 2.4, coef: 2.3 },
    },
  ],
  summary: {
    total_no_vat: 250,
    vat_rate: 0.2,
    total_with_vat: 300,
    tiers: [{ coef: 2.4 }],
  },
};

const cleaned = toPublicCalcResponse(dirty);
assert.ok(cleaned, "toPublicCalcResponse should accept dirty payload");
assert.equal(jsonContainsForbiddenCommercialKeys(cleaned), null);
assert.equal("costPerSqM" in cleaned!.items[0], false);
assert.equal("coef" in cleaned!.items[0], false);
assert.equal("matCost" in cleaned!.items[0], false);
assert.equal("tiers" in cleaned!.summary, false);
assert.ok(cleaned!.items[0].next_tier_hint);
assert.equal(cleaned!.items[0].next_tier_hint!.add_qty, 1);
assert.equal(cleaned!.items[0].next_tier_hint!.next_qty, 100);
assert.equal(cleaned!.items[0].next_tier_hint!.unit_price_no_vat, 2.4);
assert.equal("coef" in (cleaned!.items[0].next_tier_hint as object), false);

import { tierForQty } from "../src/lib/pricing/calculate";
import type { QtyTier } from "../src/lib/pricing/pricing-config";

// --- tierForQty: length not hardcoded to 5 (7-step ladder) ---
const seven: QtyTier[] = [
  { id: "t50", min: 50, max: 99, coef: 2.5 },
  { id: "t100", min: 100, max: 199, coef: 2.4 },
  { id: "t200", min: 200, max: 299, coef: 2.3 },
  { id: "t300", min: 300, max: 499, coef: 2.2 },
  { id: "t500", min: 500, max: 999, coef: 2.1 },
  { id: "t1000", min: 1000, max: 1999, coef: 2.05 },
  { id: "t2000", min: 2000, max: Infinity, coef: 2.0 },
];
assert.equal(tierForQty(seven, 20).id, "t50");
assert.equal(tierForQty(seven, 250).id, "t200");
assert.equal(tierForQty(seven, 2500).id, "t2000");

console.log("ok: public-catalog-leak regression passed");
