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
- `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`: affiliate tag for automatic minting.

### Server-only secrets
- `AGENT_API_KEY`: key required for privileged agent mutation endpoints when API-key mode is enabled.
- `VERCEL_TOKEN`: CI deploy token for Vercel workflow.
- `VERCEL_ORG_ID`: Vercel org id.
- `VERCEL_PROJECT_ID`: Vercel project id.

## Environment profiles

### Local development
- `NEXT_PUBLIC_DEPLOY_TARGET=runtime`
- leave API URLs blank to run local-first fallback mode.

### GitHub Pages beta
- `NEXT_PUBLIC_DEPLOY_TARGET=static-export`
- `NEXT_PUBLIC_BASE_PATH=/window_shoppr`
- `NEXT_PUBLIC_SITE_URL=https://jakerslam.github.io/window_shoppr`

### Production runtime
- `NEXT_PUBLIC_DEPLOY_TARGET=runtime`
- set auth/data/monitoring API URLs
- set `AGENT_API_KEY`

## Security notes
- Never commit `.env.local`.
- Rotate `AGENT_API_KEY` on operator changes and incidents.
- Store deployment secrets only in GitHub Actions secret store / hosting secret manager.
