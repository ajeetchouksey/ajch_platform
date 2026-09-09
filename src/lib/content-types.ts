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

export const TYPE_COLOR: Record<SearchDocType, string> = {
  blog: '#a78bfa',
  exam: '#34d399',
  tool: '#60a5fa',
  note: '#fb923c',
  interview: '#f472b6',
  usecase: '#22d3ee',
  lab: '#facc15',
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
