import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench, Terminal, Hash, Eye, Server, FileText,
  Calculator, Layers, FileJson, BookMarked, ArrowRight, Zap,
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
    href: '/tools/rag-chunk-visualizer',
    live: true,
    category: 'tokens',
    desc: 'Visualise how fixed-size, sentence, paragraph and recursive chunking splits your text.',
  },
  {
    icon: Terminal,
    label: 'Prompt Tester',
    href: '/tools/prompt-tester',
    live: true,
    category: 'prompting',
    desc: 'Compose a system prompt and get a ready-to-run Claude or OpenAI API payload — BYOK.',
  },
  {
    icon: BookMarked,
    label: 'Prompt Library',
    href: '/tools/prompt-library',
    live: true,
    category: 'prompting',
    desc: 'Browse, preview, and copy production-ready system prompt templates for common AI tasks.',
  },
];

const LIVE_TOOLS = TOOLS.filter(t => t.live && t.href);

const CATEGORY_META: Record<string, { label: string; color: string; border: string; bg: string }> = {
  prompting: { label: 'Prompting',  color: '#a78bfa', border: 'rgba(139,92,246,0.35)', bg: 'rgba(139,92,246,0.10)' },
  tokens:    { label: 'Tokens',     color: '#38bdf8', border: 'rgba(56,189,248,0.35)',  bg: 'rgba(56,189,248,0.08)'  },
  mcp:       { label: 'MCP',        color: '#34d399', border: 'rgba(52,211,153,0.35)',  bg: 'rgba(52,211,153,0.08)'  },
  cost:      { label: 'Cost',       color: '#fbbf24', border: 'rgba(251,191,36,0.35)',  bg: 'rgba(251,191,36,0.08)'  },
};

export default function Tools() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const liveTools    = TOOLS.filter(t => t.live);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Page header ── */}
      <div
        className={`relative pb-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ borderBottom: '1px solid rgba(71,85,105,0.10)' }}
      >
        <div className="absolute -top-12 -left-20 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)' }} />

        <div className="relative z-10 lg:max-w-[75%]">
          <span
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full mb-4"
            style={{ color: '#34d399', background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.25)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Developer Tools
          </span>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.06] mb-4">
            AI{' '}
            <span style={{
              background: 'linear-gradient(100deg, #34d399 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Tools</span>.
          </h1>

          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Client-side utilities for prompt engineering, token counting, MCP scaffolding, and model cost analysis.
            <span className="font-medium text-slate-300"> Zero network requests</span> — everything runs in your browser.
          </p>

          {/* Inline stats row */}
          <div className="flex flex-wrap items-center text-xs">
            {Object.entries(CATEGORY_META).reduce<React.ReactNode[]>((acc, [key, meta], i) => {
              const count = liveTools.filter(t => t.category === key).length;
              if (!count) return acc;
              if (acc.length > 0) acc.push(<span key={`sep-${key}`} className="mx-3.5" style={{ color: 'rgba(71,85,105,0.40)' }}>|</span>);
              acc.push(
                <div key={key} className="flex items-center">
                  <span className="font-black" style={{ color: meta.color }}>{count}</span>
                  <span className="text-slate-600 ml-1.5">{meta.label}</span>
                </div>
              );
              return acc;
            }, [])}
            <span className="mx-3.5" style={{ color: 'rgba(71,85,105,0.40)' }}>|</span>
            <span className="font-black text-violet-400">{liveTools.length}</span>
            <span className="text-slate-600 ml-1.5">total</span>
          </div>
        </div>
      </div>

      {/* ── Quick access nav ──────────────────────────────────────────────── */}
      <nav
        aria-label="Tools navigation"
        className={`transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        style={{ transitionDelay: '100ms' }}
      >
        <div className="rounded-xl p-3" style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.25)' }}>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-1 mb-2">Quick access</p>
          <div className="flex flex-wrap gap-2" role="list">
            {LIVE_TOOLS.map(t => {
              const meta = CATEGORY_META[t.category] ?? CATEGORY_META.prompting;
              return (
                <Link
                  key={t.href}
                  to={t.href!}
                  role="listitem"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-medium transition-all"
                  style={{
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    color: meta.color,
                  }}
                >
                  <t.icon size={12} aria-hidden="true" />
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Live tools grid ───────────────────────────────────────────────── */}
      <section aria-labelledby="live-tools-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="live-tools-heading" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {liveTools.length} tools available
          </h2>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-mono font-bold">
            <Zap size={10} />all client-side
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveTools.map(({ icon: Icon, label, desc, href, category }, idx) => {
            const meta = CATEGORY_META[category] ?? CATEGORY_META.prompting;
            return (
              <Link
                key={label}
                to={href!}
                className={`group rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1.5 ${
                  mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{
                  background: 'rgba(15,23,42,0.95)',
                  border: `1px solid rgba(71,85,105,0.25)`,
                  transitionDelay: `${200 + idx * 60}ms`,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.border = `1px solid ${meta.border}`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 32px -8px ${meta.color}25, 0 0 0 1px ${meta.border}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.border = '1px solid rgba(71,85,105,0.25)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}` }}>
                  <Icon size={18} style={{ color: meta.color }} aria-hidden="true" />
                </div>

                {/* Label + category pill */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-white leading-snug">{label}</h3>
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-lg uppercase tracking-wider shrink-0"
                    style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
                    {meta.label}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-3">{desc}</p>

                <div className="flex items-center gap-1 text-xs font-semibold transition-all duration-200 group-hover:gap-2"
                  style={{ color: meta.color }}>
                  Open <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}