import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { loadPlatformStats, type PlatformStats } from '@/lib/content-loader';
import { DashboardChart } from '@/components/DashboardChart';
import {
  LayoutDashboard, Users, Eye, Clock, BookOpen, HelpCircle,
  GraduationCap, FileText, Layers, Bot, Wrench, Mail, GitBranch,
  RefreshCw,
} from 'lucide-react';

const OWNER_LOGIN = 'ajeetchouksey';

interface GistStats { email_count: number; gh_count: number }

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = '#a78bfa',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <Icon size={15} style={{ color: accent }} />
      <p className="text-2xl font-bold leading-none" style={{ color: accent }}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="text-[10px] text-slate-600 -mt-1">{sub}</p>}
    </div>
  );
}

function fmtDuration(secs: number | null): string {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function MaintainerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [gistStats, setGistStats] = useState<GistStats | null>(null);
  const [loading, setLoading] = useState(true);

  const statsGistId = import.meta.env.VITE_STATS_GIST_ID as string | undefined;

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    Promise.all([
      loadPlatformStats(),
      statsGistId
        ? fetch(
            `https://gist.githubusercontent.com/ajeetchouksey/${statsGistId}/raw/aarya-stats.json`,
            { cache: 'no-store' },
          ).then(r => r.json() as Promise<GistStats>).catch(() => null)
        : Promise.resolve(null),
    ]).then(([s, g]) => {
      setStats(s);
      setGistStats(g);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [statsGistId]);

  if (!authLoading && (!user || user.login !== OWNER_LOGIN)) {
    return <Navigate to="/maintainer" replace />;
  }

  const topPages = stats?.pageViews?.byPath
    ? Object.entries(stats.pageViews.byPath)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([label, value]) => ({ label, value }))
    : [];

  const totalSubs = gistStats ? (gistStats.email_count ?? 0) + (gistStats.gh_count ?? 0) : null;

  return (
    <div className={`space-y-7 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="page-eyebrow">Maintainer</p>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <LayoutDashboard size={18} className="text-violet-400" />
            Platform Dashboard
          </h1>
        </div>
        {stats && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <RefreshCw size={11} />
            synced {stats.pageViews?.synced_at ?? stats.generated}
          </div>
        )}
      </div>

      {loading && (
        <p className="text-slate-500 text-sm animate-pulse py-8 text-center">Loading dashboard…</p>
      )}

      {!loading && stats && (
        <>
          {/* ── Audience ─────────────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Audience</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard
                icon={Users}
                label="Users Today"
                value={stats.audience?.users_today ?? '—'}
                sub={stats.audience?.synced_at ?? undefined}
                accent="#34d399"
              />
              <StatCard
                icon={Users}
                label="Users 28d"
                value={stats.audience?.users_28d ?? '—'}
                accent="#34d399"
              />
              <StatCard
                icon={Eye}
                label="Page Views"
                value={stats.pageViews?.total?.toLocaleString() ?? '—'}
                sub={`since ${stats.pageViews?.dateFrom}`}
                accent="#60a5fa"
              />
              <StatCard
                icon={Clock}
                label="Avg Engagement"
                value={fmtDuration(stats.pageViews?.avgEngagementDurationSecs ?? null)}
                accent="#60a5fa"
              />
            </div>
          </section>

          {/* ── Subscribers ──────────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Subscribers</p>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                icon={Mail}
                label="Email"
                value={gistStats?.email_count ?? '—'}
                accent="#f59e0b"
              />
              <StatCard
                icon={GitBranch}
                label="GitHub"
                value={gistStats?.gh_count ?? '—'}
                accent="#a78bfa"
              />
              <StatCard
                icon={Users}
                label="Total"
                value={totalSubs ?? '—'}
                accent="#fb7185"
              />
            </div>
          </section>

          {/* ── Content Inventory ────────────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Content Inventory</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
              <StatCard icon={BookOpen}     label="Posts"     value={stats.platform.blog_posts} accent="#34d399" />
              <StatCard icon={HelpCircle}   label="Questions" value={stats.platform.questions}  accent="#60a5fa" />
              <StatCard icon={GraduationCap} label="Exams"   value={stats.platform.exams}       accent="#a78bfa" />
              <StatCard icon={FileText}     label="Notes"     value={stats.platform.notes}      accent="#f59e0b" />
              <StatCard icon={Layers}       label="Scenarios" value={stats.platform.scenarios}  accent="#fb7185" />
              <StatCard icon={Bot}          label="Agents"    value={stats.platform.agents}     accent="#c084fc" />
              <StatCard icon={Wrench}       label="Tools"     value={stats.platform.tools}      accent="#94a3b8" />
            </div>
          </section>

          {/* ── Top Pages ────────────────────────────────────────────── */}
          {topPages.length > 0 && (
            <section>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Top Pages</p>
              <DashboardChart title="Page Views by Path" items={topPages} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
