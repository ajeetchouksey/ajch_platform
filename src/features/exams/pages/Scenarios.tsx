import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadScenariosForExam, loadExamRegistry } from '@/lib/content-loader';
import type { Scenario, ScenarioQuestion } from '@/types/content';
import { ChevronDown, ChevronUp, Clock, Users, CheckCircle2, XCircle } from 'lucide-react';

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  medium: 'bg-amber-900/40 text-amber-300 border-amber-800',
  hard: 'bg-rose-900/40 text-rose-300 border-rose-800',
};

/** Interactive question for the rich scenario schema. */
function ScenarioQuestionCard({ q, index }: { q: ScenarioQuestion; index: number }) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/40 p-4">
      <p className="text-sm font-medium text-slate-200 mb-3">
        <span className="text-violet-400">Q{index + 1}.</span> {q.question}
      </p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correct;
          const isChosen = i === selected;
          let cls = 'border-slate-700/50 bg-slate-800/40 text-slate-300 hover:border-slate-600';
          if (answered) {
            if (isCorrect) cls = 'border-emerald-700 bg-emerald-900/30 text-emerald-200';
            else if (isChosen) cls = 'border-rose-700 bg-rose-900/30 text-rose-200';
            else cls = 'border-slate-800 bg-slate-800/20 text-slate-500';
          }
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setSelected(i)}
              className={`w-full text-left text-sm px-3 py-2 rounded-md border transition-colors flex items-start gap-2 ${cls} ${answered ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {answered && isCorrect && <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />}
              {answered && isChosen && !isCorrect && <XCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />}
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
      {answered && (
        <div className="mt-3 text-sm text-slate-400 bg-slate-800/40 border border-slate-700/40 rounded-md px-3 py-2">
          <span className="font-semibold text-slate-300">Explanation. </span>
          {q.explanation}
        </div>
      )}
    </div>
  );
}

export default function Scenarios() {
  const { examId = 'ccaf' } = useParams<{ examId: string }>();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [examShortTitle, setExamShortTitle] = useState('Exam');
  const [domainTitles, setDomainTitles] = useState<Record<number, string>>({});

  useEffect(() => {
    loadExamRegistry().then((r) => {
      const exam = r.exams.find((e) => e.id === examId);
      if (exam) {
        setExamShortTitle(exam.shortTitle);
        setDomainTitles(Object.fromEntries(exam.domains.map((d) => [d.id, d.title])));
      }
    }).catch(() => {});
  }, [examId]);

  useEffect(() => {
    setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
    loadScenariosForExam(examId)
      .then((s) => { setScenarios(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [examId]);

  if (loading) return <p className="text-slate-500 text-sm animate-pulse">Loading scenarios…</p>;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="page-eyebrow">{examShortTitle} Exam</p>
        <h1 className="text-2xl font-bold tracking-tight">Exam <span className="heading-gradient">Scenarios</span></h1>
        <p className="text-sm text-slate-400">
          Work through {scenarios.length} practitioner-grade scenarios — architecture patterns, decision points, and anti-patterns.
        </p>
      </div>

      {scenarios.map((s) => {
        const isRich = !!s.scenario || (s.questions?.length ?? 0) > 0;
        const patterns = s.key_patterns ?? [];
        const questions = s.questions ?? [];
        return (
          <div key={s.id} className="glass-card rounded-xl overflow-hidden">
            <button
              onClick={() => setOpen(open === s.id ? null : s.id)}
              className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-slate-800/50 transition-colors"
            >
              <div className="min-w-0 flex-1 pr-3">
                <span className="font-semibold text-white block">{s.title}</span>
                {open !== s.id && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {isRich ? (
                      <>
                        {s.difficulty && (
                          <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${DIFFICULTY_STYLES[s.difficulty] ?? 'bg-slate-800 text-slate-400 border-slate-700/50'}`}>
                            {s.difficulty}
                          </span>
                        )}
                        {typeof s.estimatedMinutes === 'number' && (
                          <span className="text-[11px] inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded-full">
                            <Clock size={11} /> ~{s.estimatedMinutes} min
                          </span>
                        )}
                        {questions.length > 0 && (
                          <span className="text-[11px] bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded-full">
                            {questions.length} questions
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        {patterns.slice(0, 3).map((p) => (
                          <span key={p} className="text-[11px] bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded-full">
                            {p}
                          </span>
                        ))}
                        {patterns.length > 3 && (
                          <span className="text-[11px] text-slate-600">+{patterns.length - 3} more</span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              {open === s.id ? (
                <ChevronUp size={16} className="text-slate-400 shrink-0 mt-1" />
              ) : (
                <ChevronDown size={16} className="text-slate-400 shrink-0 mt-1" />
              )}
            </button>

            {open === s.id && (
              <div className="px-5 pb-5 space-y-4 border-t border-slate-700/40">
                <p className="text-sm text-slate-300 pt-4">{s.description}</p>

                {isRich ? (
                  <>
                    {(s.difficulty || typeof s.estimatedMinutes === 'number' || (s.domains?.length ?? 0) > 0) && (
                      <div className="flex flex-wrap items-center gap-2">
                        {s.difficulty && (
                          <span className={`text-xs px-2 py-1 rounded border capitalize ${DIFFICULTY_STYLES[s.difficulty] ?? 'bg-slate-800 text-slate-400 border-slate-700/50'}`}>
                            {s.difficulty}
                          </span>
                        )}
                        {typeof s.estimatedMinutes === 'number' && (
                          <span className="text-xs inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-1 rounded">
                            <Clock size={12} /> ~{s.estimatedMinutes} min
                          </span>
                        )}
                        {(s.domains ?? []).map((d) => (
                          <span key={d} className="text-xs bg-violet-900/40 text-violet-300 border border-violet-800 px-2 py-1 rounded">
                            {domainTitles[d] ? `D${d} · ${domainTitles[d]}` : `Domain ${d}`}
                          </span>
                        ))}
                      </div>
                    )}

                    {s.scenario?.background && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">Background</h3>
                        <p className="text-sm text-slate-400 whitespace-pre-line">{s.scenario.background}</p>
                      </div>
                    )}

                    {(s.scenario?.characters?.length ?? 0) > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2 inline-flex items-center gap-1.5">
                          <Users size={13} /> Cast
                        </h3>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {s.scenario!.characters.map((c) => (
                            <div key={c.name} className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
                              <p className="text-sm font-medium text-slate-200">{c.name}</p>
                              <p className="text-xs text-violet-400">{c.role}</p>
                              <p className="text-xs text-slate-500 mt-1">{c.concern}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {questions.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">Walkthrough</h3>
                        <div className="space-y-3">
                          {questions.map((q, i) => (
                            <ScenarioQuestionCard key={q.id} q={q} index={i} />
                          ))}
                        </div>
                      </div>
                    )}

                    {(s.keyLearnings?.length ?? 0) > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">Key Takeaways</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                          {s.keyLearnings!.map((k, i) => (
                            <li key={i}>{k}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {s.architecture_notes && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">Architecture Notes</h3>
                        <p className="text-sm text-slate-400">{s.architecture_notes}</p>
                      </div>
                    )}
                    {patterns.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">Key Patterns</h3>
                        <div className="flex flex-wrap gap-2">
                          {patterns.map((p) => (
                            <span key={p} className="text-xs bg-violet-900/40 text-violet-300 border border-violet-800 px-2 py-1 rounded">
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
