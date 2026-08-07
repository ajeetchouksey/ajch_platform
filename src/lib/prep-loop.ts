// ── Prep Loop Session Manager ─────────────────────────────────────────────────
// Manages Loop 1 (knowledge check) and Loop 2 (reasoning validation) sessions.
// localStorage key: aarya_preploop_{examId}

import type { PrepLoop, QuestionAttempt, ReadinessReport } from '@/types/content';
import { isValidExamId } from '@/lib/plan-generator';

// ── Storage ────────────────────────────────────────────────────────────────────

function loopKey(examId: string): string {
  return `aarya_preploop_${examId}`;
}

export function getActivePrepLoop(examId: string): PrepLoop | null {
  if (!isValidExamId(examId)) return null;
  try {
    const raw = localStorage.getItem(loopKey(examId));
    if (!raw) return null;
    const loop = JSON.parse(raw) as PrepLoop;
    return loop.completed ? null : loop;
  } catch {
    return null;
  }
}

export function savePrepLoop(loop: PrepLoop): void {
  if (!isValidExamId(loop.examId)) return;
  loop.lastActiveAt = new Date().toISOString();
  localStorage.setItem(loopKey(loop.examId), JSON.stringify(loop));
}

/** Return all prep loops across every exam (for gist-sync). */
export function getAllPrepLoops(): Record<string, PrepLoop> {
  const result: Record<string, PrepLoop> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('aarya_preploop_')) {
      const examId = key.slice('aarya_preploop_'.length);
      try { result[examId] = JSON.parse(localStorage.getItem(key) ?? '') as PrepLoop; }
      catch { /* skip corrupt entry */ }
    }
  }
  return result;
}

export function deletePrepLoop(examId: string): void {
  if (!isValidExamId(examId)) return;
  localStorage.removeItem(loopKey(examId));
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────

/** Start a fresh prep loop, replacing any existing incomplete session. */
export function startPrepLoop(examId: string, targetDate: string, loop: 1 | 2): PrepLoop {
  const now = new Date().toISOString();
  const session: PrepLoop = {
    id: `${examId}-loop${loop}-${Date.now()}`,
    examId,
    startedAt: now,
    lastActiveAt: now,
    targetDate,
    loop,
    attempts: [],
    report: null,
    completed: false,
  };
  savePrepLoop(session);
  return session;
}

/** Append an attempt to the active loop session. Returns the updated loop. */
export function recordAttempt(examId: string, attempt: QuestionAttempt): PrepLoop | null {
  if (!isValidExamId(examId)) return null;
  const loop = getActivePrepLoop(examId);
  if (!loop) return null;
  loop.attempts.push(attempt);
  savePrepLoop(loop);
  return loop;
}

/** Attach the final ReadinessReport and mark the loop as complete. */
export function completePrepLoop(
  examId: string,
  report: ReadinessReport,
  aiValidation?: string,
): PrepLoop | null {
  if (!isValidExamId(examId)) return null;
  try {
    const raw = localStorage.getItem(loopKey(examId));
    if (!raw) return null;
    const loop = JSON.parse(raw) as PrepLoop;
    loop.report = report;
    loop.completed = true;
    if (aiValidation) loop.aiValidation = aiValidation;
    loop.lastActiveAt = new Date().toISOString();
    localStorage.setItem(loopKey(loop.examId), JSON.stringify(loop));
    return loop;
  } catch {
    return null;
  }
}

// ── Loop 2 readiness gate ──────────────────────────────────────────────────────

/** Minimum Loop 1 score to unlock Loop 2 (matching typical exam pass threshold). */
const LOOP2_THRESHOLD = 65;

/**
 * Returns true when the student is ready to move from Loop 1 → Loop 2.
 * Requires a completed Loop 1 session with overallScore ≥ threshold.
 */
export function isReadyForLoop2(examId: string): boolean {
  if (!isValidExamId(examId)) return false;
  try {
    const raw = localStorage.getItem(loopKey(examId));
    if (!raw) return false;
    const loop = JSON.parse(raw) as PrepLoop;
    return (
      loop.completed &&
      loop.loop === 1 &&
      (loop.report?.overallScore ?? 0) >= LOOP2_THRESHOLD
    );
  } catch {
    return false;
  }
}

/** Load the most recent completed loop for an exam (for reporting). */
export function getCompletedLoop(examId: string): PrepLoop | null {
  if (!isValidExamId(examId)) return null;
  try {
    const raw = localStorage.getItem(loopKey(examId));
    if (!raw) return null;
    const loop = JSON.parse(raw) as PrepLoop;
    return loop.completed ? loop : null;
  } catch {
    return null;
  }
}
