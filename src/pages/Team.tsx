import { useState, useEffect } from 'react';
import { Bot, Cpu, PenTool, GraduationCap, BookOpen, GitBranch, Globe, ChevronRight, MapPin, Building2, ExternalLink, Zap, Brain, Shield } from 'lucide-react';
import { maintainer } from '../data/maintainer';

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
  icon: React.ElementType;
  status: 'active' | 'standby';
  capabilities: string[];
  model: string;
  type: 'orchestrator' | 'specialist';
  tools: number;
}

export const agents: Agent[] = [
  {
    id: 'orchestrator',
    name: 'Platform Orchestrator',
    role: 'Commander',
    tagline: 'Analyzes. Delegates. Synthesizes.',
    description: 'The central brain of the platform. Receives every request, classifies intent, and routes work to the right specialist. Never implements — always coordinates.',
    glowColor: 'shadow-violet-500/25',
    borderColor: 'border-violet-500/40 hover:border-violet-400/70',
    bgGradient: 'from-violet-500/10 via-violet-500/5 to-transparent',
    textColor: 'text-violet-400',
    badgeColor: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    icon: Cpu,
    status: 'active',
    capabilities: ['Intent Classification', 'Agent Routing', 'Multi-domain Synthesis', 'Clarification'],
    model: 'Claude Sonnet',
    type: 'orchestrator',
    tools: 12,
  },
  {
    id: 'platform-control',
    name: 'Platform Control',
    role: 'Architect',
    tagline: 'Every pixel. Every route. Every decision.',
    description: 'Owns the entire platform shell — routing, navigation, layout, design system, and feature modules. If you see it rendered, this agent designed it.',
    glowColor: 'shadow-blue-500/25',
    borderColor: 'border-blue-500/40 hover:border-blue-400/70',
    bgGradient: 'from-blue-500/10 via-blue-500/5 to-transparent',
    textColor: 'text-blue-400',
    badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    icon: GitBranch,
    status: 'active',
    capabilities: ['Routing Architecture', 'Component Design', 'Design System', 'Feature Scaffolding'],
    model: 'Claude Sonnet',
    type: 'specialist',
    tools: 10,
  },
  {
    id: 'blog',
    name: 'Blog Agent',
    role: 'Storyteller',
    tagline: 'Raw ideas become published articles.',
    description: 'Creates, edits, and publishes technical blog content. Converts source material into platform-formatted articles with the right voice, structure, and SEO metadata.',
    glowColor: 'shadow-emerald-500/25',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400/70',
    bgGradient: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
    textColor: 'text-emerald-400',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    icon: PenTool,
    status: 'active',
    capabilities: ['Content Writing', 'SEO Metadata', 'Frontmatter', 'Publishing Pipeline'],
    model: 'Claude Sonnet',
    type: 'specialist',
    tools: 10,
  },
  {
    id: 'exam-content',
    name: 'Exam Content',
    role: 'Curator',
    tagline: 'Turns documentation into exam-ready knowledge.',
    description: 'Reads Anthropic docs and technical sources, generates MCQ questions with explanations, expands study notes, and deduplicates against existing content.',
    glowColor: 'shadow-amber-500/25',
    borderColor: 'border-amber-500/40 hover:border-amber-400/70',
    bgGradient: 'from-amber-500/10 via-amber-500/5 to-transparent',
    textColor: 'text-amber-400',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    icon: GraduationCap,
    status: 'active',
    capabilities: ['Web Research', 'Question Generation', 'Deduplication', 'Notes Expansion'],
    model: 'Claude Sonnet',
    type: 'specialist',
    tools: 10,
  },
  {
    id: 'study-companion',
    name: 'Study Companion',
    role: 'Teacher',
    tagline: '101 → 201 → 301. Meet you where you are.',
    description: 'Multi-role study partner for the CCA-F exam. Shifts between Expert Teacher and student personas at three difficulty levels to test knowledge gaps from every angle.',
    glowColor: 'shadow-rose-500/25',
    borderColor: 'border-rose-500/40 hover:border-rose-400/70',
    bgGradient: 'from-rose-500/10 via-rose-500/5 to-transparent',
    textColor: 'text-rose-400',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    icon: BookOpen,
    status: 'standby',
    capabilities: ['Expert Teaching', 'Socratic Method', 'Student Simulation', 'Knowledge Gap Analysis'],
    model: 'Claude Sonnet',
    type: 'specialist',
    tools: 7,
  },
];

function PulsingDot({ active }: { active: boolean }) {
  return (
    <span className="relative flex h-2 w-2">
      {active && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
    </span>
  );
}

function Connector({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-0 py-1">
      <div className="w-px h-6 bg-gradient-to-b from-slate-600 to-slate-700" />
      {label && (
        <>
          <span className="text-[9px] text-slate-600 uppercase tracking-widest px-2 py-0.5">{label}</span>
          <div className="w-px h-6 bg-gradient-to-b from-slate-700 to-slate-800" />
        </>
      )}
    </div>
  );
}

function HumanCard({ visible }: { visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`relative glass-card rounded-2xl p-5 border border-slate-600/50 hover:border-slate-400/50 transition-all duration-500 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
        ${hovered ? 'shadow-2xl shadow-slate-500/20 -translate-y-0.5' : ''}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-500/8 to-transparent pointer-events-none" />
      <div className="absolute -top-3 left-6">
        <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-slate-700/80 text-slate-300 border border-slate-600">
          👤 Principal
        </span>
      </div>
      <div className="relative flex items-center gap-5 pt-2">
        <div className="relative shrink-0">
          <img
            src={maintainer.avatar}
            alt={maintainer.name}
            className={`w-16 h-16 rounded-2xl ring-2 transition-all duration-300 ${hovered ? 'ring-slate-400 scale-105' : 'ring-slate-600'}`}
          />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-slate-900 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-lg font-bold text-white">{maintainer.name}</h3>
            <a href={maintainer.links[0]?.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-violet-400 transition-colors">
              <ExternalLink size={13} />
            </a>
          </div>
          <p className="text-sm text-slate-400 mb-2">{maintainer.title}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Building2 size={11} />{maintainer.company}</span>
            <span className="flex items-center gap-1"><MapPin size={11} />{maintainer.location}</span>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <PulsingDot active />
            <span className="text-xs text-slate-500">Online</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-white">{maintainer.stats[0].value}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Years Exp.</div>
          </div>
        </div>
      </div>
      <div className="relative flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-800/60">
        {['Azure', 'Terraform', 'AI Agents', 'DevSecOps', 'Claude API'].map((s) => (
          <span key={s} className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/50">{s}</span>
        ))}
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30">
          +{maintainer.certifications.length} certs
        </span>
      </div>
    </div>
  );
}

function OrchestratorCard({ agent, visible }: { agent: Agent; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = agent.icon;
  const specialists = agents.filter(a => a.type === 'specialist');
  return (
    <div
      className={`relative glass-card rounded-2xl p-5 border ${agent.borderColor} transition-all duration-500 cursor-default
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${hovered ? `shadow-2xl ${agent.glowColor} -translate-y-0.5` : ''}
      `}
      style={{ transitionDelay: '100ms' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.bgGradient} pointer-events-none`} />
      <div className="absolute -top-3 left-6">
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${agent.badgeColor}`}>⚡ Commander</span>
      </div>
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
        <div className={`shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${agent.bgGradient} border ${agent.borderColor} flex items-center justify-center transition-transform duration-300 ${hovered ? 'scale-110' : ''}`}>
          <Icon size={22} className={agent.textColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-bold text-white">{agent.name}</h3>
            <PulsingDot active={agent.status === 'active'} />
          </div>
          <p className={`text-xs font-medium ${agent.textColor} mb-1`}>{agent.tagline}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{agent.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {agent.capabilities.map((cap) => (
              <span key={cap} className={`px-2 py-0.5 rounded text-[10px] font-medium border ${agent.badgeColor}`}>{cap}</span>
            ))}
          </div>
        </div>
        <div className="shrink-0 flex sm:flex-col gap-4 sm:gap-2 text-center">
          <div><div className={`text-xl font-bold ${agent.textColor}`}>{agent.tools}</div><div className="text-[10px] text-slate-500 uppercase tracking-wide">Tools</div></div>
          <div><div className="text-xl font-bold text-slate-300">4</div><div className="text-[10px] text-slate-500 uppercase tracking-wide">Reports</div></div>
        </div>
      </div>
      <div className="relative mt-4 pt-3 border-t border-slate-800/40">
        <p className="text-[9px] text-slate-600 uppercase tracking-widest text-center mb-3">delegates to</p>
        <div className="flex justify-around">
          {specialists.map((s) => {
            const SIcon = s.icon;
            return (
              <div key={s.id} className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.bgGradient} border ${s.borderColor} flex items-center justify-center hover:scale-110 transition-transform duration-200`}>
                  <SIcon size={16} className={s.textColor} />
                </div>
                <span className={`text-[9px] font-medium ${s.textColor}`}>{s.role}</span>
                <PulsingDot active={s.status === 'active'} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SpecialistCard({ agent, index, visible }: { agent: Agent; index: number; visible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const Icon = agent.icon;
  useEffect(() => {
    if (hovered) { const t = setTimeout(() => setShowThinking(true), 250); return () => clearTimeout(t); }
    setShowThinking(false);
  }, [hovered]);
  const thinkingText: Record<string, string> = {
    'platform-control': '> Analyzing route structure...',
    blog: '> Fetching source content...',
    'exam-content': '> Scanning for duplicates...',
    'study-companion': '> Switching to 101 mode...',
  };
  return (
    <div
      className={`relative glass-card rounded-xl p-4 border ${agent.borderColor} transition-all duration-500 cursor-default group
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        ${hovered ? `shadow-xl ${agent.glowColor} -translate-y-1` : ''}
      `}
      style={{ transitionDelay: `${200 + index * 80}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${agent.bgGradient} pointer-events-none transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-60'}`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${agent.bgGradient} border ${agent.borderColor} flex items-center justify-center transition-transform duration-300 ${hovered ? 'scale-110' : ''}`}>
            <Icon size={18} className={agent.textColor} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5"><PulsingDot active={agent.status === 'active'} /><span className="text-[10px] text-slate-500">{agent.status}</span></div>
            <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${agent.badgeColor}`}>{agent.role}</span>
          </div>
        </div>
        <h3 className="font-bold text-white text-sm mb-0.5">{agent.name}</h3>
        <p className={`text-[11px] ${agent.textColor} mb-2 font-medium`}>{agent.tagline}</p>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">{agent.description}</p>
        <div className={`overflow-hidden transition-all duration-300 ${showThinking ? 'max-h-8 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
          <div className="flex items-center gap-1.5 bg-slate-900/60 rounded px-2.5 py-1.5">
            <span className="flex gap-0.5">{[0,150,300].map(d=><span key={d} className="w-1 h-1 rounded-full bg-slate-500 animate-bounce" style={{animationDelay:`${d}ms`}}/>)}</span>
            <code className={`text-[10px] ${agent.textColor} font-mono`}>{thinkingText[agent.id]}</code>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {agent.capabilities.map((cap) => (
            <span key={cap} className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${agent.badgeColor}`}>{cap}</span>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-700/40">
          <span className="text-[10px] text-slate-500">{agent.tools} tools</span>
          <span className={`text-[10px] font-medium ${agent.textColor}`}>{agent.model}</span>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <div className="glass-stats rounded-xl p-4 text-center">
      <Icon size={16} className={`mx-auto ${color} mb-1.5`} />
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

export default function Team() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const t = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(t);
  }, []);

  const orchestrator = agents.find(a => a.type === 'orchestrator')!;
  const specialists = agents.filter(a => a.type === 'specialist');

  return (
    <div className={`space-y-0 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>

      {/* Header */}
      <div className={`mb-6 transition-all duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-2 mb-1">
          <Bot size={20} className="text-violet-400" />
          <h1 className="text-xl font-bold text-white">The Team</h1>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet-500/15 text-violet-300 border border-violet-500/30">
            1 Human · {agents.length} AI Agents
          </span>
        </div>
        <p className="text-sm text-slate-400 max-w-lg">One principal. Five specialist agents. All powered by Claude Sonnet.</p>
      </div>

      {/* Stats */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <StatBadge icon={Bot} value={5} label="AI Agents" color="text-violet-400" />
        <StatBadge icon={Zap} value={49} label="Total Tools" color="text-amber-400" />
        <StatBadge icon={Brain} value="Claude" label="Foundation" color="text-blue-400" />
        <StatBadge icon={Shield} value="18+" label="Yrs Exp." color="text-emerald-400" />
      </div>

      {/* Hierarchy */}
      <div className="flex flex-col items-stretch">
        <HumanCard visible={visible} />
        <Connector label="instructs" />
        <OrchestratorCard agent={orchestrator} visible={visible} />
        <Connector label="specialises" />
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ChevronRight size={14} className="text-slate-600" />
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Specialist Agents</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {specialists.map((agent, i) => (
              <SpecialistCard key={agent.id} agent={agent} index={i} visible={visible} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 mt-6 transition-all duration-500 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <Globe size={14} className="shrink-0 mt-0.5 text-slate-600" />
        <span>
          All agents powered by <span className="text-slate-400 font-medium">Claude Sonnet</span> via GitHub Copilot agent mode.
          Definitions live in <code className="text-violet-400">.github/agents/</code> — loaded automatically in this workspace.
        </span>
      </div>
    </div>
  );
}
