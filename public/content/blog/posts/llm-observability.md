---
title: "Observability for LLMs: Logs, Traces, and the Token Meter"
excerpt: "Your API returned 200 OK and your users were furious. Here's the three-signal observability model that tells you what actually happened inside the model call — before the bill arrives."
author: "Ajeet Chouksey"
date: "2026-07-17"
updated: null
tags: ["observability", "llmops", "tracing", "cost-tracking", "platform-engineering"]
category: "LLMOps"
readingTime: 8
featured: false
draft: false
---

The dashboard was green. Every request returned `200 OK`, p95 latency looked fine, error rate was flat. And the support queue was on fire — users reporting slow, vague, occasionally unhinged answers from the assistant you shipped last week.

Your HTTP metrics were lying to you. Not on purpose. They just have no idea what happens between the request and the response, because for an LLM system the interesting failures live *inside* a successful call: a retrieval that returned the wrong chunk, a tool that looped four times, a context window that silently truncated your grounding data, a model that spent 9,000 reasoning tokens to produce one wrong sentence.

Traditional observability watches the pipe. LLM observability has to watch the water going through it. That is three signals, and if you are missing any one of them you are operating blind.

---

## Why Your Existing Stack Doesn't Cover This

APM tools were built for deterministic systems. Same input, same code path, same output — so a status code and a latency number tell you almost everything. LLM calls break all three assumptions:

- **Non-deterministic output.** The same prompt can return a good answer at 9am and a bad one at 9:01. A `200` tells you the call succeeded, not that the answer was correct.
- **Cost is variable per request.** A CPU-bound endpoint costs roughly the same every time. An LLM call can cost $0.002 or $0.40 depending on how much context you stuffed and how much the model decided to think.
- **The failure is semantic, not structural.** Nothing threw. The retrieval just missed. The model just hallucinated a tool argument. Your exception tracker sees nothing.

You cannot bolt this onto request-count dashboards. You need signals designed for the shape of the problem.

---

## The Three Signals

Think of it as three meters on the same dashboard: **what was said** (logs), **what happened** (traces), and **what it cost** (the token meter). Miss one and you can see a problem but not diagnose it — or diagnose it but never see it coming.

### Signal 1 — Logs: Capture the Full Exchange, Not Just the Verdict

The single most common observability gap in production AI is logging the model's *answer* but not its *input*. When a user reports a bad response, you open the log and find the output — with no way to reconstruct what the model actually read to produce it.

Log the whole exchange for every call:

- The **rendered prompt** — the final assembled string after templating, retrieval injection, and history compression. Not the template. The real bytes the model saw.
- The **retrieved context** — which documents/chunks were injected, and their similarity scores.
- The **model + parameters** — model name, version, temperature, max tokens, `tool_choice`.
- The **raw response** — including tool calls, finish reason, and refusals.

The finish reason alone catches a class of silent failures. `stop` is healthy. `length` means you truncated the output mid-thought. `content_filter` means the model refused and your user got a shrug. If you are not logging finish reason, you are missing your cheapest early-warning signal.

> **One hard rule: prompts are a PII surface.** The moment you log rendered prompts, your logs contain whatever the user typed — support tickets, account numbers, health details. Redact at capture time, set retention deliberately, and treat the log store as regulated data. "We log everything forever" is a compliance incident waiting for an auditor.

### Signal 2 — Traces: See the Whole Call Graph, Not One Span

A single user question can fan out into a dozen model and tool calls: classify intent, retrieve, rerank, call a tool, feed the result back, generate, validate. When the answer is wrong, "the LLM call was slow" is useless. You need to see *which* step in the chain broke.

Distributed tracing — the same OpenTelemetry model you already use for microservices — is the right tool. Give every user request one **trace ID**, and make every model call, retrieval, and tool invocation a **span** underneath it. Now a slow p95 becomes a specific span: the reranker taking 1.8s, or the agent making its fourth tool call in a loop that should have stopped at one.

The payoff is the loop. A trace makes an agent that re-planned six times *visible* — six sibling spans under the same parent, each burning tokens and wall-clock. On a flat latency chart that is one slow request. On a trace it is an obvious runaway you can put a step-budget guard around.

### Signal 3 — The Token Meter: Watch the Money in Real Time

Tokens are the unit of both cost *and* latency, and they are the signal most teams discover only when finance forwards the bill. Instrument them per call and attribute them up the stack:

- **Per call:** input tokens, output tokens, and — if you use reasoning models — thinking tokens, which are billed and invisible in the visible response.
- **Per request:** the sum across the whole trace, so a "cheap" feature that quietly makes eleven model calls can't hide.
- **Per tenant / per feature:** the attribution that answers *who* spent the money, not just *how much*.

The token meter is also your best leading indicator of a quality regression. A prompt change that quietly doubles average input tokens usually shows up as a cost spike *before* it shows up as a latency complaint — and long before anyone files a "the bot got worse" ticket.

---

## One Incident, Three Signals

Same outage from the top of this post. Here is what each signal contributed to the diagnosis.

**The symptom:** p95 latency doubled from 2.1s to 4.4s over an afternoon. HTTP dashboard: all green, error rate 0%.

**The trace** showed the shape of the problem. A normal request had four spans: `classify → retrieve → generate → validate`. The slow requests had *nine* — the agent was calling the `lookup_order` tool three and four times per turn, each call a sibling span, each adding ~600ms.

**The logs** showed why. The rendered prompt revealed the retrieved context had gone empty for a subset of queries after a data re-index that morning. With no grounding, the model kept re-calling the tool trying to find an answer it could never assemble — then produced a confident guess.

**The token meter** showed the blast radius. Average tokens-per-request had climbed from 1,900 to 5,600 on the affected path. Projected forward, the loop was on track to add roughly $1,400 to the month's bill — from a change nobody flagged as risky because *the tests passed and the endpoint returned 200*.

Diagnosis time with all three signals: about fifteen minutes. Diagnosis time with only an HTTP dashboard: the two hours you spend re-reading application code that was never the problem.

---

## What to Instrument — the Checklist

Wire these at the boundary where your code calls the model, once, for every call:

- [ ] **Trace ID** on the user request; a **span** per model call, retrieval, and tool call
- [ ] **Rendered prompt** + **retrieved chunks** (with scores), redacted for PII
- [ ] **Model, version, and parameters** (temperature, max tokens, `tool_choice`)
- [ ] **Finish reason** and any **refusal / content-filter** flag
- [ ] **Input / output / reasoning tokens** per call, summed per request
- [ ] **Cost attribution** dimension (tenant, feature, or route)
- [ ] **Tool-call count per turn** — with an alert threshold for loops

If you can only add one thing today, add finish reason and per-request token count. They are two fields, and together they catch truncation, refusals, and runaway cost — the three failures your green dashboard is hiding right now.

---

> **CCA-F Domain 5 — Context Management & Reliability**
>
> Observability is the operational half of reliability. Domain 5 tests whether you can design AI systems you can actually run in production — instrumenting context usage, detecting silent truncation, and reasoning about token budgets under load. Logs, traces, and the token meter are how those design decisions become measurable in the wild.
>
> [Study Domain 5 → CCA-F Exam Prep](/skillup/ccaf)

---

## You Cannot Operate What You Cannot See

The uncomfortable truth of running LLMs in production is that the model will fail quietly, succeed expensively, and never once throw an exception to tell you. A `200 OK` is not a promise that the answer was right, cheap, or fast — it is a promise that the HTTP layer worked, which was never the part you were worried about.

The teams who run reliable AI are not the ones with the fewest incidents. They are the ones who can explain any incident in fifteen minutes because they logged what the model read, traced how the call unfolded, and metered what it cost — before a user, or the finance team, told them something was wrong.

Instrument the water, not just the pipe.

Know the cost of a prompt before you ship it — [Token Counter →](/tools/token-counter)
