-- 003_backend_entities.sql rollback
-- Purpose: rollback backend entity tables introduced for Data API and Auth API.

DROP TABLE IF EXISTS auth_sessions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS auth_audit_log;
DROP TABLE IF EXISTS purchase_intents;
DROP TABLE IF EXISTS email_captures;
DROP TABLE IF EXISTS blog_articles;
DROP TABLE IF EXISTS product_extras;

