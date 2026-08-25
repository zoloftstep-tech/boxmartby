import { NextResponse } from "next/server";
import { runHealthChecks } from "@/lib/health-checks";

/**
 * Public readiness probe: defaults / calculate golden / CRM ingest (expect 401).
 * Never returns secrets or creates orders.
 */
export async function GET() {
  const result = await runHealthChecks();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
