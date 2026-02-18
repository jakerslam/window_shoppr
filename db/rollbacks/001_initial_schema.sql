-- 001_initial_schema.sql rollback
-- Purpose: safely revert baseline tables created by migration 001.

DROP TABLE IF EXISTS wishlist_items;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS deal_submissions;
DROP TABLE IF EXISTS products;
