import { useState, useCallback, useEffect, Children, isValidElement, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  BookOpen, ExternalLink, ChevronDown, ChevronRight, ChevronUp, FlaskConical,
  CheckCircle2, XCircle, MessageSquare, Layers, Compass, ListTree,
} from 'lucide-react';

const MermaidDiagram = lazy(() => import('@/components/MermaidDiagram'));
import GiscusComments from '@/components/GiscusComments';
import { ContentFeedback } from '@/components/ContentFeedback';
import PageViewsBadge from '@/components/PageViewsBadge';
import ComputedRelatedList from '@/components/ComputedRelatedList';
import { useRelationships } from '@/lib/useRelationships';
import { loadLessonNote } from '@/lib/content-loader';
import { TermTooltip } from '@/components/GlossaryTerm';
import { useGlossary } from '@/lib/useGlossary';
import { lookupGlossaryTerm } from '@/lib/glossary';
import { applyHighlighting, KeywordHighlightToggle } from '@/components/KeywordHighlight';
import { getFocusTimer, setFocusTimer } from '@/lib/study-tracker';
import type { FocusTimer } from '@/lib/study-tracker';
import type { ExamConfig, SkillTrackModule, SkillTrackLesson, KnowledgeCheckQuestion } from '@/types/content';

const FOCUS_PRESETS = [{ label: '15 min', ms: 900000 }, { label: '25 min', ms: 1500000 }, { label: '30 min', ms: 1800000 }, { label: '45 min', ms: 2700000 }, { label: '60 min', ms: 3600000 }];

// ── Inline knowledge check (no separate route — light, ungated, no timer/score-gate) ──
function KnowledgeCheckItem({ q, idx }: { q: KnowledgeCheckQuestion; idx: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="rounded-lg bg-slate-900/60 border border-slate-800/60 p-3.5">
      <p className="text-sm text-slate-200 font-medium mb-2.5">{idx + 1}. {q.question}</p>
      <div className="space-y-1.5">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isChosen = i === selected;
          let cls = 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300';
          if (revealed && isCorrect) cls = 'border-emerald-700/60 bg-emerald-950/40 text-emerald-300';
          else if (revealed && isChosen && !isCorrect) cls = 'border-rose-700/60 bg-rose-950/30 text-rose-300';
          return (
            <button
              key={i}
              type="button"
              disabled={revealed}
              onClick={() => { setSelected(i); setRevealed(true); }}
              className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 ${cls}`}
            >
              {revealed && isCorrect && <CheckCircle2 size={13} className="shrink-0 text-emerald-400" />}
              {revealed && isChosen && !isCorrect && <XCircle size={13} className="shrink-0 text-rose-400" />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {revealed && (
        <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">{q.explanation}</p>
      )}
    </div>
  );
}

// ── One lesson card: objectives, optional hands-on mission, notes toggle, knowledge check ──
function LessonCard({ lesson, highlightEnabled }: { lesson: SkillTrackLesson; highlightEnabled: boolean }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const glossary = useGlossary();

  const toggleNotes = useCallback(() => {
    setNotesOpen((o) => !o);
    if (!notes && !loadingNotes) {
      setLoadingNotes(true);
      loadLessonNote(lesson.notesFile)
        .then(setNotes)
        .catch(() => setNotes('_Could not load this lesson\'s notes._'))
        .finally(() => setLoadingNotes(false));
    }
  }, [lesson.notesFile, notes, loadingNotes]);

  return (
    <div className="glass-card rounded-xl p-4 sm:p-5" style={{ background: 'rgba(8,15,30,0.6)', border: '1px solid rgba(71,85,105,0.18)' }}>
      <h3 className="text-white font-semibold text-sm mb-1.5">{lesson.title}</h3>
      {lesson.objectives.length > 0 && (
        <ul className="text-xs text-slate-400 space-y-1 mb-3 list-disc list-inside">
          {lesson.objectives.map((o, i) => <li key={i}>{o}</li>)}
        </ul>
      )}

      {lesson.holLabId && (
        <Link
          to={`/hol-labs/${lesson.holLabId}`}
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 hover:text-amber-300 transition-colors mb-3"
        >
          <FlaskConical size={12} /> Hands-on mission: try it in a guided lab <ExternalLink size={10} />
        </Link>
      )}

      <div className="flex flex-wrap gap-4 border-t border-slate-800/60 pt-3">
        <button
          type="button"
          onClick={toggleNotes}
          className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
        >
          {notesOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          <BookOpen size={12} /> {notesOpen ? 'Hide' : 'Read'} lesson notes
        </button>
        {lesson.knowledgeCheck.length > 0 && (
          <button
            type="button"
            onClick={() => setCheckOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            {checkOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            Knowledge check ({lesson.knowledgeCheck.length})
          </button>
        )}
      </div>

      {notesOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 prose prose-invert prose-sm max-w-none prose-headings:text-slate-200 prose-p:text-slate-400 prose-strong:text-slate-300 prose-table:text-xs">
          {loadingNotes ? (
            <p className="text-xs text-slate-500">Loading…</p>
          ) : (
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
                pre({ children }) {
                  // Intercept mermaid code blocks — same convention as the exam Notes page.
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
                  const entry = glossary && lookupGlossaryTerm(glossary, text);
                  if (entry) return <TermTooltip entry={entry} />;
                  return <code className={className} {...props}>{children}</code>;
                },
              }}
            >
              {notes ?? ''}
            </ReactMarkdown>
          )}
        </div>
      )}

      {checkOpen && lesson.knowledgeCheck.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-3">
          {lesson.knowledgeCheck.map((q, i) => <KnowledgeCheckItem key={q.id} q={q} idx={i} />)}
        </div>
      )}
    </div>
  );
}

// ── Computed cross-vertical relationships for one module (IDEA-0008) ──
// One panel per module, not one for the whole track — a module's taxonomyIds
// are specific to its own subtopic, so scoping the query per-module surfaces
// genuinely relevant HOL Labs/blog posts/use cases instead of one generic
// list diluted across the whole track.
function ModuleRelated({ examId, mod }: { examId: string; mod: SkillTrackModule }) {
  const edges = useRelationships(`exam/${examId}/module-${mod.id}`);
  return <ComputedRelatedList edges={edges} heading={`Related to ${mod.title}`} />;
}

export default function SkillTrackHome({ exam, examId, mounted }: { exam: ExamConfig; examId: string; mounted: boolean }) {
  const modules = exam.modules ?? [];
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);

  // Focus timer (Pomodoro) — same shared timer as the exam Notes page (one
  // global timer in localStorage, see study-tracker.ts). A skill track has
  // no per-domain header to hang this off of, so it lives at page level here.
  const [focusTimer, setFocusTimerState] = useState<FocusTimer | null>(() => getFocusTimer());
  const [timerSecs, setTimerSecs] = useState(0);
  const [showDurationPicker, setShowDurationPicker] = useState(false);

  const startTimer = useCallback((durationMs: number) => {
    const t: FocusTimer = { mode: 'focus', startedAt: Date.now(), durationMs, pomodoros: focusTimer ? focusTimer.pomodoros : 0, examId };
    setFocusTimer(t); setFocusTimerState(t); setTimerSecs(Math.floor(durationMs / 1000));
    setShowDurationPicker(false);
  }, [focusTimer, examId]);

  const handlePauseResume = useCallback(() => {
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
  }, [focusTimer]);

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

  // Collapsed-module tracking — a Set of module ids currently collapsed.
  // Everything starts expanded (matches the page's prior behavior); collapsing
  // is an opt-in way to cut scroll length on a long track, not a default.
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  // Prose keyword highlighting ("Terms on/off") — defaults on, matching the
  // exam Notes page, so a lesson's plain-text mentions of known terms (Azure
  // RBAC, architecture patterns, etc. — src/lib/keywords.ts) are highlighted
  // automatically without the content author needing to backtick-wrap them.
  const [highlightEnabled, setHighlightEnabled] = useState(true);

  const toggleModule = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const jumpToModule = useCallback((id: string) => {
    setCollapsed((prev) => { if (!prev.has(id)) return prev; const next = new Set(prev); next.delete(id); return next; });
    // Let the (possibly just-reopened) section render before scrolling to it.
    requestAnimationFrame(() => {
      document.getElementById(`module-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  // Active-section tracking for the quick-nav — "you are here" while
  // scrolling, distinct from jumpToModule's "take me there" on click.
  //
  // NOT Notes.tsx's intersection-ratio approach: that's tuned for thin h2/h3
  // heading markers, where "highest intersectionRatio" cleanly picks the one
  // nearest the top. A module section here can be far taller than the
  // viewport (a whole lesson list), so its own intersectionRatio against a
  // narrow rootMargin band is tiny and not comparable across differently-
  // sized modules (a short collapsed module vs. a tall expanded one would
  // never compare fairly by ratio). Position-based instead: on scroll, find
  // the last module (in document order) whose top has crossed above a fixed
  // line near the top of `main` — the standard scrollspy technique for
  // block-level sections rather than point-like markers.
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const ACTIVE_LINE_PX = 120;

  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>('[id^="module-"]'));
    if (!sections.length) return;

    const updateActive = () => {
      const mainTop = mainEl.getBoundingClientRect().top;
      let current = sections[0].id;
      for (const el of sections) {
        if (el.getBoundingClientRect().top - mainTop <= ACTIVE_LINE_PX) current = el.id;
        else break;
      }
      setActiveModuleId(current.replace(/^module-/, ''));
    };

    // setTimeout, not requestAnimationFrame — rAF doesn't fire reliably in
    // background tabs or headless Playwright (see platform-dev-expert.md's
    // Known Failure Modes table); setTimeout(fn, 0) is this codebase's
    // established fix for the same class of "never fires" bug.
    let pending: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => { clearTimeout(pending); pending = setTimeout(updateActive, 0); };
    mainEl.addEventListener('scroll', onScroll, { passive: true });
    updateActive();
    return () => { mainEl.removeEventListener('scroll', onScroll); clearTimeout(pending); };
    // modules.length: re-measure if the module list itself changes (new
    // content); collapsing/expanding doesn't remove a module's own wrapper
    // div (only its children), so collapse state isn't a dependency —
    // updateActive() re-reads live layout on every scroll regardless.
  }, [modules.length]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 bg-blue-900/50 text-blue-300 border border-blue-700/50">
          <Compass size={12} />
          Skill Track — self-paced, not a certification
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="heading-gradient">{exam.title}</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">{exam.description}</p>
        <p className="text-slate-500 text-xs mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <span>{modules.length} modules</span>
          <span>·</span>
          <span>{totalLessons} lessons</span>
          <span>·</span>
          <span>Self-paced, no timer</span>
          {exam.contentVersion && (
            <>
              <span>·</span>
              <span className="font-mono text-violet-400/70">v{exam.contentVersion}</span>
            </>
          )}
        </p>
        <div className="flex items-center gap-2 mt-3">
          <PageViewsBadge path={`/skillup/${examId}`} />
          <KeywordHighlightToggle
            enabled={highlightEnabled}
            onToggle={() => setHighlightEnabled((v) => !v)}
          />
          <div className="relative ml-auto">
            <button
              type="button"
              title={focusTimer ? 'Focus timer active' : 'Start focus timer'}
              onClick={() => { if (!focusTimer) setShowDurationPicker(v => !v); }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                focusTimer ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40' : 'bg-slate-800/60 text-slate-500 border border-slate-700/40 hover:text-slate-300'
              }`}
            >
              🍅 {focusTimer ? `${String(Math.floor((focusTimer.paused ? Math.floor((focusTimer.pausedRemainingMs??0)/1000) : timerSecs)/60)).padStart(2,'0')}:${String((focusTimer.paused ? Math.floor((focusTimer.pausedRemainingMs??0)/1000) : timerSecs)%60).padStart(2,'0')}` : 'Focus'}
            </button>
            {showDurationPicker && !focusTimer && (
              <div className="absolute bottom-full mb-2 right-0 z-50 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 min-w-[140px]">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 pb-1">Choose duration</p>
                {FOCUS_PRESETS.map(p => (
                  <button key={p.ms} type="button" onClick={() => startTimer(p.ms)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-violet-600/20 hover:text-violet-300 rounded-lg transition-colors font-mono">
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky focus-timer strip — visible while scrolling, matches exam Notes page */}
      {focusTimer && (() => {
        const displaySecs = focusTimer.paused ? Math.floor((focusTimer.pausedRemainingMs ?? 0) / 1000) : timerSecs;
        const pct = focusTimer.paused
          ? ((focusTimer.pausedRemainingMs ?? 0) / focusTimer.durationMs)
          : (timerSecs / Math.floor(focusTimer.durationMs / 1000));
        const isFocus = focusTimer.mode === 'focus';
        return (
          <div className="sticky top-14 z-30 rounded-xl overflow-hidden border"
            style={{ borderColor: isFocus ? 'rgba(139,92,246,0.4)' : 'rgba(52,211,153,0.35)' }}>
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
                <button type="button" onClick={handlePauseResume} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                  title={focusTimer.paused ? 'Resume' : 'Pause'}>
                  {focusTimer.paused
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>}
                </button>
                <button type="button" onClick={() => { setFocusTimer(null); setFocusTimerState(null); }}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-white/10" title="Stop timer">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Quick nav — jump to any module, expanding it if collapsed */}
      {modules.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-600 mr-1">
            <ListTree size={11} /> Jump to
          </span>
          {modules.map((mod, i) => {
            const isActive = activeModuleId === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => jumpToModule(mod.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                  isActive
                    ? 'bg-violet-500/15 text-violet-300 border-violet-500/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:border-violet-500/50 hover:text-violet-300'
                }`}
              >
                M{i + 1} · {mod.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Modules — each collapsible, so a long track doesn't force scrolling past everything */}
      {modules.map((mod) => {
        const isCollapsed = collapsed.has(mod.id);
        return (
          <div key={mod.id} id={`module-${mod.id}`} className="space-y-3 scroll-mt-24">
            <button
              type="button"
              onClick={() => toggleModule(mod.id)}
              aria-expanded={!isCollapsed}
              className="w-full flex items-center gap-2 text-left group"
            >
              <h2 className="section-heading flex items-center gap-2 flex-1">
                <Layers size={14} className="text-violet-400" />
                {mod.title}
              </h2>
              <span className="text-[11px] text-slate-500">{mod.lessons.length} lesson{mod.lessons.length === 1 ? '' : 's'}</span>
              {isCollapsed ? (
                <ChevronDown size={15} className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
              ) : (
                <ChevronUp size={15} className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0" />
              )}
            </button>
            {!isCollapsed && (
              <>
                <div className="space-y-3">
                  {mod.lessons.map((lesson) => (
                    <LessonCard key={lesson.id} lesson={lesson} highlightEnabled={highlightEnabled} />
                  ))}
                </div>
                <ModuleRelated examId={examId} mod={mod} />
              </>
            )}
          </div>
        );
      })}

      {/* Practice Bank — opt-in, retained legacy MCQ bank */}
      {exam.practiceBank && (
        <Link
          to={`/skillup/${examId}/quiz`}
          className="glass-card glass-sheen card-accent-top rounded-xl p-5 flex items-center justify-between gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group block"
        >
          <div>
            <h2 className="font-semibold text-white mb-1">Practice Bank <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Opt-in</span></h2>
            <p className="text-sm text-slate-400">{exam.practiceBank.description}</p>
          </div>
          <span className="shrink-0 text-xs font-bold text-violet-400 group-hover:text-violet-300">{exam.practiceBank.questions} Qs →</span>
        </Link>
      )}

      {/* Official resources */}
      {exam.resources.length > 0 && (
        <div className="glass-card glass-edge rounded-xl p-5">
          <h2 className="section-heading mb-3">Official Resources</h2>
          <ul className="space-y-2">
            {exam.resources.map(({ label, url }) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 hover:translate-x-1 transition-all duration-200"
                >
                  <ExternalLink size={13} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Community discussion */}
      <div className="mt-12 pt-8 border-t border-slate-800/60">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare size={16} className="text-violet-400" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Community Discussion</h2>
          <div className="ml-auto"><ContentFeedback contentId={`exam-${examId}`} compact /></div>
        </div>
        <GiscusComments slug={`exam-${examId}`} context="skill-up" />
      </div>
    </div>
  );
}
