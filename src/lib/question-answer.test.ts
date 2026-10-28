import { describe, expect, it } from 'vitest';
import { answerLetters, correctSet, isMulti, isRight, pickComplete, togglePick } from './question-answer';
import type { Question } from '@/types/content';

const base = { domain: 1, id: 'q', scenario: '', question: '?', explanation: '', tags: ['t'] };
const single: Question = { ...base, options: ['a', 'b', 'c', 'd'], correct: 2 };
const multi: Question = { ...base, options: ['a', 'b', 'c', 'd', 'e'], correct: 3, answers: [3, 1] };

describe('question-answer', () => {
  it('treats items without answers as single-answer', () => {
    expect(isMulti(single)).toBe(false);
    expect(correctSet(single)).toEqual([2]);
    expect(isRight(single, [2])).toBe(true);
    expect(isRight(single, [1])).toBe(false);
  });

  it('needs the exact set for multiple-select, in any order', () => {
    expect(correctSet(multi)).toEqual([1, 3]);
    expect(isRight(multi, [3, 1])).toBe(true);
    expect(isRight(multi, [1])).toBe(false);
    expect(isRight(multi, [1, 2])).toBe(false);
  });

  it('names the answer letters', () => {
    expect(answerLetters(single)).toBe('C');
    expect(answerLetters(multi)).toBe('B and D');
  });

  it('toggles picks up to the required count', () => {
    expect(togglePick(single, [1], 3)).toEqual([3]);
    let p = togglePick(multi, [], 4);
    p = togglePick(multi, p, 0);
    expect(p).toEqual([0, 4]);
    expect(togglePick(multi, p, 2)).toEqual([0, 4]);
    expect(togglePick(multi, p, 4)).toEqual([0]);
    expect(pickComplete(multi, [0, 4])).toBe(true);
    expect(pickComplete(multi, [0])).toBe(false);
  });
});
