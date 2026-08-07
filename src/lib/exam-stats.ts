// ── Per-exam visit metadata ───────────────────────────────────────────────────
// localStorage key: aarya_exam_stats
// Tracks last-visited timestamp and visit count per exam for analytics/UX.

import { isValidExamId } from '@/lib/plan-generator';

export interface ExamStats {
  lastVisitedAt: string; // ISO timestamp
  visitCount: number;
}

const STATS_KEY = 'aarya_exam_stats';

function loadAll(): Record<string, ExamStats> {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) ?? '{}') as Record<string, ExamStats>;
  } catch {
    return {};
  }
}

function saveAll(data: Record<string, ExamStats>): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(data));
  } catch { /* storage unavailable */ }
}

/** Return all exam stats (for gist-sync). */
export function getAllExamStats(): Record<string, ExamStats> {
  return loadAll();
}

export function getExamStats(examId: string): ExamStats | null {
  if (!isValidExamId(examId)) return null;
  return loadAll()[examId] ?? null;
}

export function recordExamVisit(examId: string): void {
  if (!isValidExamId(examId)) return;
  const all = loadAll();
  const existing = all[examId];
  all[examId] = {
    lastVisitedAt: new Date().toISOString(),
    visitCount: (existing?.visitCount ?? 0) + 1,
  };
  saveAll(all);
}

/** Return all exams sorted by most-recently-visited (for "resume" UX). */
export function getRecentlyVisitedExams(): Array<{ examId: string; lastVisitedAt: string }> {
  const all = loadAll();
  return Object.entries(all)
    .filter(([id]) => isValidExamId(id))
    .map(([examId, stats]) => ({ examId, lastVisitedAt: stats.lastVisitedAt }))
    .sort((a, b) => b.lastVisitedAt.localeCompare(a.lastVisitedAt));
}
