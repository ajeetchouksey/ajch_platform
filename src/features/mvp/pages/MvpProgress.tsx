import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  Trophy, BarChart2, Users, FileCheck, Lock,
  AlertTriangle, CheckCircle, AlertCircle,
  ExternalLink, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';

const OWNER_LOGIN = 'ajeetchouksey';
const REPO = 'ajeetchouksey/ajch_platform';

// ── Types ─────────────────────────────────────────────────────────────────────

interface MvpData {
  lastUpdated: string;
  targetDate: string;
  targets: Record<string, number>;
  current: Record<string, number>;
  quarters: Quarter[];
  domainCoverage: DomainCoverage[];
  agentRecommendations: Recommendation[];
  agentLastRun: string;
  agentNextRun: string;
  growthPlaybook: GrowthItem[];
  pipeline: PipelineItem[];
}

interface Quarter {
  id: string;
  label: string;
  start: string;
  end: string;
  color: string;
  issueNumbers: number[];
  issueLabels: string[];
  status: 'active' | 'planned' | 'complete';
  openCount: number;
  closedCount: number;
  contentTargets?: Record<string, number>;
}

interface DomainCoverage {
  domain: string;
  pct: number;
  status: 'critical' | 'low' | 'good';
}

interface Recommendation {
  severity: 'critical' | 'warning' | 'ok';
  title: string;
  desc: string;
  action: string;
  issueNumber: number | null;
}

interface PipelineItem {
  issueNumber: number;
  title: string;
  quarter: string;
  priority: string;
}

interface GrowthItem {
  metric: string;
  label: string;
  color: string;
  weeklyAction: string;
  tactics: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const QUARTER_COLORS: Record<string, string> = {
  violet: '#8b5cf6',
  cyan:   '#22d3ee',
  amber:  '#fbbf24',
  green:  '#34d399',
};

const QUARTER_TRACK: Record<string, string> = {
  violet: 'rgba(139,92,246,0.12)',
  cyan:   'rgba(34,211,238,0.12)',
  amber:  'rgba(251,191,36,0.12)',
  green:  'rgba(52,211,153,0.12)',
};

function pct(current: number, target: number) {
  return Math.min(100, Math.round((current / target) * 100));
}

function fmtNum(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

const COVERAGE_COLOR: Record<string, string> = {
  critical: '#ef4444',
  low:      '#f59e0b',
  good:     '#34d399',
};

const COVERAGE_GRADIENT: Record<string, string> = {
  critical: 'linear-gradient(90deg,#dc2626,#f87171)',
  low:      'linear-gradient(90deg,#d97706,#fbbf24)',
  good:     'linear-gradient(90deg,#059669,#34d399)',
};

const SEV_ICON: Record<string, React.ReactNode> = {
  critical: <AlertCircle   size={16} className="text-red-400   flex-shrink-0 mt-0.5" />,
  warning:  <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />,
  ok:       <CheckCircle   size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />,
};

const SEV_BORDER: Record<string, string> = {
  critical: 'border-l-red-500',
  warning:  'border-l-amber-500',
  ok:       'border-l-emerald-500',
};

// ── Sub-components ────────────────────────────────────────────────────────────

const METRICS: { key: string; label: string; color: string; fill: string; live?: boolean }[] = [
  { key: 'blogs',         label: '✎ Blogs',           color: '#22d3ee', fill: 'linear-gradient(90deg,#0891b2,#22d3ee)', live: true },
  { key: 'videos',        label: '▶ Videos',           color: '#8b5cf6', fill: 'linear-gradient(90deg,#6d28d9,#8b5cf6)' },
  { key: 'architectures', label: '⬡ Architectures',    color: '#f59e0b', fill: 'linear-gradient(90deg,#d97706,#fbbf24)', live: true },
  { key: 'useCases',      label: '🏭 Use Cases',       color: '#34d399', fill: 'linear-gradient(90deg,#059669,#34d399)', live: true },
  { key: 'interviewQuestions', label: '🧑‍💼 Interviews', color: '#f59e0b', fill: 'linear-gradient(90deg,#d97706,#fbbf24)', live: true },
  { key: 'skillupExams',  label: '📚 Skillup Exams',   color: '#22d3ee', fill: 'linear-gradient(90deg,#0891b2,#22d3ee)', live: true },
  { key: 'aiTools',       label: '🛠 AI Tools',         color: '#34d399', fill: 'linear-gradient(90deg,#059669,#34d399)', live: true },
  { key: 'communityArticles', label: '🌍 Community Articles', color: '#22d3ee', fill: 'linear-gradient(90deg,#0891b2,#22d3ee)', live: true },
  { key: 'linkedin',      label: '🔗 LinkedIn',         color: '#22d3ee', fill: 'linear-gradient(90deg,#0891b2,#22d3ee)' },
  { key: 'community',     label: '👥 Community',       color: '#8b5cf6', fill: 'linear-gradient(90deg,#6d28d9,#8b5cf6)' },
  { key: 'speaking',      label: '🎤 Speaking',         color: '#34d399', fill: 'linear-gradient(90deg,#059669,#34d399)' },
  { key: 'mentoring',     label: '🧑‍🏫 Mentoring',     color: '#f59e0b', fill: 'linear-gradient(90deg,#d97706,#fbbf24)' },
  { key: 'ossRepos',      label: '📦 OSS Repos',        color: '#22d3ee', fill: 'linear-gradient(90deg,#0891b2,#22d3ee)' },
  { key: 'githubStars',   label: '⭐ GitHub Stars',    color: '#8b5cf6', fill: 'linear-gradient(90deg,#6d28d9,#8b5cf6)', live: true },
];

function MetricCard({ label, current, target, color, fill, live }: {
  label: string; current: number; target: number; color: string; fill: string; live?: boolean;
}) {
  const p = pct(current, target);
  return (
    <div className="rounded-xl p-4 transition-all duration-200 hover:scale-[1.02]"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] text-slate-500">{label}</p>
        {live && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>live</span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-2.5">
        <span className="text-2xl font-bold" style={{ color }}>{fmtNum(current)}</span>
        <span className="text-xs text-slate-500">/ {fmtNum(target)}</span>
      </div>
      <div className="h-1 rounded-full bg-slate-800 overflow-hidden mb-1.5">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: fill }} />
      </div>
      <p className="text-[10px] text-slate-600">
        {p}%{p === 0 ? ' · not started' : p < 20 ? ' · critical' : p < 60 ? ' · on track' : ' · good'}
      </p>
    </div>
  );
}

// SVG ring with animated stroke-dashoffset
function RingChart({ pct: p, color, track }: { pct: number; color: string; track: string }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - p / 100);
  return (
    <div className="relative w-[76px] h-[76px] mx-auto mb-3">
      <svg width="76" height="76" viewBox="0 0 76 76" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="38" cy="38" r={r} fill="none" stroke={track} strokeWidth="8" />
        <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base font-bold" style={{ color: p === 0 ? '#475569' : color }}>{p}%</span>
        <span className="text-[9px] text-slate-600">done</span>
      </div>
    </div>
  );
}

function QuarterCard({ q, current }: { q: Quarter; current: Record<string, number> }) {
  const color = QUARTER_COLORS[q.color] ?? '#8b5cf6';
  const track = QUARTER_TRACK[q.color]  ?? 'rgba(139,92,246,0.12)';

  // content progress = average % across this quarter's target metrics
  const contentEntries = Object.entries(q.contentTargets ?? {});
  const contentPct = contentEntries.length > 0
    ? Math.round(contentEntries.reduce((sum, [k, t]) => sum + Math.min(100, ((current[k] ?? 0) / t) * 100), 0) / contentEntries.length)
    : 0;

  // issue progress (fallback when content has no targets)
  const total = q.openCount + q.closedCount;
  const issuePct = total > 0 ? Math.round((q.closedCount / total) * 100) : 0;

  // ring shows content progress if targets defined, else issue progress
  const ringPct = contentEntries.length > 0 ? contentPct : issuePct;

  const METRIC_LABELS: Record<string, string> = {
    blogs: 'Blogs', skillupExams: 'Exams', aiTools: 'Tools', useCases: 'Use Cases',
    interviewQuestions: 'Interviews', communityArticles: 'Community Art.', videos: 'Videos',
    speaking: 'Speaking', mentoring: 'Mentoring', linkedin: 'LinkedIn',
    architectures: 'Architecture', ossRepos: 'OSS Repos', githubStars: 'Stars',
  };

  const statusBadge = q.status === 'active'
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(139,92,246,0.15)', color, border: `1px solid ${color}40` }}>Active</span>
    : q.status === 'complete'
    ? <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>Done</span>
    : <span className="text-[10px] px-2 py-0.5 rounded-full font-medium text-slate-500 bg-slate-800/60 border border-slate-700/40">Planned</span>;

  return (
    <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold" style={{ color }}>{q.id} — {q.label}</span>
        {statusBadge}
      </div>
      <RingChart pct={ringPct} color={color} track={track} />
      <p className="text-[10px] text-slate-500 text-center mb-3">{q.start} → {q.end}</p>

      {/* content progress chips */}
      {contentEntries.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {contentEntries.map(([k, t]) => {
            const c = current[k] ?? 0;
            const p = Math.min(100, Math.round((c / t) * 100));
            const done = p >= 100;
            return (
              <div key={k}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-slate-400">{METRIC_LABELS[k] ?? k}</span>
                  <span style={{ color: done ? '#34d399' : p > 50 ? color : '#f59e0b' }}>
                    {c}/{t} {done ? '✓' : `${p}%`}
                  </span>
                </div>
                <div className="h-0.5 rounded-full bg-slate-800">
                  <div className="h-full rounded-full" style={{ width: `${p}%`, background: done ? '#34d399' : color, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* epic issues */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800/40">
        {q.issueLabels.map((label, i) => (
          <a key={i} href={`https://github.com/${REPO}/issues/${q.issueNumbers[i]}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-slate-200 transition-colors group">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />
            <span className="flex-1 truncate">{label}</span>
            <ExternalLink size={9} className="opacity-0 group-hover:opacity-60 transition-opacity" />
          </a>
        ))}
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-slate-800/40 text-[10px] text-slate-500">
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>{q.openCount} open</span>
        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>{q.closedCount} closed</span>
      </div>
    </div>
  );
}

const Q_TAG_STYLE: Record<string, React.CSSProperties> = {
  Q1: { color: '#67e8f9', borderColor: 'rgba(103,232,249,0.3)', background: 'rgba(103,232,249,0.07)' },
  Q2: { color: '#a78bfa', borderColor: 'rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.07)' },
  Q3: { color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)',  background: 'rgba(251,191,36,0.07)'  },
  Q4: { color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.07)' },
};

const P_TAG_STYLE: Record<string, React.CSSProperties> = {
  P1: { color: '#f87171', borderColor: 'rgba(248,113,113,0.3)', background: 'rgba(248,113,113,0.07)' },
  P2: { color: '#fbbf24', borderColor: 'rgba(251,191,36,0.3)',  background: 'rgba(251,191,36,0.07)'  },
};

function GrowthCard({ item, current, target, expanded, onToggle }: {
  item: GrowthItem; current: number; target: number; expanded: boolean; onToggle: () => void;
}) {
  const p = pct(current, target);
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${item.color}22` }}>
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold" style={{ color: item.color }}>{item.label}</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono" style={{ color: p < 20 ? '#ef4444' : p < 50 ? '#f59e0b' : '#34d399' }}>
              {fmtNum(current)}/{fmtNum(target)}
            </span>
            {expanded ? <ChevronUp size={13} className="text-slate-500" /> : <ChevronDown size={13} className="text-slate-500" />}
          </div>
        </div>
        <div className="h-1 rounded-full bg-slate-800 overflow-hidden mb-3">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${p}%`, background: item.color, opacity: 0.7 }} />
        </div>
        <div className="flex items-start gap-2 p-2.5 rounded-lg"
          style={{ background: `${item.color}10`, border: `1px solid ${item.color}25` }}>
          <span className="text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ color: item.color }}>⚡ THIS WEEK</span>
          <p className="text-[11px] text-slate-300 leading-relaxed">{item.weeklyAction}</p>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800/40">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-3 mb-2">Growth Tactics</p>
          <ul className="space-y-2">
            {item.tactics.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-slate-400 leading-relaxed">
                <span className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.color }} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function MvpProgress() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData]         = useState<MvpData | null>(null);
  const [mounted, setMounted]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  // live-fetched overrides (blog count from index, stars from GH API)
  const [liveOverrides, setLiveOverrides] = useState<Record<string, number>>({});

  const isOwner = user?.login === OWNER_LOGIN;

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  useEffect(() => {
    // blog count from the content index (source of truth)
    fetch('/content/blog/index.json')
      .then(r => r.json())
      .then((d: { posts: { draft?: boolean }[] }) => {
        const count = d.posts.filter(p => !p.draft).length;
        setLiveOverrides(prev => ({ ...prev, blogs: count }));
      })
      .catch(() => {});
    // GitHub stars from public API (no auth needed for public repos)
    fetch(`https://api.github.com/repos/${REPO}`)
      .then(r => r.json())
      .then((d: { stargazers_count: number }) => {
        setLiveOverrides(prev => ({ ...prev, githubStars: d.stargazers_count }));
      })
      .catch(() => {});
    // use case count from index
    fetch('/content/usecases/index.json')
      .then(r => r.json())
      .then((d: { totalCount: number }) => {
        setLiveOverrides(prev => ({ ...prev, useCases: d.totalCount }));
      })
      .catch(() => {});
    // interview question count = bank questions × role addendums (from interviews index)
    fetch('/content/interviews/index.json')
      .then(r => r.json())
      .then((d: { roles: { questionCount: number }[] }) => {
        const total = d.roles.reduce((s, r) => s + (r.questionCount ?? 0), 0);
        setLiveOverrides(prev => ({ ...prev, interviewQuestions: total }));
      })
      .catch(() => {});
    // skillup exam count from catalog
    fetch('/content/skillup/catalog.json')
      .then(r => r.json())
      .then((d: { exams: unknown[] }) => {
        setLiveOverrides(prev => ({ ...prev, skillupExams: d.exams.length }));
      })
      .catch(() => {});
    // ai tools count from manifest (source of truth alongside Tools.tsx)
    fetch('/content/tools/index.json')
      .then(r => r.json())
      .then((d: { tools: unknown[] }) => {
        setLiveOverrides(prev => ({ ...prev, aiTools: d.tools.length }));
      })
      .catch(() => {});
    // architecture blogs: only posts tagged ai-architecture or system-design
    fetch('/content/blog/index.json')
      .then(r => r.json())
      .then((d: { posts: { draft?: boolean; tags?: string[] }[] }) => {
        const ARCH_TAGS = new Set(['ai-architecture', 'system-design']);
        const count = d.posts.filter(p => !p.draft && p.tags?.some(t => ARCH_TAGS.has(t))).length;
        setLiveOverrides(prev => ({ ...prev, architectures: count }));
      })
      .catch(() => {});
    // pathways catalog: community articles (community-reach tracks) + architecture articles
    fetch('/content/pathways/catalog.json')
      .then(r => r.json())
      .then((d: { tracks: { categories: string[]; articleCount: number }[] }) => {
        const community = d.tracks
          .filter(t => t.categories.includes('community'))
          .reduce((s, t) => s + t.articleCount, 0);
        const arch = d.tracks
          .filter(t => t.categories.includes('architecture'))
          .reduce((s, t) => s + t.articleCount, 0);
        setLiveOverrides(prev => ({
          ...prev,
          communityArticles: community,
          // add Discovery architecture articles on top of blog architecture count
          architectures: (prev.architectures ?? 0) + arch,
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/content/mvp-progress.json')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

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

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <RefreshCw size={18} className="text-slate-500 animate-spin" />
      </div>
    );
  }

  const { targets, current: staticCurrent, quarters, domainCoverage, agentRecommendations, agentLastRun, agentNextRun, growthPlaybook, pipeline } = data;
  // merge live-fetched values over the static JSON values
  const current = { ...staticCurrent, ...liveOverrides };

  return (
    <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <p className="page-eyebrow mb-1">Owner · Private</p>
          <h1 className="text-2xl font-black tracking-tight">
            MVP Progress <span className="heading-gradient">Dashboard</span>
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full font-medium"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }}>
            <Trophy size={11} />
            MVP Strategist active
          </div>
          <div className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full font-medium"
            style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Updated {agentLastRun}
          </div>
          <span className="text-xs text-slate-600">Next run: {agentNextRun}</span>
        </div>
      </div>

      {/* ── Scorecard ───────────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Success Metrics — Target {data.targetDate}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {METRICS.map(m => (
            <MetricCard key={m.key}
              label={m.label}
              current={current[m.key] ?? 0}
              target={targets[m.key] ?? 1}
              color={m.color}
              fill={m.fill}
              live={m.live}
            />
          ))}
        </div>
      </section>

      {/* ── Quarterly Roadmap ────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Quarterly Roadmap</h2>
          <a href={`https://github.com/${REPO}/labels/MSMVPAI`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
            View all issues <ExternalLink size={10} />
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quarters.map(q => (
            <QuarterCard key={q.id} q={q} current={current} />
          ))}
        </div>
      </section>

      {/* ── Gap heatmap + Agent recs ─────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Domain coverage gap */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Domain Coverage Gap</h2>
          <div className="space-y-3">
            {domainCoverage.map(d => (
              <div key={d.domain} className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400 w-36 flex-shrink-0">{d.domain}</span>
                <div className="flex-1 h-5 rounded bg-slate-800/60 border border-slate-700/30 overflow-hidden">
                  <div className="h-full flex items-center pl-2 text-[10px] font-semibold text-white/80 rounded transition-all duration-700"
                    style={{ width: `${d.pct}%`, background: COVERAGE_GRADIENT[d.status] }}>
                    {d.pct}%
                  </div>
                </div>
                <span className="text-[11px] w-14 text-right flex-shrink-0 font-medium"
                  style={{ color: COVERAGE_COLOR[d.status] }}>
                  {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Agent recommendations */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-4">Agent Recommendations</h2>
          <div className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full mb-4 font-medium"
            style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.25)' }}>
            <Trophy size={11} /> MVP Strategist · {agentLastRun}
          </div>
          <div className="space-y-3">
            {agentRecommendations.map((rec, i) => (
              <div key={i} className={`flex gap-3 p-3 rounded-lg bg-slate-800/40 border-l-[3px] ${SEV_BORDER[rec.severity]}`}>
                {SEV_ICON[rec.severity]}
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-200 mb-1">{rec.title}</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{rec.desc}</p>
                  {rec.issueNumber ? (
                    <a href={`https://github.com/${REPO}/issues/${rec.issueNumber}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 mt-1.5 transition-colors">
                      → {rec.action} <ExternalLink size={9} />
                    </a>
                  ) : (
                    <p className="text-[11px] text-violet-400 mt-1.5">→ {rec.action}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-4">Next run: {agentNextRun} · Update `mvp-progress.json` to refresh</p>
        </div>
      </section>
      {/* ── Growth Playbook ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="mb-4">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Growth Playbook</h2>
          <p className="text-xs text-slate-600 mt-1">One action per metric this week. Expand for the full tactics list.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(growthPlaybook ?? []).map(item => (
            <GrowthCard
              key={item.metric}
              item={item}
              current={current[item.metric] ?? 0}
              target={targets[item.metric] ?? 1}
              expanded={expanded === item.metric}
              onToggle={() => setExpanded(expanded === item.metric ? null : item.metric)}
            />
          ))}
        </div>
      </section>
      {/* ── Content pipeline ─────────────────────────────────────────────── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Content Pipeline (MSMVPAI backlog)</h2>
          <a href={`https://github.com/${REPO}/labels/MSMVPAI`} target="_blank" rel="noopener noreferrer"
            className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
            View all <ExternalLink size={10} />
          </a>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="divide-y divide-slate-800/40">
            {pipeline.map(item => (
              <a key={item.issueNumber}
                href={`https://github.com/${REPO}/issues/${item.issueNumber}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors group"
                style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span className="text-[10px] text-slate-600 w-8 flex-shrink-0 font-mono">#{item.issueNumber}</span>
                <span className="flex-1 text-xs text-slate-300 truncate group-hover:text-slate-100 transition-colors">{item.title}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] px-2 py-0.5 rounded-full border" style={Q_TAG_STYLE[item.quarter]}>{item.quarter}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full border" style={P_TAG_STYLE[item.priority]}>{item.priority}</span>
                  <ExternalLink size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── MVP agents callout ───────────────────────────────────────────── */}
      <section className="rounded-xl p-5 mb-4" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
        <h2 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">MVP & Growth Strategy Agents</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Trophy,    name: 'MVP Strategist',     role: 'Weekly analysis, recommendations',  color: '#8b5cf6' },
            { icon: BarChart2, name: 'Content Gap Analyst', role: 'Tracks content vs targets',         color: '#22d3ee' },
            { icon: Users,     name: 'Community Tracker',  role: 'LinkedIn, stars, speaking, mentoring', color: '#f59e0b' },
            { icon: FileCheck, name: 'Evidence Curator',   role: 'Packages MVP nomination evidence',  color: '#34d399' },
          ].map(({ icon: Icon, name, role, color }) => (
            <div key={name} className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-900/40">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon size={13} style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 leading-tight">{name}</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
