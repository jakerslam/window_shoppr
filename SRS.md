# Window Shoppr - Software Requirements Specification (SRS)

## Legend
- [ ] Not started
- [x] Done
- [NEXT] Selected next requirement

## Core Requirements
- [x] R1: Initialize architecture (Next.js + TypeScript scaffold) and baseline project structure
- [x] R2: Define core data model and JSON fallback loading strategy (with SQL stubs)
- [x] R3: Global layout with top bar (categories, search, login placeholder) and footer stub
- [x] R3.1: Migrate layout styles to component-scoped CSS Modules
- [x] R3.2: Add global color palette variables (light + dark placeholders)
- [x] R4: Home feed grid with sorting and search (client-side)
- [x] R5: Product card design (name truncation, price/strike, wishlist star stub)
- [x] R5.1: Add sample product images and update card layout (rectangular card, square image)
- [x] R5.2: Add LLM operating instructions markdown
- [x] R6.1: In-feed expansion overlay (desktop) with mobile direct navigation
- [x] R6: Product detail page template (back arrow, images, price, rating, description with "More")
- [x] R7: Deal-specific UI (timer, deal badge, crossed-out price)
- [x] R8: Category pages and routing
- [x] R9: Email capture popup UI (delayed) with backend stubs
- [x] R10: SEO baseline (metadata, Open Graph, schema.org, sitemap, robots)
- [x] R11: Personalization stubs (recently viewed tracking/cookies)
- [ ] R11.1: Personalization display rules (use cookies/recently viewed to tailor content)
- [NEXT] 🔵 R12: Wishlist UI stub and placeholder page
- [ ] R12.1: Wishlist save menu (hover/long-press list selection)
- [ ] R13: Animation system for mesmerizing scrolling columns (hover pause)
- [ ] R14: Navigation menu with hover unfurl (categories -> subcategories)

## SEO & Growth
- [ ] R20: SEO structured data (Product/Offer JSON-LD)
- [ ] R21: Sitemap, robots, and canonical URLs

## Performance & Stability
- [ ] R22: Image optimization and lazy-loading
- [ ] R18: Error boundaries and graceful fallback UI
- [ ] R19: Performance hooks (memoization/callbacks) where proven beneficial

## Backend & Data
- [ ] R30: SQL data layer wiring (products, wishlist, email capture submissions)

## Analytics & Revenue
- [ ] R23: Click tracking for affiliate links
- [ ] R24: Cookie consent + privacy/affiliate disclosure

## UX & Accessibility
- [ ] R15: Accessibility baseline (focus states, contrast, keyboard nav)
- [ ] R16: Responsive layout pass (mobile/tablet polish)
- [ ] R17: Empty states + loading states
- [ ] R18.1: Custom styled filter dropdown

## Theme
- [ ] R15.1: Theme system (light/dark) applied to components

## Optional Optimizations & Refactors
- [ ] O1: Extract product sorting/filtering into reusable helpers
- [ ] O2: Add search weighting and relevance scoring
- [ ] O3: Add pagination/virtualization for large product sets

## Notes
- Branding target: "Window Shoppr" (finalized)
- CSS approach: BEM naming with vanilla CSS (no framework)
- Frontend: Next.js + TypeScript (App Router)
- Data source: JSON with local images (SQL stubs for later)
