import { describe, it, expect, beforeEach } from 'vitest';

import { addCards, addQuestionCard, buildNoteCards, dueCount, dueIds, getCardStates, getQuestionCards, previewInterval, rate } from './flashcards';
import { matchQuestionsToSections } from './section-match';
import type { Question } from '@/types/content';

const NOTE = `# Domain 1

## Overview
Intro text.

## 1.3 Cost Drivers: Tokens & ROI

### Key Concept
**AI API cost is driven by tokens in plus tokens out, not by the number of users.**

Longer prompts cost more.

### Exam Trap
<div class="note-trap">The cheapest model per token is not always cheapest overall when wrong answers are expensive.</div>

## 1.6 Prompt Engineering

### Key Concept
**Improve the prompt with examples and brand guidelines before reaching for fine-tuning.**

## Cheat sheet
### Key Concept
**This section is skipped because it is a cheat sheet.**
`;

function q(id: string, question: string, options: string[], correct = 0): Question {
  return { id, domain: 1, scenario: '', question, options: options as Question['options'], correct: correct as Question['correct'], explanation: 'Because tokens drive cost. More text here.', tags: [] };
}

beforeEach(() => localStorage.clear());

describe('buildNoteCards', () => {
  it('makes one card per Key Concept claim and Exam Trap, skipping cheat sheets', () => {
    const cards = buildNoteCards('ab731', 1, NOTE);
    expect(cards.map((c) => c.kind)).toEqual(['concept', 'trap', 'concept']);
    expect(cards[0].back).toBe('AI API cost is driven by tokens in plus tokens out, not by the number of users.');
    expect(cards[1].back).toMatch(/cheapest model per token/);
    expect(cards[0].source).toBe('1.3 Cost Drivers: Tokens & ROI');
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });
});

describe('scheduling', () => {
  it('adds cards due now and only once', () => {
    expect(addCards('ab731', ['a', 'b'])).toBe(2);
    expect(addCards('ab731', ['a'])).toBe(0);
    expect(dueCount('ab731')).toBe(2);
  });

  it('again = 10 minutes, good = 4 days then x2.5, hard >= 1 day', () => {
    addCards('ab731', ['a']);
    rate('ab731', 'a', 'again');
    expect(dueIds('ab731')).not.toContain('a');
    expect(getCardStates('ab731').a.lapses).toBe(1);
    expect(dueIds('ab731', Date.now() + 11 * 60_000)).toContain('a');

    expect(previewInterval('ab731', 'a', 'good')).toBe('in 4 days');
    rate('ab731', 'a', 'good');
    expect(getCardStates('ab731').a.interval).toBe(4);
    expect(previewInterval('ab731', 'a', 'good')).toBe('in 10 days');
    expect(previewInterval('ab731', 'a', 'hard')).toBe('in 5 days');
    expect(previewInterval('ab731', 'a', 'again')).toBe('again today');
  });

  it('ignores unknown exam ids', () => {
    expect(addCards('../etc', ['x'])).toBe(0);
    expect(getCardStates('../etc')).toEqual({});
  });
});

describe('addQuestionCard', () => {
  it('stores the question as a due card with the right answer on the back', () => {
    const card = addQuestionCard('ab731', q('q1', 'What drives AI API cost?', ['Tokens', 'Users', 'Endpoints', 'Storage']));
    expect(card?.back).toBe('Tokens. Because tokens drive cost.');
    expect(getQuestionCards('ab731').map((c) => c.id)).toEqual(['ab731:q:q1']);
    expect(dueIds('ab731')).toContain('ab731:q:q1');
  });
});

describe('matchQuestionsToSections', () => {
  it('assigns each question to its best-matching section and skips overview/cheat sheet', () => {
    const qs = [
      q('cost', 'Which factor drives the cost of tokens for the API?', ['Tokens processed', 'Users', 'Regions', 'Storage']),
      q('prompt', 'How should the team improve prompt quality with brand guidelines?', ['Prompt engineering with examples', 'Fine-tuning', 'RAG', 'New model']),
      q('none', 'Zebra quantum lattice?', ['a', 'b', 'c', 'd']),
    ];
    const m = matchQuestionsToSections(NOTE, qs);
    expect(m.get('1.3 Cost Drivers: Tokens & ROI')?.map((x) => x.id)).toEqual(['cost']);
    expect(m.get('1.6 Prompt Engineering')?.map((x) => x.id)).toEqual(['prompt']);
    expect(m.has('Overview')).toBe(false);
    expect([...m.values()].flat().some((x) => x.id === 'none')).toBe(false);
  });
});
