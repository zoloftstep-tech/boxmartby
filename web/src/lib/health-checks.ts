export type CheckStatus = "ok" | "missing" | "fail" | "skipped";

export type HealthChecksResult = {
  ok: boolean;
  checks: {
    pricing: {
      env: CheckStatus;
      defaults: CheckStatus;
      calculate: CheckStatus;
    };
    ingest: {
      env: CheckStatus;
      reachable: CheckStatus;
    };
  };
};

export type HealthEnv = {
  CALCULATOR_DEFAULTS_URL?: string;
  CALCULATOR_DEFAULTS_API_KEY?: string;
  CALCULATOR_CALCULATE_URL?: string;
  CRM_INGEST_URL?: string;
  INGEST_SITE_SECRET?: string;
};

const TIMEOUT_MS = 3000;

const GOLDEN_ITEM = {
  length: 220,
  width: 70,
  height: 100,
  quantity: 50,
  category: "fourFlap",
  material: "t22",
};

export function calculateUrlFromDefaults(
  defaultsUrl: string | undefined,
  explicit?: string,
): string | null {
  if (explicit?.trim()) return explicit.trim();
  if (!defaultsUrl?.trim()) return null;
  try {
    const u = new URL(defaultsUrl.trim());
    u.pathname = u.pathname.replace(/\/api\/defaults\/?$/, "/api/calculate");
    if (!u.pathname.endsWith("/api/calculate")) {
      u.pathname = "/api/calculate";
    }
    return u.toString();
  } catch {
    return null;
  }
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

export async function runHealthChecks(opts?: {
  env?: HealthEnv;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): Promise<HealthChecksResult> {
  const env = opts?.env ?? (process.env as HealthEnv);
  const fetchFn = opts?.fetchFn ?? fetch;
  const timeoutMs = opts?.timeoutMs ?? TIMEOUT_MS;

  const defaultsUrl = env.CALCULATOR_DEFAULTS_URL?.trim();
  const apiKey = env.CALCULATOR_DEFAULTS_API_KEY?.trim();
  const pricingEnv: CheckStatus =
    defaultsUrl && apiKey ? "ok" : "missing";

  let defaults: CheckStatus = pricingEnv === "ok" ? "fail" : "skipped";
  let calculate: CheckStatus = pricingEnv === "ok" ? "fail" : "skipped";

  if (pricingEnv === "ok" && defaultsUrl && apiKey) {
    try {
      const res = await fetchWithTimeout(
        fetchFn,
        defaultsUrl,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        timeoutMs,
      );
      defaults = res.ok ? "ok" : "fail";
      if (!res.ok) {
        console.warn("[health] defaults fail", res.status);
      }
    } catch (e) {
      defaults = "fail";
      console.warn("[health] defaults error", e);
    }

    const calcUrl = calculateUrlFromDefaults(
      defaultsUrl,
      env.CALCULATOR_CALCULATE_URL,
    );
    if (!calcUrl) {
      calculate = "fail";
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
            body: JSON.stringify({ items: [GOLDEN_ITEM] }),
          },
          timeoutMs,
        );
        if (!res.ok) {
          calculate = "fail";
          console.warn("[health] calculate fail", res.status);
        } else {
          const data = (await res.json()) as {
            items?: { price_per_unit_no_vat?: number }[];
          };
          const price = data?.items?.[0]?.price_per_unit_no_vat;
          calculate =
            typeof price === "number" &&
            Number.isFinite(price) &&
            price > 0
              ? "ok"
              : "fail";
          if (calculate === "fail") {
            console.warn("[health] calculate price invalid", price);
          }
        }
      } catch (e) {
        calculate = "fail";
        console.warn("[health] calculate error", e);
      }
    }
  }

  const ingestSecret = env.INGEST_SITE_SECRET?.trim();
  const ingestUrl = env.CRM_INGEST_URL?.trim();
  const ingestEnv: CheckStatus =
    ingestSecret && ingestUrl ? "ok" : "missing";

  let reachable: CheckStatus = ingestEnv === "ok" ? "fail" : "skipped";
  if (ingestEnv === "ok" && ingestUrl) {
    try {
      const res = await fetchWithTimeout(
        fetchFn,
        ingestUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer health-check-invalid",
          },
          body: JSON.stringify({ name: "health", phone: "+375000000000", items: [] }),
        },
        timeoutMs,
      );
      // 401 = URL alive, auth enforced, no order created
      reachable = res.status === 401 ? "ok" : "fail";
      if (reachable === "fail") {
        console.warn("[health] ingest reachable unexpected status", res.status);
      }
    } catch (e) {
      reachable = "fail";
      console.warn("[health] ingest reachable error", e);
    }
  }

  const allGood =
    pricingEnv === "ok" &&
    defaults === "ok" &&
    calculate === "ok" &&
    ingestEnv === "ok" &&
    reachable === "ok";

  return {
    ok: allGood,
    checks: {
      pricing: { env: pricingEnv, defaults, calculate },
      ingest: { env: ingestEnv, reachable },
    },
  };
}
