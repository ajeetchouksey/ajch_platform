// ── Progress Schema v2 ────────────────────────────────────────────────────
// Replaces the ad-hoc ProgressData shape in gist-sync.ts.
// Pure TypeScript — no DOM, no React, no external deps.
// ──────────────────────────────────────────────────────────────────────────

export type ISO8601 = string; // e.g. "2026-06-02T10:00:00.000Z"

// ── Session (one quiz attempt) ─────────────────────────────────────────────
export interface Session {
  id: string;          // uuid or timestamp-based
  examId: string;      // e.g. "cca-f"
  domain: number | null; // null = mixed/full exam
  startedAt: ISO8601;
  finishedAt: ISO8601 | null;
  score: number;       // correct answers
  total: number;       // questions attempted
}

// ── Streak tracking ────────────────────────────────────────────────────────
export interface StreakRecord {
  currentStreak: number;  // consecutive days with at least one quiz
  longestStreak: number;
  lastActivityDate: ISO8601 | null; // date-only string "YYYY-MM-DD"
}

// ── V1 — legacy shape from gist-sync.ts ───────────────────────────────────
export interface ProgressV1 {
  quizHistory: Array<{
    date: string;
    domain: string;
    score: number;
    total: number;
  }>;
  domainProgress: Record<string, { correct: number; total: number }>;
  lastSync: string;
}

// ── V2 — canonical schema ──────────────────────────────────────────────────
export interface ProgressV2 {
  schemaVersion: 2;
  sessions: Session[];
  streaks: StreakRecord;
  bookmarks: string[];                    // content IDs e.g. "blog/my-post"
  lastSeen: Record<string, ISO8601>;      // contentId → last viewed timestamp
  lastSync: ISO8601;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function createEmptyProgress(): ProgressV2 {
  return {
    schemaVersion: 2,
    sessions: [],
    streaks: {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
    },
    bookmarks: [],
    lastSeen: {},
    lastSync: new Date().toISOString(),
  };
}

function isProgressV2(raw: unknown): raw is ProgressV2 {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    (raw as Record<string, unknown>)['schemaVersion'] === 2
  );
}

function isProgressV1(raw: unknown): raw is ProgressV1 {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    'quizHistory' in (raw as object) &&
    'domainProgress' in (raw as object)
  );
}

/**
 * Migrate any stored data (null | V1 | V2 | unknown) to ProgressV2.
 * Idempotent — calling it on a V2 value returns the same value unchanged.
 */
export function migrateProgressData(raw: unknown): ProgressV2 {
  if (raw === null || raw === undefined) {
    return createEmptyProgress();
  }

  // Already V2 — return as-is (idempotent)
  if (isProgressV2(raw)) {
    return raw;
  }

  // V1 — lift quizHistory into Session[]
  if (isProgressV1(raw)) {
    const sessions: Session[] = raw.quizHistory.map((h, idx) => ({
      id: `migrated-${idx}`,
      examId: 'cca-f',
      domain: h.domain ? Number(h.domain) || null : null,
      startedAt: h.date,
      finishedAt: h.date,
      score: h.score,
      total: h.total,
    }));

    return {
      schemaVersion: 2,
      sessions,
      streaks: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: sessions.at(-1)?.finishedAt?.slice(0, 10) ?? null,
      },
      bookmarks: [],
      lastSeen: {},
      lastSync: raw.lastSync ?? new Date().toISOString(),
    };
  }

  // Unknown / corrupt — start fresh
  return createEmptyProgress();
}
