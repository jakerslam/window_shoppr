# Environment Configuration

## Required baseline
Copy `.env.example` to `.env.local` for local development.

## Variables

### Public runtime (`NEXT_PUBLIC_*`)
- `NEXT_PUBLIC_SITE_URL`: canonical site URL for SEO metadata.
- `NEXT_PUBLIC_BASE_PATH`: base path for static hosting (`""` or `/window_shoppr`).
- `NEXT_PUBLIC_DEPLOY_TARGET`: `static-export` or `runtime`.
- `NEXT_PUBLIC_FEATURE_FLAGS`: comma-delimited feature flag overrides.
- `NEXT_PUBLIC_AUTH_API_URL`: auth backend base URL.
- `NEXT_PUBLIC_DATA_API_URL`: data backend base URL.
- `NEXT_PUBLIC_MONITORING_API_URL`: monitoring ingest endpoint.
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN for direct client-side error-reporting adapter.
- `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`: affiliate tag for automatic minting.
- `NEXT_PUBLIC_ALLOW_JSON_FALLBACK`: `true/false` gate for JSON catalog fallback when SQL/API is unavailable.
- `NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK`: `true/false` gate for local auth fallback when auth API is unavailable.
- `NEXT_PUBLIC_ALLOWED_ORIGINS`: comma-delimited browser-origin allowlist for mutation requests (deny-by-default when empty).

### Server-only secrets
- `AGENT_API_KEY`: key required for privileged agent mutation endpoints when API-key mode is enabled.
- `DATABASE_URL`: Postgres connection string for the runtime API server (Neon/Render/etc). When set, the server uses Postgres instead of local SQLite.
- `VERCEL_TOKEN`: CI deploy token for Vercel workflow.
- `VERCEL_ORG_ID`: Vercel org id.
- `VERCEL_PROJECT_ID`: Vercel project id.

### Runtime API server (advanced)
- `WINDOW_SHOPPR_AUTO_MIGRATE`: `true/false`. When true, the API server auto-applies SQL migrations + seeds on boot (default: `false` in production, `true` otherwise).
- `WINDOW_SHOPPR_SEED_FROM_JSON`: `true/false`. When true, the API server imports `src/data/products.json` into SQL tables if the catalog is empty (default: `false` in production, `true` otherwise).
- `WINDOW_SHOPPR_PG_POOL_MAX`: max Postgres pool connections when `DATABASE_URL` is set (default: `10`).

## Environment profiles

### Local development
- `NEXT_PUBLIC_DEPLOY_TARGET=runtime`
- leave API URLs blank to run local-first fallback mode.
- keep `NEXT_PUBLIC_ALLOW_JSON_FALLBACK=true`.
- keep `NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK=true`.
- keep `NEXT_PUBLIC_ALLOWED_ORIGINS` empty unless testing strict mutation origin gating.

### GitHub Pages beta
- `NEXT_PUBLIC_DEPLOY_TARGET=static-export`
- `NEXT_PUBLIC_BASE_PATH=/window_shoppr`
- `NEXT_PUBLIC_SITE_URL=https://jakerslam.github.io/window_shoppr`

### Production runtime
- `NEXT_PUBLIC_DEPLOY_TARGET=runtime`
- set auth/data/monitoring API URLs
- set `NEXT_PUBLIC_ALLOW_JSON_FALLBACK=false` to enforce SQL/API source only
- set `NEXT_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK=false` to enforce backend auth only
- set `NEXT_PUBLIC_ALLOWED_ORIGINS` to explicit production origins (for example: `https://window-shoppr.com,https://www.window-shoppr.com`)
- set `AGENT_API_KEY`

## Security notes
- Never commit `.env.local`.
- Rotate `AGENT_API_KEY` on operator changes and incidents.
- Store deployment secrets only in GitHub Actions secret store / hosting secret manager.
