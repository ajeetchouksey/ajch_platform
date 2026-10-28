// ── Questions inside a session: answer, see why, see what it changed ──────────
// Each check saves to the attempt log, shows the per-option reasons and, right
// away, how the question's official objective moved ("1.3 Weak → Building").
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Flame, Lightbulb, X } from 'lucide-react';
import { getAttempts, saveAttempt } from '@/lib/adaptive-quiz';
import { latestAttemptByQuestion, objectiveMastery, type MasteryStatus } from '@/lib/objective-mastery';
import { addQuestionCard, plainText } from '@/lib/flashcards';
import { parseExplanation } from '@/lib/explanation';
import type { Question, QuestionAttempt, TaskStatementsFile } from '@/types/content';

type Confidence = NonNullable<QuestionAttempt['confidence']>;
const CONFIDENCE: { id: Confidence; label: string }[] = [
  { id: 'guess', label: 'Guessing' }, { id: 'unsure', label: 'Unsure' }, { id: 'sure', label: 'Sure' },
];
const STATUS: Record<MasteryStatus, string> = { new: 'Not started', weak: 'Weak', building: 'Building', strong: 'Strong' };

export interface QuestionResult { id: string; correct: boolean; confidence?: Confidence }

export function QuestionStep({ examId, questions, statements, revealAtEnd = false, onDone }: {
  examId: string;
  questions: Question[];
  statements: TaskStatementsFile | null;
  /** Mini mock: no answers until the end. */
  revealAtEnd?: boolean;
  onDone: (results: QuestionResult[]) => void;
}) {
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [conf, setConf] = useState<Confidence | undefined>();
  const [out, setOut] = useState<number[]>([]);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [streak, setStreak] = useState(0);
  const [moved, setMoved] = useState<string | null>(null);
  const shownAt = useRef(0);
  useEffect(() => { shownAt.current = Date.now(); }, [i]);

  const taskOf = useMemo(() => {
    const m = new Map<string, { id: string; title: string; domainId: number; questionIds: string[] }>();
    for (const d of statements?.domains ?? []) for (const t of d.tasks) for (const q of t.questionIds) m.set(q, { ...t, domainId: d.id });
    return m;
  }, [statements]);

  const q = questions[i];
  if (!q) return null;
  const right = chosen === q.correct;
  const reasons = parseExplanation(q.explanation, q.options.length, q.correct).optionReasons;

  const check = () => {
    if (chosen === null) return;
    const task = taskOf.get(q.id);
    const before = task ? objectiveMastery({ id: task.id, title: task.title, questionIds: task.questionIds }, task.domainId, latestAttemptByQuestion(getAttempts(examId))) : null;
    saveAttempt({ questionId: q.id, examId, domain: q.domain, chosenIndex: chosen, correct: right, timeSpentMs: Date.now() - shownAt.current, attemptedAt: Date.now(), loop: 1, ...(conf ? { confidence: conf } : {}) });
    if (!right && conf === 'sure') addQuestionCard(examId, q);
    if (task && before) {
      const after = objectiveMastery({ id: task.id, title: task.title, questionIds: task.questionIds }, task.domainId, latestAttemptByQuestion(getAttempts(examId)));
      setMoved(after.status !== before.status
        ? `Objective ${task.id}: ${STATUS[before.status]} → ${STATUS[after.status]}`
        : `Objective ${task.id}: ${STATUS[after.status]} · ${after.correct}/${after.total} right`);
    }
    setResults((r) => [...r, { id: q.id, correct: right, confidence: conf }]);
    setStreak((s) => (right ? s + 1 : 0));
    if (revealAtEnd) next(true); else setChecked(true);
  };

  function next(skipReveal = false) {
    const done = i + 1 >= questions.length;
    if (done) {
      const final = skipReveal ? [...results, { id: q.id, correct: chosen === q.correct, confidence: conf }] : results;
      onDone(final);
      return;
    }
    setI((n) => n + 1); setChosen(null); setChecked(false); setConf(undefined); setOut([]); setMoved(null);
  }

  const hint = () => {
    const wrong = q.options.map((_, k) => k).filter((k) => k !== q.correct && k !== chosen);
    setOut(wrong.sort(() => Math.random() - 0.5).slice(0, Math.max(0, Math.min(2, q.options.length - 2))));
    if (!conf) setConf('unsure');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>Question {i + 1} of {questions.length}{taskOf.get(q.id) ? ` · objective ${taskOf.get(q.id)!.id}` : ''}</span>
        {!revealAtEnd && streak >= 2 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-200 font-semibold" aria-live="polite">
            <Flame size={12} aria-hidden="true" /> {streak} in a row
          </span>
        )}
      </div>

      {q.scenario && <p className="text-sm text-slate-300 leading-relaxed rounded-xl bg-slate-800/50 border border-slate-600/30 px-4 py-3">{plainText(q.scenario)}</p>}
      <p className="text-base font-semibold text-white leading-snug">{plainText(q.question)}</p>

      <div className="grid gap-2" role="group" aria-label="Answer options">
        {q.options.map((opt, k) => {
          const isOut = !checked && out.includes(k);
          const isRight = checked && k === q.correct;
          const isWrong = checked && k === chosen && !right;
          return (
            <div key={k}>
              <button
                type="button"
                disabled={checked || isOut}
                aria-pressed={!checked ? chosen === k : undefined}
                onClick={() => setChosen(k)}
                className={`w-full flex items-start gap-3 min-h-12 px-4 py-3 rounded-xl border text-left text-sm transition-colors ${
                  isOut ? 'border-slate-800 text-slate-600 line-through'
                    : isRight ? 'border-emerald-400 bg-emerald-400/10 text-emerald-50'
                      : isWrong ? 'border-rose-400 bg-rose-400/10 text-rose-50'
                        : chosen === k ? 'border-brand-lilac bg-brand-indigo/25 text-white'
                          : checked ? 'border-slate-700/60 text-slate-400'
                            : 'border-slate-500/30 bg-slate-900/45 text-slate-200 hover:border-brand-lilac/60'
                }`}
              >
                <span className={`font-bold shrink-0 ${isRight ? 'text-emerald-300' : 'text-brand-lilac'}`}>{'ABCD'[k]}</span>
                <span className="flex-1">{plainText(opt)}</span>
                {isRight && <Check size={16} className="text-emerald-300 shrink-0" aria-label="Correct answer" />}
                {isWrong && <X size={16} className="text-rose-300 shrink-0" aria-label="Your answer" />}
              </button>
              {checked && reasons[k] && (isRight || isWrong) && (
                <p className={`mx-1 px-3 py-2 rounded-b-lg text-xs leading-relaxed ${isRight ? 'bg-emerald-950/60 text-emerald-200' : 'bg-rose-950/60 text-rose-200'}`}>
                  {plainText(reasons[k])}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {!checked && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-xs text-slate-400">How sure are you?</span>
          <div role="group" aria-label="Confidence" className="inline-flex p-1 rounded-xl bg-slate-800/70 border border-slate-600/30">
            {CONFIDENCE.map((c) => (
              <button key={c.id} type="button" aria-pressed={conf === c.id} onClick={() => setConf(c.id)}
                className={`min-h-9 px-3 rounded-lg text-xs font-semibold transition-colors ${conf === c.id ? 'bg-brand-indigo text-white' : 'text-slate-300 hover:text-white'}`}>
                {c.label}
              </button>
            ))}
          </div>
          {!revealAtEnd && q.options.length > 2 && (
            <button type="button" onClick={hint} disabled={out.length > 0}
              className="inline-flex items-center gap-1.5 min-h-9 px-3 rounded-lg border border-slate-600/40 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-50">
              <Lightbulb size={13} aria-hidden="true" /> {out.length ? 'Two ruled out' : 'Hint: rule out two'}
            </button>
          )}
        </div>
      )}

      {checked && (
        <div aria-live="polite" className={`rounded-xl px-4 py-3 border anim-rise ${right ? 'border-emerald-600/50 bg-emerald-900/15' : 'border-rose-600/50 bg-rose-900/15'}`}>
          <p className={`text-sm font-semibold ${right ? 'text-emerald-300' : 'text-rose-300'}`}>
            {right ? 'Correct' : `Not quite: the answer is ${'ABCD'[q.correct]}`}
            {!right && conf === 'sure' && <span className="font-normal text-slate-300"> · you were sure, so it's now a flashcard</span>}
          </p>
          {moved && <p className="text-xs text-brand-tint mt-1">{moved}</p>}
        </div>
      )}

      <div className="sticky bottom-3 z-10 sm:static flex gap-2 rounded-2xl sm:rounded-none bg-[#0e1a2d]/95 sm:bg-transparent p-2 sm:p-0 shadow-lg sm:shadow-none">
        {!checked ? (
          <button type="button" onClick={check} disabled={chosen === null}
            className="flex-1 sm:flex-none min-h-12 px-6 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep disabled:opacity-45 text-white text-sm font-semibold">
            {revealAtEnd ? (i + 1 >= questions.length ? 'Finish' : 'Next') : 'Check answer'}
          </button>
        ) : (
          <button type="button" onClick={() => next()} className="flex-1 sm:flex-none min-h-12 px-6 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold">
            {i + 1 >= questions.length ? 'Finish this step' : 'Next question'}
          </button>
        )}
      </div>
    </div>
  );
}
