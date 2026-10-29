// ── Study-notes presentation helpers ──────────────────────────────────────────
// Rendering-only normalisation for the notes markdown: the content repo mixes
// three authoring styles (plain textbook, emoji-led story blocks, and the
// Key Concept / In Practice / Exam Trap standard). These helpers give all of
// them one professional presentation without editing the content itself.

import { Children, isValidElement, cloneElement, type ReactNode, type ReactElement } from 'react';
import { Lightbulb, Wrench, AlertTriangle, Brain, BookOpen, Target, ListChecks, Compass, FileText, type LucideIcon } from 'lucide-react';

// Decorative emoji (pictographs + flags, with variation selectors / ZWJ joins).
const EMOJI = /(?:(?:\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}])(?:\u{FE0F}|\u{200D}|\u{20E3})*)/u.source;
const LEADING = new RegExp(`^\\s*(?:${EMOJI}\\s*)+`, 'u');
const TRAILING = new RegExp(`\\s*(?:${EMOJI}\\s*)+$`, 'u');

/** Remove leading/trailing decorative emoji from a heading or label. */
export function stripEmoji(text: string): string {
  return text.replace(LEADING, '').replace(TRAILING, '').trim();
}

/** stripEmoji applied to the first and last string children of a node list. */
export function stripEmojiChildren(children: ReactNode): ReactNode {
  const arr: ReactNode[] = Children.toArray(children);
  if (!arr.length) return children;
  const fix = (node: ReactNode, re: RegExp): ReactNode => {
    if (typeof node === 'string') return node.replace(re, '');
    if (isValidElement<{ children?: ReactNode }>(node) && typeof node.props.children === 'string') {
      return cloneElement(node as ReactElement<{ children?: ReactNode }>, {}, node.props.children.replace(re, ''));
    }
    return node;
  };
  arr[0] = fix(arr[0], LEADING);
  arr[arr.length - 1] = fix(arr[arr.length - 1], TRAILING);
  return arr;
}

// ── Study-block headings ──────────────────────────────────────────────────────

/** Note-block kinds — each has one colour in the SkillUp colour code (index.css .note-block). */
export type BlockKind = 'story' | 'model' | 'concept' | 'practice' | 'trap' | 'watch' | 'reference';

export interface Kicker { label: string; icon: LucideIcon; tone: string; kind: BlockKind }

const KICKERS: [RegExp, Kicker][] = [
  [/^key concept\b/i,        { label: 'Key concept',    icon: Lightbulb,     tone: 'kicker-indigo',  kind: 'concept' }],
  [/^in practice\b/i,        { label: 'In practice',    icon: Wrench,        tone: 'kicker-emerald', kind: 'practice' }],
  [/^exam trap\b/i,          { label: 'Exam trap',      icon: AlertTriangle, tone: 'kicker-rose',    kind: 'trap' }],
  [/^mental model\b/i,       { label: 'Mental model',   icon: Brain,         tone: 'kicker-indigo',  kind: 'model' }],
  [/^the story\b/i,          { label: 'Story',          icon: BookOpen,      tone: 'kicker-slate',   kind: 'story' }],
  [/^(\d+\.\s*)?worked scenario\b/i, { label: 'Worked scenario', icon: FileText, tone: 'kicker-slate', kind: 'practice' }],
  [/^(\d+\.\s*)?memory aid\b/i,      { label: 'Memory aid',      icon: Brain,    tone: 'kicker-indigo', kind: 'model' }],
  [/^(\d+\.\s*)?exam strategy\b/i,   { label: 'Exam strategy',   icon: Target,   tone: 'kicker-amber', kind: 'watch' }],
  [/^(\d+\.\s*)?the connective narrative\b/i, { label: 'Narrative', icon: Compass, tone: 'kicker-slate', kind: 'story' }],
  [/^(watch out|common mistakes?|gotchas?|important)\b/i, { label: 'Watch out', icon: AlertTriangle, tone: 'kicker-amber', kind: 'watch' }],
  [/^cheat ?sheet\b/i,       { label: 'Cheat sheet',    icon: ListChecks,    tone: 'kicker-amber',   kind: 'reference' }],
];
/** Classify a study-block heading. `rest` is any title after the label ("Mental Model: \"The Restaurant Host\"" → "The Restaurant Host"). */
export function headingKicker(text: string): { kicker: Kicker; rest: string } | null {
  const clean = stripEmoji(text);
  for (const [re, kicker] of KICKERS) {
    const m = clean.match(re);
    if (m) {
      const rest = clean.slice(m[0].length).replace(/^[\s:—–-]+/, '').replace(/^["“](.*)["”]$/, '$1').trim();
      return { kicker, rest };
    }
  }
  return null;
}

/** Plain text of a React node tree (for ids and classification). */
export function nodeText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) return nodeText(node.props.children);
  return '';
}
