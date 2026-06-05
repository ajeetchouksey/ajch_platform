/**
 * PageViewsBadge — shows GA4 page view count for the current or a given path.
 * Reads from public/content/stats.json via loadPlatformStats().
 *
 * AppSec: uses Object.hasOwn() + typeof number guard on byPath lookup to
 * prevent prototype-pollution reads from crafted GA4 path keys.
 */
import { Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loadPlatformStats } from '@/lib/content-loader';

interface Props {
  /** Override path — defaults to current route if omitted. */
  path?: string;
  className?: string;
}

export default function PageViewsBadge({ path, className = '' }: Props) {
  const location = useLocation();
  const [count, setCount] = useState<number | null>(null);
  const targetPath = path ?? location.pathname;

  useEffect(() => {
    loadPlatformStats()
      .then((stats) => {
        const byPath = stats.pageViews?.byPath;
        if (!byPath) return;
        // AppSec: own-property check + numeric type guard — prevents prototype reads
        const val = Object.hasOwn(byPath, targetPath) ? byPath[targetPath] : undefined;
        if (typeof val === 'number' && val > 0) {
          setCount(val);
        }
      })
      .catch(() => {});
  }, [targetPath]);

  if (count === null || count === 0) return null;

  const display =
    count >= 1000 ? `${(count / 1000).toFixed(1)}k` : `${count}`;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium ${className}`}
    >
      <Eye size={11} className="text-slate-500" />
      {display} views
    </span>
  );
}
