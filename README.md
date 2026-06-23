# Daily intake — calorie & macro tracker

A small, installable (PWA) web app that logs meals by photo and/or text,
estimates calories and macros with OpenAI, shows what's left for the day, keeps
a full history, and exports it to Excel. Single user, no sign-in.

Built from the original `calorie-tracker.jsx` artifact. Two things changed from
the artifact, as required:

- `window.storage` is replaced by **Postgres** behind API routes.
- the model call in `estimate()` moved to a **server-side API route** so the
  OpenAI key never reaches the browser.

## Stack

- **Next.js (App Router) + TypeScript**, deployed on **Vercel**
- **Postgres** (Neon or Supabase) via **Drizzle ORM** + the Neon serverless driver
- **`openai`** SDK for the server-side estimate (default model `gpt-4o-mini`,
  override with `OPENAI_MODEL`)
- **SheetJS (`xlsx`)** for the client-side Excel export
- **Open Food Facts** (free, no key) for barcode product lookups; **ZXing**
  (`@zxing/browser`) for in-browser camera scanning
- **lucide-react** icons; scoped CSS from the artifact (no Tailwind)

## Hard constraints honoured

1. **API key is server-side only.** `OPENAI_API_KEY` is read only in
   `app/api/estimate/route.ts` via `process.env`. The browser uploads the photo
   and text to that route; the route calls OpenAI and returns only the parsed
   result.
2. **The estimate endpoint is rate-limited.** The app is open (no sign-in), so
   `/api/estimate` applies a per-IP **rate limit** — the main guard stopping a
   stray URL from running up an OpenAI bill. (If you later want a gate, a
   shared-password middleware can be added back.)
3. **No secrets in the repo.** Everything sensitive is an env var.

## Routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/estimate` | `{ imageBase64?, mediaType?, text }` → `{ label, kcal, protein, carbs, fat, note }` (server-side OpenAI, rate limited) |
| GET | `/api/product/:barcode` | look up a scanned barcode in Open Food Facts → `{ found, name, per100g, servingGrams }` |
| GET | `/api/entries?date=YYYY-MM-DD` / `?from=&to=` | entries for a day / range |
| POST | `/api/entries` | add an entry |
| DELETE | `/api/entries/:id` | delete an entry |
| GET / PUT | `/api/settings` | read / update settings |
| GET / POST | `/api/templates` | list / add favourites |
| DELETE | `/api/templates/:id` | delete a favourite |

## Pages

- **`/`** — Today: the vessel hero (kcal remaining, eaten-of-target, macro
  readouts), training-vs-rest-day logic with a per-day override, the add-a-meal
  flow (text + photo + Estimate, **barcode scan** → Open Food Facts lookup with
  an amount-in-grams field, then editable fields before logging), favourites
  chips, today's list with delete, and the Settings drawer.
- **`/history`** — past days with totals, target, remaining/over, a per-day bar,
  a date-range selector + presets, per-day averages for kcal and protein, and
  the **Download Excel** button.

## Local development

```bash
npm install

# 1. Create .env.local from the example and fill it in
cp .env.example .env.local
#   OPENAI_API_KEY=...           (OpenAI API key)
#   DATABASE_URL=postgres://...  (Neon/Supabase pooled connection string)

# 2. Create the tables (idempotent). Either:
npm run db:setup        # runs drizzle/0000_init.sql via the Neon driver
#   or, with drizzle-kit:
# npm run db:push

# 3. Run it
npm run dev             # http://localhost:3000
```

PWA icons are generated at build time (a `prebuild` hook runs
`scripts/gen-icons.mjs`); run `npm run icons` to create them on demand for `next dev`.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add a Postgres database — the **Neon** or **Supabase** Vercel integration
   sets `DATABASE_URL` for you (use the pooled connection string).
3. In **Project Settings → Environment Variables**, set:
   - `OPENAI_API_KEY`
   - `DATABASE_URL` (from the integration)
4. Run the migration once against the production database
   (`DATABASE_URL=... npm run db:setup` locally, or `npm run db:push`).
5. Deploy. Open the URL, then **Add to Home Screen** on iPhone for an app-like
   launch.

## Data model

- **entries** — `id`, `date` (YYYY-MM-DD, local), `time` (HH:MM), `label`,
  `kcal`, `protein`, `carbs`, `fat`, `note?`, `created_at`; indexed on `date`.
- **settings** (single row) — training-day targets `target` (kcal),
  `training_protein`, `training_carbs`, `training_fat`; rest-day targets
  `rest_target` (kcal), `rest_protein`, `rest_carbs`, `rest_fat` (all nullable,
  set in the app — no hardcoded targets); `training_days` (weekday numbers,
  0 = Sunday; default `[1,3,5,0]`); and `overrides` (per-date day-type overrides).
- **templates** — `id`, `name`, `kcal`, `protein`, `carbs`, `fat`.

## Notes

- Estimates from photo/text are approximate (~±15%, weaker on mixed dishes), so
  the editable fields before logging are not optional. For repeated meal-prep
  meals, save a **favourite** once and log it in one tap — that's the accurate,
  fast path. Manual entry and favourites never call the model.
- Rate limiting is in-memory per instance by default (enough to stop a leaked
  URL from burning credits in normal use). For a durable cross-instance limit,
  wire Upstash Redis in behind `lib/rate-limit.ts` using the optional
  `UPSTASH_*` env vars.
- The optional "nightly auto-export" extension (Vercel Cron + Blob/Resend) is
  not built; the manual Download Excel on the History page covers the day-to-day
  need.
- **Schema changes:** migrations live in `drizzle/` and are additive/idempotent.
  After pulling a change that adds columns, re-run `npm run db:setup` (it applies
  every file in `drizzle/`) or run the new `drizzle/000N_*.sql` against your
  database.
