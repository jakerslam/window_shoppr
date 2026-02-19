# Production Data API (Render + Neon)

This project supports a **runtime** deployment where the web app talks to a hardened external API server for `/data/*` (and `/auth/*` until auth is split).

Recommended combo (from `docs/HOSTING_PIPELINE.md`):
- Web: Vercel
- API: Render (Node service)
- DB: Neon (Postgres)

## Why Not GitHub Pages
GitHub Pages is static-only. It cannot run server APIs, SQL, or intercepting-route modals. Keep it for a beta/demo (`NEXT_PUBLIC_DEPLOY_TARGET=static-export`) while we develop the runtime stack in parallel.

## API Server Deploy (Render)
### Start command
- `node server/index.mjs`

### Environment variables (minimum)
- `NODE_ENV=production`
- `DATABASE_URL=...` (Neon connection string)
- `AGENT_API_KEY=...` (required for privileged endpoints like blog upsert + affiliate mint queue)
- `ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com`

### Recommended environment variables
- `WINDOW_SHOPPR_PG_POOL_MAX=10`
- `WINDOW_SHOPPR_AUTO_MIGRATE=true` (first deploy only, to apply migrations/seeds)
- `WINDOW_SHOPPR_AUTO_MIGRATE=false` (after DB is initialized; prefer explicit migration steps in production)
- `WINDOW_SHOPPR_SEED_FROM_JSON=false` (default in production; keep it off)

## Web App Cutover (Vercel)
Set:
- `NEXT_PUBLIC_DEPLOY_TARGET=runtime`
- `NEXT_PUBLIC_DATA_API_URL=https://YOUR_API_HOST`
- `NEXT_PUBLIC_AUTH_API_URL=https://YOUR_API_HOST`
- `NEXT_PUBLIC_ALLOW_JSON_FALLBACK=false`
- `NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK=false`
- `NEXT_PUBLIC_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com`

## Notes
- This repo currently ships a single Node server that handles both data and auth routes. It can be split later, but keeping one service is fine for v1 as long as route contracts remain stable.
- The server implements in-process rate limiting as a reference. For real production hardening, also apply CDN/WAF rate limits and bot controls.

