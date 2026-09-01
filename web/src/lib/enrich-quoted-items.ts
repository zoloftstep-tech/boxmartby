import type { LivePricingConfig } from "@/lib/pricing/remote-defaults";
import type { CalcItemInput, CalcItemResult } from "@/lib/types";

export function enrichQuotedItems(
  quoted: CalcItemResult[],
  calcInputs: CalcItemInput[],
  pricing: LivePricingConfig,
): CalcItemResult[] {
  return quoted.map((item, index) => {
    const input = calcInputs[index];
    if (!input) return item;

    if (input.category === "ourDies") {
      const dieId = input.dieId ?? item.die_id;
      const die = pricing.ourDies.find((d) => d.id === dieId);
      return {
        ...item,
        category: input.category,
        material: input.material,
        die_id: dieId ?? die?.id ?? item.die_id,
        die_label: die?.name ?? item.die_label,
        formulaTypeId: item.formulaTypeId ?? die?.formulaTypeId,
      };
    }

    return {
      ...item,
      category: input.category,
      material: input.material,
    };
  });
}
