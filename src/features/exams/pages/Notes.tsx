import { useReducer, useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { loadNoteForExam, loadExamRegistry } from '@/lib/content-loader';
import { markNotesSeen } from '@/lib/storage';
import type { DomainConfig, ExamConfig } from '@/types/content';
import { Clock, ChevronLeft, ChevronRight, List, ChevronDown, ChevronUp, ArrowUp, Zap, AlertTriangle, MessageSquare, Share2, Check, Tag } from 'lucide-react';
import GiscusComments from '@/components/GiscusComments';

const MermaidDiagram = lazy(() => import('@/components/MermaidDiagram'));

function readingTime(md: string) {
  return Math.max(1, Math.ceil(md.split(/\s+/).filter(Boolean).length / 200));
}

// ── Circular reading progress (matches BlogPost sidebar) ─────────────────────
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
          <circle cx="22" cy="22" r={r} fill="none" stroke="url(#notes-pgr)" strokeWidth="2.5"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
          <defs>
            <linearGradient id="notes-pgr" x1="0" y1="0" x2="1" y2="0">
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

// ── TOC helpers ────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-');
}

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const seen = new Map<string, number>();
  for (const match of markdown.matchAll(/^(#{2,3})\s+(.+)$/gm)) {
    const level = match[1].length as 2 | 3;
    const raw = match[2].replace(/`[^`]*`/g, '').trim();
    const base = slugify(raw);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    items.push({ id: count === 0 ? base : `${base}-${count}`, text: raw, level });
  }
  return items;
}

// ── Content fetch reducer ──────────────────────────────────────────────────────

type ContentState = { loading: boolean; content: string; error: string | null };
type ContentAction =
  | { type: 'fetch' }
  | { type: 'success'; content: string }
  | { type: 'error'; error: string };

function contentReducer(_: ContentState, action: ContentAction): ContentState {
  if (action.type === 'fetch')   return { loading: true,  content: '',               error: null          };
  if (action.type === 'success') return { loading: false, content: action.content,   error: null          };
  if (action.type === 'error')   return { loading: false, content: '',               error: action.error  };
  return _;
}

export default function Notes() {
  const { examId = 'ccaf' } = useParams<{ examId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const domain = Number(searchParams.get('d')) || 1;
  const [{ loading, content, error }, dispatch] = useReducer(contentReducer, { loading: false, content: '', error: null });
  const [examDomains, setExamDomains] = useState<DomainConfig[]>([]);
  const [examConfig, setExamConfig] = useState<ExamConfig | null>(null);
  const [activeId, setActiveId] = useState<string>('');
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [readPct, setReadPct] = useState(0);
  const [copied, setCopied] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const toc = content ? extractToc(content) : [];

  useEffect(() => {
    loadExamRegistry().then((r) => {
      const exam = r.exams.find((e) => e.id === examId);
      if (exam) { setExamDomains(exam.domains); setExamConfig(exam); }
    }).catch(() => {});
  }, [examId]);

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'fetch' });
    loadNoteForExam(examId, domain)
      .then((md) => { if (!cancelled) { dispatch({ type: 'success', content: md }); setActiveId(''); setMobileTocOpen(false); markNotesSeen(examId, domain); } })
      .catch((e: unknown) => { if (!cancelled) dispatch({ type: 'error', error: String(e) }); });
    return () => { cancelled = true; };
  }, [examId, domain]);

  // Scrollspy — observe all heading anchors once content renders
  const articleRef = useRef<HTMLElement>(null);
  const setupObserver = useCallback(() => {
    if (!articleRef.current) return;
    observerRef.current?.disconnect();
    const headings = articleRef.current.querySelectorAll<HTMLElement>('h2[id], h3[id]');
    if (!headings.length) return;
    const visible = new Map<string, number>();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          visible.set(e.target.id, e.intersectionRatio);
        });
        let best = '';
        let bestRatio = -1;
        visible.forEach((ratio, id) => {
          if (ratio > bestRatio) { bestRatio = ratio; best = id; }
        });
        if (best) setActiveId(best);
      },
      { rootMargin: '-10% 0px -75% 0px', threshold: [0, 0.25, 0.5, 1] },
    );
    headings.forEach((h) => observerRef.current!.observe(h));
  }, []);

  useEffect(() => {
    if (!loading && content) {
      // Wait one tick for DOM paint
      const t = setTimeout(setupObserver, 80);
      return () => clearTimeout(t);
    }
  }, [loading, content, setupObserver]);

  useEffect(() => () => observerRef.current?.disconnect(), []);

  // Scroll-based reading progress
  useEffect(() => {
    const mainEl = document.querySelector('main') as HTMLElement | null;
    const fn = () => {
      const el = mainEl;
      if (!el) return;
      const h = el.scrollHeight - el.clientHeight;
      setReadPct(h > 0 ? Math.min((el.scrollTop / h) * 100, 100) : 0);
    };
    const target: HTMLElement | Window = mainEl ?? window;
    target.addEventListener('scroll', fn, { passive: true });
    return () => target.removeEventListener('scroll', fn);
  }, [loading, content]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const currentDomainConfig = examDomains.find((d) => d.id === domain);
  const currentIdx = examDomains.findIndex((d) => d.id === domain);
  const prevDomain = currentIdx > 0 ? examDomains[currentIdx - 1] : null;
  const nextDomain = currentIdx < examDomains.length - 1 ? examDomains[currentIdx + 1] : null;
  const minutes = content ? readingTime(content) : null;
  const trapCount = content ? (content.match(/class="note-trap"/g) ?? []).length : 0;
  const trapItems = toc.filter((item) => item.level === 3 && item.text.includes('Exam Trap'));
  const domainQCount = examConfig && currentDomainConfig
    ? Math.round((examConfig.questions * currentDomainConfig.weight) / 100)
    : 0;

  function goTo(d: DomainConfig) {
    setSearchParams({ d: String(d.id) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function scrollToHeading(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveId(id);
    setMobileTocOpen(false);
  }

  return (
    <div>
      {/* Domain identity header */}
      {currentDomainConfig && (
        <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-800/70">
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0">
            <span className="text-violet-400 font-mono font-bold text-sm">D{domain}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              Domain {domain} of {examDomains.length}
            </p>
            <h2 className="text-base font-semibold text-white truncate">{currentDomainConfig.title}</h2>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {minutes && (
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock size={11} />
                {minutes} min read
              </span>
            )}
            <span className="text-xs font-mono text-slate-500 bg-slate-800/60 border border-slate-700/40 px-2.5 py-1 rounded-full">
              {currentDomainConfig.weight}% of exam
            </span>
          </div>
        </div>
      )}

      {/* Quick Facts — shown when content is loaded */}
      {!loading && !error && content && currentDomainConfig && (
        <div className="flex gap-2 mb-5 p-3 rounded-xl bg-violet-950/20 border border-violet-800/20">
          <div className="flex-1 text-center py-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <p className="text-base font-bold font-mono text-rose-400">{trapCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Exam traps</p>
          </div>
          <div className="flex-1 text-center py-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <p className="text-base font-bold font-mono text-violet-400">{currentDomainConfig.weight}%</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Domain weight</p>
          </div>
          <div className="flex-1 text-center py-2 bg-slate-950/60 rounded-lg border border-slate-800/60">
            <p className="text-base font-bold font-mono text-blue-400">{domainQCount}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Quiz questions</p>
          </div>
        </div>
      )}

      {/* Domain stepper — mobile only (desktop uses sidebar) */}
      <div className="flex flex-wrap gap-2 mb-6 lg:hidden">
        {examDomains.map((d) => (
          <button
            key={d.id}
            onClick={() => goTo(d)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              domain === d.id
                ? 'bg-violet-700 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <span className="font-mono text-xs">D{d.id}</span>
            <span className="hidden sm:inline">{d.title}</span>
            <span className={`text-[10px] font-mono ${domain === d.id ? 'text-violet-300' : 'text-slate-600'}`}>
              {d.weight}%
            </span>
          </button>
        ))}
      </div>

      {/* Mobile TOC — collapsible strip */}
      {!loading && !error && toc.length > 0 && (
        <div className="xl:hidden mb-5 rounded-xl border border-slate-700/50 overflow-hidden">
          <button
            onClick={() => setMobileTocOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/70 text-left"
          >
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <List size={13} />
              On this page
              <span className="text-[10px] font-mono text-slate-600">({toc.length})</span>
              {trapCount > 0 && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-rose-400/80">
                  <AlertTriangle size={10} />{trapCount} traps
                </span>
              )}
            </span>
            {mobileTocOpen ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
          </button>
          {mobileTocOpen && (
            <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800/60 flex flex-col gap-1">
              {toc.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToHeading(item.id)}
                  className={`text-left text-xs py-1 transition-colors ${
                    item.level === 3 ? 'pl-4 text-slate-600 hover:text-slate-400' : 'text-slate-500 hover:text-slate-300'
                  } ${activeId === item.id ? 'text-violet-400 font-medium' : ''}`}
                >
                  {item.text}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content — two-column on xl: article + sticky TOC */}
      <div className="xl:grid xl:grid-cols-[1fr_280px] xl:gap-8 xl:items-start">

      {/* Content */}
      <article ref={articleRef} className="min-w-0">
        {loading && (
          <div className="space-y-3 animate-pulse">
            {[80, 55, 90, 70, 40, 85, 60, 75, 50, 88].map((w, i) => (
              <div key={i} className="h-3 bg-slate-800 rounded-full" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
        {error && (
          <div className="text-rose-400 text-sm">Failed to load: {error}</div>
        )}
        {!loading && !error && (
          <div className="prose prose-invert max-w-none prose-headings:text-white prose-a:text-violet-400 prose-code:text-violet-300 prose-pre:bg-slate-900/70 prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-xl prose-pre:text-sm prose-pre:leading-relaxed prose-blockquote:border-violet-500 prose-blockquote:text-slate-400 prose-p:text-[0.9375rem] prose-p:leading-7">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                h2({ children }) {
                  const text = String(children);
                  const id = slugify(text.replace(/`[^`]*`/g, ''));
                  return <h2 id={id}>{children}</h2>;
                },
                h3({ children }) {
                  const text = String(children);
                  const id = slugify(text.replace(/`[^`]*`/g, ''));
                  return <h3 id={id}>{children}</h3>;
                },
                code({ className, children, ...props }) {
                  const match = /language-mermaid/.exec(className || '');
                  if (match) {
                    return (
                      <Suspense fallback={<div className="text-slate-500 text-xs animate-pulse p-4">Loading diagram…</div>}>
                        <MermaidDiagram chart={String(children)} />
                      </Suspense>
                    );
                  }
                  const isBlock = className?.startsWith('language-');
                  if (isBlock) {
                    return (
                      <code className={`${className} block`} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return <code className={className} {...props}>{children}</code>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </article>

      {/* Sticky in-page TOC — desktop xl+ only */}
      {toc.length > 0 && (
        <aside className="hidden xl:flex xl:flex-col gap-3 shrink-0 sticky top-4 self-start max-h-[calc(100vh-5rem)] overflow-y-auto pb-4"
          style={{ scrollbarWidth: 'none' }}>

          {/* Circular reading progress */}
          {minutes && <CircularProgress pct={readPct} readTime={minutes} />}

          {/* In This Article TOC */}
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
              <List size={9} /> In this article
            </p>
            <nav className="space-y-0.5">
              {(() => {
                const activeIdx = toc.findIndex(i => i.id === activeId);
                return toc.map(({ id, text, level }, idx) => {
                  const isActive = activeId === id;
                  const isPast = activeIdx >= 0 && idx < activeIdx;
                  return (
                    <button
                      key={id}
                      onClick={() => scrollToHeading(id)}
                      className="block w-full text-left text-[11px] leading-snug py-1 rounded-r-lg transition-all duration-200"
                      style={{
                        paddingLeft: level === 3 ? '16px' : '6px',
                        color: isActive ? '#a78bfa' : isPast ? '#34d399' : '#64748b',
                        fontWeight: isActive ? 700 : 400,
                        borderLeft: `2px solid ${isActive ? '#a78bfa' : isPast ? 'rgba(52,211,153,0.45)' : 'transparent'}`,
                        opacity: isPast ? 0.7 : 1,
                      }}
                    >
                      {text}
                    </button>
                  );
                });
              })()}
            </nav>
          </div>

          {/* Meta card */}
          {currentDomainConfig && (
            <div className="rounded-xl p-4 space-y-2.5"
              style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
              <span className="inline-block font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-lg text-[9px]"
                style={{ color: '#a78bfa', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)' }}>
                Domain {domain} · {currentDomainConfig.weight}% of exam
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Clock size={10} className="shrink-0" />{minutes} min read
              </div>
              {domainQCount > 0 && (
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Zap size={10} className="shrink-0" />~{domainQCount} quiz questions
                </div>
              )}
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all mt-1"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)', color: '#a78bfa' }}
              >
                {copied ? <Check size={11} /> : <Share2 size={11} />}
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          )}

          {/* Exam Traps as tags */}
          {trapItems.length > 0 && (
            <div className="rounded-xl p-4"
              style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-1.5">
                <Tag size={9} /> <span className="text-rose-400/80">Exam Traps</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {trapItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToHeading(item.id)}
                    className="text-left text-[10px] px-2 py-0.5 rounded-lg transition-all"
                    style={{
                      background: 'rgba(30,41,59,0.8)',
                      color: activeId === item.id ? '#f87171' : '#64748b',
                      border: activeId === item.id ? '1px solid rgba(248,113,113,0.45)' : '1px solid rgba(71,85,105,0.20)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.45)'; }}
                    onMouseLeave={e => { if (activeId !== item.id) { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(71,85,105,0.20)'; } }}
                  >
                    #{item.text.replace(/^[^A-Za-z]*Exam Trap[:\s"]+/i, '').replace(/["+]+$/, '').toLowerCase().replace(/\s+/g, '-')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Back to top */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-all"
          >
            <ArrowUp size={12} /> Back to top
          </button>
        </aside>
      )}

      </div>{/* end two-column grid */}

      {/* Quiz this domain CTA */}
      {!loading && !error && content && (
        <div className="mt-8">
          <Link
            to={`/skillup/${examId}/quiz`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-violet-900/30 border border-violet-700/40 hover:bg-violet-900/50 hover:border-violet-600/60 text-violet-300 font-semibold text-sm transition-all group"
          >
            <Zap size={14} className="group-hover:scale-110 transition-transform" />
            Quiz this domain{domainQCount > 0 ? ` (~${domainQCount} questions)` : ''}
          </Link>
        </div>
      )}

      {/* Prev / Next domain navigation */}
      {!loading && !error && content && (prevDomain || nextDomain) && (
        <div className="flex items-stretch justify-between gap-3 mt-10 pt-6 border-t border-slate-800/70">
          {prevDomain ? (
            <button
              onClick={() => goTo(prevDomain)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-slate-600 hover:bg-slate-800 transition-all text-left group"
            >
              <ChevronLeft size={16} className="text-slate-500 shrink-0 transition-transform group-hover:-translate-x-0.5" />
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wide font-medium">Previous</p>
                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  D{prevDomain.id}: {prevDomain.title}
                </p>
              </div>
            </button>
          ) : <div />}
          {nextDomain ? (
            <button
              onClick={() => goTo(nextDomain)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/40 hover:border-slate-600 hover:bg-slate-800 transition-all text-right group"
            >
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wide font-medium">Next</p>
                <p className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
                  D{nextDomain.id}: {nextDomain.title}
                </p>
              </div>
              <ChevronRight size={16} className="text-slate-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </button>
          ) : <div />}
        </div>
      )}

      {/* ── Community discussion ───────────────────────────────────────── */}
      {!loading && !error && content && (
        <div className="mt-12 pt-8 border-t border-slate-800/60">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare size={16} className="text-violet-400" />
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Community Discussion</h2>
          </div>
          <GiscusComments
            slug={`${examId}-domain-${domain}`}
            context="skill-up"
          />
        </div>
      )}
    </div>
  );
}
