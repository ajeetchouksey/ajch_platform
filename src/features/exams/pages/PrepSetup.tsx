// ── First visit: four choices, a live forecast, then the learner's own plan ───
// Route: /skillup/:examId/start (?step=N to jump back and edit one answer).
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BellRing, Check, Sparkles } from 'lucide-react';
import { loadExamRegistry } from '@/lib/content-loader';
import { getReadinessBreakdown } from '@/lib/study-tracker';
import { getSessions } from '@/lib/storage';
import {
  DEFAULT_DAYS, PASS_LINE, daysPerWeek, forecast, getProfile, reminderIcs, saveProfile, skipSetup,
  type Goal, type Level, type PrepProfile, type StartMode,
} from '@/lib/prep-profile';
import type { ExamConfig } from '@/types/content';
import { ForecastChart } from '../components/journey/ForecastChart';

const DAY = 86_400_000;
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const nice = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

interface Draft { goal: Goal | null; examDate: string; level: Level | null; minsPerDay: number; days: boolean[]; start: StartMode | null }

function Choice({ on, title, desc, badge, onPick }: { on: boolean; title: string; desc: string; badge?: string; onPick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onPick}
      className={`relative flex flex-col gap-1.5 min-h-[7.5rem] p-4 rounded-2xl border-[1.5px] text-left transition-all hover:-translate-y-0.5 ${
        on ? 'border-brand-lilac bg-brand-indigo/25' : 'border-slate-500/25 bg-slate-800/60 hover:border-brand-lilac/60'
      }`}
    >
      {badge && <span className="anim-pop self-start px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-300 text-xs font-semibold">{badge}</span>}
      <span className="text-lg font-semibold text-white pr-7">{title}</span>
      <span className="text-sm text-slate-400 leading-snug">{desc}</span>
      {on && <span className="anim-pop absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-brand-indigo text-white flex items-center justify-center" aria-hidden="true"><Check size={14} /></span>}
    </button>
  );
}

export default function PrepSetup() {
  const { examId = '' } = useParams<{ examId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const existing = useMemo(() => getProfile(examId), [examId]);
  const [now] = useState(() => Date.now());
  const [d, setD] = useState<Draft>(() => ({
    goal: existing?.goal ?? null,
    examDate: existing?.examDate ?? iso(new Date(now + 28 * DAY)),
    level: existing?.level ?? null,
    minsPerDay: existing?.minsPerDay ?? 30,
    days: existing?.days ?? DEFAULT_DAYS,
    start: existing?.start ?? null,
  }));
  const [step, setStep] = useState(() => Math.min(3, Math.max(0, Number(params.get('step')) || 0)));
  const [phase, setPhase] = useState<'ask' | 'building' | 'plan'>(existing && params.get('step') === null ? 'plan' : 'ask');
  const [built, setBuilt] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [reminder, setReminder] = useState(existing?.reminder ?? '19:00');
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  useEffect(() => {
    loadExamRegistry().then((r) => {
      const e = r.exams.find((x) => x.id === examId);
      if (!e || e.kind === 'skill-track') { navigate(`/skillup/${examId}`, { replace: true }); return; }
      setExam(e);
    }).catch(() => navigate(`/skillup/${examId}`, { replace: true }));
  }, [examId, navigate]);

  const readiness = useMemo(() => (exam ? getReadinessBreakdown(examId, exam.domains, getSessions(), exam.questions).overall : 0), [exam, examId]);
  const deadline = d.goal === 'booked' || d.goal === 'aiming';
  const profileLike = { goal: d.goal ?? 'aiming', examDate: deadline ? d.examDate : undefined, level: d.level ?? 'some', minsPerDay: d.minsPerDay, days: d.days };
  const f = forecast(profileLike, readiness, now);
  const perWeek = daysPerWeek(d);
  const weeks = deadline ? Math.max(1, Math.round((new Date(`${d.examDate}T00:00:00`).getTime() - now) / (7 * DAY))) : null;
  const sessions = weeks ? weeks * perWeek : null;

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => { setD((x) => ({ ...x, [k]: v })); setFlash(k); later(() => setFlash(null), 900); };
  const go = (n: number) => { setStep(n); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); };

  const finish = (start: StartMode) => {
    const p: PrepProfile = {
      goal: d.goal ?? 'explore', examDate: deadline ? d.examDate : undefined, level: d.level ?? 'some',
      minsPerDay: d.minsPerDay, days: d.days, start, createdAt: existing?.createdAt ?? now, reminder: existing?.reminder,
    };
    saveProfile(examId, p);
    setPhase('building'); setBuilt(0);
    [1, 2, 3, 4].forEach((n) => later(() => setBuilt(n), n * 380));
    later(() => setPhase('plan'), 1900);
  };

  if (!exam) return <div className="max-w-5xl mx-auto glass-card rounded-2xl h-96 animate-pulse" aria-busy="true" />;

  const verdict = !d.level
    ? { tone: 'muted', text: 'Answer a few questions and your forecast appears here.' }
    : !deadline
      ? { tone: 'info', text: f.weeksToPass === 0 ? `You're already above ${PASS_LINE}%.` : f.weeksToPass ? `At ${d.minsPerDay} min, ${perWeek} days a week, you'd pass the ${PASS_LINE}% line in about ${f.weeksToPass} weeks.` : 'Add a little more time a day to reach the pass line.' }
      : f.end >= PASS_LINE
        ? { tone: 'good', text: `On track: about ${f.end}% ready by ${nice(d.examDate)}${f.weeksToPass && weeks && f.weeksToPass < weeks ? `, past the pass line around week ${f.weeksToPass}` : ''}.` }
        : { tone: f.end >= PASS_LINE - 8 ? 'close' : 'low', text: `${f.end >= PASS_LINE - 8 ? 'Close' : 'Not quite'}: about ${f.end}% by exam day. ${f.minsNeeded ? `Try ${f.minsNeeded} min a day, or add a study day.` : 'Add study days or pick a later date.'}` };
  const verdictCls = { muted: 'bg-slate-500/10 text-slate-300', info: 'bg-brand-indigo/20 text-brand-tint', good: 'bg-emerald-400/15 text-emerald-100', close: 'bg-amber-400/15 text-amber-100', low: 'bg-rose-400/15 text-rose-100' }[verdict.tone];

  const facts: [string, string | null, string][] = [
    ['Exam day', d.goal === 'explore' ? 'No deadline' : deadline ? nice(d.examDate) : null, 'goal'],
    ['Starting point', d.level ? { new: 'From scratch', some: 'Some basics', pro: 'Gap-hunting' }[d.level] : null, 'level'],
    ['Each week', step >= 2 || existing ? `${perWeek} × ${d.minsPerDay} min` : null, 'minsPerDay'],
    [deadline ? 'Total study' : 'Readiness now', deadline ? (step >= 2 || existing ? `${Math.round(((sessions ?? 0) * d.minsPerDay) / 60)} h · ${sessions} sessions` : null) : `${readiness}%`, 'days'],
  ];

  // ── Building ──
  if (phase === 'building') {
    const lines = [
      `Mapped ${exam.domains.length} domains and their official objectives`,
      deadline ? `Fitted ${sessions} sessions of ${d.minsPerDay} min before ${nice(d.examDate)}` : `Set a steady ${d.minsPerDay}-minute habit, ${perWeek} days a week`,
      'Scheduled flashcard reviews on your study days',
      `Picked your first step: ${{ test: 'a 10-question baseline', learn: 'the D1 notes', practise: 'a drill on the biggest domain' }[d.start ?? 'test']}`,
    ].slice(0, built);
    return (
      <section aria-live="polite" className="max-w-xl mx-auto mt-10 glass-card rounded-2xl p-7 space-y-3 border border-brand-lilac/35">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles size={20} className="text-brand-lilac" aria-hidden="true" /> Building your plan…</h1>
        {lines.map((t) => (
          <p key={t} className="anim-rise flex items-center gap-2.5 text-slate-200">
            <span className="anim-pop w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>{t}
          </p>
        ))}
      </section>
    );
  }

  // ── Plan ──
  if (phase === 'plan') {
    const p = getProfile(examId)!;
    const studyItems = p.start === 'learn' || p.level === 'new'
      ? ['D1 notes', 'D1 notes + check', 'Drill D1', 'Cards + notes', 'Drill weakest', 'D2 notes', 'Cards + drill']
      : ['Baseline quiz', 'Drill weakest', 'Notes on gaps', 'Cards + drill', 'Drill weakest', 'Missed + cards', 'Mini mock'];
    let k = 0;
    const cal = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(now + i * DAY);
      const di = (day.getDay() + 6) % 7;
      const isExam = p.examDate === iso(day);
      const study = p.days[di];
      return { i, dow: DOW[di].slice(0, 2), date: day.getDate(), isExam, study, what: isExam ? 'Exam day' : study ? studyItems[Math.min(k++, studyItems.length - 1)] : 'Rest' };
    });
    const W = weeks ?? 8;
    const cuts = [0, Math.max(1, Math.round(W * 0.25)), Math.max(2, Math.round(W * 0.6)), Math.max(3, Math.round(W * 0.8)), W];
    const phaseDefs = p.level === 'pro'
      ? [['Diagnose', 'A baseline, then skip what you know.'], ['Fix gaps', 'Drill only the objectives you miss.'], ['Recall', 'Flashcards on traps and misses.'], ['Simulate', 'Timed exams under exam conditions.']]
      : p.level === 'new'
        ? [['Learn', 'Notes domain by domain, with quick checks.'], ['Practise', 'Drills on each objective as you finish it.'], ['Recall', 'Daily flashcards so it sticks.'], ['Simulate', 'A timed exam once 60% is covered.']]
        : [['Baseline', 'Find where you stand.'], ['Learn + practise', 'Notes for weak domains, drills for the rest.'], ['Recall', 'Daily flashcards.'], ['Simulate', 'Timed exams in the final stretch.']];
    const addReminder = () => {
      saveProfile(examId, { ...p, reminder });
      const blob = new Blob([reminderIcs(exam.shortTitle, examId, p, reminder, window.location.origin)], { type: 'text/calendar' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `${exam.shortTitle}-study-reminder.ics`; a.click();
      URL.revokeObjectURL(a.href);
    };
    const chips: [string, number][] = [
      [p.goal === 'explore' ? 'No deadline' : `Exam ${nice(p.examDate!)}`, 0],
      [{ new: 'New to this', some: 'Some hands-on', pro: 'Experienced' }[p.level], 1],
      [`${p.minsPerDay} min · ${daysPerWeek(p)} days a week`, 2],
      [{ test: 'Test first', learn: 'Learn first', practise: 'Practise first' }[p.start], 3],
    ];
    return (
      <div className="max-w-5xl mx-auto space-y-6 anim-rise">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-lilac">Your {exam.shortTitle} plan</p>
          <h1 className="text-[clamp(1.75rem,5vw,2.4rem)] font-bold leading-tight text-white">
            {deadline ? `${sessions} sessions of ${p.minsPerDay} minutes to exam day` : `A ${p.minsPerDay}-minute habit, ${daysPerWeek(p)} days a week`}
          </h1>
          <p className={`inline-block rounded-xl px-3 py-2 text-sm ${verdictCls}`}>{verdict.text}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {chips.map(([label, s]) => (
            <button key={s} type="button" onClick={() => { setPhase('ask'); go(s); }} aria-label={`Change: ${label}`}
              className="inline-flex items-center gap-2 min-h-10 px-3 rounded-full border border-slate-500/30 bg-slate-800/80 text-sm text-slate-100 hover:border-brand-lilac/60">
              {label} <span className="text-xs text-brand-lilac">Edit</span>
            </button>
          ))}
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-3">
          <h2 className="text-base font-bold text-white">Your next two weeks</h2>
          <ol className="grid grid-cols-7 gap-1.5">
            {cal.map((c) => (
              <li key={c.i} className={`anim-rise min-h-16 rounded-lg p-1.5 flex flex-col gap-1 border ${
                c.i === 0 ? 'bg-brand-indigo/35 border-brand-lilac' : c.study ? 'bg-slate-800/90 border-slate-600/30' : 'border-slate-700/20'
              }`} style={{ animationDelay: `${c.i * 30}ms` }}>
                <span className="text-[10px] text-slate-400">{c.dow} {c.date}</span>
                <span className={`text-[11px] font-semibold leading-tight ${c.isExam ? 'text-amber-300' : c.study ? 'text-slate-100' : 'text-slate-500'}`}>{c.i === 0 && c.study ? `Today: ${c.what}` : c.what}</span>
              </li>
            ))}
          </ol>
        </div>

        <ol className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3" aria-label="Your route">
          {phaseDefs.map(([t, desc], i) => (
            <li key={t} className={`anim-rise rounded-2xl p-4 border ${i === 0 ? 'bg-brand-indigo/20 border-brand-lilac/50' : 'bg-slate-800/60 border-slate-600/20'}`} style={{ animationDelay: `${i * 110}ms` }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-lilac">Week {cuts[i] + 1}{cuts[i + 1] > cuts[i] + 1 ? `–${cuts[i + 1]}` : ''}</p>
              <p className="text-base font-semibold text-white">{t}</p>
              <p className="text-sm text-slate-400">{desc}</p>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 border border-brand-lilac/45 bg-gradient-to-br from-brand-indigo/35 to-slate-800/75">
          <div className="min-w-0 flex-[1_1_300px]">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c9c0ff]">Today · {p.minsPerDay} min</p>
            <p className="text-xl font-bold text-white">{{ test: 'Start with a 10-question baseline', learn: 'Start with the D1 notes', practise: 'Start with a drill' }[p.start]}</p>
            <p className="text-sm text-slate-300">Your plan re-orders itself around how it goes.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/skillup/${examId}/session?mins=${p.minsPerDay}`} className="anim-glow inline-flex items-center gap-2 min-h-12 px-6 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white font-semibold">
              Start now <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link to={`/skillup/${examId}`} className="inline-flex items-center min-h-12 px-4 rounded-xl border border-slate-500/40 text-slate-200 hover:text-white text-sm font-semibold">Later</Link>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <BellRing size={18} className="text-brand-lilac" aria-hidden="true" />
          <label htmlFor="rem" className="text-sm text-slate-200">Remind me on study days at</label>
          <input id="rem" type="time" value={reminder} onChange={(e) => setReminder(e.target.value)}
            className="min-h-10 rounded-lg bg-slate-900 border border-slate-600/50 px-2 text-sm text-white" />
          <button type="button" onClick={addReminder} className="min-h-10 px-3 rounded-lg border border-brand-lilac/40 text-sm font-semibold text-brand-tint hover:bg-brand-indigo/20">
            Add to my calendar
          </button>
          <span className="text-xs text-slate-400">Downloads a repeating event for your calendar app.</span>
        </div>
      </div>
    );
  }

  // ── Questions ──
  const recStart: StartMode | null = d.level === 'new' ? 'learn' : d.level ? 'test' : null;
  const titles = ['What brings you here?', 'How much do you know already?', 'How much time can you give it?', 'How do you want to start?'];
  const subs = [
    `This sets the pace for ${exam.shortTitle}.`,
    'Watch the forecast move. It only changes where you start.',
    'Drag the slider and see what it does to exam day.',
    'Your first session. Everything after adapts to how it goes.',
  ];

  return (
    <div className="max-w-6xl mx-auto flex flex-wrap gap-6 items-start">
      <section className="flex-[999_1_480px] min-w-0 space-y-5" aria-labelledby="q-h">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-lilac">{exam.shortTitle} · Set up your prep · {step + 1} of 4</p>
          <button type="button" onClick={() => { skipSetup(examId); navigate(`/skillup/${examId}`); }} className="min-h-10 text-sm text-slate-400 hover:text-white">
            Skip, I'll look around
          </button>
        </div>
        <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden" aria-hidden="true">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-indigo to-brand-lilac transition-[width] duration-500" style={{ width: `${((step + 0.5) / 4) * 100}%` }} />
        </div>

        <div key={step} className="anim-rise space-y-5">
          <div>
            <h1 id="q-h" className="text-[clamp(1.75rem,5vw,2.4rem)] font-bold leading-tight text-white">{titles[step]}</h1>
            <p className="text-slate-300">{subs[step]}</p>
          </div>

          {step === 0 && (
            <>
              <div role="group" aria-label={titles[0]} className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
                <Choice on={d.goal === 'booked'} title="I have booked the exam" desc="We work back from your exam date." onPick={() => set('goal', 'booked')} />
                <Choice on={d.goal === 'aiming'} title="I'm aiming for a date" desc="A target keeps you moving. You can move it." onPick={() => set('goal', 'aiming')} />
                <Choice on={d.goal === 'explore'} title="Just exploring" desc="No deadline. Learn at your own pace." onPick={() => { set('goal', 'explore'); later(() => go(1), 350); }} />
              </div>
              {deadline && (
                <div className="anim-rise glass-card rounded-2xl p-4 space-y-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <label htmlFor="weeks" className="font-semibold text-white">When is it?</label>
                    <span className="text-xl font-bold text-brand-tint">{nice(d.examDate)} · {weeks} week{weeks === 1 ? '' : 's'}</span>
                  </div>
                  <input id="weeks" type="range" min={1} max={16} value={weeks ?? 4} aria-valuetext={nice(d.examDate)}
                    onChange={(e) => set('examDate', iso(new Date(now + Number(e.target.value) * 7 * DAY)))}
                    className="w-full accent-[#A99BFF] h-7 cursor-pointer" />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-sm text-slate-300 flex items-center gap-2">Exact date
                      <input type="date" value={d.examDate} min={iso(new Date(now + DAY))} onChange={(e) => e.target.value && set('examDate', e.target.value)}
                        className="min-h-10 rounded-lg bg-slate-900 border border-slate-600/50 px-2 text-sm text-white" />
                    </label>
                    <button type="button" onClick={() => go(1)} className="min-h-11 px-5 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold">That's my date →</button>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <div role="group" aria-label={titles[1]} className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
              {([['new', 'New to this', 'Little or no hands-on with these topics.'], ['some', 'Some hands-on', 'I use the tools, but not the exam topics in depth.'], ['pro', 'Experienced', 'I work with this daily and want to find gaps fast.']] as const).map(([id, t, desc]) => (
                <Choice key={id} on={d.level === id} title={t} desc={desc} onPick={() => { set('level', id); later(() => go(2), 380); }} />
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <label htmlFor="mins" className="font-semibold text-white">Minutes a day</label>
                <span className="text-3xl font-bold text-brand-tint">{d.minsPerDay} min</span>
              </div>
              <input id="mins" type="range" min={10} max={90} step={5} value={d.minsPerDay} aria-valuetext={`${d.minsPerDay} minutes a day`}
                onChange={(e) => set('minsPerDay', Number(e.target.value))} className="w-full accent-[#A99BFF] h-7 cursor-pointer" />
              <p className="text-sm text-slate-300">
                {d.minsPerDay <= 15 ? 'A few flashcards and one short drill each day.' : d.minsPerDay <= 30 ? 'One notes section with its check, then a drill.' : d.minsPerDay <= 50 ? 'Two notes sections plus targeted practice.' : 'Deep sessions, with a mini mock at the end.'}
              </p>
              <div className="space-y-2">
                <p className="font-semibold text-white">Which days?</p>
                <div role="group" aria-label="Study days" className="flex flex-wrap gap-2">
                  {DOW.map((name, i) => (
                    <button key={name} type="button" aria-pressed={d.days[i]} aria-label={`${name}${d.days[i] ? ', study day' : ', rest day'}`}
                      onClick={() => { const days = d.days.map((x, j) => (j === i ? !x : x)); if (days.some(Boolean)) set('days', days); }}
                      className={`w-12 h-12 rounded-xl border-[1.5px] font-bold transition-colors ${d.days[i] ? 'border-brand-lilac bg-brand-indigo/40 text-white' : 'border-slate-600/40 text-slate-500'}`}>
                      {name.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" onClick={() => go(3)} className="min-h-11 px-5 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white text-sm font-semibold">Looks right →</button>
            </div>
          )}

          {step === 3 && (
            <div role="group" aria-label={titles[3]} className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-3">
              {([['test', 'Test first', '10 questions across every domain. Skips what you already know.'], ['learn', 'Learn first', 'The D1 notes, with a quick check after each section.'], ['practise', 'Practise straight away', 'Questions on the biggest domain; learn from the explanations.']] as const).map(([id, t, desc]) => (
                <Choice key={id} on={d.start === id} title={t} desc={desc}
                  badge={id === recStart ? (d.level === 'new' ? 'Recommended: new to this' : 'Recommended: find your gaps') : undefined}
                  onPick={() => { set('start', id); later(() => finish(id), 320); }} />
              ))}
            </div>
          )}
        </div>

        {step > 0 && (
          <button type="button" onClick={() => go(step - 1)} className="inline-flex items-center gap-1.5 min-h-11 px-4 rounded-xl border border-slate-500/40 text-sm font-semibold text-slate-300 hover:text-white">
            <ArrowLeft size={15} aria-hidden="true" /> Back
          </button>
        )}
      </section>

      {/* ── Live plan: changes with every answer ── */}
      <aside aria-live="polite" aria-label="Your plan so far" className="flex-[1_1_320px] min-w-0 lg:sticky lg:top-4 rounded-2xl p-5 space-y-4 border border-brand-lilac/35 bg-gradient-to-b from-brand-indigo/20 to-[#16233a]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c9c0ff]">Your plan is taking shape</p>
        <dl className="grid grid-cols-2 gap-2.5">
          {facts.map(([label, value, k]) => (
            <div key={label} className={`rounded-xl p-2.5 bg-[#0e1a2d]/60 border transition-colors ${flash === k ? 'anim-glow border-brand-lilac' : 'border-slate-600/20'}`}>
              <dt className="text-xs text-slate-400">{label}</dt>
              <dd className={`text-base font-bold ${value ? 'text-white' : 'text-slate-600'}`}>{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-white">Readiness forecast</p>
            <p className="text-xs text-slate-400">{readiness > 0 ? `you're at ${readiness}% now` : 'a guide, not a score'}</p>
          </div>
          <ForecastChart f={f} endLabel={deadline ? nice(d.examDate) : '8 weeks'} muted={!d.level} />
          <p className={`rounded-xl px-3 py-2 text-sm leading-snug ${verdictCls}`}>{verdict.text}</p>
        </div>
      </aside>
    </div>
  );
}
