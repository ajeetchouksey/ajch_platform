-- aarya-analytics D1 schema
-- Daily GA4 overview snapshots, persisted independent of GA4's own retention
-- window and live-query limits. One row per day, upserted (not appended) —
-- see snapshotDailyOverview() in workers/ga4-proxy.ts.
-- Apply: wrangler d1 execute aarya-analytics --file=workers/schema-analytics.sql [--local | --remote]

CREATE TABLE IF NOT EXISTS daily_overview (
  date              TEXT PRIMARY KEY,   -- YYYY-MM-DD
  sessions          INTEGER NOT NULL,
  users             INTEGER NOT NULL,
  pageviews         INTEGER NOT NULL,
  engagement_rate   REAL NOT NULL,
  avg_duration_secs REAL NOT NULL,
  bounce_rate       REAL NOT NULL,
  updated_at        TEXT NOT NULL       -- ISO timestamp of last snapshot/upsert
);
