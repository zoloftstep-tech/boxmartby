/**
 * Unit tests for health-checks (mocked fetch).
 */
import assert from "node:assert/strict";
import {
  calculateUrlFromDefaults,
  runHealthChecks,
  type HealthEnv,
} from "../src/lib/health-checks";

assert.equal(
  calculateUrlFromDefaults("https://calc.example/api/defaults"),
  "https://calc.example/api/calculate",
);
assert.equal(
  calculateUrlFromDefaults("https://calc.example/api/defaults", "https://x/api/calculate"),
  "https://x/api/calculate",
);

function mockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    return handler(url, init);
  }) as typeof fetch;
}

const fullEnv: HealthEnv = {
  CALCULATOR_DEFAULTS_URL: "https://calc.example/api/defaults",
  CALCULATOR_DEFAULTS_API_KEY: "key",
  CRM_INGEST_URL: "https://crm.example/api/ingest/site",
  INGEST_SITE_SECRET: "secret",
};

async function main() {
  {
    const result = await runHealthChecks({
      env: {},
      fetchFn: mockFetch(() => {
        throw new Error("should not fetch");
      }),
    });
    assert.equal(result.checks.pricing.env, "missing");
    assert.equal(result.checks.pricing.defaults, "skipped");
    assert.equal(result.checks.pricing.calculate, "skipped");
    assert.equal(result.checks.ingest.env, "missing");
    assert.equal(result.checks.ingest.reachable, "skipped");
    assert.equal(result.ok, false);
  }

  {
    const result = await runHealthChecks({
      env: fullEnv,
      fetchFn: mockFetch((url) => {
        if (url.includes("/api/defaults")) {
          return new Response("{}", { status: 401 });
        }
        return new Response("{}", { status: 500 });
      }),
    });
    assert.equal(result.checks.pricing.defaults, "fail");
    assert.equal(result.ok, false);
  }

  {
    const result = await runHealthChecks({
      env: fullEnv,
      fetchFn: mockFetch((url) => {
        if (url.includes("/api/defaults")) {
          return new Response("{}", { status: 200 });
        }
        if (url.includes("/api/calculate")) {
          return Response.json({
            items: [{ price_per_unit_no_vat: 0.23 }],
          });
        }
        return new Response("{}", { status: 401 });
      }),
    });
    assert.equal(result.checks.pricing.defaults, "ok");
    assert.equal(result.checks.pricing.calculate, "fail");
    assert.equal(result.ok, false);
  }

  {
    const result = await runHealthChecks({
      env: fullEnv,
      fetchFn: mockFetch((url) => {
        if (url.includes("/api/defaults")) {
          return new Response("{}", { status: 200 });
        }
        if (url.includes("/api/calculate")) {
          return Response.json({
            items: [{ price_per_unit_no_vat: 0.24 }],
          });
        }
        if (url.includes("/ingest/site")) {
          return new Response("{}", { status: 500 });
        }
        return new Response("{}", { status: 404 });
      }),
    });
    assert.equal(result.checks.pricing.calculate, "ok");
    assert.equal(result.checks.ingest.reachable, "fail");
    assert.equal(result.ok, false);
  }

  {
    const result = await runHealthChecks({
      env: fullEnv,
      fetchFn: mockFetch((url) => {
        if (url.includes("/api/defaults")) {
          return new Response("{}", { status: 200 });
        }
        if (url.includes("/api/calculate")) {
          return Response.json({
            items: [{ price_per_unit_no_vat: 0.239 }],
          });
        }
        if (url.includes("/ingest/site")) {
          return new Response("{}", { status: 401 });
        }
        return new Response("{}", { status: 404 });
      }),
    });
    // 0.239 rounds to 0.24
    assert.equal(result.checks.pricing.calculate, "ok");
    assert.equal(result.checks.ingest.reachable, "ok");
    assert.equal(result.ok, true);
  }

  console.log("ok: health-checks");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
