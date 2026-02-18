-- 002_agent_queue_schema.sql
-- Purpose: add durable agent queue and moderation audit records.

CREATE TABLE IF NOT EXISTS agent_queue_events (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (action, idempotency_key)
);

CREATE TABLE IF NOT EXISTS moderation_reviews (
  id TEXT PRIMARY KEY,
  queue_item_id TEXT NOT NULL,
  status TEXT NOT NULL,
  review_notes TEXT,
  reviewer_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_agent_queue_status ON agent_queue_events(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_item ON moderation_reviews(queue_item_id);
