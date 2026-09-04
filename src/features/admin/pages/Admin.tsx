import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth, useIsOwner, OWNER_LOGIN } from '@/lib/auth';
import { BarChart2, Activity, Video, GitPullRequest, Lock, ChevronRight, ShieldAlert, KeyRound, CheckCircle2, LogOut } from 'lucide-react';

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
  {
    to: '/admin/reactions',
    icon: BarChart2,
    label: 'Content Reactions',
    desc: 'See which content you liked, needs work, or bookmarked — your personal engagement dashboard.',
    color: 'text-violet-400',
    bg: 'rgba(139,92,246,0.08)',
    border: 'rgba(139,92,246,0.22)',
  },
  {
    to: '/admin/comments',
    icon: ShieldAlert,
    label: 'Comment Moderation',
    desc: 'Hide/unhide, lock/unlock threads or an entire page\u2019s comment section (IDEA-0009 Phase 4).',
    color: 'text-amber-400',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.22)',
  },
];

export default function Admin() {
  const { user, token, isLoading: authLoading, loginWithToken, logout } = useAuth();
  const isOwner = useIsOwner();
  const [pat, setPat] = useState('');
  const [patError, setPatError] = useState<string | null>(null);
  const [patLoading, setPatLoading] = useState(false);

  const handlePat = async () => {
    setPatLoading(true);
    setPatError(null);
    const ok = await loginWithToken(pat.trim());
    if (!ok) setPatError('Invalid token or GitHub API error.');
    setPat('');
    setPatLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-500 text-sm animate-pulse">Checking auth…</span>
      </div>
    );
  }
  if (!isOwner) return <Navigate to="/" replace />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-2.5 mb-2">
        <Lock size={15} className="text-slate-500" />
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Admin</h1>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-900/30 text-amber-400 border border-amber-800/40 ml-1 font-semibold uppercase tracking-wider">
          owner-only
        </span>
      </div>
      <p className="text-slate-500 text-sm mb-6 ml-6">Visible only to @{OWNER_LOGIN}</p>

      {/* Token status / PAT login */}
      {token ? (
        <div className="flex items-center gap-2.5 mb-6 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-300 font-medium">
            Authenticated{user ? ` as @${user.login}` : ''}
          </span>
          <span className="text-[10px] text-slate-500 ml-1">— write ops enabled</span>
          <button onClick={logout} className="ml-auto flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
            <LogOut size={11} /> Sign out
          </button>
        </div>
      ) : (
        <div className="mb-6 rounded-xl p-4"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-2">
            <KeyRound size={13} /> Login with GitHub PAT
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Enter a PAT with <code className="px-1 rounded bg-slate-800 text-slate-300">public_repo</code> +
            <code className="ml-1 px-1 rounded bg-slate-800 text-slate-300">read:user</code> scope to enable write ops across all admin pages.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={pat}
              onChange={e => setPat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && pat.trim() && handlePat()}
              placeholder="ghp_..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 outline-none focus:border-amber-600"
            />
            <button
              disabled={!pat.trim() || patLoading}
              onClick={handlePat}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-700/40 text-amber-300 disabled:opacity-40 hover:bg-amber-700/60 transition-colors">
              {patLoading ? 'Checking...' : 'Login'}
            </button>
          </div>
          {patError && <p className="mt-2 text-xs text-red-400">{patError}</p>}
        </div>
      )}

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
