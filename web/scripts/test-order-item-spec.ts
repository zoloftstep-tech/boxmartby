/**
 * Site order item spec formatting — golden cases.
 */
import assert from "node:assert/strict";
import {
  formatSiteOrderItemBlock,
  formatSiteOrderItemSpecLines,
  orderCategoryLabel,
  OUR_DIES_ORDER_CATEGORY_LABEL,
} from "../src/lib/order-item-spec";
import type { CalcItemResult } from "../src/lib/types";

const selfLock: CalcItemResult = {
  length: 300,
  width: 200,
  height: 150,
  quantity: 100,
  category: "selfLock",
  material: "t22",
  category_label: "Самосборная",
  material_label: "T22",
  volume_liters: 9,
  area_m2: 0.5,
  price_per_unit_no_vat: 0.24,
  total_price_no_vat: 24,
  formulaTypeId: "fefco_0409",
};

assert.deepEqual(formatSiteOrderItemSpecLines(selfLock), [
  "Категория коробки: Самосборная",
  "Тип развёртки FEFCO: 0409",
  "Материал картона: T22",
]);

const ourDies: CalcItemResult = {
  ...selfLock,
  category: "ourDies",
  category_label: "Наши штанцформы",
  die_id: "die-1",
  die_label: "Коробка под пиццу",
  formulaTypeId: "fefco_0409",
};

assert.equal(orderCategoryLabel(ourDies), OUR_DIES_ORDER_CATEGORY_LABEL);
assert.deepEqual(formatSiteOrderItemSpecLines(ourDies), [
  "Категория коробки: Наша штанцформа",
  "Штанцформа: Коробка под пиццу",
  "Материал картона: T22",
]);
assert.doesNotMatch(formatSiteOrderItemBlock(ourDies, 0), /FEFCO/);

const fourFlap: CalcItemResult = {
  ...selfLock,
  category: "fourFlap",
  category_label: "Четырёхклапанная",
  formulaTypeId: "fefco_0201",
};

assert.deepEqual(formatSiteOrderItemSpecLines(fourFlap), [
  "Категория коробки: Четырёхклапанная",
  "Тип развёртки FEFCO: 0201",
  "Материал картона: T22",
]);

console.log("order-item-spec: ok");
