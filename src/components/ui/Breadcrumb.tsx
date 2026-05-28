import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export interface BreadcrumbItem {
  /** Human-readable label */
  label: string;
  /** Route to link to. Omit (or set undefined) for the current/leaf page. */
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

/**
 * Platform-standard breadcrumb.
 *
 * Always renders a Home icon as the root.
 * Parent segments are linkable; the leaf segment gets a subtle pill treatment.
 *
 * Usage (auto-built by Layout — you rarely need to use this directly):
 *   <Breadcrumb items={[{ label: 'Tools', to: '/tools' }, { label: 'Token Counter' }]} />
 */
export function Breadcrumb({ items }: BreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 overflow-x-auto">
      <ol className="flex items-center text-[11px] font-medium whitespace-nowrap" role="list">

        {/* Home root */}
        <li>
          <Link
            to="/"
            aria-label="Home"
            className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-slate-600 hover:text-violet-400 hover:bg-violet-500/10 transition-all duration-150"
          >
            <Home size={12} aria-hidden="true" />
          </Link>
        </li>

        {items.map(({ label, to }, i) => (
          <li key={i} className="flex items-center">
            {/* Separator */}
            <span className="select-none px-1 text-slate-700" aria-hidden="true">/</span>

            {to ? (
              /* Parent segment — clickable */
              <Link
                to={to}
                className="px-2 py-0.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.04] transition-all duration-150"
              >
                {label}
              </Link>
            ) : (
              /* Current page — non-interactive pill */
              <span
                aria-current="page"
                className="px-2 py-0.5 rounded-lg text-slate-300 bg-slate-800/70 border border-slate-700/30"
              >
                {label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
