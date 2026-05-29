import { useState, useMemo } from 'react';
import { Terminal, Copy, Check, ChevronDown } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApiFormat = 'claude' | 'openai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const MODELS = {
  claude: [
    { id: 'claude-opus-4-5',         label: 'Claude Opus 4.5'       },
    { id: 'claude-sonnet-4-5',       label: 'Claude Sonnet 4.5'     },
    { id: 'claude-haiku-3-5',        label: 'Claude Haiku 3.5'      },
    { id: 'claude-3-opus-20240229',  label: 'Claude 3 Opus'         },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet'  },
  ],
  openai: [
    { id: 'gpt-4o',                  label: 'GPT-4o'                },
    { id: 'gpt-4o-mini',             label: 'GPT-4o mini'           },
    { id: 'gpt-4-turbo',             label: 'GPT-4 Turbo'           },
    { id: 'o1',                      label: 'o1'                    },
    { id: 'o3-mini',                 label: 'o3-mini'               },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildClaudePayload(
  systemPrompt: string,
  messages: Message[],
  model: string,
  maxTokens: number,
  temperature: number,
) {
  const payload: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    messages: messages.filter(m => m.content.trim()).map(m => ({
      role: m.role,
      content: m.content,
    })),
  };
  if (systemPrompt.trim()) payload.system = systemPrompt;
  if (temperature !== 1) payload.temperature = temperature;
  return JSON.stringify(payload, null, 2);
}

function buildOpenAIPayload(
  systemPrompt: string,
  messages: Message[],
  model: string,
  maxTokens: number,
  temperature: number,
) {
  const openaiMessages: { role: string; content: string }[] = [];
  if (systemPrompt.trim()) openaiMessages.push({ role: 'system', content: systemPrompt });
  messages.filter(m => m.content.trim()).forEach(m => openaiMessages.push(m));
  const payload: Record<string, unknown> = {
    model,
    messages: openaiMessages,
    max_tokens: maxTokens,
  };
  if (temperature !== 1) payload.temperature = temperature;
  return JSON.stringify(payload, null, 2);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyBtn({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
        bg-slate-700/60 hover:bg-slate-700 border border-slate-600/40 text-slate-300 hover:text-white"
    >
      {copied
        ? <><Check size={12} className="text-emerald-400" /> Copied</>
        : <><Copy size={12} /> {label ?? 'Copy'}</>}
    </button>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl bg-slate-800/60 border border-slate-700/50 px-3 py-2
            text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 transition-colors pr-8"
        >
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromptTester() {
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful assistant. Think step by step before answering.',
  );
  const [userMessage, setUserMessage]   = useState('What are the key differences between RAG and fine-tuning?');
  const [assistantMsg, setAssistantMsg] = useState('');
  const [format, setFormat]             = useState<ApiFormat>('claude');
  const [claudeModel, setClaudeModel]   = useState(MODELS.claude[1].id);
  const [openaiModel, setOpenaiModel]   = useState(MODELS.openai[0].id);
  const [maxTokens, setMaxTokens]       = useState(1024);
  const [temperature, setTemperature]   = useState(1.0);

  const messages: Message[] = useMemo(() => {
    const list: Message[] = [];
    if (userMessage.trim())    list.push({ role: 'user',      content: userMessage });
    if (assistantMsg.trim())   list.push({ role: 'assistant', content: assistantMsg });
    return list;
  }, [userMessage, assistantMsg]);

  const claudeJson = useMemo(
    () => buildClaudePayload(systemPrompt, messages, claudeModel, maxTokens, temperature),
    [systemPrompt, messages, claudeModel, maxTokens, temperature],
  );

  const openaiJson = useMemo(
    () => buildOpenAIPayload(systemPrompt, messages, openaiModel, maxTokens, temperature),
    [systemPrompt, messages, openaiModel, maxTokens, temperature],
  );

  const curlCmd = useMemo(() => {
    if (format === 'claude') {
      return `curl https://api.anthropic.com/v1/messages \\
  -H "content-type: application/json" \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -d '${claudeJson.replace(/'/g, "'\\''")}'`;
    }
    return `curl https://api.openai.com/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d '${openaiJson.replace(/'/g, "'\\''")}'`;
  }, [format, claudeJson, openaiJson]);

  const activeJson = format === 'claude' ? claudeJson : openaiJson;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.30)' }}>
          <Terminal size={20} style={{ color: '#a78bfa' }} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Prompt Tester</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Compose your prompt and instantly get a ready-to-run API payload for Claude or OpenAI — copy, curl, or use with your own key.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1fr] gap-6 items-start">
        {/* Left — prompt inputs */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              System Prompt
            </label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={5}
              placeholder="You are a helpful assistant…"
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3 text-sm text-slate-300
                focus:outline-none focus:border-violet-500/50 transition-colors resize-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              User Message
            </label>
            <textarea
              value={userMessage}
              onChange={e => setUserMessage(e.target.value)}
              rows={4}
              placeholder="What is…"
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3 text-sm text-slate-300
                focus:outline-none focus:border-violet-500/50 transition-colors resize-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Assistant Prefill <span className="normal-case font-normal text-slate-600">(optional)</span>
            </label>
            <textarea
              value={assistantMsg}
              onChange={e => setAssistantMsg(e.target.value)}
              rows={2}
              placeholder="Start of assistant response (e.g. <thinking>)"
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3 text-sm text-slate-300
                focus:outline-none focus:border-violet-500/50 transition-colors resize-none font-mono"
            />
          </div>

          {/* Settings */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.25)' }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parameters</p>

            {/* Format toggle */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">API Format</label>
              <div className="flex gap-2">
                {(['claude', 'openai'] as ApiFormat[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                    style={
                      format === f
                        ? { background: 'rgba(139,92,246,0.20)', border: '1px solid rgba(139,92,246,0.40)', color: '#c4b5fd' }
                        : { background: 'rgba(30,41,59,0.5)',    border: '1px solid rgba(71,85,105,0.25)', color: '#64748b' }
                    }
                  >
                    {f === 'claude' ? 'Anthropic' : 'OpenAI'}
                  </button>
                ))}
              </div>
            </div>

            {format === 'claude'
              ? <SelectField label="Model" value={claudeModel} onChange={setClaudeModel} options={MODELS.claude} />
              : <SelectField label="Model" value={openaiModel} onChange={setOpenaiModel} options={MODELS.openai} />
            }

            {/* Max tokens */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Max tokens</label>
                <span className="text-xs font-mono font-bold text-violet-300">{maxTokens.toLocaleString()}</span>
              </div>
              <input
                type="range" min={64} max={8192} step={64}
                value={maxTokens}
                onChange={e => setMaxTokens(parseInt(e.target.value))}
                className="w-full accent-violet-500"
                aria-label="Max tokens"
              />
            </div>

            {/* Temperature */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Temperature</label>
                <span className="text-xs font-mono font-bold text-violet-300">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range" min={0} max={1} step={0.05}
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-violet-500"
                aria-label="Temperature"
              />
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>0 — deterministic</span><span>1 — creative</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — outputs */}
        <div className="space-y-4">
          {/* JSON payload */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(71,85,105,0.30)' }}>
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid rgba(71,85,105,0.20)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-mono font-bold text-slate-400">
                  {format === 'claude' ? 'anthropic messages api' : 'openai chat completions api'}
                </span>
              </div>
              <CopyBtn text={activeJson} label="Copy JSON" />
            </div>
            <pre className="p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[400px] overflow-y-auto leading-relaxed"
              style={{ background: 'rgba(8,14,28,0.95)' }}>
              {activeJson}
            </pre>
          </div>

          {/* cURL command */}
          <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(71,85,105,0.30)' }}>
            <div className="flex items-center justify-between px-4 py-2.5"
              style={{ background: 'rgba(15,23,42,0.98)', borderBottom: '1px solid rgba(71,85,105,0.20)' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                <span className="text-xs font-mono font-bold text-slate-400">curl</span>
              </div>
              <CopyBtn text={curlCmd} label="Copy cURL" />
            </div>
            <pre className="p-4 text-xs font-mono text-slate-400 overflow-x-auto leading-relaxed whitespace-pre-wrap"
              style={{ background: 'rgba(8,14,28,0.95)' }}>
              {curlCmd}
            </pre>
          </div>

          {/* Note */}
          <div className="rounded-xl px-4 py-3"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
            <p className="text-[10px] text-amber-400/80 leading-relaxed">
              <span className="font-bold">BYOK</span> — Run these calls from your terminal with your own API key in
              <code className="mx-1 font-mono text-amber-300">$ANTHROPIC_API_KEY</code> or
              <code className="mx-1 font-mono text-amber-300">$OPENAI_API_KEY</code>.
              No requests are made from this browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
