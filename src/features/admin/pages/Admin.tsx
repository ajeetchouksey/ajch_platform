import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { BarChart2, Activity, Video, GitPullRequest, Lock, ChevronRight, ShieldAlert } from 'lucide-react';

const OWNER_LOGIN = 'ajeetchouksey';
const DEV_BYPASS = import.meta.env.VITE_BYPASS_ADMIN_AUTH === 'true';

const PAGES = [
  {
    to: '/admin/mvp',
    icon: BarChart2,
    label: 'MVP Dashboard',
    desc: 'Track progress toward MVP targets: content coverage, community metrics, and evidence pack.',
    color: 'text-violet-400',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.22)',
  },
  {
    to: '/admin/monitoring',
    icon: Activity,
    label: 'Monitoring',
    desc: 'GA4 analytics: page views, sessions, top content, audience breakdown, and realtime.',
    color: 'text-sky-400',
    bg: 'rgba(14,165,233,0.08)',
    border: 'rgba(14,165,233,0.22)',
  },
  {
    to: '/admin/youtube',
    icon: Video,
    label: 'YouTube Tracker',
    desc: 'See which exam domains, blog posts, use cases, and tools are missing YouTube video issues.',
    color: 'text-red-400',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.22)',
  },
  {
    to: '/admin/issues',
    icon: GitPullRequest,
    label: 'Issue Board',
    desc: 'Full GitHub issue board: filter, view detail, close/reopen, and comment — all in-platform.',
    color: 'text-emerald-400',
    bg: 'rgba(16,185,129,0.08)',
    border: 'rgba(16,185,129,0.22)',
  },
];

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-500 text-sm animate-pulse">Checking auth…</span>
      </div>
    );
  }
  if (!DEV_BYPASS && (!user || user.login !== OWNER_LOGIN)) return <Navigate to="/" replace />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2.5 mb-2">
        <Lock size={15} className="text-slate-500" />
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Admin</h1>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-800/40 ml-1 font-semibold uppercase tracking-wider">
          owner-only
        </span>
      </div>
      <p className="text-slate-500 text-sm mb-8 ml-6">Visible only to @{OWNER_LOGIN}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PAGES.map(({ to, icon: Icon, label, desc, color, bg, border }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col gap-3 rounded-xl p-5 transition-all hover:scale-[1.01] hover:brightness-110"
            style={{ background: bg, border: `1px solid ${border}` }}
          >
            <div className={`flex items-center gap-2 ${color}`}>
              <Icon size={18} />
              <span className="font-semibold text-sm">{label}</span>
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl p-4 flex items-start gap-3"
        style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}>
        <ShieldAlert size={14} className="text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Write operations (close issues, add comments, create YouTube issues) require a GitHub PAT with
          <code className="mx-1 px-1 rounded bg-slate-800 text-slate-300 text-[10px]">public_repo</code>
          scope. You will be prompted inline on pages that need it.
        </p>
      </div>
    </div>
  );
}
