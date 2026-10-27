// ── Inline self-check after a notes section ───────────────────────────────────
// Two bank questions matched to the section by keyword overlap. Answers go to
// the same attempt log as the quiz, so they count toward the exam map.
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Layers, X } from 'lucide-react';
import { getAttempts, saveAttempt } from '@/lib/adaptive-quiz';
import { latestAttemptByQuestion } from '@/lib/objective-mastery';
import { addCards, addQuestionCard, buildNoteCards, plainText } from '@/lib/flashcards';
import { CHECKS_PER_SECTION } from '@/lib/section-match';
import type { Question } from '@/types/content';

export function SectionCheck({ examId, domain, heading, candidates, markdown }: {
  examId: string; domain: number; heading: string; candidates: Question[]; markdown: string;
}) {
  // Prefer questions not answered yet, then ones last answered wrong.
  const [qs] = useState(() => {
    const latest = latestAttemptByQuestion(getAttempts(examId));
    const rank = (q: Question) => (!latest.has(q.id) ? 0 : latest.get(q.id)!.correct ? 2 : 1);
    return [...candidates].sort((a, b) => rank(a) - rank(b)).slice(0, CHECKS_PER_SECTION);
  });
  const [idx, setIdx] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [right, setRight] = useState(0);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [cardsAdded, setCardsAdded] = useState<number | null>(null);
  const sectionCards = useMemo(
    () => buildNoteCards(examId, domain, markdown).filter((c) => c.source === plainText(heading)),
    [examId, domain, markdown, heading],
  );

  if (!qs.length) return null;
  const done = idx >= qs.length;
  const q = qs[Math.min(idx, qs.length - 1)];

  const check = () => {
    if (chosen === null) return;
    const correct = chosen === q.correct;
    saveAttempt({ questionId: q.id, examId, domain: q.domain, chosenIndex: chosen, correct, timeSpentMs: Date.now() - startedAt, attemptedAt: Date.now(), loop: 1 });
    if (!correct) addQuestionCard(examId, q);
    if (correct) setRight((n) => n + 1);
    setChecked(true);
  };
  const next = () => { setIdx((n) => n + 1); setChosen(null); setChecked(false); setStartedAt(Date.now()); };
  const makeCards = () => setCardsAdded(addCards(examId, sectionCards.map((c) => c.id)));

  return (
    <section
      aria-label={`Quick check: ${plainText(heading)}`}
      className="not-prose my-10 rounded-2xl p-5 space-y-4 border border-brand-lilac/35 bg-gradient-to-br from-brand-indigo/20 to-slate-800/85"
      style={{ fontFamily: 'inherit', fontSize: '1rem', lineHeight: 1.5, letterSpacing: 'normal' }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="text-lg font-bold text-white m-0">
          {done ? 'Quick check done' : `Quick check · ${idx + 1} of ${qs.length}`}
        </h3>
        <span className="text-xs text-slate-400">Counts toward your exam map</span>
      </div>

      {!done ? (
        <>
          {q.scenario && <p className="text-sm text-slate-300 leading-relaxed">{plainText(q.scenario)}</p>}
          <p className="text-[15px] font-semibold text-white leading-snug">{plainText(q.question)}</p>
          <div className="grid gap-2" role="group" aria-label="Answer options">
            {q.options.map((opt, i) => {
              const isRight = checked && i === q.correct;
              const isWrong = checked && i === chosen && i !== q.correct;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={checked}
                  aria-pressed={chosen === i}
                  onClick={() => setChosen(i)}
                  className={`flex items-start gap-3 min-h-11 px-3 py-2.5 rounded-xl border text-left text-sm transition-colors ${
                    isRight ? 'border-emerald-400 bg-emerald-400/10 text-emerald-50'
                      : isWrong ? 'border-rose-400 bg-rose-400/10 text-rose-50'
                        : chosen === i ? 'border-brand-lilac bg-brand-indigo/25 text-white'
                          : 'border-slate-500/30 bg-slate-900/45 text-slate-200 hover:border-brand-lilac/60'
                  }`}
                >
                  <span className={`font-bold shrink-0 ${isRight ? 'text-emerald-300' : 'text-brand-lilac'}`}>{'ABCD'[i]}</span>
                  <span className="flex-1">{plainText(opt)}</span>
                  {isRight && <Check size={16} className="text-emerald-300 shrink-0" aria-label="Correct answer" />}
                  {isWrong && <X size={16} className="text-rose-300 shrink-0" aria-label="Your answer" />}
                </button>
              );
            })}
          </div>
          {checked && (
            <div aria-live="polite" className="rounded-xl bg-slate-900/55 border border-slate-600/30 p-3 space-y-1">
              <p className={`text-sm font-semibold ${chosen === q.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                {chosen === q.correct ? 'Correct' : `Not quite: the answer is ${'ABCD'[q.correct]}`}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{plainText(q.explanation)}</p>
              {chosen !== q.correct && <p className="text-xs text-slate-400">Added to your flashcards so it comes back.</p>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {!checked ? (
              <button type="button" onClick={check} disabled={chosen === null}
                className="min-h-11 px-4 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep disabled:opacity-45 disabled:cursor-not-allowed text-white text-sm font-semibold">
                Check answer
              </button>
            ) : (
              <button type="button" onClick={next} className="min-h-11 px-4 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold">
                {idx + 1 < qs.length ? 'Next question' : 'Finish'}
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-200">
          {right} of {qs.length} right. {right === qs.length ? 'This section has stuck. Keep reading.' : 'Worth a second look before you move on.'}
        </p>
      )}

      {sectionCards.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-600/25">
          {cardsAdded === null ? (
            <button type="button" onClick={makeCards}
              className="inline-flex items-center gap-2 min-h-11 px-3 rounded-xl border border-brand-lilac/40 text-sm font-semibold text-brand-tint hover:bg-brand-indigo/20">
              <Layers size={15} aria-hidden="true" /> Make {sectionCards.length} flashcard{sectionCards.length === 1 ? '' : 's'} from this section
            </button>
          ) : (
            <p className="text-sm text-slate-300" aria-live="polite">
              {cardsAdded > 0 ? `${cardsAdded} card${cardsAdded === 1 ? '' : 's'} added to review.` : 'These cards are already in your review.'}{' '}
              <Link to={`/skillup/${examId}/flashcards`} className="font-semibold text-brand-lilac hover:text-white">Review now</Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
