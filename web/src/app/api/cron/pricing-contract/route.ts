import { NextResponse } from "next/server";
import { sendTelegramAlert } from "@/lib/notifications";
import {
  formatPricingContractAlert,
  resolveCronSiteOrigin,
  runPricingContractCheck,
} from "@/lib/pricing/pricing-contract";

function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorizeCron(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const siteOrigin = resolveCronSiteOrigin();
    const result = await runPricingContractCheck({ siteOrigin });

    if (result.ok) {
      return NextResponse.json({ ok: true, reasons: [] as string[], notified: false });
    }

    console.error("[cron/pricing-contract]", result.reasons);
    const text = formatPricingContractAlert(result.reasons);
    const notified = await sendTelegramAlert(text);

    return NextResponse.json({
      ok: false,
      reasons: result.reasons,
      notified,
    });
  } catch (err) {
    console.error("[cron/pricing-contract]", err);
    const msg = err instanceof Error ? err.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
