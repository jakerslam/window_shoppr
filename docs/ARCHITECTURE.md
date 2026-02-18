# Window Shoppr Architecture

## Scope
This document describes the current production-oriented architecture for the Window Shoppr codebase, including folder boundaries, data flow, runtime constraints, and backend integration seams.

## Runtime Model
- Framework: Next.js App Router + TypeScript (`strict`)
- Hosting target (current): static export (`output: "export"`) for GitHub Pages beta
- Rendering model: statically generated route shells with client-side interactivity
- Persistence model (current): local-first (`localStorage`) with SQL/API stubs behind `requestDataApi`

## High-Level Layers
- `src/app`: route entry points only (thin pages/layout)
- `src/features`: domain features and UI orchestration
- `src/shared/components`: reusable UI primitives
- `src/shared/lib`: shared domain/services/utilities
- `src/data`: local seed/catalog content and config

## Feature Boundaries
### Feed and discovery
- Location: `src/features/home-feed/*`
- Responsibilities:
  - category/search/sort-driven product filtering
  - column deck assignment and finite-feed end-state behavior
  - speed preferences and mobile/desktop control integration

### Product detail
- Location: `src/features/product-detail/*`
- Responsibilities:
  - media gallery, metadata rendering, share/save/comment actions
  - auth-gated write actions (comments) while keeping read access public

### Wishlist
- Location: `src/features/wishlist/*`
- Responsibilities:
  - list management, save-state UX, undo/remove behavior
  - local-first persistence with backend sync stubs

### Top bar and navigation
- Location: `src/features/top-bar/*`
- Responsibilities:
  - desktop + mobile nav patterns
  - global search routing behavior
  - category and notification entry points

### Deal submission
- Location: `src/features/deal-submission/*`
- Responsibilities:
  - user submission UX + validation
  - moderation queue stubs + points award hooks

## Shared Domain Services
### Engagement domain
- Location: `src/shared/lib/engagement/*`
- Examples:
  - analytics events
  - comments/save counts
  - deal submissions and affiliate minting pipelines
  - window points and follow-up prompts

### Platform domain
- Location: `src/shared/lib/platform/*`
- Responsibilities:
  - environment normalization
  - feature flags
  - data API boundary (local-first fallback)

## Data Flow (Current)
1. Route pages load product data from local JSON.
2. Feature hooks derive UI state (filters, sort, preferences).
3. User actions write local-first state (`localStorage`) immediately.
4. The same actions attempt async persistence through `requestDataApi`.
5. If API is unavailable, UI stays functional in local mode.

## Affiliate Minting Pipeline
- Entry: deal submissions queue a mint job.
- Auto path: Amazon associate-tag mint is attempted when configured.
- Compliance guard: host validation + blocked signal host checks.
- Fallback: unresolved jobs remain `pending_agent` for agent processing.
- Auditability: queue items keep immutable audit trail events.
- Overrides: active affiliate URL replacements are stored per submission id.

## Routing and SEO Constraints
- Dynamic product/category pages are generated via `generateStaticParams`.
- Static-export constraints mean intercepting routes are disabled for beta.
- Product detail currently uses full route navigation instead of intercept modal routing.
- Canonicals/sitemap/robots/schema are provided from app metadata routes/components.

## Backend Integration Seams
The following seams are intentionally stable for SQL/API replacement:
- `requestDataApi(...)` call sites in engagement flows
- auth session read/write stubs in auth/profile flows
- queue snapshots for agent automation in `src/shared/lib/agent/*`

When backend is live, these seams should be replaced without rewriting feature-level UI logic.

## Quality and Change Rules
- Follow `docs/ENGINEERING_STANDARDS.md` for file-size and folder-size thresholds.
- Prefer splitting by concern (service/utils/constants/hooks/components) over monolithic files.
- Preserve local-first behavior unless requirement explicitly moves a flow to backend-required mode.
