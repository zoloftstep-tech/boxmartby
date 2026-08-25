import { calculateUrlFromDefaults } from "@/lib/health-checks";

export const CONTRACT_GOLDEN_ITEM = {
  length: 220,
  width: 70,
  height: 100,
  quantity: 50,
  category: "fourFlap",
  material: "t22",
};

const DEFAULT_TIMEOUT_MS = 8000;

export type PricingContractEnv = {
  CALCULATOR_DEFAULTS_URL?: string;
  CALCULATOR_DEFAULTS_API_KEY?: string;
  CALCULATOR_CALCULATE_URL?: string;
};

export type PricingContractResult = {
  ok: boolean;
  reasons: string[];
};

/**
 * Returns null if body looks like a valid CalcResponse with a positive unit price.
 * Otherwise a short reason string.
 */
export function assertCalcResponseShape(body: unknown): string | null {
  if (!body || typeof body !== "object") return "body not object";
  const o = body as Record<string, unknown>;
  if (!Array.isArray(o.items) || o.items.length === 0) return "items empty";
  const item = o.items[0];
  if (!item || typeof item !== "object") return "items[0] not object";
  const price = (item as Record<string, unknown>).price_per_unit_no_vat;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    return "price not finite";
  }
  const summary = o.summary;
  if (!summary || typeof summary !== "object") return "summary missing";
  const s = summary as Record<string, unknown>;
  if (typeof s.total_no_vat !== "number" || !Number.isFinite(s.total_no_vat)) {
    return "summary.total_no_vat invalid";
  }
  if (typeof s.total_with_vat !== "number" || !Number.isFinite(s.total_with_vat)) {
    return "summary.total_with_vat invalid";
  }
  return null;
}

export function hasCalculatorEnv(env?: PricingContractEnv): boolean {
  const e = env ?? (process.env as PricingContractEnv);
  return Boolean(e.CALCULATOR_DEFAULTS_URL?.trim() && e.CALCULATOR_DEFAULTS_API_KEY?.trim());
}

async function fetchWithTimeout(
  fetchFn: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetchFn(url, { ...init, signal: ctrl.signal, cache: "no-store" });
  } finally {
    clearTimeout(t);
  }
}

function stripTrailingSlash(origin: string): string {
  return origin.replace(/\/+$/, "");
}

/**
 * Live contract: BoxCalc calculate shape + optional Site proxy with X-Pricing-Source: remote.
 * Missing siteOrigin skips the Site leg (does not fail).
 * Missing CALCULATOR_* adds BoxCalc: env missing (caller may skip before calling).
 */
export async function runPricingContractCheck(opts?: {
  env?: PricingContractEnv;
  siteOrigin?: string | null;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): Promise<PricingContractResult> {
  const env = opts?.env ?? (process.env as PricingContractEnv);
  const fetchFn = opts?.fetchFn ?? fetch;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const reasons: string[] = [];

  const defaultsUrl = env.CALCULATOR_DEFAULTS_URL?.trim();
  const apiKey = env.CALCULATOR_DEFAULTS_API_KEY?.trim();
  const calcUrl = calculateUrlFromDefaults(defaultsUrl, env.CALCULATOR_CALCULATE_URL);

  if (!defaultsUrl || !apiKey || !calcUrl) {
    reasons.push("BoxCalc: env missing");
  } else {
    try {
      const res = await fetchWithTimeout(
        fetchFn,
        calcUrl,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items: [CONTRACT_GOLDEN_ITEM] }),
        },
        timeoutMs,
      );
      if (!res.ok) {
        reasons.push(`BoxCalc: HTTP ${res.status}`);
      } else {
        const body = (await res.json().catch(() => null)) as unknown;
        const shapeErr = assertCalcResponseShape(body);
        if (shapeErr) reasons.push(`BoxCalc: ${shapeErr}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      reasons.push(`BoxCalc: ${msg.slice(0, 120)}`);
    }
  }

  const siteOrigin = opts?.siteOrigin?.trim()
    ? stripTrailingSlash(opts.siteOrigin.trim())
    : null;

  if (siteOrigin) {
    try {
      const res = await fetchWithTimeout(
        fetchFn,
        `${siteOrigin}/api/calculate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: [CONTRACT_GOLDEN_ITEM] }),
        },
        timeoutMs,
      );
      if (!res.ok) {
        reasons.push(`Site: HTTP ${res.status}`);
      } else {
        const source = res.headers.get("x-pricing-source")?.trim() || "(missing)";
        if (source !== "remote") {
          reasons.push(`Site: X-Pricing-Source=${source}`);
        }
        const body = (await res.json().catch(() => null)) as unknown;
        const shapeErr = assertCalcResponseShape(body);
        if (shapeErr) reasons.push(`Site: ${shapeErr}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      reasons.push(`Site: ${msg.slice(0, 120)}`);
    }
  }

  return { ok: reasons.length === 0, reasons };
}

export function resolveCronSiteOrigin(env: NodeJS.ProcessEnv = process.env): string | null {
  const explicit =
    env.SITE_ORIGIN?.trim() ||
    env.ALLOWED_ORIGIN?.trim() ||
    "";
  if (explicit) return stripTrailingSlash(explicit);
  const vercel = env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  return null;
}

export function formatPricingContractAlert(reasons: string[]): string {
  const lines = reasons.map((r) => `• ${r}`);
  return `[pricing-contract] FAIL\n${lines.join("\n")}`;
}
