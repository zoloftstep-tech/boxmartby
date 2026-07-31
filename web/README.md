# BoxMart website

B2B landing page for ООО «БОКСМАРТ» — corrugated packaging manufacturer (Minsk).

## Stack

- Next.js (App Router)
- Tailwind CSS v4
- TypeScript

## Develop

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Calculator API

UI calls `POST /api/calculate` and `POST /api/submit-order`.

Live tariffs: `GET` BoxCalc `/api/defaults` via `CALCULATOR_DEFAULTS_URL` + `CALCULATOR_DEFAULTS_API_KEY`
(same value as BoxCalc `DEFAULTS_API_KEY`). In-memory cache ~60s (`cache: "no-store"` on fetch);
on missing env or fetch error — fallback to `src/lib/pricing/pricing-config.ts`.
Response header `X-Pricing-Source: remote|local` shows which source was used.

Order notifications (Variant A): Telegram Bot API + Gmail SMTP via `src/lib/notifications.ts`.
Copy `.env.example` → `.env.local` and fill secrets before testing submit.

## Docs placeholders

Put real PDFs at:

- `public/docs/requisites.docx`
- `public/docs/contract-template.docx`
