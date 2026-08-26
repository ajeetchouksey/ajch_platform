import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui';
import { exportStudyPlanAsIcal } from '@/lib/study-tracker';
import type { DailyCard, ReadinessBreakdown } from '@/lib/study-tracker';
import type { StudyPlan as StudyPlanType } from '@/lib/plan-generator';
import type { ExamConfig } from '@/types/content';

interface TodaysMissionHeroProps {
  examId: string;
  exam: ExamConfig;
  plan: StudyPlanType | null;
  card: DailyCard | null;
  streak: number;
  readiness: ReadinessBreakdown;
  forecast: { probability: number; weightedAccuracy: number; domainsWithData: number } | null;
}

const ACTION_LABEL: Record<string, string> = {
  'read-notes': '📖 Read Notes',
  'take-quiz': '🎯 Take Quiz',
  'retake-quiz': '🔄 Retake Quiz',
  'all-done': '🏆 All Done',
};

function forecastColor(probability: number): string {
  if (probability >= 0.7) return 'text-emerald-400';
  if (probability >= 0.4) return 'text-amber-400';
  return 'text-rose-400';
}

export function TodaysMissionHero({ exam, plan, card, streak, readiness, forecast }: TodaysMissionHeroProps) {
  const [explainOpen, setExplainOpen] = useState(false);

  return (
    <div className="glass-card glass-edge rounded-xl p-4 relative">
      {/* iCal export — demoted to icon-only, hero corner */}
      {plan && (
        <div className="absolute top-3 right-3">
          <Button
            variant="ghost"
            size="xs"
            icon={CalendarDays}
            onClick={() => exportStudyPlanAsIcal(plan, exam.title)}
            title="Export study plan to Google/Apple Calendar (.ics)"
          />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Today's Focus */}
        {card && (
          <div className="sm:col-span-2 flex items-start gap-3">
            <span className="text-xl mt-0.5">{card.action === 'all-done' ? '🏆' : '📌'}</span>
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-0.5">Today's Focus</p>
              <p className="text-sm font-semibold text-white">D{card.domainId}: {card.domainTitle}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.reason}</p>
              <Link
                to={card.link}
                className="inline-block mt-2 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-bold hover:bg-violet-500 transition-colors"
              >
                {ACTION_LABEL[card.action] ?? 'Go →'}
              </Link>
            </div>
          </div>
        )}

        {/* Streak + Readiness + Forecast */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <div>
                <p className="text-xs font-bold text-amber-400">{streak} day{streak !== 1 ? 's' : ''}</p>
                <p className="text-[10px] text-slate-500">Current streak</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-violet-400">{readiness.overall}%</p>
              <p className="text-[10px] text-slate-500">Readiness</p>
            </div>
          </div>

          {forecast ? (
            <div className="text-right">
              <p className={`text-xs font-bold ${forecastColor(forecast.probability)}`}>
                {Math.round(forecast.probability * 100)}% likely to pass
              </p>
              <p className="text-[10px] text-slate-500">based on quiz accuracy</p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 text-right">Take a quiz to unlock your Success Forecast.</p>
          )}

          {/* Readiness explain toggle */}
          <button
            onClick={() => setExplainOpen((o) => !o)}
            className="w-full flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
            aria-expanded={explainOpen}
          >
            {explainOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            How is readiness calculated?
          </button>

          {explainOpen && (
            <div className="space-y-1 rounded-lg bg-slate-900/60 border border-slate-800/60 p-2.5">
              {readiness.byDomain.map((d) => (
                <p key={d.domainId} className="text-[10px] text-slate-400 leading-relaxed">
                  D{d.domainId}: {d.title} — {d.weight}% of exam · Notes {d.notesRead ? '✓' : '✗'} · Quiz {d.bestScore}% · {d.pointsEarned}/{d.pointsPossible} pts
                </p>
              ))}
              <p className="text-[10px] text-slate-500 italic mt-1">
                Readiness = 30% for notes read + up to 70% for best quiz score, per domain, weighted by exam domain weight.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
