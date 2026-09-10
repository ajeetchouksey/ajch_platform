import type { ElementType, ReactNode } from 'react';
import { Badge } from './Badge';
import type { BadgeVariant } from './Badge';

// ─── Props ───────────────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  /** Lucide icon component */
  icon?: ElementType;
  /** Secondary descriptive text below the title */
  subtitle?: string;
  /** Optional badge label shown next to title */
  badge?: string;
  badgeVariant?: BadgeVariant;
  /**
   * Multiple badges next to the title (e.g. category + "Featured"). Additive
   * to `badge` above — pass one or the other, not both, for a given header.
   * Added for Blog/Exam catalog headers, which need more than one badge.
   */
  badges?: { label: string; variant?: BadgeVariant }[];
  /**
   * Inline meta/stat row rendered below the subtitle (e.g. "47 posts ·
   * updated May 2026"). Added for Blog/Exam catalog headers, which had a
   * separate stats block before migrating onto this component — kept as a
   * free-form slot rather than a fixed stat-list shape, since each
   * vertical's stats differ.
   */
  stats?: ReactNode;
  className?: string;
  /** h1 (default page header) | h2 (section header) */
  as?: 'h1' | 'h2';
  /** Icon color class e.g. 'text-violet-400' */
  iconColor?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function SectionHeader({
  title,
  icon: Icon,
  subtitle,
  badge,
  badgeVariant = 'violet',
  badges,
  stats,
  className = '',
  as: Tag = 'h1',
  iconColor = 'text-violet-400',
}: SectionHeaderProps) {
  const titleSize = Tag === 'h1' ? 'text-xl font-bold' : 'text-lg font-semibold';

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        {Icon && <Icon size={Tag === 'h1' ? 20 : 16} className={iconColor} />}
        <Tag className={`${titleSize} text-white`}>{title}</Tag>
        {badge && <Badge label={badge} variant={badgeVariant} />}
        {badges?.map((b) => (
          <Badge key={b.label} label={b.label} variant={b.variant ?? 'violet'} />
        ))}
      </div>
      {subtitle && (
        <p className="text-sm text-slate-400 max-w-xl">{subtitle}</p>
      )}
      {stats && <div className="mt-2 text-xs text-slate-500">{stats}</div>}
    </div>
  );
}
