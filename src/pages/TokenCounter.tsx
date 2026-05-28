import { useState, useCallback, useRef } from 'react';
import { Hash, Info, BookOpen, ChevronDown, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  countTokens,
  estimateInputCost,
  getBudgetLevel,
  formatNumber,
  MODELS,
  DEFAULT_MODEL_ID,
  type ModelConfig,
} from '../lib/tokenizer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Section {
  id: 'system' | 'user' | 'assistant';
  label: string;
  placeholder: string;
  color: string;
  borderColor: string;
}

const SECTIONS: Section[] = [
  {
    id: 'system',
    label: 'System Prompt',
    placeholder: 'You are a helpful AI assistant specialized in...',
    color: 'text-violet-400',
    borderColor: 'border-violet-500/30 focus:border-violet-400/60',
  },
  {
    id: 'user',
    label: 'User Message',
    placeholder: 'What is the maximum context window for Claude 3.5 Sonnet?',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/30 focus:border-blue-400/60',
  },
  {
    id: 'assistant',
    label: 'Assistant Reply',
    placeholder: 'Claude 3.5 Sonnet supports up to 200,000 tokens...',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30 focus:border-emerald-400/60',
  },
];

// ─── Budget bar ───────────────────────────────────────────────────────────────

function BudgetBar({ tokens, model }: { tokens: number; model: ModelConfig }) {
  const pct = Math.min((tokens / model.contextWindow) * 100, 100);
  const level = getBudgetLevel(tokens, model.contextWindow);

  const barColor =
    level === 'danger' ? 'bg-red-500' :
    level === 'warn'   ? 'bg-amber-400' :
                         'bg-emerald-500';

  const textColor =
    level === 'danger' ? 'text-red-400' :
    level === 'warn'   ? 'text-amber-400' :
                         'text-emerald-400';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Context budget</span>
        <span className={`font-mono font-bold ${textColor}`}>
          {formatNumber(tokens)} / {formatNumber(model.contextWindow)} tokens
          <span className="text-slate-500 font-normal ml-1">({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {level !== 'ok' && (
        <p className={`text-[10px] ${textColor}`}>
          {level === 'danger'
            ? '⚠ Over 90% — approaching context limit. Consider truncation.'
            : '⚠ Over 75% — monitor context usage.'}
        </p>
      )}
    </div>
  );
}

// ─── Token badge ──────────────────────────────────────────────────────────────

function TokenBadge({ count, color }: { count: number; color: string }) {
  return (
    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full
      bg-slate-800 border border-slate-700/60 ${color}`}>
      {formatNumber(count)} tok
    </span>
  );
}

// ─── Section textarea ─────────────────────────────────────────────────────────

interface SectionAreaProps {
  section: Section;
  value: string;
  tokenCount: number;
  onChange: (id: Section['id'], value: string) => void;
}

function SectionArea({ section, value, tokenCount, onChange }: SectionAreaProps) {
  return (
    <div className="glass-card card-accent-top rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <label className={`text-xs font-semibold uppercase tracking-widest ${section.color}`}>
          {section.label}
        </label>
        <TokenBadge count={tokenCount} color={section.color} />
      </div>
      <textarea
        value={value}
        onChange={e => onChange(section.id, e.target.value)}
        placeholder={section.placeholder}
        rows={5}
        className={`w-full bg-slate-900/50 rounded-lg border text-sm text-slate-300
          placeholder:text-slate-600 resize-y p-3 outline-none transition-colors duration-200
          ${section.borderColor}`}
        spellCheck={false}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TokenCounter() {
  const [texts, setTexts] = useState<Record<Section['id'], string>>({
    system: '',
    user: '',
    assistant: '',
  });
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [counts, setCounts] = useState<Record<Section['id'], number>>({
    system: 0,
    user: 0,
    assistant: 0,
  });

  const selectedModel = MODELS.find(m => m.id === selectedModelId)!;
  const totalTokens = counts.system + counts.user + counts.assistant;

  const handleChange = useCallback((id: Section['id'], value: string) => {
    setTexts(prev => ({ ...prev, [id]: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setCounts(prev => ({ ...prev, [id]: countTokens(value) }));
    }, 150);
  }, []);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/25
            flex items-center justify-center shrink-0">
            <Hash size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="page-eyebrow">Developer Tools</p>
            <h1 className="text-xl font-bold tracking-tight">
              Token <span className="heading-gradient">Counter</span>
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-400 pl-11.5">
          Live token counting across Claude and GPT model families.
          Fully client-side — no API key needed.
        </p>
      </div>

      {/* Model selector */}
      <div className="glass-card rounded-xl p-4 space-y-3">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model</p>
        <div className="flex flex-wrap gap-2">
          {MODELS.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedModelId(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150
                ${selectedModelId === m.id
                  ? 'bg-violet-500/15 border-violet-500/50 text-violet-300'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Budget bar */}
        <BudgetBar tokens={totalTokens} model={selectedModel} />

        {/* Cost estimate */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
          <Info size={11} className="text-slate-600 shrink-0" />
          <span className="text-[10px] text-slate-500">
            Estimated input cost:&nbsp;
            <span className="text-slate-300 font-mono font-semibold">
              {estimateInputCost(totalTokens, selectedModel)}
            </span>
            &nbsp;at {selectedModel.label} list price
            (${selectedModel.inputPricePer1M.toFixed(2)}/M tokens)
          </span>
        </div>
      </div>

      {/* Text sections */}
      <div className="space-y-3">
        {SECTIONS.map(section => (
          <SectionArea
            key={section.id}
            section={section}
            value={texts[section.id]}
            tokenCount={counts[section.id]}
            onChange={handleChange}
          />
        ))}
      </div>

      {/* Total summary */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</p>
            <p className="text-2xl font-bold font-mono text-white">
              {formatNumber(totalTokens)}
              <span className="text-sm text-slate-500 font-normal ml-1.5">tokens</span>
            </p>
          </div>
          <div className="flex gap-4 text-xs text-slate-500">
            {SECTIONS.map(s => (
              <div key={s.id} className="text-center">
                <div className={`text-sm font-mono font-bold ${s.color}`}>{formatNumber(counts[s.id])}</div>
                <div className="text-[10px]">{s.label.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Educational note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-slate-900/40
        border border-slate-800/50 text-[11px] text-slate-500">
        <Info size={13} className="shrink-0 mt-0.5 text-slate-600" />
        <p>
          <span className="text-slate-400 font-medium">CCA-F Domain 5 — Context Management:</span>
          {' '}Counts use a cl100k_base approximation (±5% for English prose).
          Claude's tokenizer is proprietary; GPT-4o averages ~4 chars/token.
          For exact counts use{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
            Anthropic Console
          </a>{' '}or the{' '}
          <a href="https://platform.openai.com/tokenizer" target="_blank" rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2">
            OpenAI Tokenizer
          </a>.
        </p>
      </div>

      {/* Link to Context Visualizer */}
      <div className="flex items-center justify-end">
        <Link to="/tools/context-visualizer"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-400 transition-colors">
          <Eye size={12} />
          Try Context Visualizer →
        </Link>
      </div>

      {/* Tokenization 101 */}
      <TokenizationDocs />

    </div>
  );
}

// ─── Tokenization 101 ────────────────────────────────────────────────────────

const DOCS: { q: string; a: string; exam?: string }[] = [
  {
    q: 'What is a token?',
    a: "A token is the basic unit of text a language model processes. It's not always a whole word — common words like \"the\" are 1 token, while longer or less common words may be split into 2–3 tokens (e.g. \"tokenization\" → \"token\" + \"ization\"). Whitespace and punctuation also consume tokens.",
    exam: 'CCA-F tests your understanding that tokens ≠ words. Expect questions like: "A 10,000-word document contains approximately how many tokens?" Answer: ~13,000–15,000.',
  },
  {
    q: 'What is BPE (Byte-Pair Encoding)?',
    a: 'BPE is the algorithm that builds a tokenizer vocabulary. It starts with individual characters, then iteratively merges the most frequent adjacent pairs into new tokens. This produces a vocabulary of ~50K–100K tokens that efficiently represents both common words (1 token each) and rare words (split into subword pieces).',
    exam: "You don't need to implement BPE for CCA-F, but knowing that Claude and GPT both use BPE-derived tokenizers helps explain why token counts differ from word counts.",
  },
  {
    q: 'What is a context window?',
    a: "The context window is the maximum number of tokens a model can process in a single request — including the system prompt, conversation history, and the current message. Claude 3.5 Sonnet: 200K tokens. GPT-4o: 128K tokens. Once the limit is reached, the model cannot \"see\" earlier parts of the conversation.",
    exam: "Exam trap: Claude's 200K context window is for INPUT tokens. The output limit (max new tokens generated) is separate — typically 8K–8,192 for most models.",
  },
  {
    q: 'How does truncation work when the context is full?',
    a: 'When a conversation exceeds the context window, the oldest messages are truncated (dropped) first, while the system prompt is usually preserved. This means a very long chat history can cause the model to "forget" earlier context. Strategies to manage this: summarization, sliding window, retrieval-augmented generation (RAG).',
    exam: 'CCA-F Domain 5 question: "What happens when a Claude API request exceeds the context window?" Answer: The request returns an error — Claude does NOT silently truncate on your behalf at the API level. You must manage context size in your application.',
  },
  {
    q: 'How is API cost calculated?',
    a: 'Cost = (input tokens × input price) + (output tokens × output price). Prices are per million tokens. Example: 10,000 input tokens on Claude 3.5 Sonnet ($3/M) = $0.03. Output tokens cost 5× more than input tokens on most models, so minimizing output length reduces cost significantly.',
    exam: 'Formula to memorize: cost = (tokens / 1,000,000) × price_per_M. With Claude 3.5 Sonnet at $3/M input, 1K tokens ≈ $0.003.',
  },
  {
    q: 'Why do different models give different token counts for the same text?',
    a: 'Each model family uses a different tokenizer vocabulary. GPT models use cl100k_base (~100K vocab). Claude uses a proprietary tokenizer. The same English sentence can tokenize to slightly different counts — typically within 5–10% of each other for English prose, but the difference widens for code, special characters, and non-English text.',
    exam: 'When comparing model costs, always use the target model\'s actual tokenizer. Using GPT token counts to estimate Claude costs introduces ~5% pricing error.',
  },
];

function TokenizationDocs() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="glass-card rounded-xl border border-slate-800/50 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left
          hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen size={15} className="text-violet-400" />
          <span className="text-sm font-semibold text-slate-300">Tokenization 101</span>
          <span className="text-[10px] text-slate-500 font-normal">— CCA-F Domain 5 study guide</span>
        </div>
        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-slate-800/60 divide-y divide-slate-800/40">
          {DOCS.map((doc, i) => (
            <div key={i}>
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                aria-expanded={expanded === i}
                className="w-full flex items-center justify-between px-5 py-3 text-left
                  hover:bg-slate-800/20 transition-colors gap-3"
              >
                <span className="text-sm text-slate-300 font-medium">{doc.q}</span>
                <ChevronDown size={12} className={`text-slate-600 shrink-0 transition-transform duration-200
                  ${expanded === i ? 'rotate-180' : ''}`} />
              </button>
              {expanded === i && (
                <div className="px-5 pb-4 space-y-2.5">
                  <p className="text-[12px] text-slate-400 leading-relaxed">{doc.a}</p>
                  {doc.exam && (
                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg
                      bg-violet-500/5 border border-violet-500/20">
                      <span className="text-[9px] font-bold text-violet-400 uppercase tracking-widest
                        shrink-0 mt-0.5">Exam Tip</span>
                      <p className="text-[11px] text-violet-300/80 leading-relaxed">{doc.exam}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
