import { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import {
  loadExamRegistry,
  loadBlogManifest,
  loadAllUseCases,
  type AnyUseCase,
} from '@/lib/content-loader';
import type { ExamConfig, BlogPostMeta } from '@/types/content';
import {
  Video, Lock, CheckCircle2, XCircle, ExternalLink,
  RefreshCw, Plus, Eye, ChevronLeft, Loader2, KeyRound,
} from 'lucide-react';

const OWNER_LOGIN = 'ajeetchouksey';
const DEV_BYPASS = import.meta.env.VITE_BYPASS_ADMIN_AUTH === 'true';
const REPO = 'ajeetchouksey/ajch_platform';

const TOOLS = [
  'Token Counter', 'Context Visualizer', 'MCP Scaffold', 'RAG Chunk Visualizer',
  'Prompt Tester', 'Prompt Library', 'System Prompt Builder', 'Model Cost Calculator',
  'Tool Schema Builder',
];

type ContentArea = 'exam-domain' | 'blog' | 'usecase' | 'tool';

interface ContentItem {
  area: ContentArea;
  id: string;
  title: string;
  issueTitle: string;
  mvpDomain?: string;
}

interface GhIssue {
  number: number;
  title: string;
  html_url: string;
  state: 'open' | 'closed';
}

const AREA_LABELS: Record<ContentArea, string> = {
  'exam-domain': 'Exam Domain',
  blog: 'Blog Post',
  usecase: 'Use Case',
  tool: 'Tool',
};
const AREA_COLORS: Record<ContentArea, string> = {
  'exam-domain': 'bg-violet-900/30 text-violet-300',
  blog: 'bg-sky-900/30 text-sky-300',
  usecase: 'bg-amber-900/30 text-amber-300',
  tool: 'bg-emerald-900/30 text-emerald-300',
};

function buildItems(
  exams: ExamConfig[],
  posts: BlogPostMeta[],
  usecases: AnyUseCase[],
): ContentItem[] {
  const items: ContentItem[] = [];
  for (const exam of exams) {
    if (!exam.available) continue;
    for (const domain of exam.domains) {
      items.push({
        area: 'exam-domain',
        id: `${exam.id}-d${domain.id}`,
        title: `${exam.shortTitle} D${domain.id} — ${domain.title}`,
        issueTitle: `[YouTube] ${exam.shortTitle} D${domain.id} — ${domain.title}`,
        mvpDomain: exam.shortTitle,
      });
    }
  }
  for (const post of posts) {
    if (post.draft) continue;
    items.push({
      area: 'blog',
      id: `blog-${post.slug}`,
      title: post.title,
      issueTitle: `[YouTube] Blog — ${post.title}`,
      mvpDomain: 'Field Notes',
    });
  }
  for (const uc of usecases) {
    items.push({
      area: 'usecase',
      id: `uc-${uc.id}`,
      title: uc.title,
      issueTitle: `[YouTube] Use Case — ${uc.title}`,
      mvpDomain: 'Use Cases',
    });
  }
  for (const tool of TOOLS) {
    items.push({
      area: 'tool',
      id: `tool-${tool.toLowerCase().replace(/\s+/g, '-')}`,
      title: tool,
      issueTitle: `[YouTube] Tool — ${tool}`,
      mvpDomain: 'Tools',
    });
  }
  return items;
}

async function fetchYoutubeIssues(token?: string | null): Promise<GhIssue[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const issues: GhIssue[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/issues?labels=youtube&state=all&per_page=100&page=${page}`,
      { headers },
    );
    if (!res.ok) break;
    const batch: GhIssue[] = await res.json();
    if (batch.length === 0) break;
    issues.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return issues;
}

async function createGhIssue(item: ContentItem, token: string): Promise<GhIssue | null> {
  const body = [
    `## YouTube Content Issue`,
    ``,
    `**Content area**: ${item.area}`,
    `**Title**: ${item.title}`,
    ``,
    `### Purpose`,
    `Create a YouTube video covering this content to fill the platform video gap and align with MVP reach objectives.`,
    ``,
    `### MVP Alignment`,
    item.mvpDomain ? `Domain: ${item.mvpDomain}` : `General platform content`,
    ``,
    `### Checklist`,
    `- [ ] Script drafted`,
    `- [ ] Recording completed`,
    `- [ ] Edited and uploaded to YouTube`,
    `- [ ] Linked back in platform content`,
  ].join('\n');

  const res = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: item.issueTitle, body, labels: ['youtube', 'content-gap'] }),
  });
  if (!res.ok) return null;
  return res.json() as Promise<GhIssue>;
}

// -- Main component -----------------------------------------------------------
export default function YoutubeTracker() {
  const { user, token, isLoading: authLoading } = useAuth();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [ghIssues, setGhIssues] = useState<GhIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'missing' | 'covered'>('all');
  const [areaFilter, setAreaFilter] = useState<ContentArea | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  // all setState in .then() callbacks -- not synchronously in effect body
  useEffect(() => {
    Promise.all([
      loadExamRegistry(),
      loadBlogManifest(),
      loadAllUseCases(),
      fetchYoutubeIssues(token),
    ])
      .then(([registry, manifest, usecases, issues]) => {
        setItems(buildItems(registry.exams, manifest.posts, usecases));
        setGhIssues(issues);
        setError(null);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load content or GitHub issues.');
        setLoading(false);
      });
  }, [token, refreshTick]);

  const load = useCallback(() => {
    setLoading(true);
    setRefreshTick(t => t + 1);
  }, []);

  const handleCreate = useCallback(async (item: ContentItem) => {
    if (!token) return;
    setCreating(item.id);
    const newIssue = await createGhIssue(item, token);
    if (newIssue) setGhIssues(prev => [...prev, newIssue]);
    else setError('Failed to create issue — check your PAT has public_repo scope. Login via /admin.');
    setCreating(null);
  }, [token]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-500 text-sm animate-pulse">Checking auth...</span>
      </div>
    );
  }
  if (!DEV_BYPASS && (!user || user.login !== OWNER_LOGIN)) return <Navigate to="/" replace />;

  const issueByTitle = new Map(ghIssues.map(i => [i.title, i]));
  const getMatch = (item: ContentItem) => issueByTitle.get(item.issueTitle);

  const filtered = items.filter(item => {
    if (areaFilter !== 'all' && item.area !== areaFilter) return false;
    const covered = !!getMatch(item);
    if (filter === 'covered') return covered;
    if (filter === 'missing') return !covered;
    return true;
  });

  const stats = {
    total: items.length,
    covered: items.filter(i => !!getMatch(i)).length,
    missing: items.filter(i => !getMatch(i)).length,
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Link to="/admin" className="text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft size={16} />
        </Link>
        <Video size={16} className="text-red-400" />
        <h1 className="text-lg font-bold text-slate-100 tracking-tight">YouTube Tracker</h1>
        <Lock size={12} className="text-slate-600 ml-1" />
      </div>
      <p className="text-slate-500 text-sm mb-6 ml-7">Content coverage — which items need YouTube video issues</p>

      {/* No token warning */}
      {!token && (
        <div className="mb-5 rounded-xl px-4 py-3 flex items-center gap-2.5"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <KeyRound size={13} className="text-amber-400 shrink-0" />
          <p className="text-xs text-slate-400">
            No token — read-only mode.{' '}
            <Link to="/admin" className="text-amber-400 hover:underline">Login via Admin</Link>
            {' '}to enable issue creation.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total items', value: stats.total, color: 'text-slate-300' },
          { label: 'Covered', value: stats.covered, color: 'text-emerald-400' },
          { label: 'Missing', value: stats.missing, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="rounded-xl p-4 text-center"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className={`text-2xl font-bold ${s.color}`}>{loading ? '—' : s.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {(['all', 'missing', 'covered'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                filter === f ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {(['all', 'exam-domain', 'blog', 'usecase', 'tool'] as const).map(a => (
            <button key={a} onClick={() => setAreaFilter(a)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                areaFilter === a ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {a === 'all' ? 'All' : AREA_LABELS[a]}
            </button>
          ))}
        </div>
        <button onClick={load} disabled={loading}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors disabled:opacity-40">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-xs text-red-300 bg-red-900/20 border border-red-800/40">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={20} className="text-slate-500 animate-spin" />
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-slate-800">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <th className="text-left px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Content</th>
                <th className="text-left px-3 py-2.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Area</th>
                <th className="text-left px-3 py-2.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                <th className="text-right px-4 py-2.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, idx) => {
                const match = getMatch(item);
                return (
                  <tr key={item.id}
                    className="border-b border-slate-800/60 transition-colors hover:bg-white/[0.02]"
                    style={{ background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td className="px-4 py-2.5 text-slate-200 font-medium max-w-xs">
                      <span className="block truncate">{item.title}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${AREA_COLORS[item.area]}`}>
                        {AREA_LABELS[item.area]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {match ? (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 size={13} />
                          <span>#{match.number}</span>
                          {match.state === 'closed' && (
                            <span className="text-[10px] text-slate-500">(closed)</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-red-400">
                          <XCircle size={13} />
                          <span>Missing</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {match ? (
                        <a href={match.html_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors">
                          <Eye size={12} /> View <ExternalLink size={10} />
                        </a>
                      ) : token ? (
                        <button
                          disabled={creating === item.id}
                          onClick={() => handleCreate(item)}
                          className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors disabled:opacity-40">
                          {creating === item.id
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Plus size={12} />}
                          Create Issue
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Login needed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-600 text-xs">
                    No items match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
