---
title: "You're Wasting 60% of Your Context Window"
excerpt: "Your agent isn't hallucinating. It's starving. Here's why — and the three-rule fix that engineers actually ship."
author: "Ajeet Chouksey"
date: "2026-06-16"
updated: null
tags: ["context-management", "cca-f", "domain-5", "named-framework", "token-budget"]
category: "AI Architecture"
readingTime: 7
featured: true
draft: false
---

Your agent gave the wrong answer last Tuesday. Not because the model failed. Because you sent it into the session carrying 6,000 tokens of baggage it did not need — and zero tokens of the evidence it did.

The system prompt holds your entire return policy. The conversation history is a raw transcript going back eighteen turns. Eight tool schemas are loaded unconditionally, including the PDF extractor that has never once been called. By the time the model sees the user's actual question, it has already spent half its attention budget reading bureaucracy.

This is not a hallucination problem. It is a budget problem. And budgets have only one fix: stop spending on things that don't matter.

---

## The Three Smells of a Broken Context Window

You don't need a token counter to know your context is broken. You need to know what to smell for.

### Smell #1 — Your System Prompt Has a Table of Contents

If your system prompt is long enough to need structure, it is too long to be useful. I have reviewed production prompts that open with *"As a helpful customer service assistant, I will..."* and continue for 3,800 tokens before the first user message arrives. The model does not get sharper by reading more rules. It gets noisier. Every sentence you add to the system prompt is a sentence of attention the model spends on instructions instead of the problem.

The tell: your system prompt explains edge cases that have never happened in production.

**A system prompt is a constraint, not a manual.** If yours reads like a manual, burn it down to three things: what the agent is, what it must never do, and what format it must return. That is 200 tokens. Everything else is noise.

### Smell #2 — Your Knowledge Zone Is Empty

You gave the model a 128K context window. You are using 8K of it. The other 120K sits empty while the model reasons from instructions alone — no retrieved documents, no few-shot examples, no grounding data. Then you wonder why the output is generic.

The tell: your agent produces answers that could have been written without reading anything.

**An LLM operating without evidence is not reasoning — it is improvising.** Retrieval is not an optional enhancement. It is the difference between a consultant who read your brief and one who just walked in cold.

### Smell #3 — Every Tool Is Always Loaded

A single OpenAPI-style tool schema costs 150–400 tokens. Load ten tools unconditionally and you have burned up to 4,000 tokens on capabilities that will never fire this turn. That is 4,000 tokens the knowledge zone could have used for grounding data that would have actually changed the answer.

The tell: your tool list in the system prompt looks like a product brochure.

**Loading tools you don't need is not defensive programming — it is context pollution.** An intent classifier that routes the current turn takes 50 tokens. The ten tool schemas it prevents you from loading take 3,000. The math is not close.

---

## The Context Budget Rule

The **Context Budget Rule** is a three-rule allocation discipline. It is not a guideline. Apply it at design time, enforce it at runtime, and cite it in architecture reviews when someone wants to add another escalation policy to the system prompt.

### Rule 1 — Allocate by Zone Before You Write a Single Word

Divide the context window into four named zones. Assign percentages before you write the prompt, not after.

| Zone | Budget | What goes here |
|------|--------|----------------|
| **System** | ≤ 10% | Identity, hard constraints, output format. Nothing else. |
| **Knowledge** | 40–50% | Retrieved documents, few-shot examples, grounding data |
| **History** | 20–30% | Pruned turns — recency-weighted, never verbatim transcripts |
| **Task** | ≥ 15% | The current user message and immediate task context |

The System zone is the canary. If it exceeds 10%, you have a bureaucracy, not an agent. Stop writing system prompt and start writing retrieval logic.

### Rule 2 — Lazy Tool Loading Is Not Optional

Never inject a tool schema unconditionally. Use an intent classifier — even a simple one — to determine which tools are in scope for the current turn. Inject only those. Leave the rest out.

The threshold is simple: **if the probability that a tool will be called this turn is below 30%, it does not belong in the context.** A routing step that prevents 2,400 tokens of unused schemas from loading is worth ten times its own cost.

### Rule 3 — History Is Not a Transcript

Conversation history is the context zone that grows uncontrolled. Left untended, it consumes the Knowledge zone. Apply **Recency-Weighted Pruning** before every inject: keep the last two turns verbatim, compress turns three through eight into a single summary paragraph, and discard everything older. When the session topic switches, reset.

The rule of thumb that catches regressions in code review: **history must never exceed knowledge.** When it does, the model is replaying the past instead of reasoning about the present.

---

## The Same Task, Two Context Windows

Both examples below use the same model, the same 128K window, and the same task: summarise a customer complaint and recommend resolution.

**Before — no budget:**

```text
System prompt:   3,800 tokens  (full persona, 12 policies, 8 tool schemas, return policy verbatim)
History:         4,200 tokens  (verbatim transcript, 18 turns)
Knowledge:           0 tokens  (nothing retrieved)
Task:              120 tokens  (the actual complaint)

Total consumed:  8,120 tokens
Knowledge share:     0%
```

**After — Context Budget Rule applied:**

```text
System prompt:     380 tokens  (role, output format, one hard constraint)
Knowledge:       2,400 tokens  (3 KB articles via semantic search + 2 resolved cases)
History:           600 tokens  (last 2 turns verbatim + 8-turn compressed summary)
Tool schemas:      280 tokens  (ticket-create only — intent classifier routed this turn)
Task:              120 tokens  (same complaint)

Total consumed:  3,780 tokens
Knowledge share:    63%
```

Same model. Same task. The second version runs on 53% less context and arrives with 6× the grounding data. The output difference is not subtle. The first version produces a deflection. The second produces a recommendation with a confidence score the agent can justify.

The model did not get smarter. The architecture got honest about what it was asking the model to do.

---

> **CCA-F Domain 5 — Context Management & Reliability**
>
> The Context Budget Rule maps directly to Domain 5, which tests your ability to design systems that manage context window allocation, history compression, and retrieval strategies under real token constraints. Zone budgeting, Lazy Tool Loading, and Recency-Weighted Pruning are scored competencies — not background reading.
>
> [Study Domain 5 → CCA-F Exam Prep](/skillup/ccaf)

---

## The Model Does Not Warn You

When your context window fills, the model does not ask what to keep. It truncates from the left — silently, without a log line, without an exception. The three KB article you spent four retrieval calls to surface disappears. The two few-shot examples that would have anchored the output format are gone. What the model reasons over is whatever survived the cut.

You will not see a truncation error. You will see a subtly worse answer and spend two hours wondering why the model regressed.

**The engineers who ship reliable agents are not the ones with the best models. They are the ones who know exactly what the model reads before it answers.**

The Context Budget Rule is not a performance optimisation. It is a reliability control — the difference between an agent you can reason about and one you can only hope works. Treat your context window like the scarce, stateful resource it is.

Count your tokens before your system does it for you — [Token Counter →](/tools/token-counter)
