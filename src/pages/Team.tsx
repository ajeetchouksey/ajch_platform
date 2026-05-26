import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Cpu, PenTool, GraduationCap, BookOpen, GitBranch,
  Globe, ChevronRight, MapPin, Building2, ExternalLink,
  Zap, Brain, ShieldCheck, Lightbulb, ListChecks, Handshake, Trophy,
  ArrowDown, PackageCheck, Tag, Award, User, Users,
  Layers, Palette, FileText, Send, HelpCircle, Share2,
} from 'lucide-react';
import { maintainer } from '../data/maintainer';

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface Delivery {
  version: string;
  label: string;
  type: 'major' | 'minor' | 'patch';
}

interface SubAgent {
  id: string;
  name: string;
  role: string;
  description: string;
  owns: string;
  tools: string;
  icon: React.ElementType;
  isNew?: boolean;
}

interface AgentData {
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
  tools: number;
  activeTask: string;
  version: string;
  deliveries: Delivery[];
  isNew?: boolean;
  noSubAgents?: boolean;
  subAgents?: SubAgent[];
}

/* ─────────────────────────────────────────────────────────────
   L0 — Orchestrator
───────────────────────────────────────────────────────────── */
const orchestrator: AgentData = {
  id: 'orchestrator',
  name: 'Platform Orchestrator',
  role: 'Master Commander',
  tagline: 'Classify. Gate. Route. Synthesize.',
  description: 'Central brain. Classifies every request, triggers the security gate, routes to the correct domain commander. Never implements directly.',
  glowColor: 'shadow-violet-500/30',
  borderColor: 'border-violet-500/40 hover:border-violet-400/70',
  bgGradient: 'from-violet-500/10 via-violet-500/5 to-transparent',
  textColor: 'text-violet-400',
  badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  dotColor: 'bg-violet-400',
  icon: Cpu,
  status: 'active',
  capabilities: ['Intent Classification', 'Security Gate', 'Agent Routing', 'Synthesis'],
  model: 'Claude Sonnet',
  tools: 14,
  activeTask: 'Routing blog request → Blog Commander',
  version: 'v1.4.0',
  deliveries: [
    { version: 'v1.0', label: 'Core routing engine + agent registry', type: 'major' },
    { version: 'v1.3', label: 'Clarification workflow + context carry-over', type: 'minor' },
    { version: 'v1.4', label: 'Security gate + sub-agent routing', type: 'minor' },
  ],
};

/* ─────────────────────────────────────────────────────────────
   L1 — Domain Commanders
───────────────────────────────────────────────────────────── */
export const l1Agents: AgentData[] = [
  {
    id: 'platform-control',
    name: 'Platform Control',
    role: 'Architect',
    tagline: 'Architecture decisions. Build config. Feature registration.',
    description: 'Domain commander for platform concerns. Delegates routing changes to Routing Agent and component work to Component Builder. Handles build config and deploy settings directly.',
    glowColor: 'shadow-blue-500/25',
    borderColor: 'border-blue-500/40 hover:border-blue-400/70',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    textColor: 'text-blue-400',
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    dotColor: 'bg-blue-400',
    icon: GitBranch,
    status: 'active',
    capabilities: ['Architecture', 'Build Config', 'Deploy', 'Feature Registration'],
    model: 'Claude Sonnet',
    tools: 8,
    activeTask: 'Delegating Team page redesign → Component Builder',
    version: 'v2.5.0',
    deliveries: [
      { version: 'v1.0', label: 'App shell, routing, sidebar, layout', type: 'major' },
      { version: 'v2.0', label: 'Team page + org hierarchy design', type: 'major' },
      { version: 'v2.5', label: 'Sub-agent delegation + UX Framework integration', type: 'minor' },
    ],
    subAgents: [
      {
        id: 'routing',
        name: 'Routing Agent',
        role: 'Route Specialist',
        description: 'Only touches App.tsx + Layout.tsx nav. No component edits ever.',
        owns: 'App.tsx · Layout.tsx nav',
        tools: 'read, edit (2 files only)',
        icon: Share2,
        isNew: true,
      },
      {
        id: 'builder',
        name: 'Component Builder',
        role: 'UI Builder',
        description: 'Scaffolds React components using ui/ library only — no raw Tailwind classes.',
        owns: 'src/components/ · src/pages/',
        tools: 'read, edit, search',
        icon: Layers,
        isNew: true,
      },
    ],
  },
  {
    id: 'blog',
    name: 'Blog Commander',
    role: 'Storyteller',
    tagline: 'Coordinate write → validate → publish.',
    description: 'Domain commander for blog content. Orchestrates the full pipeline: Writer produces prose, Security Gate validates, Publisher commits to disk.',
    glowColor: 'shadow-emerald-500/25',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400/70',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    textColor: 'text-emerald-400',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    icon: PenTool,
    status: 'active',
    capabilities: ['Content Pipeline', 'Voice Strategy', 'Category Management'],
    model: 'Claude Sonnet',
    tools: 6,
    activeTask: 'Drafting post on AI model optimization...',
    version: 'v1.5.0',
    deliveries: [
      { version: 'v1.0', label: 'Blog post import pipeline + frontmatter', type: 'major' },
      { version: 'v1.4', label: 'Platform-voice rewrite + governance post', type: 'minor' },
      { version: 'v1.5', label: 'Write → Validate → Publish sub-agent pipeline', type: 'minor' },
    ],
    subAgents: [
      {
        id: 'writer',
        name: 'Content Writer',
        role: 'Prose Specialist',
        description: 'Returns markdown string only. Never writes to disk. No terminal access.',
        owns: 'no disk write — string output only',
        tools: 'read, web/fetch only',
        icon: FileText,
        isNew: true,
      },
      {
        id: 'publisher',
        name: 'Content Publisher',
        role: 'Publishing Specialist',
        description: 'Manages index.json manifest, frontmatter, slugs, SEO metadata only.',
        owns: 'public/content/blog/',
        tools: 'read, edit (blog/ only)',
        icon: Send,
        isNew: true,
      },
    ],
  },
  {
    id: 'exam-content',
    name: 'Exam Commander',
    role: 'Curator',
    tagline: 'Research. Extract. Deduplicate. Delegate.',
    description: 'Domain commander for exam content. Handles web research and concept extraction directly, then delegates MCQ generation and notes writing to specialists.',
    glowColor: 'shadow-amber-500/25',
    borderColor: 'border-amber-500/40 hover:border-amber-400/70',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    textColor: 'text-amber-400',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    dotColor: 'bg-amber-400',
    icon: GraduationCap,
    status: 'active',
    capabilities: ['Web Research', 'Concept Extraction', 'Deduplication', 'Classification'],
    model: 'Claude Sonnet',
    tools: 8,
    activeTask: 'Scanning Anthropic docs for new content...',
    version: 'v1.3.0',
    deliveries: [
      { version: 'v1.0', label: 'CCA-F question bank (50 questions)', type: 'major' },
      { version: 'v1.2', label: 'Deduplication engine + web research tools', type: 'minor' },
      { version: 'v1.3', label: 'Q-Gen + Study Notes sub-agent delegation', type: 'minor' },
    ],
    subAgents: [
      {
        id: 'qgen',
        name: 'Question Generator',
        role: 'MCQ Specialist',
        description: 'Generates MCQ JSON only. Wraps existing question-generator.md skill. Schema-validated before write.',
        owns: 'public/content/questions/',
        tools: 'read, edit (questions/ only)',
        icon: HelpCircle,
        isNew: false,
      },
      {
        id: 'notes',
        name: 'Study Notes Agent',
        role: 'Notes Specialist',
        description: 'Writes domain .md files — Mermaid diagrams, cheat sheets, exam trap callouts.',
        owns: 'public/content/notes/',
        tools: 'read, edit (notes/ only)',
        icon: BookOpen,
        isNew: true,
      },
    ],
  },
  {
    id: 'study-companion',
    name: 'Study Companion',
    role: 'Teacher',
    tagline: '101 → 201 → 301. Meet you where you are.',
    description: 'Multi-persona study partner. Teaching is a conversation, not a pipeline — no sub-agents needed. Shifts between Expert Teacher and student simulation modes.',
    glowColor: 'shadow-rose-500/25',
    borderColor: 'border-rose-500/40 hover:border-rose-400/70',
    bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    textColor: 'text-rose-400',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    dotColor: 'bg-rose-400',
    icon: Brain,
    status: 'standby',
    capabilities: ['Expert Teaching', 'Socratic Method', 'Student Sim', 'Gap Analysis'],
    model: 'Claude Sonnet',
    tools: 7,
    activeTask: 'Standby — awaiting study session',
    version: 'v0.9.0',
    deliveries: [
      { version: 'v0.5', label: '101/201/301 persona framework', type: 'major' },
      { version: 'v0.8', label: 'Socratic method + knowledge-gap analysis', type: 'minor' },
      { version: 'v0.9', label: 'Student simulation mode (beta)', type: 'patch' },
    ],
    noSubAgents: true,
  },
  {
    id: 'ux-framework',
    name: 'UX Framework',
    role: 'Design Steward',
    tagline: 'One design system. Zero raw Tailwind classes.',
    description: 'Owns src/components/ui/. All platform UI is built from typed primitives here. Eliminates style drift and reduces token overhead for component agents.',
    glowColor: 'shadow-purple-500/25',
    borderColor: 'border-purple-500/40 hover:border-purple-400/70',
    bgGradient: 'from-purple-500/10 via-purple-500/5 to-transparent',
    textColor: 'text-purple-400',
    badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    dotColor: 'bg-purple-400',
    icon: Palette,
    status: 'active',
    capabilities: ['Design Tokens', 'Component Library', 'Pattern Governance', 'Style Consistency'],
    model: 'Claude Sonnet',
    tools: 5,
    activeTask: 'Scaffolding src/components/ui/ primitives...',
    version: 'v1.0.0',
    deliveries: [
      { version: 'v1.0', label: 'GlassCard · Badge · Button · Avatar · StatGrid', type: 'major' },
    ],
    isNew: true,
    noSubAgents: true,
  },
];

/* ─────────────────────────────────────────────────────────────
   Flow steps
───────────────────────────────────────────────────────────── */
const FLOW_STEPS = [
  { icon: Lightbulb,  label: 'Thought',    sub: 'An idea sparks',       color: 'text-yellow-400', glow: 'shadow-yellow-400/30', border: 'border-yellow-500/40', bg: 'from-yellow-500/10 to-transparent', lineFrom: '#eab308', lineTo: '#3b82f6' },
  { icon: ListChecks, label: 'Plan',        sub: 'Scope & structure',    color: 'text-blue-400',   glow: 'shadow-blue-400/30',   border: 'border-blue-500/40',   bg: 'from-blue-500/10 to-transparent',   lineFrom: '#3b82f6', lineTo: '#8b5cf6' },
  { icon: Handshake,  label: 'AI Partner',  sub: 'Delegate to the team', color: 'text-violet-400', glow: 'shadow-violet-400/30', border: 'border-violet-500/40', bg: 'from-violet-500/10 to-transparent', lineFrom: '#8b5cf6', lineTo: '#10b981' },
  { icon: Trophy,     label: 'Achievement', sub: 'Ship the outcome',     color: 'text-emerald-400',glow: 'shadow-emerald-400/30',border: 'border-emerald-500/40',bg: 'from-emerald-500/10 to-transparent',lineFrom: '#10b981', lineTo: '#10b981' },
];

/* ─────────────────────────────────────────────────────────────
   Small helpers
───────────────────────────────────────────────────────────── */
function PulsingDot({ active, color = 'bg-emerald-400' }: { active: boolean; color?: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {active && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${color} opacity-60`} />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? color : 'bg-slate-600'}`} />
    </span>
  );
}

function VersionBadge({ version, highlight }: { version: string; highlight?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold
      ${highlight ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700/60'}`}>
      <Tag size={8} />{version}
    </span>
  );
}

function NewBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
      NEW
    </span>
  );
}

function DeliveryDot({ type }: { type: Delivery['type'] }) {
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${type === 'major' ? 'bg-white' : type === 'minor' ? 'bg-slate-400' : 'bg-slate-600'}`} />;
}

function BounceEllipsis({ color }: { color: string }) {
  return (
    <span className="flex gap-0.5 ml-1">
      {[0, 100, 200].map(d => <span key={d} className={`w-1 h-1 rounded-full ${color} animate-bounce`} style={{ animationDelay: `${d}ms` }} />)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   Flow Banner
───────────────────────────────────────────────────────────── */
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
        {step === 0 && <span className="flex items-center gap-2 text-[11px] text-yellow-400/60 italic font-mono"><Lightbulb size={11} />"I have an idea for the platform..."<BounceEllipsis color="bg-yellow-400/50" /></span>}
        {step === 1 && <span className="flex items-center gap-2 text-[11px] text-blue-400/60 italic font-mono"><ListChecks size={11} />"Let me break this down and plan it..."<BounceEllipsis color="bg-blue-400/50" /></span>}
        {step === 2 && <span className="flex items-center gap-2 text-[11px] text-violet-400/60 italic font-mono"><Cpu size={11} />"Delegating to my AI team..."<BounceEllipsis color="bg-violet-400/50" /></span>}
        {step >= 3 && <span className="flex items-center gap-2 text-[11px] text-emerald-400/80 font-semibold font-mono"><Trophy size={11} className="text-emerald-400" />Shipped. ✓</span>}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Connectors
───────────────────────────────────────────────────────────── */
function VerticalConnector({ label, visible, delay = 0 }: { label?: string; visible: boolean; delay?: number }) {
  return (
    <div className="flex flex-col items-center" style={{ alignSelf: 'center', margin: '0 auto' }}>
      <div className="relative overflow-hidden" style={{ width: 1, height: 24 }}>
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-500 to-slate-600"
          style={{ height: visible ? '100%' : '0%', width: '100%', transition: `height 500ms ease ${delay}ms` }} />
        {visible && (
          <div className="absolute inset-x-0 bg-gradient-to-b from-white/50 to-transparent rounded-full"
            style={{ width: '100%', height: 12, animation: `signalPulse 2s ease-in-out ${delay}ms infinite` }} />
        )}
      </div>
      {label && (
        <div className="flex items-center gap-2 py-1" style={{ opacity: visible ? 1 : 0, transition: `opacity 400ms ease ${delay + 150}ms` }}>
          <div className="h-px w-8 bg-gradient-to-r from-transparent to-slate-700" />
          <div className="flex items-center gap-1">
            <ArrowDown size={9} className="text-slate-600" />
            <span className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold whitespace-nowrap">{label}</span>
          </div>
          <div className="h-px w-8 bg-gradient-to-l from-transparent to-slate-700" />
        </div>
      )}
      <div className="relative overflow-hidden" style={{ width: 1, height: 24 }}>
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-600 to-slate-800"
          style={{ height: visible ? '100%' : '0%', width: '100%', transition: `height 500ms ease ${delay + 200}ms` }} />
      </div>
    </div>
  );
}

function FanConnector({ visible, count }: { visible: boolean; count: number }) {
  return (
    <div className="relative my-1" style={{ minHeight: 52 }}>
      <div className="absolute left-1/2 -translate-x-px top-0 overflow-hidden" style={{ width: 1, height: 24 }}>
        <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-slate-500 to-slate-600"
          style={{ height: visible ? '100%' : '0%', width: '100%', transition: 'height 400ms ease 450ms' }} />
      </div>
      <div className="absolute top-[24px] left-0 right-0 overflow-hidden" style={{ height: 1 }}>
        <div className="absolute top-0 h-full bg-gradient-to-r from-transparent via-slate-600 to-transparent"
          style={{ left: visible ? '8%' : '50%', right: visible ? '8%' : '50%', transition: 'left 500ms ease 500ms, right 500ms ease 500ms' }} />
      </div>
      <div className="absolute flex justify-center w-full" style={{ top: 18, opacity: visible ? 1 : 0, transition: 'opacity 300ms ease 560ms' }}>
        <span className="text-[9px] text-slate-600 uppercase tracking-widest bg-slate-950 px-2 font-semibold">delegates to</span>
      </div>
      <div className="absolute left-0 right-0 flex justify-around px-[8%]" style={{ top: 25 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="overflow-hidden" style={{ width: 1, height: 26 }}>
            <div className="bg-gradient-to-b from-slate-500 to-slate-700"
              style={{ height: visible ? '100%' : '0%', width: '100%', transition: `height 350ms ease ${580 + i * 60}ms` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Human card — Ajeet with profile hover popup
───────────────────────────────────────────────────────────── */
function HumanCard({ visible, isThinking }: { visible: boolean; isThinking: boolean }) {
  const [showPopup, setShowPopup] = useState(false);
  const [hovered, setHovered] = useState(false);
  const popupTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function openPopup() { clearTimeout(popupTimer.current); setShowPopup(true); }
  function closePopup() { popupTimer.current = setTimeout(() => setShowPopup(false), 150); }

  return (
    <div className={`relative glass-card rounded-2xl p-5 border transition-all duration-600
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-6'}
      ${hovered ? 'border-slate-400/60 shadow-2xl shadow-slate-400/10' : 'border-slate-600/50'}`}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-500/5 to-transparent pointer-events-none" />
      <div className="absolute -top-3 left-5 flex items-center gap-2">
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-slate-800 text-slate-300 border border-slate-600">👤 Principal</span>
      </div>

      <div className="relative flex items-center gap-4 pt-2">
        {/* Avatar with popup */}
        <div className="relative shrink-0 cursor-pointer" onMouseEnter={openPopup} onMouseLeave={closePopup}>
          <img src={maintainer.avatar} alt={maintainer.name}
            className={`w-16 h-16 rounded-2xl ring-2 transition-all duration-300 ${showPopup || hovered ? 'ring-violet-400/60 scale-105' : 'ring-slate-700'}`} />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-slate-950 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>

          {/* Profile popup */}
          <div className={`absolute left-20 -top-2 z-50 w-64 transition-all duration-300
            ${showPopup ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}
            style={{ pointerEvents: showPopup ? 'all' : 'none' }}
            onMouseEnter={openPopup} onMouseLeave={closePopup}>
            <div className="glass-card rounded-2xl p-4 border border-violet-500/30 shadow-2xl shadow-violet-500/10 bg-slate-900/95 backdrop-blur-xl">
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
                  { icon: Award,     val: `${maintainer.certifications?.length ?? 4} Certs` },
                  { icon: Brain,     val: `${maintainer.stats?.[0]?.value ?? '18+'} Yrs` },
                  { icon: Building2, val: maintainer.company },
                  { icon: MapPin,    val: maintainer.location },
                ].map(({ icon: Ic, val }) => (
                  <div key={val} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <Ic size={11} className="text-slate-600 shrink-0" /><span className="truncate">{val}</span>
                  </div>
                ))}
              </div>
              <Link to="/maintainer" className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 text-violet-300 text-xs font-semibold border border-violet-500/30 transition-colors duration-200">
                <User size={12} />View Full Profile<ExternalLink size={10} />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-bold text-white hover:text-violet-300 transition-colors cursor-pointer"
              onMouseEnter={openPopup} onMouseLeave={closePopup}>{maintainer.name}</h3>
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
          <div className="flex items-center gap-1.5"><PulsingDot active /><span className="text-[10px] text-slate-500">Online</span></div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{maintainer.stats?.[0]?.value ?? '18+'}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Yrs Exp.</div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-slate-800/60">
        {['Azure', 'Terraform', 'AI Agents', 'DevSecOps', 'Claude API'].map(s => (
          <span key={s} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">{s}</span>
        ))}
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30">+{maintainer.certifications?.length ?? 4} certs</span>
        <div className={`ml-auto flex items-center gap-1.5 transition-all duration-500 ${isThinking ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <Lightbulb size={11} className="text-yellow-400" />
          <span className="text-[10px] text-yellow-400/80 font-mono italic">thinking</span>
          <span className="flex gap-0.5">{[0,100,200].map(d=><span key={d} className="w-0.5 h-2 rounded-full bg-yellow-400/70 animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</span>
        </div>
        <Link to="/maintainer" className={`ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-slate-800 hover:bg-violet-500/20 text-slate-400 hover:text-violet-300 border border-slate-700/60 hover:border-violet-500/40 transition-all duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
          <User size={10} />View Profile
        </Link>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   L0 Orchestrator card
───────────────────────────────────────────────────────────── */
function OrchestratorCard({ agent, visible }: { agent: AgentData; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const Icon = agent.icon;

  useEffect(() => {
    if (hovered) { const t = setTimeout(() => setShowDeliveries(true), 200); return () => clearTimeout(t); }
    setShowDeliveries(false);
  }, [hovered]);

  return (
    <div className={`relative glass-card rounded-2xl p-5 border transition-all duration-600
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      ${hovered ? 'border-violet-400/60 shadow-2xl shadow-violet-500/20' : 'border-violet-500/30'}`}
      style={{ transitionDelay: '200ms' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.bgGradient} pointer-events-none`} />

      <div className="absolute -top-3 left-5 flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${agent.badgeColor}`}>⚡ L0 Orchestrator</span>
        <VersionBadge version={agent.version} highlight />
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
            {agent.capabilities.map(c => <span key={c} className={`px-2 py-0.5 rounded text-[10px] font-medium border ${agent.badgeColor}`}>{c}</span>)}
          </div>
          <div className="flex items-center gap-1.5 mt-3 bg-slate-900/50 rounded px-2.5 py-1.5">
            <span className="flex gap-0.5">{[0,100,200].map(d=><span key={d} className="w-0.5 h-2 rounded-full bg-violet-400/60 animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</span>
            <code className={`text-[10px] ${agent.textColor} font-mono`}>{agent.activeTask}</code>
          </div>

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
          <div><div className="text-xl font-bold text-slate-300">5</div><div className="text-[10px] text-slate-500">Reports</div></div>
        </div>
      </div>

      {/* L1 mini preview */}
      <div className="relative mt-4 pt-3 border-t border-slate-800/40">
        <span className="text-[9px] text-slate-600 uppercase tracking-widest font-semibold">Domain Commanders</span>
        <div className="flex justify-around mt-2">
          {l1Agents.map(s => {
            const SIcon = s.icon;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1">
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

/* ─────────────────────────────────────────────────────────────
   Security Gate — cross-cutting band
───────────────────────────────────────────────────────────── */
function SecurityGateBand({ visible }: { visible: boolean }) {
  const checks = [
    'Input validation & file-path traversal',
    'OWASP Top 10 compliance',
    'Secret / PAT token detection',
    'JSON schema enforcement',
    'Content policy gate',
    'Dependency install approval',
    'XSS prevention audit',
  ];

  return (
    <div className={`relative transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '500ms' }}>
      {/* top label */}
      <div className="flex items-center gap-2 mb-2 justify-center">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        <span className="flex items-center gap-1.5 text-[9px] font-bold text-amber-400/70 uppercase tracking-widest whitespace-nowrap">
          <ShieldCheck size={10} className="text-amber-400/70" />
          Cross-Cutting Security Gate — invoked before every write
        </span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent via-amber-500/30 to-transparent" />
      </div>

      <div className="glass-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-blue-500/5 pointer-events-none rounded-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-start gap-4">
          {/* icon + badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <ShieldCheck size={22} className="text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white text-sm">Security & Governance</span>
                <NewBadge />
                <VersionBadge version="v1.0.0" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">Cross-Cutting L1</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-500">read-only · never writes</span>
              </div>
            </div>
          </div>

          {/* checks grid */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 mb-2">Every mutating task passes through this gate. Returns <span className="text-emerald-400 font-semibold">PASS ✓</span> or <span className="text-red-400 font-semibold">BLOCK ✗ + reason</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {checks.map(c => (
                <div key={c} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <ShieldCheck size={9} className="text-amber-500/60 shrink-0" />
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* pass/block indicators */}
          <div className="shrink-0 flex sm:flex-col gap-2 items-center sm:items-end">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold">PASS ✓</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-red-400 font-bold">BLOCK ✗</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Sub-agent row (compact L2 display inside L1 card)
───────────────────────────────────────────────────────────── */
function SubAgentRow({ sub, textColor, badgeColor }: { sub: SubAgent; textColor: string; badgeColor: string }) {
  const Icon = sub.icon;
  return (
    <div className="flex items-start gap-2.5 py-2 px-3 rounded-lg bg-slate-900/50 border border-slate-800/60 group hover:border-slate-700/60 transition-colors duration-200">
      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform duration-200">
        <Icon size={13} className={textColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1 mb-0.5">
          <span className="text-[11px] font-bold text-white">{sub.name}</span>
          <span className={`text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${badgeColor}`}>{sub.role}</span>
          {sub.isNew && <NewBadge />}
          {!sub.isNew && <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/50">existing skill ↑</span>}
        </div>
        <p className="text-[10px] text-slate-500 leading-tight mb-1">{sub.description}</p>
        <div className="flex flex-wrap gap-1">
          <span className="flex items-center gap-0.5 text-[9px] text-slate-600 bg-slate-800/60 px-1.5 py-0.5 rounded">
            <Zap size={8} className="text-slate-700" />owns: <span className="text-slate-500 ml-0.5">{sub.owns}</span>
          </span>
          <span className="flex items-center gap-0.5 text-[9px] text-slate-600 bg-slate-800/60 px-1.5 py-0.5 rounded">
            🔧 {sub.tools}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   L1 Commander card
───────────────────────────────────────────────────────────── */
function L1CommanderCard({ agent, index, visible }: { agent: AgentData; index: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const Icon = agent.icon;

  useEffect(() => {
    if (hovered) { const t = setTimeout(() => setShowDeliveries(true), 200); return () => clearTimeout(t); }
    setShowDeliveries(false);
  }, [hovered]);

  return (
    <div className={`relative glass-card rounded-xl border transition-all duration-500
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      ${hovered ? `${agent.borderColor} shadow-xl ${agent.glowColor} -translate-y-1` : 'border-slate-700/40'}`}
      style={{ transitionDelay: `${700 + index * 100}ms` }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${agent.bgGradient} pointer-events-none transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-40'}`} />

      {/* header */}
      <div className="relative p-4 pb-3">
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
              {agent.isNew && <NewBadge />}
            </div>
          </div>
        </div>

        <h3 className="font-bold text-white text-sm mb-0.5">{agent.name}</h3>
        <p className={`text-[11px] ${agent.textColor} mb-2 font-medium`}>{agent.tagline}</p>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">{agent.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {agent.capabilities.map(c => <span key={c} className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${agent.badgeColor}`}>{c}</span>)}
        </div>

        {/* deliveries on hover */}
        <div className={`overflow-hidden transition-all duration-400 ${showDeliveries ? 'max-h-40 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
          <div className="pt-2 border-t border-slate-700/30">
            <div className="flex items-center gap-1.5 mb-1.5">
              <PackageCheck size={10} className="text-slate-500" />
              <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">Major Deliveries</span>
            </div>
            <div className="space-y-1">
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

        <div className="flex items-center justify-between pt-2 border-t border-slate-700/30">
          <span className="text-[10px] text-slate-500">{agent.tools} tools</span>
          <span className={`text-[10px] font-medium ${agent.textColor}`}>{agent.model}</span>
        </div>
      </div>

      {/* Sub-agents section */}
      {agent.subAgents && agent.subAgents.length > 0 && (
        <div className="border-t border-slate-800/60 px-4 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <ChevronRight size={10} className="text-slate-600" />
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">L2 Task Specialists</span>
            <div className="flex gap-0.5 ml-1">
              {agent.subAgents.map(s => {
                const SI = s.icon;
                return <SI key={s.id} size={9} className={agent.textColor + ' opacity-50'} />;
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            {agent.subAgents.map(sub => (
              <SubAgentRow key={sub.id} sub={sub} textColor={agent.textColor} badgeColor={agent.badgeColor} />
            ))}
          </div>
        </div>
      )}

      {/* No sub-agents note */}
      {agent.noSubAgents && (
        <div className="border-t border-slate-800/60 px-4 py-3">
          <div className={`flex items-center gap-2 text-[10px] ${agent.textColor} opacity-60`}>
            <span className="text-base">✦</span>
            {agent.id === 'ux-framework'
              ? 'Owns src/components/ui/ — used by Component Builder'
              : 'Teaching is a conversation — no sub-agent pipeline needed'}
          </div>
          {agent.id === 'ux-framework' && (
            <div className="mt-2 flex flex-wrap gap-1">
              {['GlassCard','Badge','VersionTag','StatGrid','Timeline','Avatar','Button','PulsingDot','SectionHeader'].map(c => (
                <span key={c} className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400/70 border border-purple-500/20">{c}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Asset ownership panel
───────────────────────────────────────────────────────────── */
function AssetPanel({ visible }: { visible: boolean }) {
  const buckets = [
    {
      title: 'src/components/ui/',
      owner: 'UX Framework Agent',
      ownerColor: 'text-purple-400',
      icon: Palette,
      files: ['GlassCard.tsx', 'Badge.tsx', 'VersionTag.tsx', 'StatGrid.tsx', 'Timeline.tsx', 'Avatar.tsx', 'Button.tsx', 'PulsingDot.tsx', 'index.ts'],
      borderColor: 'border-purple-500/20',
      bg: 'from-purple-500/5 to-transparent',
    },
    {
      title: 'App.tsx · Layout.tsx nav',
      owner: 'Routing Agent',
      ownerColor: 'text-blue-400',
      icon: Share2,
      files: ['App.tsx (routes)', 'Layout.tsx (nav links)', 'Layout.tsx (sidebar)'],
      borderColor: 'border-blue-500/20',
      bg: 'from-blue-500/5 to-transparent',
    },
    {
      title: 'public/content/blog/',
      owner: 'Content Publisher',
      ownerColor: 'text-emerald-400',
      icon: Send,
      files: ['index.json (manifest)', 'posts/slug.md (articles)'],
      borderColor: 'border-emerald-500/20',
      bg: 'from-emerald-500/5 to-transparent',
    },
    {
      title: 'public/content/exam/',
      owner: 'Q-Gen + Study Notes Agent',
      ownerColor: 'text-amber-400',
      icon: HelpCircle,
      files: ['questions/d*.json', 'notes/d*.md', 'scenarios/*.md'],
      borderColor: 'border-amber-500/20',
      bg: 'from-amber-500/5 to-transparent',
    },
  ];

  return (
    <div className={`transition-all duration-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '1100ms' }}>
      <div className="flex items-center gap-2 mb-3">
        <Layers size={13} className="text-slate-600" />
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">File & Asset Ownership</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {buckets.map(b => {
          const BIcon = b.icon;
          return (
            <div key={b.title} className={`glass-card rounded-xl p-3 border ${b.borderColor} bg-gradient-to-br ${b.bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <BIcon size={13} className={b.ownerColor} />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold text-white font-mono truncate">{b.title}</div>
                  <div className={`text-[9px] ${b.ownerColor}`}>owned by {b.owner}</div>
                </div>
              </div>
              <div className="space-y-0.5">
                {b.files.map(f => (
                  <div key={f} className="flex items-center gap-1 text-[9px] text-slate-600">
                    <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
                    <span className="font-mono truncate">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Stat badge
───────────────────────────────────────────────────────────── */
function StatBadge({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <div className="glass-stats rounded-xl p-4 text-center">
      <Icon size={16} className={`mx-auto ${color} mb-1.5`} />
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Page
───────────────────────────────────────────────────────────── */
export default function Team() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [flowStep, setFlowStep] = useState(-1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const t0 = setTimeout(() => setVisible(true), 150);
    const flowTimers = [400, 1100, 1800, 2500].map((delay, i) => setTimeout(() => setFlowStep(i), delay));
    timers.current = [t0, ...flowTimers];
    return () => timers.current.forEach(clearTimeout);
  }, []);

  const totalAgents = 1 + 1 + l1Agents.length + l1Agents.reduce((acc, a) => acc + (a.subAgents?.length ?? 0), 0);
  const totalSubAgents = l1Agents.reduce((acc, a) => acc + (a.subAgents?.length ?? 0), 0);

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

        {/* Header */}
        <div className={`mb-6 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-2 mb-1">
            <Bot size={20} className="text-violet-400" />
            <h1 className="text-xl font-bold text-white">The Team</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet-500/15 text-violet-300 border border-violet-500/30">
              1 Human · {totalAgents} Agents · 3 Tiers
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-xl">
            One principal. One orchestrator. One security gate. Five domain commanders. {totalSubAgents} task specialists. Everything has a single responsibility.
          </p>
        </div>

        {/* Stats */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ transitionDelay: '100ms' }}>
          <StatBadge icon={Bot}        value={totalAgents}      label="Total Agents"   color="text-violet-400" />
          <StatBadge icon={Users}      value={totalSubAgents}   label="Sub-Agents"     color="text-blue-400" />
          <StatBadge icon={ShieldCheck} value={1}               label="Security Gate"  color="text-amber-400" />
          <StatBadge icon={Brain}      value="Claude"           label="Foundation"     color="text-emerald-400" />
        </div>

        {/* Flow banner */}
        <div className={`transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '200ms' }}>
          <FlowBanner step={flowStep} />
        </div>

        {/* ─── Hierarchy ─── */}
        <div className="flex flex-col">

          {/* L0 layer label */}
          <div className={`flex items-center gap-2 mb-2 transition-opacity duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`}>
            <span className="text-[9px] font-bold text-violet-500/60 uppercase tracking-widest bg-violet-500/5 border border-violet-500/15 px-2 py-0.5 rounded">L0</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <HumanCard visible={visible} isThinking={flowStep === 0 || flowStep === 1} />
          <VerticalConnector label="instructs orchestrator" visible={visible} delay={300} />
          <OrchestratorCard agent={orchestrator} visible={visible} />

          {/* Security Gate */}
          <VerticalConnector visible={visible} delay={450} />
          <SecurityGateBand visible={visible} />
          <VerticalConnector visible={visible} delay={550} />

          {/* L1 layer label */}
          <div className={`flex items-center gap-2 mb-2 mt-1 transition-opacity duration-400 ${visible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '600ms' }}>
            <span className="text-[9px] font-bold text-blue-500/60 uppercase tracking-widest bg-blue-500/5 border border-blue-500/15 px-2 py-0.5 rounded">L1 + L2</span>
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[9px] text-slate-600">Domain Commanders + Task Specialists</span>
          </div>

          <FanConnector visible={visible} count={l1Agents.length} />

          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
            {l1Agents.map((agent, i) => (
              <L1CommanderCard key={agent.id} agent={agent} index={i} visible={visible} />
            ))}
          </div>

          {/* Asset ownership */}
          <AssetPanel visible={visible} />

        </div>

        {/* Footer */}
        <div className={`flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 mt-6 transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ transitionDelay: '1200ms' }}>
          <Globe size={14} className="shrink-0 mt-0.5 text-slate-600" />
          <span>
            All agents powered by <span className="text-slate-400 font-medium">Claude Sonnet</span> via GitHub Copilot agent mode.
            Definitions in <code className="text-violet-400">.github/agents/</code> · Security gate runs before every disk write ·
            UX library at <code className="text-purple-400">src/components/ui/</code>
          </span>
        </div>

      </div>
    </>
  );
}
