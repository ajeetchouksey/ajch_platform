import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { DashboardChart } from '@/components/DashboardChart';
import {
  isAnalyticsConfigured,
  fetchTotalHits,
  fetchTopPages,
  fetchLocations,
  fetchHitsByDay,
  type TotalStats,
  type PageStat,
  type LocationStat,
  type HitsByDay,
} from '@/lib/analytics';
import { BarChart2, Eye, Globe, TrendingUp, AlertCircle } from 'lucide-react';

const OWNER_LOGIN = 'ajeetchouksey';

export default function MaintainerDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState<TotalStats>({ total: 0, totalToday: 0 });
  const [topPages, setTopPages] = useState<PageStat[]>([]);
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [hitsByDay, setHitsByDay] = useState<HitsByDay[]>([]);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (authLoading || user?.login !== OWNER_LOGIN) return;
    if (!isAnalyticsConfigured()) {
      setLoading(false);
      return;
    }

    Promise.all([
      fetchTotalHits(),
      fetchTopPages(10),
      fetchLocations(),
      fetchHitsByDay(30),
    ]).then(([t, p, l, h]) => {
      setTotals(t);
      setTopPages(p);
      setLocations(l);
      setHitsByDay(h);
      setLoading(false);
    });
  }, [user, authLoading]);

  // Gate: redirect if not the owner
  if (!authLoading && (!user || user.login !== OWNER_LOGIN)) {
    return <Navigate to="/maintainer" replace />;
  }

  const configured = isAnalyticsConfigured();

  return (
    <div className={`space-y-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart2 size={20} className="text-violet-400" />
          Analytics Dashboard
        </h1>
        <span className="text-xs text-slate-500">
          {configured ? 'GoatCounter connected' : 'Not configured'}
        </span>
      </div>

      {!configured && (
        <div className="glass-card rounded-xl p-6 border-amber-500/20">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-300">Analytics Not Configured</h3>
              <p className="text-sm text-slate-400 mt-1">
                To enable the dashboard, set up GoatCounter:
              </p>
              <ol className="text-sm text-slate-400 mt-2 space-y-1 list-decimal ml-4">
                <li>Sign up free at <a href="https://www.goatcounter.com" target="_blank" rel="noopener" className="text-violet-400 hover:underline">goatcounter.com</a></li>
                <li>Add your site code to <code className="text-violet-300">.env</code> as <code className="text-violet-300">VITE_GOAT_SITE=yourcode</code></li>
                <li>Create an API token in GoatCounter settings</li>
                <li>Add token to <code className="text-violet-300">.env</code> as <code className="text-violet-300">VITE_GOAT_TOKEN=your-token</code></li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {configured && loading && (
        <div className="text-slate-500 text-sm animate-pulse py-12 text-center">Loading analytics…</div>
      )}

      {configured && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-stats rounded-xl p-4 text-center">
              <Eye size={16} className="mx-auto text-violet-400 mb-1.5" />
              <div className="text-xl font-bold text-white">{totals.totalToday.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Today</div>
            </div>
            <div className="glass-stats rounded-xl p-4 text-center">
              <TrendingUp size={16} className="mx-auto text-emerald-400 mb-1.5" />
              <div className="text-xl font-bold text-white">{totals.total.toLocaleString()}</div>
              <div className="text-xs text-slate-400">Total Views</div>
            </div>
            <div className="glass-stats rounded-xl p-4 text-center">
              <Globe size={16} className="mx-auto text-blue-400 mb-1.5" />
              <div className="text-xl font-bold text-white">{locations.length}</div>
              <div className="text-xs text-slate-400">Countries</div>
            </div>
            <div className="glass-stats rounded-xl p-4 text-center">
              <BarChart2 size={16} className="mx-auto text-amber-400 mb-1.5" />
              <div className="text-xl font-bold text-white">{topPages.length}</div>
              <div className="text-xs text-slate-400">Active Pages</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            <DashboardChart
              title="Top Pages (30 days)"
              items={topPages.map((p) => ({
                label: p.title || p.path,
                value: p.count,
                color: 'bg-violet-500/70',
              }))}
            />
            <DashboardChart
              title="Visitor Locations"
              items={locations.map((l) => ({
                label: l.location,
                value: l.count,
                color: 'bg-blue-500/70',
              }))}
            />
          </div>

          {/* Daily trend */}
          {hitsByDay.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-sm font-semibold text-white mb-4">Daily Visits (last 30 days)</h4>
              <div className="flex items-end gap-0.5 h-24">
                {hitsByDay.map((d) => {
                  const maxH = Math.max(...hitsByDay.map((x) => x.count), 1);
                  const pct = (d.count / maxH) * 100;
                  return (
                    <div
                      key={d.day}
                      className="flex-1 bg-violet-500/50 hover:bg-violet-400/70 rounded-t transition-colors"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                      title={`${d.day}: ${d.count} views`}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-slate-500">{hitsByDay[0]?.day}</span>
                <span className="text-[10px] text-slate-500">{hitsByDay[hitsByDay.length - 1]?.day}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
