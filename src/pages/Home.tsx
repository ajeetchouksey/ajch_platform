import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Newspaper, Wrench, ArrowRight, Sparkles } from 'lucide-react';
import { StarRepo } from '../components/StarRepo';

const features = [
  {
    to: '/exams',
    icon: GraduationCap,
    title: 'Certification Exams',
    desc: 'Practice for AI certification exams with scenario-based questions, study notes, and progress tracking.',
    cta: 'Browse Exams',
    available: true,
    gradient: 'from-violet-500/10 to-transparent',
    borderColor: 'border-violet-600/50 hover:border-violet-400',
    iconColor: 'text-violet-400',
    glowColor: 'group-hover:shadow-violet-500/10',
  },
  {
    to: '/blog',
    icon: Newspaper,
    title: 'Blog',
    desc: 'Articles on AI architecture, prompt engineering patterns, and lessons from building production AI systems.',
    cta: 'Read Articles',
    available: true,
    gradient: 'from-blue-500/10 to-transparent',
    borderColor: 'border-blue-600/50 hover:border-blue-400',
    iconColor: 'text-blue-400',
    glowColor: 'group-hover:shadow-blue-500/10',
  },
  {
    to: '/tools',
    icon: Wrench,
    title: 'AI Tools',
    desc: 'Utilities for prompt testing, token counting, context window visualization, and MCP server scaffolding.',
    cta: 'Coming Soon',
    available: false,
    gradient: 'from-slate-500/5 to-transparent',
    borderColor: 'border-slate-700 hover:border-slate-600',
    iconColor: 'text-slate-500',
    glowColor: '',
  },
];

const stats = [
  { value: 1, label: 'Exam Available', color: 'text-violet-400' },
  { value: 68, label: 'Practice Questions', color: 'text-blue-400' },
  { value: 5, label: 'Study Domains', color: 'text-emerald-400' },
  { value: 100, label: 'Topic Coverage', color: 'text-amber-400', suffix: '%' },
];

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 30;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [target]);

  return <span>{count}{suffix}</span>;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className={`text-center space-y-4 py-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-700/40 text-xs text-violet-300 mb-4 backdrop-blur-sm shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
          <Sparkles size={12} className="animate-pulse" />
          Personal AI Learning Platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white via-violet-200 to-violet-400 bg-clip-text text-transparent">
          AI Architect Hub
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Your platform for AI certification prep, technical writing, and developer tools.
        </p>
        <div className="flex justify-center mt-4">
          <StarRepo />
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map(({ to, icon: Icon, title, desc, cta, available, gradient, borderColor, iconColor, glowColor }, idx) => (
          <Link
            key={to}
            to={to}
            className={`glass-card glass-sheen glass-edge relative rounded-xl p-6 transition-all duration-300 group ${borderColor} ${glowColor} hover:shadow-xl hover:-translate-y-1 ${
              !available ? 'opacity-70' : ''
            } ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{ transitionDelay: `${300 + idx * 150}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <Icon size={22} className={`${iconColor} transition-all duration-300`} />
              </div>
              <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">{desc}</p>
              <span className={`inline-flex items-center gap-1.5 text-sm font-medium transition-all duration-300 ${
                available ? `${iconColor} group-hover:gap-2.5` : 'text-slate-600'
              }`}>
                {cta}
                {available && <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick stats */}
      <div className={`glass-stats glass-edge rounded-xl p-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '700ms' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {stats.map(({ value, label, color, suffix }) => (
            <div key={label} className="group cursor-default">
              <div className={`text-2xl font-bold ${color} transition-transform duration-300 group-hover:scale-110`}>
                <AnimatedCounter target={value} suffix={suffix || ''} />
              </div>
              <div className="text-xs text-slate-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}