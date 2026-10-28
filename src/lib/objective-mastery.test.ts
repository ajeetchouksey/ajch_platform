import { describe, expect, it } from 'vitest';
import { examMastery } from './objective-mastery';
import type { QuestionAttempt, TaskStatementsFile } from '@/types/content';

const attempt = (questionId: string, correct: boolean, confidence?: QuestionAttempt['confidence'], at = 1): QuestionAttempt => ({
  questionId, examId: 'x', domain: 1, chosenIndex: 0, correct, timeSpentMs: 1000, attemptedAt: at, loop: 1, confidence,
});

const statements: TaskStatementsFile = {
  schemaVersion: '1', examCode: 'X',
  domains: [
    { id: 1, tasks: [{ id: '1.1', title: 'Big domain objective', questionIds: ['a', 'b'] }] },
    { id: 2, tasks: [{ id: '2.1', title: 'Small domain objective', questionIds: ['c', 'd'] }] },
  ],
};

describe('examMastery', () => {
  it('counts a correct guess as half', () => {
    const sure = examMastery(statements, [attempt('a', true, 'sure'), attempt('b', true, 'sure')]).objectives[0];
    const guessed = examMastery(statements, [attempt('a', true, 'guess'), attempt('b', true, 'sure')]).objectives[0];
    expect(sure.correct).toBe(2);
    expect(guessed.correct).toBe(1.5);
    expect(guessed.mastery).toBeLessThan(sure.mastery);
  });

  it('uses the latest attempt per question', () => {
    const m = examMastery(statements, [attempt('a', false, undefined, 1), attempt('a', true, undefined, 2)]).objectives[0];
    expect(m.correct).toBe(1);
  });

  it('picks the lowest mastery when no weights are given', () => {
    const m = examMastery(statements, [attempt('a', true), attempt('b', true), attempt('c', false)]);
    expect(m.weakest?.task.id).toBe('2.1');
  });

  it('lets a heavily weighted weak objective outrank a slightly weaker small one', () => {
    // 1.1: mastery 0.5 in a 60% domain → 30. 2.1: mastery 0 in a 10% domain → 10.
    const m = examMastery(statements, [attempt('a', true), attempt('b', false)], { 1: 60, 2: 10 });
    expect(m.weakest?.task.id).toBe('1.1');
  });
});
