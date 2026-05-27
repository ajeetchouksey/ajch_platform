import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Brain, BookOpen, Layers, BarChart2, ExternalLink, ArrowRight } from 'lucide-react';
import { DOMAIN_META } from '../types/content';

const cards = [
  {
    to: '/exams/ccaf/quiz',
    icon: Brain,
    title: 'Practice Quiz',
    desc: '60-question mock exams or domain-focused drills \u2014 same scenario-based MCQ format as the real exam.',
    cta: 'Start Quiz',
    iconBg: 'bg-violet-950/50',
    iconColor: 'text-violet-400',
    accentColor: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
  },
  {
    to: '/exams/ccaf/notes',
    icon: BookOpen,
    title: 'Study Notes',
    desc: 'Structured reference notes for all 5 exam domains. Key rules, mental models, and distractor traps.',
    cta: 'Open Notes',
    iconBg: 'bg-blue-950/50',
    iconColor: 'text-blue-400',
    accentColor: 'linear-gradient(90deg, #1d4ed8, #60a5fa)',
  },
  {
    to: '/exams/ccaf/scenarios',
    icon: Layers,
    title: 'Scenario Practice',
    desc: 'Walk through exam scenarios: architecture patterns, decision points, and key anti-patterns.',
    cta: 'Browse Scenarios',
    iconBg: 'bg-emerald-950/50',
    iconColor: 'text-emerald-400',
    accentColor: 'linear-gradient(90deg, #065f46, #34d399)',
  },
  {
    to: '/exams/ccaf/progress',
    icon: BarChart2,
    title: 'Progress',
    desc: 'Track your scores by domain, spot weak areas, and see improvement over time.',
    cta: 'View Progress',
    iconBg: 'bg-amber-950/50',
    iconColor: 'text-amber-400',
    accentColor: 'linear-gradient(90deg, #92400e, #fbbf24)',
  },
];

const resources = [
  { label: 'Anthropic Academy', url: 'https://anthropic.skilljar.com/' },
  { label: 'Anthropic API Docs', url: 'https://platform.claude.com/docs/' },
  { label: 'Anthropic Courses (GitHub)', url: 'https://github.com/anthropics/courses' },
  { label: 'Anthropic Cookbook', url: 'https://github.com/anthropics/anthropic-cookbook' },
  { label: 'MCP Specification', url: 'https://modelcontextprotocol.io/' },
];

function AnimatedBar({ width, color, delay }: { width: number; color: string; delay: number }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(timer);
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

export default function CcafHome() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="inline-block bg-gradient-to-r from-violet-600/30 to-fuchsia-600/20 text-violet-200 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest mb-3 animate-pulse border border-violet-500/30">
          CCA-F
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Claude Certified Architect – <span className="heading-gradient">Foundations</span></h1>
        <p className="text-slate-400 mt-2">
          60 scenario-based MCQs · 120 min · 72% pass threshold · 5 domains
        </p>
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(({ to, icon: Icon, title, desc, cta, iconBg, iconColor, accentColor }, idx) => (
          <Link
            key={to}
            to={to}
            className={`glass-card glass-sheen card-accent-top rounded-xl p-5 hover:border-violet-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
            style={{ '--accent-color': accentColor, transitionDelay: `${200 + idx * 100}ms` } as React.CSSProperties}
          >
            <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={18} className={iconColor} />
            </div>
            <h2 className="font-semibold text-white mb-1 group-hover:text-violet-200 transition-colors">{title}</h2>
            <p className="text-sm text-slate-400 mb-4">{desc}</p>
            <span className="inline-flex items-center gap-1.5 text-violet-400 text-sm font-medium group-hover:gap-2.5 transition-all duration-300">
              {cta}
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>

      {/* Domain weights */}
      <div className={`glass-card glass-edge card-accent-top rounded-xl p-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ '--accent-color': 'linear-gradient(90deg, #7c3aed, #a78bfa)', transitionDelay: '600ms' } as React.CSSProperties}>
        <h2 className="font-semibold text-white mb-4">Exam Domain Weights</h2>
        <div className="space-y-3">
          {Object.entries(DOMAIN_META).map(([d, meta], idx) => (
            <div key={d} className="group cursor-default">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-300 group-hover:text-white transition-colors">D{d}: {meta.title}</span>
                <span className="text-slate-400 font-mono group-hover:text-white transition-colors">{meta.weight}%</span>
              </div>
              <AnimatedBar width={meta.weight} color={meta.color} delay={700 + idx * 150} />
            </div>
          ))}
        </div>
      </div>

      {/* Official resources */}
      <div className={`glass-card glass-edge rounded-xl p-5 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: '800ms' }}>
        <h2 className="font-semibold text-white mb-3">Official Resources</h2>
        <ul className="space-y-2">
          {resources.map(({ label, url }) => (
            <li key={url}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 hover:translate-x-1 transition-all duration-200"
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