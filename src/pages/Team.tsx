import { useState, useEffect, useRef } from 'react';
import { Bot, Cpu, PenTool, GraduationCap, BookOpen, GitBranch, Zap, Shield, Globe, Brain, ChevronRight } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  tagline: string;
  description: string;
  color: string;
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

const agents: Agent[] = [
  {
    id: 'orchestrator',
    name: 'Platform Orchestrator',
    role: 'Commander',
    tagline: 'Analyzes. Delegates. Synthesizes.',
    description:
      'The central brain of the platform. Receives every request, classifies intent, and routes work to the right specialist. Never implements — always coordinates.',
    color: 'violet',
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
    description:
      'Owns the entire platform shell — routing, navigation, layout, design system, and feature modules. If you see it rendered, this agent designed it.',
    color: 'blue',
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
    description:
      'Creates, edits, and publishes technical blog content. Converts source material into platform-formatted articles with the right voice, structure, and SEO metadata.',
    color: 'emerald',
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
    description:
      'Reads Anthropic docs and technical sources, generates MCQ questions with explanations, expands study notes, and deduplicates against existing content.',
    color: 'amber',
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
    description:
      'Multi-role study partner for the CCA-F exam. Shifts between Expert Teacher and student personas at three difficulty levels to test knowledge gaps from every angle.',
    color: 'rose',
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
      {active && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
    </span>
  );
}

function OrchestratorCard({ agent, isVisible }: { agent: Agent; isVisible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const Icon = agent.icon;

  return (
    <div
      className={`relative glass-card rounded-2xl p-6 border ${agent.borderColor} transition-all duration-500 cursor-default
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}
        ${hovered ? `shadow-2xl ${agent.glowColor}` : ''}
      `}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${agent.bgGradient} pointer-events-none`} />

      {/* Commander badge */}
      <div className="absolute -top-3 left-6">
        <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${agent.badgeColor}`}>
          ⚡ Commander
        </span>
      </div>

      <div className="relative flex flex-col md:flex-row md:items-start gap-6 pt-2">
        {/* Avatar */}
        <div className={`shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.bgGradient} border ${agent.borderColor} flex items-center justify-center shadow-lg ${hovered ? agent.glowColor : ''} transition-shadow duration-300`}>
          <Icon size={28} className={agent.textColor} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-bold text-white">{agent.name}</h3>
            <div className="flex items-center gap-1.5">
              <PulsingDot active={agent.status === 'active'} />
              <span className="text-xs text-slate-500">{agent.status === 'active' ? 'Active' : 'Standby'}</span>
            </div>
          </div>
          <p className={`text-sm font-medium ${agent.textColor} mb-2`}>{agent.tagline}</p>
          <p className="text-sm text-slate-400 leading-relaxed">{agent.description}</p>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-2 mt-4">
            {agent.capabilities.map((cap) => (
              <span key={cap} className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${agent.badgeColor}`}>
                {cap}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="shrink-0 flex flex-row md:flex-col gap-4 md:gap-3 text-center">
          <div>
            <div className={`text-2xl font-bold ${agent.textColor}`}>{agent.tools}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Tools</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-300">4</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Agents</div>
          </div>
          <div>
            <div className={`text-xs font-semibold px-2 py-1 rounded-lg border ${agent.badgeColor}`}>
              {agent.model}
            </div>
          </div>
        </div>
      </div>

      {/* Connection lines to specialists */}
      <div className="relative mt-6 flex items-center gap-2">
        <div className={`h-px flex-1 bg-gradient-to-r from-transparent via-${agent.color}-500/30 to-transparent`} />
        <span className="text-[10px] text-slate-600 uppercase tracking-widest">delegates to</span>
        <div className={`h-px flex-1 bg-gradient-to-r from-transparent via-${agent.color}-500/30 to-transparent`} />
      </div>
      <div className="flex justify-around mt-3">
        {agents.filter(a => a.type === 'specialist').map((s) => {
          const SIcon = s.icon;
          return (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.bgGradient} border ${s.borderColor} flex items-center justify-center`}>
                <SIcon size={14} className={s.textColor} />
              </div>
              <span className={`text-[9px] ${s.textColor} font-medium`}>{s.role}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AgentCard({ agent, index, isVisible }: { agent: Agent; index: number; isVisible: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const Icon = agent.icon;

  useEffect(() => {
    if (hovered) {
      const t = setTimeout(() => setShowThinking(true), 300);
      return () => clearTimeout(t);
    } else {
      setShowThinking(false);
    }
  }, [hovered]);

  const thinkingTexts: Record<string, string> = {
    'platform-control': '> Analyzing routing architecture...',
    blog: '> Fetching source content...',
    'exam-content': '> Scanning for duplicates...',
    'study-companion': '> Switching to 101 mode...',
  };

  return (
    <div
      className={`relative glass-card rounded-xl p-5 border ${agent.borderColor} transition-all duration-500 cursor-default group
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${hovered ? `shadow-xl ${agent.glowColor} -translate-y-1` : ''}
      `}
      style={{ transitionDelay: `${index * 80}ms` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${agent.bgGradient} pointer-events-none transition-opacity duration-300 ${hovered ? 'opacity-100' : 'opacity-60'}`} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${agent.bgGradient} border ${agent.borderColor} flex items-center justify-center transition-transform duration-300 ${hovered ? 'scale-110' : ''}`}>
            <Icon size={20} className={agent.textColor} />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <PulsingDot active={agent.status === 'active'} />
              <span className="text-[10px] text-slate-500">{agent.status === 'active' ? 'Active' : 'Standby'}</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${agent.badgeColor}`}>
              {agent.role}
            </span>
          </div>
        </div>

        {/* Name + tagline */}
        <h3 className={`font-bold text-white mb-1 group-hover:${agent.textColor} transition-colors`}>{agent.name}</h3>
        <p className={`text-xs ${agent.textColor} mb-3 font-medium`}>{agent.tagline}</p>
        <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">{agent.description}</p>

        {/* Thinking animation on hover */}
        <div className={`overflow-hidden transition-all duration-300 ${showThinking ? 'max-h-8 opacity-100 mb-3' : 'max-h-0 opacity-0'}`}>
          <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-lg px-3 py-1.5">
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
            <code className={`text-[10px] ${agent.textColor} font-mono`}>{thinkingTexts[agent.id]}</code>
          </div>
        </div>

        {/* Capabilities */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {agent.capabilities.map((cap) => (
            <span key={cap} className={`px-2 py-0.5 rounded text-[10px] font-medium border ${agent.badgeColor}`}>
              {cap}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between pt-3 border-t border-slate-700/40`}>
          <span className="text-[10px] text-slate-500">{agent.tools} tools available</span>
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
      <div className={`text-xl font-bold text-white`}>{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </div>
  );
}

export default function Team() {
  const [mounted, setMounted] = useState(false);
  const [visibleCards, setVisibleCards] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const t = setTimeout(() => setVisibleCards(true), 200);
    return () => clearTimeout(t);
  }, []);

  const orchestrator = agents.find(a => a.type === 'orchestrator')!;
  const specialists = agents.filter(a => a.type === 'specialist');

  return (
    <div className={`space-y-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>

      {/* Header */}
      <div className={`transition-all duration-500 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="flex items-center gap-2 mb-2">
          <Bot size={22} className="text-violet-400" />
          <h1 className="text-2xl font-bold text-white">The AI Team</h1>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet-500/15 text-violet-300 border border-violet-500/30">
            {agents.length} Agents
          </span>
        </div>
        <p className="text-sm text-slate-400 max-w-xl">
          Specialist AI agents built on Claude Sonnet, each owning a distinct domain of the platform.
          Coordinated by the Orchestrator — every task routes to exactly the right agent.
        </p>
      </div>

      {/* Stats row */}
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 transition-all duration-500 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <StatBadge icon={Bot} value={5} label="Agents" color="text-violet-400" />
        <StatBadge icon={Zap} value={49} label="Total Tools" color="text-amber-400" />
        <StatBadge icon={Brain} value="Claude" label="Foundation" color="text-blue-400" />
        <StatBadge icon={Shield} value="100%" label="Uptime" color="text-emerald-400" />
      </div>

      {/* Orchestrator */}
      <div className={`transition-all duration-500 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <OrchestratorCard agent={orchestrator} isVisible={visibleCards} />
      </div>

      {/* Specialists grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight size={16} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Specialist Agents</span>
        </div>
        <div ref={gridRef} className="grid sm:grid-cols-2 gap-4">
          {specialists.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} isVisible={visibleCards} />
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className={`flex items-start gap-3 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 transition-all duration-500 delay-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <Globe size={14} className="shrink-0 mt-0.5 text-slate-600" />
        <span>
          All agents are powered by <span className="text-slate-400 font-medium">Claude Sonnet</span> via GitHub Copilot agent mode.
          Agent definitions live in <code className="text-violet-400">.github/agents/</code> and are loaded automatically when working in this workspace.
        </span>
      </div>
    </div>
  );
}
