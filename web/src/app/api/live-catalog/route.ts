import { NextResponse } from "next/server";
import { getLivePricingConfig } from "@/lib/pricing/remote-defaults";

export async function GET() {
  const { pricing, source } = await getLivePricingConfig();
  const res = NextResponse.json({ ourDies: pricing.ourDies });
  res.headers.set("X-Pricing-Source", source);
  return res;
}
