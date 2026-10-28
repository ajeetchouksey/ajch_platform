// ── Objective mastery + flagged questions ─────────────────────────────────────
// Turns the per-question attempt log (adaptive-quiz.ts, aarya_attempts_{examId})
// into per-objective coverage/mastery for the exam map, and keeps a small
// per-exam list of questions the learner flagged for review.
// localStorage key for flags: aarya_flags_{examId}

import type { QuestionAttempt, TaskStatement, TaskStatementsFile } from '@/types/content';
import { isValidExamId } from '@/lib/plan-generator';

// ── Flags ─────────────────────────────────────────────────────────────────────

function flagsKey(examId: string): string {
  return `aarya_flags_${examId}`;
}

export function getFlagged(examId: string): string[] {
  if (!isValidExamId(examId)) return [];
  try {
    return JSON.parse(localStorage.getItem(flagsKey(examId)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

/** Toggle a flag; returns the new flagged state. */
export function toggleFlag(examId: string, questionId: string): boolean {
  if (!isValidExamId(examId)) return false;
  const flags = new Set(getFlagged(examId));
  const nowFlagged = !flags.has(questionId);
  if (nowFlagged) flags.add(questionId);
  else flags.delete(questionId);
  try { localStorage.setItem(flagsKey(examId), JSON.stringify([...flags])); }
  catch { /* storage unavailable — flag lasts for this view only */ }
  return nowFlagged;
}

// ── Attempt summaries ─────────────────────────────────────────────────────────

/** Most recent attempt per question — the learner's current state on each. */
export function latestAttemptByQuestion(attempts: QuestionAttempt[]): Map<string, QuestionAttempt> {
  const latest = new Map<string, QuestionAttempt>();
  for (const a of attempts) {
    const prev = latest.get(a.questionId);
    if (!prev || a.attemptedAt >= prev.attemptedAt) latest.set(a.questionId, a);
  }
  return latest;
}

/** Questions whose latest attempt was wrong, plus anything flagged. */
export function reviewQueueIds(examId: string, attempts: QuestionAttempt[]): string[] {
  const ids = new Set(getFlagged(examId));
  for (const [id, a] of latestAttemptByQuestion(attempts)) if (!a.correct) ids.add(id);
  return [...ids];
}

// ── Mastery ───────────────────────────────────────────────────────────────────

export type MasteryStatus = 'new' | 'weak' | 'building' | 'strong';

export interface ObjectiveMastery {
  task: TaskStatement;
  domainId: number;
  total: number;      // questions mapped to this objective
  attempted: number;  // distinct mapped questions answered at least once
  correct: number;    // distinct mapped questions whose latest attempt is correct
  coverage: number;   // attempted / total, 0–1
  accuracy: number;   // correct / attempted, 0–1
  mastery: number;    // accuracy × coverage — a few lucky answers can't read as mastered
  status: MasteryStatus;
}

export const STRONG_MASTERY = 0.7;

export function objectiveMastery(
  task: TaskStatement,
  domainId: number,
  latest: Map<string, QuestionAttempt>,
): ObjectiveMastery {
  const total = task.questionIds.length;
  let attempted = 0;
  let correct = 0;
  for (const id of task.questionIds) {
    const a = latest.get(id);
    if (!a) continue;
    attempted += 1;
    // A right answer the learner marked as a guess only half counts.
    if (a.correct) correct += a.confidence === 'guess' ? 0.5 : 1;
  }
  const coverage = total > 0 ? attempted / total : 0;
  const accuracy = attempted > 0 ? correct / attempted : 0;
  const mastery = accuracy * coverage;
  const status: MasteryStatus =
    attempted === 0 ? 'new'
      : mastery >= STRONG_MASTERY ? 'strong'
        : accuracy < 0.5 ? 'weak'
          : 'building';
  return { task, domainId, total, attempted, correct, coverage, accuracy, mastery, status };
}

export interface ExamMastery {
  objectives: ObjectiveMastery[];
  /** Share of all mapped questions answered at least once, 0–1. */
  coverage: number;
  /** The next thing to drill: highest domain weight × (1 − mastery) among objectives with questions. */
  weakest: ObjectiveMastery | null;
}

const STATUS_LABEL: Record<MasteryStatus, string> = { new: 'Not practised', weak: 'Weak', building: 'Building', strong: 'Strong' };
export const masteryLabel = (s: MasteryStatus) => STATUS_LABEL[s];

export const domainWeights = (domains: { id: number; weight: number }[]): Record<number, number> =>
  Object.fromEntries(domains.map((d) => [d.id, d.weight]));

/** `domainWeights` (domain id → exam %) makes a big weak objective outrank a small weaker one. */
export function examMastery(statements: TaskStatementsFile, attempts: QuestionAttempt[], domainWeights?: Record<number, number>): ExamMastery {
  const latest = latestAttemptByQuestion(attempts);
  const objectives = statements.domains.flatMap((d) =>
    d.tasks.map((t) => objectiveMastery(t, d.id, latest)),
  );
  const mapped = new Set(objectives.flatMap((o) => o.task.questionIds));
  let seen = 0;
  for (const id of mapped) if (latest.has(id)) seen += 1;
  const drillable = objectives.filter((o) => o.total > 0);
  const priority = (o: ObjectiveMastery) => (domainWeights?.[o.domainId] ?? 1) * (1 - o.mastery);
  const weakest = drillable.length
    ? drillable.reduce((best, o) => (priority(o) > priority(best) ? o : best))
    : null;
  return { objectives, coverage: mapped.size ? seen / mapped.size : 0, weakest };
}
