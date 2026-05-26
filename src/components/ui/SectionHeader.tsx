import type { ElementType } from 'react';
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
  className = '',
  as: Tag = 'h1',
  iconColor = 'text-violet-400',
}: SectionHeaderProps) {
  const titleSize = Tag === 'h1' ? 'text-xl font-bold' : 'text-lg font-semibold';

  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon size={Tag === 'h1' ? 20 : 16} className={iconColor} />}
        <Tag className={`${titleSize} text-white`}>{title}</Tag>
        {badge && <Badge label={badge} variant={badgeVariant} />}
      </div>
      {subtitle && (
        <p className="text-sm text-slate-400 max-w-xl">{subtitle}</p>
      )}
    </div>
  );
}
