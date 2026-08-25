/**
 * Live contract: BoxCalc calculate shape + optional Site X-Pricing-Source: remote.
 * Skip (exit 0) when CALCULATOR_* not set.
 */
import assert from "node:assert/strict";
import {
  assertCalcResponseShape,
  hasCalculatorEnv,
  runPricingContractCheck,
} from "../src/lib/pricing/pricing-contract";

async function main() {
  // --- local shape asserts (no network) ---
  assert.equal(
    assertCalcResponseShape({
      items: [{ price_per_unit_no_vat: 0.25 }],
      summary: { total_no_vat: 12.5, total_with_vat: 15 },
    }),
    null,
  );
  assert.equal(
    assertCalcResponseShape({
      items: [{ price_per_unit_no_vat: 0 }],
      summary: { total_no_vat: 0, total_with_vat: 0 },
    }),
    "price not finite",
  );
  assert.equal(assertCalcResponseShape({ items: [] }), "items empty");
  assert.equal(assertCalcResponseShape(null), "body not object");
  console.log("ok: contract shape asserts");

  if (!hasCalculatorEnv()) {
    console.log("skip: CALCULATOR_* not set");
    return;
  }

  const siteOrigin = process.env.SITE_ORIGIN?.trim() || undefined;
  const result = await runPricingContractCheck({ siteOrigin });

  if (!result.ok) {
    console.error("contract-calculate FAIL");
    for (const r of result.reasons) console.error(" •", r);
    process.exitCode = 1;
    return;
  }

  console.log(
    siteOrigin
      ? "ok: contract-calculate (BoxCalc + Site remote)"
      : "ok: contract-calculate (BoxCalc only; set SITE_ORIGIN for Site leg)",
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
