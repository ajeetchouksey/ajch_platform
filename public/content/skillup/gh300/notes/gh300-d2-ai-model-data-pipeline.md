# D2: AI Model, Data Pipeline & Core Concepts

> **Exam weight**: ~25% · **Questions**: ~33 of 134

## Overview

Domain 2 covers what happens *under the hood* — how large language models generate suggestions, where training data comes from, and how Copilot's data pipeline works from keystroke to suggestion.

> 💡 **Human Angle**: *"Copilot doesn't 'know' your code — it predicts it. Understanding this distinction is the key to understanding both its power and its limits."*

## How Copilot Generates Suggestions

### The Prediction Loop

1. **Prompt construction** — Copilot assembles a context window from your open files, cursor position, and editor metadata
2. **Model inference** — The assembled prompt is sent to the LLM (hosted by GitHub/Microsoft)
3. **Suggestion rendering** — The model's token predictions are displayed as ghost text or chat responses
4. **Feedback loop** — Accepted/rejected suggestions feed into aggregate telemetry (not individual training)

### LLM Limitations

| Limitation | Implication |
|---|---|
| Knowledge cutoff | Copilot doesn't know about libraries released after training |
| Hallucination | Confident but wrong suggestions are possible — always verify |
| Non-determinism | Same prompt can produce different outputs at different times |
| Context window cap | Very large files may exceed the context window; earlier content gets truncated |

### Exam Trap ⚠️

<div class="note-trap">
The exam frequently tests whether students understand that Copilot's suggestions are *probabilistic*, not *deterministic*. A suggestion that works once may not appear again. This is by design, not a bug.
</div>

## Training Data & the Codex/GPT Lineage

GitHub Copilot is powered by models trained on:
- Publicly available code from GitHub repositories
- Other publicly available sources

**Key facts for the exam**:
- Training uses *public* code only — your private repositories are NOT used to train the shared model (unless you opt in to enterprise telemetry sharing, which is off by default)
- The model is updated periodically; the exact cutoff isn't user-controllable
- Fine-tuned models for enterprise (Copilot Enterprise) can be trained on org-specific repositories

## Data Flow Architecture

```mermaid
graph LR
  A[Developer types] --> B[IDE Extension]
  B --> C[Context Assembly]
  C --> D[API Request to GitHub]
  D --> E[LLM Inference]
  E --> F[Suggestion Response]
  F --> G[Rendered as ghost text]
  G -->|Accept/Reject| H[Telemetry log]
  H -->|Aggregate only| I[Product improvement]
```

## Copilot Subscription Tiers

| Tier | Who | Key capabilities |
|---|---|---|
| Copilot Individual | Single developer | IDE suggestions, Copilot Chat |
| Copilot Business | Teams | Org policy controls, usage analytics |
| Copilot Enterprise | Enterprise | Copilot Chat in GitHub.com, knowledge bases, fine-tuned models |

### Exam Trap ⚠️

<div class="note-trap">
Students confuse Copilot Business and Copilot Enterprise. **Enterprise** adds: Copilot Chat on GitHub.com (web UI), knowledge bases (indexing org repositories for retrieval), and fine-tuning capabilities. Business does NOT include these.
</div>

## Deep Dive: Making the Data Pipeline Click

### 1. The connective narrative

When you press a key, Copilot doesn't query a database — it runs neural network inference. The model has encoded patterns from millions of code files, and it uses statistical relationships between tokens to predict what comes next. This is why it can write plausible-looking but wrong code: it's optimizing for statistical likelihood, not correctness.

The data pipeline has three stages that the exam cares about:
1. **Training** — happens offline, uses public GitHub repos, produces the model weights
2. **Inference** — happens at suggestion time, uses the assembled context window, produces token predictions
3. **Telemetry** — happens after accept/reject, feeds aggregate product metrics (not individual model retraining per user)

### 2. Worked scenario

> **Scenario.** A security auditor asks: "Does GitHub Copilot Business train on my company's private code?" The developer says "I don't know — let me check." What is the correct answer?
>
> **Answer.** By default, code from Copilot Business (and Individual) subscribers is *not* used to train GitHub's shared models. This is an opt-out by default. The organization admin can verify this in the enterprise settings under "Policies → Copilot → Allow GitHub to use my organization's code snippets to improve Copilot".
>
> **Exam relevance.** Questions about training data use this exact scenario. The answer is always: private code is NOT used by default.

### 3. Memory aid

**PILL** — the four stages Copilot data passes through:
- **P**rompt assembly (IDE extension)
- **I**nference (LLM)
- **L**og (telemetry — aggregate only)
- **L**earn (model update — offline, uses public data)

### 4. Exam strategy for this domain

- Training data = public GitHub repos by default; private orgs are NOT included
- Copilot Enterprise adds knowledge bases and web chat — Business does not
- Hallucination is a known model limitation — the exam expects you to know mitigations (code review, tests)
- Context window overflow: when a file is too large, the beginning is truncated — the model sees the end, not the start
- One sentence: *"Copilot predicts tokens; it does not retrieve facts."*

## Cheat Sheet 📋

| Concept | Key Rule |
|---|---|
| Private code in training | No — opt-out by default |
| Copilot Enterprise extra | Knowledge bases + web chat |
| Hallucination mitigation | Review + tests — not prompt tweaks |
| Context window overflow | Beginning of file truncated |
| Non-determinism | Same prompt can yield different output |
| Telemetry is | Aggregate product metrics, not per-user retraining |
