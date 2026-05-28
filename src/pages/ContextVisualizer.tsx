import { useState, useCallback, useRef } from 'react';
import { Eye, Plus, Trash2, Info, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  countTokens,
  getBudgetLevel,
  formatNumber,
  MODELS,
  DEFAULT_MODEL_ID,
} from '../lib/tokenizer';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'system' | 'user' | 'assistant';

interface Turn {
  id: string;
  role: Role;
  text: string;
  tokens: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<Role, {
  label: string; color: string; bg: string;
  border: string; barColor: string; placeholder: string;
}> = {
  system: {
    label: 'System',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/30',
    barColor: 'bg-violet-500',
    placeholder: 'You are a helpful assistant…',
  },
  user: {
    label: 'User',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    barColor: 'bg-blue-500',
    placeholder: 'What is the maximum context window for Claude 3.5 Sonnet?',
  },
  assistant: {
    label: 'Assistant',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    barColor: 'bg-emerald-500',
    placeholder: 'Claude 3.5 Sonnet supports up to 200,000 tokens…',
  },
};

const ROLES: Role[] = ['system', 'user', 'assistant'];

let turnIdCounter = 0;
function newTurn(role: Role): Turn {
  return { id: `turn-${++turnIdCounter}`, role, text: '', tokens: 0 };
}

// ─── Visual budget bar ────────────────────────────────────────────────────────

function StackedBar({ turns, contextWindow }: { turns: Turn[]; contextWindow: number }) {
  const total = turns.reduce((s, t) => s + t.tokens, 0);
  const level = getBudgetLevel(total, contextWindow);
  const usedPct = Math.min((total / contextWindow) * 100, 100);

  return (
    <div className="space-y-2">
      {/* Stacked bar */}
      <div className="h-5 rounded-full bg-slate-800 overflow-hidden flex">
        {turns.map(t => {
          const pct = contextWindow > 0 ? (t.tokens / contextWindow) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={t.id}
              className={`h-full transition-all duration-300 ${ROLE_CONFIG[t.role].barColor}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
              title={`${ROLE_CONFIG[t.role].label}: ${formatNumber(t.tokens)} tokens`}
            />
          );
        })}
      </div>

      {/* Legend + totals */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-[10px]">
        <div className="flex items-center gap-3">
          {ROLES.map(role => {
            const roleTurns = turns.filter(t => t.role === role);
            const roleTokens = roleTurns.reduce((s, t) => s + t.tokens, 0);
            if (roleTokens === 0) return null;
            const cfg = ROLE_CONFIG[role];
            return (
              <div key={role} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${cfg.barColor}`} />
                <span className={cfg.color}>{cfg.label}</span>
                <span className="text-slate-500">{formatNumber(roleTokens)}</span>
              </div>
            );
          })}
        </div>
        <span className={`font-mono font-bold ${
          level === 'danger' ? 'text-red-400' :
          level === 'warn'   ? 'text-amber-400' : 'text-slate-400'
        }`}>
          {formatNumber(total)} / {formatNumber(contextWindow)} ({usedPct.toFixed(1)}%)
        </span>
      </div>

      {/* Warning */}
      {level !== 'ok' && (
        <div className={`flex items-center gap-1.5 text-[10px] ${
          level === 'danger' ? 'text-red-400' : 'text-amber-400'
        }`}>
          <AlertTriangle size={10} />
          {level === 'danger'
            ? 'Over 90% — near context limit. Oldest messages will be truncated.'
            : 'Over 75% — approaching context limit. Monitor usage.'}
        </div>
      )}
    </div>
  );
}

// ─── Turn row ─────────────────────────────────────────────────────────────────

interface TurnRowProps {
  turn: Turn;
  index: number;
  onUpdate: (id: string, text: string, tokens: number) => void;
  onDelete: (id: string) => void;
  onRoleChange: (id: string, role: Role) => void;
}

function TurnRow({ turn, index, onUpdate, onDelete, onRoleChange }: TurnRowProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cfg = ROLE_CONFIG[turn.role];

  const handleChange = (text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onUpdate(turn.id, text, countTokens(text));
    }, 150);
  };

  return (
    <div className={`glass-card rounded-xl border ${cfg.border} p-3 space-y-2`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-600 font-mono w-4 text-right">{index + 1}</span>
          {/* Role selector */}
          <div className="flex gap-1">
            {ROLES.map(r => (
              <button
                key={r}
                onClick={() => onRoleChange(turn.id, r)}
                aria-pressed={turn.role === r}
                aria-label={`Set role to ${ROLE_CONFIG[r].label}`}
                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-all duration-150 ${
                  turn.role === r
                    ? `${ROLE_CONFIG[r].bg} ${ROLE_CONFIG[r].border} ${ROLE_CONFIG[r].color}`
                    : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-400'
                }`}
              >
                {ROLE_CONFIG[r].label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full
            bg-slate-800 border border-slate-700/60 ${cfg.color}`}>
            {formatNumber(turn.tokens)} tok
          </span>
          <button
            onClick={() => onDelete(turn.id)}
            className="text-slate-600 hover:text-red-400 transition-colors"
            aria-label="Delete turn"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <textarea
        defaultValue={turn.text}
        onChange={e => handleChange(e.target.value)}
        placeholder={cfg.placeholder}
        rows={3}
        className={`w-full bg-slate-900/50 rounded-lg border text-sm text-slate-300
          placeholder:text-slate-600 resize-y p-2.5 outline-none transition-colors duration-200
          ${cfg.border} focus:${cfg.border}`}
        spellCheck={false}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContextVisualizer() {
  const [turns, setTurns] = useState<Turn[]>([newTurn('system'), newTurn('user')]);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);

  const selectedModel = MODELS.find(m => m.id === selectedModelId)!;
  const totalTokens = turns.reduce((s, t) => s + t.tokens, 0);
  const remaining = selectedModel.contextWindow - totalTokens;

  const addTurn = useCallback((role: Role) => {
    setTurns(prev => [...prev, newTurn(role)]);
  }, []);

  const updateTurn = useCallback((id: string, text: string, tokens: number) => {
    setTurns(prev => prev.map(t => t.id === id ? { ...t, text, tokens } : t));
  }, []);

  const deleteTurn = useCallback((id: string) => {
    setTurns(prev => prev.filter(t => t.id !== id));
  }, []);

  const changeRole = useCallback((id: string, role: Role) => {
    setTurns(prev => prev.map(t => t.id === id ? { ...t, role } : t));
  }, []);

  const clearAll = () => {
    setTurns([newTurn('system'), newTurn('user')]);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/25
            flex items-center justify-center shrink-0">
            <Eye size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="page-eyebrow">Developer Tools</p>
            <h1 className="text-xl font-bold tracking-tight">
              Context <span className="heading-gradient">Visualizer</span>
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-400 pl-11.5">
          Build a multi-turn conversation and see exactly how your context window fills up.
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
                  ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <StackedBar turns={turns} contextWindow={selectedModel.contextWindow} />

        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
          <span className="text-slate-500">
            Remaining capacity:
            <span className={`ml-1.5 font-mono font-bold ${remaining < 0 ? 'text-red-400' : 'text-slate-300'}`}>
              {formatNumber(Math.max(remaining, 0))} tokens
            </span>
          </span>
          <Link to="/tools/token-counter" className="text-slate-600 hover:text-slate-400 transition-colors">
            ← Token Counter
          </Link>
        </div>
      </div>

      {/* Turns */}
      <div className="space-y-2">
        {turns.map((turn, i) => (
          <TurnRow
            key={turn.id}
            turn={turn}
            index={i}
            onUpdate={updateTurn}
            onDelete={deleteTurn}
            onRoleChange={changeRole}
          />
        ))}
      </div>

      {/* Add turn controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {ROLES.map(role => {
          const cfg = ROLE_CONFIG[role];
          return (
            <button
              key={role}
              onClick={() => addTurn(role)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                font-medium border transition-all duration-150
                ${cfg.bg} ${cfg.border} ${cfg.color} hover:opacity-80`}
            >
              <Plus size={12} />
              Add {cfg.label}
            </button>
          );
        })}
        <button
          onClick={clearAll}
          className="ml-auto px-3 py-1.5 rounded-lg text-xs text-slate-500 border
            border-slate-700/50 hover:text-slate-400 hover:border-slate-600 transition-all"
        >
          Reset
        </button>
      </div>

      {/* Summary row */}
      <div className="glass-card rounded-xl p-4 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Turns</p>
          <p className="text-xl font-bold font-mono text-white">{turns.length}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Tokens</p>
          <p className="text-xl font-bold font-mono text-white">{formatNumber(totalTokens)}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Remaining</p>
          <p className={`text-xl font-bold font-mono ${remaining < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatNumber(Math.max(remaining, 0))}
          </p>
        </div>
      </div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-slate-900/40
        border border-slate-800/50 text-[11px] text-slate-500">
        <Info size={13} className="shrink-0 mt-0.5 text-slate-600" />
        <p>
          <span className="text-slate-400 font-medium">CCA-F Domain 5 — Context Management:</span>
          {' '}When a conversation exceeds the context window, Claude truncates the oldest messages.
          Use this visualizer to understand your token budget before making API calls.
          Token counts are approximated (±5%) — see{' '}
          <Link to="/tools/token-counter" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
            Token Counter
          </Link>
          {' '}for details.
        </p>
      </div>

    </div>
  );
}
