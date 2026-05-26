import { PulsingDot } from './PulsingDot';

// ─── Props ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  src: string;
  alt: string;
  /** Ring + online indicator size */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show green online dot */
  online?: boolean;
  /** Tailwind ring color class e.g. 'ring-violet-500/50' */
  ringColor?: string;
  className?: string;
}

const SIZE_MAP = {
  sm:  { img: 'w-7 h-7',   dot: '-bottom-0.5 -right-0.5 w-2 h-2', rounded: 'rounded-lg' },
  md:  { img: 'w-10 h-10', dot: '-bottom-1 -right-1 w-2.5 h-2.5', rounded: 'rounded-xl' },
  lg:  { img: 'w-14 h-14', dot: '-bottom-1 -right-1 w-3 h-3',     rounded: 'rounded-2xl' },
  xl:  { img: 'w-20 h-20', dot: '-bottom-1 -right-1 w-3.5 h-3.5', rounded: 'rounded-2xl' },
} as const;

// ─── Component ───────────────────────────────────────────────────────────────
export function Avatar({
  src,
  alt,
  size = 'md',
  online = false,
  ringColor = 'ring-slate-700',
  className = '',
}: AvatarProps) {
  const { img, dot, rounded } = SIZE_MAP[size];

  return (
    <div className={`relative shrink-0 ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${img} ${rounded} ring-2 ${ringColor} object-cover`}
      />
      {online && (
        <span
          className={`absolute ${dot} rounded-full bg-emerald-400 ring-2 ring-slate-950 flex items-center justify-center`}
        >
          <PulsingDot active color="bg-emerald-400" size="sm" />
        </span>
      )}
    </div>
  );
}
