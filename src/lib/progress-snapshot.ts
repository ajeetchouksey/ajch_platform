// ── Before/after progress, so every action shows what it changed ──────────────
// snapshot() reads the same sources as the exam overview (readiness breakdown +
// objective mastery); diffSnapshots() turns two of them into plain-language
// changes. Milestones are celebrated once per exam.
// localStorage key: aarya_milestones_{examId}
import type { ExamConfig, TaskStatementsFile } from '@/types/content';
import { getAttempts } from '@/lib/adaptive-quiz';
import { examMastery, type MasteryStatus } from '@/lib/objective-mastery';
import { getReadinessBreakdown, getStreak } from '@/lib/study-tracker';
import { getSessions } from '@/lib/storage';
import { isValidExamId } from '@/lib/plan-generator';

export interface Snapshot {
  readiness: number;
  coverage: number; // 0–100
  objectives: Record<string, { status: MasteryStatus; title: string }>;
  strongDomains: number[];
  answered: number;
}

export function snapshot(exam: ExamConfig, statements: TaskStatementsFile | null): Snapshot {
  const attempts = getAttempts(exam.id);
  const readiness = getReadinessBreakdown(exam.id, exam.domains, getSessions(), exam.questions).overall;
  const objectives: Snapshot['objectives'] = {};
  let coverage = 0;
  const strongDomains: number[] = [];
  if (statements) {
    const m = examMastery(statements, attempts);
    coverage = Math.round(m.coverage * 100);
    for (const o of m.objectives) objectives[o.task.id] = { status: o.status, title: o.task.title };
    for (const d of exam.domains) {
      const os = m.objectives.filter((o) => o.domainId === d.id && o.total > 0);
      if (os.length && os.every((o) => o.status === 'strong')) strongDomains.push(d.id);
    }
  }
  return { readiness, coverage, objectives, strongDomains, answered: new Set(attempts.map((a) => a.questionId)).size };
}

const RANK: Record<MasteryStatus, number> = { new: 0, weak: 1, building: 2, strong: 3 };
const LABEL: Record<MasteryStatus, string> = { new: 'Not started', weak: 'Weak', building: 'Building', strong: 'Strong' };

export interface Change { kind: 'up' | 'down' | 'info'; text: string }

export function diffSnapshots(before: Snapshot, after: Snapshot): Change[] {
  const out: Change[] = [];
  const dr = after.readiness - before.readiness;
  if (dr !== 0) out.push({ kind: dr > 0 ? 'up' : 'down', text: `Readiness ${before.readiness}% → ${after.readiness}%` });
  const dc = after.coverage - before.coverage;
  if (dc > 0) out.push({ kind: 'up', text: `Objectives covered ${before.coverage}% → ${after.coverage}%` });
  for (const [id, a] of Object.entries(after.objectives)) {
    const b = before.objectives[id];
    if (!b || b.status === a.status) continue;
    // A first answer isn't progress or regress yet — just say where it landed.
    if (b.status === 'new') { out.push({ kind: 'info', text: `${id} ${a.title}: first answers, now ${LABEL[a.status]}` }); continue; }
    out.push({ kind: RANK[a.status] > RANK[b.status] ? 'up' : 'down', text: `${id} ${a.title}: ${LABEL[b.status]} → ${LABEL[a.status]}` });
  }
  const da = after.answered - before.answered;
  if (da > 0) out.push({ kind: 'info', text: `${da} new question${da === 1 ? '' : 's'} answered` });
  return out;
}

// ── Milestones ───────────────────────────────────────────────────────────────

export interface Milestone { id: string; title: string; detail: string }

const mKey = (examId: string) => `aarya_milestones_${examId}`;

function reached(examId: string): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(mKey(examId)) ?? '[]') as string[]); } catch { return new Set(); }
}

/** Milestones newly reached at this snapshot; each is returned once, ever. */
export function newMilestones(exam: ExamConfig, snap: Snapshot): Milestone[] {
  if (!isValidExamId(exam.id)) return [];
  const seen = reached(exam.id);
  const streak = getStreak(exam.id);
  const passedMock = getSessions().some((s) => s.skillId === exam.id && s.mode === 'timed' && s.finishedAt && s.total > 0 && (s.score / s.total) * 100 >= exam.passThreshold);
  const all: (Milestone & { hit: boolean })[] = [
    { id: 'first-10', title: 'First 10 questions', detail: 'Your exam map now has real data behind it.', hit: snap.answered >= 10 },
    { id: 'ready-50', title: 'Halfway ready', detail: `Readiness passed 50% for ${exam.shortTitle}.`, hit: snap.readiness >= 50 },
    { id: 'ready-pass', title: 'Above the pass line', detail: `Readiness reached ${exam.passThreshold}%. Time for timed exams.`, hit: snap.readiness >= exam.passThreshold },
    { id: 'coverage-60', title: '60% of objectives covered', detail: 'Timed exams now give a fair read of where you stand.', hit: snap.coverage >= 60 },
    { id: 'streak-3', title: '3-day streak', detail: 'Three days in a row. Habits start here.', hit: streak >= 3 },
    { id: 'streak-7', title: '7-day streak', detail: 'A full week without a gap.', hit: streak >= 7 },
    { id: 'streak-14', title: '14-day streak', detail: 'Two weeks straight. This is how exams get passed.', hit: streak >= 14 },
    { id: 'mock-pass', title: 'Passed a timed exam', detail: 'Under exam conditions, above the pass mark.', hit: passedMock },
    ...snap.strongDomains.map((d) => ({
      id: `domain-${d}-strong`, title: `Domain ${d} is strong`,
      detail: exam.domains.find((x) => x.id === d)?.title ?? '', hit: true,
    })),
  ];
  const fresh = all.filter((m) => m.hit && !seen.has(m.id));
  if (fresh.length) {
    for (const m of fresh) seen.add(m.id);
    try { localStorage.setItem(mKey(exam.id), JSON.stringify([...seen])); } catch { /* storage unavailable */ }
  }
  return fresh.map(({ id, title, detail }) => ({ id, title, detail }));
}
