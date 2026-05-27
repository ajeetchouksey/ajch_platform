import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import {
  BarChart2, Eye, Globe, TrendingUp, KeyRound,
  RefreshCw, LogIn, ShieldOff, ExternalLink, MapPin, FileText,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────
   Config — collaborators who can access this page
───────────────────────────────────────────────────────────── */
const ADMIN_USERS = ['ajeetchouksey', 'ajchava'];
const GC_BASE = 'https://ajch.goatcounter.com/api/v0';
const TOKEN_KEY = 'gc_admin_token'; // sessionStorage — cleared on tab close

// Build-time token injected by CI (VITE_GOAT_TOKEN GitHub secret).
// Falls back to empty string — manual entry used in local dev.
const BUILD_TOKEN: string = (import.meta.env.VITE_GOAT_TOKEN as string | undefined) ?? '';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface TotalStats { total: number; totalToday: number }
interface PageStat   { path: string; title: string; count: number }
interface LocationStat { location: string; count: number }
interface HitsByDay  { day: string; count: number }
interface AnalyticsData {
  totals: TotalStats;
  topPages: PageStat[];
  locations: LocationStat[];
  hitsByDay: HitsByDay[];
}

/* ─────────────────────────────────────────────────────────────
   Fetch helpers (runtime token — never build-time)
───────────────────────────────────────────────────────────── */
async function gcFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GC_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`GoatCounter ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

async function loadAnalytics(token: string): Promise<AnalyticsData> {
  const [total, pages, locs, hits] = await Promise.all([
    gcFetch<{ total: number; total_utc: number }>('/stats/total', token),
    gcFetch<{ pages: { path: string; title: string; count: number }[] }>('/stats/pages?limit=10', token),
    gcFetch<{ locations: { location: string; count: number }[] }>('/stats/locations', token),
    gcFetch<{ days: { day: string; count: number }[] }>('/stats/hits?days=30', token),
  ]);
  return {
    totals: { total: total.total ?? 0, totalToday: total.total_utc ?? 0 },
    topPages: (pages.pages ?? []).map(p => ({ path: p.path, title: p.title || p.path, count: p.count })),
    locations: (locs.locations ?? []).slice(0, 15).map(l => ({ location: l.location, count: l.count })),
    hitsByDay: (hits.days ?? []).map(h => ({ day: h.day, count: h.count })),
  };
}

/* ─────────────────────────────────────────────────────────────
   Mini bar chart (CSS only — no chart dependency)
───────────────────────────────────────────────────────────── */
function MiniBarChart({ data }: { data: HitsByDay[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-20 w-full">
      {data.map(d => (
        <div key={d.day} className="flex-1 flex flex-col items-center gap-0.5 group relative">
          <div
            className="w-full rounded-t-sm bg-violet-500/40 hover:bg-violet-400/70 transition-colors duration-150"
            style={{ height: `${Math.max((d.count / max) * 80, 2)}px` }}
          />
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-[9px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10">
            {d.day}<br />{d.count} views
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Token gate UI
───────────────────────────────────────────────────────────── */
function TokenForm({ onSubmit }: { onSubmit: (t: string) => void }) {
  const [val, setVal] = useState('');
  const [err, setErr] = useState('');
  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="glass-card rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <KeyRound size={18} className="text-purple-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">GoatCounter API Token</h2>
            <p className="text-[11px] text-slate-500">Stored in session only — cleared when tab closes</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Create a token at{' '}
          <a
            href="https://ajch.goatcounter.com/user/api"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline inline-flex items-center gap-0.5"
          >
            ajch.goatcounter.com/user/api <ExternalLink size={10} />
          </a>
        </p>
        <form
          onSubmit={e => {
            e.preventDefault();
            const trimmed = val.trim();
            if (!trimmed) { setErr('Token is required'); return; }
            if (trimmed.length < 16) { setErr('Token looks too short'); return; }
            onSubmit(trimmed);
          }}
        >
          <input
            type="password"
            autoComplete="off"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/60 mb-2"
            placeholder="Paste your GoatCounter API token"
            value={val}
            onChange={e => { setVal(e.target.value); setErr(''); }}
          />
          {err && <p className="text-[11px] text-red-400 mb-2">{err}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-semibold hover:bg-purple-500/30 transition-colors duration-200"
          >
            Connect to GoatCounter
          </button>
        </form>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Dashboard
───────────────────────────────────────────────────────────── */
function Dashboard({ data, onRefresh, loading }: { data: AnalyticsData; onRefresh: () => void; loading: boolean }) {
  const { totals, topPages, locations, hitsByDay } = data;
  const maxPage = Math.max(...topPages.map(p => p.count), 1);
  const maxLoc  = Math.max(...locations.map(l => l.count), 1);

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Eye,       value: totals.totalToday.toLocaleString(), label: 'Today',         color: 'text-violet-400' },
          { icon: TrendingUp, value: totals.total.toLocaleString(),     label: 'All-time views', color: 'text-emerald-400' },
          { icon: Globe,     value: locations.length,                   label: 'Countries',      color: 'text-blue-400' },
          { icon: FileText,  value: topPages.length,                    label: 'Active pages',   color: 'text-amber-400' },
        ].map(({ icon: Icon, value, label, color }) => (
          <div key={label} className="glass-stats rounded-xl p-4 text-center">
            <Icon size={16} className={`mx-auto ${color} mb-1.5`} />
            <div className="text-xl font-bold text-white">{value}</div>
            <div className="text-[11px] text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      {hitsByDay.length > 0 && (
        <div className="glass-card rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-violet-400" />
              <span className="text-xs font-semibold text-slate-400">Daily hits</span>
            </div>
            <span className="text-[10px] text-slate-600">last {hitsByDay.length} days</span>
          </div>
          <MiniBarChart data={hitsByDay} />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-slate-700">{hitsByDay[0]?.day}</span>
            <span className="text-[9px] text-slate-700">{hitsByDay[hitsByDay.length - 1]?.day}</span>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Top pages */}
        <div className="glass-card rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-emerald-400" />
            <span className="text-xs font-semibold text-slate-400">Top pages</span>
          </div>
          <div className="space-y-2">
            {topPages.map(p => (
              <div key={p.path}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-slate-300 truncate max-w-[70%] font-mono">{p.path}</span>
                  <span className="text-[11px] font-bold text-emerald-400">{p.count.toLocaleString()}</span>
                </div>
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-emerald-500/40" style={{ width: `${(p.count / maxPage) * 100}%` }} />
                </div>
              </div>
            ))}
            {topPages.length === 0 && <p className="text-[11px] text-slate-600">No page data yet</p>}
          </div>
        </div>

        {/* Top locations */}
        <div className="glass-card rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-slate-400">Top countries</span>
          </div>
          <div className="space-y-2">
            {locations.map(l => (
              <div key={l.location}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-slate-300 truncate max-w-[70%]">{l.location || 'Unknown'}</span>
                  <span className="text-[11px] font-bold text-blue-400">{l.count.toLocaleString()}</span>
                </div>
                <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500/40" style={{ width: `${(l.count / maxLoc) * 100}%` }} />
                </div>
              </div>
            ))}
            {locations.length === 0 && <p className="text-[11px] text-slate-600">No location data yet</p>}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between text-xs text-slate-600">
        <a
          href="https://ajch.goatcounter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-slate-400 transition-colors"
        >
          Open GoatCounter <ExternalLink size={11} />
        </a>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 hover:text-slate-400 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function Analytics() {
  const { user, isLoading: authLoading, login } = useAuth();
  const [mounted, setMounted]     = useState(false);
  // Use build-time token if injected by CI, else check sessionStorage (local dev)
  const [token, setToken]         = useState<string>(() => BUILD_TOKEN || sessionStorage.getItem(TOKEN_KEY) || '');
  const [data, setData]           = useState<AnalyticsData | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const isAdmin = user ? ADMIN_USERS.includes(user.login) : false;

  const fetchData = useCallback(async (t: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await loadAnalytics(t);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch analytics');
      // If 401, clear the bad token
      if (e instanceof Error && e.message.includes('401')) {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken('');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch if token already in session and user is admin
  useEffect(() => {
    if (isAdmin && token && !data) {
      fetchData(token);
    }
  }, [isAdmin, token, data, fetchData]);

  const handleTokenSubmit = (t: string) => {
    sessionStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    fetchData(t);
  };

  const handleRefresh = () => { if (token) fetchData(token); };

  const handleClearToken = () => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken('');
    setData(null);
    setError('');
  };

  return (
    <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={20} className="text-violet-400" />
            <h1 className="text-xl font-bold tracking-tight"><span className="heading-gradient">Analytics</span></h1>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Admin
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">
            GoatCounter · <a href="https://ajch.goatcounter.com" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">ajch.goatcounter.com</a>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {BUILD_TOKEN ? (
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-500/70 border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              CI-injected token
            </span>
          ) : token ? (
            <button
              onClick={handleClearToken}
              className="text-[11px] text-slate-600 hover:text-slate-400 transition-colors"
            >
              Clear token
            </button>
          ) : null}
        </div>
      </div>

      {/* Auth loading */}
      {authLoading && (
        <p className="text-slate-500 text-sm animate-pulse py-12 text-center">Checking authentication…</p>
      )}

      {/* Not logged in */}
      {!authLoading && !user && (
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
            <LogIn size={22} className="text-slate-400" />
          </div>
          <h2 className="text-base font-bold text-white mb-2">Sign in required</h2>
          <p className="text-sm text-slate-400 mb-5">This page is restricted to repository collaborators.</p>
          <button
            onClick={login}
            className="px-5 py-2 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-300 text-sm font-semibold hover:bg-violet-500/30 transition-colors duration-200"
          >
            Sign in with GitHub
          </button>
        </div>
      )}

      {/* Logged in but not admin */}
      {!authLoading && user && !isAdmin && (
        <div className="max-w-md mx-auto mt-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <ShieldOff size={22} className="text-red-400" />
          </div>
          <h2 className="text-base font-bold text-white mb-2">Access denied</h2>
          <p className="text-sm text-slate-400">
            Signed in as <span className="text-slate-300 font-medium">@{user.login}</span> — not a repository collaborator.
          </p>
        </div>
      )}

      {/* Admin — no token yet (local dev only; CI build skips this) */}
      {!authLoading && isAdmin && !token && (
        <>
          <div className="glass-card rounded-xl p-3 border border-amber-500/20 bg-amber-500/5 mb-4 flex items-start gap-2">
            <span className="text-amber-400 text-sm mt-0.5">⚠</span>
            <p className="text-[11px] text-slate-400">
              <span className="text-amber-300 font-semibold">Local dev:</span> No build-time token found.
              In production, set <code className="text-violet-400">VITE_GOAT_TOKEN</code> as a GitHub Actions secret.
              For now, enter your GoatCounter token below.
            </p>
          </div>
          <TokenForm onSubmit={handleTokenSubmit} />
        </>
      )}

      {/* Admin — token present, loading */}
      {!authLoading && isAdmin && token && loading && !data && (
        <p className="text-slate-500 text-sm animate-pulse py-12 text-center">Loading analytics…</p>
      )}

      {/* Admin — error */}
      {!authLoading && isAdmin && error && (
        <div className="glass-card rounded-xl p-4 border border-red-500/30 mb-4">
          <p className="text-sm text-red-400">{error}</p>
          {!token && <TokenForm onSubmit={handleTokenSubmit} />}
        </div>
      )}

      {/* Admin — dashboard */}
      {!authLoading && isAdmin && data && (
        <Dashboard data={data} onRefresh={handleRefresh} loading={loading} />
      )}

    </div>
  );
}
