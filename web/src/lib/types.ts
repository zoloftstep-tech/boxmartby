export type BoxCategory = "fourFlap" | "selfLock" | "ourDies";
export type MaterialId = "t22" | "t23" | "t24";

export type OurDie = {
  id: string;
  name: string;
  formulaTypeId: string;
  A: number;
  B: number;
  H: number;
};

export type CalcItemInput = {
  length: number;
  width: number;
  height: number;
  quantity: number;
  category: BoxCategory;
  material: MaterialId;
  dieId?: string;
};

export type CalcItemResult = {
  length: number;
  width: number;
  height: number;
  quantity: number;
  category: BoxCategory;
  material: MaterialId;
  category_label: string;
  material_label: string;
  volume_liters: number;
  area_m2: number;
  price_per_unit_no_vat: number;
  total_price_no_vat: number;
};

export type CalcSummary = {
  total_no_vat: number;
  vat_rate: number;
  total_with_vat: number;
};

export type CalcResponse = {
  items: CalcItemResult[];
  summary: CalcSummary;
};

export type CalcRequest = {
  items: CalcItemInput[];
};

export type OrderRequest = {
  name: string;
  phone: string;
  email?: string;
  comment?: string;
  items: CalcItemResult[];
  summary: { total_no_vat: number; total_with_vat: number };
};

export type OrderResponse = {
  status: "ok";
  order_id: string;
};
