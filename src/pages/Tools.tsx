import { useState, useEffect } from 'react';
import { Wrench, Terminal, Hash, Eye, Server } from 'lucide-react';

const tools = [
  { icon: Terminal, label: 'Prompt Tester', desc: 'Test prompts with different models and compare outputs' },
  { icon: Hash, label: 'Token Counter', desc: 'Count tokens for Claude, GPT, and other model families' },
  { icon: Eye, label: 'Context Visualizer', desc: 'See how your context window fills up with messages' },
  { icon: Server, label: 'MCP Scaffold', desc: 'Generate MCP server boilerplate from a config spec' },
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
        {tools.map(({ icon: Icon, label, desc }, idx) => (
          <div
            key={label}
            className={`glass-card glass-edge rounded-xl p-5 transition-all duration-500 hover:opacity-80 hover:border-slate-700 ${
              mounted ? 'opacity-60 translate-y-0' : 'opacity-0 translate-y-6'
            }`}
            style={{ transitionDelay: `${300 + idx * 100}ms` }}
          >
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center mb-3">
              <Icon size={16} className="text-slate-500" />
            </div>
            <h3 className="text-sm font-medium text-slate-300 mb-1">{label}</h3>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}