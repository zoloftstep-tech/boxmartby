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

Pricing lives in `src/lib/pricing/` (owner-editable tariffs).

Order notifications (Variant A): Telegram Bot API + Gmail SMTP via `src/lib/notifications.ts`.
Copy `.env.example` → `.env.local` and fill secrets before testing submit.

## Docs placeholders

Put real PDFs at:

- `public/docs/requisites.pdf`
- `public/docs/contract-template.pdf`
