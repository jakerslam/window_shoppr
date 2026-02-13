# Window Shoppr - Software Requirements Specification (SRS)

## Progress
Overall: 41/86 (47.7%)  ██████████░░░░░░░░░░
Frontend: 31/62 (50.0%) ██████████░░░░░░░░░░
Backend: 9/21 (42.9%)   █████████░░░░░░░░░░░
Automation: 0/4 (0.0%)  ░░░░░░░░░░░░░░░░░░░░


## Legend
- [ ] Not started
- [x] Done
- [ ] Selected next requirement

## Core Requirements
- [ ] R36: Add schema validation (Zod) for product data + env config
- [ ] R37: Add basic security headers (CSP, HSTS, etc.)
- [ ] R38: Add baseline analytics events (search, wishlist save, affiliate click)
- [x] R12.2: Login modal/page UI with auth handler stubs
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
- [x] R11.1: Personalization display rules (use cookies/recently viewed to tailor content)
- [x] R11.2: Product tags + tag-based search/filter + clickable tag chips
- [x] R12: Wishlist UI stub and placeholder page
- [x] R12.1: Wishlist save menu (hover/long-press list selection)
- [x] R13: Animation system for mesmerizing scrolling columns (hover pause)
- [x] R14: Navigation menu with hover unfurl (categories -> subcategories)

## SEO & Growth
- [x] R28: Category/subcategory gating (hide nav items + noindex pages until content threshold is met)
- [ ] R22.5: Category + subcategory landing pages with SEO metadata, schema, and slug routing
- [ ] R22.6: Category slug routing + canonical pages (category + subcategory)
- [ ] R25 (Phase 2 Optional): AI-curated blog engine with intent-to-product mapping (pillar templates, FAQ schema)
- [x] R20: SEO structured data (Product/Offer JSON-LD)
- [x] R21: Sitemap, robots, and canonical URLs

## Performance & Stability
- [x] R22: Image optimization and lazy-loading
- [x] R18: Error boundaries and graceful fallback UI
- [x] R19: Performance hooks (memoization/callbacks) where proven beneficial

## Backend & Data
- [ ] R29.12: User report inputs + moderation queue stub (agent-reviewed)
- [ ] R29.13: Agent API documentation (skill file for ingestion/moderation)
- [ ] R29.6: Guest wishlist persistence + future account sync (local-first saves; later sync across devices)
- [x] R29.1: Product source metadata + idempotency (source, externalId, lastSeenAt, lastPriceCheckAt)
- [ ] R29: Agent ingestion API stub (authenticated upsert endpoint + schema validation + draft/publish state)
- [ ] R12.3: Account management wiring (backend/auth integration)
- [ ] R30: SQL data layer wiring (products, wishlist, email capture submissions)

## Analytics & Revenue
- [ ] R29.9: Post-click purchase confirmation prompt ("Did you buy this?" + review reminder hook)
- [ ] R29.8: Social proof counts (display save count on product pages + cards)
- [ ] R29.5: User-submitted deals (submission flow + moderation + optional revenue share later)
- [ ] R29.4: Native ad cards (occasional sponsored cards in feed, non-disruptive)
- [x] R23: Click tracking for affiliate links
- [x] R24: Cookie consent + privacy/affiliate disclosure (accept all + essential only)

## UX & Accessibility
- [NEXT] 🔵 R43.1: Bell notifications dropdown menu (default empty state: "No notifications")
- [x] R46: Refresh nav icon set (desktop + mobile) with cleaner, consistent iconography
- [ ] R43: Notifications UI (feed + badge + placeholder list)
- [ ] R44: Profile settings section (account + security preferences + theme toggle)
- [ ] R49: Settings toggle for feed speed preference (cozy/quick) with persisted user choice
- [ ] R45: Content preferences section (category taste + email frequency)
- [ ] R29.10: Preference capture (optional onboarding quiz + trickle questions; build a local-first taste profile with privacy controls)
- [ ] R29.11: List-based recommendations (use a selected list to bias feed)
- [ ] R47: Product detail share button (copy link + native share fallback)
- [ ] R48: Configurable product description collapse (x chars with Read more/Read less)
- [ ] R29.7: Product view comments section (community notes + moderation hooks later)
- [x] R17.1: Loading UI (global spinner/skeletons for route + modal transitions)
- [ ] R29.3: Gamification (window shop points + streaks + redemption hook later)
- [ ] R29.2: Finite feed UX ("end of deck" messaging + optional reward hook)
- [x] R15: Accessibility baseline (focus states, contrast, keyboard nav)
- [x] R16: Responsive layout pass (mobile/tablet polish)
- [x] R17: Empty states + loading states
- [x] R18.1: Custom styled filter dropdown

## Theme
- [x] R15.1: Theme system (light/dark) applied to components

## Later-Stage Polish
- [ ] R39: Error monitoring + performance tracing (Sentry or similar)
- [ ] R40: ISR/edge caching strategy for product pages
- [ ] R41: Feature flags for safe UI experiments
- [ ] R42: Accessibility audit tooling (axe/Lighthouse CI)
- [ ] R31: Add automated tests + CI/lint pipeline
- [ ] R32: Reduce verbose inline comments (keep only essential intent)
- [ ] R33: Add feature public APIs (index exports) for cleaner imports
- [ ] R34: Add comprehensive error boundaries + loading states
- [ ] R35: Add architecture/structure documentation (docs/ARCHITECTURE.md)

## Optional Optimizations & Refactors
- [ ] O1: Extract product sorting/filtering into reusable helpers
- [ ] O2: Add search weighting and relevance scoring
- [ ] O3: Add pagination/virtualization for large product sets
- [x] O4: Refactor folder structure into features/ + shared/ for enterprise organization
- [ ] R26: Wishlist search input (filter saved items)
- [ ] R26.1: Wishlist search integration (mobile search targets wishlist on /wishlist; desktop wishlist search bar)
- [ ] R27: Wishlist list deletion (delete list button + confirm)
- [ ] R27.1: Manage/view lists entry in save menu (opens list manager modal)



## Deployment
- [ ] D1: Hosting + build pipeline (Vercel or equivalent)
- [ ] D2: Environment config (SITE_URL, API keys, affiliate IDs)
- [ ] D3: Custom domain + SSL
- [ ] D4: Production data source (switch JSON → SQL/API)
- [ ] D5: Monitoring + error reporting (Sentry or similar)
- [ ] D6: Restore modal routing (intercepting routes) after moving off GitHub Pages

## Quickfixes
- [x] Q1: Mobile feed card save star pinned to bottom-left corner
- [x] Q2: Wishlist cards reduced in compact size to remove excess empty space
- [x] Q3: Feed column animation pauses while wishlist list dropdown is open (resumes on close)
- [x] Q4: Quick speed toggle set slightly faster
- [x] Q5: Wishlist mobile cards place save button inline with price row for denser layout

## Notes
- Positioning (later): "Yelp for products" across retailers (cross-site reviews + community trust layer)
- Positioning: "Pinterest-like saves" (a cozy place to collect finds for later; saving does not require buying today)
- Positioning: "Target vs Walmart" (pleasant, curated, trust-first shopping; deals are additive, not the whole identity; woman-leaning tone)
- Branding target: "Window Shoppr" (finalized)
- CSS approach: BEM naming with vanilla CSS (no framework)
- Frontend: Next.js + TypeScript (App Router)
- Data source: JSON with local images (SQL stubs for later)