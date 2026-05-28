import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Cpu, PenTool, GraduationCap, BookOpen, GitBranch,
  Globe, MapPin, Building2, ExternalLink,
  Zap, Brain, ShieldCheck, Lightbulb, ListChecks, Handshake, Trophy,
  Award, Users, Layers, Palette, FileText, Send, HelpCircle, TrendingUp,
  Megaphone, GitFork, Globe2, Sparkles, Terminal, Activity, ChevronRight,
  Radio, Command, Boxes,
} from 'lucide-react';
import { maintainer } from '../data/maintainer';

/* ─── Embedded keyframes (scoped to this page) ─────────────────────────────── */
const STYLES = `
  @keyframes orbit-cw  { from { transform: rotate(0deg);   } to { transform: rotate(360deg);  } }
  @keyframes orbit-ccw { from { transform: rotate(0deg);   } to { transform: rotate(-360deg); } }
  @keyframes beacon    { 0%,100% { opacity:.15; transform:scale(1);   }
                         50%     { opacity:.55; transform:scale(1.08); } }
  @keyframes ticker    { 0%   { transform:translateX(0); }
                         100% { transform:translateX(-50%); } }
  @keyframes scan      { 0%,100%{top:-4px;opacity:0;} 20%{opacity:.4;} 80%{opacity:.4;} 99%{top:100%;} }
  @keyframes blink     { 0%,49%{opacity:1;} 50%,100%{opacity:0;} }
  @keyframes float-up  { 0%,100%{transform:translateY(0px);} 50%{transform:translateY(-6px);} }
  @keyframes shimmer-x { 0%{background-position:-200% 0;} 100%{background-position:200% 0;} }

  .orbit-cw-18  { animation: orbit-cw  18s linear infinite; }
  .orbit-ccw-12 { animation: orbit-ccw 12s linear infinite; }
  .orbit-cw-28  { animation: orbit-cw  28s linear infinite; }
  .beacon-ring  { animation: beacon 3s ease-in-out infinite; }
  .ticker-tape  { animation: ticker 30s linear infinite; }
  .scan-line    { animation: scan 4s ease-in-out infinite; }
  .cursor-blink { animation: blink 1.1s step-end infinite; }
  .float-card   { animation: float-up 6s ease-in-out infinite; }
`;

/* ─── Dot-grid background decoration ────────────────────────────────────────── */
function DotGrid({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.10) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  );
}

/* ─── Orbital avatar ring ────────────────────────────────────────────────────── */
function OrbitalAvatar({ src, name, size = 96 }: { src: string; name: string; size?: number }) {
  const pad = 28;
  const outer = size + pad * 2;
  return (
    <div className="relative flex-shrink-0" style={{ width: outer, height: outer }}>
      {/* Beacon glow */}
      <div className="beacon-ring absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.35) 30%, transparent 70%)' }} />

      {/* Outer orbit ring */}
      <div className="orbit-cw-18 absolute inset-0 rounded-full"
        style={{ border: '1px dashed rgba(139,92,246,0.25)' }}>
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/60" />
      </div>

      {/* Middle orbit ring */}
      <div className="orbit-ccw-12 absolute rounded-full"
        style={{ inset: 8, border: '1px dashed rgba(56,189,248,0.20)' }}>
        <div className="absolute top-1/4 -right-1 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-lg shadow-sky-400/60" />
      </div>

      {/* Inner orbit ring */}
      <div className="orbit-cw-28 absolute rounded-full"
        style={{ inset: 16, border: '1px solid rgba(167,139,250,0.12)' }} />

      {/* Avatar */}
      <div className="absolute"
        style={{ inset: pad, borderRadius: '50%', overflow: 'hidden',
          boxShadow: '0 0 0 2px rgba(139,92,246,0.5), 0 0 40px rgba(139,92,246,0.3)' }}>
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
    </div>
  );
}

/* ─── Stat chip ──────────────────────────────────────────────────────────────── */
function StatChip({ value, label, icon: Icon }: { value: string; label: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-slate-800/50 border border-slate-700/40 text-center w-full">
      <Icon size={13} className="text-violet-400 shrink-0" />
      <p className="text-base font-black text-white leading-none">{value}</p>
      <p className="text-[9px] text-slate-500 uppercase tracking-wide leading-tight">{label}</p>
    </div>
  );
}

/* ─── Tech pill ──────────────────────────────────────────────────────────────── */
const PILL_COLORS: Record<string, string> = {
  'Azure':        'from-blue-500/20 to-blue-500/5 border-blue-500/30 text-blue-300',
  'AWS':          'from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-300',
  'Terraform':    'from-purple-500/20 to-purple-500/5 border-purple-500/30 text-purple-300',
  'Kubernetes':   'from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-300',
  'Docker':       'from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 text-cyan-300',
  'Python':       'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30 text-yellow-300',
  'TypeScript':   'from-blue-400/20 to-blue-400/5 border-blue-400/30 text-blue-200',
  'Claude API':   'from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-300',
  'OpenAI':       'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-300',
  'GitHub Actions':'from-slate-500/20 to-slate-500/5 border-slate-500/30 text-slate-300',
};
function TechPill({ item }: { item: string }) {
  const cls = PILL_COLORS[item] ?? 'from-slate-700/40 to-slate-700/10 border-slate-600/30 text-slate-400';
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold bg-gradient-to-r border ${cls}`}>
      {item}
    </span>
  );
}

/* ─── Agent card ─────────────────────────────────────────────────────────────── */
interface AgentCardProps {
  name: string;
  role: string;
  tagline: string;
  description: string;
  capabilities: string[];
  status: 'active' | 'standby';
  activeTask: string;
  model: string;
  tools: number;
  version: string;
  icon: React.ElementType;
  accentHex: string;
  accentClass: string;
  isNew?: boolean;
  isLarge?: boolean;
  profileFile?: string;
}

const GH_BASE = 'https://github.com/ajeetchouksey/ajch_platform/blob/main/.github/agents/';

function AgentCard({
  name, role, tagline, description, capabilities, status,
  activeTask, model, tools, version, icon: Icon,
  accentHex, isNew, isLarge, profileFile,
}: AgentCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all duration-300
        hover:-translate-y-1 hover:shadow-2xl group
        ${isLarge ? 'col-span-full' : ''}`}
      style={{
        background: `linear-gradient(135deg, ${accentHex}14 0%, rgba(15,23,42,0.9) 50%)`,
        border: `1px solid ${accentHex}30`,
        boxShadow: `0 4px 32px -4px ${accentHex}20, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <style>{STYLES}</style>

      {/* Scan-line shimmer */}
      <div className="scan-line pointer-events-none absolute left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accentHex}80, transparent)` }} />

      {/* Corner dot-grid */}
      <DotGrid className="opacity-30" />

      {/* Glow blob */}
      <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20"
        style={{ background: accentHex }} />

      <div className={`relative z-10 p-5 ${isLarge ? 'grid grid-cols-1 md:grid-cols-3 gap-5' : ''}`}>
        {/* ── Header ── */}
        <div className={isLarge ? 'md:col-span-2 space-y-3' : 'space-y-3'}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${accentHex}20`, border: `1px solid ${accentHex}40` }}>
                <Icon size={18} style={{ color: accentHex }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm">{name}</h3>
                  {isNew && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider
                      bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      New
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wide mt-0.5" style={{ color: accentHex }}>
                  {role}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Status badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider
                ${status === 'active'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                  : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                {status}
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-600 bg-slate-800/60 border border-slate-700/30">
                {version}
              </span>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-[11px] font-semibold italic" style={{ color: `${accentHex}cc` }}>
            "{tagline}"
          </p>

          {/* Description */}
          <p className="text-xs text-slate-400 leading-relaxed">{description}</p>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-1.5">
            {capabilities.map(c => (
              <span key={c} className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-400
                bg-slate-800/60 border border-slate-700/40">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className={`space-y-3 ${isLarge ? '' : 'mt-3 pt-3 border-t border-slate-800/60'}`}>
          {/* Active task — terminal style */}
          <div className="rounded-xl overflow-hidden border border-slate-800/60 bg-slate-900/80">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-800/60 bg-slate-900">
              <div className="flex gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
              </div>
              <span className="text-[9px] text-slate-600 font-mono">active_task.log</span>
              <span className="ml-auto flex gap-0.5">
                {[0, 80, 160].map(d => (
                  <span key={d} className="w-0.5 h-3 rounded-full animate-bounce"
                    style={{ background: accentHex, opacity: 0.5, animationDelay: `${d}ms` }} />
                ))}
              </span>
            </div>
            <div className="px-3 py-2">
              <p className="text-[10px] font-mono text-slate-400 leading-relaxed">
                <span className="mr-1" style={{ color: `${accentHex}cc` }}>$</span>
                {activeTask}
                <span className="cursor-blink ml-0.5 inline-block w-1.5 h-3 align-middle"
                  style={{ background: accentHex }} />
              </p>
            </div>
          </div>

          {/* Model + Tools row */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Model', val: model.replace('Claude ', '') },
              { label: 'Tools', val: `${tools} available` },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-lg bg-slate-800/40 border border-slate-700/30 px-3 py-2">
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{label}</p>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {/* Profile link */}
          {profileFile && (
            <a href={GH_BASE + profileFile} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-[10px] font-semibold transition-colors duration-200 group/link"
              style={{ color: `${accentHex}aa` }}>
              <ExternalLink size={11} className="group-hover/link:translate-x-0.5 transition-transform" />
              View agent specification
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Agent cluster (lead card + its specialist sub-agents) ────────────────────── */
function AgentCluster({
  agent, subs, accentHex, accentClass, delay = 0, mounted,
}: {
  agent: Omit<AgentCardProps, 'accentHex' | 'accentClass'> & { id?: string };
  subs: SubAgentProps[];
  accentHex: string;
  accentClass: string;
  delay?: number;
  mounted: boolean;
}) {
  return (
    <div
      className={`transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}>
      <AgentCard {...agent} accentHex={accentHex} accentClass={accentClass} />

      {subs.length > 0 && (
        <div className="mt-1 ml-6 sm:ml-10">
          <div className="relative pl-4 pt-3 pb-1 border-l-2 rounded-bl-xl"
            style={{ borderColor: `${accentHex}28` }}>
            {/* Connector dot */}
            <div className="absolute -left-[5px] top-3.5 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: 'rgb(10,14,30)', borderColor: `${accentHex}55` }} />
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2.5"
              style={{ color: `${accentHex}60` }}>
              ↳ delegates to
            </p>
            <div className={`grid gap-2 ${
              subs.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-1 sm:grid-cols-2'
            }`}>
              {subs.map(sub => (
                <SubAgentCard key={sub.id} {...sub} parentColor={accentHex} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sub-agent compact card ─────────────────────────────────────────────────── */
interface SubAgentProps {
  id: string;
  name: string;
  role: string;
  tagline: string;
  capabilities: string[];
  status: 'active' | 'standby';
  icon: React.ElementType;
  parentColor?: string;
  profileFile: string;
}

function SubAgentCard({ name, role, capabilities, status, icon: Icon, parentColor = '#8b5cf6', profileFile }: SubAgentProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
      hover:-translate-y-0.5 hover:shadow-xl group"
      style={{
        background: `${parentColor}09`,
        border: `1px solid ${parentColor}22`,
        boxShadow: `0 2px 12px -4px ${parentColor}18`,
      }}>
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${parentColor}18`, border: `1px solid ${parentColor}35` }}>
        <Icon size={16} style={{ color: parentColor }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-white truncate">{name}</p>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            status === 'active' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
          }`} />
        </div>
        <p className="text-[10px] font-semibold mt-0.5" style={{ color: `${parentColor}bb` }}>{role}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          {capabilities.slice(0, 3).map(c => (
            <span key={c} className="text-[9px] px-1.5 py-0.5 rounded
              bg-slate-800/60 border border-slate-700/30 text-slate-500">
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Spec link */}
      <a href={GH_BASE + profileFile} target="_blank" rel="noopener noreferrer"
        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`View ${name} specification`}>
        <ExternalLink size={12} style={{ color: parentColor }} />
      </a>
    </div>
  );
}

/* ─── Section divider ────────────────────────────────────────────────────────── */
function SectionDivider({ label, icon: Icon, color }: { label: string; icon: React.ElementType; color: string }) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border"
        style={{ background: `${color}10`, borderColor: `${color}25` }}>
        <Icon size={12} style={{ color }} />
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${color}cc` }}>{label}</span>
      </div>
      <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
    </div>
  );
}

/* ─── Ticker tape ─────────────────────────────────────────────────────────────── */
const TICKER_ITEMS = [
  '⚡ Staff Engineer routing request',
  '🔒 AppSec Engineer: pre-flight PASS',
  '📝 Content Lead drafting article',
  '🎓 Curriculum Engineer scanning docs',
  '🚀 SRE monitoring deploy pipeline',
  '🧠 Pair Programmer awaiting session',
  '🎨 Design Systems Engineer: UX audit',
  '📊 Product Manager scoring backlog',
  '🔍 AI Researcher scanning arXiv',
];

/* ─── Pipeline steps (hero) ─────────────────────────────────────────────────── */
const PIPELINE_STEPS = [
  { icon: Cpu,         label: 'Staff Engineer',   sub: 'classifies the request, picks the domain lead', color: '#8b5cf6' },
  { icon: TrendingUp,  label: 'Product Manager',  sub: 'gates it — opens a traceable GitHub issue',     color: '#14b8a6' },
  { icon: ShieldCheck, label: 'AppSec Engineer',  sub: 'hard pre-build gate — PASS ✓ or BLOCK ✗',       color: '#ef4444' },
  { icon: GitBranch,   label: 'Domain Lead',      sub: 'implements via their own specialist sub-agents', color: '#3b82f6' },
  { icon: ShieldCheck, label: 'Post-build Audit', sub: 'AppSec re-scans every changed file',             color: '#f59e0b' },
  { icon: Zap,         label: 'SRE',              sub: 'semver release, CHANGELOG, agent versioning',   color: '#f97316' },
  { icon: Megaphone,   label: 'DevRel',           sub: 'drafts the announcement copy for human review', color: '#ec4899' },
];

const ARCH_LAYERS = [
  { label: 'Dispatch Layer',      color: '#8b5cf6', agents: ['Staff Engineer', 'Product Manager'],                          count: 2  },
  { label: 'Domain Leads',        color: '#3b82f6', agents: ['Platform Architect', 'Content Lead', 'Curriculum Eng', 'Pair Programmer'], count: 4 },
  { label: 'Platform Foundation', color: '#f59e0b', agents: ['AppSec Engineer', 'Design Systems', 'SRE', 'DevRel'],         count: 4  },
  { label: 'Specialists',         color: '#10b981', agents: ['11 sub-agents across all domain leads'],                      count: 11 },
];

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function TeamV2() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const allAgentColors: Record<string, { hex: string; cls: string }> = {
    orchestrator:     { hex: '#8b5cf6', cls: 'violet' },
    'product-owner':  { hex: '#14b8a6', cls: 'teal' },
    'platform-control':{ hex: '#3b82f6', cls: 'blue' },
    blog:             { hex: '#10b981', cls: 'emerald' },
    'exam-content':   { hex: '#f59e0b', cls: 'amber' },
    'study-companion':{ hex: '#f43f5e', cls: 'rose' },
    'security-governance':{ hex: '#f59e0b', cls: 'amber' },
    'ux-framework':   { hex: '#a855f7', cls: 'purple' },
    devops:           { hex: '#f97316', cls: 'orange' },
    'social-media':   { hex: '#ec4899', cls: 'pink' },
  };

  const agents = [
    {
      id: 'orchestrator',
      name: 'Staff Engineer',
      role: 'Chief Orchestrator',
      tagline: 'Classify. Gate. Route. Synthesize.',
      description: 'Central brain. Classifies every request, triggers the AppSec Engineer pre-flight for mutating tasks, routes to the correct domain lead. Never implements directly.',
      capabilities: ['Intent Classification', 'Security Pre-flight', 'Agent Routing', 'Synthesis'],
      status: 'active' as const,
      activeTask: 'Routing blog request → Content Lead',
      model: 'Claude Sonnet', tools: 14, version: 'v2.0.0',
      icon: Cpu, isNew: false, isLarge: true,
      profileFile: 'orchestrator.agent.md',
    },
    {
      id: 'product-owner',
      name: 'Product Manager',
      role: 'Product Lead',
      tagline: 'Roadmap. RICE. Sprints. Research.',
      description: 'Owns the "what and when". Manages GitHub Project board, RICE-scored backlog, sprint plans, and release notes.',
      capabilities: ['Roadmap', 'RICE Scoring', 'Sprint Planning', 'Research & Analysis'],
      status: 'active' as const,
      activeTask: 'Analyzing backlog — recommending sprint priorities',
      model: 'Claude Sonnet', tools: 14, version: 'v1.1.0',
      icon: TrendingUp, isNew: true, isLarge: true,
      profileFile: 'product-owner.agent.md',
    },
    {
      id: 'platform-control',
      name: 'Platform Architect',
      role: 'Architect',
      tagline: 'Architecture decisions. Build config. Feature registration.',
      description: 'Domain lead for platform concerns. Delegates routing to Platform Engineer, UI work to Frontend Engineer, UX to Design Systems Engineer.',
      capabilities: ['Architecture', 'Build Config', 'Deploy', 'Feature Registration'],
      status: 'active' as const,
      activeTask: 'Scaffolding new tools route → Platform Engineer',
      model: 'Claude Sonnet', tools: 8, version: 'v3.0.0',
      icon: GitBranch, isNew: false, isLarge: false,
      profileFile: 'platform-control.agent.md',
    },
    {
      id: 'blog',
      name: 'Content Lead',
      role: 'Storyteller',
      tagline: 'Coordinate write → validate → publish.',
      description: 'Domain lead for blog content. Orchestrates the full pipeline: Writer → AppSec Engineer → Publisher.',
      capabilities: ['Content Pipeline', 'Voice Strategy', 'Category Management'],
      status: 'active' as const,
      activeTask: 'Drafting post on AI model optimization...',
      model: 'Claude Sonnet', tools: 6, version: 'v2.0.0',
      icon: PenTool, isNew: false, isLarge: false,
      profileFile: 'blog.agent.md',
    },
    {
      id: 'exam-content',
      name: 'Curriculum Engineer',
      role: 'Curator',
      tagline: 'Research. Extract. Deduplicate. Delegate.',
      description: 'Domain lead for exam content. Handles web research, extracts concepts, delegates MCQs and notes to specialists.',
      capabilities: ['Web Research', 'Concept Extraction', 'Deduplication', 'Classification'],
      status: 'active' as const,
      activeTask: 'Scanning Anthropic docs for new CCA-F content...',
      model: 'Claude Sonnet', tools: 8, version: 'v2.0.0',
      icon: GraduationCap, isNew: false, isLarge: false,
      profileFile: 'exam-content.agent.md',
    },
    {
      id: 'study-companion',
      name: 'Pair Programmer',
      role: 'Teacher',
      tagline: '101 → 201 → 301. Meet you where you are.',
      description: 'Split into Principal Mentor (Socratic teaching) and Junior Dev (teaching-back simulation) for two-track learning.',
      capabilities: ['Expert Teaching', 'Socratic Method', 'Student Sim', 'Gap Analysis'],
      status: 'standby' as const,
      activeTask: 'Standby — awaiting study session',
      model: 'Claude Sonnet', tools: 7, version: 'v1.0.0',
      icon: Brain, isNew: false, isLarge: false,
      profileFile: 'study-companion.agent.md',
    },
    {
      id: 'security-governance',
      name: 'AppSec Engineer',
      role: 'Governance Lead',
      tagline: 'Validate. Block. Never regret.',
      description: 'Hard pre-build and post-build gate. Inspects every planned write. Returns PASS ✓ or BLOCK ✗ — no partial passes, no exceptions.',
      capabilities: ['Pre-flight Validation', 'OWASP A03/A09', 'Secrets Scan', 'Post-build Audit'],
      status: 'active' as const,
      activeTask: 'Standing by — next write request incoming',
      model: 'Claude Sonnet', tools: 5, version: 'v1.1.0',
      icon: ShieldCheck, isNew: false, isLarge: false,
      profileFile: 'security-governance.agent.md',
    },
    {
      id: 'ux-framework',
      name: 'Design Systems Engineer',
      role: 'Design System Lead',
      tagline: 'One token. Every component.',
      description: 'Owns src/components/ui/ — the typed primitive library. Zero raw Tailwind in components; all styling via design tokens.',
      capabilities: ['UI Primitives', 'Design Tokens', 'Post-build Audit', 'Component Scaffolding'],
      status: 'active' as const,
      activeTask: 'Post-build UX audit of changed components',
      model: 'Claude Sonnet', tools: 8, version: 'v1.1.0',
      icon: Palette, isNew: false, isLarge: false,
      profileFile: 'ux-framework.agent.md',
    },
    {
      id: 'devops',
      name: 'SRE',
      role: 'CI/CD Lead',
      tagline: 'Build. Tag. Deploy. Never skip the CHANGELOG.',
      description: 'Owns all GitHub Actions workflows, semver releases, and agent-file versioning. Every ship gets a version bump.',
      capabilities: ['CI/CD Pipelines', 'Semver Releases', 'Agent Versioning', 'CHANGELOG'],
      status: 'active' as const,
      activeTask: 'Monitoring deploy.yml — last deploy: main branch',
      model: 'Claude Sonnet', tools: 7, version: 'v1.0.0',
      icon: Zap, isNew: true, isLarge: false,
      profileFile: 'devops.agent.md',
    },
    {
      id: 'social-media',
      name: 'DevRel',
      role: 'Community Lead',
      tagline: 'Transform. Socialise. Never auto-post.',
      description: 'Transforms blog posts and tool releases into polished LinkedIn, Twitter/X, and Dev.to drafts. All output is human-reviewed copy.',
      capabilities: ['LinkedIn Posts', 'Twitter/X Threads', 'Dev.to Drafts', 'CCA-F Study Tips'],
      status: 'standby' as const,
      activeTask: 'Standby — awaiting content promotion request',
      model: 'Claude Sonnet', tools: 5, version: 'v1.0.0',
      icon: Megaphone, isNew: true, isLarge: false,
      profileFile: 'social-media.agent.md',
    },
  ];

  const l0Agents  = agents.filter(a => ['orchestrator', 'product-owner'].includes(a.id));
  const l1Agents  = agents.filter(a => ['platform-control', 'blog', 'exam-content', 'study-companion'].includes(a.id));
  const opsAgents = agents.filter(a => ['security-governance', 'ux-framework', 'devops', 'social-media'].includes(a.id));

  const subAgentGroups = [
    {
      parentId: 'orchestrator',
      parentName: 'Staff Engineer',
      parentColor: '#8b5cf6',
      agents: [
        {
          id: 'ai-research-tool', name: 'AI Researcher', role: 'Research & Intelligence',
          tagline: 'Fetch. Synthesise. Surface signal.',
          capabilities: ['arXiv Scan', 'Model Benchmarks', 'Tool Discovery', 'Trend Synthesis'],
          status: 'standby' as const, icon: Globe2,
          profileFile: 'ai-research-tool.agent.md',
        },
      ],
    },
    {
      parentId: 'product-owner',
      parentName: 'Product Manager',
      parentColor: '#14b8a6',
      agents: [
        {
          id: 'scrum-master', name: 'Delivery Manager', role: 'Sprint Facilitator',
          tagline: 'Ceremonies. Velocity. Retros.',
          capabilities: ['Sprint Planning', 'Retrospectives', 'Burndown', 'Backlog Grooming'],
          status: 'standby' as const, icon: ListChecks,
          profileFile: 'scrum-master.agent.md',
        },
      ],
    },
    {
      parentId: 'platform-control',
      parentName: 'Platform Architect',
      parentColor: '#3b82f6',
      agents: [
        {
          id: 'routing', name: 'Platform Engineer', role: 'Routing & Navigation',
          tagline: 'Routes, nav entries, and lazy-loaded pages.',
          capabilities: ['React Router', 'Lazy Loading', 'Nav Registration', 'Page Scaffold'],
          status: 'active' as const, icon: GitBranch,
          profileFile: 'routing.agent.md',
        },
        {
          id: 'component-builder', name: 'Frontend Engineer', role: 'UI Components',
          tagline: 'Build typed primitives. Zero raw Tailwind.',
          capabilities: ['React Components', 'TypeScript', 'Design Tokens', 'Accessibility'],
          status: 'active' as const, icon: Layers,
          profileFile: 'component-builder.agent.md',
        },
      ],
    },
    {
      parentId: 'blog',
      parentName: 'Content Lead',
      parentColor: '#10b981',
      agents: [
        {
          id: 'content-writer', name: 'Tech Writer', role: 'Blog Author',
          tagline: 'Draft, refine, and pass to the gate.',
          capabilities: ['Technical Writing', 'SEO Copy', 'Code Samples', 'Markdown'],
          status: 'active' as const, icon: FileText,
          profileFile: 'content-writer.agent.md',
        },
        {
          id: 'content-publisher', name: 'Release Engineer', role: 'Publishing Pipeline',
          tagline: 'Validate metadata. Write index. Ship.',
          capabilities: ['JSON Metadata', 'Index Update', 'Slug Generation', 'Publish Gate'],
          status: 'active' as const, icon: Send,
          profileFile: 'content-publisher.agent.md',
        },
      ],
    },
    {
      parentId: 'exam-content',
      parentName: 'Curriculum Engineer',
      parentColor: '#f59e0b',
      agents: [
        {
          id: 'question-generator', name: 'Assessment Engineer', role: 'MCQ Generator',
          tagline: 'Stem. Distractors. Rationale. Deduplicate.',
          capabilities: ['MCQ Authoring', 'Distractors', 'Rationale', 'Domain Mapping'],
          status: 'active' as const, icon: HelpCircle,
          profileFile: 'question-generator.agent.md',
        },
        {
          id: 'study-notes', name: 'Docs Engineer', role: 'Notes Author',
          tagline: 'Structured notes in Markdown. Always cite the source.',
          capabilities: ['Markdown Notes', 'Source Citation', 'Domain Structuring', 'Cross-refs'],
          status: 'active' as const, icon: BookOpen,
          profileFile: 'study-notes.agent.md',
        },
      ],
    },
    {
      parentId: 'study-companion',
      parentName: 'Pair Programmer',
      parentColor: '#f43f5e',
      agents: [
        {
          id: 'expert-teacher', name: 'Principal Mentor', role: 'Socratic Teacher',
          tagline: 'Ask before telling. Guide, never hand-hold.',
          capabilities: ['Socratic Method', 'Concept Depth', 'Exam Traps', 'Gap Analysis'],
          status: 'active' as const, icon: Lightbulb,
          profileFile: 'expert-teacher.agent.md',
        },
        {
          id: 'student-simulator', name: 'Junior Dev', role: '101 → 301 Simulator',
          tagline: 'Be the student. Force the teacher to think.',
          capabilities: ['Teaching-back Sim', '101/201/301 Mode', 'Intentional Gaps', 'Feedback'],
          status: 'standby' as const, icon: Bot,
          profileFile: 'student-simulator.agent.md',
        },
      ],
    },
    {
      parentId: 'security-governance',
      parentName: 'AppSec Engineer',
      parentColor: '#ef4444',
      agents: [
        {
          id: 'ux-diagram-validator', name: 'QA Engineer', role: 'UX Audit Specialist',
          tagline: 'Catch design-system drift before it ships.',
          capabilities: ['Component Audit', 'Token Compliance', 'Accessibility Check', 'Diff Report'],
          status: 'active' as const, icon: ShieldCheck,
          profileFile: 'ux-diagram-validator.agent.md',
        },
      ],
    },
  ];

  return (
    <div className="relative min-h-screen">
      <style>{STYLES}</style>

      {/* ════════════════════════════════════════════════════════════
          HERO — Cosmic constellation header
      ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden rounded-2xl mb-10">
        <DotGrid />

        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, #38bdf8, transparent 70%)' }} />

        {/* Scattered constellation dots */}
        {[
          { top: '15%', left: '8%',  size: 3, delay: '0s'   },
          { top: '60%', left: '15%', size: 2, delay: '0.4s' },
          { top: '25%', left: '88%', size: 3, delay: '0.8s' },
          { top: '75%', left: '82%', size: 2, delay: '1.2s' },
          { top: '45%', left: '4%',  size: 2, delay: '0.6s' },
          { top: '10%', left: '55%', size: 2, delay: '1.5s' },
          { top: '80%', left: '45%', size: 3, delay: '0.2s' },
        ].map((dot, i) => (
          <div key={i} className="pointer-events-none absolute rounded-full animate-pulse"
            style={{ top: dot.top, left: dot.left, width: dot.size, height: dot.size,
              background: i % 2 ? '#a78bfa' : '#38bdf8', animationDelay: dot.delay }} />
        ))}

        <div className="relative z-10 px-6 py-10 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 xl:gap-16 items-start">

            {/* ─ Left: headline + pipeline flow ─ */}
            <div>
              <p className="page-eyebrow mb-3">Human + AI</p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Meet the <span className="heading-gradient">Team</span>
              </h1>
              <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-1 font-medium">
                One human. Twenty-one specialised AI agents.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Every feature on this platform ships through a gated, seven-step pipeline —
                from a single intent to a version-tagged release.{' '}
                <span className="font-black" style={{
                  background: 'linear-gradient(90deg, #38bdf8, #60a5fa)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Agent speed.</span>
                {' '}
                <span className="font-black" style={{
                  background: 'linear-gradient(90deg, #a78bfa, #c084fc)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>Human control.</span>
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 mb-4">
                How a request becomes a shipped feature
              </p>
              <div className="space-y-1">
                {PIPELINE_STEPS.map(({ icon: I, label, sub, color }, idx) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                        <I size={14} style={{ color }} />
                      </div>
                      {idx < PIPELINE_STEPS.length - 1 && (
                        <div className="w-px h-3 mt-0.5"
                          style={{ background: `linear-gradient(${color}50, transparent)` }} />
                      )}
                    </div>
                    <div className="pt-1.5 pb-1 leading-snug">
                      <span className="text-xs font-bold text-white">{label}</span>
                      <span className="text-xs text-slate-500"> — {sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ─ Right: architecture card (hidden on mobile) ─ */}
            <div className="hidden lg:block">
              <div className="rounded-2xl overflow-hidden"
                style={{
                  background: 'linear-gradient(160deg, rgba(139,92,246,0.09) 0%, rgba(15,23,42,0.97) 100%)',
                  border: '1px solid rgba(139,92,246,0.20)',
                  boxShadow: '0 8px 40px -12px rgba(139,92,246,0.20)',
                }}>
                {/* Terminal chrome */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/50">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono ml-1">team_architecture</span>
                </div>
                {/* Layers */}
                <div className="p-4 space-y-2.5">
                  {ARCH_LAYERS.map(layer => (
                    <div key={layer.label} className="rounded-xl p-3"
                      style={{ background: `${layer.color}0b`, border: `1px solid ${layer.color}22` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: layer.color }}>
                          {layer.label}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                          style={{ color: `${layer.color}aa`, background: `${layer.color}18` }}>
                          {layer.count} agents
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {layer.agents.map(a => (
                          <span key={a} className="text-[10px] text-slate-400 px-2 py-0.5 rounded-md
                            bg-slate-800/60 border border-slate-700/30">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-slate-800/40 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-600">total_agents</span>
                  <span className="text-sm font-black font-mono" style={{ color: '#8b5cf6' }}>21</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats chips — full width below the grid */}
          <div className="flex flex-wrap gap-3 mt-8">
            {[
              { icon: Activity, label: '14 agents active',          color: '#10b981' },
              { icon: Radio,    label: '7 standby',                  color: '#64748b' },
              { icon: Command,  label: '3 orchestration layers',     color: '#8b5cf6' },
              { icon: Boxes,    label: '21 total — all open-source', color: '#38bdf8' },
            ].map(({ icon: I, label, color }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium
                bg-slate-800/60 border border-slate-700/40 text-slate-300">
                <I size={11} style={{ color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom ticker tape */}
        <div className="relative overflow-hidden border-t border-slate-800/40 bg-slate-900/40 py-2">
          <div className="ticker-tape flex gap-12 whitespace-nowrap w-max text-[10px] font-mono text-slate-500">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-violet-500 animate-pulse" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HUMAN COMMANDER — Maintainer profile
      ════════════════════════════════════════════════════════════ */}
      <SectionDivider label="Mission Commander" icon={Users} color="#8b5cf6" />

      <section className={`transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(15,23,42,0.95) 45%, rgba(56,189,248,0.08) 100%)',
            border: '1px solid rgba(139,92,246,0.25)',
            boxShadow: '0 8px 64px -16px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}>
          <DotGrid className="opacity-20" />

          {/* Top accent line */}
          <div className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, #7c3aed, #38bdf8, #7c3aed)' }} />

          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Avatar + Identity */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-center sm:items-start lg:items-center gap-6 lg:gap-4 lg:w-56 shrink-0">
                <OrbitalAvatar src={maintainer.avatar} name={maintainer.name} size={80} />
                <div className="text-center lg:text-center">
                  <h2 className="text-xl font-black text-white">{maintainer.name}</h2>
                  <p className="text-xs font-semibold text-violet-400 mt-1">{maintainer.title}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-2 text-slate-500 text-[10px]">
                    <MapPin size={10} />
                    <span>{maintainer.location}</span>
                  </div>
                  {/* Social links */}
                  <div className="flex items-center justify-center gap-2 mt-3">
                    {maintainer.links.map(link => (
                      <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                        aria-label={link.label}
                        className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center
                          text-slate-500 hover:text-violet-400 hover:border-violet-500/40 transition-colors">
                        {link.icon === 'github' && <GitFork size={13} />}
                        {link.icon === 'linkedin' && <Globe2 size={13} />}
                        {link.icon === 'globe' && <Globe size={13} />}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 space-y-5">
                {/* Tagline */}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Mission Statement</p>
                  <p className="text-sm italic text-slate-300 leading-relaxed border-l-2 border-violet-500 pl-3">
                    "{maintainer.tagline}"
                  </p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {maintainer.stats.map(stat => (
                    <StatChip key={stat.label} value={stat.value} label={stat.label} icon={Award} />
                  ))}
                </div>

                {/* Certifications */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {maintainer.certifications.map(cert => (
                      <div key={cert.title} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
                        bg-slate-800/60 border border-slate-700/40">
                        <Award size={10} className="text-violet-400 shrink-0" />
                        <span className="text-slate-300 font-medium">{cert.title}</span>
                        <span className="text-slate-600">· {cert.issuer} {cert.year}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech stack */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Technology Stack</p>
                  <div className="space-y-2">
                    {maintainer.techStack.map(group => (
                      <div key={group.category} className="flex items-start gap-2 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider pt-1 w-28 shrink-0">
                          {group.category}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {group.items.map(item => <TechPill key={item} item={item} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right column: projects + workflow */}
              <div className="lg:w-64 space-y-5 shrink-0">
                {/* Featured projects */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Featured Projects</p>
                  <div className="space-y-3">
                    {maintainer.featuredProjects.map(proj => (
                      <a key={proj.name} href={proj.url} target="_blank" rel="noopener noreferrer"
                        className="block p-3 rounded-xl bg-slate-800/40 border border-slate-700/40
                          hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-200 group">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-semibold text-white">{proj.name}</p>
                          <ExternalLink size={10} className="text-slate-600 group-hover:text-violet-400 mt-0.5 shrink-0 transition-colors" />
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{proj.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.tech.map(t => (
                            <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/60 border border-slate-600/30 text-slate-500">
                              {t}
                            </span>
                          ))}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* How I work */}
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">How I Work</p>
                  <div className="space-y-1">
                    {[
                      { icon: Lightbulb,  text: 'Idea sparks', color: '#eab308' },
                      { icon: ListChecks, text: 'Plan & structure', color: '#3b82f6' },
                      { icon: Handshake,  text: 'Delegate to agents', color: '#8b5cf6' },
                      { icon: Trophy,     text: 'Ship the outcome', color: '#10b981' },
                    ].map(({ icon: I, text, color }, i, arr) => (
                      <div key={text} className="flex items-center gap-3">
                        <div className="flex flex-col items-center gap-0">
                          <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                            style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                            <I size={13} style={{ color }} />
                          </div>
                          {i < arr.length - 1 && (
                            <div className="w-px h-3" style={{ background: `linear-gradient(${color}, transparent)` }} />
                          )}
                        </div>
                        <p className="text-xs text-slate-400">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          How We Work — Collaboration Model
      ════════════════════════════════════════════════════════════ */}
      <SectionDivider label="How We Work" icon={Handshake} color="#8b5cf6" />

      <section className={`transition-all duration-700 mb-10 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Intro */}
        <div className="mb-8">
          <p className="page-eyebrow mb-2">The Model</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-3">
            One Team. <span className="heading-gradient">One Platform.</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
            This platform isn't built by AI doing its thing while a human watches.
            It's not vibe coding. It's a genuine collaboration — both sides have defined roles,
            clear accountability, and a shared goal. The human sets direction and approves every outcome.
            The agents execute, validate, and surface every decision for review.
            <span className="text-slate-300 font-medium"> Neither side ships anything alone.</span>
          </p>
        </div>

        {/* Human + AI role split */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-stretch mb-8">
          {/* Human role */}
          <div className="rounded-2xl p-5 space-y-3"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.10) 0%, rgba(15,23,42,0.95) 100%)',
              border: '1px solid rgba(139,92,246,0.25)',
            }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#8b5cf620', border: '1px solid #8b5cf640' }}>
                <Users size={17} style={{ color: '#8b5cf6' }} />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">The Human</p>
                <p className="text-[10px] text-slate-500">Ajeet Kumar Chouksey</p>
              </div>
            </div>
            {[
              { label: 'Intent & Vision',   sub: 'Decides what to build, why it matters, and what success looks like' },
              { label: 'Judgment',          sub: 'Reviews every diff, every draft, every output before it ships' },
              { label: 'Architecture',      sub: 'Sets structural decisions, design principles, and quality bars' },
              { label: 'Final Approval',    sub: 'Owns the merge, the publish, the release — always explicit sign-off' },
              { label: 'Accountability',    sub: 'Maintains the backlog, the roadmap, and the team standards' },
            ].map(({ label, sub }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-200">{label}</span>
                  <span className="text-xs text-slate-500"> — {sub}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Plus connector */}
          <div className="hidden md:flex flex-col items-center justify-center gap-2 px-2">
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-slate-400
              bg-slate-800 border border-slate-700/60 shrink-0">+</div>
            <div className="w-px flex-1 bg-gradient-to-b from-transparent via-slate-700 to-transparent" />
          </div>

          {/* AI role */}
          <div className="rounded-2xl p-5 space-y-3"
            style={{
              background: 'linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(15,23,42,0.95) 100%)',
              border: '1px solid rgba(56,189,248,0.20)',
            }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: '#38bdf820', border: '1px solid #38bdf840' }}>
                <Bot size={17} style={{ color: '#38bdf8' }} />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-wider">The Agents</p>
                <p className="text-[10px] text-slate-500">21 specialised AI agents</p>
              </div>
            </div>
            {[
              { label: 'Speed & Consistency', sub: 'Executes at agent speed, follows conventions precisely every time' },
              { label: 'Breadth',             sub: 'Handles code, content, security, docs, and social simultaneously' },
              { label: 'Specialisation',      sub: 'Each agent owns one domain — no context-switching, no drift' },
              { label: 'Auditability',        sub: 'Behaviour is version-controlled in .github/agents/ — fully reproducible' },
              { label: 'Safety',              sub: 'Every write is gated; every output is surfaced for human review' },
            ].map(({ label, sub }) => (
              <div key={label} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 mt-1.5 shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-slate-200">{label}</span>
                  <span className="text-xs text-slate-500"> — {sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collaboration patterns */}
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 mb-4">
          Collaboration Patterns
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
          {[
            {
              icon: Terminal, color: '#8b5cf6', label: 'Pair Programmer',
              who: 'Human + Staff Engineer → Domain Lead',
              detail: 'Human writes the intent and acceptance criteria. AI implements and opens a PR. Human reviews every diff. Nothing merges without explicit approval.',
            },
            {
              icon: PenTool, color: '#10b981', label: 'Co-Author',
              who: 'Human + Content Lead → Tech Writer',
              detail: 'Human defines the brief, audience, and tone. Tech Writer drafts. AppSec gates. Human edits for voice and judgment. Only then: publish.',
            },
            {
              icon: Building2, color: '#3b82f6', label: 'Architect & Builders',
              who: 'Human + Platform Architect → Specialists',
              detail: 'Human sets architecture decisions and feature specs. Domain leads coordinate their sub-agents to build. Human approves the final output.',
            },
            {
              icon: ShieldCheck, color: '#ef4444', label: 'Security Partners',
              who: 'Human + AppSec Engineer + QA',
              detail: 'AppSec runs a hard pre-flight before every write and a post-build audit after every change. Human reviews any BLOCK decision before retrying.',
            },
            {
              icon: ListChecks, color: '#14b8a6', label: 'Sprint Partners',
              who: 'Human + Product Manager + Delivery Manager',
              detail: 'PM manages a RICE-scored backlog. Human approves sprint priorities. Delivery Manager tracks velocity. Human leads the retro — every cycle.',
            },
            {
              icon: Brain, color: '#f43f5e', label: 'Teacher & Student',
              who: 'Human ↔ Pair Programmer (both modes)',
              detail: 'Principal Mentor uses Socratic questioning to deepen understanding. Junior Dev flips the dynamic — simulating a student so the human practises teaching-back.',
            },
          ].map(({ icon: I, color, label, who, detail }) => (
            <div key={label} className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{ background: `${color}09`, border: `1px solid ${color}22` }}>
              <div className="flex items-start gap-3 mb-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
                  <I size={14} style={{ color }} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{label}</p>
                  <p className="text-[9px] font-mono mt-0.5" style={{ color: `${color}99` }}>{who}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{detail}</p>
            </div>
          ))}
        </div>

        {/* Ground rules */}
        <div className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.4) 100%)',
            border: '1px solid rgba(100,116,139,0.20)',
          }}>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 mb-3">
            The Ground Rules
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {[
              'Every file write triggers a two-pass security gate (pre-build + post-build)',
              'No agent auto-publishes — human reviews all output before it ships',
              'All work is traceable to a GitHub issue — no work without a ticket',
              'Every decision point surfaces for explicit human review and approval',
              'Agent behaviour is version-controlled in .github/agents/ and auditable',
              'Humans set the quality bar — agents are held to it on every output',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span className="text-[10px] font-bold text-slate-600 mt-0.5 font-mono shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          Dispatch Layer — L0 Command (each lead + their delegates)
      ════════════════════════════════════════════════════════════ */}
      <SectionDivider label="Dispatch Layer" icon={Command} color="#8b5cf6" />
      <div className="space-y-6">
        {(() => {
          const subMap = Object.fromEntries(subAgentGroups.map(g => [g.parentId, g.agents] as [string, SubAgentProps[]]));
          return l0Agents.map((agent, i) => {
            const { hex, cls } = allAgentColors[agent.id] ?? { hex: '#8b5cf6', cls: 'violet' };
            return (
              <AgentCluster
                key={agent.id}
                agent={agent}
                subs={subMap[agent.id] ?? []}
                accentHex={hex}
                accentClass={cls}
                delay={i * 140}
                mounted={mounted}
              />
            );
          });
        })()}
      </div>

      {/* ════════════════════════════════════════════════════════════
          Domain Leads + their Specialists
      ════════════════════════════════════════════════════════════ */}
      <SectionDivider label="Domain Leads & Specialists" icon={GitBranch} color="#3b82f6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {(() => {
          const subMap = Object.fromEntries(subAgentGroups.map(g => [g.parentId, g.agents] as [string, SubAgentProps[]]));
          return l1Agents.map((agent, i) => {
            const { hex, cls } = allAgentColors[agent.id] ?? { hex: '#3b82f6', cls: 'blue' };
            return (
              <AgentCluster
                key={agent.id}
                agent={agent}
                subs={subMap[agent.id] ?? []}
                accentHex={hex}
                accentClass={cls}
                delay={200 + i * 100}
                mounted={mounted}
              />
            );
          });
        })()}
      </div>

      {/* ════════════════════════════════════════════════════════════
          Platform Foundation — Cross-Cutting & Ops + their delegates
      ════════════════════════════════════════════════════════════ */}
      <SectionDivider label="Platform Foundation" icon={Sparkles} color="#f59e0b" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start mb-12">
        {(() => {
          const subMap = Object.fromEntries(subAgentGroups.map(g => [g.parentId, g.agents] as [string, SubAgentProps[]]));
          return opsAgents.map((agent, i) => {
            const { hex, cls } = allAgentColors[agent.id] ?? { hex: '#f59e0b', cls: 'amber' };
            return (
              <AgentCluster
                key={agent.id}
                agent={agent}
                subs={subMap[agent.id] ?? []}
                accentHex={hex}
                accentClass={cls}
                delay={400 + i * 80}
                mounted={mounted}
              />
            );
          });
        })()}
      </div>

      {/* ════════════════════════════════════════════════════════════
          Footer CTA
      ════════════════════════════════════════════════════════════ */}
      <div className="text-center py-10 border-t border-slate-800/40">
        <p className="text-slate-600 text-xs mb-4 font-mono">
          All agents are defined in <code className="text-violet-500">.github/agents/</code> —
          open-sourced and version-controlled.
        </p>
        <div className="flex items-center justify-center gap-3">
          <a href="https://github.com/ajeetchouksey/ajch_platform/tree/main/.github/agents"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
              bg-slate-800 border border-slate-700/50 text-slate-300
              hover:border-violet-500/40 hover:text-violet-300 transition-colors duration-200">
            <GitFork size={13} /> View agent specs on GitHub
          </a>
          <Link to="/team"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
              bg-slate-800/40 border border-slate-700/30 text-slate-500
              hover:text-slate-300 transition-colors duration-200">
            <ChevronRight size={13} /> Classic team view
          </Link>
        </div>
      </div>
    </div>
  );
}
