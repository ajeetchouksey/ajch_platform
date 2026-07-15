import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadScenariosForExam, loadExamRegistry } from '@/lib/content-loader';
import type { Scenario } from '@/types/content';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Scenarios() {
  const { examId = 'ccaf' } = useParams<{ examId: string }>();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [examShortTitle, setExamShortTitle] = useState('Exam');

  useEffect(() => {
    loadExamRegistry().then((r) => {
      const exam = r.exams.find((e) => e.id === examId);
      if (exam) setExamShortTitle(exam.shortTitle);
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
          4 of these {scenarios.length} scenarios are randomly assigned per sitting. Study all of them.
        </p>
      </div>

      {scenarios.map((s) => (
        <div key={s.id} className="glass-card rounded-xl overflow-hidden">
          <button
            onClick={() => setOpen(open === s.id ? null : s.id)}
            className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="min-w-0 flex-1 pr-3">
              <span className="font-semibold text-white block">{s.title}</span>
              {open !== s.id && s.key_patterns.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {s.key_patterns.slice(0, 3).map((p) => (
                    <span
                      key={p}
                      className="text-[11px] bg-slate-800 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded-full"
                    >
                      {p}
                    </span>
                  ))}
                  {s.key_patterns.length > 3 && (
                    <span className="text-[11px] text-slate-600">
                      +{s.key_patterns.length - 3} more
                    </span>
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

              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">
                  Architecture Notes
                </h3>
                <p className="text-sm text-slate-400">{s.architecture_notes}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wide mb-2">
                  Key Patterns
                </h3>
                <div className="flex flex-wrap gap-2">
                  {s.key_patterns.map((p) => (
                    <span
                      key={p}
                      className="text-xs bg-violet-900/40 text-violet-300 border border-violet-800 px-2 py-1 rounded"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
