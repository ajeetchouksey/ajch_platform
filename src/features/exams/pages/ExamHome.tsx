import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Brain, BookOpen, Layers, BarChart2, ExternalLink, ArrowRight, GraduationCap } from 'lucide-react';
import { loadExamRegistry } from '@/lib/content-loader';
import type { ExamConfig } from '@/types/content';

function AnimatedBar({ width, color, delay }: { width: number; color: string; delay: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
        style={{ width: animated ? `${width}%` : '0%', boxShadow: animated ? '0 0 8px 0 currentColor' : 'none' }}
      />
    </div>
  );
}

function examCards(examId: string) {
  return [
    {
      to: `/exams/${examId}/quiz`,
      icon: Brain,
      title: 'Practice Quiz',
      desc: 'Mock exams or domain-focused drills — same scenario-based MCQ format as the real exam.',
      cta: 'Start Quiz',
    },
    {
      to: `/exams/${examId}/notes`,
      icon: BookOpen,
      title: 'Study Notes',
      desc: 'Structured reference notes for all exam domains. Key rules, mental models, and exam traps.',
      cta: 'Open Notes',
    },
    {
      to: `/exams/${examId}/scenarios`,
      icon: Layers,
      title: 'Scenario Practice',
      desc: 'Walk through exam scenarios: architecture patterns, decision points, and anti-patterns.',
      cta: 'Browse Scenarios',
    },
    {
      to: `/exams/${examId}/progress`,
      icon: BarChart2,
      title: 'Progress',
      desc: 'Track your scores by domain, spot weak areas, and see improvement over time.',
      cta: 'View Progress',
    },
  ];
}

export default function ExamHome() {
  const { examId } = useParams<{ examId: string }>();
  const [exam, setExam] = useState<ExamConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!examId) return;
    loadExamRegistry()
      .then((r) => setExam(r.exams.find((e) => e.id === examId) ?? null))
      .catch(() => {});
    requestAnimationFrame(() => setMounted(true));
  }, [examId]);

  if (!exam) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="space-y-3">
          <div className="h-5 w-36 bg-slate-800 rounded-full" />
          <div className="h-9 w-3/4 bg-slate-800 rounded-lg" />
          <div className="h-3.5 w-full bg-slate-800/70 rounded" />
          <div className="h-3.5 w-2/3 bg-slate-800/50 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-slate-800" />
              <div className="h-4 w-1/2 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800/70 rounded" />
              <div className="h-3 w-3/4 bg-slate-800/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cards = examCards(examId!);

  const BADGE: Record<string, string> = {
    violet: 'bg-violet-900/50 text-violet-300 border border-violet-700/50',
    blue:   'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  };
  const badgeStyle = BADGE[exam.colorScheme] ?? 'bg-slate-800 text-slate-400 border border-slate-700';

  // Split title at last em-dash or final word for gradient span
  const titleParts = exam.title.split('–');
  const titleMain = titleParts.length > 1 ? titleParts[0].trim() + ' –' : exam.title;
  const titleAccent = titleParts.length > 1 ? titleParts[1].trim() : '';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3 ${badgeStyle}`}>
          <GraduationCap size={12} />
          {exam.shortTitle} Certification Practice
        </span>
        <p className="page-eyebrow">{exam.shortTitle} Exam</p>
        <h1 className="text-3xl font-bold tracking-tight">
          {titleAccent ? (
            <>{titleMain} <span className="heading-gradient">{titleAccent}</span></>
          ) : (
            <span className="heading-gradient">{exam.title}</span>
          )}
        </h1>
        <p className="text-slate-400 mt-2 text-sm leading-relaxed">{exam.description}</p>
        <p className="text-slate-500 text-xs mt-2 flex flex-wrap gap-x-3 gap-y-1">
          <span>{exam.questions} scenario-based MCQs</span>
          <span>·</span>
          <span>{exam.duration}</span>
          <span>·</span>
          <span>{exam.passScore} to pass</span>
          <span>·</span>
          <span>{exam.domains.length} domains</span>
        </p>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ to, icon: Icon, title, desc, cta }, idx) => (
          <Link
            key={to}
            to={to}
            className={`glass-card glass-sheen card-accent-top rounded-xl p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group ${idx === 0 ? 'ring-1 ring-inset ring-violet-600/30' : ''} ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ '--accent-color': exam.accentColor, transitionDelay: `${200 + idx * 100}ms` } as React.CSSProperties}
          >
            {idx === 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-400 uppercase tracking-widest mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                Start here
              </span>
            )}
            <div className="w-9 h-9 rounded-lg bg-slate-800/60 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
              <Icon size={18} className="text-slate-300" />
            </div>
            <h2 className="font-semibold text-white mb-1 group-hover:text-slate-100 transition-colors">{title}</h2>
            <p className="text-sm text-slate-400 mb-4">{desc}</p>
            <span className="inline-flex items-center gap-1.5 text-slate-400 text-sm font-medium group-hover:gap-2.5 transition-all duration-300">
              {cta}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      {/* Domain weights */}
      <div
        className={`glass-card glass-edge card-accent-top rounded-xl p-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        style={{ '--accent-color': exam.accentColor, transitionDelay: '600ms' } as React.CSSProperties}
      >
        <h2 className="section-heading mb-4">Exam Domain Weights</h2>
        <div className="space-y-3">
          {exam.domains.map((domain, idx) => (
            <div key={domain.id} className="group cursor-default">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300 group-hover:text-white transition-colors">D{domain.id}: {domain.title}</span>
                <span className="text-slate-400 font-mono group-hover:text-white transition-colors">{domain.weight}%</span>
              </div>
              <AnimatedBar width={domain.weight} color={domain.color} delay={700 + idx * 150} />
            </div>
          ))}
        </div>
      </div>

      {/* Official resources */}
      <div className={`glass-card glass-edge rounded-xl p-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '800ms' }}>
        <h2 className="section-heading mb-3">Official Resources</h2>
        <ul className="space-y-2">
          {exam.resources.map(({ label, url }) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 hover:translate-x-1 transition-all duration-200"
              >
                <ExternalLink size={13} />
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
