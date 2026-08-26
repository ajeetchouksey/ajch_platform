// ── Adaptive Quiz Engine ───────────────────────────────────────────────────────
// Tracks per-question attempts, drives next-question selection by domain
// weakness, and computes ReadinessReport from attempt history.
// localStorage key: aarya_attempts_{examId}

import type { DomainConfig, Question, QuestionAttempt, DomainReadiness, ReadinessReport, QuizSession } from '@/types/content';
import { isValidExamId } from '@/lib/plan-generator';

// ── Storage ────────────────────────────────────────────────────────────────────

function attemptsKey(examId: string): string {
  return `aarya_attempts_${examId}`;
}

export function getAttempts(examId: string): QuestionAttempt[] {
  if (!isValidExamId(examId)) return [];
  try {
    return JSON.parse(localStorage.getItem(attemptsKey(examId)) ?? '[]') as QuestionAttempt[];
  } catch {
    return [];
  }
}

export function saveAttempt(attempt: QuestionAttempt): void {
  if (!isValidExamId(attempt.examId)) return;
  const all = getAttempts(attempt.examId);
  all.push(attempt);
  localStorage.setItem(attemptsKey(attempt.examId), JSON.stringify(all));
}

export function clearAttempts(examId: string): void {
  if (!isValidExamId(examId)) return;
  localStorage.removeItem(attemptsKey(examId));
}

/** Replace full attempt history (used for cross-device sync). */
export function setAttempts(examId: string, attempts: QuestionAttempt[]): void {
  if (!isValidExamId(examId)) return;
  localStorage.setItem(attemptsKey(examId), JSON.stringify(attempts));
}

/** Return all attempts across every exam (for gist-sync). */
export function getAllAttempts(): Record<string, QuestionAttempt[]> {
  const result: Record<string, QuestionAttempt[]> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('aarya_attempts_')) {
      const examId = key.slice('aarya_attempts_'.length);
      try { result[examId] = JSON.parse(localStorage.getItem(key) ?? '[]') as QuestionAttempt[]; }
      catch { /* skip corrupt entry */ }
    }
  }
  return result;
}

// ── Domain accuracy helpers ────────────────────────────────────────────────────

interface DomainStats {
  correct: number;
  total: number;
  recentCorrect: number;  // last 10 attempts for trend
  recentTotal: number;
}

function computeDomainStats(
  attempts: QuestionAttempt[],
  loop: 1 | 2 | null,
): Record<number, DomainStats> {
  const stats: Record<number, DomainStats> = {};
  const filtered = loop !== null ? attempts.filter((a) => a.loop === loop) : attempts;

  for (const a of filtered) {
    if (!stats[a.domain]) stats[a.domain] = { correct: 0, total: 0, recentCorrect: 0, recentTotal: 0 };
    stats[a.domain].correct += a.correct ? 1 : 0;
    stats[a.domain].total += 1;
  }

  // Compute "recent" stats from last 10 attempts per domain
  const byDomain: Record<number, QuestionAttempt[]> = {};
  for (const a of filtered) {
    (byDomain[a.domain] ??= []).push(a);
  }
  for (const [domainId, domainAttempts] of Object.entries(byDomain)) {
    const recent = domainAttempts.slice(-10);
    const s = stats[Number(domainId)];
    s.recentCorrect = recent.filter((a) => a.correct).length;
    s.recentTotal = recent.length;
  }

  return stats;
}

// ── Readiness computation ──────────────────────────────────────────────────────

/**
 * Dead code: never called anywhere in the app because QuestionAttempt is never
 * populated (no UI calls saveAttempt()). Kept as a Phase 2-3 candidate once
 * saveAttempt() is ever wired up. Use predictPassProbabilityFromSessions() below
 * for live-data-backed pass prediction in the meantime.
 */
export function computeReadiness(
  examId: string,
  domains: DomainConfig[],
  attempts: QuestionAttempt[],
): ReadinessReport {
  const stats = computeDomainStats(attempts, null);
  const totalAttempts = attempts.length;

  const domainReadiness: DomainReadiness[] = domains.map((d) => {
    const s = stats[d.id];
    if (!s || s.total === 0) {
      return { domainId: d.id, score: 0, attempts: 0, confidence: 'low', trend: 'stable' };
    }

    const score = Math.round((s.correct / s.total) * 100);
    const confidence: DomainReadiness['confidence'] =
      s.total > 25 ? 'high' : s.total >= 10 ? 'medium' : 'low';

    let trend: DomainReadiness['trend'] = 'stable';
    if (s.recentTotal >= 5) {
      const recentRate = s.recentCorrect / s.recentTotal;
      const allRate = s.correct / s.total;
      if (recentRate - allRate > 0.08) trend = 'improving';
      else if (allRate - recentRate > 0.08) trend = 'declining';
    }

    return { domainId: d.id, score, attempts: s.total, confidence, trend };
  });

  // Weighted overall score — sum(weight × score) / sum(weight)
  const totalWeight = domains.reduce((sum, d) => sum + d.weight, 0) || 100;
  const overallScore = Math.round(
    domainReadiness.reduce((sum, dr) => {
      const d = domains.find((x) => x.id === dr.domainId);
      return sum + dr.score * ((d?.weight ?? 0) / totalWeight);
    }, 0),
  );

  // Logistic mapping: 75% score → ~50% pass probability; 90% → ~90%
  const predictedPassProbability = Math.min(1, Math.max(0, 1 / (1 + Math.exp(-0.12 * (overallScore - 75)))));

  // Recommend domain with highest weakness priority: weight × (1 - accuracy)
  let recommendedFocusDomain: number | null = null;
  let maxPriority = -1;
  for (const dr of domainReadiness) {
    const d = domains.find((x) => x.id === dr.domainId);
    const priority = (d?.weight ?? 0) * (1 - dr.score / 100);
    if (priority > maxPriority) {
      maxPriority = priority;
      recommendedFocusDomain = dr.domainId;
    }
  }

  return {
    examId,
    generatedAt: new Date().toISOString(),
    overallScore,
    domains: domainReadiness,
    predictedPassProbability,
    recommendedFocusDomain,
    totalAttempts,
  };
}

/**
 * Predicts pass probability from live QuizSession history (per-domain sum(score)/sum(total)
 * from finished sessions), rather than the dead QuestionAttempt-based computeReadiness() above.
 * Mixed/full-exam quizzes (domainFilter === null) are excluded from per-domain scoring,
 * consistent with the rest of the codebase's per-domain calcs.
 */
export function predictPassProbabilityFromSessions(
  examId: string,
  domains: DomainConfig[],
  sessions: QuizSession[],
): { probability: number; weightedAccuracy: number; domainsWithData: number } | null {
  let totalWeight = 0;
  let weightedSum = 0;
  let domainsWithData = 0;

  for (const d of domains) {
    const ds = sessions.filter((s) => s.skillId === examId && s.finishedAt && s.domainFilter === d.id);
    const correct = ds.reduce((sum, s) => sum + s.score, 0);
    const total = ds.reduce((sum, s) => sum + s.total, 0);
    if (total <= 0) continue;
    const pct = Math.round((correct / total) * 100);
    domainsWithData += 1;
    totalWeight += d.weight;
    weightedSum += pct * d.weight;
  }

  if (domainsWithData === 0) return null;

  const weightedAccuracy = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  const probability = Math.min(1, Math.max(0, 1 / (1 + Math.exp(-0.12 * (weightedAccuracy - 75)))));

  return { probability, weightedAccuracy, domainsWithData };
}

// ── Adaptive next-question selection ──────────────────────────────────────────

const RECENT_WINDOW = 20; // never repeat a question seen in the last N attempts

/**
 * Select the next question for the student.
 *
 * Strategy:
 * - Loop 1: prioritise domains by weight × (1 - accuracy). Within domain,
 *   pick a random unseen question. Fall back to any unseen question.
 * - Loop 2: prefer questions the student got wrong in Loop 1.
 */
export function selectNextQuestion(
  questions: Question[],
  attempts: QuestionAttempt[],
  loop: 1 | 2,
): Question | null {
  if (questions.length === 0) return null;

  const recentIds = new Set(attempts.slice(-RECENT_WINDOW).map((a) => a.questionId));
  const allAttemptedIds = new Set(attempts.map((a) => a.questionId));

  let pool: Question[];

  if (loop === 2) {
    // Loop 2: prefer questions wrong in Loop 1
    const wrongInLoop1 = new Set(
      attempts.filter((a) => a.loop === 1 && !a.correct).map((a) => a.questionId),
    );
    const wrongPool = questions.filter((q) => wrongInLoop1.has(q.id) && !recentIds.has(q.id));
    pool = wrongPool.length > 0
      ? wrongPool
      : questions.filter((q) => !recentIds.has(q.id));
  } else {
    // Loop 1: prefer unseen questions
    const unseen = questions.filter((q) => !allAttemptedIds.has(q.id));
    pool = unseen.length > 0 ? unseen : questions.filter((q) => !recentIds.has(q.id));
  }

  if (pool.length === 0) pool = questions; // full reset when all exhausted

  // Weight selection by domain weakness: weight × (1 - domainAccuracy)
  const domainStats = computeDomainStats(attempts, loop === 2 ? null : 1);
  const scored = pool.map((q) => {
    const s = domainStats[q.domain];
    const accuracy = s && s.total > 0 ? s.correct / s.total : 0;
    // Boost for questions not yet attempted
    const novelty = allAttemptedIds.has(q.id) ? 0 : 0.2;
    const priority = 1 - accuracy + novelty;
    return { q, priority };
  });

  // Softmax-style weighted random selection
  const totalPriority = scored.reduce((sum, { priority }) => sum + priority, 0);
  let rand = Math.random() * totalPriority;
  for (const { q, priority } of scored) {
    rand -= priority;
    if (rand <= 0) return q;
  }
  return scored[scored.length - 1].q;
}
