# Window Shoppr - Software Requirements Specification (SRS)

## Progress
Overall: 72/92 (78.3%)  ████████████████░░░░
Frontend: 53/64 (82.8%) ████████████████░░░░
Backend: 16/22 (72.7%)  ███████████████░░░░░
Automation: 0/4 (0.0%)  ░░░░░░░░░░░░░░░░░░░░


## Legend
- [ ] Not started
- [x] Done
- [ ] Selected next requirement


## Engineering Standards
- See `docs/ENGINEERING_STANDARDS.md` for coding, organization, and delivery workflow rules.


## Maintenance Cadence
- Run a maintenance/simplification pass after every 4 completed requirements.
- Maintenance pass scope: split oversized files (220+/120+ rule), remove duplicate effects/state logic, clean dead code, run `npm run lint` + `npm run build`, and refresh docs impacted by refactors.
- Release gate: do not start a new feature requirement if the maintenance pass is overdue.
- Early trigger: run maintenance immediately if any TS/TSX file exceeds 350 lines.

## Core Requirements
- [x] R36: Add schema validation (Zod) for product data + env config
- [x] R37: Add basic security headers (CSP, HSTS, etc.)
- [x] R38: Add baseline analytics events (search, wishlist save, affiliate click)
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
- [x] R7.1: Expired-deal guard (automatically hide crossed-out/original price and countdown when `dealEndsAt` is in the past)
- [x] R8: Category pages and routing
- [x] R9: Email capture popup UI (delayed) with backend stubs
- [x] R10: SEO baseline (metadata, Open Graph, schema.org, sitemap, robots)
- [x] R11: Personalization stubs (recently viewed tracking/cookies)
- [x] R11.1: Personalization display rules (use cookies/recently viewed to tailor content)
- [x] R11.2: Product tags + tag-based search/filter + clickable tag chips
- [x] R12: Wishlist UI stub and placeholder page
- [x] R12.1: Wishlist save menu (hover/long-press list selection)
- [x] R13: Animation system for mesmerizing scrolling columns (hover pause)
- [x] R13.1: Manual scroll assist for the auto-scrolling feed (wheel/touch drag adjusts speed temporarily; easing back to baseline)
- [x] R13.2: Mobile manual-scroll cooldown (after touch/wheel manipulation, wait 1000ms before that column resumes auto-scroll).
- [x] R14: Navigation menu with hover unfurl (categories -> subcategories)

## SEO & Growth
- [x] R28: Category/subcategory gating (hide nav items + noindex pages until content threshold is met)
- [x] R22.5: Category + subcategory landing pages with SEO metadata, schema, and slug routing
- [x] R22.6: Category slug routing + canonical pages (category + subcategory)
- [ ] R25 (Phase 2 Optional): AI-curated blog engine with intent-to-product mapping (pillar templates, FAQ schema)
- [x] R20: SEO structured data (Product/Offer JSON-LD)
- [x] R21: Sitemap, robots, and canonical URLs

## Performance & Stability
- [x] R22: Image optimization and lazy-loading
- [x] R18: Error boundaries and graceful fallback UI
- [x] R19: Performance hooks (memoization/callbacks) where proven beneficial

## Backend & Data
- [x] R29.12: User report inputs + moderation queue stub (agent-reviewed)
- [x] R29.13: Agent API documentation (skill file for ingestion/moderation)
- [x] R29.16: Competitor signal intake stub (RSS/manual signal -> merchant URL verification -> no-copy compliance queue for agent enrichment and downstream affiliate-link minting)
- [x] R29.6: Guest wishlist persistence + future account sync (local-first saves; later sync across devices)
- [x] R29.1: Product source metadata + idempotency (source, externalId, lastSeenAt, lastPriceCheckAt)
- [x] R29: Agent ingestion API stub (authenticated upsert endpoint + schema validation + draft/publish state)
- [x] R12.3: Account management wiring (backend/auth integration)
- [x] R12.4: Auth gate for profile/settings and notifications (require login/signup session after auth backend is live)
- [x] R30: SQL data layer wiring (products, wishlist, email capture submissions)

## Analytics & Revenue
- [x] R29.9: Post-click purchase confirmation prompt ("Did you buy this?" + review reminder hook)
- [x] R29.8: Social proof counts (display save count on product pages + cards)
- [x] R29.5: User-submitted deals (submit link + optional price/info; moderation queue for AI agent/gatekeeper; auto-enrich into draft products; optional revenue share later)
- [ ] R29.14: Affiliate-link minting pipeline for submitted products (extract/normalize product URL, attempt first-party affiliate link generation automatically or via agent queue, validate compliance, then auto-replace listing link with audit trail + rollback).
- [ ] R29.15: Monetization-aware feed ranking boost (prefer products with verified first-party affiliate links, with capped weight so relevance/quality signals still dominate).
- [ ] R29.4: Native ad cards (occasional sponsored cards in feed, non-disruptive)
- [x] R23: Click tracking for affiliate links
- [x] R24: Cookie consent + privacy/affiliate disclosure (accept all + essential only)

## UX & Accessibility
- [x] R43.2: Show a compact window-points badge in the top bar to the left of the notifications bell (desktop + mobile-safe sizing).
- [x] R43.1: Bell notifications dropdown menu (default empty state: "No notifications")
- [x] R46: Refresh nav icon set (desktop + mobile) with cleaner, consistent iconography
- [x] R43: Notifications UI (feed + badge + placeholder list)
- [x] R44: Profile settings section (account + security preferences + theme toggle)
- [x] R49: Settings toggle for feed speed preference (cozy/quick) with persisted user choice
- [x] R49.1: Persist the active feed speed toggle state (cozy/quick) across navigation/reloads so the UI keeps the user’s last selected mode.
- [x] R50: Product media overflow navigation (when image/video thumbnails exceed viewport, show horizontal side-scroll with swipe support and arrow controls).
- [x] R45: Content preferences section (category taste + email frequency)
- [x] R29.10: Preference capture (optional onboarding quiz + trickle questions; build a local-first taste profile with privacy controls)
- [x] R29.10.1: Preference question bank config (drive onboarding + trickle prompts from a data file for easy edits)
- [x] R29.11: List-based recommendations (use a selected list to bias feed)
- [x] R47: Product detail share button (copy link + native share fallback)
- [x] R47.1: Product-card action row update (share button on far right, save button directly to its left, and save-count shown only when count >= 5).
- [x] R48: Configurable product description collapse (x chars with Read more/Read less)
- [x] R29.7: Product view comments section (community notes + moderation hooks later)
- [x] R17.1: Loading UI (global spinner/skeletons for route + modal transitions)
- [x] R29.3: Gamification (window shop points + streaks + redemption hook later)
- [x] R29.2: Finite feed UX ("end of deck" messaging + optional reward hook)
- [x] R29.2.1: Finite feed end-state bar (full-width bottom bar that pauses feed and says "You've reached the end of our picks for {category}"), with explicit actions: "Start Over" and "Browse All Categories".
- [x] R15: Accessibility baseline (focus states, contrast, keyboard nav)
- [x] R16: Responsive layout pass (mobile/tablet polish)
- [x] R17: Empty states + loading states
- [x] R18.1: Custom styled filter dropdown

## Theme
- [x] R15.1: Theme system (light/dark) applied to components

## UI Tuning Backlog
- [ ] U1: Scroll speed settings UX polish (make speed inputs easier to use and invert semantics so higher value = faster), with migration of saved preferences so existing users keep equivalent behavior.

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

## Production Hardening Backlog
- [ ] R51: CI required checks (lint + typecheck + unit + integration + e2e + build must pass before merge)
- [ ] R52: Coverage gate in CI (minimum line/branch thresholds with fail-fast enforcement)
- [ ] R53: PR governance (CODEOWNERS, PR template, branch protection, required review policy)
- [ ] R54: API contract discipline (OpenAPI spec + contract tests for ingestion/moderation endpoints)
- [ ] R55: DB migration safety (versioned migrations, rollback scripts, deterministic seeds)
- [ ] R56: Auth and authorization hardening (real sessions, role-based access, audit logging for privileged actions)
- [ ] R57: Observability baseline (structured logs, request IDs, tracing, error tracking, uptime checks)
- [ ] R58: Incident response readiness (SLOs, alert thresholds, runbooks, on-call escalation flow)
- [ ] R59: Security scanning in CI (dependency vuln scan, secret scan, static security checks)
- [ ] R60: Performance budget gate (Lighthouse/Web Vitals budgets enforced in CI, with mobile thresholds)
- [ ] R61: Data governance controls (retention policy, deletion/export flows, consent-linked data handling)
- [ ] R62: Release strategy hardening (staging environment, release checklist, rollback and smoke-test workflow)

## Optional Optimizations & Refactors
- [ ] O1: Extract product sorting/filtering into reusable helpers
- [ ] O2: Add search weighting and relevance scoring
- [ ] O3: Add pagination/virtualization for large product sets
- [x] O4: Refactor folder structure into features/ + shared/ for enterprise organization
- [x] R26: Wishlist search input (filter saved items)
- [x] R26.1: Wishlist search integration (mobile search targets wishlist on /wishlist; desktop wishlist search bar)
- [x] R27: Wishlist list deletion (delete list button + confirm)
- [NEXT] 🔵 R27.1: Manage/view lists entry in save menu (opens list manager modal)



## Deployment
- [ ] D1: Hosting + build pipeline (Vercel or equivalent)
- [ ] D2: Environment config (SITE_URL, API keys, affiliate IDs)
- [ ] D3: Custom domain + SSL
- [ ] D4: Production data source (switch JSON → SQL/API)
- [ ] D5: Monitoring + error reporting (Sentry or similar)
- [ ] D6: Restore modal routing (intercepting routes) after moving off GitHub Pages
- [ ] D7: Launch cleanup - remove local auth fallback account/session store and require backend auth endpoints in production.

## Quickfixes
- [x] Q1: Mobile feed card save star pinned to bottom-left corner
- [x] Q2: Wishlist cards reduced in compact size to remove excess empty space
- [x] Q3: Feed column animation pauses while wishlist list dropdown is open (resumes on close)
- [x] Q4: Quick speed toggle set slightly faster
- [x] Q5: Wishlist mobile cards place save button inline with price row for denser layout
- [x] Q6: Refactor hardening pass (mobile overlay state cleanup + lint warnings removed)
- [x] Q7: Account settings now control cozy/quick feed speed multipliers used by the home speed toggle
- [x] Q8: Remove placeholder/fake notifications after notifications are gated behind login (no fake items; show empty state until backend is live)
- [x] Q9: Keep wishlist "Removed from {list} / click to undo" ghost card locked to standard wishlist card dimensions so row height/width never expands.
- [x] Q10: Gate product comment posting behind auth session stub (logged-out users can still view comments).
- [x] Q11: Product-detail desktop thumbnail rail uses arrow-only navigation (manual scroll disabled; mobile swipe preserved).
- [x] Q12: Disable wishlist long-press menu opening on desktop (and keep it disabled on mobile); menu opens via supported click/double-click flows only.
- [x] Q13: Coalesce rapid wishlist sync events into short-batch SQL sync requests (500ms window) to reduce request volume.
- [x] Q14: Award window points for successful deal submissions (local-first + SQL mode), so contribution actions feed future lottery/gacha rewards.

## Notes
- Positioning (later): "Yelp for products" across retailers (cross-site reviews + community trust layer)
- Positioning: "Pinterest-like saves" (a cozy place to collect finds for later; saving does not require buying today)
- Positioning: "Target vs Walmart" (pleasant, curated, trust-first shopping; deals are additive, not the whole identity; woman-leaning tone)
- Branding target: "Window Shoppr" (finalized)
- CSS approach: BEM naming with vanilla CSS (no framework)
- Frontend: Next.js + TypeScript (App Router)
- Data source: JSON with local images (SQL stubs for later)
