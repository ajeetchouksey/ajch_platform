import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { ThumbsUp, ThumbsDown, Star, ChevronLeft, Lock, Trash2, BarChart2, TrendingUp } from 'lucide-react';

const OWNER_LOGIN = 'ajeetchouksey';
const DEV_BYPASS = import.meta.env.VITE_BYPASS_ADMIN_AUTH === 'true';
const WORKER_URL = (import.meta.env.VITE_SUBSCRIBE_WORKER_URL as string | undefined) ?? '';

type Vote = 'up' | 'down';
type ContentType = 'blog' | 'usecase' | 'exam-notes' | 'exam' | 'tools' | 'other';

interface ReactionEntry {
  key: string;
  contentId: string;
  type: ContentType;
  vote?: Vote;
  starred?: boolean;
  href: string;
  label: string;
}

function parseContentId(rawId: string): { type: ContentType; href: string; label: string } {
  if (rawId.startsWith('blog-')) {
    const slug = rawId.slice(5);
    return { type: 'blog', href: `/blog/${slug}`, label: slug };
  }
  if (rawId.startsWith('usecase-')) {
    const id = rawId.slice(8);
    return { type: 'usecase', href: `/usecases/${id}`, label: id };
  }
  if (rawId.startsWith('exam-')) {
    const id = rawId.slice(5);
    return { type: 'exam', href: `/skillup/${id}`, label: id };
  }
  if (rawId === 'tools') {
    return { type: 'tools', href: '/tools', label: 'Tools page' };
  }
  // examId-domain-N pattern (Notes)
  if (rawId.includes('-domain-')) {
    const parts = rawId.split('-domain-');
    return { type: 'exam-notes', href: `/skillup/${parts[0]}/notes?domain=${parts[1]}`, label: `${parts[0]} · Domain ${parts[1]}` };
  }
  return { type: 'other', href: '#', label: rawId };
}

function readLocalData(): ReactionEntry[] {
  const map = new Map<string, ReactionEntry>();

  for (let i = 0; i < localStorage.length; i++) {
    const lsKey = localStorage.key(i);
    if (!lsKey?.startsWith('aarya_fb_')) continue;

    const contentId = lsKey.slice('aarya_fb_'.length);
    const vote = localStorage.getItem(lsKey) as Vote;
    const parsed = parseContentId(contentId);
    map.set(contentId, { ...parsed, key: lsKey, contentId, vote, starred: vote === 'up' });
  }

  return Array.from(map.values()).sort((a, b) => a.type.localeCompare(b.type) || a.label.localeCompare(b.label));
}

const TYPE_LABEL: Record<ContentType, string> = {
  blog: 'Blog',
  usecase: 'Use Case',
  'exam-notes': 'Exam Notes',
  exam: 'Exam',
  tools: 'Tools',
  other: 'Other',
};

export default function Reactions() {
  const { user, isLoading: authLoading } = useAuth();
  // lazy init reads localStorage once on mount — no effect needed
  const [entries, setEntries] = useState<ReactionEntry[]>(() => readLocalData());
  const [signalData, setSignalData] = useState<{ total: number; byContent: Record<string, number> } | null>(null);
  useEffect(() => {
    if (WORKER_URL) {
      fetch(`${WORKER_URL}/api/signal/total`)
        .then(r => r.json() as Promise<{ total: number; byContent: Record<string, number> }>)
        .then(setSignalData)
        .catch(() => {});
    }
  }, []);

  const clear = (entry: ReactionEntry) => {
    localStorage.removeItem(`aarya_fb_${entry.contentId}`);
    localStorage.removeItem(`aarya_star_${entry.contentId}`);
    setEntries(prev => prev.filter(e => e.contentId !== entry.contentId));
  };

  if (authLoading) return null;
  if (!DEV_BYPASS && (!user || user.login !== OWNER_LOGIN)) return <Navigate to="/" replace />;

  const likes = entries.filter(e => e.vote === 'up').length;
  const dislikes = entries.filter(e => e.vote === 'down').length;
  const stars = entries.filter(e => e.starred).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-1">
        <Link to="/admin" className="text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronLeft size={16} />
        </Link>
        <BarChart2 size={16} className="text-violet-400" />
        <h1 className="text-lg font-bold text-slate-100 tracking-tight">Content Reactions</h1>
        <Lock size={12} className="text-slate-600 ml-1" />
      </div>
      <p className="text-slate-500 text-sm mb-6 ml-7">Your personal feedback &amp; bookmarks stored in this browser</p>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { icon: <ThumbsUp size={13} />, value: likes, label: 'Liked', color: 'text-emerald-400', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
          { icon: <ThumbsDown size={13} />, value: dislikes, label: 'Needs work', color: 'text-rose-400', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
          { icon: <Star size={13} />, value: stars, label: 'Bookmarked', color: 'text-amber-400', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
        ].map(({ icon, value, label, color, bg, border }) => (
          <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${color}`}
            style={{ background: bg, border: `1px solid ${border}` }}>
            {icon} {value} <span className="font-normal text-slate-500 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(71,85,105,0.15)' }}>
          No reactions or bookmarks yet. Browse content and give feedback!
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(71,85,105,0.18)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(71,85,105,0.18)' }}>
                <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Content</th>
                <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Feedback</th>
                <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Bookmarked</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.contentId}
                  style={{
                    background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.6)',
                    borderBottom: i < entries.length - 1 ? '1px solid rgba(71,85,105,0.1)' : undefined,
                  }}>
                  <td className="px-4 py-2.5">
                    <Link to={entry.href}
                      className="text-xs text-slate-300 hover:text-violet-300 transition-colors font-medium truncate block max-w-[240px]">
                      {entry.label.replace(/-/g, ' ')}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] px-2 py-0.5 rounded-lg text-slate-400"
                      style={{ background: 'rgba(71,85,105,0.2)', border: '1px solid rgba(71,85,105,0.2)' }}>
                      {TYPE_LABEL[entry.type]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {entry.vote === 'up' && <span className="inline-flex items-center gap-1 text-emerald-400 text-xs"><ThumbsUp size={12} className="fill-emerald-400" /> Liked</span>}
                    {entry.vote === 'down' && <span className="inline-flex items-center gap-1 text-rose-400 text-xs"><ThumbsDown size={12} className="fill-rose-400" /> Needs work</span>}
                    {!entry.vote && <span className="text-slate-700 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {entry.starred
                      ? <Star size={13} className="text-amber-400 fill-amber-400 mx-auto" />
                      : <span className="text-slate-700 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <button onClick={() => clear(entry)} aria-label="Clear"
                      className="text-slate-700 hover:text-rose-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* ── Platform Signal Analytics (from Worker Gist) ── */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={15} className="text-pink-400" />
          <h2 className="text-sm font-bold text-slate-200 tracking-tight">Platform Signal Analytics</h2>
          <span className="text-[10px] text-slate-600 ml-1">all users · from Worker Gist</span>
          {signalData && (
            <span className="ml-auto text-[11px] font-semibold text-pink-300">
              {signalData.total} total helpful signals
            </span>
          )}
        </div>

        {!signalData ? (
          <p className="text-xs text-slate-600 py-4">{WORKER_URL ? 'Loading…' : 'VITE_SUBSCRIBE_WORKER_URL not set'}</p>
        ) : Object.keys(signalData.byContent).length === 0 ? (
          <p className="text-xs text-slate-600 py-4">No signals recorded yet.</p>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(244,114,182,0.15)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.8)', borderBottom: '1px solid rgba(244,114,182,0.12)' }}>
                  <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Content</th>
                  <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Helpful ♥</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(signalData.byContent)
                  .sort((a, b) => b[1] - a[1])
                  .map(([contentId, count], i, arr) => {
                    const { type, href, label } = parseContentId(contentId);
                    const pct = signalData.total > 0 ? Math.round((count / signalData.total) * 100) : 0;
                    return (
                      <tr key={contentId}
                        style={{
                          background: i % 2 === 0 ? 'rgba(15,23,42,0.4)' : 'rgba(15,23,42,0.6)',
                          borderBottom: i < arr.length - 1 ? '1px solid rgba(71,85,105,0.1)' : undefined,
                        }}>
                        <td className="px-4 py-2.5">
                          <Link to={href}
                            className="text-xs text-slate-300 hover:text-pink-300 transition-colors font-medium truncate block max-w-[260px]">
                            {label.replace(/-/g, ' ')}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="text-[10px] px-2 py-0.5 rounded-lg text-slate-400"
                            style={{ background: 'rgba(71,85,105,0.2)', border: '1px solid rgba(71,85,105,0.2)' }}>
                            {TYPE_LABEL[type]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1 rounded-full bg-slate-800 overflow-hidden">
                              <div className="h-full rounded-full bg-pink-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs font-bold text-pink-300 w-5 text-right">{count}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
