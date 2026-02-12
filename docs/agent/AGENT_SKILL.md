# Window Shoppr Agent Skill

This document defines the planned API contract for agent-driven ingestion and moderation.

## Ingestion Actions
- Upsert product by `source + externalId`
- Update price + deal metadata
- Refresh images/video
- Regenerate description/tags
- Publish/unpublish listings

## Minimal Payload (draft)
```json
{
  "source": "tiktok",
  "externalId": "abc123",
  "name": "Cozy Cloud Throw Blanket",
  "affiliateUrl": "https://...",
  "price": 39.99,
  "category": "Home & Kitchen",
  "subCategory": "Bedding"
}
```

## Moderation Queue
- Reports submitted by users emit a `report:submit` browser event and are stored in localStorage.
- Agents should ingest these into a review queue and resolve by updating the product or hiding it.

## Idempotency
- Use `source + externalId` as the idempotency key.
- If missing, fall back to product `id`.

## Planned Endpoints (placeholder)
- `POST /api/agent/products/upsert`
- `POST /api/agent/reports/resolve`
- `POST /api/agent/products/publish`
- `POST /api/agent/products/unpublish`

Note: These endpoints are not implemented yet.
