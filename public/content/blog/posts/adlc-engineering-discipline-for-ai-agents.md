---
title: "The ADLC: A Software Engineering Discipline for AI Agents"
slug: "adlc-engineering-discipline-for-ai-agents"
date: "2026-08-10"
updated: null
author: "Ajeet Chouksey"
excerpt: "SDLC gave software engineering its rigour. AI agents need the same treatment. Here's the Agent Development Life Cycle — six stages that turn agent building from craft into discipline."
tags: ["adlc", "agents", "llmops", "production", "ai-engineering", "evaluation", "observability"]
category: "Engineering"
readingTime: 9
featured: true
draft: false
---

Software engineering earned its credibility through discipline: requirements, design, build, test, deploy, maintain. The SDLC wasn't invented because developers were incompetent — it was invented because software was complex enough that improvisation at scale always failed. AI agents are more complex than traditional software. They deserve the same treatment.

The **Agent Development Life Cycle** (ADLC) is the structured, six-stage process for designing, building, evaluating, deploying, observing, and iterating AI agents in production. It is not a framework you install. It is an engineering discipline you adopt.

---

## Why SDLC Isn't Enough

Traditional SDLC assumes that if you specify requirements correctly and write code that passes tests, the system will behave deterministically. That assumption breaks completely with AI agents.

In an AI agent, three things that SDLC takes for granted become variable:

- **The logic is a prompt, not code.** A prompt is a specification and implementation in one. Changing a single word can change the output distribution. You cannot unit test a prompt the way you test a function.
- **The execution path is non-deterministic.** The same input does not always produce the same tool call sequence. Reasoning traces vary. You test a distribution of behaviour, not a specific path.
- **The failure modes are silent.** A traditional system throws an exception. An agent confidently returns a plausible-looking wrong answer. Catching that requires intentional evaluation infrastructure, not just error logs.

ADLC accepts these realities and builds process around them rather than pretending they don't exist.

---

## The Six Stages

![The ADLC — Six Stages](/content/blog/images/adlc_siy_stages.png)

### Stage 1 — Design: The Agent Contract

Everything in ADLC begins with the **Agent Contract** — a five-field declaration that every agent must specify before a single line of prompt is written:

| Field | What It Declares |
|-------|-----------------|
| **Purpose** | The agent's single, bounded job in plain language |
| **Tools** | The exhaustive list of tools this agent may call |
| **Data** | The data domains this agent may access (read and/or write) |
| **Escalation rules** | Conditions under which the agent must hand off to a human |
| **Limits** | Maximum cost, depth (tool call iterations), and autonomy ceiling |

The Contract is not a design document. It is the specification that the orchestration layer reads and the Tool Gateway enforces at runtime. An agent without a Contract is a domain boundary violation waiting to happen.

Design also covers topology decisions: Is this agent a standalone workload? A specialist in a Supervisor topology? A step in a DAG pipeline? The right topology answer depends on the agent's purpose, its failure modes, and its audit requirements — decisions that must be made in Design, not discovered in production.

### Stage 2 — Build: Prompts, Tools, and Memory

Build in ADLC has three concerns that have no equivalent in traditional SDLC.

**Prompt engineering as implementation.** A prompt is the control logic for the agent's reasoning layer. It must encode the agent's purpose, constraints, output format, and escalation conditions — concisely, without ambiguity, without exploitable injection surfaces. Prompts must be versioned with the same rigour as code. A prompt change is a deployment.

**Tool schema discipline.** Every tool the agent can call must have a validated input schema, an explicit output contract, and a declared failure mode. The schema is what separates a Tool Gateway that enforces policy from a chaotic function-call surface. Under-specified schemas are the most common source of unexpected agent behaviour.

**Memory architecture decisions.** Before Build is complete, you must decide: what does this agent need to remember, and where does that memory live? In-context window (cheap, volatile, size-constrained), a vector store (semantic retrieval, eventual consistency), or a structured external store (transactional, auditable, slower)? The wrong memory choice causes latency surprises, cost overruns, and data leakage — none of which are easy to fix post-deployment.

### Stage 3 — Evaluate: The Hardest Stage

Evaluation is where ADLC diverges most sharply from SDLC, and where most teams underinvest.

**The golden set.** Before an agent ships, you need a curated dataset of inputs with known-correct outputs (or output characteristics). This is your regression baseline. Every subsequent prompt change, tool schema update, or model swap is evaluated against it. Without a golden set, you have no signal — only vibes.

**LLM-as-judge, carefully.** For outputs that are too complex to deterministically score (narratives, reasoning traces, multi-step decisions), a second model can evaluate quality, faithfulness, and policy compliance. Used carefully — with its own golden set and calibration checks — this scales evaluation to the full distribution of agent behaviour. Used carelessly, it introduces a second source of non-determinism into your quality gate.

**Failure mode coverage.** Evaluation must test not just the happy path but the failure modes declared in the Agent Contract: What happens when the agent exceeds its tool call budget? When it receives a prompt injection attempt? When a tool returns an unexpected schema? When confidence is low? These are the scenarios that matter most in production and are most commonly omitted from pre-ship evaluation.

**Threshold gates.** Evaluation must produce a binary ship/no-ship signal. A score of "pretty good" is not a deployment decision. Define pass/fail thresholds before you run evaluation — not after you see the results.

![Evaluation Stage Flow](/content/blog/images/adlc_evaluation_stage_flow.png)

### Stage 4 — Deploy: Version Everything

Deployment in ADLC must treat prompts, Agent Contracts, tool schemas, and model versions as first-class release artefacts — not implementation details.

**Canary releases.** Deploy the new agent version to a small traffic slice. Monitor business outcome metrics — not just token counts and latency. Roll forward if outcomes hold. Roll back if they don't. This requires that your observability layer (Stage 5) is already in place before the first canary.

**Version tagging.** Every deployed agent must carry a version that combines: model version + prompt version + Contract version + tool schema version. When a production incident occurs, you need to reproduce the exact configuration that was running at the time of the incident. Without explicit version tagging across all four dimensions, that reconstruction is guesswork.

**Agent-as-Workload for v1.** The first deployment of any agent should run as an isolated container with its own identity, sandbox, and lifecycle. A compromised or misbehaving agent must not be able to affect neighbouring agents. Consolidate to shared runtimes only after the agent's blast radius is well understood.

### Stage 5 — Observe: Traces That Span Every Layer

Traditional application monitoring asks: *Is the system up? Is it fast?* Agent observability asks: *Did the agent make the right decision? Which tool returned stale data? Which reasoning step went wrong?*

**Structured traces.** Every agent run must produce a structured trace that captures: the input, the reasoning steps (if accessible), every tool call (inputs, outputs, latency), the final output, and the business outcome. These traces are the raw material for debugging, compliance auditing, and future evaluation dataset construction.

**Business outcome metrics.** The primary metric for a production agent is not token consumption or inference latency — it is whether the agent successfully completed its bounded job. "Did the expense claim get correctly processed?" is a different question from "Did the model generate coherent text?" Instrument for the former.

**Policy enforcement events.** Every time the Tool Gateway blocks a call, every time the agent escalates to a human, every time a confidence threshold triggers a hold — these are structured events that must be logged, counted, and alerted on. They are your compliance audit trail and your primary signal for Contract drift.

**Drift detection.** Output distributions change as real-world input distributions shift. A weekly sample of production traces evaluated against the golden set catches prompt drift, model drift, and data drift before they become user-visible failures.

### Stage 6 — Iterate: Disciplined Change Management

In SDLC, iteration means a new sprint. In ADLC, iteration means a change to a non-deterministic system that is already in production — which requires more discipline, not less.

**Every change is a potential regression.** A prompt edit that improves performance on one input class frequently degrades performance on another. Iteration must always run the full golden-set evaluation before merge. There is no such thing as a trivial prompt change.

**Separate concerns across iterations.** Change one variable at a time: model version, or prompt, or tool schema, or Contract limits — not all four simultaneously. Multi-variable changes make it impossible to attribute a regression to its cause.

**Contract amendments are deployments.** If the agent's purpose, tool list, data access, escalation rules, or limits change, the Contract has been amended. A Contract amendment is treated as a major version bump and triggers the full Deploy + Observe cycle from the start.

---

## ADLC vs SDLC: The Key Differences

![ADLC vs SDLC](/content/blog/images/adlc_vs_sdlv.png)

| Dimension | SDLC | ADLC |
|-----------|------|------|
| Primary logic artefact | Code | Prompt + Contract |
| Testing approach | Deterministic assertions | Distribution evaluation |
| Failure detection | Exceptions, errors | Silent wrong answers, drift |
| Deployment unit | Application version | Model + Prompt + Contract + Schema |
| Observability target | System health | Business outcome quality |
| Change management | Code review + CI | Eval gate + golden-set regression |

---

## The Organisational Implication

ADLC implies roles that most organisations don't yet have: someone who owns the golden set, someone who designs Agent Contracts, someone who reads policy enforcement event dashboards.

In practice, these responsibilities often fall to the same engineer who built the agent — and they get deprioritised because evaluation datasets aren't features and golden sets don't appear in sprint demos.

The teams that get AI agents to production successfully are the ones that treat these disciplines as first-class engineering responsibilities — scheduled, resourced, reviewed — not as afterthoughts that happen "once the agent is good enough."

An agent is never good enough if you don't have the infrastructure to know whether it's good at all.

---

## Key Takeaways

- **SDLC assumptions break with AI agents.** Logic is probabilistic, failure modes are silent, and testing a distribution is not the same as testing a function.
- **The Agent Contract is the foundational design artefact.** Purpose, Tools, Data, Escalation, Limits — declared before a prompt is written, enforced at runtime.
- **Evaluation is the hardest and most underinvested stage.** A golden set, threshold gates, and failure-mode coverage are non-negotiable for production.
- **Every change is a potential regression.** Change one variable at a time. Run the golden-set evaluation every time.
- **Observe business outcomes, not just system health.** Did the agent complete its bounded job correctly? That is the metric that matters.
- **ADLC is a discipline, not a framework.** It scales from a single agent to a multi-agent platform — as long as the team treats it as seriously as they treat their software engineering practices.

> *An agent in production without evaluation infrastructure is not a shipped feature. It is a liability with a user interface.*
