import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, Target, ArrowRight } from 'lucide-react';
import type { DomainConfig, ExamConfig, QuizSession } from '@/types/content';
import type { ExamMastery, MasteryStatus, ObjectiveMastery } from '@/lib/objective-mastery';
import { getDomainCompletion } from '@/lib/study-tracker';

/** Objective coverage the Practice step (and Ready) require — mirrors the
 *  "readiness stays low until the whole syllabus is covered" rule. */
export const COVERAGE_TARGET = 0.6;

const STATUS_STYLE: Record<MasteryStatus, { chip: string; bar: string; label: string }> = {
  new:      { chip: 'bg-slate-800 text-slate-500 border-slate-700',          bar: 'bg-slate-700',     label: 'Not started' },
  weak:     { chip: 'bg-rose-950 text-rose-300 border-rose-800',             bar: 'bg-rose-500',      label: 'Weak' },
  building: { chip: 'bg-amber-950 text-amber-300 border-amber-800',          bar: 'bg-amber-400',     label: 'Building' },
  strong:   { chip: 'bg-emerald-950 text-emerald-300 border-emerald-800',    bar: 'bg-emerald-500',   label: 'Strong' },
};

// ── Prep path ─────────────────────────────────────────────────────────────────

interface Step { key: string; title: string; detail: string; done: boolean; to?: string; cta?: string }

export function PrepPath({ exam, sessions, mastery, readiness }: {
  exam: ExamConfig;
  sessions: QuizSession[];
  mastery: ExamMastery | null;
  readiness: number;
}) {
  const mine = sessions.filter((s) => s.skillId === exam.id && s.finishedAt);
  const unread = exam.domains.find((d) => !getDomainCompletion(exam.id, d.id, sessions).notesRead);
  const coverage = mastery?.coverage ?? 0;
  const simulated = mine.some((s) => s.mode === 'timed');
  const base = `/skillup/${exam.id}`;

  const steps: Step[] = [
    { key: 'diagnose', title: 'Diagnose', detail: 'Any quiz gives you a baseline',
      done: mine.length > 0, to: `${base}/quiz?mode=review`, cta: 'Take a quiz' },
    { key: 'learn', title: 'Learn', detail: unread ? `Next: D${unread.id} notes` : 'All domain notes read',
      done: !unread, to: `${base}/notes${unread ? `?d=${unread.id}` : ''}`, cta: 'Read notes' },
    { key: 'practice', title: 'Practice', detail: mastery ? `${Math.round(coverage * 100)}% of objectives covered` : 'Drill by domain',
      done: coverage >= COVERAGE_TARGET,
      to: mastery?.weakest ? `${base}/quiz?task=${encodeURIComponent(mastery.weakest.task.id)}` : `${base}/quiz`,
      cta: mastery?.weakest ? `Drill ${mastery.weakest.task.id}` : 'Drill' },
    { key: 'simulate', title: 'Simulate', detail: `Timed exam · ${exam.duration}`,
      done: simulated, to: `${base}/quiz?mode=timed`, cta: 'Start timed exam' },
    // readiness = getReadinessBreakdown (notes read + best domain-quiz score).
    { key: 'ready', title: 'Ready', detail: `Readiness ${readiness}% · need ${exam.passThreshold}%`,
      done: readiness >= exam.passThreshold && coverage >= COVERAGE_TARGET && simulated },
  ];
  const nextIdx = steps.findIndex((s) => !s.done);
  const next = nextIdx >= 0 ? steps[nextIdx] : null;

  return (
    <section className="glass-card glass-edge rounded-xl p-5 space-y-4" aria-labelledby="prep-path-h">
      <div className="flex items-center justify-between gap-3">
        <h2 id="prep-path-h" className="section-heading">Your path</h2>
        {next?.to && (
          <Link
            to={next.to}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-indigo hover:bg-brand-indigo-deep text-white transition-colors"
          >
            {next.cta} <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <ol className="grid grid-cols-5 gap-2">
        {steps.map((s, i) => {
          const isNext = i === nextIdx;
          return (
            <li key={s.key} className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    s.done ? 'bg-emerald-500/90 text-slate-950'
                      : isNext ? 'bg-brand-indigo text-white ring-2 ring-brand-lilac/50'
                        : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {s.done ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span className={`h-px flex-1 ${i < steps.length - 1 ? (s.done ? 'bg-emerald-600/60' : 'bg-slate-700') : 'bg-transparent'}`} />
              </div>
              <p className={`text-sm font-semibold ${isNext ? 'text-white' : s.done ? 'text-slate-300' : 'text-slate-500'}`}>{s.title}</p>
              <p className="text-[11px] text-slate-500 leading-snug">{s.detail}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ── Exam map ──────────────────────────────────────────────────────────────────

function ObjectiveRow({ o, examId }: { o: ObjectiveMastery; examId: string }) {
  const st = STATUS_STYLE[o.status];
  return (
    <li className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-3 py-2 border-t border-slate-800/60 first:border-t-0">
      <span className="font-mono text-xs text-slate-500">{o.task.id}</span>
      <div className="min-w-0">
        <p className="text-sm text-slate-200 leading-snug">{o.task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden" title={`${Math.round(o.mastery * 100)}% mastery`}>
            <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${Math.round(o.mastery * 100)}%` }} />
          </div>
          <span className="text-[11px] text-slate-500">{o.attempted}/{o.total} answered{o.attempted ? ` · ${Math.round(o.accuracy * 100)}% right` : ''}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${st.chip}`}>{st.label}</span>
        {o.total > 0 && (
          <Link
            to={`/skillup/${examId}/quiz?task=${encodeURIComponent(o.task.id)}`}
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-lilac hover:text-white transition-colors"
            aria-label={`Practice objective ${o.task.id}`}
          >
            <Target size={12} /> Practice
          </Link>
        )}
      </div>
    </li>
  );
}

function DomainGroup({ domain, objectives, examId, defaultOpen }: {
  domain: DomainConfig; objectives: ObjectiveMastery[]; examId: string; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const total = objectives.reduce((n, o) => n + o.total, 0);
  // Question-weighted, so a 2-question objective doesn't count as much as a 12-question one.
  const mastery = total ? objectives.reduce((n, o) => n + o.mastery * o.total, 0) / total : 0;
  const strong = objectives.filter((o) => o.status === 'strong').length;
  return (
    <div className="rounded-lg border border-slate-800/70 bg-slate-900/30">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
      >
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
        <span className="font-mono text-xs text-slate-500 w-6">D{domain.id}</span>
        <span className="flex-1 min-w-0 text-sm font-medium text-slate-200 truncate">{domain.title}</span>
        <span className="text-[11px] text-slate-500 hidden sm:inline">{strong}/{objectives.length} strong</span>
        <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-brand-indigo" style={{ width: `${Math.round(mastery * 100)}%` }} />
        </div>
        <span className="font-mono text-xs text-slate-400 w-9 text-right">{domain.weight}%</span>
      </button>
      {open && (
        <ul className="px-3 pb-2">
          {objectives.map((o) => <ObjectiveRow key={o.task.id} o={o} examId={examId} />)}
        </ul>
      )}
    </div>
  );
}

export function ExamMap({ exam, mastery }: { exam: ExamConfig; mastery: ExamMastery }) {
  const weakestDomain = mastery.weakest?.domainId;
  return (
    <section className="glass-card glass-edge rounded-xl p-5 space-y-3" aria-labelledby="exam-map-h">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="exam-map-h" className="section-heading">Exam map</h2>
        <span className="text-[11px] text-slate-500">
          Official objectives · mastery = accuracy × coverage · {Math.round(mastery.coverage * 100)}% covered
        </span>
      </div>
      <div className="space-y-2">
        {exam.domains.map((d) => (
          <DomainGroup
            key={d.id}
            domain={d}
            examId={exam.id}
            objectives={mastery.objectives.filter((o) => o.domainId === d.id)}
            defaultOpen={d.id === (weakestDomain ?? exam.domains[0]?.id)}
          />
        ))}
      </div>
    </section>
  );
}
