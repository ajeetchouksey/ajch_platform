// ── Learning Scheduler — SM-2 inspired spaced repetition ─────────────────
// Pure TypeScript — no DOM, no React, no external deps.
// All examId values used in ScheduleEntry.url come from the exam manifest
// whitelist (ExamDomainRef), never from raw Session.examId (AppSec constraint).
// ──────────────────────────────────────────────────────────────────────────

import type { Session } from '@/lib/progress-schema';

// ── Types ──────────────────────────────────────────────────────────────────

/** Allowlisted exam+domain reference — sourced from server-side manifest. */
export interface ExamDomainRef {
  examId: string;   // e.g. "ccaf"  — from manifest, not from session
  domainId: number; // e.g. 1
  examTitle: string;
  domainTitle: string;
}

/** One scheduler entry per exam domain. */
export interface ScheduleEntry {
  examId: string;      // from manifest whitelist
  domainId: number;
  examTitle: string;
  domainTitle: string;
  lastStudied: string | null;   // ISO date string "YYYY-MM-DD" or null
  dueDate: string;              // ISO date string "YYYY-MM-DD"
  interval: number;             // days until next review
  easeFactor: number;           // SM-2 ease factor (min 1.3)
  reps: number;                 // consecutive correct repetitions
  lastScore: number;            // 0–1, last session performance for this domain
}

// ── SM-2 constants ─────────────────────────────────────────────────────────
const MIN_EASE = 1.3;
const INIT_EASE = 2.5;

// Performance bands → quality score 0-5 for SM-2
function toQuality(scoreRatio: number): number {
  if (scoreRatio >= 0.9) return 5;
  if (scoreRatio >= 0.8) return 4;
  if (scoreRatio >= 0.7) return 3;
  if (scoreRatio >= 0.6) return 2;
  if (scoreRatio >= 0.4) return 1;
  return 0;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Apply one SM-2 iteration to an entry based on a quality score (0-5).
 * Returns a new entry (immutable).
 */
function applyReview(entry: ScheduleEntry, quality: number): ScheduleEntry {
  let { easeFactor, interval, reps } = entry;

  if (quality >= 3) {
    interval = reps === 0 ? 1 : reps === 1 ? 6 : Math.round(interval * easeFactor);
    easeFactor = Math.max(MIN_EASE, easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    reps += 1;
  } else {
    // Failed — reset repetitions, short interval
    interval = 1;
    reps = 0;
  }

  const studiedDate = today();
  return {
    ...entry,
    lastStudied: studiedDate,
    dueDate: addDays(studiedDate, interval),
    interval,
    easeFactor,
    reps,
    lastScore: quality / 5,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Build a schedule from existing sessions + an exam domain whitelist.
 * examDomains MUST come from the server-side manifest (not from sessions)
 * to satisfy the AppSec URL-construction constraint.
 */
export function computeSchedule(
  sessions: Session[],
  examDomains: ExamDomainRef[]
): ScheduleEntry[] {
  const todayStr = today();

  return examDomains.map((ref) => {
    // Find sessions for this specific exam+domain (from the whitelist, not raw session input)
    const domainSessions = sessions.filter(
      (s) => s.examId === ref.examId && s.domain === ref.domainId && s.finishedAt && s.total > 0
    );

    if (domainSessions.length === 0) {
      // Never studied — due immediately
      return {
        examId: ref.examId,
        domainId: ref.domainId,
        examTitle: ref.examTitle,
        domainTitle: ref.domainTitle,
        lastStudied: null,
        dueDate: todayStr,
        interval: 1,
        easeFactor: INIT_EASE,
        reps: 0,
        lastScore: 0,
      };
    }

    // Build up the SM-2 state by replaying sessions chronologically
    const sorted = [...domainSessions].sort(
      (a, b) => new Date(a.finishedAt!).getTime() - new Date(b.finishedAt!).getTime()
    );

    let entry: ScheduleEntry = {
      examId: ref.examId,
      domainId: ref.domainId,
      examTitle: ref.examTitle,
      domainTitle: ref.domainTitle,
      lastStudied: null,
      dueDate: todayStr,
      interval: 1,
      easeFactor: INIT_EASE,
      reps: 0,
      lastScore: 0,
    };

    for (const s of sorted) {
      const scoreRatio = s.score / s.total;
      const quality = toQuality(scoreRatio);
      // Temporarily set lastStudied to the session date for interval calculation
      entry = {
        ...applyReview(entry, quality),
        lastStudied: s.finishedAt!.slice(0, 10),
        dueDate: addDays(s.finishedAt!.slice(0, 10), entry.interval),
      };
    }

    // Recompute dueDate from the final lastStudied + interval
    return {
      ...entry,
      dueDate: addDays(entry.lastStudied!, entry.interval),
    };
  });
}

/**
 * Return entries that are due today or overdue, sorted by most overdue first.
 */
export function getDueDomains(schedule: ScheduleEntry[]): ScheduleEntry[] {
  const todayStr = today();
  return schedule
    .filter((e) => e.dueDate <= todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Update a single schedule entry after a study session.
 * score: number of correct answers, total: questions attempted.
 */
export function updateAfterStudy(
  entry: ScheduleEntry,
  score: number,
  total: number
): ScheduleEntry {
  if (total === 0) return entry;
  const quality = toQuality(score / total);
  return applyReview(entry, quality);
}
