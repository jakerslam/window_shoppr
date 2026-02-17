# Window Shoppr

Live app preview: [GitHub Pages](https://jakerslam.github.io/window_shoppr/)

Window Shoppr is a modern, SEO‑focused deal discovery site built with Next.js and TypeScript. The product experience centers on a visually engaging feed of curated products, rich product detail pages, and a wishlist system designed for window‑shopping and later conversion.

## Highlights
- Animated, multi‑column browsing feed with sorting and filtering
- Rich product detail pages with media gallery, rating display, and affiliate CTAs
- Wishlist support with list management, long‑press menu, and persistence
- SEO foundations: metadata, sitemap/robots, JSON‑LD structured data
- Mobile‑first UI with bottom nav, adaptive search, and Safari UI offset handling

## Tech Stack
- Next.js (App Router) + TypeScript
- CSS Modules (BEM naming)
- Google Fonts (Plus Jakarta Sans + Cormorant)
- JSON fallback data source (SQL stubs in place)

## Local Development
```bash
npm install
npm run dev
```

Open http://localhost:3000

## Key Directories
- `src/app` — Routes, layout, metadata, sitemap/robots
- `src/features` — Feature modules (feed, product detail, wishlist, auth, nav)
- `src/shared` — Reusable UI + utilities (data, SEO helpers, analytics stubs)
- `src/data` — JSON product catalog fallback
- `docs/agent` — Agent integration docs (planned ingestion/moderation API)

## Data + Ingestion
The current build reads from `src/data/products.json` and normalizes source metadata in `src/shared/lib/catalog/data.ts`.

Planned ingestion (agent‑driven):
- Idempotent upsert using `source + externalId`
- Draft/publish controls
- Moderation queue for user reports

See: `docs/agent/README.md`, `docs/agent/SKILL.md`, and `docs/agent/AGENT_SKILL.md`.

### Backend Wiring (SQL/API)
- `NEXT_PUBLIC_DEPLOY_TARGET` (optional): `static-export` (default, GitHub Pages) or `runtime` (enables ISR-style fetch revalidation and edge/runtime hosting mode).
- `NEXT_PUBLIC_DATA_API_URL` (optional): enables SQL-backed data API wiring for:
  - `GET /data/products`
  - `GET /data/products/:slug`
  - `POST /data/wishlist/sync`
  - `POST /data/email-captures`
  - `POST /data/purchase-intents`
  - `POST /data/social-proof/saves`
  - `POST /data/submissions/affiliate-mint`
- `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` (optional): enables automatic Amazon affiliate-link minting for submitted deal URLs.
- `NEXT_PUBLIC_AUTH_API_URL` (optional): enables auth backend wiring (`/auth/*` routes).
- `NEXT_PUBLIC_MONITORING_API_URL` (optional): receives client error + performance envelopes (`kind: "error" | "trace"`). When not set, monitoring remains local-only (stored in localStorage).
- `NEXT_PUBLIC_FEATURE_FLAGS` (optional): comma-delimited overrides for safe UI experiments.
  - Example: `NEXT_PUBLIC_FEATURE_FLAGS=feed_sponsored_cards=off,native_share_fallback=on`

### Runtime Cache Strategy (R40)
- Product list requests (`/data/products`) use `revalidate: 300` with cache tag `catalog:products` in `runtime` mode.
- Product detail requests (`/data/products/:slug`) use `revalidate: 900` with tags `catalog:products` + `catalog:product:{slug}` in `runtime` mode.
- In `static-export` mode, cache hints are disabled so GitHub Pages behavior remains unchanged.

### Feature Flags (R41)
- Flag source order: defaults -> env (`NEXT_PUBLIC_FEATURE_FLAGS`) -> localStorage overrides (`window_shoppr_feature_flags`).
- Current flags:
  - `feedSponsoredCards`
  - `nativeShareFallback`
  - `wishlistManageLists`
- Local testing helper (browser console):
  - `window.localStorage.setItem("window_shoppr_feature_flags", JSON.stringify({ feedSponsoredCards: false }))`
  - `window.dispatchEvent(new CustomEvent("window_shoppr_feature_flags:update"))`

## Scripts
- `npm run dev` — local dev server
- `npm run lint` — lint checks
- `npm run test` — smoke tests for fallback catalog integrity
- `npm run audit:axe` — run axe-core CLI accessibility scan on key pages
- `npm run audit:lighthouse` — run Lighthouse CI audit on key pages
- `npm run audit:accessibility` — run both axe + Lighthouse audits

## Notes
- This repo includes UI and UX stubs for future backend integrations (SQL, ingestion API, analytics).
- Content can be updated via JSON until the ingestion API is wired.
