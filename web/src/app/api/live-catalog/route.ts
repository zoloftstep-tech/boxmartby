import { NextResponse } from "next/server";
import { getLivePricingConfig, materialsListFromPricing } from "@/lib/pricing/remote-defaults";
import { toPublicLiveCatalog } from "@/lib/pricing/public-dto";

export async function GET() {
  const { pricing, source } = await getLivePricingConfig();
  const body = toPublicLiveCatalog({
    ourDies: pricing.ourDies,
    materials: materialsListFromPricing(pricing),
    blankTypes: pricing.blankTypes,
  });
  const res = NextResponse.json(body);
  res.headers.set("X-Pricing-Source", source);
  return res;
}
