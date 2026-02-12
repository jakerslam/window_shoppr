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
The current build reads from `src/data/products.json` and normalizes source metadata in `src/shared/lib/data.ts`.

Planned ingestion (agent‑driven):
- Idempotent upsert using `source + externalId`
- Draft/publish controls
- Moderation queue for user reports

See: `docs/agent/README.md` and `docs/agent/AGENT_SKILL.md`.

## Scripts
- `npm run dev` — local dev server
- `npm run lint` — lint checks

## Notes
- This repo includes UI and UX stubs for future backend integrations (SQL, ingestion API, analytics).
- Content can be updated via JSON until the ingestion API is wired.