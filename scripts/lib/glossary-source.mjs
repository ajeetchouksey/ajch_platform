/**
 * glossary-source.mjs
 *
 * Canonical, hand-curated term -> definition dictionary for the inline
 * glossary tooltip (src/components/GlossaryTerm.tsx renders it; see
 * scripts/build-glossary.mjs, which is the ONLY thing that reads this file).
 *
 * This is intentionally the single source of truth for definitions — the
 * frontend never imports this file directly. scripts/build-glossary.mjs
 * bakes it into public/content/glossary.json, enriched with usageCount/
 * usedIn computed by scanning skillup exam/skill-track notes for backtick-
 * wrapped mentions of each key, the same "curated source -> generated JSON
 * with computed cross-content data" shape as public/content/taxonomy.json
 * (seeded by scripts/seed-taxonomy.mjs) and public/content/relationships.json
 * (computed by scripts/build-content-intelligence.mjs).
 *
 * Keys are matched against markdown inline-code spans (`` `term` ``),
 * case-sensitive first then case-insensitive as a fallback — see
 * lookupGlossaryTerm's port in src/lib/glossary.ts.
 */
export const GLOSSARY_SOURCE = {
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
