import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Cpu, PenTool, GraduationCap, BookOpen, GitBranch,
  Globe, ChevronRight, MapPin, Building2, ExternalLink,
  Zap, Brain, Shield, Lightbulb, ListChecks, Handshake, Trophy,
  ArrowDown, PackageCheck, Tag, Award, User,
} from 'lucide-react';
import { maintainer } from '../data/maintainer';

/* ──────────────────────────────────────────────────────────────
   Types
────────────────────────────────────────────────────────────── */
interface Delivery {
  version: string;       // e.g. "v2.0"
  label: string;         // short milestone description
  type: 'major' | 'minor' | 'patch';
}

interface Agent {
  id: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  glowColor: string;
  borderColor: string;
  bgGradient: string;
  textColor: string;
  badgeColor: string;
  dotColor: string;
  icon: React.ElementType;
  status: 'active' | 'standby';
  capabilities: string[];
  model: string;
  type: 'orchestrator' | 'specialist';
  tools: number;
  activeTask: string;
  version: string;       // current semver
  deliveries: Delivery[];
}

/* ──────────────────────────────────────────────────────────────
   Agent data
────────────────────────────────────────────────────────────── */
export const agents: Agent[] = [
  {
    id: 'orchestrator',
    name: 'Platform Orchestrator',
    role: 'Commander',
    tagline: 'Analyzes. Delegates. Synthesizes.',
    description: 'The central brain. Receives every request, classifies intent, routes to the right specialist. Never implements — always coordinates.',
    glowColor: 'shadow-violet-500/30',
    borderColor: 'border-violet-500/40 hover:border-violet-400/70',
    bgGradient: 'from-violet-500/10 via-violet-500/5 to-transparent',
    textColor: 'text-violet-400',
    badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    dotColor: 'bg-violet-400',
    icon: Cpu,
    status: 'active',
    capabilities: ['Intent Classification', 'Agent Routing', 'Synthesis', 'Clarification'],
    model: 'Claude Sonnet',
    type: 'orchestrator',
    tools: 12,
    activeTask: 'Routing blog request → Blog Agent',
    version: 'v1.3.0',
    deliveries: [
      { version: 'v1.0', label: 'Core routing engine + agent registry',       type: 'major' },
      { version: 'v1.1', label: 'Multi-domain synthesis pipeline',             type: 'minor' },
      { version: 'v1.3', label: 'Clarification workflow + context carry-over', type: 'minor' },
    ],
  },
  {
    id: 'platform-control',
    name: 'Platform Control',
    role: 'Architect',
    tagline: 'Every pixel. Every route. Every decision.',
    description: 'Owns routing, navigation, layout, design system, and feature modules. If you see it rendered, this agent designed it.',
    glowColor: 'shadow-blue-500/25',
    borderColor: 'border-blue-500/40 hover:border-blue-400/70',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    textColor: 'text-blue-400',
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotColor: 'bg-blue-400',
    icon: GitBranch,
    status: 'active',
    capabilities: ['Routing', 'Component Design', 'Design System', 'Scaffolding'],
    model: 'Claude Sonnet',
    type: 'specialist',
    tools: 10,
    activeTask: 'Building Team page hierarchy...',
    version: 'v2.4.0',
    deliveries: [
      { version: 'v1.0', label: 'App shell, routing, sidebar, layout',        type: 'major' },
      { version: 'v2.0', label: 'Team page + org hierarchy design',           type: 'major' },
      { version: 'v2.4', label: 'Animated flow + semantic versioning cards',  type: 'minor' },
    ],
  },
  {
    id: 'blog',
    name: 'Blog Agent',
    role: 'Storyteller',
    tagline: 'Raw ideas become published articles.',
    description: 'Creates, edits, and publishes technical blog content with the right voice, structure, and SEO metadata.',
    glowColor: 'shadow-emerald-500/25',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400/70',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    textColor: 'text-emerald-400',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    icon: PenTool,
    status: 'active',
    capabilities: ['Content Writing', 'SEO Metadata', 'Frontmatter', 'Publishing'],
    model: 'Claude Sonnet',
    type: 'specialist',
    tools: 10,
    activeTask: 'Drafting post on AI model optimization...',
    version: 'v1.4.0',
    deliveries: [
      { version: 'v1.0', label: 'Post import pipeline + frontmatter system',  type: 'major' },
      { version: 'v1.3', label: 'SEO metadata + category/tag indexing',       type: 'minor' },
      { version: 'v1.4', label: 'Platform-voice rewrite + governance post',   type: 'minor' },
    ],
  },
  {
    id: 'exam-content',
    name: 'Exam Content',
    role: 'Curator',
    tagline: 'Turns documentation into exam-ready knowledge.',
    description: 'Reads Anthropic docs, generates MCQ questions with explanations, expands study notes, deduplicates.',
    glowColor: 'shadow-amber-500/25',
    borderColor: 'border-amber-500/40 hover:border-amber-400/70',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    textColor: 'text-amber-400',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
    icon: GraduationCap,
    status: 'active',
    capabilities: ['Web Research', 'Question Gen', 'Deduplication', 'Notes'],
    model: 'Claude Sonnet',
    type: 'specialist',
    tools: 10,
    activeTask: 'Scanning Anthropic docs for new content...',
    version: 'v1.2.0',
    deliveries: [
      { version: 'v1.0', label: 'CCA-F MCQ question bank (50 questions)',     type: 'major' },
      { version: 'v1.1', label: 'Study notes across all 5 exam domains',      type: 'minor' },
      { version: 'v1.2', label: 'Deduplication engine + web research tools',  type: 'minor' },
    ],
  },
  {
    id: 'study-companion',
    name: 'Study Companion',
    role: 'Teacher',
    tagline: '101 → 201 → 301. Meet you where you are.',
    description: 'Multi-role study partner for CCA-F. Shifts between Expert Teacher and student personas at three difficulty levels.',
    glowColor: 'shadow-rose-500/25',
    borderColor: 'border-rose-500/40 hover:border-rose-400/70',
    bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    textColor: 'text-rose-400',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotColor: 'bg-rose-400',
    icon: BookOpen,
    status: 'standby',
    capabilities: ['Expert Teaching', 'Socratic Method', 'Student Sim', 'Gap Analysis'],
    model: 'Claude Sonnet',
    type: 'specialist',
    tools: 7,
    activeTask: 'Standby — awaiting study session',
    version: 'v0.9.0',
    deliveries: [
      { version: 'v0.5', label: '101 / 201 / 301 persona framework',          type: 'major' },
      { version: 'v0.8', label: 'Socratic method + knowledge-gap analysis',   type: 'minor' },
      { version: 'v0.9', label: 'Student simulation mode (beta)',              type: 'patch' },
    ],
  },
];

/* ──────────────────────────────────────────────────────────────
   Flow steps
────────────────────────────────────────────────────────────── */
const FLOW_STEPS = [
  { icon: Lightbulb,  label: 'Thought',     sub: 'An idea sparks',        color: 'text-yellow-400', glow: 'shadow-yellow-400/30', border: 'border-yellow-500/40', bg: 'from-yellow-500/10 to-transparent', lineFrom: '#eab308', lineTo: '#3b82f6' },
  { icon: ListChecks, label: 'Plan',         sub: 'Scope & structure',     color: 'text-blue-400',   glow: 'shadow-blue-400/30',   border: 'border-blue-500/40',   bg: 'from-blue-500/10 to-transparent',   lineFrom: '#3b82f6', lineTo: '#8b5cf6' },
  { icon: Handshake,  label: 'AI Partner',   sub: 'Delegate to the team',  color: 'text-violet-400', glow: 'shadow-violet-400/30', border: 'border-violet-500/40', bg: 'from-violet-500/10 to-transparent', lineFrom: '#8b5cf6', lineTo: '#10b981' },
  { icon: Trophy,     label: 'Achievement',  sub: 'Ship the outcome',      color: 'text-emerald-400',glow: 'shadow-emerald-400/30',border: 'border-emerald-500/40',bg: 'from-emerald-500/10 to-transparent',lineFrom: '#10b981', lineTo: '#10b981' },
];

/* ──────────────────────────────────────────────────────────────
   Small helpers
────────────────────────────────────────────────────────────── */
function PulsingDot({ active, color = 'bg-emerald-400' }: { active: boolean; color?: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {active && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? color : 'bg-slate-600'}`} />
    </span>
  );
}

function VersionBadge({ version, type }: { version: string; type?: 'orchestrator' | 'specialist' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold
      ${type === 'orchestrator'
        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
        : 'bg-slate-800 text-slate-400 border border-slate-700/60'
      }`}>
      <Tag size={8} />
      {version}
    </span>
  );
}

function DeliveryDot({ type }: { type: Delivery['type'] }) {
  return (
    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${
      type === 'major' ? 'bg-white' : type === 'minor' ? 'bg-slate-400' : 'bg-slate-600'
    }`} />
  );
}

/* ──────────────────────────────────────────────────────────────
   Flow Banner
────────────────────────────────────────────────────────────── */
function FlowBanner({ step }: { step: number }) {
  return (
    <div className="relative mb-8">
      <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Brain size={11} /> How it works
      </p>
      <div className="flex items-start">
        {FLOW_STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i <= step;
          const current = i === step;
          return (
            <div key={s.label} className="flex items-start flex-1 min-w-0">
              <div className="flex flex-col items-center w-full">
                <div className={`relative w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-700
                  ${active ? `bg-gradient-to-br ${s.bg} ${s.border} shadow-lg ${s.glow}` : 'bg-slate-900/60 border-slate-800'}
                  ${current ? 'scale-110' : ''}`}>
                  <Icon size={18} className={`transition-colors duration-700 ${active ? s.color : 'text-slate-700'}`} />
                  {current && <span className={`absolute inset-0 rounded-2xl border ${s.border} animate-ping opacity-25`} />}
                </div>
                <div className={`mt-2 text-center transition-all duration-700 ${active ? 'opacity-100' : 'opacity-25'}`}>
                  <div className={`text-[11px] font-bold ${active ? s.color : 'text-slate-600'}`}>{s.label}</div>
                  <div className="text-[9px] text-slate-600 hidden sm:block leading-tight mt-0.5">{s.sub}</div>
                </div>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div className="relative flex items-center pt-5 shrink-0" style={{ width: 32 }}>
                  <div className="w-full h-px bg-slate-800 relative overflow-hidden rounded">
                    <div className="absolute inset-y-0 left-0 h-full rounded transition-all duration-500"
                      style={{ width: i < step ? '100%' : '0%', background: `linear-gradient(to right, ${s.lineFrom}, ${s.lineTo})`, transitionDelay: `${i * 100}ms` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-5 flex items-center pl-1">
        {step === 0 && <span className="flex items-center gap-2 text-[11px] text-yellow-400/60 italic font-mono"><Lightbulb size={11} className="text-yellow-400/60" />"I have an idea for the platform..."<BounceEllipsis color="bg-yellow-400/50" /></span>}
        {step === 1 && <span className="flex items-center gap-2 text-[11px] text-blue-400/60 italic font-mono"><ListChecks size={11} className="text-blue-400/60" />"Let me break this down and plan it..."<BounceEllipsis color="bg-blue-400/50" /></span>}
        {step === 2 && <span className="flex items-center gap-2 text-[11px] text-violet-400/60 italic font-mono"><Cpu size={11} className="text-violet-400/60" />"Delegating to my AI team..."<BounceEllipsis color="bg-violet-400/50" /></span>}
        {step >= 3 && <span className="flex items-center gap-2 text-[11px] text-emerald-400/80 font-semibold font-mono"><Trophy size={11} className="text-emerald-400" />Shipped. ✓</span>}
      </div>
    </div>
  );
}

function BounceEllipsis({ color }: { color: string }) {
  return (
    <span className="flex gap-0.5 ml-1">
      {[0, 100, 200].map(d => <span key={d} className={`w-1 h-1 rounded-full ${color} animate-bounce`} style={{ animationDelay: `${d}ms` }} />)}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────
   Animated vertical connector
────────────────────────────────────────────────────────────── */
function VerticalConnector({ label, visible, delay = 0 }: { label?: string; visible: boolean; delay?: number }) {
  return (
    <div className="flex flex-col items-center" style={{ alignSelf: 'center', margin: '0 auto' }}>
      <div className="relative overflow-hidden" style={{ width: 1, height: 28 }}>
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-500 to-slate-600"
          style={{ height: visible ? '100%' : '0%', width: '100%', transition: `height 500ms ease ${delay}ms` }} />
        {visible && (
          <div className="absolute inset-x-0 bg-gradient-to-b from-white/50 to-transparent rounded-full"
            style={{ width: '100%', height: 12, animation: `signalPulse 2s ease-in-out ${delay}ms infinite` }} />
        )}
      </div>
      {label && (
        <div className="flex items-center gap-2 py-1 transition-all duration-400"
          style={{ opacity: visible ? 1 : 0, transitionDelay: `${delay + 150}ms` }}>
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-700" />
          <div className="flex items-center gap-1">
            <ArrowDown size={9} className="text-slate-600" />
            <span className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold whitespace-nowrap">{label}</span>
          </div>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-slate-700" />
        </div>
      )}
      <div className="relative overflow-hidden" style={{ width: 1, height: 28 }}>
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-600 to-slate-800"
          style={{ height: visible ? '100%' : '0%', width: '100%', transition: `height 500ms ease ${delay + 200}ms` }} />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Fan connector
────────────────────────────────────────────────────────────── */
function FanConnector({ visible, count }: { visible: boolean; count: number }) {
  return (
    <div className="relative my-1" style={{ minHeight: 56 }}>
      <div className="absolute left-1/2 -translate-x-px top-0 overflow-hidden" style={{ width: 1, height: 26 }}>
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-500 to-slate-600"
          style={{ height: visible ? '100%' : '0%', width: '100%', transition: 'height 400ms ease 450ms' }} />
      </div>
      <div className="absolute top-[26px] left-0 right-0 overflow-hidden" style={{ height: 1 }}>
        <div className="absolute top-0 h-full bg-gradient-to-r from-transparent via-slate-600 to-transparent"
          style={{ left: visible ? '8%' : '50%', right: visible ? '8%' : '50%', transition: 'left 500ms ease 500ms, right 500ms ease 500ms' }} />
      </div>
      <div className="absolute flex justify-center w-full" style={{ top: 20, opacity: visible ? 1 : 0, transition: 'opacity 300ms ease 560ms' }}>
        <span className="text-[9px] text-slate-600 uppercase tracking-widest bg-slate-950 px-2 font-semibold">delegates to</span>
      </div>
      <div className="absolute left-0 right-0 flex justify-around px-[8%]" style={{ top: 27 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="overflow-hidden" style={{ width: 1, height: 28 }}>
            <div className="bg-gradient-to-b from-slate-500 to-slate-700"
              style={{ height: visible ? '100%' : '0%', width: '100%', transition: `height 350ms ease ${580 + i * 60}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Human card — with hover profile popup
────────────────────────────────────────────────────────────── */
function HumanCard({ visible, isThinking }: { visible: boolean; isThinking: boolean }) {
  const [showPopup, setShowPopup] = useState(false);
  const [hovered, setHovered] = useState(false);
  const popupTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function openPopup() {
    clearTimeout(popupTimer.current);
    setShowPopup(true);
  }
  function closePopup() {
    popupTimer.current = setTimeout(() => setShowPopup(false), 150);
  }

  return (
    <div
      className={`relative glass-card rounded-2xl p-5 border transition-all duration-600 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}
        ${hovered ? 'border-slate-400/60 shadow-2xl shadow-slate-400/10' : 'border-slate-600/50'}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-500/5 to-transparent pointer-events-none" />

      <div className="absolute -top-3 left-5">
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-slate-800 text-slate-300 border border-slate-600">
          👤 Principal
        </span>
      </div>

      <div className="relative flex items-center gap-4 pt-2">
        {/* avatar — hover triggers profile popup */}
        <div
          className="relative shrink-0 cursor-pointer"
          onMouseEnter={openPopup}
          onMouseLeave={closePopup}
        >
          <img
            src={maintainer.avatar}
            alt={maintainer.name}
            className={`w-16 h-16 rounded-2xl ring-2 transition-all duration-300 ${showPopup || hovered ? 'ring-violet-400/60 scale-105' : 'ring-slate-700'}`}
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-slate-950 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>

          {/* Profile popup */}
          <div
            className={`absolute left-20 -top-2 z-50 w-64 transition-all duration-300 pointer-events-none
              ${showPopup ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
            onMouseEnter={openPopup}
            onMouseLeave={closePopup}
            style={{ pointerEvents: showPopup ? 'all' : 'none' }}
          >
            <div className="glass-card rounded-2xl p-4 border border-violet-500/30 shadow-2xl shadow-violet-500/10 bg-slate-900/95 backdrop-blur-xl">
              {/* popup arrow */}
              <div className="absolute left-0 top-6 -translate-x-1.5 w-3 h-3 rotate-45 bg-slate-900/95 border-l border-b border-violet-500/30" />

              <div className="flex items-start gap-3 mb-3">
                <img src={maintainer.avatar} alt="" className="w-10 h-10 rounded-xl ring-1 ring-violet-500/40 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-white text-sm truncate">{maintainer.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">{maintainer.title}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                {[
                  { icon: Award,    val: `${maintainer.certifications?.length ?? 4} Certs`,  },
                  { icon: Brain,    val: `${maintainer.stats?.[0]?.value ?? '18+'} Yrs`,     },
                  { icon: Building2,val: maintainer.company,                                   },
                  { icon: MapPin,   val: maintainer.location,                                  },
                ].map(({ icon: Ic, val }) => (
                  <div key={val} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Ic size={11} className="text-slate-600 shrink-0" />
                    <span className="truncate">{val}</span>
                  </div>
                ))}
              </div>

              <Link
                to="/maintainer"
                className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 text-xs font-semibold border border-violet-500/30 transition-colors duration-200"
              >
                <User size={12} />
                View Full Profile
                <ExternalLink size={10} />
              </Link>
            </div>
          </div>
        </div>

        {/* name — also triggers popup */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3
              className="text-base font-bold text-white hover:text-violet-300 transition-colors cursor-pointer"
              onMouseEnter={openPopup}
              onMouseLeave={closePopup}
            >
              {maintainer.name}
            </h3>
            <a href={maintainer.links?.[0]?.url ?? 'https://github.com/ajeetchouksey'} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-violet-400 transition-colors">
              <ExternalLink size={12} />
            </a>
          </div>
          <p className="text-xs text-slate-400 mb-1.5">{maintainer.title}</p>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Building2 size={10} />{maintainer.company}</span>
            <span className="flex items-center gap-1"><MapPin size={10} />{maintainer.location}</span>
          </div>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <PulsingDot active />
            <span className="text-[10px] text-slate-500">Online</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{maintainer.stats?.[0]?.value ?? '18+'}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Yrs Exp.</div>
          </div>
        </div>
      </div>

      {/* bottom row */}
      <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/60">
        {['Azure', 'Terraform', 'AI Agents', 'DevSecOps', 'Claude API'].map(s => (
          <span key={s} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">{s}</span>
        ))}
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30">
          +{maintainer.certifications?.length ?? 4} certs
        </span>

        {/* "thinking" bubble */}
        <div className={`ml-auto flex items-center gap-1.5 transition-all duration-500 ${isThinking ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <Lightbulb size={11} className="text-yellow-400 shrink-0" />
          <span className="text-[10px] text-yellow-400/80 font-mono italic">thinking</span>
          <span className="flex gap-0.5">
            {[0, 100, 200].map(d => <span key={d} className="w-0.5 h-2 rounded-full bg-yellow-400/70 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
          </span>
        </div>

        {/* View profile button — always visible on hover */}
        <Link
          to="/maintainer"
          className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-800 hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 border border-slate-700/60 hover:border-violet-500/40 transition-all duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        >
          <User size={10} />
          View Profile
        </Link>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Orchestrator card
────────────────────────────────────────────────────────────── */
function OrchestratorCard({ agent, visible }: { agent: Agent; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const Icon = agent.icon;
  const specialists = agents.filter(a => a.type === 'specialist');

  useEffect(() => {
    if (hovered) { const t = setTimeout(() => setShowDeliveries(true), 200); return () => clearTimeout(t); }
    setShowDeliveries(false);
  }, [hovered]);

  return (
    <div
      className={`relative glass-card rounded-2xl p-5 border transition-all duration-600 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${hovered ? 'border-violet-400/60 shadow-2xl shadow-violet-500/20' : 'border-violet-500/30'}
      `}
      style={{ transitionDelay: '200ms' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.bgGradient} pointer-events-none`} />

      <div className="absolute -top-3 left-5 flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${agent.badgeColor}`}>⚡ Commander</span>
        <VersionBadge version={agent.version} type="orchestrator" />
      </div>

      <div className="relative flex flex-col sm:flex-row sm:items-start gap-4 pt-2">
        <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${agent.bgGradient} border ${agent.borderColor} flex items-center justify-center transition-transform duration-300 ${hovered ? 'scale-110' : ''}`}>
          <Icon size={22} className={agent.textColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-white">{agent.name}</h3>
            <PulsingDot active color={agent.dotColor} />
          </div>
          <p className={`text-xs font-medium ${agent.textColor} mb-1`}>{agent.tagline}</p>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">{agent.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {agent.capabilities.map(c => (
              <span key={c} className={`px-2 py-0.5 rounded text-[10px] font-medium border ${agent.badgeColor}`}>{c}</span>
            ))}
          </div>
          {/* live task */}
          <div className="flex items-center gap-1.5 mt-3 bg-slate-900/50 rounded px-2.5 py-1.5">
            <span className="flex gap-0.5">{[0,100,200].map(d=><span key={d} className="w-0.5 h-2 rounded-full bg-violet-400/60 animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</span>
            <code className={`text-[10px] ${agent.textColor} font-mono`}>{agent.activeTask}</code>
          </div>

          {/* deliveries — reveal on hover */}
          <div className={`overflow-hidden transition-all duration-400 ${showDeliveries ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
            <div className="pt-3 border-t border-slate-800/40">
              <div className="flex items-center gap-1.5 mb-2">
                <PackageCheck size={11} className="text-slate-500" />
                <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Major Deliveries</span>
              </div>
              <div className="space-y-1.5">
                {agent.deliveries.map(d => (
                  <div key={d.version} className="flex items-start gap-2">
                    <DeliveryDot type={d.type} />
                    <span className={`text-[9px] font-mono font-bold shrink-0 ${agent.textColor}`}>{d.version}</span>
                    <span className="text-[10px] text-slate-400 leading-tight">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex sm:flex-col gap-4 sm:gap-2 text-center items-center sm:items-end">
          <div><div className={`text-xl font-bold ${agent.textColor}`}>{agent.tools}</div><div className="text-[10px] text-slate-500">Tools</div></div>
          <div><div className="text-xl font-bold text-slate-300">4</div><div className="text-[10px] text-slate-500">Reports</div></div>
        </div>
      </div>

      {/* mini specialist preview */}
      <div className="relative mt-4 pt-3 border-t border-slate-800/40">
        <div className="flex justify-around">
          {specialists.map(s => {
            const SIcon = s.icon;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bgGradient} border ${s.borderColor} flex items-center justify-center hover:scale-110 transition-transform duration-200`}>
                  <SIcon size={15} className={s.textColor} />
                </div>
                <span className={`text-[9px] font-semibold ${s.textColor}`}>{s.role}</span>
                <VersionBadge version={s.version} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Specialist card — with version + deliveries popup
────────────────────────────────────────────────────────────── */
function SpecialistCard({ agent, index, visible }: { agent: Agent; index: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const Icon = agent.icon;

  useEffect(() => {
    if (hovered) { const t = setTimeout(() => setShowDeliveries(true), 200); return () => clearTimeout(t); }
    setShowDeliveries(false);
  }, [hovered]);

  return (
    <div
      className={`relative glass-card rounded-xl p-4 border transition-all duration-500 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${hovered ? `${agent.borderColor} shadow-xl ${agent.glowColor} -translate-y-1` : 'border-slate-700/40'}
      `}
      style={{ transitionDelay: `${400 + index * 100}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${agent.bgGradient} pointer-events-none transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-40'}`} />

      <div className="relative">
        {/* header */}
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.bgGradient} border ${agent.borderColor} flex items-center justify-center transition-transform duration-300 ${hovered ? 'scale-110' : ''}`}>
            <Icon size={17} className={agent.textColor} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              <PulsingDot active={agent.status === 'active'} color={agent.dotColor} />
              <span className="text-[10px] text-slate-500">{agent.status}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${agent.badgeColor}`}>{agent.role}</span>
              <VersionBadge version={agent.version} />
            </div>
          </div>
        </div>

        <h3 className="font-bold text-white text-sm mb-0.5">{agent.name}</h3>
        <p className={`text-[11px] ${agent.textColor} mb-2 font-medium`}>{agent.tagline}</p>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">{agent.description}</p>

        {/* capabilities */}
        <div className="flex flex-wrap gap-1 mb-3">
          {agent.capabilities.map(c => (
            <span key={c} className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${agent.badgeColor}`}>{c}</span>
          ))}
        </div>

        {/* deliveries — reveal on hover */}
        <div className={`overflow-hidden transition-all duration-400 ${showDeliveries ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="pt-3 border-t border-slate-700/30 mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <PackageCheck size={10} className="text-slate-500" />
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Major Deliveries</span>
            </div>
            <div className="space-y-1.5">
              {agent.deliveries.map(d => (
                <div key={d.version} className="flex items-start gap-2">
                  <DeliveryDot type={d.type} />
                  <span className={`text-[9px] font-mono font-bold shrink-0 ${agent.textColor}`}>{d.version}</span>
                  <span className="text-[10px] text-slate-400 leading-tight">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* active task on hover */}
        <div className={`overflow-hidden transition-all duration-300 ${hovered && !showDeliveries ? 'max-h-8 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
          <div className="flex items-center gap-1.5 bg-slate-900/60 rounded px-2.5 py-1.5">
            <span className="flex gap-0.5">{[0,100,200].map(d=><span key={d} className="w-0.5 h-2 rounded-full bg-slate-400/60 animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</span>
            <code className={`text-[10px] ${agent.textColor} font-mono truncate`}>{agent.activeTask}</code>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-slate-700/30">
          <span className="text-[10px] text-slate-500">{agent.tools} tools</span>
          <span className={`text-[10px] font-medium ${agent.textColor}`}>{agent.model}</span>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Stat badge
────────────────────────────────────────────────────────────── */
function StatBadge({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <div className="glass-stats rounded-xl p-4 text-center">
      <Icon size={16} className={`mx-auto ${color} mb-1.5`} />
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────── */
export default function Team() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [flowStep, setFlowStep] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const t0 = setTimeout(() => setVisible(true), 150);
    const flowTimers = [400, 1100, 1800, 2500].map((delay, i) =>
      setTimeout(() => setFlowStep(i), delay)
    );
    timers.current = [t0, ...flowTimers];
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const orchestrator = agents.find(a => a.type === 'orchestrator')!;
  const specialists = agents.filter(a => a.type === 'specialist');

  return (
    <>
      <style>{`
        @keyframes signalPulse {
          0%   { top: -50%; opacity: 0; }
          15%  { opacity: 0.8; }
          85%  { opacity: 0.4; }
          100% { top: 120%; opacity: 0; }
        }
      `}</style>

      <div className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>

        {/* header */}
        <div className={`mb-6 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Bot size={20} className="text-violet-400" />
            <h1 className="text-xl font-bold text-white">The Team</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet-500/15 text-violet-300 border border-violet-500/30">
              1 Human · {agents.length} AI Agents
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-lg">
            One principal. Five specialist agents. Thought becomes shipped outcome.
          </p>
        </div>

        {/* stats */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '100ms' }}>
          <StatBadge icon={Bot}    value={5}      label="AI Agents"   color="text-violet-400" />
          <StatBadge icon={Zap}    value={49}     label="Total Tools" color="text-amber-400" />
          <StatBadge icon={Brain}  value="Claude" label="Foundation"  color="text-blue-400" />
          <StatBadge icon={Shield} value="18+"    label="Yrs Exp."    color="text-emerald-400" />
        </div>

        {/* flow */}
        <div className={`transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
          <FlowBanner step={flowStep} />
        </div>

        {/* hierarchy */}
        <div className="flex flex-col">

          <HumanCard visible={visible} isThinking={flowStep === 0 || flowStep === 1} />
          <VerticalConnector label="instructs orchestrator" visible={visible} delay={300} />
          <OrchestratorCard agent={orchestrator} visible={visible} />
          <FanConnector visible={visible} count={specialists.length} />

          <div className={`flex items-center gap-2 mb-3 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '700ms' }}>
            <ChevronRight size={13} className="text-slate-600" />
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Specialist Agents</span>
            <div className="flex gap-1 ml-1">
              {specialists.map(s => <span key={s.id} className={`w-1.5 h-1.5 rounded-full ${s.dotColor}`} />)}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {specialists.map((agent, i) => (
              <SpecialistCard key={agent.id} agent={agent} index={i} visible={visible} />
            ))}
          </div>
        </div>

        {/* footer */}
        <div className={`flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 mt-6 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '1000ms' }}>
          <Globe size={14} className="shrink-0 mt-0.5 text-slate-600" />
          <span>
            All agents powered by <span className="text-slate-400 font-medium">Claude Sonnet</span> via GitHub Copilot agent mode.
            Definitions live in <code className="text-violet-400">.github/agents/</code> — loaded automatically in this workspace.
          </span>
        </div>

      </div>
    </>
  );
}
