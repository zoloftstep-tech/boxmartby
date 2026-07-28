import type { CalcItemInput, CalcResponse, OrderRequest, OrderResponse } from "./types";

export async function calculateQuote(items: CalcItemInput[]): Promise<CalcResponse> {
  const res = await fetch("/api/calculate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Не удалось рассчитать стоимость");
  }

  return res.json() as Promise<CalcResponse>;
}

export async function submitOrder(payload: OrderRequest): Promise<OrderResponse> {
  const res = await fetch("/api/submit-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Не удалось отправить заявку");
  }

  return res.json() as Promise<OrderResponse>;
}

export function formatByn(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("ru-BY", {
    style: "currency",
    currency: "BYN",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 12);
  let rest = digits;
  if (rest.startsWith("375")) rest = rest.slice(3);
  else if (rest.startsWith("8") && rest.length > 1) rest = rest.slice(1);

  const p = rest.slice(0, 9);
  const a = p.slice(0, 2);
  const b = p.slice(2, 5);
  const c = p.slice(5, 7);
  const d = p.slice(7, 9);

  let out = "+375";
  if (a) out += ` (${a}`;
  if (a.length === 2) out += ")";
  if (b) out += ` ${b}`;
  if (c) out += `-${c}`;
  if (d) out += `-${d}`;
  return out;
}

export function phoneToE164(masked: string): string {
  const digits = masked.replace(/\D/g, "");
  if (digits.startsWith("375") && digits.length === 12) return `+${digits}`;
  return masked;
}
