import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookMarked, Copy, Check, X, ExternalLink, Search } from 'lucide-react';
import rawTemplates from '@/data/prompt-templates.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Example {
  input: string;
  output: string;
}

interface PromptTemplate {
  id: string;
  label: string;
  description: string;
  role: string;
  persona: string;
  context?: string;
  constraints: string[];
  outputFormat: string;
  tone: string;
  chainOfThought?: boolean;
  prefill?: string;
  examples: Example[];
}

const TEMPLATES = rawTemplates as PromptTemplate[];

// ─── Assembler (mirrors SystemPromptBuilder) ──────────────────────────────────

function assemblePrompt(t: PromptTemplate): string {
  const parts: string[] = [];

  if (t.role || t.persona) {
    const body = t.role && t.persona
      ? `You are ${t.role}. ${t.persona}`
      : t.role ? `You are ${t.role}.` : t.persona;
    parts.push(`<role>\n${body}\n</role>`);
  }

  if (t.context?.trim()) {
    parts.push(`<context>\n${t.context.trim()}\n</context>`);
  }

  const cs = t.constraints.filter(c => c.trim());
  if (cs.length > 0) {
    parts.push(`<constraints>\n${cs.map(c => `- ${c}`).join('\n')}\n</constraints>`);
  }

  if (t.outputFormat?.trim()) {
    parts.push(`<output_format>\n${t.outputFormat.trim()}\n</output_format>`);
  }

  if (t.tone && t.tone !== 'neutral') {
    parts.push(`<tone>${t.tone.charAt(0).toUpperCase() + t.tone.slice(1)}</tone>`);
  }

  if (t.chainOfThought) {
    parts.push(
      `<thinking_mode>\nBefore responding, think through the problem step by step inside <thinking> tags.\nOnly output your final answer outside the tags.\n</thinking_mode>`,
    );
  }

  if (t.examples?.some(e => e.input.trim() || e.output.trim())) {
    const exBlocks = t.examples
      .filter(e => e.input.trim() || e.output.trim())
      .map(e => `  <example>\n    <human>${e.input}</human>\n    <assistant>${e.output}</assistant>\n  </example>`)
      .join('\n');
    parts.push(`<examples>\n${exBlocks}\n</examples>`);
  }

  let result = parts.join('\n\n');
  if (t.prefill?.trim()) {
    result += `\n\n${'─'.repeat(56)}\nPREFILL — start your first assistant turn with this text:\n${t.prefill.trim()}`;
  }
  return result || '(no content — all fields are empty)';
}

// ─── Tone badge colours ───────────────────────────────────────────────────────

const TONE_STYLE: Record<string, { bg: string; border: string; text: string }> = {
  professional: { bg: '#3b82f610', border: '#3b82f630', text: '#93c5fd' },
  technical:    { bg: '#8b5cf610', border: '#8b5cf630', text: '#c4b5fd' },
  encouraging:  { bg: '#10b98110', border: '#10b98130', text: '#6ee7b7' },
  empathetic:   { bg: '#f43f5e10', border: '#f43f5e30', text: '#fda4af' },
  neutral:      { bg: '#64748b10', border: '#64748b30', text: '#94a3b8' },
  concise:      { bg: '#f59e0b10', border: '#f59e0b30', text: '#fcd34d' },
  creative:     { bg: '#ec489910', border: '#ec489930', text: '#f9a8d4' },
};

function ToneBadge({ tone }: { tone: string }) {
  const s = TONE_STYLE[tone] ?? TONE_STYLE.neutral;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.text }}>
      {tone}
    </span>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text, size = 'sm' }: { text: string; size?: 'xs' | 'sm' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const px = size === 'xs' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs';
  return (
    <button
      onClick={copy}
      className={`flex items-center gap-1.5 ${px} rounded-lg font-medium transition-all
        bg-slate-700/60 hover:bg-slate-700 border border-slate-600/40 text-slate-300 hover:text-white`}
    >
      {copied
        ? <><Check size={11} className="text-emerald-400" /> Copied</>
        : <><Copy size={11} /> Copy prompt</>}
    </button>
  );
}

// ─── Detail modal ─────────────────────────────────────────────────────────────

function TemplateModal({ tpl, onClose }: { tpl: PromptTemplate; onClose: () => void }) {
  const assembled = useMemo(() => assemblePrompt(tpl), [tpl]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(71,85,105,0.35)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid rgba(71,85,105,0.20)' }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-white">{tpl.label}</span>
            <ToneBadge tone={tpl.tone} />
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/tools/system-prompt-builder`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold
                text-violet-400 hover:text-violet-300 transition-colors"
              title="Open in System Prompt Builder"
            >
              <ExternalLink size={11} /> Open in Builder
            </Link>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <p className="text-xs text-slate-400">{tpl.description}</p>

          {/* Metadata pills */}
          <div className="flex flex-wrap gap-2 text-[10px]">
            {tpl.chainOfThought && (
              <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 font-bold">
                Chain-of-Thought
              </span>
            )}
            {tpl.prefill && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-300 font-bold">
                Prefill: {tpl.prefill.slice(0, 20)}{tpl.prefill.length > 20 ? '…' : ''}
              </span>
            )}
            {tpl.examples?.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-bold">
                {tpl.examples.length} example{tpl.examples.length > 1 ? 's' : ''}
              </span>
            )}
            {tpl.constraints?.length > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                {tpl.constraints.length} constraint{tpl.constraints.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Assembled prompt */}
          <div className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(71,85,105,0.25)' }}>
            <div className="flex items-center justify-between px-3 py-2"
              style={{ background: 'rgba(8,14,28,0.95)', borderBottom: '1px solid rgba(71,85,105,0.20)' }}>
              <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">assembled system prompt</span>
              <CopyBtn text={assembled} size="xs" />
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto"
              style={{ background: 'rgba(8,14,28,0.80)' }}>
              {assembled}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const ALL_TONES = ['all', ...Array.from(new Set(TEMPLATES.map(t => t.tone).filter(Boolean)))];

export default function PromptLibrary() {
  const [search, setSearch]   = useState('');
  const [tone, setTone]       = useState('all');
  const [selected, setSelected] = useState<PromptTemplate | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return TEMPLATES.filter(t => {
      if (t.id === 'blank') return false; // hide blank template
      const matchTone  = tone === 'all' || t.tone === tone;
      const matchQuery = !q
        || t.label.toLowerCase().includes(q)
        || t.description.toLowerCase().includes(q)
        || t.role.toLowerCase().includes(q)
        || t.tone.toLowerCase().includes(q);
      return matchTone && matchQuery;
    });
  }, [search, tone]);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.30)' }}>
            <BookMarked size={20} style={{ color: '#34d399' }} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Prompt Library</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {TEMPLATES.filter(t => t.id !== 'blank').length} production-ready system prompt templates — browse, preview, and copy.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="search"
              placeholder="Search templates…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/50 pl-9 pr-4 py-2.5 text-sm
                text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
          {/* Tone filter */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_TONES.map(t => {
              const s = t !== 'all' ? (TONE_STYLE[t] ?? TONE_STYLE.neutral) : null;
              return (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                  style={
                    tone === t && s
                      ? { background: s.bg, border: `1px solid ${s.border}`, color: s.text }
                      : tone === t && !s
                        ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.35)', color: '#c4b5fd' }
                        : { background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(71,85,105,0.25)', color: '#475569' }
                  }
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-600 italic py-8 text-center">No templates match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(tpl => {
              const assembled = assemblePrompt(tpl);
              return (
                <div
                  key={tpl.id}
                  className="rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-150
                    hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background: 'rgba(15,23,42,0.95)',
                    border: '1px solid rgba(71,85,105,0.25)',
                  }}
                  onClick={() => setSelected(tpl)}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-white leading-tight">{tpl.label}</p>
                      <ToneBadge tone={tpl.tone} />
                    </div>
                    <p className="text-xs text-slate-500 leading-snug">{tpl.description}</p>
                  </div>

                  {/* Meta pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {tpl.chainOfThought && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/10 border border-violet-500/20 text-violet-400">CoT</span>
                    )}
                    {tpl.prefill && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">prefill</span>
                    )}
                    {tpl.examples?.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        {tpl.examples.length}× examples
                      </span>
                    )}
                    {tpl.constraints?.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        {tpl.constraints.length} rules
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 mt-auto border-t border-slate-700/30">
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(tpl); }}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white
                        hover:bg-slate-700/60 transition-all text-center border border-slate-700/30 hover:border-slate-600/50"
                    >
                      Preview
                    </button>
                    <span onClick={e => e.stopPropagation()}>
                      <CopyBtn text={assembled} size="xs" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <TemplateModal tpl={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
