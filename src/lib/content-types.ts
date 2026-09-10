// ── Icon + color by content type ─────────────────────────────────────────
// The one place SearchDocType's icon/color is defined — was previously
// duplicated as module-local constants inside SearchModal.tsx only;
// extracted so ComputedRelatedList can reuse the exact same per-type
// signal instead of inventing a second one (a reader should see the same
// "this is a blog post" cue in search results and in a related-content list).
import { FileText, GraduationCap, Wrench, Briefcase, Building2, FlaskConical, type LucideIcon } from 'lucide-react';
import type { SearchDocType } from './search';

export const TYPE_ICON: Record<SearchDocType, LucideIcon> = {
  blog: FileText,
  exam: GraduationCap,
  tool: Wrench,
  note: FileText,
  interview: Briefcase,
  usecase: Building2,
  lab: FlaskConical,
};

// A 7-way categorical ramp, not 7 unrelated Tailwind picks: each step is
// HSL(h, 70%, 70%) with h stepping 360/7 ≈ 51.4° around the wheel starting
// at the brand indigo hue (249°, #5B4BD6) — so `blog` (step 0) sits in the
// brand's own indigo/lilac family, and every other type is a fixed rotation
// from it, not an arbitrary swatch. Distinguishing 7 content types at a
// glance needs real hue separation, which this ramp deliberately spans
// (including hues, like step 6's blue, that the brand accent itself never
// uses) — that's expected for a semantic/categorical system, which is a
// different design job from the brand accent and isn't governed by it.
export const TYPE_COLOR: Record<SearchDocType, string> = {
  blog:      '#8D7DE8', // step 0 (249°) — brand indigo/lilac family
  interview: '#E87DE7', // step 1 (300°)
  note:      '#E87D8B', // step 2 (352°)
  tool:      '#E8CA7D', // step 3 (43°)
  lab:       '#AAE87D', // step 4 (95°)
  exam:      '#7DE8AC', // step 5 (146°)
  usecase:   '#7DC9E8', // step 6 (198°)
};

export const TYPE_LABEL: Record<SearchDocType, string> = {
  blog: 'Blog',
  exam: 'Exam',
  tool: 'Tool',
  note: 'Note',
  interview: 'Role Prep',
  usecase: 'Use Case',
  lab: 'Lab',
};
