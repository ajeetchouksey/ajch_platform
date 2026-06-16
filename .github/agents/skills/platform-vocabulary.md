# Platform Vocabulary — Aarya AI Learning Hub

**Canonical architectural terms and named frameworks owned by the platform.**

All agents producing content (Tech Writer, Docs Engineer, Assessment Engineer, Curriculum Engineer) **must use these exact terms** — no synonyms. Consistent vocabulary across posts, exam content, and notes builds searchable authority and a coherent platform identity.

---

## Named Frameworks (Platform-Coined)

### The Context Budget Rule
**Definition:** A three-step discipline for deliberately allocating a context window into four zones before writing any prompt: System (≤10%), Knowledge (40–50%), History (20–30%), Task (≥15%).

**Rules:**
1. Allocate by Zone — divide the window before writing the prompt
2. Load Tools Lazily — inject only schemas relevant to the current turn's intent
3. Prune Before You Inject — apply recency-weighted compression to history

**Coined in:** `context-budget-rule` (Field Notes, 2026-06-16)  
**Exam alignment:** CCA-F Domain 5 — Context Management & Reliability  
**Tags:** `context-management`, `token-budget`, `context-window`

---

### The 4-Layer Agent Stack
**Definition:** The four mandatory layers of any production-grade agentic system.

| Layer | Role |
|-------|------|
| **Trigger** | What initiates the agent run (user message, event, schedule) |
| **Reasoning** | The model's decision loop — plan, select tool, evaluate output |
| **Action** | Tool execution against real systems |
| **Validation** | Output verification before returning or persisting |

**Exam alignment:** CCA-F Domain 1 — Agentic Architecture & Orchestration  
**Tags:** `agentic-architecture`, `agent-stack`, `orchestration`

---

### The Retry Pattern
**Definition:** The standard validation-retry loop for LLM-powered systems.

```
validate output
  → if error: extract exact error message + location + failing content
  → return specific error context to model
  → retry with full context
```

The key principle: generic retries give the model no new information. Specific error context lets the model reason about exactly what went wrong.

**Coined in:** quiz explanation, CCA-F D3 (Prompt Engineering)  
**Exam alignment:** CCA-F Domain 3 — Prompt Engineering & Structured Output  
**Tags:** `retry-pattern`, `validation-loop`, `error-context`, `structured-output`

---

### Domain Boundary
**Definition:** The hard constraint that defines the permitted action scope of an agent. A Domain Boundary Violation occurs when an agent acts outside its declared scope — triggered by prompt injection, scope creep in the system prompt, or insufficient guardrails.

**Signs of violation:**
- An ordering bot that writes code
- A support agent that modifies account data without escalation
- A summarization agent that initiates outbound requests

**Coined in:** `order-bot-domain-boundary` (Field Notes)  
**Exam alignment:** CCA-F Domain 2 — Safety, Guardrails & Trust  
**Tags:** `guardrails`, `domain-boundary`, `agent-safety`

---

## Architectural Terms (Standard Usage)

### Lazy Tool Loading
**Definition:** The practice of injecting tool schemas into context only when the current turn's intent requires them, rather than loading all available tools unconditionally.

**Threshold rule:** If the probability a tool will be called this turn is below 30%, it does not belong in the context window.

**Related:** Context Budget Rule (Rule 2), The 4-Layer Agent Stack (Action layer)

---

### Recency-Weighted Pruning
**Definition:** A history compression strategy for multi-turn agents. Keep the last 2 full turns verbatim; compress turns 3–8 into a summary paragraph; discard anything older. Reset entirely on topic switch.

**Rule of thumb:** History zone must never exceed Knowledge zone.

**Related:** Context Budget Rule (Rule 3)

---

### Prompt Caching
**Definition:** The Anthropic API feature that stores a processed context prefix server-side for 5 minutes (refreshed on cache hit), reducing cost by 90% for subsequent calls that share the same static prefix. Activated via `cache_control: { type: "ephemeral" }` on content blocks.

**Exam alignment:** CCA-F Domain 5  
**Tags:** `prompt-caching`, `cache-control`, `cost-optimization`

---

### Context Window Zones
**Definition:** The four named regions of a context window under the Context Budget Rule.

| Zone | Token Budget | Purpose |
|------|-------------|---------|
| System | ≤ 10% | Identity, constraints, output format |
| Knowledge | 40–50% | Retrieved docs, few-shot examples, grounding |
| History | 20–30% | Compressed conversation turns |
| Task | ≥ 15% | Current user message + immediate task |

---

### Validation-Retry Loop
**Definition:** See *The Retry Pattern*. The canonical term for the full cycle: generate → validate → extract error context → retry with context.

---

### Agentic Execution Layer
**Definition:** The architectural tier in which an LLM operates across multiple steps autonomously — observing context, deciding actions, executing against real systems, and assessing results without a human driving each step. Distinct from "automation" (replacing a fixed process) — agents replace *judgment*.

**Coined in:** `agents-are-a-new-execution-layer` (Field Notes)  
**Exam alignment:** CCA-F Domain 1  
**Tags:** `agentic-ai`, `execution-layer`, `autonomous-agents`

---

## Usage Rules for All Agents

1. **Never create a synonym** for a defined term. Use the exact name every time.
2. **Always link exam alignment** when a term maps to a CCA-F domain.
3. **Tag consistency** — use the canonical tags listed above in all posts and notes.
4. **When coining a new framework** in a post, submit a PR to add it to this file. Route through Content Lead → SRE for version bump.
5. **Cross-reference** — when a post uses multiple platform terms, link them to each other where relevant.

---

*Last updated: 2026-06-16 | Maintained by: Content Lead + SRE*
