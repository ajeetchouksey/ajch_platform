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

export function getScoreByDomain(): Record<number, { correct: number; total: number }> {
  const sessions = getSessions().filter((s) => s.finishedAt);
  const result: Record<number, { correct: number; total: number }> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
    4: { correct: 0, total: 0 },
    5: { correct: 0, total: 0 },
  };
  // Sessions store aggregate only; domain-level breakdown requires per-answer data
  // stored in the session's domainFilter when a single-domain quiz is run
  for (const s of sessions) {
    if (s.domainFilter !== null) {
      const d = result[s.domainFilter];
      if (d) {
        d.correct += s.score;
        d.total += s.total;
      }
    }
  }
  return result;
}

export function clearSessions(): void {
  localStorage.removeItem(SESSIONS_KEY);
}
