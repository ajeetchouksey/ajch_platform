import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, Calendar, Clock, User, Tag, Share2, Check,
  Maximize2, Minimize2, List, X, BookOpen,
} from 'lucide-react';
import { loadBlogPost, loadBlogManifest } from '@/lib/content-loader';
import type { BlogPostMeta } from '@/types/content';

const MermaidDiagram = lazy(() => import('@/components/MermaidDiagram'));

// ── Utilities ────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
}

interface Heading { id: string; text: string; level: number }

function extractHeadings(md: string): Heading[] {
  return md.split('\n')
    .filter(l => /^#{1,3} /.test(l))
    .map(l => ({
      level: (l.match(/^(#+)/)?.[1].length ?? 1),
      text: l.replace(/^#+\s+/, '').trim(),
      id: slugify(l.replace(/^#+\s+/, '').trim()),
    }));
}

const CAT_PALETTE: Record<string, { color: string; bg: string; border: string }> = {
  Azure:            { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.30)' },
  DevOps:           { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.30)' },
  Cloud:            { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.30)'  },
  'AI Architecture':{ color: '#a78bfa', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.30)' },
  Opinions:         { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.30)' },
};

// ── Read tracking ────────────────────────────────────────────────────────────
function markAsRead(slug: string) {
  try {
    const key = 'blog:read';
    const arr = JSON.parse(localStorage.getItem(key) ?? '[]') as string[];
    if (!arr.includes(slug)) localStorage.setItem(key, JSON.stringify([...arr, slug]));
  } catch { /* ignore */ }
}

// ── Reading progress bar (top of page) ───────────────────────────────────────
function ReadingBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const fn = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setPct(h > 0 ? Math.min((window.scrollY / h) * 100, 100) : 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[2px]" style={{ background: 'rgba(15,23,42,0.5)' }}>
      <div className="h-full transition-[width] duration-100"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #a78bfa 0%, #38bdf8 100%)' }} />
    </div>
  );
}

// ── Circular reading progress ────────────────────────────────────────────────
function CircularProgress({ pct, readTime }: { pct: number; readTime: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const remaining = Math.max(0, Math.round(readTime * (1 - pct / 100)));
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.18)' }}>
      <div className="relative w-11 h-11 shrink-0">
        <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(71,85,105,0.25)" strokeWidth="2.5" />
          <circle cx="22" cy="22" r={r} fill="none" stroke="url(#pgr)" strokeWidth="2.5"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
          <defs>
            <linearGradient id="pgr" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white">
          {Math.round(pct)}%
        </span>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-200">Reading</p>
        <p className="text-[10px] text-slate-500">
          {pct >= 99 ? 'Complete ✓' : `${remaining} min left`}
        </p>
      </div>
    </div>
  );
}

// ── TOC Sidebar ───────────────────────────────────────────────────────────────
function TocSidebar({
  headings, activeId, readPct, meta, onShare, copied,
}: {
  headings: Heading[];
  activeId: string;
  readPct: number;
  meta: BlogPostMeta;
  onShare: () => void;
  copied: boolean;
}) {
  const pal = CAT_PALETTE[meta.category] ?? { color: '#94a3b8', bg: 'rgba(30,41,59,0.5)', border: 'rgba(71,85,105,0.3)' };
  return (
    <aside className="hidden xl:flex flex-col w-[220px] 2xl:w-[240px] shrink-0">
      <div className="sticky top-6 flex flex-col gap-3 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4"
        style={{ scrollbarWidth: 'none' }}>

        {/* Progress */}
        <CircularProgress pct={readPct} readTime={meta.readingTime} />

        {/* TOC */}
        {headings.length > 0 && (
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
              <List size={9} /> In this article
            </p>
            <nav className="space-y-0.5">
              {headings.map(({ id, text, level }) => {
                const isActive = activeId === id;
                return (
                  <a key={id} href={`#${id}`}
                    onClick={e => {
                      e.preventDefault();
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="block text-[11px] leading-snug py-1 rounded-r-lg transition-all duration-200"
                    style={{
                      paddingLeft: level === 3 ? '16px' : '6px',
                      color: isActive ? '#a78bfa' : '#64748b',
                      fontWeight: isActive ? 700 : 400,
                      borderLeft: `2px solid ${isActive ? '#a78bfa' : 'transparent'}`,
                    }}>
                    {text}
                  </a>
                );
              })}
            </nav>
          </div>
        )}

        {/* Meta */}
        <div className="rounded-xl p-4 space-y-2.5 text-[11px]"
          style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
          {meta.category && (
            <span className="inline-block font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-lg text-[9px]"
              style={{ color: pal.color, background: pal.bg, border: `1px solid ${pal.border}` }}>
              {meta.category}
            </span>
          )}
          <div className="flex items-center gap-2 text-slate-500">
            <User size={10} className="shrink-0" />{meta.author}
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar size={10} className="shrink-0" />
            {new Date(meta.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Clock size={10} className="shrink-0" />{meta.readingTime} min read
          </div>
          <button onClick={onShare}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all mt-1"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)', color: '#a78bfa' }}>
            {copied ? <Check size={11} /> : <Share2 size={11} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>

        {/* Tags */}
        {meta.tags.length > 0 && (
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
              <Tag size={9} /> Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {meta.tags.map(tag => (
                <Link key={tag} to={`/blog?tag=${tag}`}
                  className="text-[10px] px-2 py-0.5 rounded-lg transition-colors"
                  style={{ background: 'rgba(30,41,59,0.8)', color: '#64748b', border: '1px solid rgba(71,85,105,0.20)' }}>
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

// ── Mobile TOC bottom drawer ─────────────────────────────────────────────────
function MobileToc({ headings, activeId, onClose }: { headings: Heading[]; activeId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl p-5 max-h-[72vh] overflow-y-auto"
        style={{ background: 'rgba(15,23,42,0.99)', border: '1px solid rgba(71,85,105,0.30)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-black text-white flex items-center gap-2"><List size={14} />Contents</p>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <nav className="space-y-1">
          {headings.map(({ id, text, level }) => (
            <a key={id} href={`#${id}`}
              onClick={e => { e.preventDefault(); onClose(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              className="block py-1.5 text-sm rounded-lg transition-all"
              style={{
                paddingLeft: level === 3 ? '24px' : '8px',
                color: activeId === id ? '#a78bfa' : '#94a3b8',
                fontWeight: activeId === id ? 700 : 400,
              }}>
              {text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}

// ── Expandable code block ─────────────────────────────────────────────────────
const MAX_CODE_HEIGHT = 320;

function ExpandablePre({ children }: { children: React.ReactNode }) {
  const preRef = useRef<HTMLPreElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useEffect(() => {
    if (preRef.current) setOverflows(preRef.current.scrollHeight > MAX_CODE_HEIGHT);
  }, []);

  return (
    <div className="relative group my-5">
      <div className={!expanded && overflows ? 'max-h-80 overflow-hidden relative' : ''}>
        <pre ref={preRef}
          className="rounded-xl p-3 sm:p-5 text-xs sm:text-sm overflow-x-auto leading-relaxed font-mono"
          style={{ background: 'rgba(2,6,23,0.98)', border: '1px solid rgba(71,85,105,0.28)', color: '#e2e8f0' }}>
          {children}
        </pre>
        {!expanded && overflows && (
          <div className="absolute bottom-0 inset-x-0 h-16 rounded-b-xl pointer-events-none"
            style={{ background: 'linear-gradient(to top, rgba(2,6,23,0.98), transparent)' }} />
        )}
      </div>
      {overflows && (
        <button onClick={() => setExpanded(v => !v)}
          className="absolute bottom-2 right-3 flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-all z-10"
          style={{ background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(71,85,105,0.35)', color: '#94a3b8' }}>
          {expanded ? <><Minimize2 size={10} /> Collapse</> : <><Maximize2 size={10} /> Expand</>}
        </button>
      )}
    </div>
  );
}

// ── Main BlogPost component ───────────────────────────────────────────────────
export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState('');
  const [meta, setMeta] = useState<BlogPostMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const [activeId, setActiveId] = useState('');
  const [readPct, setReadPct] = useState(0);
  const [showToc, setShowToc] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  const headings = useMemo(() => extractHeadings(content), [content]);

  // Load post
  useEffect(() => {
    if (!slug) return;
    setLoading(true); setError(null); setVisible(false); setContent(''); setActiveId(''); setReadPct(0);
    Promise.all([loadBlogPost(slug), loadBlogManifest()])
      .then(([md, manifest]) => {
        setContent(md.replace(/^---[\s\S]*?---\n*/, ''));
        setMeta(manifest.posts.find(p => p.slug === slug) ?? null);
        setLoading(false);
        setTimeout(() => setVisible(true), 50);
      })
      .catch(e => { setError(String(e)); setLoading(false); });
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [slug]);

  // Track reading progress relative to article element
  useEffect(() => {
    const fn = () => {
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const pct = total > 0 ? Math.min((scrolled / total) * 100, 100) : 0;
      setReadPct(pct);
      if (pct > 90 && slug) markAsRead(slug);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [slug, content]);

  // Active heading tracking via IntersectionObserver
  useEffect(() => {
    if (!headings.length) return;
    const observers: IntersectionObserver[] = [];
    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) setActiveId(id);
      }, { threshold: 0, rootMargin: '-80px 0px -60% 0px' });
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [headings]);

  const handleShare = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2200); }
    catch { /* ignore */ }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-slate-800 rounded w-24 mb-6" />
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="h-8 bg-slate-700 rounded-lg w-3/4 mb-4" />
            <div className="flex gap-4 mb-8">
              {[24, 28, 20].map(w => <div key={w} className="h-4 bg-slate-800 rounded" style={{ width: `${w * 4}px` }} />)}
            </div>
            <div className="space-y-3">
              {[100, 100, 83, 100, 66, 100, 90].map((w, i) => (
                <div key={i} className="h-3 bg-slate-800 rounded" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>
          <div className="hidden lg:block w-60 space-y-3">
            <div className="h-16 bg-slate-800 rounded-xl" />
            <div className="h-48 bg-slate-800 rounded-xl" />
            <div className="h-24 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="text-center py-20">
        <div className="text-rose-400 text-lg mb-2">Article not found</div>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <Link to="/blog"
          className="text-xs px-4 py-2 rounded-xl font-bold transition-all"
          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)', color: '#a78bfa' }}>
          ← Back to blog
        </Link>
      </div>
    );
  }

  const pal = meta ? (CAT_PALETTE[meta.category] ?? { color: '#94a3b8', bg: 'rgba(30,41,59,0.5)', border: 'rgba(71,85,105,0.3)' }) : null;

  return (
    <div className={`relative min-w-0 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <ReadingBar />

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
        <div className="absolute -top-32 -left-32 w-[560px] h-[560px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 65%)' }} />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)' }} />
      </div>

      {/* ── Top nav bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-7">
        <Link to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium transition-all hover:-translate-x-0.5"
          style={{ color: '#64748b' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
          onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
          <ArrowLeft size={14} /> All posts
        </Link>
        {/* Mobile TOC button — show below xl since sidebar only appears at xl */}
        {headings.length > 0 && (
          <button onClick={() => setShowToc(true)}
            className="xl:hidden flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)', color: '#a78bfa' }}>
            <List size={12} /> Contents
          </button>
        )}
      </div>

      {/* ── 2-column layout: article + sidebar ───────────────────────────────── */}
      <div className="flex items-start gap-4 xl:gap-8">

        {/* ───── Main article ──────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 rounded-2xl"
          style={{
            background: 'rgba(8,15,30,0.97)',
            border: '1px solid rgba(71,85,105,0.18)',
            padding: 'clamp(1rem, 4vw, 2.5rem)',
          }}
        >

          {/* Article header */}
          {meta && pal && (
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg"
                  style={{ color: pal.color, background: pal.bg, border: `1px solid ${pal.border}` }}>
                  {meta.category}
                </span>
                {meta.featured && (
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg"
                    style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.28)' }}>
                    ★ Featured
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl xl:text-4xl font-black text-white leading-tight tracking-tight mb-4">
                {meta.title}
              </h1>

              <p className="text-slate-400 text-sm sm:text-base xl:text-lg leading-relaxed mb-5">{meta.excerpt}</p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 pb-5"
                style={{ borderBottom: '1px solid rgba(71,85,105,0.20)' }}>
                <span className="flex items-center gap-1.5"><User size={12} /> {meta.author}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(meta.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1.5"><Clock size={12} /> {meta.readingTime} min read</span>
                {/* Share — hide when sidebar (xl+) shows its own share button */}
                <button onClick={handleShare}
                  className="ml-auto flex items-center gap-1.5 text-xs transition-colors xl:hidden"
                  style={{ color: copied ? '#34d399' : '#64748b' }}>
                  {copied ? <Check size={13} /> : <Share2 size={13} />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
              </div>

              {/* Reading progress bar — hide when sidebar (xl+) shows circular progress */}
              <div className="xl:hidden mt-4">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(71,85,105,0.25)' }}>
                    <div className="h-full rounded-full transition-[width] duration-300"
                      style={{ width: `${readPct}%`, background: 'linear-gradient(90deg, #a78bfa, #38bdf8)' }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">
                    <BookOpen size={9} className="inline mr-1" />{Math.round(readPct)}%
                  </span>
                </div>
              </div>
            </header>
          )}

          {/* ── Article body ─────────────────────────────────────────────── */}
          <article ref={articleRef}
            className="
              prose prose-invert prose-sm sm:prose-base max-w-none
              prose-headings:font-black prose-headings:tracking-tight prose-headings:text-white prose-headings:scroll-mt-24
              prose-h1:text-2xl sm:prose-h1:text-3xl
              prose-h2:text-xl sm:prose-h2:text-[1.5rem] prose-h2:mt-10 sm:prose-h2:mt-14 prose-h2:mb-4
              prose-h3:text-lg sm:prose-h3:text-xl prose-h3:mt-6 sm:prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-slate-300 prose-p:leading-[1.85]
              prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-code:text-violet-300 prose-code:bg-slate-900/80 prose-code:px-1.5 prose-code:py-0.5
                prose-code:rounded-md prose-code:text-[12px] sm:prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none
              prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0 prose-pre:shadow-none
              prose-blockquote:border-l-[3px] prose-blockquote:border-violet-500/70 prose-blockquote:text-slate-400
                prose-blockquote:bg-violet-950/20 prose-blockquote:py-2 sm:prose-blockquote:py-3 prose-blockquote:px-4 sm:prose-blockquote:px-5
                prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:my-5
              prose-li:text-slate-300 prose-li:leading-[1.8] prose-li:marker:text-violet-400/60
              prose-ul:my-4 prose-ol:my-4
              prose-hr:border-slate-800/60 prose-hr:my-8
              prose-strong:text-slate-100 prose-strong:font-bold
              prose-img:rounded-xl sm:prose-img:rounded-2xl prose-img:shadow-xl
              prose-table:text-xs sm:prose-table:text-sm prose-th:text-slate-300 prose-td:text-slate-400
                prose-td:border-slate-800 prose-th:border-slate-700
              [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full
            ">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              children={content}
              components={{
                h2({ children }) {
                  const text = React.Children.toArray(children).map(c => String(c)).join('');
                  return <h2 id={slugify(text)}>{children}</h2>;
                },
                h3({ children }) {
                  const text = React.Children.toArray(children).map(c => String(c)).join('');
                  return <h3 id={slugify(text)}>{children}</h3>;
                },
                pre({ children }) {
                  const nodes = React.Children.toArray(children);
                  const mermaidNode = nodes.find(
                    (n): n is React.ReactElement =>
                      React.isValidElement(n) &&
                      typeof (n.props as { className?: string }).className === 'string' &&
                      ((n.props as { className?: string }).className ?? '').includes('language-mermaid'),
                  );
                  if (mermaidNode) {
                    const el = mermaidNode as React.ReactElement<{ children?: React.ReactNode }>;
                    return (
                      <Suspense fallback={<div className="text-slate-500 text-xs animate-pulse p-4 rounded-xl"
                        style={{ border: '1px solid rgba(71,85,105,0.25)' }}>Loading diagram…</div>}>
                        <MermaidDiagram chart={String(el.props.children ?? '')} />
                      </Suspense>
                    );
                  }
                  return <ExpandablePre>{children}</ExpandablePre>;
                },
                code({ className, children, ...props }) {
                  return <code className={className} {...props}>{children}</code>;
                },
              }}
            />
          </article>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <footer className="mt-16 pt-6" style={{ borderTop: '1px solid rgba(71,85,105,0.18)' }}>
            <div className="flex items-center justify-between">
              <Link to="/blog"
                className="text-sm font-medium transition-all hover:-translate-x-0.5 flex items-center gap-1.5"
                style={{ color: '#64748b' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#a78bfa')}
                onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
                <ArrowLeft size={14} /> All posts
              </Link>
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-sm transition-colors" style={{ color: '#475569' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}>
                Back to top ↑
              </button>
            </div>
          </footer>
        </div>

        {/* ───── Sticky sidebar ─────────────────────────────────────────── */}
        {meta && (
          <TocSidebar
            headings={headings}
            activeId={activeId}
            readPct={readPct}
            meta={meta}
            onShare={handleShare}
            copied={copied}
          />
        )}
      </div>

      {/* ── Mobile TOC drawer ──────────────────────────────────────────────── */}
      {showToc && (
        <MobileToc headings={headings} activeId={activeId} onClose={() => setShowToc(false)} />
      )}
    </div>
  );
}

