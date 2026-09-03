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
-- `locked_reason` (Phase 4, FR-12 thread scope) apply only to top-level rows
-- (parent_comment_id IS NULL) — a reply row's own locked flag is unused.
-- NOTE for anyone applying this file against an already-created local/dev D1
-- instance from Phase 1-3: CREATE TABLE IF NOT EXISTS won't retroactively add
-- these two columns to an existing `comments` table — run
--   ALTER TABLE comments ADD COLUMN locked INTEGER NOT NULL DEFAULT 0;
--   ALTER TABLE comments ADD COLUMN locked_reason TEXT;
-- first, or drop/recreate the local D1 state.
CREATE TABLE IF NOT EXISTS comments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  content_id        TEXT    NOT NULL,
  parent_comment_id INTEGER REFERENCES comments(id),
  author_name       TEXT,
  body              TEXT    NOT NULL,
  status            TEXT    NOT NULL CHECK (status IN ('visible', 'pending', 'hidden')),
  ip_hash           TEXT    NOT NULL,
  owner_token       TEXT    NOT NULL,
  locked            INTEGER NOT NULL DEFAULT 0,
  locked_reason     TEXT,
  created_at        TEXT    NOT NULL
);

-- Serves both GET /api/comment's per-content lookup and its oldest-first sort.
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id, created_at);

-- Serves the reply-existence check in POST/DELETE (parent validation, leaf-vs-tombstone)
-- so it stays an index lookup instead of a full table scan as comments grow.
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON comments(parent_comment_id);

-- IDEA-0009 Phase 4 -- FR-12 page-scope locks. content_id, not any single comment, is
-- the real subject of a page-scope lock, so it can't live as a column on `comments`
-- the way thread-scope locks do -- content_id alone is the key, one row per locked
-- page. (The Worker endpoint currently resolves content_id from an existing comment
-- id, so locking a page before any comment exists under it isn't supported yet --
-- see the comment above handleCommentLock's page-scope branch in subscribe.ts.)
CREATE TABLE IF NOT EXISTS locked_pages (
  content_id TEXT PRIMARY KEY,
  reason     TEXT,
  created_at TEXT NOT NULL
);

-- IDEA-0009 Phase 4 — append-only moderation audit trail (NFR-11). Rows persist
-- even after the target comment is later deleted/tombstoned via FR-11 — the
-- audit trail intentionally outlives the comment, so target_comment_id is not
-- a foreign-key-enforced constraint.
CREATE TABLE IF NOT EXISTS moderation_log (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  action            TEXT    NOT NULL CHECK (action IN ('hide', 'unhide', 'lock', 'unlock')),
  target_comment_id INTEGER,
  target_content_id TEXT,
  actor             TEXT    NOT NULL,
  reason            TEXT,
  created_at        TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_moderation_log_target_content_id ON moderation_log(target_content_id);
