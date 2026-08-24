import { useState, useEffect, useCallback, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth, useIsOwner } from '@/lib/auth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  GitPullRequest, Lock, RefreshCw, ChevronLeft,
  ChevronDown, MessageSquare, CheckCircle2, Circle, Loader2,
  KeyRound, X, Send, ExternalLink, Tag, Milestone,
} from 'lucide-react';

const REPO = 'ajeetchouksey/ajch_platform';
const MAX_PAGES = 10; // cap at 1000 issues

// -- GitHub types --------------------------------------------------------------
interface GhLabel { name: string; color: string; }
interface GhMilestone { number: number; title: string; }
interface GhUser { login: string; avatar_url: string; }

interface GhIssue {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: GhLabel[];
  milestone: GhMilestone | null;
  user: GhUser;
  created_at: string;
  html_url: string;
  comments: number;
  pull_request?: unknown;
}

interface GhComment {
  id: number;
  user: GhUser;
  body: string;
  created_at: string;
}

interface Filters {
  state: 'open' | 'closed' | 'all';
  label: string;
  milestone: string;
  search: string;
}

// -- Helpers ------------------------------------------------------------------
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function labelStyle(color: string): React.CSSProperties {
  const r = parseInt(color.slice(0, 2), 16);
  const g = parseInt(color.slice(2, 4), 16);
  const b = parseInt(color.slice(4, 6), 16);
  return {
    background: `rgba(${r},${g},${b},0.15)`,
    color: `rgb(${r},${g},${b})`,
    border: `1px solid rgba(${r},${g},${b},0.3)`,
  };
}

function apiHeaders(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// -- Safe Markdown renderer (no rehype-raw -- XSS-safe) -----------------------
function SafeMarkdown({ children }: { children: string }) {
  return (
    <div className="prose prose-invert prose-xs max-w-none text-xs text-slate-300
      prose-headings:text-slate-200 prose-headings:font-semibold
      prose-code:bg-slate-800 prose-code:text-slate-300 prose-code:rounded prose-code:px-1
      prose-a:text-sky-400 prose-a:no-underline hover:prose-a:underline
      prose-pre:bg-slate-800 prose-pre:border prose-pre:border-slate-700
      prose-blockquote:border-slate-600 prose-blockquote:text-slate-400
      prose-hr:border-slate-700 prose-li:text-slate-300">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

// -- Main component -----------------------------------------------------------
export default function IssueBoard() {
  const { token, isLoading: authLoading } = useAuth();
  const isOwner = useIsOwner();
  const adminToken = token;

  const [issues, setIssues] = useState<GhIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchTick, setFetchTick] = useState(0);

  const [filters, setFilters] = useState<Filters>({ state: 'open', label: '', milestone: '', search: '' });
  const [allLabels, setAllLabels] = useState<GhLabel[]>([]);
  const [allMilestones, setAllMilestones] = useState<GhMilestone[]>([]);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [msOpen, setMsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selected, setSelected] = useState<GhIssue | null>(null);
  const [comments, setComments] = useState<GhComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [writeError, setWriteError] = useState<string | null>(null);

  // Labels + milestones -- all setState in .then() callbacks
  useEffect(() => {
    const headers = apiHeaders(adminToken);
    Promise.all([
      fetch(`https://api.github.com/repos/${REPO}/labels?per_page=100`, { headers })
        .then(r => r.ok ? r.json() as Promise<GhLabel[]> : []),
      fetch(`https://api.github.com/repos/${REPO}/milestones?per_page=30&state=all`, { headers })
        .then(r => r.ok ? r.json() as Promise<GhMilestone[]> : []),
    ]).then(([labels, milestones]) => {
      setAllLabels(labels);
      setAllMilestones(milestones);
    }).catch(() => {});
  }, [adminToken]);

  // Fetch ALL issues (auto-paginate state=all, filter client-side)
  useEffect(() => {
    let cancelled = false;
    const headers = apiHeaders(adminToken);
    const all: GhIssue[] = [];

    function fetchPage(p: number): Promise<void> {
      return fetch(
        `https://api.github.com/repos/${REPO}/issues?per_page=100&page=${p}&state=all`,
        { headers }
      )
        .then(r => r.ok ? r.json() as Promise<GhIssue[]> : [] as GhIssue[])
        .then((data: GhIssue[]) => {
          all.push(...data.filter(i => !i.pull_request));
          if (data.length === 100 && p < MAX_PAGES) return fetchPage(p + 1);
        });
    }

    fetchPage(1)
      .then(() => { if (!cancelled) { setIssues(all); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [adminToken, fetchTick]);

  // Comments -- setCommentsLoading/setComments called in click handler (selectIssue), .then() clears
  useEffect(() => {
    if (!selected) return;
    fetch(`https://api.github.com/repos/${REPO}/issues/${selected.number}/comments?per_page=100`,
      { headers: apiHeaders(adminToken) })
      .then(r => r.ok ? r.json() as Promise<GhComment[]> : [])
      .then(data => {
        setComments(data);
        setCommentsLoading(false);
      })
      .catch(() => setCommentsLoading(false));
  }, [selected, adminToken]);

  // click handler -- initializes loading state before the above effect fires
  const selectIssue = useCallback((issue: GhIssue) => {
    setSelected(issue);
    setComments([]);
    setCommentsLoading(true);
    setWriteError(null);
  }, []);

  const pFilter = useCallback((f: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...f }));
  }, []);

  // Write: close / reopen
  const toggleState = useCallback(async () => {
    if (!selected || !adminToken) return;
    setToggling(true);
    setWriteError(null);
    const newState = selected.state === 'open' ? 'closed' : 'open';
    const res = await fetch(`https://api.github.com/repos/${REPO}/issues/${selected.number}`, {
      method: 'PATCH',
      headers: { ...apiHeaders(adminToken), 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: newState }),
    });
    if (res.ok) {
      const updated: GhIssue = await res.json();
      setSelected(updated);
      setIssues(prev => prev.map(i => i.number === updated.number ? updated : i));
    } else {
      setWriteError('Failed to update -- check PAT scope (public_repo required).');
    }
    setToggling(false);
  }, [selected, adminToken]);

  // Write: add comment
  const addComment = useCallback(async () => {
    if (!selected || !adminToken || !newComment.trim()) return;
    if (newComment.length > 65536) {
      setWriteError('Comment too long (max 65,536 chars).');
      return;
    }
    setSubmitting(true);
    setWriteError(null);
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/issues/${selected.number}/comments`,
      {
        method: 'POST',
        headers: { ...apiHeaders(adminToken), 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newComment.trim() }),
      },
    );
    if (res.ok) {
      const c: GhComment = await res.json();
      setComments(prev => [...prev, c]);
      setNewComment('');
      setSelected(prev => prev ? { ...prev, comments: prev.comments + 1 } : prev);
    } else {
      setWriteError('Failed to add comment -- check PAT scope.');
    }
    setSubmitting(false);
  }, [selected, adminToken, newComment]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-slate-500 text-sm animate-pulse">Checking auth...</span>
      </div>
    );
  }
  if (!isOwner) return <Navigate to="/" replace />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Link to="/admin" className="text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft size={16} />
        </Link>
        <GitPullRequest size={16} className="text-emerald-400" />
        <h1 className="text-lg font-bold text-slate-100 tracking-tight">Issue Board</h1>
        <Lock size={12} className="text-slate-600 ml-1" />
        <a href={`https://github.com/${REPO}/issues`} target="_blank" rel="noopener noreferrer"
          className="ml-auto text-slate-500 hover:text-slate-300 transition-colors">
          <ExternalLink size={14} />
        </a>
      </div>
      <p className="text-slate-500 text-sm mb-5 ml-7">GitHub issues -- filter, view, close/reopen, comment</p>

      {!adminToken && (
        <div className="mb-4 rounded-xl px-4 py-3 flex items-center gap-2.5"
          style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)' }}>
          <KeyRound size={13} className="text-amber-400 shrink-0" />
          <p className="text-xs text-slate-400">
            No token — read-only mode.{' '}
            <Link to="/admin" className="text-amber-400 hover:underline">Login via Admin</Link>
            {' '}to enable write ops (close, comment).
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 items-center" ref={dropdownRef}>
        {/* State */}
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {(['open', 'closed', 'all'] as const).map(s => (
            <button key={s} onClick={() => pFilter({ state: s })}
              className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filters.state === s ? 'bg-slate-700 text-slate-100' : 'text-slate-500 hover:text-slate-300'
              }`}>
              {s}
            </button>
          ))}
        </div>

        {/* Label dropdown */}
        <div className="relative">
          <button onClick={() => { setLabelsOpen(p => !p); setMsOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <Tag size={11} />
            {filters.label || 'Label'}
            <ChevronDown size={11} />
          </button>
          {labelsOpen && (
            <div className="absolute z-20 mt-1 w-52 rounded-xl py-1 shadow-xl"
              style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(71,85,105,0.3)' }}>
              <button onClick={() => { pFilter({ label: '' }); setLabelsOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5">
                All labels
              </button>
              {allLabels.map(l => (
                <button key={l.name} onClick={() => { pFilter({ label: l.name }); setLabelsOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-white/5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: `#${l.color}` }} />
                  <span className="text-slate-300">{l.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Milestone dropdown */}
        <div className="relative">
          <button onClick={() => { setMsOpen(p => !p); setLabelsOpen(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <Milestone size={11} />
            {filters.milestone
              ? allMilestones.find(m => String(m.number) === filters.milestone)?.title ?? 'Milestone'
              : 'Milestone'}
            <ChevronDown size={11} />
          </button>
          {msOpen && (
            <div className="absolute z-20 mt-1 w-48 rounded-xl py-1 shadow-xl"
              style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(71,85,105,0.3)' }}>
              <button onClick={() => { pFilter({ milestone: '' }); setMsOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5">
                All milestones
              </button>
              {allMilestones.map(m => (
                <button key={m.number} onClick={() => { pFilter({ milestone: String(m.number) }); setMsOpen(false); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5">
                  {m.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          value={filters.search}
          onChange={e => pFilter({ search: e.target.value })}
          placeholder="Search titles..."
          className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-700 text-slate-200 outline-none focus:border-slate-500 w-48"
        />

        <button onClick={() => { setLoading(true); setFetchTick(t => t + 1); }} disabled={loading}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors disabled:opacity-40">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Split layout */}
      <div className={`flex gap-4 ${selected ? 'items-start' : ''}`}>
        {/* Issue list */}
        <div className={`flex flex-col gap-1 ${selected ? 'w-2/5 min-w-0' : 'w-full'}`}>
          {loading && issues.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="text-slate-500 animate-spin" />
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">No issues found.</div>
          ) : (
            issues
              .filter(i => {
                if (filters.state !== 'all' && i.state !== filters.state) return false;
                if (filters.label && !i.labels.some(l => l.name === filters.label)) return false;
                if (filters.milestone && String(i.milestone?.number) !== filters.milestone) return false;
                if (filters.search && !i.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
                return true;
              })
              .map(issue => (
                <button key={issue.number} onClick={() => selectIssue(issue)}
                  className={`text-left rounded-xl px-4 py-3 transition-all ${
                    selected?.number === issue.number
                      ? 'bg-white/[0.06] border border-white/10'
                      : 'hover:bg-white/[0.03] border border-transparent'
                  }`}>
                  <div className="flex items-start gap-2">
                    {issue.state === 'open'
                      ? <Circle size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                      : <CheckCircle2 size={13} className="text-slate-500 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-slate-200 leading-snug block">
                        {issue.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] text-slate-600">#{issue.number}</span>
                        {issue.milestone && (
                          <span className="text-[10px] text-slate-500">{issue.milestone.title}</span>
                        )}
                        {issue.labels.slice(0, 3).map(l => (
                          <span key={l.name} className="text-[10px] px-1.5 py-0.5 rounded-full"
                            style={labelStyle(l.color)}>{l.name}</span>
                        ))}
                        {issue.comments > 0 && (
                          <span className="text-[10px] text-slate-600 flex items-center gap-0.5">
                            <MessageSquare size={9} /> {issue.comments}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))
          )}

          {!loading && (
            <p className="text-center py-2 text-xs text-slate-600">
              {issues.filter(i => {
                if (filters.state !== 'all' && i.state !== filters.state) return false;
                if (filters.label && !i.labels.some(l => l.name === filters.label)) return false;
                if (filters.milestone && String(i.milestone?.number) !== filters.milestone) return false;
                if (filters.search && !i.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
                return true;
              }).length} of {issues.length} issues
            </p>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-3/5 min-w-0 rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Detail header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {selected.state === 'open'
                    ? <Circle size={13} className="text-emerald-400 shrink-0" />
                    : <CheckCircle2 size={13} className="text-slate-500 shrink-0" />}
                  <span className="text-[10px] text-slate-500">#{selected.number}</span>
                  <a href={selected.html_url} target="_blank" rel="noopener noreferrer"
                    className="text-slate-500 hover:text-slate-300 transition-colors ml-auto">
                    <ExternalLink size={12} />
                  </a>
                  <button onClick={() => setSelected(null)} className="text-slate-600 hover:text-slate-300 transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <h2 className="text-sm font-semibold text-slate-100 leading-snug">{selected.title}</h2>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selected.labels.map(l => (
                    <span key={l.name} className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={labelStyle(l.color)}>{l.name}</span>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5">
                  by @{selected.user.login} · {fmtDate(selected.created_at)}
                  {selected.milestone && ` · ${selected.milestone.title}`}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 border-b border-slate-800 max-h-60 overflow-y-auto">
              {selected.body ? (
                <SafeMarkdown>{selected.body}</SafeMarkdown>
              ) : (
                <span className="text-xs text-slate-600 italic">No description.</span>
              )}
            </div>

            {/* Write ops */}
            {adminToken && (
              <div className="px-5 py-3 border-b border-slate-800 flex items-center gap-3">
                <button onClick={toggleState} disabled={toggling}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 ${
                    selected.state === 'open'
                      ? 'bg-rose-900/30 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50'
                  }`}>
                  {toggling ? <Loader2 size={12} className="animate-spin" /> : (
                    selected.state === 'open' ? <CheckCircle2 size={12} /> : <Circle size={12} />
                  )}
                  {selected.state === 'open' ? 'Close issue' : 'Reopen issue'}
                </button>
                {writeError && <span className="text-xs text-red-400">{writeError}</span>}
              </div>
            )}

            {/* Comments */}
            <div className="px-5 py-4 border-b border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
                <MessageSquare size={10} /> Comments ({selected.comments})
              </p>
              {commentsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 size={16} className="text-slate-500 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-slate-600 italic">No comments yet.</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {comments.map(c => (
                    <div key={c.id} className="rounded-lg px-3 py-2.5"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <img src={c.user.avatar_url} alt="" className="w-4 h-4 rounded-full" />
                        <span className="text-[10px] font-semibold text-slate-400">@{c.user.login}</span>
                        <span className="text-[10px] text-slate-600">{fmtDate(c.created_at)}</span>
                      </div>
                      <SafeMarkdown>{c.body}</SafeMarkdown>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add comment */}
            {adminToken ? (
              <div className="px-5 py-4">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Leave a comment..."
                  rows={3}
                  maxLength={65536}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-slate-500 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-600">{newComment.length} / 65536</span>
                  <button
                    onClick={addComment}
                    disabled={submitting || !newComment.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700/40 text-emerald-300 disabled:opacity-40 hover:bg-emerald-700/60 transition-colors">
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                    Comment
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4">
                <p className="text-xs text-slate-500">
                  <Link to="/admin" className="text-amber-400 hover:underline">Login via Admin</Link>
                  {' '}to enable commenting.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
