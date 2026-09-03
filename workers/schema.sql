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

-- IDEA-0009 Phase 1 — anonymous, non-GitHub comment/feedback layer (backend
-- foundation; ships with COMMENTS_ENABLED=false, no UI wired yet).
-- parent_comment_id enables one-level-deep replies (Phase 3). `locked`/
-- `locked_reason` columns and the `moderation_log` table are deliberately not
-- added until Phase 4, when admin lock/hide actions actually ship.
CREATE TABLE IF NOT EXISTS comments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id        TEXT    NOT NULL,
  parent_comment_id INTEGER REFERENCES comments(id),
  author_name       TEXT,
  body              TEXT    NOT NULL,
  status            TEXT    NOT NULL CHECK (status IN ('visible', 'pending', 'hidden')),
  ip_hash           TEXT    NOT NULL,
  owner_token       TEXT    NOT NULL,
  created_at        TEXT    NOT NULL
);

-- Serves both GET /api/comment's per-content lookup and its oldest-first sort.
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id, created_at);
