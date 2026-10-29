// ── Prep profile: the learner's own choices for one exam ───────────────────────
// Set in the first-visit setup (goal + date, experience, time a day, study
// days, how to start). Drives the forecast, today's session and the hub.
// localStorage key: aarya_profile_{examId}
import { isValidExamId } from '@/lib/plan-generator';

export type Goal = 'booked' | 'aiming' | 'explore';
export type Level = 'new' | 'some' | 'pro';
export type StartMode = 'test' | 'learn' | 'practise';

export interface PrepProfile {
  goal: Goal;
  /** ISO date (yyyy-mm-dd); absent when exploring. */
  examDate?: string;
  level: Level;
  minsPerDay: number;
  /** Mon..Sun, true = a study day. */
  days: boolean[];
  start: StartMode;
  createdAt: number;
  /** Daily reminder time "HH:MM", if the learner added one. */
  reminder?: string;
}

const DAY = 86_400_000;
const key = (examId: string) => `aarya_profile_${examId}`;
const skipKey = (examId: string) => `aarya_profile_skipped_${examId}`;

export function getProfile(examId: string): PrepProfile | null {
  if (!isValidExamId(examId)) return null;
  try { return JSON.parse(localStorage.getItem(key(examId)) ?? 'null') as PrepProfile | null; } catch { return null; }
}

export function saveProfile(examId: string, p: PrepProfile): void {
  if (!isValidExamId(examId)) return;
  try { localStorage.setItem(key(examId), JSON.stringify(p)); localStorage.removeItem(skipKey(examId)); } catch { /* storage unavailable */ }
}

/** The learner chose "Skip, I'll look around" — don't push the setup on them again. */
export function skipSetup(examId: string): void {
  try { localStorage.setItem(skipKey(examId), '1'); } catch { /* storage unavailable */ }
}
export function setupSkipped(examId: string): boolean {
  try { return localStorage.getItem(skipKey(examId)) === '1'; } catch { return false; }
}

export const DEFAULT_DAYS = [true, true, true, true, true, false, false];

export function daysPerWeek(p: Pick<PrepProfile, 'days'>): number {
  return Math.max(1, p.days.filter(Boolean).length);
}

/** Whole days from `now` until the exam (0 = today), or null without a date. */
export function daysToExam(p: Pick<PrepProfile, 'examDate' | 'goal'>, now = Date.now()): number | null {
  if (p.goal === 'explore' || !p.examDate) return null;
  const exam = new Date(`${p.examDate}T00:00:00`).getTime();
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((exam - today.getTime()) / DAY));
}

export function isStudyDay(p: Pick<PrepProfile, 'days'>, d = new Date()): boolean {
  return !!p.days[(d.getDay() + 6) % 7];
}

// ── Forecast ─────────────────────────────────────────────────────────────────
// A deliberately simple model: readiness rises with study hours at a rate set by
// experience, with diminishing returns. Starts from the learner's real readiness
// once they have any, otherwise from a level-based guess. It is a guide for
// pacing, labelled as a forecast in the UI — never a score.

export const PASS_LINE = 70;
const BASE: Record<Level, number> = { new: 5, some: 18, pro: 35 };
/** Focused study hours a typical learner needs to reach the pass line from their starting point. */
const HOURS_TO_PASS: Record<Level, number> = { new: 18, some: 11, pro: 6 };
const GAIN: Record<Level, number> = {
  new: (PASS_LINE - BASE.new) / HOURS_TO_PASS.new,
  some: (PASS_LINE - BASE.some) / HOURS_TO_PASS.some,
  pro: (PASS_LINE - BASE.pro) / HOURS_TO_PASS.pro,
}; // readiness points per study hour
/** Suggestions above this many minutes a day aren't realistic; suggest days or a later date instead. */
const MAX_SUGGESTED_MINS = 90;

export interface Forecast {
  /** Weeks the forecast spans (to exam day, or 8 when exploring). */
  horizonWeeks: number;
  start: number;
  /** Projected readiness at the horizon, 0–96. */
  end: number;
  /** Weeks until the pass line is crossed, or null if not within 30 weeks. */
  weeksToPass: number | null;
  /** 13 evenly spaced [week, readiness] points for the chart. */
  curve: [number, number][];
  /** Minutes a day that would reach the pass line in time, if more are needed. */
  minsNeeded: number | null;
}

export function forecast(
  p: Pick<PrepProfile, 'goal' | 'examDate' | 'level' | 'minsPerDay' | 'days'>,
  currentReadiness = 0,
  now = Date.now(),
): Forecast {
  const left = daysToExam(p, now);
  const horizonWeeks = left === null ? 8 : Math.max(left / 7, 0.15);
  const start = Math.max(currentReadiness, BASE[p.level]);
  const rate = (mins: number) => GAIN[p.level] * ((daysPerWeek(p) * mins) / 60);
  const at = (w: number, mins = p.minsPerDay) =>
    Math.min(96, start + rate(mins) * w * (1 - 0.1 * Math.min(1, w / Math.max(horizonWeeks, 1))));
  let weeksToPass: number | null = null;
  if (start >= PASS_LINE) weeksToPass = 0;
  else for (let w = 0.5; w <= 30; w += 0.5) if (at(w) >= PASS_LINE) { weeksToPass = Math.ceil(w); break; }
  const end = Math.round(at(horizonWeeks));
  let minsNeeded: number | null = null;
  if (left !== null && end < PASS_LINE) {
    for (let m = p.minsPerDay + 5; m <= MAX_SUGGESTED_MINS; m += 5) if (at(horizonWeeks, m) >= PASS_LINE) { minsNeeded = m; break; }
  }
  const curve = Array.from({ length: 13 }, (_, i) => {
    const w = (i / 12) * horizonWeeks;
    return [w, Math.round(at(w) * 10) / 10] as [number, number];
  });
  return { horizonWeeks, start: Math.round(start), end, weeksToPass, curve, minsNeeded };
}

/** Where the learner should be today if they're on the plan's line, for "ahead / behind". */
export function expectedToday(p: PrepProfile, now = Date.now()): number | null {
  const left = daysToExam(p, now);
  if (left === null) return null;
  const total = Math.max(1, Math.round((new Date(`${p.examDate}T00:00:00`).getTime() - p.createdAt) / DAY));
  // Don't judge pace in the first few days: the starting point is only a guess until there's data.
  if (total - left < 3) return null;
  const elapsedW = Math.max(0, (total - left) / 7);
  const f = forecast({ ...p }, 0, p.createdAt);
  const rate = (f.end - f.start) / Math.max(f.horizonWeeks, 0.15);
  return Math.round(Math.min(96, f.start + rate * elapsedW));
}

// ── Daily reminder (.ics) ────────────────────────────────────────────────────

/** A weekly-recurring calendar event on the learner's study days. */
export function reminderIcs(examTitle: string, examId: string, p: PrepProfile, time: string, origin: string): string {
  const [hh, mm] = time.split(':').map(Number);
  const first = new Date(); first.setHours(hh, mm, 0, 0);
  if (first.getTime() < Date.now()) first.setDate(first.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  const end = new Date(first.getTime() + p.minsPerDay * 60_000);
  const byDay = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].filter((_, i) => p.days[i]).join(',');
  const until = p.examDate ? `;UNTIL=${p.examDate.replace(/-/g, '')}T235959` : '';
  const url = `${origin}/skillup/${examId}`;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AaryaAI//SkillUp//EN', 'BEGIN:VEVENT',
    `UID:skillup-${examId}-${Date.now()}@aaryaai.dev`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${local(first)}`, `DTEND:${local(end)}`,
    `RRULE:FREQ=WEEKLY;BYDAY=${byDay}${until}`,
    `SUMMARY:${examTitle} · ${p.minsPerDay}-minute session`,
    `DESCRIPTION:Today's session is ready: ${url}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'TRIGGER:-PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:SkillUp session', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}
