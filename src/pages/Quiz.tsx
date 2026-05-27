import { useState, useEffect, useCallback } from 'react';
import { loadAllQuestions, loadQuestionsByDomain } from '../lib/content-loader';
import { saveSession } from '../lib/storage';
import { DOMAIN_META, type Question, type QuizSession } from '../types/content';
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Filter } from 'lucide-react';

type Phase = 'setup' | 'quiz' | 'review';

function randomId() {
  return Math.random().toString(36).slice(2);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [domainFilter, setDomainFilter] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState(false);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(false);

  const startQuiz = useCallback(async () => {
    setLoading(true);
    const qs = domainFilter
      ? await loadQuestionsByDomain(domainFilter)
      : await loadAllQuestions();
    const picked = shuffle(qs).slice(0, Math.min(qs.length, domainFilter ? 15 : 60));
    const newSession: QuizSession = {
      id: randomId(),
      startedAt: Date.now(),
      domainFilter,
      answers: {},
      score: 0,
      total: picked.length,
    };
    setQuestions(picked);
    setCurrent(0);
    setChosen(null);
    setAnswers({});
    setRevealed(false);
    setSession(newSession);
    setPhase('quiz');
    setLoading(false);
  }, [domainFilter]);

  useEffect(() => {
    if (phase === 'review' && session) {
      const score = questions.filter((q) => answers[q.id] === q.correct).length;
      const finished: QuizSession = { ...session, finishedAt: Date.now(), answers, score };
      saveSession(finished);
      setSession(finished);
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChoose(idx: number) {
    if (revealed) return;
    setChosen(idx);
  }

  function handleReveal() {
    if (chosen === null) return;
    setRevealed(true);
    if (session) {
      const q = questions[current];
      setAnswers((prev) => ({ ...prev, [q.id]: chosen }));
    }
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setPhase('review');
    } else {
      setCurrent((c) => c + 1);
      setChosen(null);
      setRevealed(false);
    }
  }

  // ── SETUP ──────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Practice Quiz</h1>

        <div className="glass-card rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Filter size={14} />
            <span>Filter by domain (optional)</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() => setDomainFilter(null)}
              className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                domainFilter === null
                  ? 'border-violet-500 bg-violet-900/30 text-white'
                  : 'border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              <span className="font-semibold">All Domains</span> — 60 questions, full mock exam
            </button>
            {Object.entries(DOMAIN_META).map(([d, meta]) => (
              <button
                key={d}
                onClick={() => setDomainFilter(Number(d))}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  domainFilter === Number(d)
                    ? 'border-violet-500 bg-violet-900/30 text-white'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <span className="font-semibold">D{d}</span> · {meta.title}{' '}
                <span className="text-slate-500">({meta.weight}%)</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startQuiz}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Loading…' : 'Start Quiz →'}
        </button>
      </div>
    );
  }

  // ── REVIEW ─────────────────────────────────────────────────────────────────
  if (phase === 'review') {
    const score = questions.filter((q) => answers[q.id] === q.correct).length;
    const pct = Math.round((score / questions.length) * 100);
    const passed = pct >= 72;

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Session Complete</h1>
        <div
          className={`rounded-xl p-6 text-center border ${
            passed ? 'border-emerald-600 bg-emerald-900/20' : 'border-rose-600 bg-rose-900/20'
          }`}
        >
          <div className="text-5xl font-bold mb-2" style={{ color: passed ? '#34d399' : '#f87171' }}>
            {pct}%
          </div>
          <p className="text-slate-300 text-sm">
            {score} / {questions.length} correct
          </p>
          <p className={`text-sm font-semibold mt-2 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
            {passed ? '✓ Above 72% pass threshold' : '✗ Below 72% pass threshold'}
          </p>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const userAns = answers[q.id];
            const correct = userAns === q.correct;
            return (
              <div
                key={q.id}
                className={`bg-slate-900 border rounded-xl p-4 text-sm ${
                  correct ? 'border-emerald-800' : 'border-rose-800'
                }`}
              >
                <div className="flex items-start gap-2 mb-2">
                  {correct ? (
                    <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-rose-400 mt-0.5 shrink-0" />
                  )}
                  <span className="text-slate-300">
                    Q{i + 1}: {q.question}
                  </span>
                </div>
                {!correct && (
                  <div className="ml-6 space-y-1">
                    <p className="text-rose-400 text-xs">
                      Your answer: {userAns !== undefined ? q.options[userAns] : 'skipped'}
                    </p>
                    <p className="text-emerald-400 text-xs">Correct: {q.options[q.correct]}</p>
                    <p className="text-slate-500 text-xs mt-1">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setPhase('setup')}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          <RotateCcw size={15} /> Try Again
        </button>
      </div>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  const q = questions[current];
  const isCorrect = chosen === q.correct;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-slate-500">
          <span>
            Question {current + 1} of {questions.length}
          </span>
          <span>D{q.domain} · {DOMAIN_META[q.domain].title}</span>
        </div>
        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-violet-600 rounded-full transition-all"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Scenario */}
      {q.scenario && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-300">
          <span className="text-slate-500 font-semibold uppercase text-xs tracking-wide block mb-1">
            Scenario
          </span>
          {q.scenario}
        </div>
      )}

      {/* Question */}
      <div className="text-white font-medium text-base">{q.question}</div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, idx) => {
          let cls =
            'w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ';
          if (!revealed) {
            cls +=
              chosen === idx
                ? 'border-violet-500 bg-violet-900/30 text-white'
                : 'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800';
          } else {
            if (idx === q.correct)
              cls += 'border-emerald-500 bg-emerald-900/20 text-emerald-300';
            else if (idx === chosen && !isCorrect)
              cls += 'border-rose-500 bg-rose-900/20 text-rose-300';
            else cls += 'border-slate-800 text-slate-500';
          }
          return (
            <button key={idx} onClick={() => handleChoose(idx)} className={cls}>
              <span className="font-mono text-xs mr-2 opacity-60">
                {String.fromCharCode(65 + idx)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {revealed && (
        <div
          className={`rounded-xl p-4 text-sm border ${
            isCorrect ? 'border-emerald-700 bg-emerald-900/10' : 'border-rose-700 bg-rose-900/10'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 font-semibold">
            {isCorrect ? (
              <CheckCircle size={15} className="text-emerald-400" />
            ) : (
              <XCircle size={15} className="text-rose-400" />
            )}
            <span className={isCorrect ? 'text-emerald-300' : 'text-rose-300'}>
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </span>
          </div>
          <p className="text-slate-300">{q.explanation}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {q.tags.map((t) => (
              <span key={t} className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!revealed && (
          <button
            disabled={chosen === null}
            onClick={handleReveal}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            Check Answer
          </button>
        )}
        {revealed && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
          >
            {current + 1 >= questions.length ? 'See Results' : 'Next'}
            <ChevronRight size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
