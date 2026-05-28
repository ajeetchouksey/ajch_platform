import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Wrench, Terminal, Hash, Eye, Server } from 'lucide-react';

interface ToolDef {
  icon: React.ElementType;
  label: string;
  desc: string;
  href?: string;
  live?: boolean;
}

const tools: ToolDef[] = [
  { icon: Hash,     label: 'Token Counter',      href: '/tools/token-counter',      live: true,  desc: 'Count tokens for Claude, GPT, and other model families' },
  { icon: Eye,      label: 'Context Visualizer',  href: '/tools/context-visualizer', live: true,  desc: 'See how your context window fills up with messages' },
  { icon: Server,   label: 'MCP Scaffold',         href: '/tools/mcp-scaffold',       live: true,  desc: 'Generate MCP server boilerplate from a config spec' },
  { icon: Terminal, label: 'Prompt Tester',        desc: 'Test prompts with different models and compare outputs' },
];

export default function Tools() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className="space-y-8">
      <div className={`text-center py-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <Wrench size={32} className="text-slate-500" />
        </div>
        <p className="page-eyebrow">Developer Tools</p>
        <h1 className="text-2xl font-bold tracking-tight mb-2">AI <span className="heading-gradient">Tools</span></h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Utilities for prompt testing, token counting, context window visualization, and MCP server scaffolding.
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1 mt-4 rounded-full bg-amber-950/30 border border-amber-800/30 text-xs text-amber-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Under Development
        </div>
      </div>

      {/* Tool previews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {tools.map(({ icon: Icon, label, desc, href, live }, idx) => {
          const cardClass = `glass-card glass-edge rounded-xl p-5 transition-all duration-500 ${
            href
              ? 'hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer opacity-100'
              : 'hover:opacity-80 hover:border-slate-700 opacity-60'
          } ${mounted ? 'translate-y-0' : 'opacity-0 translate-y-6'}`;

          const inner = (
            <>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${href ? 'bg-violet-500/10' : 'bg-slate-800'}`}>
                <Icon size={16} className={href ? 'text-violet-400' : 'text-slate-500'} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-slate-300">{label}</h3>
                {live && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full
                    bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 uppercase tracking-wide">
                    Live
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">{desc}</p>
            </>
          );

          return href ? (
            <Link
              key={label}
              to={href}
              className={cardClass}
              style={{ transitionDelay: `${300 + idx * 100}ms` }}
            >
              {inner}
            </Link>
          ) : (
            <div
              key={label}
              className={cardClass}
              style={{ transitionDelay: `${300 + idx * 100}ms` }}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}