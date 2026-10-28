import { describe, expect, it } from 'vitest';
import { lessonsByObjective } from './objective-sections';
import type { Question, TaskStatement } from '@/types/content';

const q = (id: string, text: string): Question => ({
  domain: 1, id, scenario: '', question: text, options: ['alpha', 'beta', 'gamma', 'delta'], correct: 0, explanation: '', tags: [],
});

const md = [
  '# D1',
  '## Overview',
  'Intro text.',
  '## Capacity Planning',
  'Throughput quotas provisioned tokens capacity planning.',
  '## Stakeholder Compliance',
  'Stakeholder compliance governance approvals regulators.',
  '## Prompt Library',
  '<!-- objective: 1.1 -->',
  'Reusable prompts catalogue.',
  '## Orphan Topic',
  'Nothing matches here at all.',
].join('\n');

const questions = [
  q('a', 'How do you size capacity planning throughput quotas?'),
  q('b', 'Which provisioned tokens capacity planning choice fits?'),
  q('c', 'Which stakeholder compliance governance step comes first?'),
];

const tasks: TaskStatement[] = [
  { id: '1.1', title: 'Analyze requirements', questionIds: ['c'] },
  { id: '1.2', title: 'Design strategy', questionIds: ['a', 'b'] },
];

describe('lessonsByObjective', () => {
  const result = lessonsByObjective(md, questions, tasks);
  const headings = (id: string) => result.objectives.find((o) => o.task.id === id)!.lessons.map((l) => l.heading);

  it('assigns a section to the objective most of its questions belong to', () => {
    expect(headings('1.2')).toEqual(['Capacity Planning']);
  });

  it('honours an explicit objective comment and strips it from the body', () => {
    expect(headings('1.1')).toEqual(['Stakeholder Compliance', 'Prompt Library']);
    const lesson = result.objectives[0].lessons.find((l) => l.heading === 'Prompt Library')!;
    expect(lesson.body).not.toContain('objective:');
  });

  it('keeps unmatched sections instead of dropping them', () => {
    expect(result.other.map((l) => l.heading)).toEqual(['Orphan Topic']);
  });

  it('skips overview-style sections', () => {
    const all = [...result.objectives.flatMap((o) => o.lessons), ...result.other].map((l) => l.heading);
    expect(all).not.toContain('Overview');
  });
});
