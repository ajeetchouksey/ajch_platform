// ── One lesson at a time, its quick check, then on to the next ────────────────
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, ChevronLeft, Target } from 'lucide-react';
import { matchQuestionsToSections } from '@/lib/section-match';
import { markLessonRead } from '@/lib/storage';
import { setResumeState } from '@/lib/study-tracker';
import { plainText } from '@/lib/flashcards';
import type { DomainLessons } from '@/lib/objective-sections';
import type { Question } from '@/types/content';
import { SectionCheck } from '../SectionCheck';
import { LessonBody } from './LessonBody';

export function LessonPlayer({ examId, domain, lessons, objectiveId, lessonNo, bank, markdown, onOpen, onBack }: {
  examId: string;
  domain: number;
  lessons: DomainLessons;
  objectiveId: string;
  lessonNo: number;
  bank: Question[];
  markdown: string;
  onOpen: (objectiveId: string, lessonNo: number) => void;
  onBack: () => void;
}) {
  const [finished, setFinished] = useState(false);
  const checks = useMemo(() => matchQuestionsToSections(markdown, bank), [markdown, bank]);

  const objIdx = lessons.objectives.findIndex((o) => o.task.id === objectiveId);
  const objective = objIdx >= 0 ? lessons.objectives[objIdx] : null;
  const list = objective ? objective.lessons : objectiveId === 'other' ? lessons.other : [];
  const title = objective ? objective.task.title : 'More topics in this domain';
  const lesson = list[lessonNo - 1];
  const nextObjective = lessons.objectives.slice(objIdx + 1).find((o) => o.lessons.length > 0);

  const back = (
    <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 min-h-10 text-sm text-slate-400 hover:text-white transition-colors">
      <ChevronLeft size={15} aria-hidden="true" /> All objectives
    </button>
  );

  if (!lesson) {
    return (
      <div className="space-y-3">
        {back}
        <p className="glass-card rounded-2xl p-5 text-sm text-slate-300">That lesson isn't here any more. Pick one from the list.</p>
      </div>
    );
  }

  const complete = () => {
    markLessonRead(examId, domain, lesson.heading);
    setResumeState(examId, { domainId: domain, sectionTitle: plainText(lesson.heading), ts: Date.now() });
  };
  const isLast = lessonNo === list.length;

  if (finished) {
    return (
      <section className="space-y-4" aria-labelledby="done-h">
        {back}
        <div className="glass-card rounded-2xl p-6 space-y-4 border border-brand-lilac/30">
          <span className="inline-flex w-10 h-10 rounded-full bg-emerald-400/15 text-emerald-300 items-center justify-center" aria-hidden="true"><Check size={20} /></span>
          <h2 id="done-h" className="text-xl font-semibold text-white">
            {objective ? `Objective ${objective.task.id} read` : 'All topics read'}
          </h2>
          <p className="text-sm text-slate-300">
            {list.length} lesson{list.length === 1 ? '' : 's'} done. Practising now, while it's fresh, is what makes it stick.
          </p>
          <div className="flex flex-wrap gap-2">
            {objective && (
              <Link
                to={`/skillup/${examId}/quiz?task=${encodeURIComponent(objective.task.id)}`}
                className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold transition-colors"
              >
                <Target size={15} aria-hidden="true" /> Drill {objective.task.id}
              </Link>
            )}
            {nextObjective && (
              <button
                type="button"
                onClick={() => onOpen(nextObjective.task.id, 1)}
                className="inline-flex items-center gap-2 min-h-11 px-4 rounded-xl border border-slate-600/50 text-slate-200 hover:border-brand-lilac/55 text-sm font-semibold transition-colors"
              >
                Next: {nextObjective.task.id} {nextObjective.task.title} <ArrowRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  const candidates = checks.get(lesson.heading) ?? [];

  return (
    <section className="space-y-5" aria-label={`Lesson ${lessonNo} of ${list.length}`}>
      <div className="space-y-3">
        {back}
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-lilac">
            {objective ? `Objective ${objective.task.id} · ` : ''}Lesson {lessonNo} of {list.length} · ~{lesson.minutes} min
          </p>
          <p className="text-sm text-slate-300">{title}</p>
        </div>
        <ol className="flex gap-1" aria-label="Lessons in this objective">
          {list.map((l, i) => (
            <li key={l.heading} className="flex-1">
              <button
                type="button"
                onClick={() => onOpen(objectiveId, i + 1)}
                aria-current={i + 1 === lessonNo ? 'step' : undefined}
                aria-label={`Lesson ${i + 1}: ${plainText(l.heading)}`}
                title={plainText(l.heading)}
                className={`block w-full h-1.5 rounded-full transition-colors ${i + 1 < lessonNo ? 'bg-brand-lilac' : i + 1 === lessonNo ? 'bg-brand-indigo' : 'bg-slate-700/70 hover:bg-slate-500'}`}
              />
            </li>
          ))}
        </ol>
      </div>

      <LessonBody heading={lesson.heading} body={lesson.body} />

      {candidates.length > 0 && (
        <SectionCheck key={`${examId}-${domain}-${lesson.heading}`} examId={examId} domain={domain} heading={lesson.heading} candidates={candidates} markdown={markdown} />
      )}

      <div className="sticky bottom-3 z-10 flex gap-2 rounded-2xl bg-slate-950/90 backdrop-blur p-2 border border-slate-700/40 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-0 sm:p-0">
        {lessonNo > 1 && (
          <button
            type="button"
            onClick={() => onOpen(objectiveId, lessonNo - 1)}
            aria-label="Previous lesson"
            className="inline-flex items-center justify-center gap-1.5 min-h-12 px-4 rounded-xl border border-slate-600/50 text-slate-200 hover:border-brand-lilac/55 text-sm font-semibold transition-colors"
          >
            <ArrowLeft size={15} aria-hidden="true" /> <span className="hidden sm:inline">Previous</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => { complete(); if (isLast) setFinished(true); else onOpen(objectiveId, lessonNo + 1); }}
          className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 min-h-12 px-6 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold transition-colors"
        >
          {isLast ? 'Finish objective' : 'Next lesson'} <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
