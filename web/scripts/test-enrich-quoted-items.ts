/**
 * enrichQuotedItems — always fill category_label / material_label for CRM ingest.
 */
import assert from "node:assert/strict";
import { enrichQuotedItems } from "../src/lib/enrich-quoted-items";
import type { LivePricingConfig } from "../src/lib/pricing/remote-defaults";
import type { CalcItemInput, CalcItemResult } from "../src/lib/types";

function mockPricing(partial?: Partial<LivePricingConfig>): LivePricingConfig {
  return {
    vat: 20,
    minL: 240,
    minW: 80,
    minWH: 280,
    areaSurcharge: [],
    tiersOpt: { fourFlap: [], selfLock: [] },
    materials: {
      t22: { label: "Т-22", costPerSqM: 0.82 },
    },
    referenceMaterial: "t22",
    ourDies: [
      {
        id: "die-1",
        name: "Коробка тест",
        formulaTypeId: "fefco_0409",
        A: 300,
        B: 200,
        H: 150,
      },
    ],
    blankTypes: [],
    ...partial,
  };
}

const blankQuoted: CalcItemResult = {
  length: 400,
  width: 300,
  height: 250,
  quantity: 100,
  category: "fourFlap",
  material: "t22",
  category_label: "",
  material_label: "",
  volume_liters: 30,
  area_m2: 1.2,
  price_per_unit_no_vat: 2.5,
  total_price_no_vat: 250,
};

const fourFlapInput: CalcItemInput = {
  length: 400,
  width: 300,
  height: 250,
  quantity: 100,
  category: "fourFlap",
  material: "t22",
};

{
  const [out] = enrichQuotedItems([blankQuoted], [fourFlapInput], mockPricing());
  assert.equal(out.category_label, "Четырёхклапанная");
  assert.equal(out.material_label, "Т-22");
}

{
  const quoted: CalcItemResult = {
    ...blankQuoted,
    category: "ourDies",
    category_label: "   ",
    material_label: "",
  };
  const input: CalcItemInput = {
    ...fourFlapInput,
    category: "ourDies",
    dieId: "die-1",
  };
  const [out] = enrichQuotedItems([quoted], [input], mockPricing());
  assert.equal(out.category_label, "Наши штанцформы");
  assert.equal(out.material_label, "Т-22");
  assert.equal(out.die_id, "die-1");
  assert.equal(out.die_label, "Коробка тест");
}

{
  // Keep existing non-empty labels
  const quoted: CalcItemResult = {
    ...blankQuoted,
    category_label: "Кастомная категория",
    material_label: "Кастомный материал",
  };
  const [out] = enrichQuotedItems([quoted], [fourFlapInput], mockPricing());
  assert.equal(out.category_label, "Кастомная категория");
  assert.equal(out.material_label, "Кастомный материал");
}

{
  // Unknown material — do not throw; leave empty if no catalog label
  const pricing = mockPricing({ materials: {} });
  const [out] = enrichQuotedItems([blankQuoted], [fourFlapInput], pricing);
  assert.equal(out.category_label, "Четырёхклапанная");
  assert.equal(out.material_label, "");
}

console.log("enrich-quoted-items: ok");
