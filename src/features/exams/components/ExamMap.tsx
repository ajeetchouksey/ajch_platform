import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, Target, ArrowRight } from 'lucide-react';
import type { DomainConfig, ExamConfig, QuizSession } from '@/types/content';
import type { ExamMastery, MasteryStatus, ObjectiveMastery } from '@/lib/objective-mastery';
import { getDomainCompletion } from '@/lib/study-tracker';
import { domainColor } from '@/lib/skillup-colors';

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
      done: mine.length > 0, to: `${base}/quiz?mode=review`, cta: 'take a quiz' },
    { key: 'learn', title: 'Learn', detail: unread ? `Next: D${unread.id} notes` : 'All domain notes read',
      done: !unread, to: `${base}/notes${unread ? `?d=${unread.id}` : ''}`, cta: 'read notes' },
    { key: 'practice', title: 'Practice', detail: mastery ? `${mastery.objectives.filter((o) => o.attempted > 0).length} of ${mastery.objectives.length} objectives practised` : 'Drill by domain',
      done: coverage >= COVERAGE_TARGET,
      to: mastery?.weakest ? `${base}/quiz?task=${encodeURIComponent(mastery.weakest.task.id)}` : `${base}/quiz`,
      cta: mastery?.weakest ? `drill objective ${mastery.weakest.task.id}` : 'drill a domain' },
    { key: 'simulate', title: 'Simulate', detail: `Timed exam · ${exam.duration}`,
      done: simulated, to: `${base}/quiz?mode=timed`, cta: 'start the timed exam' },
    // readiness = getReadinessBreakdown: notes read + best of domain-quiz and per-question attempt scores.
    { key: 'ready', title: 'Ready', detail: `Readiness ${readiness}% · need ${exam.passThreshold}%`,
      done: readiness >= exam.passThreshold && coverage >= COVERAGE_TARGET && simulated },
  ];
  const nextIdx = steps.findIndex((s) => !s.done);
  const next = nextIdx >= 0 ? steps[nextIdx] : null;

  return (
    <section className="glass-card glass-edge rounded-2xl p-5 space-y-4" aria-labelledby="prep-path-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="prep-path-h" className="section-heading">Your path</h2>
        {next?.to && (
          <Link
            to={next.to}
            className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold transition-colors"
          >
            Next: {next.cta} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <ol className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
        {steps.map((s, i) => {
          const isNext = i === nextIdx;
          return (
            <li
              key={s.key}
              aria-current={isNext ? 'step' : undefined}
              className={`min-w-0 flex flex-col gap-1.5 p-3 rounded-xl border ${
                isNext ? 'bg-brand-indigo/20 border-brand-lilac/50' : 'bg-slate-900/45 border-slate-700/40'
              }`}
            >
              <span
                className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                  s.done ? 'bg-emerald-400 text-slate-950'
                    : isNext ? 'bg-brand-indigo text-white'
                      : 'bg-slate-700/60 text-slate-300'
                }`}
              >
                {s.done ? <Check size={13} strokeWidth={3} aria-label="Done" /> : i + 1}
              </span>
              <p className={`text-[15px] font-semibold ${s.done || isNext ? 'text-white' : 'text-slate-300'}`}>{s.title}</p>
              <p className="text-xs text-slate-400 leading-snug">{s.detail}</p>
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
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3 border-t border-slate-800/60 first:border-t-0">
      <span className="font-mono text-xs text-slate-400 w-8 shrink-0">{o.task.id}</span>
      <div className="flex-[1_1_220px] min-w-0">
        <p className="text-sm text-slate-200 leading-snug">{o.task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden" title={`${Math.round(o.mastery * 100)}% mastery`}>
            <div className={`h-full rounded-full ${st.bar}`} style={{ width: `${Math.round(o.mastery * 100)}%` }} />
          </div>
          <span className="text-[11px] text-slate-400">{o.attempted}/{o.total} answered{o.attempted ? ` · ${Math.round(o.accuracy * 100)}% right` : ''}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${st.chip}`}>{st.label}</span>
        {o.total > 0 && (
          <Link
            to={`/skillup/${examId}/quiz?task=${encodeURIComponent(o.task.id)}`}
            className="inline-flex items-center gap-1 min-h-10 px-3 rounded-lg border border-brand-lilac/35 text-xs font-semibold text-brand-lilac hover:text-white hover:border-brand-lilac/70 transition-colors"
            aria-label={`Practise objective ${o.task.id}`}
          >
            <Target size={12} /> Practise
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
    <div className="rounded-lg border border-slate-800/70 border-l-4 bg-slate-900/30" style={{ borderLeftColor: domainColor(domain.id) }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-3 min-h-14 text-left rounded-lg hover:bg-slate-800/40 transition-colors"
      >
        {open ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
        <span className="font-mono text-xs font-bold w-6" style={{ color: domainColor(domain.id) }}>D{domain.id}</span>
        <span className="flex-[1_1_180px] min-w-0 text-sm font-semibold text-slate-100">{domain.title}</span>
        <span className="flex items-center gap-2.5 ml-auto">
          <span className="text-[11px] text-slate-400">{strong}/{objectives.length} strong</span>
          <span className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden" aria-hidden="true">
            <span className="block h-full rounded-full" style={{ width: `${Math.round(mastery * 100)}%`, background: domainColor(domain.id) }} />
          </span>
          <span className="font-mono text-xs text-slate-300 w-9 text-right">{domain.weight}%</span>
        </span>
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
    <section className="glass-card glass-edge rounded-2xl p-5 space-y-3" aria-labelledby="exam-map-h">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id="exam-map-h" className="section-heading">Exam map</h2>
        <span className="text-xs text-slate-400">
          Official objectives · {mastery.objectives.filter((o) => o.attempted > 0).length} of {mastery.objectives.length} practised · open a domain to practise
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
