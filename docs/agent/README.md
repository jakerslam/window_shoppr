# Window Shoppr Agent Integration

This guide explains how to connect an agent to Window Shoppr for ingestion and moderation.

## Current State (no backend yet)
- There are **no live API endpoints** yet.
- The source of truth is the local JSON catalog: `src/data/products.json`.
- Use the draft contract below to prepare for the ingestion API.

## Planned API Contract (stub)
### Endpoints (not implemented yet)
- `POST /api/agent/products/upsert`
- `POST /api/agent/products/publish`
- `POST /api/agent/products/unpublish`
- `POST /api/agent/reports/resolve`

### Minimal Upsert Payload
```json
{
  "source": "tiktok",
  "externalId": "abc123",
  "name": "Cozy Cloud Throw Blanket",
  "affiliateUrl": "https://...",
  "price": 39.99,
  "category": "Home & Kitchen",
  "subCategory": "Bedding",
  "images": ["https://..."],
  "description": "...",
  "tags": ["cozy", "blanket", "bedding"]
}
```

### Idempotency
- Key: `source + externalId`
- Fallback: `id` if externalId is missing

## Local‑First Workflow (today)
If you want the agent to populate the catalog now:
1. Append or update items in `src/data/products.json`.
2. Ensure each product has a stable `id` and `slug`.
3. Use `source`, `externalId`, `lastSeenAt`, and `lastPriceCheckAt` if available.
4. Commit changes so the site reflects updates.

## Moderation Queue (stub)
- User reports are stored in `localStorage` under `window_shoppr_reports`.
- A browser event is broadcast: `report:submit` with the report payload.
- Agents should ingest these into a review queue once the API is built.

## Analytics Hooks (stub)
- Affiliate click events are stored in `localStorage` as `window_shoppr_affiliate_clicks`.
- Event: `affiliate:click` with `{ productId, productSlug, retailer, affiliateUrl, timestamp }`.

## References
- Agent skill doc: `docs/agent/AGENT_SKILL.md`
- Category config: `src/shared/lib/categories.ts`
- Product types: `src/shared/lib/types.ts`
- Data loader: `src/shared/lib/data.ts`
