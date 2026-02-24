# AGENTS.md

## Cursor Cloud specific instructions

This is a single-service Next.js 16 application (TypeScript + Tailwind CSS v4). No databases, Docker, or external services are required beyond internet access for Yahoo Finance data.

### Services

| Service | Command | Port | Notes |
|---|---|---|---|
| Next.js Dev Server | `npm run dev` | 3000 | Serves both the React UI and API routes (`/api/market`, `/api/quotes`) |

### Quick Reference

- **Lint:** `npm run lint` (ESLint 9 with `eslint-config-next`)
- **Build:** `npm run build`
- **Dev:** `npm run dev` (Turbopack, auto-refreshes on file changes)
- See `README.md` for project structure and features.

### Non-obvious Notes

- No `.env` file is needed. The only env var reference (`VERCEL_PROJECT_PRODUCTION_URL`) is auto-set by Vercel and optional locally.
- Market data is fetched server-side from Yahoo Finance's public API — internet access is required for the dashboard to display live data.
- The `/api/market` route fetches historical data (1-year charts, SMAs) and is cached for 5 minutes. The `/api/quotes` route fetches live prices and is cached for 15 seconds.
- `@vercel/analytics` is a dependency but is a no-op outside Vercel deployment — it does not affect local development.
