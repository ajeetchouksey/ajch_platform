import { useState, useCallback, Children, isValidElement, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import {
  BookOpen, ExternalLink, ChevronDown, ChevronRight, FlaskConical,
  CheckCircle2, XCircle, MessageSquare, Layers, Compass,
} from 'lucide-react';

const MermaidDiagram = lazy(() => import('@/components/MermaidDiagram'));
import GiscusComments from '@/components/GiscusComments';
import { ContentFeedback } from '@/components/ContentFeedback';
import PageViewsBadge from '@/components/PageViewsBadge';
import ComputedRelatedList from '@/components/ComputedRelatedList';
import { useRelationships } from '@/lib/useRelationships';
import { loadLessonNote } from '@/lib/content-loader';
import type { ExamConfig, SkillTrackModule, SkillTrackLesson, KnowledgeCheckQuestion } from '@/types/content';

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
function LessonCard({ lesson }: { lesson: SkillTrackLesson }) {
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState<string | null>(null);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);

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
        <PageViewsBadge path={`/skillup/${examId}`} className="mt-1" />
      </div>

      {/* Modules */}
      {modules.map((mod) => (
        <div key={mod.id} className="space-y-3">
          <h2 className="section-heading flex items-center gap-2">
            <Layers size={14} className="text-violet-400" />
            {mod.title}
          </h2>
          <div className="space-y-3">
            {mod.lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
          <ModuleRelated examId={examId} mod={mod} />
        </div>
      ))}

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
