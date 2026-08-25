import { useReducer, useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense, Children, isValidElement } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { loadNoteForExam, loadExamRegistry } from '@/lib/content-loader';
import { resolveContentUrl } from '@/lib/content-manifest';
import { markNotesSeen } from '@/lib/storage';
import {
  recordStudyDay, getResumeState, setResumeState, clearResumeState,
  getFocusTimer, setFocusTimer,
} from '@/lib/study-tracker';
import type { FocusTimer } from '@/lib/study-tracker';
import type { DomainConfig, ExamConfig } from '@/types/content';
import { Clock, ChevronLeft, ChevronRight, List, ChevronDown, ChevronUp, ArrowUp, Zap, AlertTriangle, MessageSquare, Share2, Check, Tag, Sparkles } from 'lucide-react';
import GiscusComments from '@/components/GiscusComments';
import { ContentFeedback } from '@/components/ContentFeedback';
import { ContentMeta, Button } from '@/components/ui';
import { applyHighlighting, KeywordHighlightToggle } from '@/components/KeywordHighlight';
import { StudyWithAI } from '@/components/StudyWithAI';

const MermaidDiagram = lazy(() => import('@/components/MermaidDiagram'));

// ── CCA-F keyword glossary ────────────────────────────────────────────────────
const GLOSSARY: Record<string, string> = {
  'stop_reason':    'Why Claude stopped generating. Values: "end_turn", "tool_use", "max_tokens", "stop_sequence".',
  'end_turn':       'Claude finished naturally — it decided to stop on its own.',
  '"end_turn"':     'Claude finished naturally — it decided to stop on its own.',
  'tool_use':       'Claude is requesting to call one or more tools before continuing.',
  'tool_result':    'Data returned to Claude after a tool executes.',
  'tool_choice':    'Controls how Claude picks tools: "auto" (Claude decides), "any" (must use a tool), or a forced specific tool.',
  'max_tokens':     'Hard limit on tokens Claude can generate in one response. Hitting this triggers stop_reason "max_tokens".',
  'temperature':    'Controls randomness. 0 = fully deterministic; 1 = default creative. Keep low (0–0.3) for structured output.',
  'context_window': 'Total token budget (input + output). Claude claude-3-5-sonnet: 200K. Claude claude-opus-4: 200K.',
  'system':         'The system prompt role — sets Claude\'s persona, rules, and constraints before any user message.',
  'user':           'The human turn in a conversation. Claude reads user messages to understand the current request.',
  'assistant':      'Claude\'s turn in the conversation. The model generates text here.',
  'MCP':            'Model Context Protocol — Anthropic\'s open standard for giving Claude access to tools and data sources via a uniform JSON-RPC interface.',
  'RAG':            'Retrieval-Augmented Generation — fetch relevant context from a knowledge base before prompting Claude.',
  'token':          'The basic unit Claude processes. ~¾ of an English word on average. 1 K tokens ≈ 750 words.',
  'tokens':         'The basic unit Claude processes. ~¾ of an English word on average. 1 K tokens ≈ 750 words.',
  'stream':         'Streaming mode — Claude sends tokens as they\'re generated instead of waiting to complete the full response.',
  'streaming':      'Streaming mode — Claude sends tokens as they\'re generated instead of waiting to complete the full response.',
  'JSON':           'JavaScript Object Notation — the structured data format used for tool inputs/outputs and Claude API calls.',
  'XML':            'XML tags (e.g. <document>) help Claude parse structured prompt sections more reliably than plain delimiters.',
  'HITL':           'Human-In-The-Loop — pausing agent execution to get human approval before a high-risk action.',
  'CoT':            'Chain-of-Thought — asking Claude to reason step-by-step before giving a final answer.',
  'CoD':            'Chain-of-Draft — asking Claude to draft, critique, and refine its response iteratively.',
  'CLAUDE.md':      'Claude Code\'s project config file. Place in the repo root to set persistent instructions, memory, and tool rules.',
  'claude':         'The Claude Code CLI command. Run `claude` in a terminal to start an agentic coding session.',
  'bash':           'Claude Code\'s primary tool for running shell commands, tests, builds, and file operations.',
  'grep':           'Text-search tool Claude Code uses to locate patterns across large codebases quickly.',
  'checkpoint':     'A saved snapshot of agent state. Allows rollback if a long-running task goes wrong.',
  'while':          'The agentic loop pattern — Claude keeps running (calling tools → processing results) until stop_reason is "end_turn".',
  'retry':          'Automatic retry logic for transient API errors. Use exponential back-off with jitter to avoid thundering-herd.',
  'prompt':         'The full input sent to Claude — usually a combination of system prompt + conversation messages.',
  'messages':       'The array of {role, content} objects sent to the Claude API representing the conversation history.',
  'content_block':  'A single unit inside a Claude message — text, tool_use, tool_result, or image.',
};

function TermTooltip({ term, definition }: { term: string; definition: string }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ left: number; flipped: boolean; caretLeft: number } | null>(null);
  const ref = useRef<HTMLElement>(null);
  const TIP_W = 280;

  const handleShow = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const header = document.querySelector('header');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 64;
      const flipped = rect.top < headerBottom + 130;
      const ideal = rect.left + rect.width / 2 - TIP_W / 2;
      const clamped = Math.max(8, Math.min(vw - TIP_W - 8, ideal));
      const left = clamped - rect.left;
      const caretLeft = Math.max(12, Math.min(TIP_W - 16, rect.width / 2 - left));
      setPos({ left, flipped, caretLeft });
    }
    setVisible(true);
  };

  const tipY: React.CSSProperties = pos?.flipped
    ? { top: 'calc(100% + 6px)', bottom: 'auto' }
    : { bottom: 'calc(100% + 6px)', top: 'auto' };

  return (
    <code
      ref={ref as React.RefObject<HTMLElement>}
      className="cursor-help"
      style={{ textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'rgba(167,139,250,0.8)', textUnderlineOffset: '2px', position: 'relative' }}
      onMouseEnter={handleShow}
      onMouseLeave={() => setVisible(false)}
    >
      {term}
      {visible && pos && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            ...tipY,
            left: `${pos.left}px`,
            width: `${TIP_W}px`,
            zIndex: 60,
            background: 'rgba(9,18,36,0.98)',
            border: '1px solid rgba(167,139,250,0.35)',
            borderRadius: '10px',
            padding: '8px 12px',
            pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'normal',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 1.55,
            letterSpacing: 'normal',
            textDecorationLine: 'none',
            color: '#94a3b8',
          } as React.CSSProperties}
        >
          <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '4px', padding: '1px 6px', marginBottom: '6px' }}>
            exam term
          </span>
          {definition}
          {/* caret */}
          <span style={{ position: 'absolute', left: `${pos.caretLeft}px`, ...(pos.flipped ? { top: '-5px', borderTop: '1px solid rgba(167,139,250,0.35)', borderLeft: '1px solid rgba(167,139,250,0.35)' } : { bottom: '-5px', borderBottom: '1px solid rgba(167,139,250,0.35)', borderRight: '1px solid rgba(167,139,250,0.35)' }), transform: 'rotate(45deg)', width: '9px', height: '9px', background: 'rgba(9,18,36,0.98)' }} />
        </span>
      )}
    </code>
  );
}

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
  const [highlightEnabled, setHighlightEnabled] = useState(true);
  const [handwritingMode, setHandwritingMode] = useState(() => {
    try { const v = localStorage.getItem('notes_handwriting'); return v === null ? true : v === '1'; } catch { return true; }
  });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const toc = content ? extractToc(content) : [];
  // ── Study tracker state ────────────────────────────────────────────────────
  const [dismissedBannerKey, setDismissedBannerKey] = useState<string | null>(null);
  const resumeBanner = useMemo(() => {
    const r = getResumeState(examId);
    if (!r || r.domainId === domain || examDomains.length === 0) return null;
    const key = `${examId}-${r.domainId}-${r.sectionTitle}`;
    if (key === dismissedBannerKey) return null;
    const dom = examDomains.find(d => d.id === r.domainId);
    return dom ? { domainId: r.domainId, title: r.sectionTitle ?? dom.title, key } : null;
  }, [examId, domain, examDomains, dismissedBannerKey]);
  const [focusTimer, setFocusTimerState] = useState<FocusTimer | null>(() => getFocusTimer());
  const [timerSecs, setTimerSecs] = useState(0);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const FOCUS_PRESETS = [{ label: '15 min', ms: 900000 }, { label: '25 min', ms: 1500000 }, { label: '30 min', ms: 1800000 }, { label: '45 min', ms: 2700000 }, { label: '60 min', ms: 3600000 }];

  const startTimer = useCallback((durationMs: number) => {
    const t: FocusTimer = { mode: 'focus', startedAt: Date.now(), durationMs, pomodoros: focusTimer ? focusTimer.pomodoros : 0, examId };
    setFocusTimer(t); setFocusTimerState(t); setTimerSecs(Math.floor(durationMs / 1000));
    setShowDurationPicker(false);
  }, [focusTimer, examId]);

  const handlePauseResume = () => {
    if (!focusTimer) return;
    if (focusTimer.paused) {
      const remaining = focusTimer.pausedRemainingMs ?? 0;
      const next: FocusTimer = { ...focusTimer, paused: false, pausedRemainingMs: undefined, startedAt: Date.now() - (focusTimer.durationMs - remaining) };
      setFocusTimer(next); setFocusTimerState(next);
    } else {
      const remaining = Math.max(0, focusTimer.durationMs - (Date.now() - focusTimer.startedAt));
      const next: FocusTimer = { ...focusTimer, paused: true, pausedRemainingMs: remaining };
      setFocusTimer(next); setFocusTimerState(next);
    }
  };

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
      .then((md) => {
        if (!cancelled) {
          dispatch({ type: 'success', content: md });
          setActiveId('');
          setMobileTocOpen(false);
          markNotesSeen(examId, domain);
          recordStudyDay(examId);
        }
      })
      .catch((e: unknown) => { if (!cancelled) dispatch({ type: 'error', error: String(e) }); });
    return () => { cancelled = true; };
  }, [examId, domain]);

  // Update resume state as user reads (on activeId change)
  useEffect(() => {
    if (activeId && content) setResumeState(examId, { domainId: domain, sectionTitle: activeId, ts: Date.now() });
  }, [examId, domain, activeId, content]);

  // Focus timer countdown — respects paused state
  useEffect(() => {
    if (!focusTimer || focusTimer.paused) return;
    const tick = () => {
      const elapsed = Math.floor((Date.now() - focusTimer.startedAt) / 1000);
      const total = Math.floor(focusTimer.durationMs / 1000);
      const remaining = total - elapsed;
      if (remaining <= 0) {
        const next: FocusTimer = {
          mode: focusTimer.mode === 'focus' ? 'break' : 'focus',
          startedAt: Date.now(),
          durationMs: focusTimer.mode === 'focus' ? 300000 : 1500000,
          pomodoros: focusTimer.mode === 'focus' ? focusTimer.pomodoros + 1 : focusTimer.pomodoros,
          examId,
        };
        setFocusTimer(next);
        setFocusTimerState(next);
        setTimerSecs(Math.floor(next.durationMs / 1000));
      } else {
        setTimerSecs(remaining);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [focusTimer, examId]);

  // Scrollspy — observe all heading anchors once content renders
  const articleRef = useRef<HTMLElement>(null);

  // ── Selection-aware "explain this" floating trigger ──────────────────────
  // Study With AI panel state, lifted here so the same instance (rendered
  // below with variant="icon") can be opened either from its existing
  // sidebar icon or from the floating trigger below.
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiSelectedText, setAiSelectedText] = useState<string | undefined>(undefined);
  function handleAiOpenChange(next: boolean) {
    setAiPanelOpen(next);
    if (!next) setAiSelectedText(undefined); // don't leak a stale selection into the next whole-page open
  }

  const [selectionTrigger, setSelectionTrigger] = useState<{ text: string; top: number; bottom: number; left: number } | null>(null);
  const floatingTriggerRef = useRef<HTMLDivElement>(null);
  // Approximate rendered width of the floating "Explain" trigger (Sparkles
  // icon + "Explain" label, size="sm") — used to clamp it inside the
  // viewport the same way TermTooltip clamps against TIP_W above.
  const EXPLAIN_TRIGGER_W = 110;

  useEffect(() => {
    let debounceId: ReturnType<typeof setTimeout> | null = null;

    function evaluateSelection() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) { setSelectionTrigger(null); return; }
      const text = sel.toString().trim();
      if (!text) { setSelectionTrigger(null); return; }
      // Scope to the article body only — selections in the sidebar/TOC/
      // analytics chrome should never trigger this.
      const { anchorNode, focusNode } = sel;
      if (!articleRef.current || !anchorNode || !focusNode ||
          !articleRef.current.contains(anchorNode) || !articleRef.current.contains(focusNode)) {
        setSelectionTrigger(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) { setSelectionTrigger(null); return; }
      setSelectionTrigger({ text, top: rect.top, bottom: rect.bottom, left: rect.left + rect.width / 2 });
    }

    // Debounced on selectionchange — fires repeatedly during a drag, so we
    // only evaluate once the selection has settled, avoiding flicker.
    function handleSelectionChange() {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(evaluateSelection, 150);
    }

    function handleMouseDown(e: MouseEvent) {
      if (floatingTriggerRef.current?.contains(e.target as Node)) return;
      setSelectionTrigger(null);
    }

    function handleScroll() {
      setSelectionTrigger(null);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectionTrigger(null);
    }

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      if (debounceId) clearTimeout(debounceId);
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  function handleExplainSelection() {
    if (!selectionTrigger) return;
    setAiSelectedText(selectionTrigger.text);
    setAiPanelOpen(true);
    setSelectionTrigger(null);
  }

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

  // Shared Study With AI context — both the xl+ sidebar instance and the
  // below-xl modal instance pass the exact same object so their composed
  // prompts never drift from one another.
  const aiContext = {
    source: 'notes' as const,
    examTitle: examConfig?.title ?? '',
    domainTitle: currentDomainConfig?.title,
    noteExcerpt: content ? content.slice(0, 500) : undefined,
  };

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
      {/* Resume banner — shown when returning from a different domain */}
      {resumeBanner && (
        <div className="mb-4 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-violet-950/30 border border-violet-700/30 text-sm">
          <span className="text-violet-300">↩</span>
          <span className="flex-1 text-slate-300 text-xs">Last reading: <span className="font-semibold text-violet-300">D{resumeBanner.domainId}</span> — {resumeBanner.title.replace(/-/g, ' ')}</span>
          <button
            onClick={() => { setDismissedBannerKey(resumeBanner.key); clearResumeState(examId); }}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
          <button
            onClick={() => { setDismissedBannerKey(resumeBanner.key); const r = getResumeState(examId); if (r) setSearchParams({ d: String(r.domainId) }); }}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-500 transition-colors"
          >
            Resume D{resumeBanner.domainId} →
          </button>
        </div>
      )}

      {/* Domain identity header — domain pills live here on the right */}
      {currentDomainConfig && (
        <div className="flex items-center gap-3 pb-5 mb-5 border-b border-slate-800/70">
          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center shrink-0">
            <span className="text-violet-400 font-mono font-bold text-sm">D{domain}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
              Domain {domain} of {examDomains.length}{minutes ? <span className="normal-case not-italic"> · {minutes} min read</span> : null}
            </p>
            <h2 className="text-base font-semibold text-white truncate">{currentDomainConfig.title}</h2>
          </div>
          {/* Domain switcher pills — right side of header */}
          {examDomains.length > 1 && (
            <div className="flex gap-1 p-0.5 rounded-xl shrink-0 overflow-x-auto" style={{ background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(51,65,85,0.45)', scrollbarWidth: 'none' }}>
              {examDomains.map((d) => (
                <button
                  key={d.id}
                  onClick={() => goTo(d)}
                  title={d.title}
                  className={`flex flex-col items-center gap-0.5 py-1.5 px-2.5 rounded-lg transition-all min-w-[40px] ${
                    domain === d.id
                      ? 'bg-violet-700 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="font-mono font-bold text-[11px]">D{d.id}</span>
                  <span className={`text-[8px] font-mono leading-none ${domain === d.id ? 'text-violet-300' : 'text-slate-700'}`}>
                    {d.weight}%
                  </span>
                </button>
              ))}
            </div>
          )}
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
          <div className="flex items-center justify-center px-2 gap-2">
            <div className="relative">
              <button
                title={focusTimer ? 'Focus timer active' : 'Start focus timer'}
                onClick={() => { if (!focusTimer) setShowDurationPicker(v => !v); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  focusTimer ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40' : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 hover:text-slate-300'
                }`}
              >
                🍅 {focusTimer ? `${String(Math.floor((focusTimer.paused ? Math.floor((focusTimer.pausedRemainingMs??0)/1000) : timerSecs)/60)).padStart(2,'0')}:${String((focusTimer.paused ? Math.floor((focusTimer.pausedRemainingMs??0)/1000) : timerSecs)%60).padStart(2,'0')}` : 'Focus'}
              </button>
              {showDurationPicker && !focusTimer && (
                <div className="absolute bottom-full mb-2 left-0 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 min-w-[140px]">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 pb-1">Choose duration</p>
                  {FOCUS_PRESETS.map(p => (
                    <button key={p.ms} onClick={() => startTimer(p.ms)}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 rounded-lg transition-colors font-mono">
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setHandwritingMode((v) => {
                const next = !v;
                try { localStorage.setItem('notes_handwriting', next ? '1' : '0'); } catch { /* noop */ }
                return next;
              })}
              title={handwritingMode ? 'Switch to digital mode' : 'Switch to handwriting mode'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                handwritingMode
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 hover:text-slate-300'
              }`}
            >
              ✍️ Hand
            </button>
            <KeywordHighlightToggle
              enabled={highlightEnabled}
              onToggle={() => setHighlightEnabled((v) => !v)}
            />
          </div>
        </div>
      )}

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

        {/* Sticky timer strip — visible while scrolling */}
        {focusTimer && (() => {
          const displaySecs = focusTimer.paused ? Math.floor((focusTimer.pausedRemainingMs ?? 0) / 1000) : timerSecs;
          const pct = focusTimer.paused
            ? ((focusTimer.pausedRemainingMs ?? 0) / focusTimer.durationMs)
            : (timerSecs / Math.floor(focusTimer.durationMs / 1000));
          const isFocus = focusTimer.mode === 'focus';
          return (
            <div className="sticky top-14 z-30 -mx-1 mb-6 rounded-xl overflow-hidden border"
              style={{ borderColor: isFocus ? 'rgba(139,92,246,0.4)' : 'rgba(52,211,153,0.35)' }}>
              {/* depleting progress bar */}
              <div className="h-0.5 w-full" style={{ background: isFocus ? 'rgba(139,92,246,0.2)' : 'rgba(52,211,153,0.15)' }}>
                <div className="h-full transition-all duration-1000"
                  style={{ width: `${Math.max(0, pct * 100).toFixed(1)}%`, background: isFocus ? '#7c3aed' : '#059669' }} />
              </div>
              <div className="flex items-center gap-3 px-4 py-2.5"
                style={{ background: isFocus ? 'rgba(46,16,101,0.92)' : 'rgba(4,65,50,0.92)', backdropFilter: 'blur(12px)' }}>
                <span className="text-base">🍅</span>
                <span className="font-mono font-bold text-lg tabular-nums" style={{ color: isFocus ? '#c4b5fd' : '#6ee7b7', minWidth: '3.5ch' }}>
                  {String(Math.floor(displaySecs / 60)).padStart(2, '0')}:{String(displaySecs % 60).padStart(2, '0')}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isFocus ? '#a78bfa' : '#34d399' }}>
                  {focusTimer.paused ? 'paused' : isFocus ? 'focus' : 'break'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">×{focusTimer.pomodoros}</span>
                <div className="ml-auto flex items-center gap-2">
                  <button onClick={handlePauseResume} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    title={focusTimer.paused ? 'Resume' : 'Pause'}>
                    {focusTimer.paused
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
                  </button>
                  <button onClick={() => { setFocusTimer(null); setFocusTimerState(null); }}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-white/10" title="Stop timer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
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
          <div
            className={`prose prose-invert max-w-none prose-a:text-violet-400 prose-code:text-violet-300 prose-pre:bg-slate-900/70 prose-pre:border prose-pre:border-slate-700/50 prose-pre:rounded-xl prose-pre:text-sm prose-pre:leading-relaxed prose-blockquote:border-violet-500 prose-blockquote:text-slate-400 prose-p:text-[0.9375rem] prose-p:leading-7 [&_img]:block [&_img]:mx-auto [&_img]:h-auto [&_img]:w-full [&_img]:max-w-[680px] [&_img]:rounded-xl [&_img]:border [&_img]:border-slate-700/40 [&_img]:shadow-lg ${
              handwritingMode
                ? '[&_h1]:text-white [&_h2]:text-white [&_h3]:text-white prose-headings:font-bold'
                : 'prose-headings:text-white'
            }`}
            style={handwritingMode ? { fontFamily: "'Patrick Hand', cursive", fontSize: '1.55rem', lineHeight: '2.2', letterSpacing: '0.015em' } : undefined}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                p({ children }) {
                  return <p>{highlightEnabled ? applyHighlighting(children) : children}</p>;
                },
                li({ children }) {
                  return <li>{highlightEnabled ? applyHighlighting(children) : children}</li>;
                },
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
                pre({ children }) {
                  // Intercept mermaid code blocks — avoids wrapping diagram in a styled <pre>
                  const nodeArray = Children.toArray(children);
                  const firstChild = nodeArray[0];
                  if (
                    isValidElement(firstChild) &&
                    ((firstChild.props as { className?: string }).className ?? '').includes('language-mermaid')
                  ) {
                    return (
                      <Suspense fallback={
                        <div className="my-6 rounded-xl border border-violet-900/20 bg-slate-900/50 flex items-center justify-center" style={{ minHeight: '180px' }}>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="w-3 h-3 rounded-full border-2 border-violet-600/40 border-t-violet-400 animate-spin" />
                            Loading diagram…
                          </div>
                        </div>
                      }>
                        <MermaidDiagram chart={String((firstChild.props as { children?: unknown }).children ?? '')} />
                      </Suspense>
                    );
                  }
                  return <pre>{children}</pre>;
                },
                code({ className, children, ...props }) {
                  const isBlock = className?.startsWith('language-');
                  if (isBlock) {
                    return <code className={`${className} block`} {...props}>{children}</code>;
                  }
                  const text = String(children).trim();
                  const def = GLOSSARY[text] ?? GLOSSARY[text.toLowerCase()];
                  if (def) return <TermTooltip term={text} definition={def} />;
                  return <code className={className} {...props}>{children}</code>;
                },
                img({ src, alt, ...props }) {
                  // Notes embed images as absolute site paths
                  // (/content/skillup/{examId}/images/...). Resolve through the
                  // same manifest-aware rule as every other content fetch, so a
                  // promoted vertical's images route to its CDN pin instead of
                  // 404ing against a since-removed local path.
                  const resolvedSrc = typeof src === 'string' ? resolveContentUrl(src) : src;
                  return <img src={resolvedSrc} alt={alt ?? ''} {...props} />;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        )}
      </article>

      {/* Floating timer removed — replaced by sticky strip above article */}

      {/* Sticky in-page TOC — desktop xl+ only */}
      {toc.length > 0 && (
        <aside className="hidden xl:flex xl:flex-col gap-3 shrink-0 sticky top-4 self-start max-h-[calc(100vh-5rem)] overflow-y-auto pb-4"
          style={{ scrollbarWidth: 'none' }}>

          {/* Circular reading progress */}
          {minutes && <CircularProgress pct={readPct} readTime={minutes} />}

          {/* Domain switcher */}
          {examDomains.length > 1 && (
            <div className="rounded-xl p-3"
              style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Domains</p>
              <div className="flex flex-col gap-1">
                {examDomains.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => goTo(d)}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-all"
                    style={{
                      background: domain === d.id ? 'rgba(139,92,246,0.15)' : 'transparent',
                      border: domain === d.id ? '1px solid rgba(139,92,246,0.35)' : '1px solid transparent',
                      color: domain === d.id ? '#a78bfa' : '#64748b',
                    }}
                    onMouseEnter={e => { if (domain !== d.id) { e.currentTarget.style.background = 'rgba(30,41,59,0.6)'; e.currentTarget.style.color = '#94a3b8'; } }}
                    onMouseLeave={e => { if (domain !== d.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; } }}
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] font-bold shrink-0">D{d.id}</span>
                      <span className="text-[11px] truncate">{d.title}</span>
                    </span>
                    <span className="text-[9px] font-mono shrink-0 opacity-60">{d.weight}%</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* In This Article TOC */}
          <div className="rounded-xl p-4"
            style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.20)' }}>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">
              <List size={9} /> In this article
            </p>
            <nav aria-label="Table of contents" className="space-y-0.5">
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
              {/*
                contentUpdatedAt/contentVersion are exam-wide fields sourced
                from index.json, NOT per-domain-note-file — switching domains
                within the same exam shows the same date/version even if only
                one domain's notes actually changed. Known granularity
                limitation for this PR.
              */}
              {examConfig && (
                <ContentMeta
                  updatedLabel={`Last updated ${new Date(examConfig.contentUpdatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`}
                  versionTag={examConfig.contentVersion}
                />
              )}
              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.28)', color: '#a78bfa' }}
                >
                  {copied ? <Check size={11} /> : <Share2 size={11} />}
                  {copied ? 'Copied!' : 'Share'}
                </button>
                <StudyWithAI
                  variant="icon"
                  open={aiPanelOpen}
                  onOpenChange={handleAiOpenChange}
                  initialSelectedText={aiSelectedText}
                  context={aiContext}
                />
              </div>
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

      {/* Floating "explain this" trigger — shown when the user selects text
          inside the article body. Reuses the same StudyWithAI instance(s)
          driven by aiPanelOpen/aiSelectedText below (sidebar icon on xl+,
          modal on smaller viewports), opening it pre-seeded with the
          selection instead of a second copy of the panel UI. */}
      {selectionTrigger && (() => {
        // Clamp horizontally so the trigger never renders partially or
        // fully off-screen near a viewport edge — same approach as
        // TermTooltip.handleShow's TIP_W clamp above, adapted for a
        // fixed-position, centered (translateX(-50%)) trigger.
        const vw = window.innerWidth;
        const half = EXPLAIN_TRIGGER_W / 2;
        const clampedLeft = Math.max(8 + half, Math.min(vw - 8 - half, selectionTrigger.left));
        // Flip below the selection when there isn't room to render above it
        // (selection near the top of the viewport) — mirrors TermTooltip's
        // `flipped` fallback.
        const flipped = selectionTrigger.top - 44 < 8;
        const top = flipped ? selectionTrigger.bottom + 8 : Math.max(8, selectionTrigger.top - 44);
        return (
          <div
            ref={floatingTriggerRef}
            style={{
              position: 'fixed',
              top,
              left: clampedLeft,
              transform: 'translateX(-50%)',
              zIndex: 60,
            }}
          >
            <Button
              variant="primary"
              size="sm"
              icon={Sparkles}
              onClick={handleExplainSelection}
              title="Explain this with AI"
            >
              Explain<span className="sr-only"> this with AI</span>
            </Button>
          </div>
        );
      })()}

      {/* Below-xl "Study with AI" modal — the sidebar <aside> above that
          hosts the sole StudyWithAI instance is `hidden` below the xl
          breakpoint, so the floating "Explain" trigger's state change had
          nowhere visible to render into on narrower viewports. This second
          controlled instance is driven by the exact same lifted
          aiPanelOpen/aiSelectedText state (never contradictory with the
          sidebar instance — both simply reflect one source of truth) and
          only mounts while that state is open, so it never shows a
          redundant floating trigger of its own while idle. Reuses the real
          StudyWithAI component/logic — no duplicated panel UI. */}
      {aiPanelOpen && (
        <div className="xl:hidden fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(2,6,23,0.72)', backdropFilter: 'blur(2px)' }}
            onClick={() => handleAiOpenChange(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Study with AI"
            className="relative w-full sm:max-w-md sm:mx-4 max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
            style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(139,92,246,0.28)' }}
          >
            <StudyWithAI
              variant="row"
              open={aiPanelOpen}
              onOpenChange={handleAiOpenChange}
              initialSelectedText={aiSelectedText}
              context={aiContext}
            />
          </div>
        </div>
      )}

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
          <ContentFeedback contentId={`${examId}-domain-${domain}`} />
          <GiscusComments
            slug={`${examId}-domain-${domain}`}
            context="skill-up"
          />
        </div>
      )}
    </div>
  );
}
