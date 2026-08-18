-- aarya-subscribers D1 schema
-- Replaces the GitHub-Gist read-modify-write subscriber store in workers/subscribe.ts.
-- Apply: wrangler d1 execute aarya-subscribers --file=workers/schema.sql [--local | --remote]

CREATE TABLE IF NOT EXISTS subscribers (
  type          TEXT    NOT NULL CHECK (type IN ('email', 'github')),
  value         TEXT    NOT NULL,
  subscribed_at TEXT    NOT NULL,
  PRIMARY KEY (type, value)
);
