# Window Shoppr Agent Skill

This skill defines the ingestion and moderation contract for autonomous agents.

## Scope
- Ingest products into the catalog with idempotent upserts.
- Publish/unpublish listings safely.
- Process user report moderation queue items.
- Process link submissions (deals/new products) into moderation + draft product pipeline.
- Keep operations compatible with the current local-first app mode.

## Runtime Mode (Current)
- No live backend endpoints are deployed yet.
- Source of truth remains `src/data/products.json`.
- Moderation queue is local-first in browser storage.
- API shapes below are finalizable contracts for the upcoming backend requirement (`R29`).
- Local API stubs are implemented in `src/shared/lib/agent/ingestion.ts`.

## Product Ingestion Contract

### Upsert Input (draft contract)
```json
{
  "source": "tiktok",
  "externalId": "post_12345",
  "slug": "cozy-cloud-throw-blanket",
  "name": "Cozy Cloud Throw Blanket",
  "category": "Home & Kitchen",
  "subCategory": "Bedding",
  "tags": ["cozy", "blanket", "home"],
  "price": 39.99,
  "originalPrice": 59.99,
  "rating": 4.6,
  "ratingCount": 842,
  "images": ["https://..."],
  "description": "SEO-friendly description",
  "affiliateUrl": "https://...",
  "retailer": "Amazon",
  "videoUrl": "https://...",
  "dealEndsAt": "2026-02-15T23:59:59Z",
  "isSponsored": false,
  "publishState": "published"
}
```

### Validation Rules
- Match `src/shared/lib/catalog/schema.ts` (`ProductSchema`).
- `slug` must be URL-safe kebab-case.
- `images` must contain at least one value.
- `originalPrice >= price` when `originalPrice` is present.
- `rating` must be `0..5` and `ratingCount` non-negative.

### Idempotency
- Primary key: `source + externalId`.
- Fallback key: `slug` (or `id` when present in internal jobs).
- Upsert must update in-place when key already exists.

### Metadata Expectations
- Populate `lastSeenAt` whenever re-discovered.
- Populate `lastPriceCheckAt` whenever price-related fields are refreshed.

## Moderation Contract

### Queue Source
- Raw report history key: `window_shoppr_reports`.
- Moderation queue key: `window_shoppr_report_queue`.
- Queue item shape is defined in `src/shared/lib/engagement/reports.ts` as `ModerationQueueItem`.

### Queue Status Lifecycle
- `pending` -> `triaged` -> `resolved` or `dismissed`.
- `reviewedBy`, `reviewNotes`, and `reviewedAt` should be set on non-pending states.

### Agent Actions
- Fetch pending queue: `buildModerationQueueSnapshot()` or future `GET /api/agent/moderation/pending`.
- Resolve item: `updateModerationQueueItem({ id, status, reviewedBy, reviewNotes })` or future API.
- Apply product fixes where needed (price, content, category, media, publish state).

## Planned API Endpoints (Backend Target)
- `POST /api/agent/products/upsert`
- `POST /api/agent/products/publish`
- `POST /api/agent/products/unpublish`
- `GET /api/agent/moderation/pending`
- `POST /api/agent/moderation/resolve`
- `POST /api/agent/submissions/link`
- `GET /api/agent/submissions/pending`
- `POST /api/agent/submissions/resolve`

### Planned Auth
- Header: `X-Agent-Key: <token>` (or bearer token once auth service is wired).
- All writes must be authenticated.

### Account/Auth Wiring Context
- Frontend account actions now call auth endpoints (API-first, local fallback for static mode):
  - `POST /auth/login`
  - `POST /auth/signup`
  - `POST /auth/social`
  - `PATCH /auth/account`
  - `POST /auth/logout`
- Runtime config key: `NEXT_PUBLIC_AUTH_API_URL`.
- Production target: remove local auth fallback and require backend auth (`SRS D7`).

## Link Submission Contract (Deals / New Products)

### Submission Input (draft contract)
```json
{
  "url": "https://example.com/product/123",
  "submitterId": "optional-user-id",
  "titleHint": "Optional user title",
  "priceHint": 39.99,
  "categoryHint": "Tech",
  "subCategoryHint": "Accessories",
  "notes": "Optional context from submitter",
  "source": "user_submission"
}
```

### Submission Processing Rules
- Validate URL format and reject non-http(s) links.
- Deduplicate by normalized URL hash before creating queue item.
- Enqueue as `pending` moderation item before product publish.
- Agent enrichment step should:
  - fetch/derive retailer, media, and canonical title,
  - generate SEO description + tags,
  - map category/subcategory,
  - create a draft product payload for `products/upsert`.
- Publish only after moderation outcome is `approved`.

### Submission Status Lifecycle
- `pending` -> `triaged` -> `approved` or `rejected`
- Optional `needs_info` for incomplete submissions.
- Resolution should include `reviewedBy`, `reviewNotes`, `reviewedAt`.

## Event Hooks
- `report:submit` (new user report)
- `moderation:queue:enqueue` (new moderation item)
- `moderation:queue:update` (item status changed)
- `affiliate:click` (attribution/analytics signal)
- `purchase:followup:update` (post-click conversion prompt queue updated)
- `social-proof:save-counts` (save-count map updated after wishlist state transitions)
- `agent:product:upsert` (agent upsert queued)
- `agent:product:publish` (publish-state mutation queued)
- `agent:moderation:resolve` (moderation resolution queued)
- `submission:link:created` (new link submission queued)
- `submission:link:resolved` (submission moderation status updated)

## Local-First Operation Steps (Today)
1. Read/modify `src/data/products.json` with schema-valid products.
2. Preserve stable `id`, `slug`, `source`, and `externalId`.
3. For moderation, consume queue items from local storage snapshot and track resolution notes.
4. Commit catalog changes and deploy.

## Output Requirements For Agent Runs
- Return counts: `{ upserted, updated, published, unpublished, moderated }`.
- Return failures with explicit keys and reason (validation, duplicate conflict, missing media, bad URL).
- Never drop records silently; record skip reason for each rejected item.
