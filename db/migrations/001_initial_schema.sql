-- 001_initial_schema.sql
-- Purpose: baseline relational schema for products, submissions, and engagement entities.

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  retailer TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  rating NUMERIC,
  rating_count INTEGER,
  description TEXT NOT NULL,
  affiliate_url TEXT NOT NULL,
  publish_state TEXT NOT NULL DEFAULT 'published',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS deal_submissions (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  sale_price NUMERIC,
  list_price NUMERIC,
  coupon_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'user_submission',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wishlists (
  id TEXT PRIMARY KEY,
  owner_id TEXT,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  wishlist_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (wishlist_id, product_id),
  FOREIGN KEY (wishlist_id) REFERENCES wishlists(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_products_category_sub ON products(category, sub_category);
CREATE INDEX IF NOT EXISTS idx_products_publish_state ON products(publish_state);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON deal_submissions(status);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);
