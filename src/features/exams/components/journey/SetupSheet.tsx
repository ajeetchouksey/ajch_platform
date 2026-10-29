// ── First visit: two questions in a popup, then straight into the first session ─
// Rendered through a portal: Layout's fade-in wrapper keeps a transform, which
// would anchor a plain `fixed` overlay to the page instead of the viewport.
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, BookOpen, X } from 'lucide-react';
import { DEFAULT_DAYS, PASS_LINE, daysPerWeek, forecast, saveProfile, type Goal, type PrepProfile, type StartMode } from '@/lib/prep-profile';
import type { ExamConfig } from '@/types/content';

const DAY = 86_400_000;
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MINUTES = [15, 30, 45, 60];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const nice = (s: string) => new Date(`${s}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

const GOALS: [Goal, string][] = [['booked', 'Booked'], ['aiming', 'Target date'], ['explore', 'No date yet']];

export function SetupSheet({ exam, readiness, onDone, onSkip }: {
  exam: ExamConfig;
  readiness: number;
  onDone: (p: PrepProfile) => void;
  onSkip: () => void;
}) {
  const [now] = useState(() => Date.now());
  const [goal, setGoal] = useState<Goal>('aiming');
  const [examDate, setExamDate] = useState(() => iso(new Date(now + 28 * DAY)));
  const [mins, setMins] = useState(30);
  const [days, setDays] = useState(DEFAULT_DAYS);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onSkip(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onSkip]);

  const deadline = goal !== 'explore';
  const weeks = deadline ? Math.max(1, Math.round((new Date(`${examDate}T00:00:00`).getTime() - now) / (7 * DAY))) : null;
  const f = useMemo(
    () => forecast({ goal, examDate: deadline ? examDate : undefined, level: 'new', minsPerDay: mins, days }, readiness, now),
    [goal, deadline, examDate, mins, days, readiness, now],
  );
  const onTrack = !deadline || f.end >= PASS_LINE;
  const minuteChoices = MINUTES.includes(mins) ? MINUTES : [...MINUTES, mins].sort((a, b) => a - b);

  const finish = (start: StartMode) => {
    const p: PrepProfile = {
      goal, examDate: deadline ? examDate : undefined, level: start === 'learn' ? 'new' : 'some',
      minsPerDay: mins, days, start, createdAt: now,
    };
    saveProfile(exam.id, p);
    onDone(p);
  };

  const pill = (on: boolean) =>
    `min-h-11 px-4 rounded-xl border-[1.5px] text-sm font-semibold transition-colors ${on ? 'border-brand-lilac bg-brand-indigo/35 text-white' : 'border-slate-600/40 text-slate-300 hover:border-brand-lilac/60'}`;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" onClick={onSkip} aria-hidden="true" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-h"
        className="anim-rise relative w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-brand-lilac/30 bg-slate-900 shadow-2xl outline-none"
      >
        <div className="p-5 sm:p-7 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-lilac">{exam.shortTitle} · Set up in 30 seconds</p>
              <h2 id="setup-h" className="text-2xl font-bold text-white leading-tight">Let's fit {exam.shortTitle} around your week</h2>
            </div>
            <button type="button" onClick={onSkip} aria-label="Skip setup" className="shrink-0 w-11 h-11 -mr-2 -mt-1 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-white mb-2">When is your exam?</legend>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(([id, label]) => (
                <button key={id} type="button" aria-pressed={goal === id} onClick={() => setGoal(id)} className={pill(goal === id)}>{label}</button>
              ))}
            </div>
            {deadline && (
              <label className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                Date
                <input
                  type="date"
                  value={examDate}
                  min={iso(new Date(now + DAY))}
                  onChange={(e) => e.target.value && setExamDate(e.target.value)}
                  className="min-h-11 rounded-xl bg-slate-950 border border-slate-600/50 px-3 text-sm text-white"
                />
                <span className="text-slate-400">{nice(examDate)} · {weeks} week{weeks === 1 ? '' : 's'} away</span>
              </label>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-white mb-2">How much time can you give it?</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Minutes a day">
              {minuteChoices.map((m) => (
                <button key={m} type="button" aria-pressed={mins === m} onClick={() => setMins(m)} className={pill(mins === m)}>{m} min</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Study days">
              {DOW.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={days[i]}
                  aria-label={`${name}${days[i] ? ', study day' : ', rest day'}`}
                  onClick={() => { const next = days.map((x, j) => (j === i ? !x : x)); if (next.some(Boolean)) setDays(next); }}
                  className={`w-11 h-11 rounded-xl border-[1.5px] text-xs font-bold transition-colors ${days[i] ? 'border-brand-lilac bg-brand-indigo/35 text-white' : 'border-slate-600/40 text-slate-500'}`}
                >
                  {name.slice(0, 2)}
                </button>
              ))}
            </div>
          </fieldset>

          <div aria-live="polite" className={`rounded-2xl px-4 py-3 text-sm space-y-2 ${onTrack ? 'bg-emerald-400/10 text-emerald-100' : 'bg-amber-400/10 text-amber-100'}`}>
            <p>
              {!deadline
                ? `${mins} min, ${daysPerWeek({ days })} days a week. You'll see your readiness grow as you go.`
                : onTrack
                  ? `On track: about ${f.end}% ready by exam day (the pass line is ${PASS_LINE}%).`
                  : `That's about ${f.end}% by exam day, short of the ${PASS_LINE}% pass line.`}
            </p>
            {!onTrack && (
              f.minsNeeded ? (
                <button type="button" onClick={() => setMins(f.minsNeeded!)} className="min-h-10 px-3 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 font-semibold text-amber-50">
                  Use {f.minsNeeded} min a day instead
                </button>
              ) : (
                <p className="text-amber-200/90">Add study days or pick a later date.</p>
              )
            )}
            <p className="text-xs opacity-75">An estimate to plan with, not a score. It updates as you study.</p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => finish('test')}
              className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white font-semibold"
            >
              Find my level: 10 quick questions <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => finish('learn')}
              className="w-full inline-flex items-center justify-center gap-2 min-h-12 px-5 rounded-xl border border-slate-500/40 text-slate-200 hover:text-white hover:border-brand-lilac/60 text-sm font-semibold"
            >
              <BookOpen size={15} aria-hidden="true" /> I'm new to this. Start learning
            </button>
            <p className="text-center text-xs text-slate-400">You can change any of this later from your plan.</p>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
