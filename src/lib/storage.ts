import type { QuizSession } from '../types/content';

const SESSIONS_KEY = 'aarya_quiz_sessions'; // RC-4: was 'cca_sessions' — now skill-agnostic

export function getSessions(): QuizSession[] {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) ?? '[]') as QuizSession[];
  } catch {
    return [];
  }
}

export function saveSession(session: QuizSession): void {
  const sessions = getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.push(session);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

/**
 * On successful GitHub login, tag all anonymous sessions with the user's ID.
 * This promotes local-only sessions to "owned" sessions visible in the readiness panel.
 */
export function mergeAnonymousProgress(userId: string): void {
  const sessions = getSessions();
  const updated = sessions.map((s) =>
    s.userId ? s : { ...s, userId }
  );
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
}

export function getScoreByDomain(examId: string): Record<number, { correct: number; total: number }> {
  const sessions = getSessions().filter((s) => s.finishedAt && s.skillId === examId);
  const result: Record<number, { correct: number; total: number }> = {};
  for (const s of sessions) {
    if (s.domainFilter !== null) {
      if (!result[s.domainFilter]) result[s.domainFilter] = { correct: 0, total: 0 };
      result[s.domainFilter].correct += s.score;
      result[s.domainFilter].total += s.total;
    }
  }
  return result;
}

/** Replace the entire sessions array (used when pulling from Gist sync). */
export function saveSessions(sessions: QuizSession[]): void {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

export function clearSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}

// ── Notes "last seen" tracking ─────────────────────────────────────────────
// Key: aarya_notes_seen  Value: Record<"examId:domainId", ISO8601>
const NOTES_SEEN_KEY = 'aarya_notes_seen';

export function getNotesSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(NOTES_SEEN_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

/** Mark a domain's notes as seen right now. */
export function markNotesSeen(examId: string, domainId: number): void {
  const seen = getNotesSeen();
  seen[`${examId}:${domainId}`] = new Date().toISOString();
  localStorage.setItem(NOTES_SEEN_KEY, JSON.stringify(seen));
}

/** Return ISO timestamp when notes for this domain were last seen, or null. */
export function getNotesSeenAt(examId: string, domainId: number): string | null {
  return getNotesSeen()[`${examId}:${domainId}`] ?? null;
}

/** Replace the entire notes-seen map (used when pulling from Gist sync). */
export function setNotesSeen(data: Record<string, string>): void {
  localStorage.setItem(NOTES_SEEN_KEY, JSON.stringify(data));
}

// ── Cross-account isolation ───────────────────────────────────────────────────
// localStorage is shared by whichever account happens to be signed in on this
// browser — it isn't scoped per-user on its own. useProgressSync calls this
// when it detects the signed-in identity changed from the last one it saw, so
// a previous account's plans/scores/streaks don't leak into the next login.
// Exact/prefix keys mirror exactly what gist-sync.ts and profile-sync.ts treat
// as "this user's progress" (sessions, notes, study plans, adaptive attempts,
// prep loops, exam stats, the aggregated legacy blob) — deliberately excludes
// UI-only preferences (preferred AI tool, focus timer, cached AI chat answers)
// since those aren't privacy-sensitive per-account data.
const PROGRESS_KEY_PREFIXES = ['study_plan_', 'study_daily_mins_', 'aarya_attempts_', 'aarya_preploop_'];
const PROGRESS_EXACT_KEYS = [SESSIONS_KEY, NOTES_SEEN_KEY, 'aarya_progress', 'ccaf_progress', 'aarya_exam_stats'];

export function clearAllProgressData(): void {
  const toRemove: string[] = [...PROGRESS_EXACT_KEYS];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && PROGRESS_KEY_PREFIXES.some((prefix) => key.startsWith(prefix))) {
      toRemove.push(key);
    }
  }
  toRemove.forEach((key) => localStorage.removeItem(key));
}

