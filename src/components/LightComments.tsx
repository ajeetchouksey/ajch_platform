import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageCircle, Send, Trash2, Reply as ReplyIcon, Lock,
  Bold, Italic, List as ListIcon, ListOrdered, Link2, Code2, Eye, EyeOff,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GlassCard, Button } from '@/components/ui';
import { useAuth, isProviderConfigured } from '@/lib/auth';

// IDEA-0009 Phase 3 — one-level-deep replies (FR-2/FR-4) and @mention tagging (FR-13).
// Posting now requires login — the display name comes from the authenticated identity,
// not free text — and the body supports Markdown rich text (bold/italic/lists/links/code).

const WORKER_URL = (import.meta.env.VITE_SUBSCRIBE_WORKER_URL as string | undefined) ?? '';
const BODY_MAX = 2000;
const PAGE_SIZE = 20;
const REPLIES_COLLAPSE_AT = 3;

interface CommentDTO {
  id: number;
  parentCommentId: number | null;
  authorName: string | null;
  body: string;
  createdAt: string;
  /** FR-12 thread-scope lock (Phase 4) — only ever true on a top-level comment. */
  locked?: boolean;
}

interface CommentNode extends CommentDTO {
  replies: CommentDTO[];
}

function ownerTokenKey(id: number) {
  return `aarya_comment_owner_${id}`;
}

function storeOwnerToken(id: number, token: string) {
  try {
    localStorage.setItem(ownerTokenKey(id), token);
  } catch {
    /* localStorage unavailable (private mode etc.) — delete affordance just won't show */
  }
}

function getOwnerToken(id: number): string | null {
  try {
    return localStorage.getItem(ownerTokenKey(id));
  } catch {
    return null;
  }
}

function clearOwnerToken(id: number) {
  try {
    localStorage.removeItem(ownerTokenKey(id));
  } catch {
    /* localStorage unavailable — nothing to clear */
  }
}

function formatRelativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : new Date(iso).toLocaleDateString();
}

/** Groups a flat, oldest-first comment list into top-level nodes with their replies attached. */
function nestComments(flat: CommentDTO[]): CommentNode[] {
  const byId = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];
  for (const c of flat) byId.set(c.id, { ...c, replies: [] });
  for (const c of flat) {
    if (c.parentCommentId === null) {
      roots.push(byId.get(c.id)!);
    } else {
      byId.get(c.parentCommentId)?.replies.push(c);
    }
  }
  return roots;
}

/**
 * Rewrites @mentions (matched against other real display names already present in the
 * same thread, FR-13) into a sentinel markdown link so they survive normal Markdown
 * parsing and render as a styled tag instead of a real link (see CommentBody's `a`
 * override below). Purely presentational — matching text is never validated against
 * who can "see" it.
 */
function markMentions(body: string, knownNames: string[]): string {
  if (knownNames.length === 0) return body;
  const names = [...knownNames].sort((a, b) => b.length - a.length);
  const isWordChar = (ch: string | undefined) => !!ch && /[\p{L}\p{N}]/u.test(ch);
  let out = '';
  let i = 0;
  while (i < body.length) {
    if (body[i] === '@' && !isWordChar(body[i - 1])) {
      const match = names.find((name) => {
        const slice = body.slice(i + 1, i + 1 + name.length);
        return slice.toLowerCase() === name.toLowerCase() && !isWordChar(body[i + 1 + name.length]);
      });
      if (match) {
        out += `[@${match}](#mention)`;
        i += 1 + match.length;
        continue;
      }
    }
    out += body[i];
    i += 1;
  }
  return out;
}

/** Renders a comment body as Markdown — no raw-HTML passthrough (no rehype-raw plugin), so
 * any literal HTML a user types renders as inert text rather than being interpreted as markup. */
function CommentBody({ body, knownNames }: { body: string; knownNames: string[] }) {
  return (
    <div className="text-xs text-slate-400 leading-relaxed mt-1.5 [&_p]:mb-1.5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_code]:bg-slate-800/80 [&_code]:rounded [&_code]:px-1 [&_blockquote]:border-l-2 [&_blockquote]:border-slate-700 [&_blockquote]:pl-2 [&_blockquote]:text-slate-500">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) =>
            href === '#mention' ? (
              <span className="text-violet-300 font-medium bg-violet-500/10 rounded px-1">{children}</span>
            ) : (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-400 underline hover:text-violet-300">
                {children}
              </a>
            ),
        }}
      >
        {markMentions(body, knownNames)}
      </ReactMarkdown>
    </div>
  );
}

/** Wraps the current textarea selection in `before`/`after` markdown syntax (e.g. **bold**). */
function wrapSelection(
  el: HTMLTextAreaElement | null,
  value: string,
  setValue: (v: string) => void,
  before: string,
  after: string = before,
) {
  if (!el) { setValue(value + before + after); return; }
  const { selectionStart, selectionEnd } = el;
  const selected = value.slice(selectionStart, selectionEnd);
  const next = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
  setValue(next);
  requestAnimationFrame(() => {
    el.focus();
    const cursor = selectionStart + before.length + selected.length + after.length;
    el.setSelectionRange(cursor, cursor);
  });
}

/** Prefixes every line of the current selection with `prefix` (e.g. "- " for a bullet list). */
function prefixLines(
  el: HTMLTextAreaElement | null,
  value: string,
  setValue: (v: string) => void,
  prefix: string,
) {
  if (!el) { setValue(value + prefix); return; }
  const { selectionStart, selectionEnd } = el;
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
  const block = value.slice(lineStart, selectionEnd);
  const prefixed = block.split('\n').map((line) => `${prefix}${line}`).join('\n');
  const next = value.slice(0, lineStart) + prefixed + value.slice(selectionEnd);
  setValue(next);
  requestAnimationFrame(() => el.focus());
}

interface FormatToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  setValue: (v: string) => void;
  previewing: boolean;
  onTogglePreview: () => void;
}

const TOOLBAR_BTN = 'p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 disabled:opacity-40 transition-colors';

/** Minimal Markdown formatting toolbar shared by the top-level box and every reply box. */
function FormatToolbar({ textareaRef, value, setValue, previewing, onTogglePreview }: FormatToolbarProps) {
  return (
    <div className="flex items-center gap-0.5 mb-1.5">
      <button
        type="button" title="Bold" disabled={previewing} className={TOOLBAR_BTN}
        onClick={() => { if (!previewing) wrapSelection(textareaRef.current, value, setValue, '**'); }}
      >
        <Bold size={12} />
      </button>
      <button
        type="button" title="Italic" disabled={previewing} className={TOOLBAR_BTN}
        onClick={() => { if (!previewing) wrapSelection(textareaRef.current, value, setValue, '_'); }}
      >
        <Italic size={12} />
      </button>
      <button
        type="button" title="Bulleted list" disabled={previewing} className={TOOLBAR_BTN}
        onClick={() => { if (!previewing) prefixLines(textareaRef.current, value, setValue, '- '); }}
      >
        <ListIcon size={12} />
      </button>
      <button
        type="button" title="Numbered list" disabled={previewing} className={TOOLBAR_BTN}
        onClick={() => { if (!previewing) prefixLines(textareaRef.current, value, setValue, '1. '); }}
      >
        <ListOrdered size={12} />
      </button>
      <button
        type="button" title="Link" disabled={previewing} className={TOOLBAR_BTN}
        onClick={() => { if (!previewing) wrapSelection(textareaRef.current, value, setValue, '[', '](https://)'); }}
      >
        <Link2 size={12} />
      </button>
      <button
        type="button" title="Code" disabled={previewing} className={TOOLBAR_BTN}
        onClick={() => { if (!previewing) wrapSelection(textareaRef.current, value, setValue, '`'); }}
      >
        <Code2 size={12} />
      </button>
      <button type="button" title={previewing ? 'Edit' : 'Preview'} onClick={onTogglePreview} className={`ml-auto ${TOOLBAR_BTN}`}>
        {previewing ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
    </div>
  );
}

interface LightCommentsProps {
  contentId: string;
}

export function LightComments({ contentId }: LightCommentsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  // FR-12 page-scope lock (Phase 4) — blocks the whole compose box, not just one thread.
  const [pageLocked, setPageLocked] = useState(false);

  const { user, token, login } = useAuth();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // FR-2 — reply state is single-slot: only one reply box open at a time.
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyPreviewing, setReplyPreviewing] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  // FR-4 — which top-level threads have expanded past the collapse-at-3 default.
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set());

  // NFR-7 — lazy-fetch only once the section actually scrolls into view.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !WORKER_URL) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const loadPage = useCallback(async (offset: number) => {
    const res = await fetch(
      `${WORKER_URL}/api/comment?contentId=${encodeURIComponent(contentId)}&limit=${PAGE_SIZE}&offset=${offset}`,
    );
    if (!res.ok) throw new Error(String(res.status));
    return res.json() as Promise<{ comments: CommentDTO[]; hasMore: boolean; pageLocked: boolean }>;
  }, [contentId]);

  useEffect(() => {
    if (!inView) return;
    loadPage(0)
      .then((data) => {
        setComments(data.comments);
        setHasMore(data.hasMore);
        setPageLocked(data.pageLocked);
      })
      .catch(() => setListError('Comments are unavailable right now — try again later.'));
  }, [inView, loadPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await loadPage(comments?.length ?? 0);
      setComments((prev) => [...(prev ?? []), ...data.comments]);
      setHasMore(data.hasMore);
    } catch {
      setListError('Could not load more comments — try again later.');
    } finally {
      setLoadingMore(false);
    }
  };

  /** Shared by the top-level box and every inline reply box — only the parentId and the small
   * bits of local state (which box to clear, which spinner/error to drive) differ per caller. */
  const postComment = async (
    text: string,
    parentId: number | null,
    opts: {
      setBusy: (v: boolean) => void;
      setError: (v: string | null) => void;
      onSuccess: () => void;
    },
  ) => {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      opts.setError('Write something before posting.');
      return;
    }
    if (trimmed.length > BODY_MAX) {
      opts.setError(`Comments are capped at ${BODY_MAX} characters.`);
      return;
    }
    opts.setBusy(true);
    opts.setError(null);
    try {
      const res = await fetch(`${WORKER_URL}/api/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          contentId,
          parentCommentId: parentId ?? undefined,
          body: trimmed,
          honeypot,
        }),
      });
      if (res.status === 401) {
        opts.setError('Please sign in to comment.');
        return;
      }
      if (res.status === 503) {
        opts.setError('Comments are temporarily disabled.');
        return;
      }
      if (res.status === 429) {
        opts.setError('Too many comments too fast — try again in a few minutes.');
        return;
      }
      if (res.status === 403) {
        opts.setError('This discussion is locked.');
        return;
      }
      if (!res.ok) {
        opts.setError('Could not post — try again.');
        return;
      }
      const data = await res.json() as { id: number; ownerToken: string; authorName: string };
      storeOwnerToken(data.id, data.ownerToken);
      // FR-3 — append locally instead of refetching, so it renders immediately.
      const posted: CommentDTO = {
        id: data.id,
        parentCommentId: parentId,
        authorName: data.authorName,
        body: trimmed,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...(prev ?? []), posted]);
      opts.onSuccess();
    } catch {
      opts.setError('Could not post — try again.');
    } finally {
      opts.setBusy(false);
    }
  };

  const submit = () => {
    if (!user) { setFormError('Please sign in to comment.'); return; }
    void postComment(body, null, {
      setBusy: setSubmitting,
      setError: setFormError,
      onSuccess: () => { setBody(''); setPreviewing(false); },
    });
  };

  const submitReply = (parentId: number) => {
    if (!user) { setReplyError('Please sign in to comment.'); return; }
    void postComment(replyBody, parentId, {
      setBusy: setReplySubmitting,
      setError: setReplyError,
      onSuccess: () => {
        setReplyBody('');
        setReplyingTo(null);
        setReplyPreviewing(false);
      },
    });
  };

  const deleteComment = async (id: number) => {
    const savedOwnerToken = getOwnerToken(id);
    if (!savedOwnerToken) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${WORKER_URL}/api/comment/${id}`, {
        method: 'DELETE',
        headers: { 'X-Owner-Token': savedOwnerToken },
      });
      if (res.ok) {
        const hasReplies = (comments ?? []).some((c) => c.parentCommentId === id);
        if (hasReplies) {
          // Backend tombstones rather than removes when replies exist (FR-11) — mirror
          // that locally so the thread's replies don't disappear from nestComments(),
          // and drop the now-invalid owner token (a retry would just 403).
          setComments((prev) => (prev ?? []).map((c) => (
            c.id === id ? { ...c, body: '[deleted]', authorName: null } : c
          )));
          clearOwnerToken(id);
        } else {
          setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
        }
      }
    } catch {
      /* leave the comment as-is — the reader can retry the delete */
    } finally {
      setDeletingId(null);
    }
  };

  if (!WORKER_URL) return null; // no Worker configured (e.g. static preview) — omit the section entirely

  const threads = comments !== null ? nestComments(comments) : null;

  return (
    <div ref={containerRef} className="mt-10">
      <h2 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
        <MessageCircle size={14} className="text-violet-400" />
        Comments
      </h2>

      <GlassCard accent="violet" className="p-4 mb-4">
        {pageLocked ? (
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock size={12} className="text-slate-600" /> Comments are locked for this page.
          </p>
        ) : !user ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-400">Sign in to leave a comment.</p>
            <div className="flex items-center gap-2 shrink-0">
              {isProviderConfigured('github') && (
                <Button variant="outline" size="xs" onClick={() => { void login('github'); }}>Sign in with GitHub</Button>
              )}
              {isProviderConfigured('google') && (
                <Button variant="outline" size="xs" onClick={() => { void login('google'); }}>Sign in with Google</Button>
              )}
            </div>
          </div>
        ) : (
          <>
        {/* Honeypot — off-screen, never visible to a real reader; bots that fill every field trip it. */}
        <input
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
        />
        <label htmlFor={`comment-body-${contentId}`} className="sr-only">Comment</label>
        <FormatToolbar textareaRef={bodyRef} value={body} setValue={setBody} previewing={previewing} onTogglePreview={() => setPreviewing((v) => !v)} />
        {previewing ? (
          <div className="mb-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 min-h-[4.5rem]">
            {body.trim() ? <CommentBody body={body} knownNames={[]} /> : <p className="text-xs text-slate-600">Nothing to preview yet.</p>}
          </div>
        ) : (
          <textarea
            id={`comment-body-${contentId}`}
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share a question or a thought about this use case… (Markdown supported)"
            rows={3}
            maxLength={BODY_MAX}
            className="w-full mb-2 px-3 py-2 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus:border-violet-500/60 resize-y"
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Posting as {user.name ?? user.login}. We store a hashed IP only to prevent
            spam (never the raw address), and you can delete your own comment any time.
          </p>
          <Button variant="primary" size="sm" icon={Send} disabled={submitting} onClick={submit}>
            Post
          </Button>
        </div>
        <p role="status" aria-live="polite" className="mt-2 text-[11px] text-rose-400 min-h-[1em]">
          {formError}
        </p>
          </>
        )}
      </GlassCard>

      {listError && <p className="text-xs text-rose-400">{listError}</p>}

      {threads === null && !listError && (
        <p className="text-xs text-slate-500">Loading comments…</p>
      )}

      {threads !== null && threads.length === 0 && (
        <p className="text-xs text-slate-500">No comments yet — be the first.</p>
      )}

      {threads !== null && threads.length > 0 && (
        <div className="space-y-2">
          {threads.map((c) => {
            const isDeletable = getOwnerToken(c.id) !== null && c.body !== '[deleted]';
            // FR-13 — mentionable names scoped to this one thread, not the whole page.
            const threadNames = [c.authorName, ...c.replies.map((r) => r.authorName)]
              .filter((n): n is string => !!n);
            const expanded = expandedThreads.has(c.id);
            const visibleReplies = expanded ? c.replies : c.replies.slice(0, REPLIES_COLLAPSE_AT);
            const hiddenCount = c.replies.length - visibleReplies.length;

            return (
              <GlassCard key={c.id} border="border-slate-700/40" className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-300">{c.authorName ?? 'Anonymous'}</p>
                    <p className="text-[10px] text-slate-500">{formatRelativeTime(c.createdAt)}</p>
                  </div>
                  {isDeletable && (
                    <button
                      onClick={() => void deleteComment(c.id)}
                      disabled={deletingId === c.id}
                      aria-label="Delete my comment"
                      className="text-slate-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <CommentBody body={c.body} knownNames={threadNames} />

                {c.locked ? (
                  <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-600">
                    <Lock size={11} /> This thread is locked.
                  </p>
                ) : (
                  <button
                    onClick={() => {
                      setReplyingTo(replyingTo === c.id ? null : c.id);
                      setReplyError(null);
                      // Convenience pre-fill — skipped for pre-login-era comments with no stored name.
                      setReplyBody(replyingTo === c.id ? '' : (c.authorName ? `@${c.authorName} ` : ''));
                    }}
                    className="mt-2 flex items-center gap-1 text-[11px] text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    <ReplyIcon size={11} /> Reply
                  </button>
                )}

                {replyingTo === c.id && (
                  <div className="mt-2 pl-3 border-l-2 border-violet-500/20">
                    {!user ? (
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[11px] text-slate-500">Sign in to reply.</p>
                        <div className="flex items-center gap-2 shrink-0">
                          {isProviderConfigured('github') && (
                            <Button variant="outline" size="xs" onClick={() => { void login('github'); }}>GitHub</Button>
                          )}
                          {isProviderConfigured('google') && (
                            <Button variant="outline" size="xs" onClick={() => { void login('google'); }}>Google</Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <FormatToolbar textareaRef={replyRef} value={replyBody} setValue={setReplyBody} previewing={replyPreviewing} onTogglePreview={() => setReplyPreviewing((v) => !v)} />
                        {replyPreviewing ? (
                          <div className="mb-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 min-h-[3rem]">
                            {replyBody.trim() ? <CommentBody body={replyBody} knownNames={threadNames} /> : <p className="text-xs text-slate-600">Nothing to preview yet.</p>}
                          </div>
                        ) : (
                          <textarea
                            ref={replyRef}
                            value={replyBody}
                            onChange={(e) => setReplyBody(e.target.value)}
                            placeholder={`Reply to ${c.authorName ?? 'this comment'}… (Markdown supported)`}
                            rows={2}
                            maxLength={BODY_MAX}
                            className="w-full mb-2 px-3 py-2 rounded-lg text-xs bg-slate-800/60 border border-slate-700/60 text-slate-200 placeholder:text-slate-500 focus:border-violet-500/60 resize-y"
                          />
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={replySubmitting}
                            onClick={() => submitReply(c.id)}
                          >
                            Post reply
                          </Button>
                          <Button variant="ghost" size="xs" onClick={() => setReplyingTo(null)}>
                            Cancel
                          </Button>
                        </div>
                      </>
                    )}
                    {replyError && <p role="status" aria-live="polite" className="mt-1 text-[11px] text-rose-400">{replyError}</p>}
                  </div>
                )}

                {c.replies.length > 0 && (
                  <div className="mt-3 pl-3 border-l-2 border-slate-700/40 space-y-2">
                    {visibleReplies.map((r) => {
                      const replyDeletable = getOwnerToken(r.id) !== null && r.body !== '[deleted]';
                      return (
                        <div key={r.id}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[11px] font-semibold text-slate-300">{r.authorName ?? 'Anonymous'}</p>
                            {replyDeletable && (
                              <button
                                onClick={() => void deleteComment(r.id)}
                                disabled={deletingId === r.id}
                                aria-label="Delete my reply"
                                className="text-slate-600 hover:text-rose-400 transition-colors"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500">{formatRelativeTime(r.createdAt)}</p>
                          <CommentBody body={r.body} knownNames={threadNames} />
                        </div>
                      );
                    })}
                    {hiddenCount > 0 && (
                      <button
                        onClick={() => setExpandedThreads((prev) => new Set(prev).add(c.id))}
                        className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        Show {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
                      </button>
                    )}
                  </div>
                )}
              </GlassCard>
            );
          })}
          {hasMore && (
            <div className="text-center pt-1">
              <Button variant="ghost" size="sm" disabled={loadingMore} onClick={() => void loadMore()}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

