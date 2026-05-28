import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench, Terminal, Hash, Eye, Server, FileText,
  Calculator, Layers, FileJson,
} from 'lucide-react';

interface ToolDef {
  icon: React.ElementType;
  label: string;
  desc: string;
  href?: string;
  live?: boolean;
  category: 'prompting' | 'tokens' | 'mcp' | 'cost' | 'planned';
}

const TOOLS: ToolDef[] = [
  {
    icon: FileText,
    label: 'System Prompt Builder',
    href: '/tools/system-prompt-builder',
    live: true,
    category: 'prompting',
    desc: 'Assemble production-ready system prompts with guided fields, Claude XML tags, and live preview.',
  },
  {
    icon: Hash,
    label: 'Token Counter',
    href: '/tools/token-counter',
    live: true,
    category: 'tokens',
    desc: 'Count tokens per section for Claude and GPT models with a live budget bar and cost estimate.',
  },
  {
    icon: Eye,
    label: 'Context Visualizer',
    href: '/tools/context-visualizer',
    live: true,
    category: 'tokens',
    desc: 'See how your context window fills up across system, user, and assistant message turns.',
  },
  {
    icon: Server,
    label: 'MCP Scaffold',
    href: '/tools/mcp-scaffold',
    live: true,
    category: 'mcp',
    desc: 'Generate MCP server boilerplate from a config spec — TypeScript or Python, ready to run.',
  },
  {
    icon: Calculator,
    label: 'Model Cost Calculator',
    href: '/tools/model-cost-calc',
    live: true,
    category: 'cost',
    desc: 'Compare token pricing across Claude, GPT-4o, and Gemini with a real-time cost table.',
  },
  {
    icon: FileJson,
    label: 'Tool Schema Builder',
    href: '/tools/tool-schema-builder',
    live: true,
    category: 'mcp',
    desc: 'Build valid MCP tool definitions visually — live JSON preview and TypeScript interface export.',
  },
  {
    icon: Layers,
    label: 'RAG Chunk Visualizer',
    category: 'planned',
    desc: 'Visualise how chunking strategies split your text — coming in v2.3.',
  },
  {
    icon: Terminal,
    label: 'Prompt Tester',
    category: 'planned',
    desc: 'Test prompts live with your own API key — requires BYOK proxy (planned v2.4).',
  },
];

const LIVE_TOOLS = TOOLS.filter(t => t.live && t.href);

const CATEGORY_LABELS: Record<string, string> = {
  prompting: 'Prompting',
  tokens:    'Tokens',
  mcp:       'MCP',
  cost:      'Cost',
};

export default function Tools() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const liveTools    = TOOLS.filter(t => t.live);
  const plannedTools = TOOLS.filter(t => !t.live);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero */}
      <div className={`text-center py-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <Wrench size={28} className="text-violet-400" />
        </div>
        <p className="page-eyebrow">Developer Tools</p>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          AI <span className="heading-gradient">Tools</span>
        </h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          Client-side utilities for prompt engineering, token counting, MCP scaffolding, and model cost analysis.
          Zero network requests — everything runs in your browser.
        </p>
      </div>

      {/* ── Tools submenu nav ──────────────────────────────────────────────── */}
      <nav
        aria-label="Tools navigation"
        className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: '100ms' }}
      >
        <div className="glass-card glass-edge rounded-xl p-3">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-1 mb-2">Quick access</p>
          <div className="flex flex-wrap gap-2" role="list">
            {LIVE_TOOLS.map(t => (
              <Link
                key={t.href}
                to={t.href!}
                role="listitem"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-violet-500/50 hover:text-violet-300 hover:bg-violet-500/5 transition-colors whitespace-nowrap"
              >
                <t.icon size={12} aria-hidden="true" />
                {t.label}
                {t.category !== 'planned' && (
                  <span className="text-[8px] font-bold px-1 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-wide leading-none">
                    {CATEGORY_LABELS[t.category] ?? ''}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Live tools grid ────────────────────────────────────────────────── */}
      <section aria-labelledby="live-tools-heading">
        <h2
          id="live-tools-heading"
          className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 px-1"
        >
          Live tools — {liveTools.length} available
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveTools.map(({ icon: Icon, label, desc, href, category }, idx) => (
            <Link
              key={label}
              to={href!}
              className={`glass-card glass-edge rounded-xl p-5 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-500 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${200 + idx * 80}ms` }}
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
                <Icon size={16} className="text-violet-400" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-slate-200">{label}</h3>
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-wide">
                  {CATEGORY_LABELS[category] ?? 'Live'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Planned tools ─────────────────────────────────────────────────── */}
      {plannedTools.length > 0 && (
        <section aria-labelledby="planned-tools-heading">
          <h2
            id="planned-tools-heading"
            className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 px-1"
          >
            Coming soon
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {plannedTools.map(({ icon: Icon, label, desc }, idx) => (
              <div
                key={label}
                className={`glass-card glass-edge rounded-xl p-5 opacity-50 transition-all duration-500 ${
                  mounted ? 'translate-y-0' : 'translate-y-6'
                }`}
                style={{ transitionDelay: `${600 + idx * 80}ms` }}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-3">
                  <Icon size={16} className="text-slate-500" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-medium text-slate-400 mb-1">{label}</h3>
                <p className="text-xs text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}