import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useProgressSync } from '@/lib/useProgressSync';
import { getSessions, getScoreByDomain } from '@/lib/storage';
import { loadBlogManifest, loadExamRegistry } from '@/lib/content-loader';
import type { DomainConfig } from '@/types/content';
import {
  User, Shield, BookOpen, Brain, BarChart2, Clock, Trophy,
  Target, TrendingUp, Calendar, ExternalLink, LogOut, ArrowRight,
  CloudUpload, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

interface DomainStats {
  correct: number;
  total: number;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { syncToGist } = useProgressSync();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const handleSync = useCallback(async () => {
    setSyncStatus('syncing');
    const ok = await syncToGist();
    if (ok) {
      setSyncStatus('synced');
      setLastSynced(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setTimeout(() => setSyncStatus('idle'), 3000);
    } else {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  }, [syncToGist]);
  const [mounted, setMounted] = useState(false);
  const [blogCount, setBlogCount] = useState(0);
  const [examDomains, setExamDomains] = useState<DomainConfig[]>([]);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    loadBlogManifest()
      .then((m) => setBlogCount(m.posts.filter((p) => !p.draft).length))
      .catch(() => {});
    loadExamRegistry()
      .then((r) => {
        const ccaf = r.exams.find((e) => e.id === 'ccaf');
        if (ccaf) setExamDomains(ccaf.domains);
      })
      .catch(() => {});
  }, []);

  const sessions = getSessions().filter((s) => s.finishedAt);
  const domainScores = getScoreByDomain();

  // Derived stats
  const totalQuestions = sessions.reduce((acc, s) => acc + s.total, 0);
  const totalCorrect = sessions.reduce((acc, s) => acc + s.score, 0);
  const overallPct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : null;
  const bestSession = sessions.length > 0
    ? Math.max(...sessions.map((s) => Math.round((s.score / s.total) * 100)))
    : null;
  const latestDate = sessions.length > 0
    ? new Date(sessions[sessions.length - 1].finishedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;
  const passCount = sessions.filter((s) => Math.round((s.score / s.total) * 100) >= 72).length;

  // Streak: consecutive days with sessions
  const uniqueDays = [...new Set(sessions.map((s) => new Date(s.finishedAt!).toDateString()))];
  const streak = uniqueDays.length;

  const masteredDomains = Object.entries(domainScores).filter(
    ([, stats]: [string, DomainStats]) => stats.total > 0 && Math.round((stats.correct / stats.total) * 100) >= 72
  ).length;

  return (
    <div className="space-y-8">
      {/* Profile Header — GitHub user card OR guest sign-in banner */}
      {user ? (
        <div className={`glass-card glass-edge rounded-xl p-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex items-start gap-5">
            <img
              src={user.avatar_url}
              alt={user.login}
              className="w-16 h-16 rounded-full ring-2 ring-violet-500/40 ring-offset-2 ring-offset-slate-900"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white truncate">{user.name || user.login}</h1>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-violet-900/50 text-violet-300 border border-violet-700/30">
                  <Shield size={10} />
                  Maintainer
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-3">@{user.login}</p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-300 transition-colors"
                >
                  <ExternalLink size={12} />
                  GitHub Profile
                </a>
                <button
                  onClick={handleSync}
                  disabled={syncStatus === 'syncing'}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-300 disabled:opacity-50 transition-colors"
                >
                  {syncStatus === 'syncing' && <Loader2 size={12} className="animate-spin" />}
                  {syncStatus === 'synced' && <CheckCircle2 size={12} className="text-emerald-400" />}
                  {syncStatus === 'error' && <AlertCircle size={12} className="text-rose-400" />}
                  {syncStatus === 'idle' && <CloudUpload size={12} />}
                  {syncStatus === 'syncing' ? 'Syncing…' : syncStatus === 'synced' ? 'Synced' : syncStatus === 'error' ? 'Sync failed' : lastSynced ? `Synced ${lastSynced}` : 'Sync now'}
                </button>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <LogOut size={12} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`glass-card glass-edge rounded-xl p-5 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
              <User size={22} className="text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Guest — stats saved locally</p>
              <p className="text-xs text-slate-400 mt-0.5">Sign in with GitHub to back up your progress to a private Gist and sync across devices.</p>
            </div>
            <Link
              to="/"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '150ms' }}>
        {[
          { icon: Brain, label: 'Sessions', value: sessions.length, color: 'text-violet-400', bg: 'bg-violet-500/10' },
          { icon: Target, label: 'Questions', value: totalQuestions, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { icon: Trophy, label: 'Best Score', value: bestSession !== null ? `${bestSession}%` : '--', color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { icon: TrendingUp, label: 'Overall', value: overallPct !== null ? `${overallPct}%` : '--', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        ].map(({ icon: Icon, label, value, color, bg }, idx) => (
          <div
            key={label}
            className="glass-card glass-edge rounded-lg p-4 text-center group hover:-translate-y-0.5 transition-all duration-300"
            style={{ transitionDelay: `${200 + idx * 50}ms` }}
          >
            <div className={`w-8 h-8 rounded-lg ${bg} mx-auto mb-2 flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon size={16} className={color} />
            </div>
            <div className={`text-lg font-bold ${color}`}>{value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Domain Progress */}
      <div className={`glass-card glass-edge rounded-xl p-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="section-heading flex items-center gap-2">
            <BarChart2 size={16} className="text-violet-400" />
            Domain Mastery
          </h2>
          <span className="text-xs text-slate-500">
            {masteredDomains}/{examDomains.length || 5} domains mastered (72%+ threshold)
          </span>
        </div>
        <div className="space-y-4">
          {examDomains.map((domain) => {
            const stats: DomainStats = domainScores[domain.id];
            const pct = stats?.total > 0 ? Math.round((stats.correct / stats.total) * 100) : null;
            const passed = pct !== null && pct >= 72;
            return (
              <div key={domain.id} className="group">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-300 group-hover:text-white transition-colors flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${domain.color}`} />
                    D{domain.id}: {domain.title}
                  </span>
                  <span className={`font-mono text-xs ${passed ? 'text-emerald-400' : pct !== null ? 'text-rose-400' : 'text-slate-600'}`}>
                    {pct !== null ? `${pct}%` : 'not started'}
                    {stats?.total > 0 && <span className="text-slate-600 ml-1.5">({stats.correct}/{stats.total})</span>}
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  {pct !== null && (
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity + Platform */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '450ms' }}>
        {/* Recent Activity */}
        <div className="glass-card glass-edge rounded-xl p-5">
          <h2 className="section-heading mb-4 flex items-center gap-2">
            <Clock size={15} className="text-blue-400" />
            Recent Activity
          </h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-slate-500">No quiz sessions yet.</p>
          ) : (
            <div className="space-y-2">
              {[...sessions].reverse().slice(0, 5).map((s) => {
                const pct = Math.round((s.score / s.total) * 100);
                const passed = pct >= 72;
                const date = new Date(s.finishedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                return (
                  <div key={s.id} className="flex items-center justify-between text-sm bg-slate-800/50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${passed ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                      <span className="text-slate-300 text-xs">
                        {s.domainFilter !== null ? `D${s.domainFilter}` : 'Full Exam'}
                      </span>
                      <span className="text-slate-600 text-xs">{date}</span>
                    </div>
                    <span className={`font-mono text-xs font-semibold ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          <Link
            to="/skillup/ccaf/progress"
            className="inline-flex items-center gap-1.5 mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors group"
          >
            View full history
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Platform Overview */}
        <div className="glass-card glass-edge rounded-xl p-5">
          <h2 className="section-heading mb-4 flex items-center gap-2">
            <BookOpen size={15} className="text-emerald-400" />
            Platform Overview
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Study Days</span>
              <span className="text-white font-mono">{streak}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Passing Sessions</span>
              <span className="text-emerald-400 font-mono">{passCount}/{sessions.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Blog Posts Published</span>
              <span className="text-white font-mono">{blogCount}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Last Session</span>
              <span className="text-white text-xs">{latestDate || 'None'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Exam Target</span>
              <span className="text-amber-400 font-mono">CCA-F</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="mt-5 pt-4 border-t border-slate-800/50 space-y-2">
            <Link to="/skillup/ccaf/quiz" className="flex items-center gap-2 text-xs text-slate-400 hover:text-violet-300 hover:translate-x-0.5 transition-all">
              <Brain size={12} /> Start a quiz session
            </Link>
            <Link to="/skillup/ccaf/notes" className="flex items-center gap-2 text-xs text-slate-400 hover:text-violet-300 hover:translate-x-0.5 transition-all">
              <BookOpen size={12} /> Review study notes
            </Link>
            <Link to="/blog" className="flex items-center gap-2 text-xs text-slate-400 hover:text-violet-300 hover:translate-x-0.5 transition-all">
              <Calendar size={12} /> Browse blog articles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}