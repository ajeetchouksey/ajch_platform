import { useState, useMemo, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Activity, BarChart2, BookOpen, Globe, Monitor, Lock, Pause, Play, Users, Eye, Clock, TrendingUp, Wifi } from 'lucide-react';
import { useGA4 } from '../hooks/useGA4';
import { useGA4Realtime } from '../hooks/useGA4Realtime';
import { KpiCard } from '../components/KpiCard';
import { HBarChart } from '../components/HBarChart';
import { DonutChart } from '../components/DonutChart';
import { SparkLine } from '../components/SparkLine';
import { SkeletonCard, SkeletonRow } from '../components/Skeleton';

const OWNER_LOGIN = 'ajeetchouksey';

type Tab = 'overview' | 'content' | 'exams' | 'sources' | 'audience';
type DateRange = '7d' | '28d' | '90d';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',  label: 'Overview',  icon: <BarChart2 size={14} /> },
  { id: 'content',   label: 'Content',   icon: <BookOpen size={14} /> },
  { id: 'exams',     label: 'Exams',     icon: <Monitor size={14} /> },
  { id: 'sources',   label: 'Sources',   icon: <Globe size={14} /> },
  { id: 'audience',  label: 'Audience',  icon: <Users size={14} /> },
];

const DATE_RANGES: { id: DateRange; label: string; start: string }[] = [
  { id: '7d',  label: '7 days',  start: '7daysAgo'  },
  { id: '28d', label: '28 days', start: '28daysAgo' },
  { id: '90d', label: '90 days', start: '90daysAgo' },
];

function fmtSecs(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.round(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function fmtNum(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function pct(a: number, b: number): string {
  return b ? `${((a / b) * 100).toFixed(1)}%` : '—';
}

function SectionCard({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">{title}</h3>
      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div> : children}
    </div>
  );
}

// ── Realtime panel ────────────────────────────────────────────────────────────

function RealtimePanel() {
  const [paused, setPaused] = useState(false);
  const { data, loading, error, lastUpdated } = useGA4Realtime(paused);

  const activeUsers = useMemo(() => {
    if (!data?.rows) return 0;
    return data.rows.reduce((sum, r) => sum + parseInt(r.metricValues[0].value, 10), 0);
  }, [data]);

  const topPages = useMemo(() => {
    if (!data?.rows) return [];
    const map = new Map<string, number>();
    for (const r of data.rows) {
      const page = r.dimensionValues[0].value;
      map.set(page, (map.get(page) ?? 0) + parseInt(r.metricValues[0].value, 10));
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label, value }));
  }, [data]);

  const topCountries = useMemo(() => {
    if (!data?.rows) return [];
    const map = new Map<string, number>();
    for (const r of data.rows) {
      const country = r.dimensionValues[1].value;
      if (country && country !== '(not set)') {
        map.set(country, (map.get(country) ?? 0) + parseInt(r.metricValues[0].value, 10));
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value }));
  }, [data]);

  const sparkPoints = useMemo(() => {
    if (!data?.rows) return [];
    const map = new Map<string, number>();
    for (const r of data.rows) {
      const min = r.dimensionValues[2].value;
      map.set(min, (map.get(min) ?? 0) + parseInt(r.metricValues[0].value, 10));
    }
    return [...map.entries()].sort((a, b) => parseInt(b[0], 10) - parseInt(a[0], 10)).reverse().map(([, v]) => v);
  }, [data]);

  return (
    <div className="rounded-xl p-5 border border-emerald-500/20" style={{ background: 'rgba(16,185,129,0.04)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-semibold text-emerald-300 uppercase tracking-widest">Live</h3>
          {lastUpdated && <span className="text-[10px] text-slate-500">{lastUpdated.toLocaleTimeString()}</span>}
        </div>
        <button onClick={() => setPaused(p => !p)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
          {paused ? <><Play size={11} /> Resume</> : <><Pause size={11} /> Pause</>}
        </button>
      </div>

      {loading && !data && <SkeletonCard />}
      {error && <p className="text-xs text-rose-400">{error}</p>}

      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-4xl font-bold text-emerald-300 tabular-nums">{activeUsers}</p>
            <p className="text-xs text-slate-400">active users right now</p>
            {sparkPoints.length > 1 && (
              <div className="mt-2">
                <SparkLine points={sparkPoints} color="#34d399" width={160} height={36} />
                <p className="text-[10px] text-slate-600 mt-1">last {sparkPoints.length} min</p>
              </div>
            )}
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Top pages</p>
            <HBarChart rows={topPages} accent="#34d399" />
          </div>

          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Countries</p>
            <HBarChart rows={topCountries} accent="#6ee7b7" />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ dateRange }: { dateRange: DateRange }) {
  const dr = DATE_RANGES.find(d => d.id === dateRange)!;
  const range = { startDate: dr.start, endDate: 'today' };

  const kpiQ = useGA4({ dateRange: range, dimensions: [], metrics: [
    { name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
    { name: 'averageSessionDuration' }, { name: 'engagementRate' }, { name: 'bounceRate' },
  ], limit: 1 });

  const sessionsQ = useGA4({ dateRange: range, dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 90 });

  const row = kpiQ.data?.rows?.[0];
  const metrics = row ? {
    users:    parseInt(row.metricValues[0].value, 10),
    sessions: parseInt(row.metricValues[1].value, 10),
    views:    parseInt(row.metricValues[2].value, 10),
    duration: parseFloat(row.metricValues[3].value),
    engagement: parseFloat(row.metricValues[4].value),
    bounce:   parseFloat(row.metricValues[5].value),
  } : null;

  const sessionsChartData = useMemo(() => {
    return sessionsQ.data?.rows?.map(r => ({
      date: r.dimensionValues[0].value,
      sessions: parseInt(r.metricValues[0].value, 10),
      views: parseInt(r.metricValues[1].value, 10),
    })) ?? [];
  }, [sessionsQ.data]);

  const sessionPoints = sessionsChartData.map(d => d.sessions);
  const viewPoints = sessionsChartData.map(d => d.views);

  return (
    <div className="space-y-4">
      <RealtimePanel />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiQ.loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <KpiCard label="Users" value={metrics ? fmtNum(metrics.users) : '—'} accent="#a78bfa" icon={<Users size={14} />} />
          <KpiCard label="Sessions" value={metrics ? fmtNum(metrics.sessions) : '—'} accent="#818cf8" icon={<Activity size={14} />} />
          <KpiCard label="Pageviews" value={metrics ? fmtNum(metrics.views) : '—'} accent="#67e8f9" icon={<Eye size={14} />} />
          <KpiCard label="Avg Duration" value={metrics ? fmtSecs(metrics.duration) : '—'} accent="#f472b6" icon={<Clock size={14} />} />
          <KpiCard label="Engagement" value={metrics ? pct(metrics.engagement, 1) : '—'} accent="#4ade80" icon={<TrendingUp size={14} />} />
          <KpiCard label="Bounce Rate" value={metrics ? `${(metrics.bounce * 100).toFixed(1)}%` : '—'} accent="#fb923c" icon={<Wifi size={14} />} />
        </>}
      </div>

      {sessionsChartData.length > 0 && (
        <SectionCard title="Sessions & Pageviews over time">
          <div className="flex items-end gap-4 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-violet-400 inline-block" /> Sessions</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Pageviews</div>
          </div>
          <div className="relative">
            <SparkLine points={sessionPoints} color="#a78bfa" width={700} height={80} />
            <div className="absolute inset-0 pointer-events-none">
              <SparkLine points={viewPoints} color="#67e8f9" width={700} height={80} />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>{sessionsChartData[0]?.date}</span>
            <span>{sessionsChartData[sessionsChartData.length - 1]?.date}</span>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ── Content tab ───────────────────────────────────────────────────────────────

function ContentTab({ dateRange }: { dateRange: DateRange }) {
  const dr = DATE_RANGES.find(d => d.id === dateRange)!;
  const range = { startDate: dr.start, endDate: 'today' };

  const topPagesQ = useGA4({ dateRange: range,
    dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' }, { name: 'bounceRate' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 20 });

  const blogQ = useGA4({ dateRange: range,
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' }, { name: 'sessions' }],
    dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' } } },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 20 });

  const [prefixFilter, setPrefixFilter] = useState('all');
  const FILTERS = ['all', '/blog', '/skillup', '/tools', '/horizons'];

  const filteredPages = useMemo(() => {
    const rows = topPagesQ.data?.rows ?? [];
    return rows
      .filter(r => prefixFilter === 'all' || r.dimensionValues[0].value.startsWith(prefixFilter))
      .map(r => ({
        path: r.dimensionValues[0].value,
        title: r.dimensionValues[1].value,
        views: parseInt(r.metricValues[0].value, 10),
        duration: parseFloat(r.metricValues[1].value),
        bounce: parseFloat(r.metricValues[2].value),
      }));
  }, [topPagesQ.data, prefixFilter]);

  return (
    <div className="space-y-4">
      <SectionCard title="Top Pages" loading={topPagesQ.loading}>
        <div className="flex gap-2 mb-4 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setPrefixFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${prefixFilter === f ? 'border-violet-500/60 bg-violet-500/15 text-violet-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left pb-2 font-medium">Path</th>
              <th className="text-right pb-2 font-medium">Views</th>
              <th className="text-right pb-2 font-medium">Avg Time</th>
              <th className="text-right pb-2 font-medium">Bounce</th>
            </tr></thead>
            <tbody>
              {filteredPages.map((p, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                  <td className="py-2 text-slate-300 truncate max-w-xs">{p.path}</td>
                  <td className="py-2 text-right tabular-nums text-slate-200">{p.views.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums text-slate-400">{fmtSecs(p.duration / Math.max(p.views, 1))}</td>
                  <td className="py-2 text-right tabular-nums text-slate-400">{(p.bounce * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Blog Post League Table" loading={blogQ.loading}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left pb-2 font-medium">Post</th>
              <th className="text-right pb-2 font-medium">Views</th>
              <th className="text-right pb-2 font-medium">Avg Read</th>
            </tr></thead>
            <tbody>
              {(blogQ.data?.rows ?? []).map((r, i) => {
                const path = r.dimensionValues[0].value;
                const views = parseInt(r.metricValues[0].value, 10);
                const dur = parseFloat(r.metricValues[1].value);
                const sess = parseInt(r.metricValues[2].value, 10);
                const slug = path.replace('/blog/', '');
                return (
                  <tr key={i} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                    <td className="py-2 text-slate-300 truncate max-w-xs">{slug}</td>
                    <td className="py-2 text-right tabular-nums text-slate-200">{views.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums text-slate-400">{fmtSecs(dur / Math.max(sess, 1))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Exams tab ─────────────────────────────────────────────────────────────────

function ExamsTab({ dateRange }: { dateRange: DateRange }) {
  const dr = DATE_RANGES.find(d => d.id === dateRange)!;
  const range = { startDate: dr.start, endDate: 'today' };

  const examQ = useGA4({ dateRange: range, dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
    dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/skillup/' } } },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 30 });

  const toolQ = useGA4({ dateRange: range, dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }],
    dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/tools/' } } },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 15 });

  const examPageRows = useMemo(() => (examQ.data?.rows ?? []).map(r => ({
    label: r.dimensionValues[0].value.replace('/skillup/', ''),
    value: parseInt(r.metricValues[0].value, 10),
  })), [examQ.data]);

  const toolRows = useMemo(() => (toolQ.data?.rows ?? []).map(r => ({
    label: r.dimensionValues[0].value.replace('/tools/', ''),
    value: parseInt(r.metricValues[0].value, 10),
  })), [toolQ.data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionCard title="Exam Page Views" loading={examQ.loading}>
        <HBarChart rows={examPageRows} accent="#818cf8" />
      </SectionCard>
      <SectionCard title="Tool Usage" loading={toolQ.loading}>
        <HBarChart rows={toolRows} accent="#f472b6" />
      </SectionCard>
    </div>
  );
}

// Color maps outside components to avoid useMemo exhaustive-deps warnings
const CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#a78bfa',
  'Direct': '#67e8f9',
  'Referral': '#4ade80',
  'Organic Social': '#f472b6',
  'Email': '#fb923c',
};
const DEVICE_COLORS: Record<string, string> = { desktop: '#a78bfa', mobile: '#67e8f9', tablet: '#4ade80' };

// ── Sources tab ───────────────────────────────────────────────────────────────

function SourcesTab({ dateRange }: { dateRange: DateRange }) {
  const dr = DATE_RANGES.find(d => d.id === dateRange)!;
  const range = { startDate: dr.start, endDate: 'today' };

  const channelQ = useGA4({ dateRange: range, dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 10 });

  const referrerQ = useGA4({ dateRange: range, dimensions: [{ name: 'sessionSource' }],
    metrics: [{ name: 'sessions' }, { name: 'totalUsers' }],
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 15 });

  const channelSegments = useMemo(() => (channelQ.data?.rows ?? []).map(r => ({
    label: r.dimensionValues[0].value,
    value: parseInt(r.metricValues[0].value, 10),
    color: CHANNEL_COLORS[r.dimensionValues[0].value] ?? '#64748b',
  })), [channelQ.data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SectionCard title="Traffic Channels" loading={channelQ.loading}>
        {channelSegments.length > 0 && <DonutChart segments={channelSegments} />}
      </SectionCard>

      <SectionCard title="Top Referrers" loading={referrerQ.loading}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left pb-2 font-medium">Source</th>
              <th className="text-right pb-2 font-medium">Sessions</th>
              <th className="text-right pb-2 font-medium">Users</th>
            </tr></thead>
            <tbody>
              {(referrerQ.data?.rows ?? []).map((r, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="py-2 text-slate-300">{r.dimensionValues[0].value || '(direct)'}</td>
                  <td className="py-2 text-right tabular-nums text-slate-200">{parseInt(r.metricValues[0].value, 10).toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums text-slate-400">{parseInt(r.metricValues[1].value, 10).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Audience tab ──────────────────────────────────────────────────────────────

function AudienceTab({ dateRange }: { dateRange: DateRange }) {
  const dr = DATE_RANGES.find(d => d.id === dateRange)!;
  const range = { startDate: dr.start, endDate: 'today' };

  const deviceQ = useGA4({ dateRange: range, dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }], limit: 5 });
  const browserQ = useGA4({ dateRange: range, dimensions: [{ name: 'browser' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 10 });
  const countryQ = useGA4({ dateRange: range, dimensions: [{ name: 'country' }], metrics: [{ name: 'totalUsers' }, { name: 'sessions' }], orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }], limit: 15 });
  const nvr = useGA4({ dateRange: range, dimensions: [{ name: 'newVsReturning' }], metrics: [{ name: 'sessions' }], limit: 3 });


  const deviceSegments = useMemo(() => (deviceQ.data?.rows ?? []).map(r => ({
    label: r.dimensionValues[0].value,
    value: parseInt(r.metricValues[0].value, 10),
    color: DEVICE_COLORS[r.dimensionValues[0].value.toLowerCase()] ?? '#64748b',
  })), [deviceQ.data]);

  const nvrSegments = useMemo(() => (nvr.data?.rows ?? []).map(r => ({
    label: r.dimensionValues[0].value,
    value: parseInt(r.metricValues[0].value, 10),
    color: r.dimensionValues[0].value === 'new' ? '#a78bfa' : '#4ade80',
  })), [nvr.data]);

  const countryRows = useMemo(() => (countryQ.data?.rows ?? []).map(r => ({
    label: r.dimensionValues[0].value,
    value: parseInt(r.metricValues[0].value, 10),
  })), [countryQ.data]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard title="Device Category" loading={deviceQ.loading}>
          {deviceSegments.length > 0 && <DonutChart segments={deviceSegments} />}
        </SectionCard>
        <SectionCard title="New vs Returning" loading={nvr.loading}>
          {nvrSegments.length > 0 && <DonutChart segments={nvrSegments} />}
        </SectionCard>
        <SectionCard title="Top Browsers" loading={browserQ.loading}>
          <HBarChart rows={(browserQ.data?.rows ?? []).map(r => ({ label: r.dimensionValues[0].value, value: parseInt(r.metricValues[0].value, 10) }))} accent="#f472b6" />
        </SectionCard>
      </div>
      <SectionCard title="Top Countries" loading={countryQ.loading}>
        <HBarChart rows={countryRows} accent="#67e8f9" maxRows={15} />
      </SectionCard>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Monitoring() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('28d');

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const isOwner = user?.login === OWNER_LOGIN;

  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
          <Lock size={22} className="text-slate-400" />
        </div>
        <h2 className="text-base font-semibold text-white mb-2">Sign in required</h2>
        <p className="text-sm text-slate-400">This page is restricted to the platform owner.</p>
      </div>
    );
  }

  if (!authLoading && !isOwner) return <Navigate to="/" replace />;

  return (
    <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="page-eyebrow">Platform Intelligence</p>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={20} className="text-violet-400" />
            <h1 className="text-xl font-bold tracking-tight"><span className="heading-gradient">Monitoring</span></h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Owner</span>
          </div>
          <p className="text-sm text-slate-400">GA4 analytics — real-time + historical. Visible only to @{OWNER_LOGIN}.</p>
        </div>

        {!import.meta.env.VITE_GA4_PROXY_URL && (
          <div className="text-xs text-amber-400 border border-amber-500/30 rounded-lg px-3 py-2 bg-amber-500/10">
            VITE_GA4_PROXY_URL not set — data unavailable
          </div>
        )}
      </div>

      {authLoading && <p className="text-slate-500 text-sm animate-pulse py-12 text-center">Checking auth…</p>}

      {!authLoading && isOwner && (
        <>
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div className="flex gap-1">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${tab === t.id ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'text-slate-400 hover:text-white border border-transparent'}`}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {DATE_RANGES.map(d => (
                <button key={d.id} onClick={() => setDateRange(d.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${dateRange === d.id ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          {tab === 'overview'  && <OverviewTab dateRange={dateRange} />}
          {tab === 'content'   && <ContentTab dateRange={dateRange} />}
          {tab === 'exams'     && <ExamsTab dateRange={dateRange} />}
          {tab === 'sources'   && <SourcesTab dateRange={dateRange} />}
          {tab === 'audience'  && <AudienceTab dateRange={dateRange} />}
        </>
      )}
    </div>
  );
}
