-- 003_backend_entities.sql
-- Purpose: extend SQL schema to support the runtime Data API and Auth API services.

CREATE TABLE IF NOT EXISTS product_extras (
  product_id TEXT PRIMARY KEY,
  images_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT,
  video_url TEXT,
  deal_ends_at TEXT,
  save_count INTEGER,
  blog_slug TEXT,
  blog_id TEXT,
  affiliate_verification_json TEXT,
  ad_creative_json TEXT,
  is_sponsored INTEGER,
  source TEXT,
  external_id TEXT,
  last_seen_at TEXT,
  last_price_check_at TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_extras_blog_slug ON product_extras(blog_slug);

CREATE TABLE IF NOT EXISTS blog_articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  published_at TEXT NOT NULL,
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  layout_variant TEXT NOT NULL,
  sections_json TEXT NOT NULL DEFAULT '[]',
  affiliate_links_json TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_articles_published_at ON blog_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_articles_status ON blog_articles(status);

CREATE TABLE IF NOT EXISTS email_captures (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT NOT NULL,
  submitted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_email_captures_email ON email_captures(email);

CREATE TABLE IF NOT EXISTS purchase_intents (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_slug TEXT NOT NULL,
  intent TEXT NOT NULL,
  answered_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_purchase_intents_product_id ON purchase_intents(product_id);

CREATE TABLE IF NOT EXISTS auth_audit_log (
  id TEXT PRIMARY KEY,
  at TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  actor_roles_json TEXT NOT NULL DEFAULT '[]',
  actor_email TEXT,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_action ON auth_audit_log(action);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  email TEXT,
  password_hash TEXT,
  display_name TEXT,
  marketing_emails INTEGER NOT NULL DEFAULT 0,
  roles_json TEXT NOT NULL DEFAULT '["user"]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (provider, email)
);

CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_account_id ON auth_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

