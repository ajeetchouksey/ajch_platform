import React from 'react';
import type { ElementType } from 'react';

// ─── Variant map ─────────────────────────────────────────────────────────────
const VARIANTS = {
  primary: 'bg-violet-600 hover:bg-violet-500 text-white border-transparent shadow-sm hover:shadow-violet-500/25',
  ghost:   'bg-transparent hover:bg-slate-800/70 text-slate-400 hover:text-white border-transparent',
  outline: 'bg-transparent hover:bg-violet-500/10 text-violet-300 border-violet-500/30 hover:border-violet-400/60',
  danger:  'bg-transparent hover:bg-red-500/10 text-red-400 border-red-500/30 hover:border-red-400/60',
} as const;

type ButtonVariant = keyof typeof VARIANTS;

const SIZES = {
  xs: 'px-2 py-1 text-[10px] gap-1',
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
} as const;

type ButtonSize = keyof typeof SIZES;

// ─── Props ───────────────────────────────────────────────────────────────────
interface ButtonProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ElementType;
  /** Icon on right side instead of left */
  iconRight?: ElementType;
  onClick?: () => void;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  title?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function Button({
  children,
  variant = 'outline',
  size = 'sm',
  icon: Icon,
  iconRight: IconRight,
  onClick,
  href,
  target,
  rel,
  disabled = false,
  className = '',
  type = 'button',
  title,
}: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center font-medium rounded-lg border',
    'transition-all duration-200 active:scale-95',
    VARIANTS[variant],
    SIZES[size],
    disabled ? 'opacity-40 pointer-events-none' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      {Icon && <Icon size={size === 'xs' ? 10 : size === 'sm' ? 13 : 15} />}
      {children}
      {IconRight && <IconRight size={size === 'xs' ? 10 : size === 'sm' ? 13 : 15} />}
    </>
  );

  if (href) {
    return (
      <a href={href} target={target} rel={rel} className={base} title={title}>
        {content}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={base} title={title}>
      {content}
    </button>
  );
}
