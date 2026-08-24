/**
 * Fallback policy: custom blank types must not be priced locally without BoxCalc.
 */
import assert from "node:assert/strict";
import { isBuiltinFormulaId } from "../src/lib/pricing/fefco-formulas";
import { blankTypesForCategory, isKnownBlankTypeId } from "../src/lib/pricing/fefco-catalog";
import { localPricingConfig } from "../src/lib/pricing/remote-defaults";
import { validateItem } from "../src/lib/pricing/calculate";

assert.equal(isBuiltinFormulaId("fefco_0470"), true);
assert.equal(isBuiltinFormulaId("custom_0471"), false);

const pricing = localPricingConfig();
pricing.blankTypes = [
  ...pricing.blankTypes,
  { id: "custom_0471", name: "FEFCO 0471", category: "selfLock" },
];

assert.equal(isKnownBlankTypeId("custom_0471", "selfLock", pricing.blankTypes), true);
assert.equal(
  validateItem(
    {
      length: 300,
      width: 200,
      height: 150,
      quantity: 100,
      category: "selfLock",
      material: "t24",
      formulaTypeId: "custom_0471",
    },
    pricing,
  ),
  null,
);

const selfLock = blankTypesForCategory(pricing.blankTypes, "selfLock");
assert.ok(selfLock.some((t) => t.id === "custom_0471"));
assert.ok(selfLock.every((t) => !("lenExpr" in t)));

console.log("blank types catalog / fallback guards OK");
