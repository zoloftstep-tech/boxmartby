import { CATEGORY_LABELS } from "@/lib/pricing/public";
import type { LivePricingConfig } from "@/lib/pricing/remote-defaults";
import type { BoxCategory, CalcItemInput, CalcItemResult } from "@/lib/types";

function nonEmpty(value: string | undefined | null): string | undefined {
  const t = typeof value === "string" ? value.trim() : "";
  return t ? t : undefined;
}

function resolveCategoryLabel(
  existing: string | undefined,
  category: BoxCategory,
): string {
  return nonEmpty(existing) ?? CATEGORY_LABELS[category] ?? existing ?? "";
}

function resolveMaterialLabel(
  existing: string | undefined,
  material: string,
  pricing: LivePricingConfig,
): string {
  const fromCatalog = pricing.materials[material]?.label;
  return nonEmpty(existing) ?? nonEmpty(fromCatalog) ?? existing ?? "";
}

export function enrichQuotedItems(
  quoted: CalcItemResult[],
  calcInputs: CalcItemInput[],
  pricing: LivePricingConfig,
): CalcItemResult[] {
  return quoted.map((item, index) => {
    const input = calcInputs[index];
    if (!input) {
      return {
        ...item,
        category_label: resolveCategoryLabel(item.category_label, item.category),
        material_label: resolveMaterialLabel(item.material_label, item.material, pricing),
      };
    }

    const category = input.category;
    const material = input.material;

    if (category === "ourDies") {
      const dieId = input.dieId ?? item.die_id;
      const die = pricing.ourDies.find((d) => d.id === dieId);
      return {
        ...item,
        category,
        material,
        category_label: resolveCategoryLabel(item.category_label, category),
        material_label: resolveMaterialLabel(item.material_label, material, pricing),
        die_id: dieId ?? die?.id ?? item.die_id,
        die_label: die?.name ?? item.die_label,
        formulaTypeId: item.formulaTypeId ?? die?.formulaTypeId,
      };
    }

    return {
      ...item,
      category,
      material,
      category_label: resolveCategoryLabel(item.category_label, category),
      material_label: resolveMaterialLabel(item.material_label, material, pricing),
    };
  });
}
