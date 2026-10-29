// ── SkillUp colour code ───────────────────────────────────────────────────────
// Four families, one meaning each, always paired with an icon or a word:
//   domains     — where in the syllabus (notes, exam map, questions, cards)
//   activities  — what you're doing (hub, session steps, plan calendar)
//   note blocks — what kind of content (styled in index.css .note-block)
//   mastery     — how well you know it (ExamMap STATUS_STYLE, unchanged)
// Indigo stays the brand accent for primary actions and focus.

/** D1…D7, then repeat. Distinct from the mastery greens/ambers/roses. */
export const DOMAIN_COLORS = ['#A99BFF', '#2DD4BF', '#F472B6', '#FB923C', '#A3E635', '#E879F9', '#FACC15'] as const;

export function domainColor(id: number): string {
  return DOMAIN_COLORS[(Math.max(1, id) - 1) % DOMAIN_COLORS.length];
}

/** Hex → rgba() for tints. */
export function tint(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export type Activity = 'learn' | 'practise' | 'review' | 'mock';

export const ACTIVITY_COLORS: Record<Activity, string> = {
  learn: '#2DD4BF',
  practise: '#A99BFF',
  review: '#FBBF24',
  mock: '#FB923C',
};
