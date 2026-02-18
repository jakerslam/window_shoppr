-- 001_seed_base_data.sql
-- Purpose: deterministic baseline rows for local/staging smoke verification.

INSERT INTO products (
  id,
  slug,
  name,
  category,
  sub_category,
  retailer,
  price,
  original_price,
  rating,
  rating_count,
  description,
  affiliate_url,
  publish_state,
  created_at,
  updated_at
)
VALUES
  (
    'prod-seed-001',
    'seed-cozy-cloud-throw-blanket',
    'Seed Cozy Cloud Throw Blanket',
    'Home & Kitchen',
    'Bedding',
    'Amazon',
    39.99,
    59.99,
    4.7,
    1842,
    'Deterministic seed product used for migration and integration smoke checks.',
    'https://example.com/affiliate/seed-blanket',
    'published',
    '2026-01-01T00:00:00.000Z',
    '2026-01-01T00:00:00.000Z'
  )
ON CONFLICT(id) DO UPDATE SET
  slug = excluded.slug,
  name = excluded.name,
  category = excluded.category,
  sub_category = excluded.sub_category,
  retailer = excluded.retailer,
  price = excluded.price,
  original_price = excluded.original_price,
  rating = excluded.rating,
  rating_count = excluded.rating_count,
  description = excluded.description,
  affiliate_url = excluded.affiliate_url,
  publish_state = excluded.publish_state,
  updated_at = excluded.updated_at;

INSERT INTO wishlists (id, owner_id, name, created_at, updated_at)
VALUES (
  'wl-seed-default',
  NULL,
  'Wishlist',
  '2026-01-01T00:00:00.000Z',
  '2026-01-01T00:00:00.000Z'
)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  updated_at = excluded.updated_at;

INSERT INTO wishlist_items (id, wishlist_id, product_id, created_at)
VALUES (
  'wli-seed-001',
  'wl-seed-default',
  'prod-seed-001',
  '2026-01-01T00:00:00.000Z'
)
ON CONFLICT(wishlist_id, product_id) DO NOTHING;
