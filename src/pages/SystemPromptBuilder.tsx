import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Plus, Trash2, Copy, Check, Download, AlertCircle,
  ChevronDown, ChevronRight, Info, BookOpen, Sparkles,
  Hash, LayoutTemplate, Lightbulb, HelpCircle,
  Brain, Database, CornerDownRight, Tag,
} from 'lucide-react';
import { countTokens } from '../lib/tokenizer';
import rawTemplates from '../data/prompt-templates.json';

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

/** Runtime constraint with a stable identity key */
interface Constraint {
  id: string;
  value: string;
}

/** Runtime example with a stable identity key */
interface ExampleItem {
  id: string;
  input: string;
  output: string;
}

const TEMPLATES = rawTemplates as PromptTemplate[];

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'technical',    label: 'Technical' },
  { value: 'encouraging',  label: 'Encouraging' },
  { value: 'empathetic',   label: 'Empathetic' },
  { value: 'neutral',      label: 'Neutral' },
  { value: 'concise',      label: 'Concise' },
  { value: 'creative',     label: 'Creative' },
];

function genId(): string {
  return crypto.randomUUID();
}

// ─── Prompt assembler (XML — Claude best practice) ───────────────────────────

function assemblePrompt(
  role: string,
  persona: string,
  context: string,
  constraints: Constraint[],
  outputFormat: string,
  tone: string,
  chainOfThought: boolean,
  prefill: string,
  examples: ExampleItem[],
): string {
  const parts: string[] = [];

  if (role || persona) {
    const body = role && persona
      ? `You are ${role}. ${persona}`
      : role ? `You are ${role}.` : persona;
    parts.push(`<role>\n${body}\n</role>`);
  }

  if (context.trim()) {
    parts.push(`<context>\n${context.trim()}\n</context>`);
  }

  const activeConstraints = constraints.filter(c => c.value.trim());
  if (activeConstraints.length > 0) {
    const lines = activeConstraints.map(c => `- ${c.value}`).join('\n');
    parts.push(`<constraints>\n${lines}\n</constraints>`);
  }

  if (outputFormat.trim()) {
    parts.push(`<output_format>\n${outputFormat.trim()}\n</output_format>`);
  }

  if (tone && tone !== 'neutral') {
    parts.push(`<tone>${tone.charAt(0).toUpperCase() + tone.slice(1)}</tone>`);
  }

  if (chainOfThought) {
    parts.push(
      `<thinking_mode>\nBefore responding, think through the problem step by step inside <thinking> tags.\nOnly output your final answer outside the tags.\n</thinking_mode>`,
    );
  }

  if (examples.some(e => e.input.trim() || e.output.trim())) {
    const exBlocks = examples
      .filter(e => e.input.trim() || e.output.trim())
      .map(e =>
        `  <example>\n    <human>${e.input}</human>\n    <assistant>${e.output}</assistant>\n  </example>`,
      )
      .join('\n');
    parts.push(`<examples>\n${exBlocks}\n</examples>`);
  }

  let result = parts.join('\n\n');

  if (prefill.trim()) {
    result += `\n\n${'─'.repeat(56)}\nPREFILL — start your first assistant turn with this text:\n${prefill.trim()}`;
  }

  return result;
}

// ─── TokenBadge ───────────────────────────────────────────────────────────────

function TokenBadge({ text }: { text: string }) {
  const count = useMemo(() => countTokens(text), [text]);
  const color =
    count > 2000 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
    count > 500  ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                   'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${color}`}>
      <Hash size={9} />
      {count.toLocaleString()} tokens
    </span>
  );
}

// ─── DocSection ───────────────────────────────────────────────────────────────

function DocSection() {
  const [open, setOpen] = useState(false);

  return (
    <div className="glass-card glass-edge rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="doc-section-body"
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-violet-400" aria-hidden="true" />
          <span className="text-sm font-medium text-slate-300">About this tool</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
            Why · What · How
          </span>
        </div>
        {open
          ? <ChevronDown size={14} className="text-slate-500" aria-hidden="true" />
          : <ChevronRight size={14} className="text-slate-500" aria-hidden="true" />
        }
      </button>

      {open && (
        <div id="doc-section-body" className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/60">

          {/* Why */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400">
              <Lightbulb size={14} />
              <span className="text-xs font-semibold uppercase tracking-wide">Why it matters</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The system prompt is the single highest-leverage artefact in any LLM deployment.
              It defines the model's role, constraints, tone, and output contract — before the
              user types a single word. A vague system prompt leads to inconsistent, off-brand
              responses. A well-structured one makes the model predictable, safe, and useful.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Most practitioners start from a blank textarea and iterate manually.
              This tool removes that friction.
            </p>
          </div>

          {/* What */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-400">
              <Info size={14} />
              <span className="text-xs font-semibold uppercase tracking-wide">What it does</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A guided form that assembles a production-ready system prompt from structured inputs:
            </p>
            <ul className="text-xs text-slate-400 space-y-1 leading-relaxed list-none">
              {[
                'Role — what the model is',
                'Persona — how it thinks and behaves',
                'Constraints — what it must never do',
                'Output format — shape of every response',
                'Tone — register and style',
                'Examples — few-shot demonstrations',
              ].map(item => (
                <li key={item} className="flex items-start gap-1.5">
                  <ChevronRight size={10} className="text-violet-500 mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 leading-relaxed">
              100% client-side. No API key required. Your prompts never leave your browser.
            </p>
          </div>

          {/* How */}
          <div className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <HelpCircle size={14} />
              <span className="text-xs font-semibold uppercase tracking-wide">How to use it</span>
            </div>
            <ol className="text-xs text-slate-400 space-y-2 leading-relaxed list-none">
              {[
                ['Pick a template', 'Start from Claude Code Assistant, Study Tutor, JSON Extractor, or blank.'],
                ['Fill in the fields', 'Each field maps to a section of the assembled prompt. Leave blank to omit.'],
                ['Watch the preview', 'The right panel assembles your prompt in real time with a live token count.'],
                ['Export', 'Copy to clipboard or download as .txt. Paste directly into your Claude / GPT system prompt field.'],
              ].map(([step, desc], i) => (
                <li key={step} className="flex items-start gap-2">
                  <span className="shrink-0 w-4 h-4 rounded-full bg-slate-800 border border-slate-700 text-[9px] flex items-center justify-center text-slate-500 mt-0.5">
                    {i + 1}
                  </span>
                  <span><span className="text-slate-300 font-medium">{step}</span> — {desc}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ExampleRow ───────────────────────────────────────────────────────────────

function ExampleRow({
  example,
  index,
  onChange,
  onDelete,
}: {
  example: ExampleItem;
  index: number;
  onChange: (updated: ExampleItem) => void;
  onDelete: () => void;
}) {
  const inputId  = `ex-user-${example.id}`;
  const outputId = `ex-asst-${example.id}`;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono">Example {index + 1}</span>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Remove example ${index + 1}`}
          className="text-slate-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={12} aria-hidden="true" />
        </button>
      </div>
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-[10px] text-blue-400 uppercase tracking-wide font-semibold">User</label>
        <textarea
          id={inputId}
          rows={2}
          value={example.input}
          onChange={e => onChange({ ...example, input: e.target.value })}
          placeholder="What does the user say?"
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-md px-3 py-2 text-xs text-slate-300
            placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500/50 transition-colors font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={outputId} className="text-[10px] text-emerald-400 uppercase tracking-wide font-semibold">Assistant</label>
        <textarea
          id={outputId}
          rows={3}
          value={example.output}
          onChange={e => onChange({ ...example, output: e.target.value })}
          placeholder="Ideal response..."
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-md px-3 py-2 text-xs text-slate-300
            placeholder-slate-600 resize-none focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SystemPromptBuilder() {
  const [templateId, setTemplateId] = useState('blank');
  const [role, setRole] = useState('');
  const [persona, setPersona] = useState('');
  const [context, setContext] = useState('');
  const [constraints, setConstraints] = useState<Constraint[]>([{ id: genId(), value: '' }]);
  const [outputFormat, setOutputFormat] = useState('');
  const [tone, setTone] = useState('professional');
  const [chainOfThought, setChainOfThought] = useState(false);
  const [prefill, setPrefill] = useState('');
  const [examples, setExamples] = useState<ExampleItem[]>([]);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [previewOpen, setPreviewOpen] = useState(true);

  const assembled = useMemo(
    () => assemblePrompt(role, persona, context, constraints, outputFormat, tone, chainOfThought, prefill, examples),
    [role, persona, context, constraints, outputFormat, tone, chainOfThought, prefill, examples],
  );

  // ── Template loader ────────────────────────────────────────────────────────
  const applyTemplate = useCallback((id: string) => {
    const t = TEMPLATES.find(t => t.id === id);
    if (!t) return;
    setTemplateId(id);
    setRole(t.role);
    setPersona(t.persona);
    setContext(t.context ?? '');
    setConstraints(
      t.constraints.length > 0
        ? t.constraints.map(value => ({ id: genId(), value }))
        : [{ id: genId(), value: '' }],
    );
    setOutputFormat(t.outputFormat);
    setTone(t.tone);
    setChainOfThought(t.chainOfThought ?? false);
    setPrefill(t.prefill ?? '');
    setExamples(t.examples.map(e => ({ id: genId(), ...e })));
  }, []);

  // ── Constraint helpers ─────────────────────────────────────────────────────
  const updateConstraint = useCallback((id: string, value: string) =>
    setConstraints(prev => prev.map(c => c.id === id ? { ...c, value } : c)), []);

  const addConstraint = useCallback(() =>
    setConstraints(prev => [...prev, { id: genId(), value: '' }]), []);

  const deleteConstraint = useCallback((id: string) =>
    setConstraints(prev =>
      prev.length > 1 ? prev.filter(c => c.id !== id) : [{ id: genId(), value: '' }],
    ), []);

  // ── Example helpers ────────────────────────────────────────────────────────
  const addExample = useCallback(() =>
    setExamples(prev => [...prev, { id: genId(), input: '', output: '' }]), []);

  const updateExample = useCallback((id: string, updated: ExampleItem) =>
    setExamples(prev => prev.map(e => e.id === id ? updated : e)), []);

  const deleteExample = useCallback((id: string) =>
    setExamples(prev => prev.filter(e => e.id !== id)), []);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(assembled);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('error');
      setTimeout(() => setCopyState('idle'), 3000);
    }
  }, [assembled]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([assembled], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-prompt-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [assembled]);

  const handleDownloadJson = useCallback(() => {
    const payload = {
      role,
      persona,
      context,
      constraints: constraints.map(c => c.value).filter(v => v.trim()),
      outputFormat,
      tone,
      chainOfThought,
      prefill,
      examples: examples.map(({ input, output }) => ({ input, output })),
      assembled,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-prompt-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [role, persona, context, constraints, outputFormat, tone, chainOfThought, prefill, examples, assembled]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow">AI Tools</p>
          <h1 className="text-2xl font-bold tracking-tight">
            System Prompt <span className="heading-gradient">Builder</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Assemble production-ready system prompts from guided fields. Live preview, token count, and export.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold uppercase tracking-wide">
            Live
          </span>
          <span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-500 uppercase tracking-wide">
            Client-only · No API key
          </span>
        </div>
      </div>

      {/* Doc section */}
      <DocSection />

      {/* Template picker */}
      <div className="glass-card glass-edge rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <LayoutTemplate size={14} className="text-violet-400" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide" id="template-group-label">Templates</span>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-labelledby="template-group-label">
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t.id)}
              aria-pressed={templateId === t.id}
              className={`flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all duration-150 ${
                templateId === t.id
                  ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                  : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:border-violet-500/30 hover:text-slate-300'
              }`}
            >
              <span className="text-xs font-medium">{t.label}</span>
              <span className="text-[10px] text-slate-500 mt-0.5">{t.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form + Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Form (left, 3/5) ────────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Role */}
          <div className="glass-card glass-edge rounded-xl p-4 space-y-2">
            <label htmlFor="role-input" className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wide">
              <Sparkles size={12} aria-hidden="true" />
              Role
            </label>
            <p id="role-hint" className="text-[11px] text-slate-500">What the model IS. Short noun phrase. e.g. "Senior TypeScript Engineer"</p>
            <input
              id="role-input"
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Senior TypeScript Engineer and pair programmer"
              aria-describedby="role-hint"
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-300
                placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Persona */}
          <div className="glass-card glass-edge rounded-xl p-4 space-y-2">
            <label htmlFor="persona-input" className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wide">
              <FileText size={12} aria-hidden="true" />
              Persona
            </label>
            <p id="persona-hint" className="text-[11px] text-slate-500">Background, expertise, and behavioural style. 1–3 sentences.</p>
            <textarea
              id="persona-input"
              rows={3}
              value={persona}
              onChange={e => setPersona(e.target.value)}
              placeholder="e.g. You have 15 years of experience across TypeScript, Python, and cloud infrastructure. You write clean, production-grade code and explain your reasoning as you go..."
              aria-describedby="persona-hint"
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-300
                placeholder-slate-600 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Context */}
          <div className="glass-card glass-edge rounded-xl p-4 space-y-2">
            <label htmlFor="context-input" className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wide">
              <Database size={12} aria-hidden="true" />
              Context
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold normal-case tracking-normal">
                Claude best practice
              </span>
            </label>
            <p id="context-hint" className="text-[11px] text-slate-500">
              Background knowledge, documents, or situational info the model needs <em>before</em> it acts.
              Use <code className="text-violet-400 bg-slate-800 px-1 rounded">{'{{PLACEHOLDER}}'}</code> for dynamic runtime values.
            </p>
            <textarea
              id="context-input"
              rows={4}
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="e.g. You are assisting a team using the following internal API:\n\n<document>\n{{API_DOCS}}\n</document>\n\nThe user's subscription tier is {{TIER}}."
              aria-describedby="context-hint"
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-300
                placeholder-slate-600 resize-none focus:outline-none focus:border-violet-500/50 transition-colors font-mono text-xs"
            />
          </div>

          {/* Constraints */}
          <div className="glass-card glass-edge rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span id="constraints-label" className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wide">
                <FileText size={12} aria-hidden="true" />
                Constraints
              </span>
              <span className="text-[10px] text-slate-600" aria-live="polite">
                {constraints.filter(c => c.value.trim()).length} active
              </span>
            </div>
            <p id="constraints-hint" className="text-[11px] text-slate-500">Hard rules the model must never break. One per line.</p>
            <div className="space-y-2" role="list" aria-labelledby="constraints-label" aria-describedby="constraints-hint">
              {constraints.map((c, i) => (
                <div key={c.id} role="listitem" className="flex gap-2">
                  <input
                    type="text"
                    value={c.value}
                    onChange={e => updateConstraint(c.id, e.target.value)}
                    placeholder={`Constraint ${i + 1}...`}
                    aria-label={`Constraint ${i + 1}`}
                    className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300
                      placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => deleteConstraint(c.id)}
                    aria-label={`Remove constraint ${i + 1}`}
                    className="text-slate-600 hover:text-red-400 transition-colors px-1"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addConstraint}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors"
            >
              <Plus size={12} aria-hidden="true" />
              Add constraint
            </button>
          </div>

          {/* Output Format + Tone */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 glass-card glass-edge rounded-xl p-4 space-y-2">
              <label htmlFor="output-format-input" className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wide">
                <FileText size={12} aria-hidden="true" />
                Output Format
              </label>
              <p id="output-format-hint" className="text-[11px] text-slate-500">Describe the shape of every response. e.g. "Code block followed by explanation"</p>
              <textarea
                id="output-format-input"
                rows={3}
                value={outputFormat}
                onChange={e => setOutputFormat(e.target.value)}
                placeholder="e.g. Return a numbered list followed by a one-paragraph summary. Use headers for multi-part answers."
                aria-describedby="output-format-hint"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-300
                  placeholder-slate-600 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>

            <div className="glass-card glass-edge rounded-xl p-4 space-y-2">
              <label htmlFor="tone-select" className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wide">
                <FileText size={12} aria-hidden="true" />
                Tone
              </label>
              <p id="tone-hint" className="text-[11px] text-slate-500">Register and communication style</p>
              <select
                id="tone-select"
                value={tone}
                onChange={e => setTone(e.target.value)}
                aria-describedby="tone-hint"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-300
                  focus:outline-none focus:border-violet-500/50 transition-colors"
              >
                {TONES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chain of Thought + Prefill row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Chain of Thought */}
            <div className="glass-card glass-edge rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wide">
                  <Brain size={12} aria-hidden="true" />
                  Chain of Thought
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold normal-case tracking-normal">
                    Claude best practice
                  </span>
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={chainOfThought}
                  aria-label="Enable chain of thought"
                  onClick={() => setChainOfThought(v => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    chainOfThought ? 'bg-violet-600' : 'bg-slate-700'
                  }`}
                >
                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    chainOfThought ? 'translate-x-4' : 'translate-x-0'
                  }`} aria-hidden="true" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Adds a <code className="text-violet-400 bg-slate-800 px-1 rounded">&lt;thinking_mode&gt;</code> block instructing
                Claude to reason step by step before answering. Improves accuracy on complex tasks.
              </p>
            </div>

            {/* Prefill */}
            <div className="glass-card glass-edge rounded-xl p-4 space-y-2">
              <label htmlFor="prefill-input" className="flex items-center gap-2 text-xs font-semibold text-violet-400 uppercase tracking-wide">
                <CornerDownRight size={12} aria-hidden="true" />
                Prefill
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold normal-case tracking-normal">
                  Claude best practice
                </span>
              </label>
              <p id="prefill-hint" className="text-[11px] text-slate-500">
                Text to begin the first assistant turn. Forces output format.
                e.g. <code className="text-violet-400 bg-slate-800 px-1 rounded">{`{`}</code> for JSON, <code className="text-violet-400 bg-slate-800 px-1 rounded">&lt;thinking&gt;</code> for CoT.
              </p>
              <input
                id="prefill-input"
                type="text"
                value={prefill}
                onChange={e => setPrefill(e.target.value)}
                placeholder='e.g. { or <thinking> or Here is the analysis:'
                aria-describedby="prefill-hint"
                className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2.5 text-sm text-slate-300
                  placeholder-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors font-mono"
              />
            </div>
          </div>

          {/* Few-shot Examples */}
          <div className="glass-card glass-edge rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span id="examples-label" className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wide">
                <FileText size={12} aria-hidden="true" />
                Few-shot Examples
              </span>
              <span className="text-[10px] text-slate-600" aria-live="polite">
                {examples.length} example{examples.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p id="examples-hint" className="text-[11px] text-slate-500">
              Show the model exactly what a good response looks like. 1–3 examples is usually optimal.
            </p>
            {examples.map((ex, i) => (
              <ExampleRow
                key={ex.id}
                example={ex}
                index={i}
                onChange={updated => updateExample(ex.id, updated)}
                onDelete={() => deleteExample(ex.id)}
              />
            ))}
            <button
              type="button"
              onClick={addExample}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-400 transition-colors"
            >
              <Plus size={12} aria-hidden="true" />
              Add example
            </button>
          </div>
        </div>

        {/* ── Preview (right, 2/5) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="sticky top-20 space-y-3">

            {/* Preview header */}
            <div className="glass-card glass-edge rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(o => !o)}
                  aria-expanded={previewOpen}
                  aria-controls="prompt-preview"
                  className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-violet-300 transition-colors"
                >
                  {previewOpen
                    ? <ChevronDown size={13} className="text-slate-500" aria-hidden="true" />
                    : <ChevronRight size={13} className="text-slate-500" aria-hidden="true" />
                  }
                  Live Preview
                </button>
                <TokenBadge text={assembled} />
              </div>

              {previewOpen && (
                <div id="prompt-preview" className="p-4">
                  {assembled ? (
                    <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto scrollbar-thin">
                      {assembled}
                    </pre>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText size={28} className="text-slate-700 mb-3" />
                      <p className="text-xs text-slate-600">Fill in any field to see your prompt assembled here</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Export actions */}
            <div className="glass-card glass-edge rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Export</p>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!assembled}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg text-sm font-medium
                    bg-violet-600 hover:bg-violet-500 disabled:bg-slate-800 disabled:text-slate-600
                    text-white transition-all duration-150 disabled:cursor-not-allowed"
                >
                  {copyState === 'copied' && <Check size={14} className="text-emerald-400" aria-hidden="true" />}
                  {copyState === 'error'  && <AlertCircle size={14} className="text-red-400" aria-hidden="true" />}
                  {copyState === 'idle'   && <Copy size={14} aria-hidden="true" />}
                  {copyState === 'copied' ? 'Copied!' : copyState === 'error' ? 'Copy failed — try again' : 'Copy to clipboard'}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!assembled}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                      bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700/50
                      text-slate-300 transition-all duration-150 disabled:cursor-not-allowed"
                  >
                    <Download size={14} aria-hidden="true" />
                    .txt
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    disabled={!assembled}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium
                      bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700/50
                      text-slate-300 transition-all duration-150 disabled:cursor-not-allowed"
                  >
                    <Download size={14} aria-hidden="true" />
                    .json
                  </button>
                </div>
              </div>
              {assembled && (
                <p className="text-[10px] text-slate-600 text-center">
                  Paste directly into the system prompt field in Claude.ai, the API, or your IDE plugin.
                </p>
              )}
            </div>

            {/* Best Practices */}
            <div className="rounded-xl overflow-hidden bg-violet-950/20 border border-violet-800/20">
              <div className="px-4 py-3 flex items-center gap-2">
                <Tag size={12} className="text-violet-400" aria-hidden="true" />
                <span className="text-[11px] font-semibold text-violet-300 uppercase tracking-wide">Claude best practices</span>
              </div>
              <div className="divide-y divide-violet-800/20">
                {([
                  [
                    '🏷️ XML tags',
                    'Claude follows XML-structured prompts far more reliably than markdown. The assembler uses <role>, <context>, <constraints>, <output_format>, and <examples> automatically.',
                  ],
                  [
                    '🧠 Context before instructions',
                    'Put background knowledge and documents in the Context field. Claude attends to context better when it appears before the task instructions.',
                  ],
                  [
                    '🔗 Chain of thought',
                    'Enable Chain of Thought for multi-step reasoning. Claude\'s accuracy on complex tasks increases significantly when forced to think before answering.',
                  ],
                  [
                    '↵ Prefill',
                    'Prefilling the assistant turn (e.g. \'{\' for JSON, \'<thinking>\' for CoT) is the most reliable way to enforce output format — more so than instructions alone.',
                  ],
                  [
                    '📏 Token budget',
                    'Keep system prompts under 1,000 tokens. Use 1–2 high-quality examples — more examples add tokens without proportional gains.',
                  ],
                ] as [string, string][]).map(([title, body]) => (
                  <div key={title} className="px-4 py-2.5 space-y-0.5">
                    <p className="text-[10px] font-semibold text-slate-300">{title}</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Related tools */}
      <div className="border-t border-slate-800/60 pt-6">
        <p className="text-xs text-slate-600 uppercase tracking-wide font-semibold mb-3">Related tools</p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/tools/token-counter"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50
              text-xs text-slate-400 hover:text-violet-300 hover:border-violet-500/30 transition-all"
          >
            <Hash size={12} className="text-violet-400" />
            Token Counter
          </Link>
          <Link
            to="/tools/mcp-scaffold"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50
              text-xs text-slate-400 hover:text-violet-300 hover:border-violet-500/30 transition-all"
          >
            <Hash size={12} className="text-violet-400" />
            MCP Scaffold
          </Link>
        </div>
      </div>

    </div>
  );
}
