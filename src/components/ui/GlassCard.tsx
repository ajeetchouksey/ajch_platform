import React from 'react';

// ─── Accent token map ───────────────────────────────────────────────────────
export const ACCENT = { // eslint-disable-line react-refresh/only-export-components
  violet:  'linear-gradient(90deg,#7c3aed,#a78bfa)',
  blue:    'linear-gradient(90deg,#1d4ed8,#60a5fa)',
  emerald: 'linear-gradient(90deg,#065f46,#34d399)',
  amber:   'linear-gradient(90deg,#92400e,#fbbf24)',
  rose:    'linear-gradient(90deg,#9f1239,#fb7185)',
  purple:  'linear-gradient(90deg,#581c87,#c084fc)',
  slate:   'linear-gradient(90deg,#334155,#94a3b8)',
} as const;

export type AccentKey = keyof typeof ACCENT;

// ─── Props ──────────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  /** Accent color key OR raw CSS gradient string for the 2px top border strip */
  accent?: AccentKey | string;
  className?: string;
  rounded?: 'lg' | 'xl' | '2xl';
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
  /** Additional border classes e.g. 'border-violet-500/40' */
  border?: string;
  /** Additional shadow classes e.g. 'shadow-violet-500/20' */
  shadow?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────
export function GlassCard({
  children,
  accent,
  className = '',
  rounded = 'xl',
  onClick,
  onMouseEnter,
  onMouseLeave,
  style,
  border = 'border-slate-700/40',
  shadow,
}: GlassCardProps) {
  const accentValue = accent
    ? (ACCENT[accent as AccentKey] ?? accent)
    : undefined;

  const mergedStyle: React.CSSProperties = {
    ...(accentValue ? ({ '--accent-color': accentValue } as React.CSSProperties) : {}),
    ...style,
  };

  return (
    <div
      className={[
        'glass-card',
        accentValue ? 'card-accent-top' : '',
        `rounded-${rounded}`,
        'border',
        border,
        shadow ?? '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={mergedStyle}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  );
}
