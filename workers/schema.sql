-- aarya-subscribers D1 schema
-- Replaces the GitHub-Gist read-modify-write subscriber store in workers/subscribe.ts.
-- Apply: wrangler d1 execute aarya-subscribers --file=workers/schema.sql [--local | --remote]

CREATE TABLE IF NOT EXISTS subscribers (
  type          TEXT    NOT NULL CHECK (type IN ('email', 'github')),
  value         TEXT    NOT NULL,
  subscribed_at TEXT    NOT NULL,
  PRIMARY KEY (type, value)
);

-- Cross-device progress store for Google/Microsoft logins (GitHub logins sync via a
-- private Gist instead — see gist-sync.ts — so they never appear in this table).
-- `progress` holds the same JSON payload shape gist-sync.ts writes to the Gist.
CREATE TABLE IF NOT EXISTS user_profiles (
  provider     TEXT    NOT NULL CHECK (provider IN ('google', 'microsoft')),
  provider_id  TEXT    NOT NULL,
  progress     TEXT    NOT NULL,
  updated_at   TEXT    NOT NULL,
  PRIMARY KEY (provider, provider_id)
);
