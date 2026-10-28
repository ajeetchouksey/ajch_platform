import { describe, it, expect, beforeEach } from 'vitest';

import { daysToExam, expectedToday, forecast, getProfile, reminderIcs, saveProfile, setupSkipped, skipSetup, type PrepProfile } from './prep-profile';
import { buildToday, recentMisses } from './today-session';
import { diffSnapshots, type Snapshot } from './progress-snapshot';
import type { ExamConfig, QuestionAttempt } from '@/types/content';

const DAY = 86_400_000;
const NOW = new Date('2026-10-28T10:00:00').getTime();
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function profile(over: Partial<PrepProfile> = {}): PrepProfile {
  return { goal: 'booked', examDate: iso(NOW + 28 * DAY), level: 'some', minsPerDay: 30, days: [true, true, true, true, true, false, false], start: 'test', createdAt: NOW, ...over };
}

const exam = {
  id: 'ab731', shortTitle: 'AB-731', title: 'AI Transformation Leader', questions: 67, passThreshold: 70, duration: '45 min',
  domains: [{ id: 1, title: 'D1', weight: 40 }, { id: 2, title: 'D2', weight: 35 }, { id: 3, title: 'D3', weight: 25 }],
} as unknown as ExamConfig;

function attempt(id: string, correct: boolean, ago: number): QuestionAttempt {
  return { questionId: id, examId: 'ab731', domain: 1, chosenIndex: 0, correct, timeSpentMs: 1000, attemptedAt: NOW - ago, loop: 1 };
}

beforeEach(() => localStorage.clear());

describe('prep profile', () => {
  it('saves, reads back and clears the skip flag', () => {
    skipSetup('ab731');
    expect(setupSkipped('ab731')).toBe(true);
    saveProfile('ab731', profile());
    expect(getProfile('ab731')?.minsPerDay).toBe(30);
    expect(setupSkipped('ab731')).toBe(false);
  });

  it('counts days to the exam, none when exploring', () => {
    expect(daysToExam(profile(), NOW)).toBe(28);
    expect(daysToExam(profile({ goal: 'explore' }), NOW)).toBeNull();
  });
});

describe('forecast', () => {
  it('more time a day means a higher end point', () => {
    const low = forecast(profile({ minsPerDay: 15 }), 0, NOW);
    const high = forecast(profile({ minsPerDay: 60 }), 0, NOW);
    expect(high.end).toBeGreaterThan(low.end);
    expect(low.curve).toHaveLength(13);
  });

  it('suggests realistic minutes when short, never more than 90', () => {
    const f = forecast(profile({ level: 'new', minsPerDay: 15, examDate: iso(NOW + 21 * DAY) }), 0, NOW);
    expect(f.end).toBeLessThan(70);
    expect(f.minsNeeded === null || f.minsNeeded <= 90).toBe(true);
  });

  it('starts from real readiness when the learner already has some', () => {
    expect(forecast(profile(), 55, NOW).start).toBe(55);
  });

  it("doesn't judge pace in the first days", () => {
    expect(expectedToday(profile(), NOW + DAY)).toBeNull();
    expect(expectedToday(profile(), NOW + 7 * DAY)).not.toBeNull();
  });
});

describe('buildToday', () => {
  const base = { exam, profile: profile(), mastery: null, dueCards: 0, readiness: 0, now: NOW };

  it('first session follows "how do you want to start"', () => {
    expect(buildToday({ ...base, attempts: [], minutes: 30 }).steps[0].kind).toBe('baseline');
    expect(buildToday({ ...base, profile: profile({ start: 'learn' }), attempts: [], minutes: 30 }).steps[0].kind).toBe('notes');
    expect(buildToday({ ...base, profile: profile({ start: 'practise' }), attempts: [], minutes: 30 }).steps[0].kind).toBe('drill');
  });

  it('due cards and recent misses come first; 5 minutes keeps it to the essentials', () => {
    const attempts = [attempt('q1', false, DAY), attempt('q2', true, DAY), attempt('q3', false, 10 * DAY)];
    const long = buildToday({ ...base, attempts, dueCards: 6, minutes: 30 });
    expect(long.steps.map((s) => s.kind).slice(0, 2)).toEqual(['cards', 'missed']);
    const short = buildToday({ ...base, attempts, dueCards: 6, minutes: 5 });
    expect(short.steps.map((s) => s.kind)).toEqual(['cards']);
  });

  it('only counts misses from the last few days', () => {
    expect(recentMisses([attempt('a', false, DAY), attempt('b', false, 9 * DAY)], NOW)).toEqual(['a']);
  });

  it('flags a rest day', () => {
    const saturday = new Date('2026-10-31T10:00:00').getTime();
    expect(buildToday({ ...base, attempts: [attempt('a', true, DAY)], minutes: 15, now: saturday }).restDay).toBe(true);
  });
});

describe('diffSnapshots', () => {
  it('reports readiness, coverage and objective moves in plain words', () => {
    const before: Snapshot = { readiness: 10, coverage: 5, objectives: { '1.3': { status: 'weak', title: 'ROI' } }, strongDomains: [], answered: 3 };
    const after: Snapshot = { readiness: 14, coverage: 12, objectives: { '1.3': { status: 'building', title: 'ROI' } }, strongDomains: [], answered: 8 };
    const texts = diffSnapshots(before, after).map((c) => c.text);
    expect(texts).toContain('Readiness 10% → 14%');
    expect(texts).toContain('1.3 ROI: Weak → Building');
    expect(texts).toContain('5 new questions answered');
  });
});

describe('reminderIcs', () => {
  it('repeats weekly on study days until the exam', () => {
    const ics = reminderIcs('AB-731', 'ab731', profile(), '19:00', 'https://aaryaai.dev');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=');
    expect(ics).toContain('https://aaryaai.dev/skillup/ab731');
  });
});
