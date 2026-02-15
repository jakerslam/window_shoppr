# Window Shoppr Agent Integration

This guide defines where agent automation should read/write today and where it will connect once backend APIs are live.

## Canonical Skill Contract
- Primary: `docs/agent/SKILL.md`
- Compatibility alias: `docs/agent/AGENT_SKILL.md`

## Current Runtime Mode
- Backend agent endpoints are not live yet.
- Product source of truth is `src/data/products.json`.
- Moderation queue is local-first via `localStorage`.

## Ingestion (Today)
1. Read existing products from `src/data/products.json`.
2. Upsert by `source + externalId` (fallback to `slug`).
3. Validate against `ProductSchema` in `src/shared/lib/catalog/schema.ts`.
4. Keep `id`, `slug`, `source`, and `externalId` stable.
5. Update `lastSeenAt` and `lastPriceCheckAt` on refresh jobs.
6. Use stub queue helpers in `src/shared/lib/agent/ingestion.ts` (`queueAgentProductUpsert`, `queueAgentPublishMutation`, `readAgentStubQueues`) until backend endpoints are wired.

## Link Submissions (Deals/New Products)
- Product/link submission UX is tracked in `SRS R29.5`.
- Submission flow target:
  1. User submits link (+ optional price/category/notes).
  2. Agent intake validates + deduplicates URL.
  3. Queue item enters moderation (`pending` -> `approved`/`rejected`).
  4. Approved submissions are enriched into draft product payloads and sent through product upsert.
- Canonical contract: `docs/agent/SKILL.md` ("Link Submission Contract").

## Moderation (Today)
- Queue helpers in `src/shared/lib/engagement/reports.ts`:
  - `buildModerationQueueSnapshot()`
  - `getPendingModerationQueue()`
  - `updateModerationQueueItem(...)`
- Queue storage key: `window_shoppr_report_queue`
- Raw report storage key: `window_shoppr_reports`
- Event hooks:
  - `report:submit`
  - `moderation:queue:enqueue`
  - `moderation:queue:update`

## Wishlist Sync (Today)
- Guest wishlist data remains local-first in `windowShopprWishlistLists`.
- Sync metadata queue for future account merge is stored in `windowShopprWishlistSyncState`.
- Sync request event: `wishlist:sync:request` with a payload containing guest id, account id (if present), normalized lists, and pending operations.

## Planned API Surface (Backend Target)
- `POST /api/agent/products/upsert`
- `POST /api/agent/products/publish`
- `POST /api/agent/products/unpublish`
- `GET /api/agent/moderation/pending`
- `POST /api/agent/moderation/resolve`
- `POST /api/agent/submissions/link`
- `GET /api/agent/submissions/pending`
- `POST /api/agent/submissions/resolve`

## SQL Data API Surface (Frontend Wiring)
- `GET /data/products` (catalog listing for SQL mode)
- `GET /data/products/:slug` (single product lookup for SQL mode)
- `POST /data/wishlist/sync` (guest/account wishlist merge + ack pending ops)
- `POST /data/email-captures` (email list capture persistence)
- `POST /data/purchase-intents` (post-affiliate conversion responses + review reminder hook)

## Auth Surface (Account Wiring)
- Frontend account wiring now expects:
  - `POST /auth/login`
  - `POST /auth/signup`
  - `POST /auth/social`
  - `PATCH /auth/account`
  - `POST /auth/logout`
- Config key: `NEXT_PUBLIC_AUTH_API_URL`
- Local fallback auth mode exists for static hosting and must be removed before production launch (`SRS D7`).

## Reference Files
- Agent ingestion stubs: `src/shared/lib/agent/ingestion.ts`
- Agent ingestion schemas: `src/shared/lib/agent/ingestion-schema.ts`
- Product types: `src/shared/lib/catalog/types.ts`
- Product schema: `src/shared/lib/catalog/schema.ts`
- Catalog loader stubs: `src/shared/lib/catalog/data.ts`
- Moderation queue stubs: `src/shared/lib/engagement/reports.ts`
