# BoxMart website

B2B landing page for ООО «БОКСМАРТ» — corrugated packaging manufacturer (Minsk).

**Ops:** [`../OPS.md`](../OPS.md) · **Agent handoff:** [`../HANDOFF.md`](../HANDOFF.md) · **Deploy:** [`../DEPLOY.md`](../DEPLOY.md).

## Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS v4
- TypeScript
- Vercel (Root Directory `web`)

## Develop

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Calculator & orders

| Route | Role |
|-------|------|
| `POST /api/calculate` | BFF → BoxCalc (or server local-fallback). Public JSON: prices/geometry **without** `costPerSqM` / `coef` / `matCost`. Header `X-Pricing-Source`. |
| `GET /api/live-catalog` | Materials `{id,label,isReference}`, ourDies, blankTypes — **no** costs/tiers. |
| `POST /api/submit-order` | Origin check → **server re-quote** (remote only) → enrich labels → CRM ingest (`CRM_INGEST_URL` + `INGEST_SITE_SECRET` + `Idempotency-Key`) → email. TG order cards: **CRM**, not Site. |
| `GET /api/health` | Probe defaults / calculate / ingest. |

Client UI must not import `pricing-config.ts` (costs/tiers). Use `@/lib/pricing` barrel / `public.ts` only.

Copy `web/.env.example` → `web/.env.local` (names only in example; never commit secrets).

## Content SoT

- FAQ, phone, messengers: `src/lib/site.ts`
- SEO landings: `src/lib/landings.ts`

## Tests

```bash
cd web && npm test && npm run lint
```

## Docs / downloads

Footer expects contract/requisites under `public/docs/` (paths may change; check Footer component).
