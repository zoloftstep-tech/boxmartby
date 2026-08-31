import type { CalcItemInput, CalcResponse } from "@/lib/types";

/** Same URL derivation as `/api/calculate` (CALCULATOR_CALCULATE_URL or from defaults). */
export function calculateUrlFromDefaults(): string | null {
  const explicit = process.env.CALCULATOR_CALCULATE_URL;
  if (explicit) return explicit;
  const defaultsUrl = process.env.CALCULATOR_DEFAULTS_URL;
  if (!defaultsUrl) return null;
  try {
    const u = new URL(defaultsUrl);
    u.pathname = u.pathname.replace(/\/api\/defaults\/?$/, "/api/calculate");
    if (!u.pathname.endsWith("/api/calculate")) {
      u.pathname = "/api/calculate";
    }
    return u.toString();
  } catch {
    return null;
  }
}

export async function proxyToBoxCalc(
  items: CalcItemInput[],
  url: string,
  key: string,
): Promise<CalcResponse | null> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ items }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[pricing] BoxCalc calculate proxy failed", res.status, text.slice(0, 200));
    return null;
  }
  return (await res.json()) as CalcResponse;
}

/** Remote BoxCalc only — no local fallback. Returns null if unavailable/misconfigured. */
export async function calculateViaRemote(
  items: CalcItemInput[],
): Promise<CalcResponse | null> {
  const calcUrl = calculateUrlFromDefaults();
  const key = process.env.CALCULATOR_DEFAULTS_API_KEY;
  if (!calcUrl || !key) return null;
  try {
    const remote = await proxyToBoxCalc(items, calcUrl, key);
    if (remote?.items && remote.summary) return remote;
  } catch (e) {
    console.error("[pricing] BoxCalc calculate proxy error", e);
  }
  return null;
}
