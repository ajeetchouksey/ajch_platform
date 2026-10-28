// ── Return visits: "What fits today?" ─────────────────────────────────────────
// Pick the time you have; today's session is rebuilt from your real state, the
// reasons say why, and the four modes reorder to fit.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, ChevronDown, Flame, Layers, Play, Settings2, Timer, Sparkles } from 'lucide-react';
import type { ExamConfig } from '@/types/content';
import type { ExamMastery } from '@/lib/objective-mastery';
import { getAttempts } from '@/lib/adaptive-quiz';
import { dueCount } from '@/lib/flashcards';
import { getResumeState, getStreak, resumeLabel } from '@/lib/study-tracker';
import { daysPerWeek, daysToExam, getProfile, saveProfile, type PrepProfile } from '@/lib/prep-profile';
import { buildToday, recentMisses } from '@/lib/today-session';

const NOW_OPTS = [5, 15, 30, 45] as const;

function Ring({ pct }: { pct: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => { const id = requestAnimationFrame(() => setShown(pct)); return () => cancelAnimationFrame(id); }, [pct]);
  const C = 2 * Math.PI * 25;
  return (
    <svg width="64" height="64" viewBox="0 0 60 60" role="img" aria-label={`${pct}% ready`} className="shrink-0">
      <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="7" />
      <circle cx="30" cy="30" r="25" fill="none" stroke="var(--color-brand-lilac)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - shown / 100)} transform="rotate(-90 30 30)"
        style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)' }} />
      <text x="30" y="35" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">{pct}%</text>
    </svg>
  );
}

export function TodayHub({ exam, mastery, readiness }: { exam: ExamConfig; mastery: ExamMastery | null; readiness: number }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PrepProfile | null>(() => getProfile(exam.id));
  const [now] = useState(() => Date.now());
  const [mins, setMins] = useState<number>(() => {
    const m = profile?.minsPerDay ?? 30;
    return NOW_OPTS.reduce((best, o) => (Math.abs(o - m) < Math.abs(best - m) ? o : best), 30);
  });
  const [whyOpen, setWhyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const attempts = useMemo(() => getAttempts(exam.id), [exam.id]);
  const due = useMemo(() => dueCount(exam.id), [exam.id]);
  const plan = useMemo(
    () => buildToday({ exam, profile, mastery, attempts, dueCards: due, readiness, minutes: mins, now }),
    [exam, profile, mastery, attempts, due, readiness, mins, now],
  );
  const streak = getStreak(exam.id);
  const left = profile ? daysToExam(profile, now) : null;
  const misses = recentMisses(attempts, now).length;
  const resume = getResumeState(exam.id);
  const base = `/skillup/${exam.id}`;
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const addTime = () => {
    if (!profile) return;
    const p = { ...profile, minsPerDay: profile.minsPerDay + 10 };
    saveProfile(exam.id, p); setProfile(p);
    setToast(`Done: ${p.minsPerDay} min a day from now on. Your forecast has been updated.`);
  };

  // The four modes, with what each one means right now, best fit first.
  const coverage = Math.round((mastery?.coverage ?? 0) * 100);
  const weakest = mastery?.weakest;
  const modes = [
    { id: 'learn', need: 10, icon: BookOpen, kicker: 'Learn', title: 'Continue notes',
      detail: resume ? `Resume D${resume.domainId}${resumeLabel(resume) ? ` · ${resumeLabel(resume)}` : ''}` : `${exam.domains.length} domains, with quick checks`,
      to: resume ? `${base}/notes?d=${resume.domainId}` : `${base}/notes` },
    { id: 'practise', need: 10, icon: Brain, kicker: 'Practise', title: weakest ? `Drill objective ${weakest.task.id}` : 'Drill a domain',
      detail: weakest ? `${weakest.task.title} · ${Math.round(weakest.mastery * 100)}% mastery` : 'Questions with full explanations',
      to: weakest ? `${base}/quiz?task=${encodeURIComponent(weakest.task.id)}` : `${base}/quiz` },
    { id: 'review', need: 5, icon: Layers, kicker: 'Review', title: 'Flashcards and misses',
      detail: due || misses ? `${due} card${due === 1 ? '' : 's'} due · ${misses} recent miss${misses === 1 ? '' : 'es'}` : 'Nothing due. Learn new cards.',
      to: `${base}/flashcards` },
    { id: 'mock', need: 45, icon: Timer, kicker: 'Mock exam', title: `Timed exam · ${exam.duration}`,
      detail: coverage >= 60 ? 'Exam conditions, answers at the end.' : `Best after 60% coverage (you're at ${coverage}%). You can still take it.`,
      to: `${base}/quiz?mode=timed` },
  ].map((m) => {
    const best = (mins <= 5 && m.id === 'review') || (mins >= 45 && m.id === 'mock' && coverage >= 40) || (mins > 5 && mins < 45 && m.id === 'practise') || (mins >= 45 && coverage < 40 && m.id === 'learn');
    return { ...m, best, fits: mins >= m.need };
  }).sort((a, b) => Number(b.best) - Number(a.best) || Number(b.fits) - Number(a.fits));

  return (
    <section aria-labelledby="hub-h" className="space-y-5">
      {/* ── Greeting + status ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0 flex-[1_1_340px] space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-lilac">
            {exam.shortTitle} · {left !== null ? (left === 0 ? 'exam day' : `${left} day${left === 1 ? '' : 's'} to exam`) : 'your own pace'}
          </p>
          <h2 id="hub-h" className="text-[clamp(1.6rem,4.5vw,2.25rem)] font-bold leading-tight text-white">{greeting}. What fits today?</h2>
        </div>
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3 bg-slate-800/70 border border-slate-600/20">
          <Ring pct={readiness} />
          <div className="text-sm">
            <p className="font-semibold text-white">
              {plan.pace === 'ahead' ? 'Ahead of plan' : plan.pace === 'behind' ? 'Behind plan' : plan.pace === 'on' ? 'On track' : readiness > 0 ? 'Your readiness' : 'Not started yet'}
            </p>
            <p className="text-slate-400">Need {exam.passThreshold}% · coverage {coverage}%</p>
            <p className="text-slate-400 inline-flex items-center gap-1">
              {streak > 0 ? <><Flame size={13} className="text-amber-300" aria-hidden="true" /> {streak}-day streak</> : 'Start a streak today'}
            </p>
          </div>
        </div>
      </div>

      {!profile && (
        <Link to={`${base}/start`} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 border border-brand-lilac/35 bg-brand-indigo/15 hover:border-brand-lilac/60">
          <span className="text-sm text-slate-200"><Sparkles size={15} className="inline mr-1.5 text-brand-lilac" aria-hidden="true" />Tell us your exam date and time a day, and we'll pace every session for you.</span>
          <span className="text-sm font-semibold text-brand-lilac">Set up my plan · 1 min →</span>
        </Link>
      )}

      {/* ── Time available now ── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold text-white">How much time do you have right now?</span>
        <div role="group" aria-label="Time available now" className="flex flex-wrap gap-2">
          {NOW_OPTS.map((m) => (
            <button key={m} type="button" aria-pressed={mins === m} onClick={() => setMins(m)}
              className={`min-h-11 px-4 rounded-xl border-[1.5px] text-sm font-semibold transition-colors ${mins === m ? 'border-brand-lilac bg-brand-indigo/40 text-white' : 'border-slate-600/40 text-slate-300 hover:text-white'}`}>
              {m === 45 ? '45 min+' : `${m} min`}
            </button>
          ))}
        </div>
      </div>

      {/* ── Today's session ── */}
      <div className="rounded-2xl p-5 space-y-4 border border-brand-lilac/45 bg-gradient-to-br from-brand-indigo/30 to-slate-800/80">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-xl font-bold text-white">Your {mins === 45 ? '45-minute+' : `${mins}-minute`} session</h3>
          <span className="text-xs text-[#c9c0ff]">{plan.restDay ? 'Rest day: kept light' : 'Rebuilt from your latest answers'}</span>
        </div>
        <ol key={mins} className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-2.5">
          {plan.steps.map((s, k) => (
            <li key={`${s.kind}-${k}`} className="anim-rise flex gap-3 items-start rounded-xl p-3 bg-[#0e1a2d]/55 border border-slate-600/20" style={{ animationDelay: `${k * 70}ms` }}>
              <span className="w-6 h-6 shrink-0 rounded-full bg-brand-lilac/30 text-white text-xs font-bold flex items-center justify-center" aria-hidden="true">{k + 1}</span>
              <span className="min-w-0">
                <span className="block text-[15px] font-semibold text-white leading-snug">{s.title}</span>
                <span className="block text-xs text-slate-400">{s.meta}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => navigate(`${base}/session?mins=${mins}`)}
            className="anim-glow inline-flex items-center gap-2 min-h-12 px-6 rounded-xl bg-brand-indigo hover:bg-brand-indigo-deep text-white font-semibold">
            <Play size={16} aria-hidden="true" /> Start session
          </button>
          {plan.reasons.length > 0 && (
            <button type="button" aria-expanded={whyOpen} onClick={() => setWhyOpen((o) => !o)} className="inline-flex items-center gap-1 min-h-11 px-2 text-sm text-slate-300 hover:text-white">
              Why this today? <ChevronDown size={14} className={`transition-transform ${whyOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
        </div>
        {whyOpen && (
          <ul className="anim-rise space-y-1.5 text-sm text-slate-200 list-disc pl-5">
            {plan.reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
        )}
        {plan.pace === 'behind' && profile && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2 bg-amber-400/10 border border-amber-300/30 text-sm text-amber-100">
            <span>Behind the line you set. Ten more minutes a day closes most gaps.</span>
            <button type="button" onClick={addTime} className="min-h-10 px-3 rounded-lg bg-amber-300/20 font-semibold hover:bg-amber-300/30">Add 10 min a day</button>
          </div>
        )}
        {toast && <p role="status" className="anim-rise text-sm text-emerald-200">{toast}</p>}
      </div>

      {/* ── Free choice ── */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-white">Or pick what you feel like</h3>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          {modes.map((m) => (
            <Link key={m.id} to={m.to}
              className={`group flex flex-col gap-1.5 min-h-40 p-4 rounded-2xl border-[1.5px] transition-all hover:-translate-y-0.5 ${
                m.best ? 'border-brand-lilac bg-brand-indigo/20' : 'border-slate-600/25 bg-slate-800/60 hover:border-brand-lilac/50'
              } ${m.fits ? '' : 'opacity-70'}`}>
              <span className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-lilac"><m.icon size={14} aria-hidden="true" />{m.kicker}</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${m.best ? 'bg-emerald-400/15 text-emerald-300' : m.fits ? 'bg-brand-lilac/15 text-[#d4ccff]' : 'bg-slate-500/15 text-slate-400'}`}>
                  {m.best ? 'Best fit now' : m.fits ? `Fits ${mins} min` : `Needs ${m.need} min`}
                </span>
              </span>
              <span className="text-lg font-bold text-white">{m.title}</span>
              <span className="text-sm text-slate-400 leading-snug">{m.detail}</span>
              <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-brand-lilac group-hover:text-white">Go <ArrowRight size={14} aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </div>

      {profile && (
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-400">
          <Settings2 size={14} aria-hidden="true" />
          Your setup: {profile.goal === 'explore' ? 'no deadline' : `exam ${new Date(`${profile.examDate}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`} · {profile.minsPerDay} min · {daysPerWeek(profile)} days a week{profile.reminder ? ` · reminder ${profile.reminder}` : ''}
          <Link to={`${base}/start`} className="min-h-10 inline-flex items-center px-1 font-semibold text-brand-lilac hover:text-white">See plan or change</Link>
        </p>
      )}
    </section>
  );
}
