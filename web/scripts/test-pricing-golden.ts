/**
 * Golden pricing cases — formula v2, mode=opt, discount=0.
 * Must stay in lockstep with boxcalculator-main web/scripts/test-pricing-golden.ts
 */
import assert from "node:assert/strict";
import { calculateItems } from "../src/lib/pricing/calculate";
import { localPricingConfig, type LivePricingConfig } from "../src/lib/pricing/remote-defaults";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type Golden = {
  name: string;
  item: Parameters<typeof calculateItems>[0][0];
  area_m2: number;
  price_per_unit_rounded2: number;
  pricingPatch?: (p: LivePricingConfig) => void;
};

const CASES: Golden[] = [
  {
    name: "fourFlap 550×140×140×100 t23 + areaSurcharge → 0.91",
    item: {
      length: 550,
      width: 140,
      height: 140,
      quantity: 100,
      category: "fourFlap",
      material: "t23",
    },
    area_m2: 0.416448,
    price_per_unit_rounded2: 0.91,
    pricingPatch: (p) => {
      if (p.areaSurcharge[0]) p.areaSurcharge[0].active = true;
    },
  },
  {
    name: "fourFlap 550×140×140×100 p32@2.6 + surcharge → 2.72",
    item: {
      length: 550,
      width: 140,
      height: 140,
      quantity: 100,
      category: "fourFlap",
      material: "p32",
    },
    area_m2: 0.416448,
    price_per_unit_rounded2: 2.72,
    pricingPatch: (p) => {
      if (p.areaSurcharge[0]) p.areaSurcharge[0].active = true;
      p.materials.p32 = { label: "П-32", costPerSqM: 2.6 };
    },
  },
  {
    name: "fourFlap 600×400×400×100 t23 → 3.46",
    item: {
      length: 600,
      width: 400,
      height: 400,
      quantity: 100,
      category: "fourFlap",
      material: "t23",
    },
    area_m2: 1.669328,
    price_per_unit_rounded2: 3.46,
  },
  {
    name: "selfLock 300×200×150×500 t24 → 1.53",
    item: {
      length: 300,
      width: 200,
      height: 150,
      quantity: 500,
      category: "selfLock",
      material: "t24",
    },
    area_m2: 0.522372,
    price_per_unit_rounded2: 1.53,
  },
];

for (const c of CASES) {
  const pricing = localPricingConfig();
  if (c.pricingPatch) c.pricingPatch(pricing);
  const res = calculateItems([c.item], pricing);
  const row = res.items[0];
  assert.ok(Math.abs(row.area_m2 - c.area_m2) < 1e-9, `${c.name}: area=${row.area_m2}`);
  assert.equal(
    round2(row.price_per_unit_no_vat),
    c.price_per_unit_rounded2,
    `${c.name}: unit=${row.price_per_unit_no_vat}`,
  );
  console.log("OK", c.name);
}

console.log("pricing golden cases OK", CASES.length);
