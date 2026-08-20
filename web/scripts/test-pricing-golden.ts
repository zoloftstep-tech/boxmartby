/**
 * Golden pricing cases — localPricingConfig (static defaults), mode=opt.
 * Must stay in lockstep with boxcalculator web/scripts/test-pricing-golden.ts
 */
import assert from "node:assert/strict";
import { calculateItems } from "../src/lib/pricing/calculate";
import { localPricingConfig } from "../src/lib/pricing/remote-defaults";
import type { CalcItemInput } from "../src/lib/types";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

type Golden = {
  name: string;
  item: CalcItemInput;
  area_m2: number;
  price_per_unit_rounded2: number;
};

const CASES: Golden[] = [
  {
    name: "fourFlap 220×70×100×50 t22 → 0.24",
    item: {
      length: 220,
      width: 70,
      height: 100,
      quantity: 50,
      category: "fourFlap",
      material: "t22",
    },
    area_m2: 0.11498799999999999,
    price_per_unit_rounded2: 0.24,
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
    name: "selfLock 300×200×150×500 t24 → 1.45",
    item: {
      length: 300,
      width: 200,
      height: 150,
      quantity: 500,
      category: "selfLock",
      material: "t24",
    },
    area_m2: 0.522372,
    price_per_unit_rounded2: 1.45,
  },
  {
    name: "selfLock fefco_0470 300×200×150×500 t24 → 1.67",
    item: {
      length: 300,
      width: 200,
      height: 150,
      quantity: 500,
      category: "selfLock",
      material: "t24",
      formulaTypeId: "fefco_0470",
    },
    area_m2: 0.60098,
    price_per_unit_rounded2: 1.67,
  },
];

const pricing = localPricingConfig();

for (const c of CASES) {
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
