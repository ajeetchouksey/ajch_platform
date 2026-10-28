// ── Notes sections grouped by official objective ──────────────────────────────
// Notes are written by topic, objectives come from the study guide. A section
// belongs to the objective most of its matched questions belong to; an
// `<!-- objective: 1.2 -->` comment in the section overrides that guess.
import { matchQuestionsToSections, noteSections } from '@/lib/section-match';
import type { Question, TaskStatement } from '@/types/content';

export interface Lesson {
  heading: string;
  body: string;
  /** Minutes at 200 words per minute, at least 1. */
  minutes: number;
}

export interface ObjectiveLessons {
  task: TaskStatement;
  lessons: Lesson[];
}

export interface DomainLessons {
  objectives: ObjectiveLessons[];
  /** Sections no objective claimed — still reachable, never dropped. */
  other: Lesson[];
}

const OVERRIDE = /<!--\s*objective:\s*([\d.]+)\s*-->/i;

const minutesFor = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

export function lessonsByObjective(markdown: string, questions: Question[], tasks: TaskStatement[]): DomainLessons {
  const sections = noteSections(markdown);
  const taskOf = new Map<string, string>();
  for (const t of tasks) for (const id of t.questionIds) taskOf.set(id, t.id);
  const matches = matchQuestionsToSections(markdown, questions, Infinity);

  const byTask = new Map<string, Lesson[]>(tasks.map((t) => [t.id, []]));
  const other: Lesson[] = [];
  for (const s of sections) {
    const lesson: Lesson = { heading: s.heading, body: s.body.replace(OVERRIDE, ''), minutes: minutesFor(s.body) };
    let owner = s.body.match(OVERRIDE)?.[1];
    if (!owner || !byTask.has(owner)) {
      const votes = new Map<string, number>();
      for (const q of matches.get(s.heading) ?? []) {
        const t = taskOf.get(q.id);
        if (t) votes.set(t, (votes.get(t) ?? 0) + 1);
      }
      // Ties go to the earlier objective, so the result is stable.
      owner = [...votes].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], undefined, { numeric: true }))[0]?.[0];
    }
    if (owner && byTask.has(owner)) byTask.get(owner)!.push(lesson);
    else other.push(lesson);
  }
  return { objectives: tasks.map((task) => ({ task, lessons: byTask.get(task.id) ?? [] })), other };
}
