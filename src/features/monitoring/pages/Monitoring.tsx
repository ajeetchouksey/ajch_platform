import { useState, useMemo, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth, useIsOwner, OWNER_LOGIN } from '@/lib/auth';
import { Activity, BarChart2, BookOpen, Globe, Monitor, Lock, Pause, Play, Users, Eye, Clock, TrendingUp, Wifi, Link2, Unlink, Server, Cpu, AlertOctagon, Repeat, ArrowUpDown } from 'lucide-react';
import { useGA4 } from '../hooks/useGA4';
import { useGA4Realtime } from '../hooks/useGA4Realtime';
import { useGA4Status } from '../hooks/useGA4Status';
import { useGA4History } from '../hooks/useGA4History';
import { useGA4Retention } from '../hooks/useGA4Retention';
import { useCloudflareOverview } from '../hooks/useCloudflareOverview';
import { useCloudflareStatus } from '../hooks/useCloudflareStatus';
import { KpiCard } from '../components/KpiCard';
import { HBarChart } from '../components/HBarChart';
import { DonutChart } from '../components/DonutChart';
import { SparkLine } from '../components/SparkLine';
import { RetentionTable, type RetentionWeek } from '../components/RetentionTable';
import { SkeletonCard, SkeletonRow } from '../components/Skeleton';
import { forecast, detectAnomalies } from '../lib/forecast';

// 2026-05-01 was the originally requested backfill start, but GA4 has no data
// before this date — tracking simply wasn't collecting before then (confirmed
// via a direct GA4 query, not a retention-window truncation). Using the real
// earliest available date avoids the chart claiming a range it can't back up.
const HISTORY_START_DATE = '2026-06-02';

type Tab = 'overview' | 'content' | 'exams' | 'sources' | 'audience' | 'retention' | 'cloudflare';
type DateRange = '7d' | '28d' | '90d';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview',   label: 'Overview',   icon: <BarChart2 size={14} /> },
  { id: 'content',    label: 'Content',    icon: <BookOpen size={14} /> },
  { id: 'exams',      label: 'Exams',      icon: <Monitor size={14} /> },
  { id: 'sources',    label: 'Sources',    icon: <Globe size={14} /> },
  { id: 'audience',   label: 'Audience',   icon: <Users size={14} /> },
  { id: 'retention',  label: 'Retention',  icon: <Repeat size={14} /> },
  { id: 'cloudflare', label: 'Cloudflare', icon: <Server size={14} /> },
];

const DATE_RANGES: { id: DateRange; label: string; start: string }[] = [
  { id: '7d',  label: '7 days',  start: '7daysAgo'  },
  { id: '28d', label: '28 days', start: '28daysAgo' },
  { id: '90d', label: '90 days', start: '90daysAgo' },
];

// Equal-length immediately-prior period for each preset, used for KPI
// comparison deltas (e.g. 28d selected -> compare against the 28d before that).
const PRIOR_RANGES: Record<DateRange, { startDate: string; endDate: string }> = {
  '7d':  { startDate: '14daysAgo', endDate: '8daysAgo' },
  '28d': { startDate: '56daysAgo', endDate: '29daysAgo' },
  '90d': { startDate: '180daysAgo', endDate: '91daysAgo' },
};

// GA4's raw `date` dimension is YYYYMMDD with no separators. D1 history rows
// are already normalized (see normalizeGa4Date() in workers/ga4-proxy.ts) --
// but every *live* GA4 query on this page reads the dimension straight off
// the API response, unnormalized. Harmless when only used as a display
// label, but forecast.ts's addDays() calls `new Date()` on it, which throws
// "Invalid time value" on the un-dashed form and used to crash the whole
// Overview tab whenever the live-query fallback path was hit (before D1
// history loads, or if it's ever empty).
function normalizeGa4Date(raw: string): string {
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  return raw;
}

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
function fmtBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  if (bytes >= 1e3) return `${(bytes / 1e3).toFixed(1)} KB`;
  return `${bytes} B`;
}

function SortHeader({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <th className="text-right pb-2 font-medium cursor-pointer select-none hover:text-slate-300" onClick={onClick}>
      <span className="inline-flex items-center gap-1 justify-end">
        {label}
        <ArrowUpDown size={10} className={active ? 'text-violet-400' : 'text-slate-700'} />
      </span>
    </th>
  );
}

function SectionCard({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">{title}</h3>
      {loading ? <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}</div> : children}
    </div>
  );
}

// ── Connect GA4 Banner ────────────────────────────────────────────────────────

function ConnectGA4Banner({ onConnected }: { onConnected: () => void }) {
  const { token } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleConnect() {
    if (!token) return;
    setConnecting(true); setErr(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_GA4_PROXY_URL}/oauth/start`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Could not start OAuth (${res.status})`);
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to start OAuth');
      setConnecting(false);
    }
    void onConnected;
  }

  return (
    <div className="rounded-xl p-5 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-4"
      style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
      <div className="w-9 h-9 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center shrink-0">
        <Link2 size={16} className="text-violet-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white mb-0.5">Connect Google Analytics</p>
        <p className="text-xs text-slate-400">Authorise read-only access to GA4 so the dashboard can show real data. No billing required.</p>
        {err && <p className="text-xs text-rose-400 mt-1">{err}</p>}
      </div>
      <button onClick={handleConnect} disabled={connecting}
        className="shrink-0 px-4 py-2 rounded-lg text-xs font-semibold bg-violet-500 hover:bg-violet-400 text-white transition-colors disabled:opacity-50">
        {connecting ? 'Redirecting…' : 'Connect Google Analytics'}
      </button>
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

// ── Current vs Target (traffic) ─────────────────────────────────────────────
// Reads quarters[].trafficTargets from mvp-progress.json — the same
// current/target/quarters schema the MVP dashboard already uses for content
// metrics (see src/features/mvp/pages/MvpProgress.tsx), extended with a
// traffic block. Targets are grounded in a real backfilled baseline (see
// trafficBaseline in that file), not guessed round numbers.

interface MvpQuarter {
  id: string;
  label: string;
  start: string;
  end: string;
  trafficTargets?: { sessions: number; pageviews: number; users: number };
}

function useActiveQuarter() {
  const [quarter, setQuarter] = useState<MvpQuarter | null>(null);
  useEffect(() => {
    fetch('/content/mvp-progress.json')
      .then(r => r.json())
      .then((data: { quarters?: MvpQuarter[] }) => {
        const today = new Date().toISOString().slice(0, 10);
        const active = data.quarters?.find(q => q.start <= today && today <= q.end && q.trafficTargets);
        setQuarter(active ?? null);
      })
      .catch(() => setQuarter(null));
  }, []);
  return quarter;
}

function TargetBar({ label, actual, target, color }: { label: string; actual: number; target: number; color: string }) {
  const pct = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{fmtNum(actual)} / {fmtNum(target)} <span className="text-slate-600">({pct}%)</span></span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function CurrentVsTargetPanel({ historyRows }: { historyRows: { date: string; sessions: number; pageviews: number; users: number }[] }) {
  const quarter = useActiveQuarter();
  if (!quarter?.trafficTargets) return null;

  const today = new Date().toISOString().slice(0, 10);
  const qtdRows = historyRows.filter(r => r.date >= quarter.start && r.date <= today);
  const actualSessions = qtdRows.reduce((a, r) => a + r.sessions, 0);
  const actualPageviews = qtdRows.reduce((a, r) => a + r.pageviews, 0);
  const actualUsers = qtdRows.reduce((a, r) => a + r.users, 0);

  return (
    <SectionCard title={`Current vs Target — ${quarter.label} (${quarter.start} → ${quarter.end})`}>
      <div className="space-y-3">
        <TargetBar label="Sessions" actual={actualSessions} target={quarter.trafficTargets.sessions} color="#a78bfa" />
        <TargetBar label="Pageviews" actual={actualPageviews} target={quarter.trafficTargets.pageviews} color="#67e8f9" />
        <TargetBar label="Users" actual={actualUsers} target={quarter.trafficTargets.users} color="#4ade80" />
      </div>
      <p className="text-[10px] text-slate-600 mt-3">Target = baseline run-rate × 1.25 stretch, grounded in real backfilled data — see trafficBaseline in mvp-progress.json.</p>
    </SectionCard>
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

  // Prior equal-length period, for the "vs prev period" delta on each KPI tile —
  // meaningless numbers become "up 12%" or "down 8%".
  const kpiPriorQ = useGA4({ dateRange: PRIOR_RANGES[dateRange], dimensions: [], metrics: [
    { name: 'totalUsers' }, { name: 'sessions' }, { name: 'screenPageViews' },
    { name: 'averageSessionDuration' }, { name: 'engagementRate' }, { name: 'bounceRate' },
  ], limit: 1 });

  const sessionsQ = useGA4({ dateRange: range, dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 90 });

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const historyQ = useGA4History(HISTORY_START_DATE, today);

  const row = kpiQ.data?.rows?.[0];
  const metrics = row ? {
    users:    parseInt(row.metricValues[0].value, 10),
    sessions: parseInt(row.metricValues[1].value, 10),
    views:    parseInt(row.metricValues[2].value, 10),
    duration: parseFloat(row.metricValues[3].value),
    engagement: parseFloat(row.metricValues[4].value),
    bounce:   parseFloat(row.metricValues[5].value),
  } : null;

  const priorRow = kpiPriorQ.data?.rows?.[0];
  const priorMetrics = priorRow ? {
    users:    parseInt(priorRow.metricValues[0].value, 10),
    sessions: parseInt(priorRow.metricValues[1].value, 10),
    views:    parseInt(priorRow.metricValues[2].value, 10),
    duration: parseFloat(priorRow.metricValues[3].value),
    engagement: parseFloat(priorRow.metricValues[4].value),
    bounce:   parseFloat(priorRow.metricValues[5].value),
  } : null;

  // Delta vs the prior equal-length period. `higherIsBetter=false` flips the
  // color (e.g. bounce rate going down is the "good" direction, shown green).
  function delta(current: number | undefined, prior: number | undefined, higherIsBetter = true): { text: string; positive: boolean } | null {
    if (current === undefined || prior === undefined || !prior) return null;
    const change = (current - prior) / prior;
    return { text: `${Math.abs(change * 100).toFixed(1)}%`, positive: higherIsBetter ? change >= 0 : change <= 0 };
  }
  const usersDelta = delta(metrics?.users, priorMetrics?.users);
  const sessionsDelta = delta(metrics?.sessions, priorMetrics?.sessions);
  const viewsDelta = delta(metrics?.views, priorMetrics?.views);
  const durationDelta = delta(metrics?.duration, priorMetrics?.duration);
  const engagementDelta = delta(metrics?.engagement, priorMetrics?.engagement);
  const bounceDelta = delta(metrics?.bounce, priorMetrics?.bounce, false);

  // Prefer the persisted D1 history (fixed range since HISTORY_START_DATE, survives
  // past GA4's live-query window) — fall back to the live, 7/28/90-day-capped
  // query if history hasn't been backfilled yet (empty ANALYTICS_DB).
  const usingHistory = (historyQ.rows?.length ?? 0) > 0;
  const sessionsChartData = useMemo(() => {
    if (historyQ.rows && historyQ.rows.length > 0) {
      return historyQ.rows.map(r => ({ date: r.date, sessions: r.sessions, views: r.pageviews }));
    }
    return sessionsQ.data?.rows?.map(r => ({
      date: normalizeGa4Date(r.dimensionValues[0].value),
      sessions: parseInt(r.metricValues[0].value, 10),
      views: parseInt(r.metricValues[1].value, 10),
    })) ?? [];
  }, [historyQ.rows, sessionsQ.data]);

  const sessionForecast = useMemo(() => forecast(
    sessionsChartData.map(d => ({ date: d.date, value: d.sessions }))
  ), [sessionsChartData]);
  const viewForecast = useMemo(() => forecast(
    sessionsChartData.map(d => ({ date: d.date, value: d.views }))
  ), [sessionsChartData]);

  const sessionPoints = [...sessionsChartData.map(d => d.sessions), ...sessionForecast.projectedPoints.map(p => p.value)];
  const viewPoints = [...sessionsChartData.map(d => d.views), ...viewForecast.projectedPoints.map(p => p.value)];
  const dashedFromIndex = usingHistory && sessionsChartData.length > 0 ? sessionsChartData.length - 1 : undefined;
  const chartLabels = [
    ...sessionsChartData.map(d => d.date),
    ...sessionForecast.projectedPoints.map(p => `${p.date} (projected)`),
  ];
  const sessionAnomalies = useMemo(
    () => detectAnomalies(sessionsChartData.map(d => ({ date: d.date, value: d.sessions }))),
    [sessionsChartData]
  );

  const quarter = useActiveQuarter();
  const summarySentence = useMemo(() => {
    if (sessionForecast.growthRateWoW === null) return null;
    const wow = sessionForecast.growthRateWoW;
    const direction = wow >= 0 ? 'up' : 'down';
    let sentence = `Sessions are ${direction} ${Math.abs(wow * 100).toFixed(0)}% week-over-week.`;
    if (quarter?.trafficTargets && historyQ.rows) {
      const today = new Date().toISOString().slice(0, 10);
      const qtdSessions = historyQ.rows.filter(r => r.date >= quarter.start && r.date <= today).reduce((a, r) => a + r.sessions, 0);
      const pctOfTarget = Math.round((qtdSessions / quarter.trafficTargets.sessions) * 100);
      sentence += ` On pace for ${pctOfTarget}% of your ${quarter.label} sessions target.`;
    }
    return sentence;
  }, [sessionForecast.growthRateWoW, quarter, historyQ.rows]);

  return (
    <div className="space-y-4">
      <RealtimePanel />

      {summarySentence && (
        <div className="rounded-xl px-4 py-3 text-sm text-slate-200 flex items-center gap-2"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <TrendingUp size={14} className="text-violet-400 shrink-0" />
          {summarySentence}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiQ.loading ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />) : <>
          <KpiCard label="Users" value={metrics ? fmtNum(metrics.users) : '—'} accent="#a78bfa" icon={<Users size={14} />} delta={usersDelta?.text} deltaPositive={usersDelta?.positive} />
          <KpiCard label="Sessions" value={metrics ? fmtNum(metrics.sessions) : '—'} accent="#818cf8" icon={<Activity size={14} />} delta={sessionsDelta?.text} deltaPositive={sessionsDelta?.positive} />
          <KpiCard label="Pageviews" value={metrics ? fmtNum(metrics.views) : '—'} accent="#67e8f9" icon={<Eye size={14} />} delta={viewsDelta?.text} deltaPositive={viewsDelta?.positive} />
          <KpiCard label="Avg Duration" value={metrics ? fmtSecs(metrics.duration) : '—'} accent="#f472b6" icon={<Clock size={14} />} delta={durationDelta?.text} deltaPositive={durationDelta?.positive} />
          <KpiCard label="Engagement" value={metrics ? pct(metrics.engagement, 1) : '—'} accent="#4ade80" icon={<TrendingUp size={14} />} delta={engagementDelta?.text} deltaPositive={engagementDelta?.positive} />
          <KpiCard label="Bounce Rate" value={metrics ? `${(metrics.bounce * 100).toFixed(1)}%` : '—'} accent="#fb923c" icon={<Wifi size={14} />} delta={bounceDelta?.text} deltaPositive={bounceDelta?.positive} />
        </>}
      </div>

      {sessionsChartData.length > 0 && (
        <SectionCard title="Sessions & Pageviews over time">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
            <div className="flex items-end gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-violet-400 inline-block" /> Sessions</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Pageviews</div>
              {dashedFromIndex !== undefined && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-3 h-0.5 bg-slate-500 inline-block" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0 3px, transparent 3px 6px)' }} /> Projected</div>
              )}
            </div>
            {sessionForecast.growthRateWoW !== null && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sessionForecast.growthRateWoW >= 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'}`}>
                {sessionForecast.growthRateWoW >= 0 ? '+' : ''}{(sessionForecast.growthRateWoW * 100).toFixed(1)}% WoW
              </span>
            )}
          </div>
          <div className="relative">
            <SparkLine points={sessionPoints} color="#a78bfa" width={700} height={80} dashedFromIndex={dashedFromIndex}
              labels={chartLabels} formatValue={v => `${fmtNum(v)} sessions`} markers={sessionAnomalies} />
            <div className="absolute inset-0 pointer-events-none">
              <SparkLine points={viewPoints} color="#67e8f9" width={700} height={80} dashedFromIndex={dashedFromIndex} />
            </div>
          </div>
          {sessionAnomalies.length > 0 && (
            <p className="text-[10px] text-amber-400/80 mt-1">
              ⬤ {sessionAnomalies.length} unusual day{sessionAnomalies.length > 1 ? 's' : ''} flagged (&gt;2x or &lt;0.5x the trailing 14-day average)
            </p>
          )}
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>{usingHistory ? HISTORY_START_DATE : sessionsChartData[0]?.date}</span>
            <span>{dashedFromIndex !== undefined ? `${sessionsChartData[sessionsChartData.length - 1]?.date} → +30d projected` : sessionsChartData[sessionsChartData.length - 1]?.date}</span>
          </div>
        </SectionCard>
      )}

      {usingHistory && historyQ.rows && <CurrentVsTargetPanel historyRows={historyQ.rows} />}
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

  // Site-wide total for this range, purely so the table caption below can say
  // "X% of total views" — without this, the top-20 table's numbers don't
  // reconcile with the Overview KPI tile and just look wrong/confusing.
  const totalViewsQ = useGA4({ dateRange: range, dimensions: [], metrics: [{ name: 'screenPageViews' }], limit: 1 });

  const blogQ = useGA4({ dateRange: range,
    dimensions: [{ name: 'pagePath' }],
    metrics: [{ name: 'screenPageViews' }, { name: 'userEngagementDuration' }, { name: 'sessions' }],
    dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' } } },
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 20 });

  const [prefixFilter, setPrefixFilter] = useState('all');
  const FILTERS = ['all', '/blog', '/skillup', '/tools', '/discovery'];
  type SortKey = 'views' | 'duration' | 'bounce';
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'views', dir: 'desc' });

  function toggleSort(key: SortKey) {
    setSort(s => s.key === key ? { key, dir: s.dir === 'desc' ? 'asc' : 'desc' } : { key, dir: 'desc' });
  }

  const filteredPages = useMemo(() => {
    const rows = topPagesQ.data?.rows ?? [];
    const mapped = rows
      .filter(r => prefixFilter === 'all' || r.dimensionValues[0].value.startsWith(prefixFilter))
      .map(r => ({
        path: r.dimensionValues[0].value,
        title: r.dimensionValues[1].value,
        views: parseInt(r.metricValues[0].value, 10),
        duration: parseFloat(r.metricValues[1].value),
        bounce: parseFloat(r.metricValues[2].value),
      }));
    const sorted = [...mapped].sort((a, b) => {
      const av = sort.key === 'duration' ? a.duration / Math.max(a.views, 1) : a[sort.key];
      const bv = sort.key === 'duration' ? b.duration / Math.max(b.views, 1) : b[sort.key];
      return sort.dir === 'desc' ? bv - av : av - bv;
    });
    return sorted;
  }, [topPagesQ.data, prefixFilter, sort]);

  const shownViews = filteredPages.reduce((a, p) => a + p.views, 0);
  const totalViews = totalViewsQ.data?.rows?.[0]?.metricValues?.[0]?.value
    ? parseInt(totalViewsQ.data.rows[0].metricValues[0].value, 10) : null;
  const totalPageCount = topPagesQ.data?.rowCount ?? filteredPages.length;

  return (
    <div className="space-y-4">
      <SectionCard title="Top Pages" loading={topPagesQ.loading}>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setPrefixFilter(f)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${prefixFilter === f ? 'border-violet-500/60 bg-violet-500/15 text-violet-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          {prefixFilter === 'all' && totalViews !== null && (
            <p className="text-[10px] text-slate-500">
              Showing top {filteredPages.length} of {totalPageCount} pages — {shownViews.toLocaleString()} of {totalViews.toLocaleString()} views ({totalViews ? Math.round((shownViews / totalViews) * 100) : 0}%)
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left pb-2 font-medium">Path</th>
              <SortHeader label="Views" active={sort.key === 'views'} onClick={() => toggleSort('views')} />
              <SortHeader label="Avg Time" active={sort.key === 'duration'} onClick={() => toggleSort('duration')} />
              <SortHeader label="Bounce" active={sort.key === 'bounce'} onClick={() => toggleSort('bounce')} />
            </tr></thead>
            <tbody>
              {filteredPages.map((p, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-white/[0.02]" title={p.title}>
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

  // Channel mix trend over time — the donut above is a single point-in-time
  // snapshot; this shows whether that mix is actually shifting day to day.
  const channelTrendQ = useGA4({ dateRange: range,
    dimensions: [{ name: 'date' }, { name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 300 });

  const channelTrend = useMemo(() => {
    const rows = channelTrendQ.data?.rows ?? [];
    const dates = [...new Set(rows.map(r => normalizeGa4Date(r.dimensionValues[0].value)))].sort();
    const totals = new Map<string, number>();
    for (const r of rows) {
      const ch = r.dimensionValues[1].value;
      totals.set(ch, (totals.get(ch) ?? 0) + parseInt(r.metricValues[0].value, 10));
    }
    // Top 3 channels only — more than that and the overlay stops being legible.
    const topChannels = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
    const series = topChannels.map(channel => {
      const byDate = new Map(rows.filter(r => r.dimensionValues[1].value === channel)
        .map(r => [normalizeGa4Date(r.dimensionValues[0].value), parseInt(r.metricValues[0].value, 10)]));
      return { channel, points: dates.map(d => byDate.get(d) ?? 0) };
    });
    return { dates, series };
  }, [channelTrendQ.data]);

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

      {channelTrend.series.length > 0 && (
        <SectionCard title="Acquisition Channel Mix Over Time" loading={channelTrendQ.loading}>
          <div className="flex gap-4 mb-2 flex-wrap">
            {channelTrend.series.map(s => (
              <div key={s.channel} className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-3 h-0.5 inline-block" style={{ background: CHANNEL_COLORS[s.channel] ?? '#64748b' }} /> {s.channel}
              </div>
            ))}
          </div>
          <div className="relative">
            {channelTrend.series.map((s, i) => (
              <div key={s.channel} className={i === 0 ? '' : 'absolute inset-0 pointer-events-none'}>
                <SparkLine points={s.points} color={CHANNEL_COLORS[s.channel] ?? '#64748b'} width={700} height={80}
                  labels={i === 0 ? channelTrend.dates : undefined} formatValue={v => `${fmtNum(v)} sessions`} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>{channelTrend.dates[0]}</span>
            <span>{channelTrend.dates[channelTrend.dates.length - 1]}</span>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ── Audience tab ──────────────────────────────────────────────────────────────

function AudienceTab({ dateRange }: { dateRange: DateRange }) {
  const dr = DATE_RANGES.find(d => d.id === dateRange)!;
  const range = { startDate: dr.start, endDate: 'today' };

  const deviceQ = useGA4({ dateRange: range, dimensions: [{ name: 'deviceCategory' }], metrics: [{ name: 'sessions' }], limit: 5 });
  const browserQ = useGA4({ dateRange: range, dimensions: [{ name: 'browser' }], metrics: [{ name: 'sessions' }], orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 10 });
  // Geographic cohort quality, not just a headcount leaderboard — bounceRate
  // and userEngagementDuration turn "which countries send traffic" into
  // "which countries send engaged traffic."
  const countryQ = useGA4({ dateRange: range, dimensions: [{ name: 'country' }],
    metrics: [{ name: 'totalUsers' }, { name: 'sessions' }, { name: 'bounceRate' }, { name: 'userEngagementDuration' }],
    orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }], limit: 15 });
  const nvr = useGA4({ dateRange: range, dimensions: [{ name: 'newVsReturning' }], metrics: [{ name: 'sessions' }], limit: 3 });

  // New vs returning trend over time — the donut is a single snapshot; this
  // shows whether the mix is shifting.
  const nvrTrendQ = useGA4({ dateRange: range, dimensions: [{ name: 'date' }, { name: 'newVsReturning' }],
    metrics: [{ name: 'sessions' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 300 });

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

  const countryRows = useMemo(() => (countryQ.data?.rows ?? []).map(r => {
    const sessions = parseInt(r.metricValues[1].value, 10);
    const engDuration = parseFloat(r.metricValues[3].value);
    return {
      country: r.dimensionValues[0].value,
      users: parseInt(r.metricValues[0].value, 10),
      sessions,
      bounce: parseFloat(r.metricValues[2].value),
      avgEngagement: engDuration / Math.max(sessions, 1),
    };
  }), [countryQ.data]);

  const nvrTrend = useMemo(() => {
    const rows = nvrTrendQ.data?.rows ?? [];
    const dates = [...new Set(rows.map(r => normalizeGa4Date(r.dimensionValues[0].value)))].sort();
    const seriesFor = (kind: string) => {
      const byDate = new Map(rows.filter(r => r.dimensionValues[1].value === kind)
        .map(r => [normalizeGa4Date(r.dimensionValues[0].value), parseInt(r.metricValues[0].value, 10)]));
      return dates.map(d => byDate.get(d) ?? 0);
    };
    return { dates, newPoints: seriesFor('new'), returningPoints: seriesFor('returning') };
  }, [nvrTrendQ.data]);

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

      {nvrTrend.dates.length > 0 && (
        <SectionCard title="New vs Returning Over Time" loading={nvrTrendQ.loading}>
          <div className="flex gap-4 mb-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-violet-400 inline-block" /> New</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-0.5 bg-emerald-400 inline-block" /> Returning</div>
          </div>
          <div className="relative">
            <SparkLine points={nvrTrend.newPoints} color="#a78bfa" width={700} height={80} labels={nvrTrend.dates} formatValue={v => `${fmtNum(v)} sessions`} />
            <div className="absolute inset-0 pointer-events-none">
              <SparkLine points={nvrTrend.returningPoints} color="#4ade80" width={700} height={80} />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>{nvrTrend.dates[0]}</span>
            <span>{nvrTrend.dates[nvrTrend.dates.length - 1]}</span>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Top Countries — Engagement Quality" loading={countryQ.loading}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-slate-500 border-b border-slate-800">
              <th className="text-left pb-2 font-medium">Country</th>
              <th className="text-right pb-2 font-medium">Users</th>
              <th className="text-right pb-2 font-medium">Sessions</th>
              <th className="text-right pb-2 font-medium">Avg Time</th>
              <th className="text-right pb-2 font-medium">Bounce</th>
            </tr></thead>
            <tbody>
              {countryRows.map((c, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-white/[0.02]">
                  <td className="py-2 text-slate-300">{c.country}</td>
                  <td className="py-2 text-right tabular-nums text-slate-200">{c.users.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums text-slate-200">{c.sessions.toLocaleString()}</td>
                  <td className="py-2 text-right tabular-nums text-slate-400">{fmtSecs(c.avgEngagement)}</td>
                  <td className={`py-2 text-right tabular-nums ${c.bounce > 0.6 ? 'text-rose-400' : 'text-slate-400'}`}>{(c.bounce * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Retention tab ─────────────────────────────────────────────────────────────
// GA4 native cohort report — a single cohort spanning HISTORY_START_DATE to
// today, so this renders as a retention curve (Week 0-4, % of that cohort
// still active), not a multi-cohort grid. Independent of the 7/28/90-day
// selector — retention is inherently a "since we started tracking" question.

function RetentionTab() {
  const retentionQ = useGA4Retention(HISTORY_START_DATE);

  const weeks: RetentionWeek[] = useMemo(() => {
    const rows = retentionQ.data?.rows ?? [];
    return rows.map(r => {
      const week = parseInt(r.dimensionValues[1].value, 10);
      const activeUsers = parseInt(r.metricValues[0].value, 10);
      const totalUsers = parseInt(r.metricValues[1].value, 10);
      return { week, activeUsers, totalUsers, pct: totalUsers > 0 ? activeUsers / totalUsers : 0 };
    }).sort((a, b) => a.week - b.week);
  }, [retentionQ.data]);

  const week1Pct = weeks.find(w => w.week === 1)?.pct;

  return (
    <div className="space-y-4">
      {week1Pct !== undefined && (
        <div className="rounded-xl px-4 py-3 text-sm text-slate-200 flex items-center gap-2"
          style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <Repeat size={14} className="text-violet-400 shrink-0" />
          {(week1Pct * 100).toFixed(1)}% of people who visit come back within a week.
        </div>
      )}
      <SectionCard title={`Retention Curve — cohort since ${HISTORY_START_DATE}`} loading={retentionQ.loading}>
        {retentionQ.error && <p className="text-xs text-rose-400 mb-3">{retentionQ.error}</p>}
        <RetentionTable weeks={weeks} />
        <p className="text-[10px] text-slate-600 mt-3">
          Week 0 = everyone who first visited in this window (100%, by definition). Each later week shows what
          share of that same group came back, regardless of how many new visitors also arrived that week.
        </p>
      </SectionCard>
    </div>
  );
}

// ── Cloudflare tab — Worker/Pages operational metrics (Track C8) ─────────────

function CloudflareTab({ dateRange }: { dateRange: DateRange }) {
  const cfStatus = useCloudflareStatus();
  const { data, loading, error } = useCloudflareOverview(dateRange);

  if (!import.meta.env.VITE_CF_MONITOR_PROXY_URL) {
    return (
      <div className="text-xs text-amber-400 border border-amber-500/30 rounded-lg px-3 py-2 bg-amber-500/10">
        VITE_CF_MONITOR_PROXY_URL not set — data unavailable
      </div>
    );
  }

  if (!cfStatus.loading && !cfStatus.connected) {
    return (
      <div className="text-xs text-amber-400 border border-amber-500/30 rounded-lg px-3 py-2 bg-amber-500/10">
        Cloudflare proxy is deployed but not configured — set CF_API_TOKEN and CF_ACCOUNT_ID
        (see wrangler.cf-monitor.toml) to enable this tab.
      </div>
    );
  }

  if (error) {
    return <p className="text-rose-400 text-xs">{error}</p>;
  }

  const zone = data?.zone;
  const workers = data?.workers ?? [];

  return (
    <div className="space-y-4">
      {!cfStatus.loading && cfStatus.connected && !cfStatus.zoneConfigured && (
        <div className="text-xs text-amber-400 border border-amber-500/30 rounded-lg px-3 py-2 bg-amber-500/10">
          CF_ZONE_ID not set — zone traffic (requests/bandwidth/cache ratio) omitted, per-Worker stats still shown below.
        </div>
      )}

      {zone && (
        <SectionCard title="Zone Traffic (aaryaai.dev)" loading={loading}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Requests" value={fmtNum(zone.requests)} icon={<Globe size={14} />} accent="#67e8f9" />
            <KpiCard label="Bandwidth" value={fmtBytes(zone.bytes)} icon={<TrendingUp size={14} />} accent="#a78bfa" />
            <KpiCard label="Cache Hit Ratio" value={`${(zone.cacheHitRatio * 100).toFixed(1)}%`} icon={<Server size={14} />} accent="#4ade80" />
            <KpiCard label="Threats Blocked" value={fmtNum(zone.threats)} icon={<AlertOctagon size={14} />} accent="#fb923c" />
          </div>
        </SectionCard>
      )}

      <SectionCard title="Workers — Requests, Errors, CPU Time" loading={loading}>
        {workers.length === 0 && !loading && (
          <p className="text-xs text-slate-500">No Worker invocation data for this range.</p>
        )}
        <div className="space-y-3">
          {workers.map(w => (
            <div key={w.scriptName} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1.5 col-span-2 md:col-span-1">
                <Cpu size={12} className="text-slate-500" /> {w.scriptName}
              </span>
              <span className="text-slate-400">{fmtNum(w.requests)} req</span>
              <span className={w.errorRate > 0.01 ? 'text-rose-400' : 'text-slate-400'}>
                {pct(w.errors, w.requests)} errors
              </span>
              <span className="text-slate-400">p50 {w.cpuTimeP50Ms.toFixed(1)}ms</span>
              <span className="text-slate-500">p99 {w.cpuTimeP99Ms.toFixed(1)}ms</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Monitoring() {
  const { user, token, isLoading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('28d');
  const [connectedToast, setConnectedToast] = useState(false);

  const ga4Status = useGA4Status();

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  // Handle ?connected=true redirect from OAuth callback
  useEffect(() => {
    if (searchParams.get('connected') === 'true') {
      setConnectedToast(true); // eslint-disable-line react-hooks/set-state-in-effect
      setSearchParams({}, { replace: true });  
      ga4Status.refetch();
      setTimeout(() => setConnectedToast(false), 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDisconnect() {
    if (!token) return;
    await fetch(`${import.meta.env.VITE_GA4_PROXY_URL}/oauth/disconnect`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    ga4Status.refetch();
  }

  const isOwner = useIsOwner();

  if (!authLoading && !user && !isOwner) {
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
      {/* Connected toast */}
      {connectedToast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-lg">
          ✓ Google Analytics connected
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="page-eyebrow">Platform Intelligence</p>
          <div className="flex items-center gap-2 mb-1">
            <Activity size={20} className="text-violet-400" />
            <h1 className="text-xl font-bold tracking-tight"><span className="heading-gradient">Monitoring</span></h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">Owner</span>
            {ga4Status.method === 'oauth' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet-500/15 text-violet-300 border border-violet-500/30">OAuth</span>
            )}
            {ga4Status.method === 'service_account' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-500/15 text-blue-300 border border-blue-500/30">SA</span>
            )}
          </div>
          <p className="text-sm text-slate-400">GA4 analytics — real-time + historical. Visible only to @{OWNER_LOGIN}.</p>
        </div>

        <div className="flex items-center gap-2">
          {!import.meta.env.VITE_GA4_PROXY_URL && (
            <div className="text-xs text-amber-400 border border-amber-500/30 rounded-lg px-3 py-2 bg-amber-500/10">
              VITE_GA4_PROXY_URL not set — data unavailable
            </div>
          )}
          {ga4Status.method === 'oauth' && (
            <button onClick={handleDisconnect}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition-colors">
              <Unlink size={11} /> Disconnect GA4
            </button>
          )}
        </div>
      </div>

      {authLoading && <p className="text-slate-500 text-sm animate-pulse py-12 text-center">Checking auth…</p>}

      {!authLoading && isOwner && (
        <>
          {/* Connect banner — shown when neither SA nor OAuth is configured */}
          {!ga4Status.loading && !ga4Status.connected && import.meta.env.VITE_GA4_PROXY_URL && (
            <ConnectGA4Banner onConnected={ga4Status.refetch} />
          )}

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
          {tab === 'retention' && <RetentionTab />}
          {tab === 'cloudflare' && <CloudflareTab dateRange={dateRange} />}
        </>
      )}
    </div>
  );
}
