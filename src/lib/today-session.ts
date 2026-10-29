// ── Today's session: rebuilt every time from the learner's real state ─────────
// Inputs: time available now, the prep profile, due flashcards, recent misses,
// objective mastery, unread notes and pace against the plan. Output: an ordered
// list of steps the session page runs back to back, plus the reasons shown to
// the learner ("why this today").
import type { ExamConfig, Question, QuestionAttempt, TaskStatementsFile } from '@/types/content';
import type { ExamMastery } from '@/lib/objective-mastery';
import { latestAttemptByQuestion, masteryLabel } from '@/lib/objective-mastery';
import { getDomainCompletion, getResumeState, resumeLabel } from '@/lib/study-tracker';
import { getSessions } from '@/lib/storage';
import { expectedToday, isStudyDay, type PrepProfile } from '@/lib/prep-profile';

const DAY = 86_400_000;

export type StepKind = 'cards' | 'missed' | 'notes' | 'drill' | 'baseline' | 'mixed';

/** Which activity colour a step wears (see lib/skillup-colors). */
export function stepActivity(kind: StepKind): 'learn' | 'practise' | 'review' | 'mock' {
  return kind === 'notes' ? 'learn' : kind === 'cards' || kind === 'missed' ? 'review' : kind === 'mixed' ? 'mock' : 'practise';
}

export interface SessionStep {
  kind: StepKind;
  title: string;
  meta: string;
  minutes: number;
  /** cards: how many; missed/drill/baseline/mixed: question count. */
  count?: number;
  domain?: number;
  /** notes: the `##` heading to read (as the notes TOC shows it). */
  heading?: string;
  /** drill: official objective id. */
  taskId?: string;
}

export interface TodayPlan {
  steps: SessionStep[];
  reasons: string[];
  minutes: number;
  pace: 'ahead' | 'on' | 'behind' | null;
  restDay: boolean;
}

export interface TodayInput {
  exam: ExamConfig;
  profile: PrepProfile | null;
  mastery: ExamMastery | null;
  attempts: QuestionAttempt[];
  dueCards: number;
  readiness: number;
  minutes: number;
  now?: number;
}

/** Questions whose latest answer was wrong within the last `days` days. */
export function recentMisses(attempts: QuestionAttempt[], now: number, days = 3): string[] {
  return [...latestAttemptByQuestion(attempts).values()]
    .filter((a) => !a.correct && now - a.attemptedAt < days * DAY)
    .sort((a, b) => b.attemptedAt - a.attemptedAt)
    .map((a) => a.questionId);
}

export function buildToday(i: TodayInput): TodayPlan {
  const now = i.now ?? Date.now();
  const M = i.minutes;
  const steps: SessionStep[] = [];
  const reasons: string[] = [];
  const restDay = !!i.profile && !isStudyDay(i.profile, new Date(now));
  if (restDay) reasons.push('Today is a rest day in your plan. A short review keeps your streak without the load.');

  const expected = i.profile ? expectedToday(i.profile, now) : null;
  const pace = expected === null ? null : i.readiness >= expected + 3 ? 'ahead' : i.readiness <= expected - 3 ? 'behind' : 'on';
  if (pace === 'behind') reasons.push(`You're ${expected! - i.readiness} points behind your plan line. Today leans on practice, the fastest way to catch up.`);
  if (pace === 'ahead') reasons.push(`You're ${i.readiness - expected!} points ahead of your plan line. Today adds breadth.`);

  // ── First session: honour "how do you want to start" ──
  if (!i.attempts.length) {
    const start = i.profile?.start ?? 'test';
    const big = [...i.exam.domains].sort((a, b) => b.weight - a.weight)[0];
    if (start === 'learn') {
      const r = getResumeState(i.exam.id);
      const d1 = i.exam.domains[0]?.id ?? 1;
      const label = r?.domainId === d1 ? resumeLabel(r) : null;
      steps.push({ kind: 'notes', title: label ? `Read on: ${label}` : 'D1 notes: first section', meta: 'Read, then a two-question check', minutes: Math.min(15, M), domain: d1, heading: label ?? undefined });
      if (M >= 20) steps.push({ kind: 'drill', title: 'Practise what you just read', meta: '5 questions', minutes: 6, count: 5, domain: i.exam.domains[0]?.id ?? 1 });
      reasons.push('You chose to learn first, so today starts with the notes.');
    } else if (start === 'practise') {
      steps.push({ kind: 'drill', title: `Drill D${big.id}: ${big.title}`, meta: `${Math.min(15, Math.max(5, Math.round(M / 1.2)))} questions with explanations`, minutes: M, count: Math.min(15, Math.max(5, Math.round(M / 1.2))), domain: big.id });
      reasons.push(`You chose to practise first. D${big.id} is the biggest domain (${big.weight}% of the exam).`);
    } else {
      steps.push({ kind: 'baseline', title: 'Baseline: 10 questions', meta: 'Across every domain, about 12 min', minutes: 12, count: 10 });
      reasons.push('A 10-question baseline shows what to skip and what to study.');
    }
    return { steps, reasons, minutes: steps.reduce((n, s) => n + s.minutes, 0), pace, restDay };
  }

  let used = 0;
  // 1. Cards that are due — cheap, and they decay if skipped.
  if (i.dueCards > 0) {
    const n = Math.min(i.dueCards, M <= 5 ? 8 : 15);
    const mins = Math.max(2, Math.round(n * 0.4));
    steps.push({ kind: 'cards', title: `Review ${n} flashcard${n === 1 ? '' : 's'}`, meta: `Due now · ${mins} min`, minutes: mins, count: n });
    used += mins;
    reasons.push(`${i.dueCards} flashcard${i.dueCards === 1 ? ' is' : 's are'} due; reviewing on time is what makes them stick.`);
  }

  // 2. Recent misses — fix them while they're fresh.
  const misses = recentMisses(i.attempts, now);
  if (misses.length && (M > 5 || !steps.length)) {
    const n = Math.min(misses.length, M <= 15 ? 3 : 5);
    steps.push({ kind: 'missed', title: `Retry ${n} you missed recently`, meta: `${n} question${n === 1 ? '' : 's'} · ${n} min`, minutes: n, count: n });
    used += n;
    reasons.push(`${misses.length} question${misses.length === 1 ? '' : 's'} you got wrong in the last few days come${misses.length === 1 ? 's' : ''} back first.`);
  }
  if (M <= 5) return { steps: steps.length ? steps : [quickDrill()], reasons, minutes: Math.max(used, 3), pace, restDay };

  // 3. Notes — for new learners, unread domains, or the weak objective's domain.
  const sessions = getSessions();
  const unread = i.exam.domains.find((d) => !getDomainCompletion(i.exam.id, d.id, sessions).notesRead);
  const resume = getResumeState(i.exam.id);
  const weakest = i.mastery?.weakest ?? null;
  const wantNotes = M - used >= 15 && pace !== 'behind' && (i.profile?.level === 'new' || unread || (weakest && weakest.status === 'weak'));
  if (wantNotes) {
    const domain = resume?.domainId ?? unread?.id ?? weakest?.domainId ?? i.exam.domains[0].id;
    const label = resumeLabel(resume);
    const mins = Math.min(15, M - used - 5);
    steps.push({ kind: 'notes', title: label && resume?.domainId === domain ? `Read on: ${label}` : `D${domain} notes: next section`, meta: `${mins} min · ends with a quick check`, minutes: mins, domain, heading: resume?.domainId === domain ? label ?? undefined : undefined });
    used += mins;
    if (unread && domain === unread.id) reasons.push(`You haven't read the D${unread.id} notes yet.`);
  }

  // 4. Drill the weakest objective with what's left.
  const left = M - used;
  if (left >= 5 && weakest) {
    const n = Math.max(5, Math.min(15, Math.round(left / 1.2)));
    steps.push({ kind: 'drill', title: `Drill objective ${weakest.task.id}`, meta: `${n} questions · ${weakest.task.title}`, minutes: Math.round(n * 1.2), count: n, taskId: weakest.task.id, domain: weakest.domainId });
    used += Math.round(n * 1.2);
    reasons.push(`Objective ${weakest.task.id} is your top priority: ${weakest.status === 'new' ? 'not practised yet' : masteryLabel(weakest.status).toLowerCase()}, in a domain worth ${i.exam.domains.find((d) => d.id === weakest.domainId)?.weight ?? '?'}% of the exam.`);
  } else if (left >= 5) {
    steps.push(quickDrill(Math.max(5, Math.round(left / 1.2))));
    used += left;
  }

  // 5. Long sessions end with a mini mock once there's enough coverage.
  if (M >= 45 && (i.mastery?.coverage ?? 0) >= 0.4) {
    steps.push({ kind: 'mixed', title: 'Mini mock: 20 mixed questions', meta: 'Exam-style, answers at the end · 20 min', minutes: 20, count: 20 });
    used += 20;
    reasons.push('You have time for a mini mock; it trains pacing across domains.');
  }

  return { steps, reasons, minutes: used, pace, restDay };
}

function quickDrill(n = 3): SessionStep {
  return { kind: 'drill', title: `${n} quick questions`, meta: 'Mixed domains', minutes: Math.max(3, Math.round(n * 1.2)), count: n };
}

// ── Question selection for a step ────────────────────────────────────────────

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let k = r.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [r[k], r[j]] = [r[j], r[k]]; }
  return r;
}

/** Unanswered first, then wrong, then right — within the given pool. */
function prioritise(pool: Question[], attempts: QuestionAttempt[]): Question[] {
  const latest = latestAttemptByQuestion(attempts);
  const rank = (q: Question) => (!latest.has(q.id) ? 0 : latest.get(q.id)!.correct ? 2 : 1);
  return shuffle(pool).sort((a, b) => rank(a) - rank(b));
}

export function questionsForStep(
  step: SessionStep, bank: Question[], statements: TaskStatementsFile | null, attempts: QuestionAttempt[], now = Date.now(),
): Question[] {
  const n = step.count ?? 5;
  const byId = new Map(bank.map((q) => [q.id, q]));
  if (step.kind === 'missed') {
    return recentMisses(attempts, now).map((id) => byId.get(id)).filter((q): q is Question => !!q).slice(0, n);
  }
  if (step.kind === 'drill' && step.taskId && statements) {
    const ids = statements.domains.flatMap((d) => d.tasks).find((t) => t.id === step.taskId)?.questionIds ?? [];
    const pool = ids.map((id) => byId.get(id)).filter((q): q is Question => !!q);
    if (pool.length) return prioritise(pool, attempts).slice(0, n);
  }
  if (step.kind === 'drill' && step.domain) {
    return prioritise(bank.filter((q) => q.domain === step.domain), attempts).slice(0, n);
  }
  if (step.kind === 'baseline') {
    // Spread across domains in proportion to each domain's share of the bank.
    const domains = [...new Set(bank.map((q) => q.domain))];
    const picked: Question[] = [];
    for (const d of domains) {
      const pool = shuffle(bank.filter((q) => q.domain === d));
      picked.push(...pool.slice(0, Math.max(1, Math.round((pool.length / bank.length) * n))));
    }
    return shuffle(picked).slice(0, n);
  }
  return prioritise(bank, attempts).slice(0, n);
}
