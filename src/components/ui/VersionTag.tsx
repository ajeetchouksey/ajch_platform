import { Tag } from 'lucide-react';

// ─── Props ───────────────────────────────────────────────────────────────────
interface VersionTagProps {
  version: string;
  /** violet highlight style (for featured/current version) */
  highlight?: boolean;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
export function VersionTag({ version, highlight = false, className = '' }: VersionTagProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold',
        highlight
          ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
          : 'bg-slate-800 text-slate-400 border border-slate-700/60',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Tag size={8} />
      {version}
    </span>
  );
}
