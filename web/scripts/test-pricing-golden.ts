/**
 * Golden pricing cases — TZ-PRICING-TIERS-2026 §5.6 / §8.
 * Lockstep with boxcalculator-main web/scripts/test-pricing-golden.ts
 * Local fallback tiers mirror BoxCalc seed §3.3; surcharge OFF unless noted.
 */
import assert from "node:assert/strict";
import { calculateItems } from "../src/lib/pricing/calculate";
import { localPricingConfig, type LivePricingConfig } from "../src/lib/pricing/remote-defaults";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fixturePricing(patch?: (p: LivePricingConfig) => void): LivePricingConfig {
  const p = localPricingConfig();
  for (const rule of p.areaSurcharge) rule.active = false;
  if (p.materials.t22) p.materials.t22.costPerSqM = 0.87;
  if (patch) patch(p);
  return p;
}

type Golden = {
  name: string;
  item: Parameters<typeof calculateItems>[0][0];
  area_m2: number;
  price_per_unit_rounded2: number;
  pricingPatch?: (p: LivePricingConfig) => void;
  next?: { add_qty: number; next_qty: number; unit_price_no_vat: number } | null;
};

const CASES: Golden[] = [
  {
    name: "fourFlap 400³ qty20 → t50 (2.52) → 2.96",
    item: {
      length: 400,
      width: 400,
      height: 400,
      quantity: 20,
      category: "fourFlap",
      material: "t22",
    },
    area_m2: 1.346128,
    price_per_unit_rounded2: 2.96,
    next: { add_qty: 80, next_qty: 100, unit_price_no_vat: 2.88 },
  },
  {
    name: "fourFlap 400³ qty100 → t100 (2.45) → 2.88",
    item: {
      length: 400,
      width: 400,
      height: 400,
      quantity: 100,
      category: "fourFlap",
      material: "t22",
    },
    area_m2: 1.346128,
    price_per_unit_rounded2: 2.88,
    next: { add_qty: 100, next_qty: 200, unit_price_no_vat: 2.8 },
  },
  {
    name: "fourFlap 400³ qty99 → boundary next 100",
    item: {
      length: 400,
      width: 400,
      height: 400,
      quantity: 99,
      category: "fourFlap",
      material: "t22",
    },
    area_m2: 1.346128,
    price_per_unit_rounded2: 2.96,
    next: { add_qty: 1, next_qty: 100, unit_price_no_vat: 2.88 },
  },
  {
    name: "fourFlap 400³ qty200 → t200 (2.38) → 2.80",
    item: {
      length: 400,
      width: 400,
      height: 400,
      quantity: 200,
      category: "fourFlap",
      material: "t22",
    },
    area_m2: 1.346128,
    price_per_unit_rounded2: 2.8,
    next: { add_qty: 100, next_qty: 300, unit_price_no_vat: 2.7 },
  },
  {
    name: "fourFlap 400³ qty1999 → boundary next 2000",
    item: {
      length: 400,
      width: 400,
      height: 400,
      quantity: 1999,
      category: "fourFlap",
      material: "t22",
    },
    area_m2: 1.346128,
    price_per_unit_rounded2: 2.58,
    next: { add_qty: 1, next_qty: 2000, unit_price_no_vat: 2.54 },
  },
  {
    name: "fourFlap 400³ qty2000 → t2000 (2.16) → 2.54",
    item: {
      length: 400,
      width: 400,
      height: 400,
      quantity: 2000,
      category: "fourFlap",
      material: "t22",
    },
    area_m2: 1.346128,
    price_per_unit_rounded2: 2.54,
    next: null,
  },
  {
    name: "selfLock 0409 400³ qty300 t22 → 5.12",
    item: {
      length: 400,
      width: 400,
      height: 400,
      quantity: 300,
      category: "selfLock",
      material: "t22",
      formulaTypeId: "fefco_0409",
    },
    area_m2: 2.426472,
    price_per_unit_rounded2: 5.12,
    next: { add_qty: 200, next_qty: 500, unit_price_no_vat: 4.9 },
  },
  {
    name: "selfLock 0409 400³ qty50 → 5.92 (t50 2.80)",
    item: {
      length: 400,
      width: 400,
      height: 400,
      quantity: 50,
      category: "selfLock",
      material: "t22",
      formulaTypeId: "fefco_0409",
    },
    area_m2: 2.426472,
    price_per_unit_rounded2: 5.92,
  },
  {
    name: "fourFlap 550×140×140×100 t23 + surcharge 0.12 → 0.94",
    item: {
      length: 550,
      width: 140,
      height: 140,
      quantity: 100,
      category: "fourFlap",
      material: "t23",
    },
    area_m2: 0.416448,
    price_per_unit_rounded2: 0.94,
    pricingPatch: (p) => {
      if (p.areaSurcharge[0]) {
        p.areaSurcharge[0] = { active: true, from: 0, to: 0.6, add: 0.12 };
      }
    },
  },
];

for (const c of CASES) {
  const pricing = fixturePricing(c.pricingPatch);
  const res = calculateItems([c.item], pricing);
  const row = res.items[0];
  assert.ok(Math.abs(row.area_m2 - c.area_m2) < 1e-9, `${c.name}: area=${row.area_m2}`);
  assert.equal(
    round2(row.price_per_unit_no_vat),
    c.price_per_unit_rounded2,
    `${c.name}: unit=${row.price_per_unit_no_vat}`,
  );
  if (c.next !== undefined) {
    if (c.next === null) {
      assert.equal(row.next_tier_hint ?? null, null, `${c.name}: expected no next_tier_hint`);
    } else {
      assert.ok(row.next_tier_hint, `${c.name}: missing next_tier_hint`);
      assert.equal(row.next_tier_hint!.add_qty, c.next.add_qty, `${c.name}: add_qty`);
      assert.equal(row.next_tier_hint!.next_qty, c.next.next_qty, `${c.name}: next_qty`);
      assert.equal(
        round2(row.next_tier_hint!.unit_price_no_vat),
        c.next.unit_price_no_vat,
        `${c.name}: next unit`,
      );
    }
  }
  console.log("OK", c.name);
}

console.log("pricing golden cases OK", CASES.length);
