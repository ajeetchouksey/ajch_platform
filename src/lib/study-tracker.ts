/**
 * study-tracker.ts
 * Streak tracking, domain completion, daily card, resume state,
 * iCal export, spaced repetition (SM-2 lite), and focus timer.
 */
import type { QuizSession } from '../types/content';
import type { DomainConfig } from '../types/content';
import { getNotesSeen } from './storage';
import type { StudyPlan } from './plan-generator';

// ── Helpers ──────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);

function lsGet(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function lsSet(key: string, val: string): void { try { localStorage.setItem(key, val); } catch { /* noop */ } }
function lsDel(key: string): void { try { localStorage.removeItem(key); } catch { /* noop */ } }

// ── Streak ───────────────────────────────────────────────────────────────────
export function getStreak(examId: string): number {
  const last = lsGet(`study_last_day_${examId}`);
  const count = parseInt(lsGet(`study_streak_${examId}`) ?? '0', 10);
  if (!last) return 0;
  const diff = Math.floor((Date.now() - new Date(last).getTime()) / 86400000);
  return diff <= 1 ? count : 0; // 0 or 1 day ago = streak alive
}

export function recordStudyDay(examId: string): number {
  const t = todayStr();
  if (lsGet(`study_last_day_${examId}`) === t) return getStreak(examId);
  const last = lsGet(`study_last_day_${examId}`);
  const diff = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86400000) : 999;
  const streak = diff <= 1 ? getStreak(examId) + 1 : 1;
  lsSet(`study_streak_${examId}`, String(streak));
  lsSet(`study_last_day_${examId}`, t);
  return streak;
}

// ── Domain Completion ────────────────────────────────────────────────────────
export interface DomainCompletion {
  notesRead: boolean;
  quizAttempted: boolean;
  quizPassed: boolean;
  bestScore: number; // 0–100
}

export function getDomainCompletion(examId: string, domainId: number, sessions: QuizSession[]): DomainCompletion {
  const seen = getNotesSeen();
  const notesRead = !!seen[`${examId}:${domainId}`];
  const relevant = sessions.filter(s => s.finishedAt && s.skillId === examId && s.domainFilter === domainId && s.total > 0);
  if (!relevant.length) return { notesRead, quizAttempted: false, quizPassed: false, bestScore: 0 };
  const best = Math.max(...relevant.map(s => s.score / s.total));
  return { notesRead, quizAttempted: true, quizPassed: best >= 0.7, bestScore: Math.round(best * 100) };
}

// ── Daily Study Card ─────────────────────────────────────────────────────────
export type DailyAction = 'read-notes' | 'take-quiz' | 'retake-quiz' | 'all-done';

export interface DailyCard {
  domainId: number;
  domainTitle: string;
  domainColor: string;
  action: DailyAction;
  reason: string;
  link: string;
}

export function getDailyCard(examId: string, domains: DomainConfig[], sessions: QuizSession[]): DailyCard | null {
  if (!domains.length) return null;
  for (const d of domains) {
    const c = getDomainCompletion(examId, d.id, sessions);
    if (!c.notesRead)
      return { domainId: d.id, domainTitle: d.title, domainColor: d.color, action: 'read-notes', reason: 'Notes not yet read for this domain.', link: `/skillup/${examId}/notes?d=${d.id}` };
    if (!c.quizAttempted)
      return { domainId: d.id, domainTitle: d.title, domainColor: d.color, action: 'take-quiz', reason: 'Notes complete — now test your recall.', link: `/skillup/${examId}/quiz?d=${d.id}` };
    if (!c.quizPassed)
      return { domainId: d.id, domainTitle: d.title, domainColor: d.color, action: 'retake-quiz', reason: `Score: ${c.bestScore}% — aim for 70%+ to pass.`, link: `/skillup/${examId}/quiz?d=${d.id}` };
  }
  const d = domains[0];
  return { domainId: d.id, domainTitle: d.title, domainColor: d.color, action: 'all-done', reason: 'All domains passed! Consider a full practice exam.', link: `/skillup/${examId}/quiz` };
}

// ── Exam Readiness Score ─────────────────────────────────────────────────────
export function getReadinessScore(examId: string, domains: DomainConfig[], sessions: QuizSession[]): number {
  if (!domains.length) return 0;
  let weightedScore = 0;
  let totalWeight = 0;
  for (const d of domains) {
    const c = getDomainCompletion(examId, d.id, sessions);
    // Notes contributes 30%, quiz contributes 70% of each domain's contribution
    const notesPoints = c.notesRead ? 30 : 0;
    const quizPoints = c.quizAttempted ? Math.min(100, c.bestScore) * 0.7 : 0;
    weightedScore += (notesPoints + quizPoints) * d.weight;
    totalWeight += d.weight * 100;
  }
  return totalWeight > 0 ? Math.round(weightedScore / totalWeight * 100) : 0;
}

// ── Resume State ─────────────────────────────────────────────────────────────
export interface ResumeState { domainId: number; sectionTitle?: string; ts: number; }

export function getResumeState(examId: string): ResumeState | null {
  try { const r = lsGet(`notes_resume_${examId}`); return r ? JSON.parse(r) as ResumeState : null; } catch { return null; }
}

export function setResumeState(examId: string, state: ResumeState): void {
  lsSet(`notes_resume_${examId}`, JSON.stringify(state));
}

export function clearResumeState(examId: string): void {
  lsDel(`notes_resume_${examId}`);
}

// ── iCal Export ──────────────────────────────────────────────────────────────
function icalDt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
}

export function exportStudyPlanAsIcal(plan: StudyPlan, examTitle: string): void {
  const base = new Date();
  base.setHours(8, 0, 0, 0);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//Aarya Learning Hub//Study Plan//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  ];
  for (const s of plan.sessions) {
    const start = new Date(base);
    start.setDate(start.getDate() + s.day - 1);
    const end = new Date(start.getTime() + s.estimatedMinutes * 60000);
    const desc = s.activities.map(a => a.label).join(', ').replace(/,/g, '\\,');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${plan.examId}-d${s.day}-dom${s.domainId}@aarya`,
      `DTSTART:${icalDt(start)}`,
      `DTEND:${icalDt(end)}`,
      `SUMMARY:📚 ${examTitle} — D${s.domainId}: ${s.domainTitle}`,
      `DESCRIPTION:${desc}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: `${plan.examId}-study-plan.ics` });
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Spaced Repetition (SM-2 lite) ────────────────────────────────────────────
export interface SrsItem { qId: string; nextReview: number; interval: number; ease: number; reps: number; }

function getSrsRaw(examId: string): SrsItem[] {
  try { const r = lsGet(`srs_${examId}`); return r ? JSON.parse(r) as SrsItem[] : []; } catch { return []; }
}
function saveSrs(examId: string, q: SrsItem[]): void { lsSet(`srs_${examId}`, JSON.stringify(q)); }

export function scheduleForReview(examId: string, qId: string, correct: boolean): void {
  const queue = getSrsRaw(examId);
  const i = queue.findIndex(x => x.qId === qId);
  const quality = correct ? 4 : 1;
  if (i === -1) {
    queue.push({ qId, nextReview: Date.now() + (correct ? 86400000 : 0), interval: correct ? 1 : 0, ease: 2.5, reps: correct ? 1 : 0 });
  } else {
    const item = queue[i];
    const newEase = Math.max(1.3, item.ease + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    const newInterval = correct
      ? (item.reps === 0 ? 1 : item.reps === 1 ? 6 : Math.round(item.interval * newEase))
      : 0;
    queue[i] = { ...item, ease: newEase, interval: newInterval, reps: correct ? item.reps + 1 : 0, nextReview: Date.now() + newInterval * 86400000 };
  }
  saveSrs(examId, queue);
}

export function getDueReviews(examId: string): SrsItem[] {
  return getSrsRaw(examId).filter(i => i.nextReview <= Date.now());
}

export function getSrsCount(examId: string): number {
  return getSrsRaw(examId).length;
}

// ── Focus Timer (Pomodoro) ────────────────────────────────────────────────────
const TIMER_KEY = 'focus_timer';

export interface FocusTimer {
  mode: 'focus' | 'break';
  startedAt: number;
  durationMs: number;
  pomodoros: number;
  examId: string;
}

export function getFocusTimer(): FocusTimer | null {
  try {
    const r = lsGet(TIMER_KEY);
    if (!r) return null;
    const t = JSON.parse(r) as FocusTimer;
    // Discard stale timers older than 2 hours
    if (Date.now() - t.startedAt > 7200000) { lsDel(TIMER_KEY); return null; }
    return t;
  } catch { return null; }
}

export function setFocusTimer(state: FocusTimer | null): void {
  if (state) lsSet(TIMER_KEY, JSON.stringify(state));
  else lsDel(TIMER_KEY);
}
