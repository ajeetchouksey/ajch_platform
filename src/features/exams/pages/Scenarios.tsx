import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { loadScenariosForExam, loadExamRegistry } from '@/lib/content-loader';
import { isRichScenario, scenarioQuestionText } from '@/types/content';
import type { Scenario, RichScenario, ScenarioQuestion } from '@/types/content';
import { getScenarioResults, saveScenarioResult, type ScenarioResult } from '@/lib/scenario-progress';
import { Clock, Users, CheckCircle2, XCircle, AlertTriangle, RotateCcw, ArrowLeft, ArrowRight, FileText, Lightbulb, ChevronDown } from 'lucide-react';
import ComputedRelatedList from '@/components/ComputedRelatedList';
import { useRelationshipsForIds } from '@/lib/useRelationships';

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-900/40 text-emerald-300 border-emerald-800',
  medium: 'bg-amber-900/40 text-amber-300 border-amber-800',
  hard: 'bg-rose-900/40 text-rose-300 border-rose-800',
};
const CHIP = 'text-[11px] inline-flex items-center gap-1 bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded-full';

/** Split "B is correct: … A is wrong because … C is wrong …" into one line per option.
 *  Returns null when the explanation doesn't follow that shape (render it as prose). */
function splitExplanation(text: string): { letter: string; correct: boolean; reason: string }[] | null {
  const parts = text.split(/(?=\b[A-E] is (?:correct|right|wrong|incorrect)\b)/).map((p) => p.trim()).filter(Boolean);
  const rows = parts.map((p) => {
    const m = p.match(/^([A-E]) is (correct|right|wrong|incorrect)\b[:,]?\s*(?:because\s+)?([\s\S]*)$/);
    return m ? { letter: m[1], correct: m[2] === 'correct' || m[2] === 'right', reason: m[3].trim() } : null;
  });
  return rows.length >= 2 && rows.every(Boolean) ? (rows as { letter: string; correct: boolean; reason: string }[]) : null;
}

function Explanation({ text }: { text: string }) {
  const rows = splitExplanation(text);
  if (!rows) return <p className="text-sm text-slate-400 leading-relaxed">{text}</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.letter} className="flex gap-2 text-sm leading-relaxed">
          {r.correct
            ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
            : <XCircle size={15} className="text-rose-400/80 shrink-0 mt-0.5" />}
          <span className={r.correct ? 'text-emerald-100' : 'text-slate-400'}>
            <span className="font-mono font-semibold mr-1">{r.letter}.</span>{r.reason}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Case file (background + cast) ─────────────────────────────────────────────

function CaseFile({ s, domainTitles }: { s: RichScenario; domainTitles: Record<number, string> }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {s.difficulty && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${DIFFICULTY_STYLES[s.difficulty] ?? CHIP}`}>{s.difficulty}</span>
        )}
        {typeof s.estimatedMinutes === 'number' && <span className={CHIP}><Clock size={11} /> ~{s.estimatedMinutes} min</span>}
        {s.domains.map((d) => (
          <span key={d} className={CHIP} title={domainTitles[d]}>D{d}{domainTitles[d] ? ` · ${domainTitles[d]}` : ''}</span>
        ))}
      </div>
      {s.scenario.background && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1.5"><FileText size={12} /> Background</h3>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{s.scenario.background}</p>
        </div>
      )}
      {s.scenario.characters.length > 0 && (
        <div>
          <h3 className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-1.5 flex items-center gap-1.5"><Users size={12} /> Cast</h3>
          <div className="space-y-2">
            {s.scenario.characters.map((c) => (
              <div key={c.name} className="rounded-lg border border-slate-700/50 bg-slate-900/40 px-3 py-2">
                <p className="text-sm font-medium text-slate-200">{c.name} <span className="text-xs font-normal text-brand-lilac">· {c.role}</span></p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{c.concern}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Guided walkthrough ───────────────────────────────────────────────────────

function Walkthrough({ s, examId, domainTitles, onDone, nextScenario }: {
  s: RichScenario;
  examId: string;
  domainTitles: Record<number, string>;
  onDone: (correct: number, total: number) => void;
  nextScenario: Scenario | null;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [caseOpen, setCaseOpen] = useState(false); // mobile only — desktop pins it beside the questions
  const total = s.questions.length;
  const finished = step >= total;
  const q: ScenarioQuestion | undefined = s.questions[step];
  const chosen = q ? answers[q.id] : undefined;
  const correctCount = s.questions.filter((x) => answers[x.id] === x.correct).length;

  function choose(i: number) {
    if (!q || chosen !== undefined) return;
    setAnswers((a) => ({ ...a, [q.id]: i }));
  }
  function next() {
    const n = step + 1;
    if (n >= total) onDone(s.questions.filter((x) => answers[x.id] === x.correct).length, total);
    setStep(n);
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function restart() { setAnswers({}); setStep(0); }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8 lg:items-start">
      <div className="min-w-0 space-y-5">
        {/* Mobile: case file collapses above the question */}
        <div className="lg:hidden glass-card rounded-xl">
          <button onClick={() => setCaseOpen((v) => !v)} aria-expanded={caseOpen}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-300">
            <span className="flex items-center gap-2"><FileText size={14} /> Case file</span>
            <ChevronDown size={15} className={`transition-transform ${caseOpen ? 'rotate-180' : ''}`} />
          </button>
          {caseOpen && <div className="px-4 pb-4"><CaseFile s={s} domainTitles={domainTitles} /></div>}
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-3">
          <ol className="flex items-center gap-1.5" aria-label="Walkthrough progress">
            {s.questions.map((x, i) => {
              const a = answers[x.id];
              const cls = a === undefined
                ? (i === step ? 'bg-brand-indigo ring-2 ring-brand-lilac/50' : 'bg-slate-700')
                : a === x.correct ? 'bg-emerald-500' : 'bg-rose-500';
              return <li key={x.id} className={`w-2.5 h-2.5 rounded-full ${cls}`} aria-label={`Question ${i + 1}`} />;
            })}
          </ol>
          <span className="text-xs text-slate-500">
            {finished ? 'Complete' : `Question ${step + 1} of ${total}`}
          </span>
        </div>

        {!finished && q && (
          <div className="glass-card rounded-xl p-5 space-y-4">
            <p className="text-base font-medium text-white leading-relaxed">{scenarioQuestionText(q)}</p>
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const answered = chosen !== undefined;
                const isCorrect = i === q.correct;
                const isChosen = i === chosen;
                let cls = 'border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/60';
                if (answered) {
                  if (isCorrect) cls = 'border-emerald-600 bg-emerald-900/25 text-emerald-200';
                  else if (isChosen) cls = 'border-rose-600 bg-rose-900/25 text-rose-200';
                  else cls = 'border-slate-800 text-slate-500';
                }
                return (
                  <button key={i} type="button" disabled={answered} onClick={() => choose(i)}
                    className={`w-full text-left text-sm px-4 py-3 rounded-xl border transition-colors flex items-start gap-2 ${cls}`}>
                    <span className="font-mono text-xs opacity-60 mt-0.5">{String.fromCharCode(65 + i)}.</span>
                    <span className="flex-1">{opt}</span>
                    {answered && isCorrect && <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />}
                    {answered && isChosen && !isCorrect && <XCircle size={15} className="text-rose-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
            {chosen !== undefined && (
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 space-y-3">
                <p className={`text-sm font-semibold ${chosen === q.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {chosen === q.correct ? 'Correct' : `Not quite — the answer is ${String.fromCharCode(65 + q.correct)}`}
                </p>
                <Explanation text={q.explanation} />
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={next} disabled={chosen === undefined}
                className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors">
                {step + 1 >= total ? 'See summary' : 'Next question'} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {finished && (
          <div className="glass-card glass-edge rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${correctCount / total >= 0.7 ? 'text-emerald-400' : 'text-amber-300'}`}>
                {correctCount}/{total}
              </div>
              <div>
                <p className="text-white font-semibold">Walkthrough complete</p>
                <p className="text-sm text-slate-400">{correctCount / total >= 0.7 ? 'You made the calls an architect would.' : 'Review the takeaways, then try again.'}</p>
              </div>
            </div>
            {s.keyLearnings.length > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1.5"><Lightbulb size={12} /> Key takeaways</h3>
                <ul className="space-y-2">
                  {s.keyLearnings.map((k, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
                      <span className="text-brand-lilac font-mono text-xs mt-0.5">{i + 1}</span>{k}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button onClick={restart} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors">
                <RotateCcw size={14} /> Try again
              </button>
              {nextScenario && (
                <Link to={`?s=${encodeURIComponent(nextScenario.id)}`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors">
                  Next scenario <ArrowRight size={14} />
                </Link>
              )}
              <Link to={`/skillup/${examId}/quiz?mode=review`} className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors">
                Practice quiz
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: case file pinned beside the questions */}
      <aside className="hidden lg:block sticky top-4 self-start max-h-[calc(100vh-6rem)] overflow-y-auto glass-card rounded-xl p-5" style={{ scrollbarWidth: 'thin' }}>
        <p className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-3">Case file</p>
        <CaseFile s={s} domainTitles={domainTitles} />
      </aside>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Scenarios() {
  const { examId = 'ccaf' } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get('s');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [examShortTitle, setExamShortTitle] = useState('Exam');
  const [domainTitles, setDomainTitles] = useState<Record<number, string>>({});
  const [isSkillTrack, setIsSkillTrack] = useState(false);
  const [examDomainsLoadedFor, setExamDomainsLoadedFor] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, ScenarioResult>>(() => getScenarioResults(examId));

  useEffect(() => {
    loadExamRegistry().then((r) => {
      const exam = r.exams.find((e) => e.id === examId);
      if (!exam) return;
      // Skill Tracks (IDEA-0016) have no domains/scenarioFiles — this page
      // doesn't apply; send visitors (e.g. an old bookmarked URL) back to
      // the track overview instead of crashing on exam.domains.
      if (exam.kind === 'skill-track') { setIsSkillTrack(true); navigate(`/skillup/${examId}`, { replace: true }); return; }
      setExamShortTitle(exam.shortTitle);
      setDomainTitles(Object.fromEntries(exam.domains.map((d) => [d.id, d.title])));
      setExamDomainsLoadedFor(examId);
    }).catch(() => {});
  }, [examId, navigate]);

  useEffect(() => {
    if (isSkillTrack || examDomainsLoadedFor !== examId) return;
    setLoading(true); setError(null); // eslint-disable-line react-hooks/set-state-in-effect
    loadScenariosForExam(examId)
      .then((s) => { setScenarios(s); setLoading(false); })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, [examId, isSkillTrack, examDomainsLoadedFor, retryKey]);

  // relationships.json has no whole-exam key, only one per domain — union
  // across every domain's own edges (see useRelationshipsForIds's own doc).
  const relDocIds = Object.keys(domainTitles).map((id) => `exam/${examId}/domain-${id}`);
  const computedRelated = useRelationshipsForIds(relDocIds);

  const openIdx = useMemo(() => scenarios.findIndex((s) => s.id === openId), [scenarios, openId]);
  const open = openIdx >= 0 ? scenarios[openIdx] : null;
  const completed = scenarios.filter((s) => results[s.id]).length;

  if (loading) return <p className="text-slate-500 text-sm animate-pulse">Loading scenarios…</p>;

  // ── Error ─────────────────────────────────────────────────────────────────
  // A failed fetch (e.g. a blocked CDN request) must never look like "this
  // exam just has zero scenarios" — see the SkillUp UX assessment finding.
  if (error) {
    return (
      <div className="rounded-xl border border-rose-800/50 bg-rose-950/20 px-5 py-8 text-center">
        <AlertTriangle size={22} className="text-rose-400 mx-auto mb-3" />
        <p className="text-sm font-semibold text-rose-300 mb-1">Couldn't load scenarios</p>
        <p className="text-xs text-slate-500 mb-4">{error}</p>
        <button
          onClick={() => setRetryKey((k) => k + 1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-rose-900/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-colors"
        >
          <RotateCcw size={12} /> Retry
        </button>
      </div>
    );
  }

  // ── Detail ────────────────────────────────────────────────────────────────
  if (open) {
    const nextScenario = scenarios[openIdx + 1] ?? null;
    return (
      <div className="space-y-5">
        <div className="space-y-2">
          <div>
            <button onClick={() => setSearchParams({})} className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
              <ArrowLeft size={13} /> All scenarios
            </button>
          </div>
          <p className="page-eyebrow">{examShortTitle} · Scenario {openIdx + 1} of {scenarios.length}</p>
          <h1 className="text-2xl font-bold tracking-tight text-white">{open.title}</h1>
          <p className="text-sm text-slate-400 max-w-3xl">{open.description}</p>
        </div>
        {isRichScenario(open) && open.questions.length > 0 ? (
          <Walkthrough
            key={open.id}
            s={open}
            examId={examId}
            domainTitles={domainTitles}
            nextScenario={nextScenario}
            onDone={(correct, total) => setResults(saveScenarioResult(examId, open.id, correct, total))}
          />
        ) : (
          <div className="glass-card rounded-xl p-5 space-y-4 max-w-3xl">
            {!isRichScenario(open) && open.architecture_notes && (
              <div>
                <h3 className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-2">Architecture notes</h3>
                <p className="text-sm text-slate-300 leading-relaxed">{open.architecture_notes}</p>
              </div>
            )}
            {!isRichScenario(open) && (open.key_patterns?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider mb-2">Key patterns</h3>
                <ul className="space-y-1.5">
                  {(open.key_patterns ?? []).map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-slate-300"><CheckCircle2 size={14} className="text-brand-lilac shrink-0 mt-0.5" />{p}</li>
                  ))}
                </ul>
              </div>
            )}
            <Link to={`/skillup/${examId}/quiz?mode=review`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white transition-colors">
              Practice these patterns <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
    <div className="flex-1 min-w-0 space-y-4">
      <div className="space-y-1">
        <p className="page-eyebrow">{examShortTitle} Exam</p>
        <h1 className="text-2xl font-bold tracking-tight">Exam <span className="heading-gradient">Scenarios</span></h1>
        <p className="text-sm text-slate-400">
          Case-based walkthroughs: read the brief, then make each decision in turn.
          {completed > 0 && <span className="text-slate-300"> · {completed} of {scenarios.length} completed</span>}
        </p>
      </div>

      {scenarios.map((s, idx) => {
        const r = results[s.id];
        const rich = isRichScenario(s);
        return (
          <button
            key={s.id}
            onClick={() => setSearchParams({ s: s.id })}
            className="w-full text-left glass-card glass-sheen rounded-xl px-5 py-4 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 group"
          >
            <div className="flex items-start gap-4">
              <span className="font-mono text-xs text-slate-600 mt-1 w-5">{String(idx + 1).padStart(2, '0')}</span>
              <div className="min-w-0 flex-1">
                <span className="font-semibold text-white block group-hover:text-brand-tint">{s.title}</span>
                <p className="text-sm text-slate-400 mt-1 line-clamp-2">{s.description}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {rich ? (
                    <>
                      {s.difficulty && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border capitalize ${DIFFICULTY_STYLES[s.difficulty] ?? CHIP}`}>{s.difficulty}</span>
                      )}
                      {typeof s.estimatedMinutes === 'number' && <span className={CHIP}><Clock size={11} /> ~{s.estimatedMinutes} min</span>}
                      {s.questions.length > 0 && <span className={CHIP}>{s.questions.length} decisions</span>}
                      {s.domains.map((d) => <span key={d} className={CHIP} title={domainTitles[d]}>D{d}</span>)}
                    </>
                  ) : (
                    <>
                      {(s.key_patterns ?? []).slice(0, 3).map((p) => <span key={p} className={CHIP}>{p}</span>)}
                      {(s.key_patterns?.length ?? 0) > 3 && <span className="text-[11px] text-slate-600">+{(s.key_patterns?.length ?? 0) - 3} more</span>}
                    </>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {r ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 size={13} /> Best {r.best}/{r.total}
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 group-hover:text-brand-lilac inline-flex items-center gap-1">
                    {rich ? 'Start' : 'Open'} <ArrowRight size={12} />
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>

    {/* ── Sidebar — related content across verticals ────────────────────── */}
    <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 lg:sticky lg:top-4 self-start space-y-6">
      <ComputedRelatedList edges={computedRelated} />
    </aside>
    </div>
  );
}
