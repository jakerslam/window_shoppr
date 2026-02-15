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

## Planned API Surface (Backend Target)
- `POST /api/agent/products/upsert`
- `POST /api/agent/products/publish`
- `POST /api/agent/products/unpublish`
- `GET /api/agent/moderation/pending`
- `POST /api/agent/moderation/resolve`

## Reference Files
- Product types: `src/shared/lib/catalog/types.ts`
- Product schema: `src/shared/lib/catalog/schema.ts`
- Catalog loader stubs: `src/shared/lib/catalog/data.ts`
- Moderation queue stubs: `src/shared/lib/engagement/reports.ts`
