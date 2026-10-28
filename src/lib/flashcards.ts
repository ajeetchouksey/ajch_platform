// ── Flashcards: cards built from notes + missed questions, spaced review ──────
// Cards come from two sources:
//   1. notes — every `### Key Concept` (its one-line bolded claim) and
//      `### Exam Trap` (its note-trap text) in a domain note → buildNoteCards()
//   2. questions the learner got wrong while "sure" → addQuestionCard()
// A card enters review when it is added (addCards / addQuestionCard) or first
// rated; after that `rate()` schedules it. localStorage keys:
//   aarya_cards_{examId}      review state per card id
//   aarya_cardtext_{examId}   front/back of question-derived cards
import { correctSet } from '@/lib/question-answer';
import type { Question } from '@/types/content';
import { isValidExamId } from '@/lib/plan-generator';

export type CardKind = 'concept' | 'trap' | 'question';
export type Rating = 'again' | 'hard' | 'good';

export interface Flashcard {
  id: string;
  examId: string;
  domain: number;
  kind: CardKind;
  /** Section heading (notes cards) or question id (question cards). */
  source: string;
  front: string;
  back: string;
}

export interface CardState {
  due: number;       // Unix ms when it is next due
  interval: number;  // days; 0 = relearning today
  reps: number;
  lapses: number;
}

const MIN = 60_000;
const DAY = 86_400_000;

function stateKey(examId: string) { return `aarya_cards_${examId}`; }
function textKey(examId: string) { return `aarya_cardtext_${examId}`; }

function read<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; } catch { return fallback; }
}
function write(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

// ── Building cards from a domain note ─────────────────────────────────────────

function slug(s: string) {
  return s.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 60);
}

/** Strip markdown/HTML to readable plain text. */
export function plainText(md: string): string {
  return md
    .replace(/<[^>]+>/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Cards for one domain note: one per Key Concept claim and one per Exam Trap. */
export function buildNoteCards(examId: string, domain: number, markdown: string): Flashcard[] {
  const cards: Flashcard[] = [];
  // split into ## sections (ignore fenced code)
  const text = markdown.replace(/```[\s\S]*?```/g, '');
  const sections = text.split(/^## +/m).slice(1);
  for (const sec of sections) {
    const nl = sec.indexOf('\n');
    const heading = plainText(nl === -1 ? sec : sec.slice(0, nl));
    const body = nl === -1 ? '' : sec.slice(nl + 1);
    if (!heading || /deep dive|cheat ?sheet|exam traps?$|question patterns/i.test(heading)) continue;
    const blocks = body.split(/^### +/m).slice(1);
    for (const b of blocks) {
      const bnl = b.indexOf('\n');
      const title = plainText(bnl === -1 ? b : b.slice(0, bnl));
      const content = bnl === -1 ? '' : b.slice(bnl + 1);
      if (/^key concept/i.test(title)) {
        const claim = content.match(/\*\*([^*]{12,300})\*\*/);
        if (claim) {
          cards.push({ id: `${examId}:d${domain}:${slug(heading)}:concept`, examId, domain, kind: 'concept', source: heading,
            front: `Key idea: ${heading}`, back: plainText(claim[1]) });
        }
      } else if (/^exam trap/i.test(title)) {
        const div = content.match(/<div class="note-trap">([\s\S]*?)<\/div>/);
        const raw = div ? div[1] : content.split(/\n\s*\n/)[0];
        const trap = plainText(raw);
        if (trap.length >= 20) {
          cards.push({ id: `${examId}:d${domain}:${slug(heading)}:trap`, examId, domain, kind: 'trap', source: heading,
            front: `Exam trap: ${heading}. What's the trap?`, back: trap.length > 420 ? trap.slice(0, 417) + '…' : trap });
        }
      }
    }
  }
  return cards;
}

// ── Question-derived cards ────────────────────────────────────────────────────

export function getQuestionCards(examId: string): Flashcard[] {
  if (!isValidExamId(examId)) return [];
  return Object.values(read<Record<string, Flashcard>>(textKey(examId), {}));
}

/** Turn a question the learner got wrong into a card due now. */
export function addQuestionCard(examId: string, q: Question): Flashcard | null {
  if (!isValidExamId(examId)) return null;
  const firstSentence = (q.explanation.match(/^[^.!?]*[.!?]/) ?? [q.explanation])[0];
  const card: Flashcard = {
    id: `${examId}:q:${q.id}`, examId, domain: q.domain, kind: 'question', source: q.id,
    front: q.question,
    back: `${correctSet(q).map((i) => q.options[i]).join(' + ')}. ${plainText(firstSentence)}`.trim(),
  };
  const texts = read<Record<string, Flashcard>>(textKey(examId), {});
  texts[card.id] = card;
  write(textKey(examId), texts);
  addCards(examId, [card.id]);
  return card;
}

// ── Review state ──────────────────────────────────────────────────────────────

export function getCardStates(examId: string): Record<string, CardState> {
  if (!isValidExamId(examId)) return {};
  return read<Record<string, CardState>>(stateKey(examId), {});
}

/** Put cards into review, due now (no-op for cards already in review). */
export function addCards(examId: string, ids: string[]): number {
  if (!isValidExamId(examId)) return 0;
  const states = getCardStates(examId);
  let added = 0;
  for (const id of ids) {
    if (!states[id]) { states[id] = { due: Date.now(), interval: 0, reps: 0, lapses: 0 }; added++; }
  }
  write(stateKey(examId), states);
  return added;
}

/** Schedule a card after a rating: again → 10 min, hard → ×1.2 (≥1 day), good → 4 days then ×2.5. */
export function rate(examId: string, id: string, r: Rating): CardState {
  const states = getCardStates(examId);
  const s = states[id] ?? { due: Date.now(), interval: 0, reps: 0, lapses: 0 };
  let interval: number;
  if (r === 'again') { interval = 0; s.lapses += 1; }
  else if (r === 'hard') interval = Math.max(1, Math.round(s.interval * 1.2));
  else interval = s.interval < 4 ? 4 : Math.round(s.interval * 2.5);
  const next: CardState = { due: Date.now() + (interval === 0 ? 10 * MIN : interval * DAY), interval, reps: s.reps + 1, lapses: s.lapses };
  states[id] = next;
  write(stateKey(examId), states);
  return next;
}

/** Ids of cards in review that are due now. */
export function dueIds(examId: string, now = Date.now()): string[] {
  return Object.entries(getCardStates(examId)).filter(([, s]) => s.due <= now).map(([id]) => id);
}

export function dueCount(examId: string): number {
  return dueIds(examId).length;
}

/** Plain-language "next due" for a rating, for button labels. */
export function previewInterval(examId: string, id: string, r: Rating): string {
  const s = getCardStates(examId)[id];
  const interval = r === 'again' ? 0 : r === 'hard' ? Math.max(1, Math.round((s?.interval ?? 0) * 1.2)) : (s && s.interval >= 4 ? Math.round(s.interval * 2.5) : 4);
  return interval === 0 ? 'again today' : interval === 1 ? 'in 1 day' : `in ${interval} days`;
}
