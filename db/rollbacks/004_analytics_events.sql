-- 004_analytics_events.sql rollback
-- Purpose: remove analytics event storage introduced by migration 004.

DROP TABLE IF EXISTS analytics_events;

