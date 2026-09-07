/* eslint-disable react-refresh/only-export-components */
import { useState, useRef } from 'react';

// ── CCA-F keyword glossary ────────────────────────────────────────────────────
// Shared by every markdown-rendering surface that wants inline term
// definitions (exam Notes.tsx, SkillTrackHome.tsx lesson notes) — kept in one
// place so a new term only needs adding once.
export const GLOSSARY: Record<string, string> = {
  'stop_reason':    'Why Claude stopped generating. Values: "end_turn", "tool_use", "max_tokens", "stop_sequence".',
  'end_turn':       'Claude finished naturally — it decided to stop on its own.',
  '"end_turn"':     'Claude finished naturally — it decided to stop on its own.',
  'tool_use':       'Claude is requesting to call one or more tools before continuing.',
  'tool_result':    'Data returned to Claude after a tool executes.',
  'tool_choice':    'Controls how Claude picks tools: "auto" (Claude decides), "any" (must use a tool), or a forced specific tool.',
  'max_tokens':     'Hard limit on tokens Claude can generate in one response. Hitting this triggers stop_reason "max_tokens".',
  'temperature':    'Controls randomness. 0 = fully deterministic; 1 = default creative. Keep low (0–0.3) for structured output.',
  'context_window': 'Total token budget (input + output). Claude claude-3-5-sonnet: 200K. Claude claude-opus-4: 200K.',
  'system':         'The system role in a chat-completion message array — sets the model\'s persona, rules, and constraints before any user message. Same shape across Claude, Azure AI Foundry, and OpenAI-style APIs.',
  'user':           'The human turn in a chat-completion conversation — the message array entry representing what the person asked.',
  'assistant':      'The model\'s turn in a chat-completion conversation — where the generated response is recorded in the messages array.',
  'MCP':            'Model Context Protocol — Anthropic\'s open standard for giving an LLM access to tools and data sources via a uniform JSON-RPC interface.',
  'RAG':            'Retrieval-Augmented Generation — fetch relevant context from a knowledge base before prompting the model.',
  'token':          'The basic unit an LLM processes. ~¾ of an English word on average. 1 K tokens ≈ 750 words.',
  'tokens':         'The basic unit an LLM processes. ~¾ of an English word on average. 1 K tokens ≈ 750 words.',
  'stream':         'Streaming mode — the model sends tokens as they\'re generated instead of waiting to complete the full response.',
  'streaming':      'Streaming mode — the model sends tokens as they\'re generated instead of waiting to complete the full response.',
  'JSON':           'JavaScript Object Notation — the structured data format used for tool inputs/outputs and most LLM API calls.',
  'XML':            'XML tags (e.g. <document>) help an LLM parse structured prompt sections more reliably than plain delimiters.',
  'HITL':           'Human-In-The-Loop — pausing agent execution to get human approval before a high-risk action.',
  'CoT':            'Chain-of-Thought — asking the model to reason step-by-step before giving a final answer.',
  'CoD':            'Chain-of-Draft — asking the model to draft, critique, and refine its response iteratively.',
  'CLAUDE.md':      'Claude Code\'s project config file. Place in the repo root to set persistent instructions, memory, and tool rules.',
  'claude':         'The Claude Code CLI command. Run `claude` in a terminal to start an agentic coding session.',
  'bash':           'Claude Code\'s primary tool for running shell commands, tests, builds, and file operations.',
  'grep':           'Text-search tool Claude Code uses to locate patterns across large codebases quickly.',
  'checkpoint':     'A saved snapshot of agent state. Allows rollback if a long-running task goes wrong.',
  'while':          'The agentic loop pattern — the model keeps running (calling tools → processing results) until stop_reason is "end_turn".',
  'retry':          'Automatic retry logic for transient API errors. Use exponential back-off with jitter to avoid thundering-herd.',
  'prompt':         'The full input sent to an LLM — usually a combination of system prompt + conversation messages.',
  'messages':       'The array of {role, content} objects sent to a chat-completion API (system/user/assistant) representing the conversation history.',
  'content_block':  'A single unit inside a Claude message — text, tool_use, tool_result, or image.',
  // ── Azure AI Foundry ──────────────────────────────────────────────────────
  'azure-ai-projects':  'Azure AI Foundry\'s management-plane SDK — lists connections, deployments, agents, and datasets. Not used for making chat/completion calls.',
  'azure-ai-inference': 'Azure AI Foundry\'s data-plane SDK — the one your app calls on every user request to get a chat/embeddings completion back.',
  'Owner':          'The broadest built-in Azure RBAC role — full control over a resource, including managing access for others. Assigning it "to save time" violates least privilege; scope contributors to a narrower role instead (e.g. Azure AI Developer) on just the project they need.',
};

export function TermTooltip({ term, definition }: { term: string; definition: string }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ left: number; flipped: boolean; caretLeft: number } | null>(null);
  const ref = useRef<HTMLElement>(null);
  const TIP_W = 280;

  const handleShow = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const header = document.querySelector('header');
      const headerBottom = header ? header.getBoundingClientRect().bottom : 64;
      const flipped = rect.top < headerBottom + 130;
      const ideal = rect.left + rect.width / 2 - TIP_W / 2;
      const clamped = Math.max(8, Math.min(vw - TIP_W - 8, ideal));
      const left = clamped - rect.left;
      const caretLeft = Math.max(12, Math.min(TIP_W - 16, rect.width / 2 - left));
      setPos({ left, flipped, caretLeft });
    }
    setVisible(true);
  };

  const tipY: React.CSSProperties = pos?.flipped
    ? { top: 'calc(100% + 6px)', bottom: 'auto' }
    : { bottom: 'calc(100% + 6px)', top: 'auto' };

  return (
    <code
      ref={ref as React.RefObject<HTMLElement>}
      className="cursor-help"
      style={{ textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'rgba(167,139,250,0.8)', textUnderlineOffset: '2px', position: 'relative' }}
      onMouseEnter={handleShow}
      onMouseLeave={() => setVisible(false)}
    >
      {term}
      {visible && pos && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            ...tipY,
            left: `${pos.left}px`,
            width: `${TIP_W}px`,
            zIndex: 60,
            background: 'rgba(9,18,36,0.98)',
            border: '1px solid rgba(167,139,250,0.35)',
            borderRadius: '10px',
            padding: '8px 12px',
            pointerEvents: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'normal',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '12px',
            fontStyle: 'normal',
            fontWeight: 400,
            lineHeight: 1.55,
            letterSpacing: 'normal',
            textDecorationLine: 'none',
            color: '#94a3b8',
          } as React.CSSProperties}
        >
          <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '4px', padding: '1px 6px', marginBottom: '6px' }}>
            key term
          </span>
          {definition}
          {/* caret */}
          <span style={{ position: 'absolute', left: `${pos.caretLeft}px`, ...(pos.flipped ? { top: '-5px', borderTop: '1px solid rgba(167,139,250,0.35)', borderLeft: '1px solid rgba(167,139,250,0.35)' } : { bottom: '-5px', borderBottom: '1px solid rgba(167,139,250,0.35)', borderRight: '1px solid rgba(167,139,250,0.35)' }), transform: 'rotate(45deg)', width: '9px', height: '9px', background: 'rgba(9,18,36,0.98)' }} />
        </span>
      )}
    </code>
  );
}

/** Looks up `text` in GLOSSARY (exact, then lowercase) and returns its definition, or null. */
export function lookupGlossaryTerm(text: string): string | null {
  return GLOSSARY[text] ?? GLOSSARY[text.toLowerCase()] ?? null;
}
