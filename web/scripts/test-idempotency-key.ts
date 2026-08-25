/**
 * Idempotency-Key helper — lockstep with CRM hashSitePayload algorithm.
 */
import assert from "node:assert/strict";
import {
  buildSiteIdempotencyKey,
  hashSiteOrderPayload,
} from "../src/lib/idempotency";

const sample = {
  name: "Smoke",
  phone: "+375291112233",
  items: [
    {
      length: 220,
      width: 70,
      height: 100,
      quantity: 50,
      price_per_unit_no_vat: 0.24,
    },
  ],
  summary: { total_no_vat: 12, total_with_vat: 14.4 },
};

const hash1 = hashSiteOrderPayload(sample);
const hash2 = hashSiteOrderPayload(sample);
assert.equal(hash1, hash2, "hash must be stable for same body");
assert.match(hash1, /^[0-9a-f]{32}$/, "hash is 32 hex chars");

const other = { ...sample, phone: "+375299998877" };
assert.notEqual(
  hashSiteOrderPayload(sample),
  hashSiteOrderPayload(other),
  "different body → different hash",
);

assert.equal(
  buildSiteIdempotencyKey("  site:client-key-1  ", sample),
  "site:client-key-1",
  "header wins (trimmed)",
);

assert.equal(
  buildSiteIdempotencyKey(null, sample),
  `site:${hash1}`,
  "no header → site:hash",
);
assert.equal(
  buildSiteIdempotencyKey("", sample),
  `site:${hash1}`,
  "empty header → site:hash",
);
assert.equal(
  buildSiteIdempotencyKey("   ", sample),
  `site:${hash1}`,
  "whitespace header → site:hash",
);

console.log("ok: idempotency key helper");
