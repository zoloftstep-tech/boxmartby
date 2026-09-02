/**
 * Self-lock stock notice + nearest ourDie match (±10 mm per axis).
 */
import assert from "node:assert/strict";
import {
  SELF_LOCK_STOCK_NOTICE,
  findNearestOurDie,
  selfLockStockNotice,
  type DraftItem,
} from "../src/components/calculator-draft";
import type { OurDie } from "../src/lib/types";

function die(partial: Partial<OurDie> & Pick<OurDie, "id" | "name" | "A" | "B" | "H">): OurDie {
  return {
    formulaTypeId: "fefco_0409",
    ...partial,
  };
}

function draft(partial: Partial<DraftItem> & Pick<DraftItem, "category">): DraftItem {
  return {
    id: "t1",
    length: "",
    width: "",
    height: "",
    quantity: "100",
    material: "t23",
    dieId: "",
    formulaTypeId: "",
    ...partial,
  };
}

const query = { L: 250, W: 200, H: 80 };

{
  const hit = findNearestOurDie(query.L, query.W, query.H, [
    die({ id: "a", name: "A", A: 255, B: 195, H: 85 }),
  ]);
  assert.equal(hit?.id, "a", "255×195×85 within ±10");
}

{
  const hit = findNearestOurDie(query.L, query.W, query.H, [
    die({ id: "b", name: "B", A: 245, B: 200, H: 80 }),
  ]);
  assert.equal(hit?.id, "b", "245×200×80 within ±10");
}

{
  const hit = findNearestOurDie(query.L, query.W, query.H, [
    die({ id: "c", name: "C", A: 260, B: 195, H: 85 }),
  ]);
  assert.equal(hit?.id, "c", "260×195×85 within ±10");
}

{
  const hit = findNearestOurDie(query.L, query.W, query.H, [
    die({ id: "perm", name: "Perm", A: 200, B: 250, H: 80 }),
  ]);
  assert.equal(hit, null, "permutation 200×250×80 must not match");
}

{
  const nearer = die({ id: "near", name: "Near", A: 250, B: 200, H: 80 });
  const farther = die({ id: "far", name: "Far", A: 260, B: 190, H: 90 });
  const hit = findNearestOurDie(query.L, query.W, query.H, [farther, nearer]);
  assert.equal(hit?.id, "near", "pick smaller sum of |Δ|");
}

{
  const notice = selfLockStockNotice(
    draft({ category: "selfLock", length: "", width: "200", height: "80" }),
    [],
  );
  assert.equal(notice, null, "incomplete LWH → no notice");
}

{
  const notice = selfLockStockNotice(
    draft({ category: "fourFlap", length: "250", width: "200", height: "80" }),
    [die({ id: "x", name: "X", A: 250, B: 200, H: 80 })],
  );
  assert.equal(notice, null, "non-selfLock → no notice");
}

{
  const notice = selfLockStockNotice(
    draft({ category: "selfLock", length: "250", width: "200", height: "80" }),
    [],
  );
  assert.equal(notice, SELF_LOCK_STOCK_NOTICE, "no catalog match → base notice");
}

{
  const notice = selfLockStockNotice(
    draft({ category: "selfLock", length: "250", width: "200", height: "80" }),
    [die({ id: "d1", name: "FEFCO 0427", A: 255, B: 195, H: 85 })],
  );
  assert.ok(notice && notice.includes("FEFCO 0427"));
  assert.ok(notice.includes("255×195×85"));
  assert.ok(notice.startsWith("Такой формы сейчас нет в наличии."));
}

console.log("ok: self-lock stock notice");
