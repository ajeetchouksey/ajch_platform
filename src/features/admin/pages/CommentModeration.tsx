import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useIsOwner } from '@/lib/auth';
import { GlassCard, Button } from '@/components/ui';
import { ChevronLeft, MessageCircle, EyeOff, Eye, Lock, Unlock, KeyRound } from 'lucide-react';

// IDEA-0009 Phase 4 — minimal admin surface for FR-6 (hide/unhide) and FR-12
// (lock/unlock a thread or page). Auth is the interim ADMIN_API_SECRET Worker
// secret (see the Env doc comment in workers/subscribe.ts) — entered here and
// kept in sessionStorage only, never sent anywhere but this Worker's own
// moderation routes. useIsOwner() just gates who can even see this page;
// the Worker is the real enforcement point.

const WORKER_URL = (import.meta.env.VITE_SUBSCRIBE_WORKER_URL as string | undefined) ?? '';
const SECRET_KEY = 'aarya_admin_secret';

interface ModComment {
  id: number;
  parentCommentId: number | null;
  authorName: string | null;
  body: string;
  createdAt: string;
  status: string;
  locked?: boolean;
}

export default function CommentModeration() {
  const isOwner = useIsOwner();
  const [secret, setSecret] = useState(() => sessionStorage.getItem(SECRET_KEY) ?? '');
  const [contentId, setContentId] = useState('');
  const [comments, setComments] = useState<ModComment[] | null>(null);
  const [pageLocked, setPageLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  if (!isOwner) return <Navigate to="/" replace />;
  if (!WORKER_URL) return <p className="max-w-2xl mx-auto px-4 py-10 text-sm text-slate-500">Worker not configured.</p>;

  const saveSecret = (v: string) => {
    setSecret(v);
    sessionStorage.setItem(SECRET_KEY, v);
  };

  const load = async () => {
    if (!contentId.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${WORKER_URL}/api/comment?contentId=${encodeURIComponent(contentId.trim())}&limit=100`, {
        headers: secret ? { Authorization: `Bearer ${secret}` } : {},
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json() as { comments: ModComment[]; pageLocked: boolean };
      setComments(data.comments);
      setPageLocked(data.pageLocked);
    } catch {
      setError('Could not load comments for that content ID.');
    } finally {
      setLoading(false);
    }
  };

  const call = async (path: string, body: Record<string, unknown>) => {
    if (!secret.trim()) {
      setError('Enter the admin secret first.');
      return false;
    }
    const res = await fetch(`${WORKER_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` },
      body: JSON.stringify(body),
    });
    return res.ok;
  };

  const toggleHide = async (c: ModComment) => {
    setBusyId(c.id);
    const ok = await call(`/api/comment/${c.id}/${c.status === 'hidden' ? 'unhide' : 'hide'}`, { reason: 'admin action' });
    if (ok) {
      setComments((prev) => (prev ?? []).map((x) => (x.id === c.id ? { ...x, status: c.status === 'hidden' ? 'visible' : 'hidden' } : x)));
    } else {
      setError('Action failed — check the admin secret.');
    }
    setBusyId(null);
  };

  const toggleLockThread = async (c: ModComment) => {
    setBusyId(c.id);
    const ok = await call(`/api/comment/${c.id}/${c.locked ? 'unlock' : 'lock'}`, { scope: 'thread', reason: 'admin action' });
    if (ok) {
      setComments((prev) => (prev ?? []).map((x) => (x.id === c.id ? { ...x, locked: !x.locked } : x)));
    } else {
      setError('Action failed — check the admin secret.');
    }
    setBusyId(null);
  };

  const toggleLockPage = async () => {
    const anchor = comments?.[0];
    if (!anchor) {
      setError('Load at least one comment for this content ID before locking the page.');
      return;
    }
    const ok = await call(`/api/comment/${anchor.id}/${pageLocked ? 'unlock' : 'lock'}`, { scope: 'page', reason: 'admin action' });
    if (ok) setPageLocked((v) => !v);
    else setError('Action failed — check the admin secret.');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mb-4">
        <ChevronLeft size={13} /> Admin
      </Link>
      <div className="flex items-center gap-2.5 mb-2">
        <MessageCircle size={15} className="text-violet-400" />
        <h1 className="text-xl font-bold text-slate-100 tracking-tight">Comment Moderation</h1>
      </div>
      <p className="text-slate-500 text-sm mb-6">Hide, unhide, lock, or unlock comments per content ID.</p>

      <GlassCard accent="violet" className="p-4 mb-4">
        <label htmlFor="admin-secret" className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
          <KeyRound size={11} /> Admin secret
        </label>
        <input
          id="admin-secret"
          type="password"
          value={secret}
          onChange={(e) => saveSecret(e.target.value)}
          placeholder="ADMIN_API_SECRET"
          className="w-full mb-3 px-3 py-1.5 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus:border-violet-500/60"
        />
        <label htmlFor="content-id" className="text-[11px] text-slate-400 mb-1 block">Content ID</label>
        <div className="flex gap-2">
          <input
            id="content-id"
            type="text"
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void load()}
            placeholder="usecase-123"
            className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus:border-violet-500/60"
          />
          <Button variant="primary" size="sm" disabled={loading} onClick={() => void load()}>
            {loading ? 'Loading…' : 'Load'}
          </Button>
        </div>
      </GlassCard>

      {error && <p className="text-xs text-rose-400 mb-3">{error}</p>}

      {comments !== null && (
        <>
          <div className="flex justify-end mb-2">
            <Button variant="outline" size="xs" icon={pageLocked ? Unlock : Lock} onClick={() => void toggleLockPage()}>
              {pageLocked ? 'Unlock page' : 'Lock page'}
            </Button>
          </div>

          {comments.length === 0 && <p className="text-xs text-slate-500">No comments for this content ID.</p>}

          <div className="space-y-2">
            {comments.map((c) => (
              <GlassCard key={c.id} border="border-slate-700/40" className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">
                      #{c.id} · {c.authorName ?? 'Anonymous'}
                      {c.parentCommentId !== null && <span className="text-slate-600"> (reply to #{c.parentCommentId})</span>}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {c.status}{c.locked ? ' · locked' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => void toggleHide(c)}
                      disabled={busyId === c.id}
                      aria-label={c.status === 'hidden' ? 'Unhide comment' : 'Hide comment'}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {c.status === 'hidden' ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                    {c.parentCommentId === null && (
                      <button
                        onClick={() => void toggleLockThread(c)}
                        disabled={busyId === c.id}
                        aria-label={c.locked ? 'Unlock thread' : 'Lock thread'}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {c.locked ? <Unlock size={13} /> : <Lock size={13} />}
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 whitespace-pre-wrap">{c.body}</p>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
