import { createHash } from "crypto";

/** Same algorithm as CRM `hashSitePayload` — first 32 hex of sha256(JSON). */
export function hashSiteOrderPayload(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body)).digest("hex").slice(0, 32);
}

/**
 * Prefer client/header key; otherwise stable body hash (never random UUID).
 * Header wins even if empty after trim is rejected via `||`.
 */
export function buildSiteIdempotencyKey(
  header: string | null | undefined,
  body: unknown,
): string {
  const fromHeader = header?.trim();
  if (fromHeader) return fromHeader;
  return `site:${hashSiteOrderPayload(body)}`;
}
