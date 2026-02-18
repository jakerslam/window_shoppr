-- 002_agent_queue_schema.sql rollback
-- Purpose: remove agent queue persistence introduced by migration 002.

DROP TABLE IF EXISTS moderation_reviews;
DROP TABLE IF EXISTS agent_queue_events;
