import { NextRequest, NextResponse } from "next/server";
import { calculateItems, validateItem } from "@/lib/pricing";
import type { CalcItemInput, CalcRequest } from "@/lib/types";

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

  const items: CalcItemInput[] = [];

  for (const raw of body.items) {
    const item: CalcItemInput = {
      length: Number(raw.length),
      width: Number(raw.width),
      height: Number(raw.height),
      quantity: Number(raw.quantity),
      category: raw.category ?? "fourFlap",
      material: raw.material ?? "t23",
    };

    const err = validateItem(item);
    if (err) {
      return NextResponse.json({ error: err }, { status: 400 });
    }

    items.push(item);
  }

  return NextResponse.json(calculateItems(items));
}
