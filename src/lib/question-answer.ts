// ── One place that knows how a question is answered and scored ────────────────
import type { Question } from '@/types/content';

/** "Choose two" style items: more than one option is correct. */
export const isMulti = (q: Question): boolean => (q.answers?.length ?? 0) > 1;

/** Every correct option index, in option order. */
export const correctSet = (q: Question): number[] => (isMulti(q) ? [...q.answers!].sort((a, b) => a - b) : [q.correct]);

/** How many options the learner must pick. */
export const pickCount = (q: Question): number => correctSet(q).length;

/** Right only when the picks match the correct set exactly — no partial credit, as on the real exams. */
export function isRight(q: Question, picks: readonly number[]): boolean {
  const want = correctSet(q);
  return picks.length === want.length && want.every((i) => picks.includes(i));
}

export const letter = (i: number) => String.fromCharCode(65 + i);

/** "B" or "B and D" — for "the answer is …" copy. */
export function answerLetters(q: Question): string {
  const l = correctSet(q).map(letter);
  return l.length > 1 ? `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}` : l[0];
}

/** Toggle an option: single-answer replaces the pick, multi-select adds/removes up to the required count. */
export function togglePick(q: Question, picks: readonly number[], i: number): number[] {
  if (!isMulti(q)) return [i];
  if (picks.includes(i)) return picks.filter((x) => x !== i);
  return picks.length >= pickCount(q) ? [...picks] : [...picks, i].sort((a, b) => a - b);
}

/** Ready to check: the learner has picked as many options as the question asks for. */
export const pickComplete = (q: Question, picks: readonly number[]) => picks.length === pickCount(q);

const COUNT_WORD = ['zero', 'one', 'two', 'three', 'four', 'five'];
/** "Choose two." for multiple-select items; null for single-answer ones. */
export const pickPrompt = (q: Question): string | null => (isMulti(q) ? `Choose ${COUNT_WORD[pickCount(q)] ?? pickCount(q)}.` : null);
