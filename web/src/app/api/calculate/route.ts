import { NextRequest, NextResponse } from "next/server";
import { calculateItems, validateItem } from "@/lib/pricing";
import { getLivePricingConfig } from "@/lib/pricing/remote-defaults";
import type { CalcItemInput, CalcRequest, CalcResponse } from "@/lib/types";

function calculateUrlFromDefaults(): string | null {
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

async function proxyToBoxCalc(
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
    console.error("BoxCalc calculate proxy failed", res.status, text.slice(0, 200));
    return null;
  }
  return (await res.json()) as CalcResponse;
}

export async function POST(req: NextRequest) {
  let body: CalcRequest;
  try {
    body = (await req.json()) as CalcRequest;
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }

  if (!body?.items || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "items: обязательный непустой массив" }, { status: 400 });
  }

  const { pricing, source } = await getLivePricingConfig();
  const items: CalcItemInput[] = [];

  for (const raw of body.items) {
    const item: CalcItemInput = {
      length: Number(raw.length),
      width: Number(raw.width),
      height: Number(raw.height),
      quantity: Number(raw.quantity),
      category: raw.category ?? "fourFlap",
      material: raw.material ?? "t22",
      dieId: raw.dieId ? String(raw.dieId) : undefined,
    };

    const err = validateItem(item, pricing);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }

    items.push(item);
  }

  const calcUrl = calculateUrlFromDefaults();
  const key = process.env.CALCULATOR_DEFAULTS_API_KEY;
  if (calcUrl && key) {
    try {
      const remote = await proxyToBoxCalc(items, calcUrl, key);
      if (remote?.items && remote.summary) {
        const res = NextResponse.json(remote);
        res.headers.set("X-Pricing-Source", "remote");
        return res;
      }
    } catch (e) {
      console.error("BoxCalc calculate proxy error, using local fallback", e);
    }
  }

  const res = NextResponse.json(calculateItems(items, pricing));
  res.headers.set("X-Pricing-Source", source === "remote" ? "local-fallback" : "local");
  return res;
}
