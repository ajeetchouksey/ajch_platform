import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Clock, Target, BookOpen, ArrowRight } from 'lucide-react';
import { loadExamRegistry } from '../lib/content-loader';
import type { ExamConfig } from '../types/content';

// Pre-defined Tailwind classes per scheme — required for purge safety
const CATALOG_SCHEME: Record<string, { border: string; badge: string; glow: string; btn: string }> = {
  violet: {
    border: 'border-violet-600/50 hover:border-violet-400',
    badge: 'bg-violet-900/40 text-violet-300',
    glow: 'hover:shadow-lg hover:shadow-violet-500/5',
    btn: 'bg-violet-700 hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-500/20',
  },
  blue: {
    border: 'border-blue-600/50 hover:border-blue-400',
    badge: 'bg-blue-900/40 text-blue-300',
    glow: 'hover:shadow-lg hover:shadow-blue-500/5',
    btn: 'bg-blue-700 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20',
  },
};

const defaultScheme = { border: 'border-slate-700', badge: 'bg-slate-800 text-slate-300', glow: '', btn: 'bg-slate-700 hover:bg-slate-600' };

export default function ExamCatalog() {
  const [exams, setExams] = useState<ExamConfig[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadExamRegistry().then((r) => setExams(r.exams)).catch(() => {});
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className="space-y-8">
      <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <p className="page-eyebrow">Learning</p>
        <h1 className="text-3xl font-bold tracking-tight">Learning <span className="heading-gradient">Hub</span></h1>
        <p className="text-slate-400 mt-2">Practice for AI certification exams with real-world scenarios.</p>
        {exams.length > 0 && (
          <div className="flex flex-wrap gap-5 mt-4 text-sm">
            <span className="text-slate-500">
              <span className="text-white font-semibold">{exams.filter((e) => e.available).length}</span> exams live
            </span>
            <span className="text-slate-500">
              <span className="text-white font-semibold">{exams.reduce((a, e) => a + e.questions, 0)}</span> practice questions
            </span>
            <span className="text-slate-500">
              <span className="text-white font-semibold">{exams.reduce((a, e) => a + e.domains.length, 0)}</span> domains covered
            </span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {exams.map((exam: ExamConfig, idx: number) => {
          const scheme = CATALOG_SCHEME[exam.colorScheme] ?? defaultScheme;
          return (
            <div
              key={exam.id}
              className={`glass-card glass-sheen glass-edge rounded-xl p-6 transition-all duration-500 group ${scheme.border} ${scheme.glow} card-accent-top ${
                !exam.available ? 'opacity-60' : 'hover:-translate-y-0.5'
              } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${200 + idx * 150}ms`, '--accent-color': exam.accentColor } as React.CSSProperties}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${scheme.badge} transition-transform duration-300 group-hover:scale-105`}>
                    {exam.shortTitle}
                  </span>
                  <h2 className="text-xl font-semibold text-white transition-colors duration-300">{exam.title}</h2>
                  <p className="text-sm text-slate-400 mt-2">{exam.description}</p>
                  <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><BookOpen size={12} />{exam.questions} questions</span>
                    <span className="flex items-center gap-1"><Target size={12} />{exam.domains.length} domains</span>
                    <span className="flex items-center gap-1"><Clock size={12} />{exam.duration}</span>
                    <span>Pass: {exam.passScore}</span>
                  </div>
                </div>
                <div className="sm:self-center">
                  {exam.available ? (
                    <Link
                      to={`/exams/${exam.id}`}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm font-medium rounded-lg transition-all duration-300 group/btn ${scheme.btn}`}
                    >
                      <GraduationCap size={16} />
                      Start Practicing
                      <ArrowRight size={14} className="transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>
                  ) : (
                    <span className="inline-block px-4 py-2.5 bg-slate-800 text-slate-500 text-sm rounded-lg">
                      Coming Soon
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}