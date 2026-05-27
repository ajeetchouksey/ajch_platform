import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Clock, Target, BookOpen, ArrowRight } from 'lucide-react';

const exams = [
  {
    id: 'ccaf',
    title: 'Claude Certified Architect \u2013 Foundations',
    shortTitle: 'CCA-F',
    desc: 'Validate your expertise in Claude API architecture, agentic patterns, prompt engineering, tool design, and context management.',
    questions: 68,
    domains: 5,
    duration: '120 min',
    passScore: '72%',
    available: true,
    color: 'border-violet-600/50 hover:border-violet-400',
    badge: 'bg-violet-900/40 text-violet-300',
    glow: 'hover:shadow-lg hover:shadow-violet-500/5',
    accentColor: 'linear-gradient(90deg,#7c3aed,#a78bfa)',
  },
  {
    id: 'future-1',
    title: 'AI Agent Engineering \u2013 Advanced',
    shortTitle: 'AAE-A',
    desc: 'Deep-dive into multi-agent orchestration, evaluation frameworks, production deployment patterns, and observability.',
    questions: 0,
    domains: 0,
    duration: 'TBD',
    passScore: 'TBD',
    available: false,
    color: 'border-slate-700',
    badge: 'bg-slate-800 text-slate-500',
    glow: '',
    accentColor: undefined,
  },
];

export default function ExamCatalog() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className="space-y-8">
      <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-3xl font-bold tracking-tight">Certification <span className="heading-gradient">Exams</span></h1>
        <p className="text-slate-400 mt-2">Practice for AI certification exams with real-world scenarios.</p>
      </div>

      <div className="space-y-4">
        {exams.map((exam, idx) => (
          <div
            key={exam.id}
            className={`glass-card glass-sheen glass-edge rounded-xl p-6 transition-all duration-500 group ${exam.color} ${exam.glow} ${exam.accentColor ? 'card-accent-top' : ''} ${
              !exam.available ? 'opacity-60' : 'hover:-translate-y-0.5'
            } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ transitionDelay: `${200 + idx * 150}ms`, ...(exam.accentColor ? { '--accent-color': exam.accentColor } : {}) } as React.CSSProperties}
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2 ${exam.badge} transition-transform duration-300 group-hover:scale-105`}>
                  {exam.shortTitle}
                </span>
                <h2 className="text-xl font-semibold text-white group-hover:text-violet-200 transition-colors duration-300">{exam.title}</h2>
                <p className="text-sm text-slate-400 mt-2">{exam.desc}</p>
                <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><BookOpen size={12} />{exam.questions} questions</span>
                  <span className="flex items-center gap-1"><Target size={12} />{exam.domains} domains</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{exam.duration}</span>
                  <span>Pass: {exam.passScore}</span>
                </div>
              </div>
              <div className="sm:self-center">
                {exam.available ? (
                  <Link
                    to={`/exams/${exam.id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-700 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/20 group/btn"
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
        ))}
      </div>
    </div>
  );
}