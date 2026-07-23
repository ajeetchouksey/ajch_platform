#!/usr/bin/env python3
"""
build-ccaf-expand.py
Expand the CCA-F (Claude Certified Architect - Foundations) question bank to ~250
questions weighted by the official exam blueprint. Grounded in the CCA-F Exam
Guide v1.0 (Effective July 2026) task statements.

Site domain numbering (preserved from public/content/exams/index.json):
  D1 Agentic Architecture & Orchestration      27%  -> target 68
  D2 Claude Code Configuration & Workflows     20%  -> target 50
  D3 Prompt Engineering & Structured Output     20%  -> target 50
  D4 Tool Design & MCP Integration              18%  -> target 45
  D5 Context Management & Reliability           15%  -> target 37

This script is idempotent: it merges new questions by id, skipping ids that
already exist, then writes each domain file back sorted by id.
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QDIR = os.path.join(ROOT, "public", "content", "questions")

FILES = {
    1: "domain1-agentic.json",
    2: "domain2-claude-code.json",
    3: "domain3-prompt-eng.json",
    4: "domain4-tool-design.json",
    5: "domain5-context-mgmt.json",
}

# NEW[domain] = list of question dicts to add.
NEW = {1: [], 2: [], 3: [], 4: [], 5: []}


def q(domain, idx, scenario, question, options, correct, explanation, tags):
    return {
        "domain": domain,
        "id": f"d{domain}-{idx:03d}",
        "scenario": scenario,
        "question": question,
        "options": options,
        "correct": correct,
        "explanation": explanation,
        "tags": tags,
    }


# =====================================================================
# DOMAIN 1 - Agentic Architecture & Orchestration  (add d1-014 .. d1-068)
# Task statements 1.1-1.7
# =====================================================================
NEW[1] += [
    q(1, 14,
      "You are implementing the core agentic loop for a Claude Agent SDK application. After each model response you must decide whether to continue or stop.",
      "What is the correct signal to terminate the agentic loop?",
      [
        "The assistant message contains a sentence like 'I am done' or 'Task complete'",
        "stop_reason is 'end_turn' and there are no pending tool_use blocks to execute",
        "A fixed maximum of 10 iterations has been reached",
        "The response length drops below a token threshold"
      ], 1,
      "Loop termination must be driven by the API's stop_reason. When stop_reason is 'end_turn' with no tool_use blocks, Claude has nothing more to execute and the loop ends. Parsing natural-language phrases (A) is an anti-pattern - phrasing is probabilistic. Iteration caps (C) are a safety backstop, not the primary stopping mechanism. Response length (D) is unrelated to completion.",
      ["agentic-loop", "stop_reason", "loop-termination", "end_turn"]),

    q(1, 15,
      "Your agentic loop receives a response where stop_reason is 'tool_use' and Claude requested two tools: get_weather and get_time.",
      "What must your loop do before sending the next request?",
      [
        "Execute only the first tool and let Claude re-request the second next turn",
        "Execute both requested tools and append both tool_result blocks to the conversation before the next request",
        "Ignore the tool calls and ask Claude to clarify which tool it really needs",
        "Terminate the loop because two tools in one turn is invalid"
      ], 1,
      "When stop_reason is 'tool_use', you execute every requested tool and append each result as a tool_result block keyed to its tool_use_id, then send the updated conversation back. Executing only one (A) leaves a dangling tool_use with no result, which is an API error. The multi-tool request is valid (D is wrong), and clarifying (C) discards Claude's decision.",
      ["agentic-loop", "tool_use", "parallel-tools", "tool_result"]),

    q(1, 16,
      "A junior engineer proposes ending the agentic loop as soon as the assistant response contains any text block, reasoning that text means Claude is 'talking to the user' rather than using tools.",
      "Why is this approach unreliable?",
      [
        "Text blocks are never returned alongside tool_use blocks",
        "Claude can emit explanatory text in the same turn as a tool_use block, so text presence does not indicate completion; only stop_reason does",
        "Text blocks always mean an error occurred",
        "The API strips text when tools are used"
      ], 1,
      "Claude frequently returns a text block ('Let me look that up...') together with tool_use blocks in the same turn. Treating text as a completion signal terminates the loop prematurely while tools are still pending. The authoritative completion indicator is stop_reason == 'end_turn', not the presence of text.",
      ["agentic-loop", "stop_reason", "anti-pattern", "loop-termination"]),

    q(1, 17,
      "You are deciding between a hard-coded decision tree (if intent==refund then call process_refund) and a model-driven loop where Claude selects tools based on context.",
      "When is the model-driven agentic loop the better choice?",
      [
        "When the task has a small, fixed, fully known set of steps in a guaranteed order",
        "When the path depends on intermediate results and cannot be fully enumerated in advance",
        "When you need deterministic, auditable behavior with zero variability",
        "When latency must be minimized above all else"
      ], 1,
      "Model-driven loops shine when the next action depends on information discovered at run time (open-ended investigation, branching support flows). Fully known, fixed-order workflows (A) are better as deterministic code. When you need zero variability (C), use programmatic control. Model-driven adds latency, so (D) argues against it.",
      ["agentic-loop", "model-driven", "decision-tree", "workflow-patterns"]),

    q(1, 18,
      "Your agent occasionally enters a loop where it calls the same search tool repeatedly with slightly reworded queries, never converging.",
      "Which is the most robust safeguard without breaking legitimate multi-step reasoning?",
      [
        "Remove the search tool entirely",
        "Combine an iteration cap as a backstop with progress tracking that detects repeated no-progress tool calls",
        "Lower max_tokens so responses are shorter",
        "Switch stop_reason handling to terminate on the first tool_use"
      ], 1,
      "A pure iteration cap alone is a blunt instrument, but as a backstop combined with progress detection (e.g., flagging repeated identical/near-identical calls that yield no new information) it prevents runaway loops without cutting off valid reasoning. Removing the tool (A) breaks the feature. max_tokens (C) is unrelated. Terminating on first tool_use (D) breaks all multi-step tasks.",
      ["agentic-loop", "iteration-cap", "reliability", "no-progress"]),

    q(1, 19,
      "In a hub-and-spoke multi-agent system, a subagent needs data that another subagent produced earlier in the run.",
      "How should that data reach the second subagent?",
      [
        "Subagents share global memory automatically, so no action is needed",
        "The coordinator passes the required prior findings explicitly in the second subagent's prompt",
        "The second subagent calls the first subagent directly to request the data",
        "Store the data in the model's context window so all agents inherit it"
      ], 1,
      "Subagents operate with isolated context and do not inherit the coordinator's or peers' history. In hub-and-spoke, all inter-agent communication flows through the coordinator, which explicitly injects the needed findings into each subagent's prompt. Direct subagent-to-subagent calls (C) break observability and consistent error handling. There is no shared global memory (A, D).",
      ["multi-agent", "coordinator-subagent", "context-passing", "hub-and-spoke"]),

    q(1, 20,
      "A coordinator always runs the full pipeline: web_search -> analyze -> synthesize -> report, even for simple factual queries answerable from a single search.",
      "What improvement best follows good orchestration design?",
      [
        "Merge all subagents into one mega-agent to reduce overhead",
        "Have the coordinator analyze query complexity and dynamically invoke only the subagents needed",
        "Always run subagents in parallel regardless of dependencies",
        "Remove the coordinator and let subagents self-organize"
      ], 1,
      "A well-designed coordinator assesses query requirements and selectively invokes subagents rather than forcing every query through the full chain. Merging into one agent (A) loses separation of concerns. Blind parallelism (C) ignores real dependencies. Removing the coordinator (D) destroys the observability and routing benefits of hub-and-spoke.",
      ["multi-agent", "coordinator", "dynamic-routing", "orchestration"]),

    q(1, 21,
      "Your research coordinator decomposes 'survey the state of solid-state batteries' by assigning each subagent the identical broad query.",
      "What problem does this cause and how is it fixed?",
      [
        "It causes duplication; partition scope by assigning distinct subtopics or source types to each subagent",
        "It causes nothing; identical queries improve reliability through voting",
        "It causes latency only; fix by running them sequentially",
        "It causes context overflow; fix by shrinking max_tokens"
      ], 0,
      "Identical broad queries make subagents cover the same ground, wasting effort and leaving gaps. Partitioning scope - assigning each subagent a distinct subtopic or source type (academic papers vs industry news vs patents) - minimizes duplication and maximizes coverage. Voting (B) is not the goal here; the issue is coverage/duplication, not latency (C) or tokens (D).",
      ["multi-agent", "task-decomposition", "scope-partitioning", "coordinator"]),

    q(1, 22,
      "After synthesis, the coordinator notices the report omits an entire subtopic the user asked about.",
      "Which orchestration pattern addresses this?",
      [
        "Accept the gap; re-running is too expensive",
        "An iterative refinement loop: coordinator detects the gap, re-delegates targeted search/analysis, then re-invokes synthesis until coverage is sufficient",
        "Ask the user to rephrase the original request",
        "Increase the synthesis agent's max_tokens and retry verbatim"
      ], 1,
      "Iterative refinement lets the coordinator evaluate synthesis output for gaps, dispatch targeted follow-up queries to search/analysis subagents, and re-run synthesis until coverage criteria are met. Accepting the gap (A) fails the task. Rephrasing (C) shifts burden to the user. Raising max_tokens (D) does not fix missing information that was never gathered.",
      ["multi-agent", "iterative-refinement", "coverage", "coordinator"]),

    q(1, 23,
      "Your coordinator must spawn subagents. During setup you configure allowedTools for the coordinator.",
      "What must allowedTools include for the coordinator to invoke subagents?",
      [
        "The Bash tool",
        "The Task tool",
        "The Read tool",
        "Nothing; subagent spawning is always enabled"
      ], 1,
      "Subagents are spawned via the Task tool. For a coordinator to invoke them, its allowedTools configuration must include 'Task'. Bash (A) and Read (C) are unrelated built-ins. Spawning is not implicitly enabled (D) - it must be granted through allowedTools.",
      ["multi-agent", "Task-tool", "allowedTools", "subagent-spawning"]),

    q(1, 24,
      "You pass web search results to a synthesis subagent by concatenating everything into one prose blob, losing which URL each fact came from.",
      "How should context be passed to preserve attribution?",
      [
        "Use a structured format that separates content from metadata (source URLs, titles, page numbers)",
        "Rely on the synthesis agent to guess sources from wording",
        "Only pass the first source to keep the prompt short",
        "Ask the coordinator to remember sources instead of passing them"
      ], 0,
      "To preserve provenance across handoffs, pass context in a structured format that keeps each claim linked to its metadata (source URL, document name, page). A prose blob (chosen wrong) destroys attribution. Guessing (B) fabricates citations, dropping sources (C) loses coverage, and expecting the coordinator to 'remember' (D) doesn't help the subagent that must cite.",
      ["multi-agent", "context-passing", "provenance", "structured-data"]),

    q(1, 25,
      "You want three independent enrichment subagents to run at once to cut latency.",
      "How do you spawn them for true parallel execution?",
      [
        "Emit three Task tool calls across three separate coordinator turns",
        "Emit multiple Task tool calls within a single coordinator response",
        "Call one Task tool and ask it to fan out internally",
        "Set tool_choice to 'any' so they run together"
      ], 1,
      "Parallel subagents are launched by emitting multiple Task tool calls in a single coordinator response; they then execute concurrently. Spreading calls across separate turns (A) serializes them. A single Task cannot fan out on its own (C), and tool_choice (D) governs whether/which tool is called, not parallelism.",
      ["multi-agent", "parallel-execution", "Task-tool", "latency"]),

    q(1, 26,
      "When writing the coordinator's prompt for subagents, you must choose between step-by-step procedures and goal-plus-criteria instructions.",
      "Which yields more adaptable subagents?",
      [
        "Rigid step-by-step procedural instructions for every subagent",
        "Prompts that specify research goals and quality criteria, letting subagents adapt their approach",
        "Empty prompts so subagents infer intent from the tool list",
        "Only the raw user query with no framing"
      ], 1,
      "Specifying goals and quality criteria (rather than exact procedures) lets subagents adapt to what they discover, which is the point of delegating to an intelligent agent. Rigid procedures (A) make subagents brittle. Empty (C) or bare-query (D) prompts under-specify the task and reduce reliability.",
      ["multi-agent", "prompt-design", "adaptability", "coordinator"]),

    q(1, 27,
      "A support agent must never call process_refund until the customer's identity has been verified via get_customer.",
      "What enforces this reliably?",
      [
        "A system prompt instruction to always verify first",
        "A programmatic prerequisite gate (or PreToolUse hook) that blocks process_refund until get_customer has returned a verified customer ID",
        "A few-shot example showing verification before refund",
        "Setting tool_choice to 'any'"
      ], 1,
      "Deterministic ordering for a financial operation requires code enforcement: a prerequisite gate/hook that blocks process_refund until verification completed. Prompt instructions (A) and few-shot examples (C) are probabilistic with a non-zero failure rate. tool_choice: any (D) only forces a tool to be called, not the correct order.",
      ["enforcement", "prerequisite-gate", "hooks", "human-in-the-loop"]),

    q(1, 28,
      "A customer message raises three separate issues: a wrong charge, a delayed shipment, and a password reset.",
      "What is the recommended decomposition approach?",
      [
        "Handle only the first issue and ask the customer to resend the others",
        "Decompose into distinct items, investigate each (in parallel where possible) using shared context, then synthesize one unified resolution",
        "Escalate immediately because multi-issue tickets require humans",
        "Merge all three into a single tool call"
      ], 1,
      "Multi-concern requests should be decomposed into discrete items, each investigated (in parallel when independent) against shared context, then synthesized into a single coherent response. Handling one (A) frustrates the customer. Immediate escalation (C) defeats autonomous resolution. A single merged tool call (D) cannot address heterogeneous concerns correctly.",
      ["task-decomposition", "multi-concern", "parallel-investigation", "synthesis"]),

    q(1, 29,
      "Your agent escalates a complex billing dispute to a human who has no access to the conversation transcript.",
      "What should the handoff include?",
      [
        "Just the customer's name and 'please help'",
        "A structured summary: customer ID, root-cause analysis, relevant amounts, and a recommended action",
        "The full raw token-by-token transcript with no summary",
        "Only the final unresolved question"
      ], 1,
      "A good escalation handoff gives the human everything needed to act without re-investigating: customer ID, root cause, key figures (e.g., refund amount), and a recommended next step. A bare name (A) or lone question (D) forces rework. Dumping the raw transcript (C) buries the signal and wastes the agent's synthesis capability.",
      ["escalation", "handoff", "human-in-the-loop", "structured-summary"]),

    q(1, 30,
      "Different MCP tools return timestamps as Unix epoch, ISO 8601, and numeric status codes. Your agent keeps misreading them.",
      "Which hook pattern normalizes this before the model reasons over the data?",
      [
        "A PreToolUse hook that rewrites the user's request",
        "A PostToolUse hook that transforms heterogeneous tool outputs into a consistent normalized format",
        "A system prompt telling Claude to convert formats itself",
        "No hook; ask each MCP server owner to change their API"
      ], 1,
      "PostToolUse hooks intercept tool results and can normalize heterogeneous formats (timestamps, status codes) into one consistent representation before the model sees them - deterministic and reliable. PreToolUse (A) acts on outgoing calls, not results. Asking Claude to convert (C) is probabilistic. Changing every upstream API (D) is often infeasible.",
      ["hooks", "PostToolUse", "normalization", "data-formats"]),

    q(1, 31,
      "Compliance requires that refunds above $500 are always redirected to human approval, with no exceptions.",
      "Which mechanism guarantees this?",
      [
        "A PostToolUse hook that logs large refunds after they execute",
        "A tool-call interception (PreToolUse) hook that blocks process_refund over $500 and redirects to escalation",
        "A strongly worded system prompt",
        "Few-shot examples of refusing large refunds"
      ], 1,
      "Blocking an action before it happens requires intercepting the outgoing tool call: a PreToolUse-style hook inspects the refund amount and blocks/redirects when it exceeds $500. Logging after the fact (A) is too late. Prompts (C) and few-shot examples (D) are probabilistic and can be overridden.",
      ["hooks", "PreToolUse", "compliance", "interception"]),

    q(1, 32,
      "You are choosing between a fixed sequential pipeline and dynamic adaptive decomposition for a task.",
      "Which task is best served by DYNAMIC adaptive decomposition?",
      [
        "Formatting a set of files with a known linter in a known order",
        "An open-ended investigation like 'add comprehensive tests to a legacy codebase' where subtasks emerge as dependencies are discovered",
        "Converting a list of dates from one format to another",
        "Running the same three review steps on every pull request"
      ], 1,
      "Dynamic decomposition fits open-ended tasks where you cannot enumerate subtasks up front and must adapt as you learn (mapping structure, finding high-impact areas, then planning). Predictable, repeatable multi-aspect work (A, C, D) is better handled by fixed sequential pipelines / prompt chaining.",
      ["task-decomposition", "dynamic-decomposition", "prompt-chaining", "workflow-patterns"]),

    q(1, 33,
      "A single-pass review of a 14-file pull request gives deep feedback on some files and shallow feedback on others, and even contradicts itself.",
      "What restructuring fixes the root cause?",
      [
        "Use a larger context window model and keep the single pass",
        "Split into per-file local analysis passes plus a separate cross-file integration pass",
        "Run the same full-PR prompt three times and keep only agreed findings",
        "Require developers to submit smaller PRs"
      ], 1,
      "The root cause is attention dilution when many files are analyzed together. Prompt chaining - analyze each file individually for local issues, then a dedicated cross-file integration pass - restores consistent depth and catches cross-file issues. A bigger context window (A) doesn't fix attention quality. Triple-voting (C) suppresses real intermittent findings, and pushing work to developers (D) doesn't improve the system.",
      ["task-decomposition", "prompt-chaining", "code-review", "attention-dilution"]),

    q(1, 34,
      "You resume a long investigation with --resume after editing several files that the prior session had analyzed.",
      "What is the reliability risk and best mitigation?",
      [
        "No risk; resumed sessions always re-read files automatically",
        "Stale tool results: inform the resumed session which files changed so it re-analyzes them, or start fresh with an injected summary",
        "The session cannot be resumed after edits at all",
        "You must delete the session and lose all context"
      ], 1,
      "Resuming reuses cached tool results that may now be stale after edits, leading to reasoning on outdated content. Mitigate by telling the resumed session exactly which files changed for targeted re-analysis, or - when prior results are largely stale - start a new session with a structured summary. Resumption doesn't auto-refresh files (A), and edits don't forbid resumption (C, D).",
      ["session-management", "resume", "stale-context", "reliability"]),

    q(1, 35,
      "You want to compare two refactoring strategies that both start from the same completed codebase analysis, without redoing the analysis.",
      "Which mechanism fits?",
      [
        "Start two brand-new sessions from scratch",
        "Use fork_session to branch two independent explorations from the shared analysis baseline",
        "Use --resume on the same session for both, alternating",
        "Copy-paste the analysis into two prompts manually"
      ], 1,
      "fork_session creates independent branches from a shared baseline, ideal for exploring divergent approaches (two refactors) without repeating the expensive analysis. Fresh sessions (A) discard the baseline. Alternating --resume on one session (C) entangles the two explorations. Manual copy-paste (D) is error-prone and loses tool-result fidelity.",
      ["session-management", "fork_session", "divergent-exploration", "baseline"]),

    q(1, 36,
      "Your coordinator invokes a subagent but the subagent behaves as if it knows nothing about the task the coordinator was working on.",
      "What is the most likely cause?",
      [
        "The subagent inherits context automatically but ignored it",
        "Subagents do not inherit parent context; required information was not passed in the subagent's prompt",
        "The Task tool was disabled",
        "The model version differs between agents"
      ], 1,
      "Subagents run with isolated context and do not automatically inherit the parent's conversation or memory. If nothing was explicitly included in the subagent's prompt, it starts blind. This is a context-passing bug, not an inheritance-that-was-ignored issue (A), a disabled Task tool (C - that would prevent spawning entirely), or a version mismatch (D).",
      ["multi-agent", "context-isolation", "context-passing", "subagent"]),

    q(1, 37,
      "A subagent hits a transient network timeout while fetching one of several sources.",
      "What is the preferred error-handling pattern before escalating to the coordinator?",
      [
        "Immediately propagate the timeout and terminate the whole workflow",
        "Attempt local recovery (retry/alternate source); if unresolved, return structured error plus partial results and what was attempted",
        "Silently mark the fetch successful with empty results",
        "Crash the subagent so the coordinator restarts everything"
      ], 1,
      "Subagents should handle transient failures locally (retry or try an alternate source) and only escalate what they cannot resolve, returning structured error context plus any partial results and the steps attempted. Propagating and terminating (A) is over-destructive. Faking success (C) corrupts downstream results. Crashing (D) discards progress.",
      ["error-handling", "local-recovery", "structured-errors", "multi-agent"]),

    q(1, 38,
      "The synthesis subagent needs to verify simple facts (dates, names) mid-task; 85% are trivial lookups, 15% need deep investigation.",
      "Which design reduces round-trips while respecting least privilege?",
      [
        "Give synthesis the full web-search toolset so it never needs the coordinator",
        "Give synthesis a scoped verify_fact tool for simple lookups; route complex verifications through the coordinator to the web search agent",
        "Batch all verifications to the end and send them at once",
        "Have the web search agent pre-cache everything synthesis might need"
      ], 1,
      "A scoped cross-role tool (verify_fact) handles the 85% common case in-place while complex cases still route through the coordinator - minimizing round-trips without over-provisioning. Full web tools (A) violate separation of concerns. End-of-pass batching (B) creates blocking dependencies. Speculative caching (D) can't reliably predict needs.",
      ["multi-agent", "scoped-tools", "least-privilege", "verify_fact"]),

    q(1, 39,
      "You need identity verification before any financial operation, and prompt instructions have a small but real failure rate in tests.",
      "What does this failure rate imply for design?",
      [
        "Add more emphatic wording to the prompt until failures vanish",
        "Use programmatic enforcement (gates/hooks) for the mandatory ordering; reserve prompts for should-happen guidance",
        "Accept the failures as within tolerance for financial flows",
        "Increase temperature to make Claude more careful"
      ], 1,
      "A non-zero prompt failure rate is unacceptable for must-happen ordering around financial operations, so enforcement belongs in code (prerequisite gates/hooks). Prompts are appropriate for soft, should-happen guidance. More wording (A) never reaches zero. Tolerating failures (C) is a compliance risk, and temperature (D) doesn't guarantee ordering.",
      ["enforcement", "hooks", "compliance", "prompt-vs-code"]),

    q(1, 40,
      "During a multi-phase exploration, verbose discovery output from scanning a large repo threatens to exhaust the main conversation's context.",
      "Which mechanism isolates that verbosity while returning a usable result?",
      [
        "Increase max_tokens on the main session",
        "Use the Explore subagent to run verbose discovery in isolation and return a concise summary to the main context",
        "Disable tool results in the main session",
        "Truncate the repo before scanning"
      ], 1,
      "The Explore subagent runs noisy discovery in an isolated context and returns only a summary, preserving the main conversation's context budget. Raising max_tokens (A) affects output length, not context intake. Disabling tool results (C) breaks reasoning, and truncating the repo (D) risks missing relevant code.",
      ["Explore-subagent", "context-management", "discovery", "summarization"]),

    q(1, 41,
      "A long-running agent processes hundreds of PRs over several hours and may be interrupted by crashes or timeouts.",
      "What is the key architectural requirement for resumability?",
      [
        "Hold all PRs in one very large context window",
        "Persist agent state (current task, completed items, pending queue) to external storage after each significant action",
        "Use streaming to reduce latency",
        "Raise max_tokens to avoid truncation"
      ], 1,
      "Resumable long-running agents checkpoint state externally after each significant action so an interruption resumes from the last checkpoint. A single huge context (A) hits limits and lost-in-the-middle problems. Streaming (C) and max_tokens (D) are output/latency concerns, not resumability.",
      ["long-running-tasks", "state-persistence", "resumability", "checkpointing"]),

    q(1, 42,
      "Two subagents both write to a shared 'findings' store, and the coordinator later can't tell which agent produced which finding or whether one is stale.",
      "What design principle was violated?",
      [
        "All communication and writes should route through the coordinator with clear provenance, not via a shared mutable store",
        "Subagents should share more memory, not less",
        "The coordinator should have fewer tools",
        "Findings should be stored as unstructured prose"
      ], 0,
      "Hub-and-spoke requires routing information through the coordinator so it controls flow, error handling, and provenance. A shared mutable store bypasses the coordinator, losing attribution and staleness tracking. More shared memory (B) worsens it; the coordinator's tool count (C) is irrelevant; unstructured prose (D) makes attribution worse.",
      ["multi-agent", "coordinator", "provenance", "hub-and-spoke"]),

    q(1, 43,
      "A coordinator decomposes a broad topic too narrowly, so the final report misses major aspects the user cares about.",
      "What is the risk being described and its remedy?",
      [
        "Over-broad decomposition; remedy by narrowing further",
        "Overly narrow decomposition causing incomplete coverage; remedy with broader partitioning and a coverage-check refinement loop",
        "Excessive parallelism; remedy by serializing",
        "Too many tools; remedy by removing the search tool"
      ], 1,
      "Overly narrow task decomposition leaves broad topics under-covered. The fix is to partition scope more comprehensively and add a coordinator-driven coverage check that re-delegates for gaps. Narrowing further (A) worsens coverage; the issue isn't parallelism (C) or tool count (D).",
      ["multi-agent", "task-decomposition", "coverage", "coordinator"]),

    q(1, 44,
      "You are implementing the agentic loop and must map API states to control flow.",
      "Which mapping is correct?",
      [
        "stop_reason 'tool_use' -> stop the loop; 'end_turn' -> execute tools",
        "stop_reason 'tool_use' -> execute tools and continue; 'end_turn' -> stop the loop",
        "stop_reason 'max_tokens' -> always safe to stop with a complete answer",
        "stop_reason is irrelevant; loop on message length"
      ], 1,
      "'tool_use' means Claude requested tools - execute them, append results, and continue. 'end_turn' means Claude is finished - stop. Option A inverts this. 'max_tokens' (C) indicates truncation, not clean completion. Message length (D) is not a valid control signal.",
      ["agentic-loop", "stop_reason", "control-flow", "tool_use"]),

    q(1, 45,
      "Your coordinator needs observability into every subagent action for debugging and consistent error handling.",
      "Which architecture best supports this?",
      [
        "Peer-to-peer subagents that call each other directly",
        "Hub-and-spoke where all subagent communication and errors route through the coordinator",
        "A flat design with no coordinator",
        "Each subagent logging independently to different sinks"
      ], 1,
      "Hub-and-spoke centralizes communication and error handling in the coordinator, giving a single point of observability and consistent routing. Peer-to-peer (A) and coordinator-less (C) designs scatter control and errors. Independent per-agent logging (D) fragments observability.",
      ["multi-agent", "hub-and-spoke", "observability", "coordinator"]),

    q(1, 46,
      "You want to force a specific extraction tool to run first, then process follow-up steps in later turns of the loop.",
      "Which tool_choice configuration achieves the forced first call?",
      [
        "tool_choice: 'auto'",
        "tool_choice: {\"type\": \"tool\", \"name\": \"extract_metadata\"}",
        "tool_choice: 'none'",
        "Omit tool_choice entirely"
      ], 1,
      "Forcing a named tool with tool_choice: {type: tool, name: ...} guarantees that specific tool is called first; subsequent steps proceed in follow-up turns. 'auto' (A) lets the model choose or return text, 'none' (C) forbids tools, and omitting it (D) defaults to auto behavior.",
      ["tool_choice", "forced-tool", "agentic-loop", "ordering"]),

    q(1, 47,
      "A coordinator receives a structured error from a subagent with retryable: false and errorCategory: 'business'.",
      "What is the appropriate coordinator response?",
      [
        "Retry the same call several times",
        "Do not retry; communicate the business-rule outcome or escalate, per the error's guidance",
        "Terminate the entire workflow immediately",
        "Ignore the error and continue with empty data"
      ], 1,
      "retryable: false with a business category means retrying is pointless - the action violated a rule. The coordinator should honor the outcome (e.g., inform the user or escalate) rather than retry (A). Terminating everything (C) is over-reactive for a single item, and ignoring it (D) proceeds on bad state.",
      ["error-handling", "structured-errors", "retryable", "coordinator"]),

    q(1, 48,
      "You must decide whether an operation belongs in a hook or in the system prompt.",
      "Which rule of thumb applies?",
      [
        "If it MUST happen deterministically, use code (hooks/gates); if it SHOULD happen, prompts are acceptable",
        "Always use prompts; hooks are for logging only",
        "Always use hooks; prompts are deprecated",
        "Use whichever is shorter to write"
      ], 0,
      "The guiding principle: deterministic must-happen requirements belong in code (hooks/prerequisite gates); probabilistic should-happen guidance can live in prompts. Prompts alone (B) can't guarantee compliance; hooks aren't required for soft guidance (C); and code length (D) is irrelevant to correctness.",
      ["hooks", "enforcement", "prompt-vs-code", "design-principle"]),

    q(1, 49,
      "A coordinator spawns four subagents but only three are needed for a simple query, wasting time and tokens.",
      "What coordinator behavior prevents this?",
      [
        "Always spawn the maximum number of subagents for consistency",
        "Analyze the query and invoke only the subagents whose capabilities the query requires",
        "Spawn subagents at random to balance load",
        "Never spawn subagents; do everything in the coordinator"
      ], 1,
      "The coordinator should match subagent invocation to actual query requirements, invoking only what's needed. Always-max (A) wastes resources, randomness (C) is unprincipled, and doing everything in the coordinator (D) forfeits specialization when it is genuinely needed.",
      ["multi-agent", "dynamic-routing", "efficiency", "coordinator"]),

    q(1, 50,
      "Your agentic loop must append tool results so the model can incorporate them into the next decision.",
      "Where do tool results belong in the conversation?",
      [
        "In the system prompt, replacing it each turn",
        "As tool_result blocks appended to the conversation history, keyed to their tool_use_id",
        "In a separate log the model never sees",
        "Concatenated into the user's original message only once"
      ], 1,
      "Tool outputs are appended as tool_result blocks tied to the originating tool_use_id, extending the conversation so the model reasons over new information next turn. Rewriting the system prompt (A) is wrong and destructive. A hidden log (C) prevents the model from using results, and stuffing them into the first user message (D) breaks multi-step correlation.",
      ["agentic-loop", "tool_result", "conversation-history", "context"]),

    q(1, 51,
      "Your team runs the same multi-aspect pull-request review (style, security, tests) on every PR in an identical, predictable way.",
      "For this fully predictable multi-aspect review, which decomposition is most appropriate?",
      [
        "Dynamic adaptive decomposition regenerated each run",
        "A fixed sequential pipeline (prompt chaining) with defined passes",
        "A single monolithic prompt covering all aspects together",
        "Random ordering of aspects each run"
      ], 1,
      "Predictable, repeatable multi-aspect work is best served by a fixed sequential pipeline / prompt chaining with defined passes. Dynamic decomposition (A) adds needless variability for a known workflow, a monolithic prompt (C) causes attention dilution, and random ordering (D) harms reproducibility.",
      ["task-decomposition", "prompt-chaining", "code-review", "reproducibility"]),

    q(1, 52,
      "A subagent returns a valid empty result set (a query with legitimately no matches). Your coordinator treats it as a failure and retries repeatedly.",
      "What distinction was missed?",
      [
        "Empty results always indicate an error",
        "A successful query with no matches is different from an access failure; only access failures warrant retry decisions",
        "Retries are always safe, so the behavior is fine",
        "The subagent should have raised an exception instead"
      ], 1,
      "A valid empty result means the query succeeded but found nothing - not an error. Conflating it with an access failure triggers pointless retries. Structured results should distinguish 'no matches' from 'could not access,' so the coordinator only retries genuine access failures. Retries aren't always harmless (C), and exceptions (D) would misrepresent a successful query.",
      ["error-handling", "empty-results", "retryable", "coordinator"]),

    q(1, 53,
      "You resume a named investigation session with --resume <session-name> to continue prior work.",
      "What is the primary benefit of named session resumption here?",
      [
        "It merges unrelated sessions into one",
        "It lets you continue a specific prior conversation with its accumulated context intact",
        "It resets all context to start clean",
        "It runs the session in a forked branch automatically"
      ], 1,
      "Named resumption (--resume <name>) continues a specific prior conversation with its context, ideal for picking up multi-day investigations. It doesn't merge sessions (A), reset context (C), or fork automatically (D - forking is fork_session's job).",
      ["session-management", "resume", "named-session", "continuity"]),

    q(1, 54,
      "A coordinator must aggregate results from three subagents into a final report, but one subagent returned partial results with a structured error.",
      "What is the best aggregation behavior?",
      [
        "Discard all results because one subagent was incomplete",
        "Incorporate the partial results, note the gap/limitation from the structured error, and decide whether to re-delegate for the missing part",
        "Silently drop the failed subagent's contribution with no note",
        "Block and wait indefinitely for the failed subagent"
      ], 1,
      "Good aggregation uses available partial results, transparently notes limitations surfaced by the structured error, and decides whether a targeted re-delegation is worthwhile. Discarding everything (A) wastes good work, silent dropping (C) hides gaps, and blocking forever (D) stalls the workflow.",
      ["multi-agent", "aggregation", "partial-results", "coordinator"]),

    q(1, 55,
      "You need Claude to reason about which tool to call next based on evolving context rather than a preset order.",
      "This describes which paradigm?",
      [
        "A deterministic decision tree",
        "Model-driven decision-making within an agentic loop",
        "A static prompt-chaining pipeline",
        "A batch job"
      ], 1,
      "Letting Claude choose the next tool from current context is model-driven decision-making, the essence of an agentic loop. A decision tree (A) and static prompt chain (C) fix the path in advance, and a batch job (D) doesn't support mid-request multi-turn tool selection.",
      ["agentic-loop", "model-driven", "tool-selection", "paradigm"]),

    q(1, 56,
      "Your team debates whether to run subagents in parallel or sequentially for a task with strict data dependencies (B needs A's output, C needs B's).",
      "Which execution model is correct?",
      [
        "Parallel - always faster",
        "Sequential - each step consumes the prior step's output, so ordering is required",
        "Fire-and-forget all three simultaneously",
        "Randomized ordering"
      ], 1,
      "Hard data dependencies (B needs A, C needs B) require sequential execution so each step has its predecessor's output. Parallel/fire-and-forget (A, C) would run steps before their inputs exist, and randomized ordering (D) breaks correctness. Parallelism is only for independent operations.",
      ["agentic-loop", "sequential-execution", "data-dependencies", "workflow-patterns"]),

    q(1, 57,
      "A coordinator prompt lists step-by-step instructions so detailed that subagents can't adapt when the data differs from expectations.",
      "What is the tradeoff being illustrated?",
      [
        "Over-specified procedural prompts reduce adaptability; goal-and-criteria prompts improve it",
        "Under-specified prompts always outperform detailed ones",
        "Prompt detail has no effect on subagent behavior",
        "Only tool count affects adaptability"
      ], 0,
      "Highly procedural prompts constrain subagents to a rigid path, hurting adaptability when reality diverges; specifying goals and quality criteria lets them adjust. Under-specification isn't universally better (B), prompt detail clearly matters (C), and adaptability isn't solely a function of tool count (D).",
      ["multi-agent", "prompt-design", "adaptability", "coordinator"]),

    q(1, 58,
      "You must guarantee the model calls SOME tool rather than replying with conversational text, but it may pick which one.",
      "Which tool_choice setting fits?",
      [
        "tool_choice: 'auto'",
        "tool_choice: 'any'",
        "tool_choice: 'none'",
        "tool_choice: {\"type\": \"tool\", \"name\": \"x\"}"
      ], 1,
      "tool_choice: 'any' forces the model to call a tool while leaving the choice of which up to it. 'auto' (A) permits a plain text reply. 'none' (C) forbids tools. Forcing a named tool (D) removes the model's choice, which the scenario wants to keep.",
      ["tool_choice", "any", "agentic-loop", "structured-output"]),

    q(1, 59,
      "A crash-recovery design stores a manifest of completed and pending subtasks to disk during a long agentic run.",
      "What is the manifest's role on restart?",
      [
        "It is decorative and ignored on restart",
        "It lets the agent skip completed subtasks and resume the pending queue, enabling crash recovery",
        "It forces a full restart from scratch",
        "It replaces the need for any tool results"
      ], 1,
      "A persisted manifest of completed vs pending work lets a restarted agent resume from where it stopped instead of redoing everything - the basis of crash recovery for long runs. It isn't decorative (A), doesn't force a full restart (C), and doesn't replace tool results (D) needed for reasoning.",
      ["long-running-tasks", "crash-recovery", "manifest", "state-persistence"]),

    q(1, 60,
      "Your coordinator must decide between resuming a stale session and starting fresh with a structured summary.",
      "When is starting fresh with an injected summary more reliable?",
      [
        "When prior context is mostly valid and only a file changed",
        "When prior tool results are largely stale and would mislead reasoning",
        "Never; resuming is always better",
        "Only when the session name is forgotten"
      ], 1,
      "When prior tool results are largely stale, a fresh session seeded with an accurate structured summary is more reliable than resuming with misleading cached results. If prior context is mostly valid (A), targeted resumption is fine. Resuming isn't always better (C), and this decision is about staleness, not forgotten names (D).",
      ["session-management", "fresh-start", "stale-context", "summary"]),

    q(1, 61,
      "You spawn parallel subagents for independent subtopics, but they occasionally duplicate the same sources.",
      "What coordinator-side technique reduces duplication?",
      [
        "Give every subagent the identical query",
        "Assign distinct subtopics or source types per subagent and pass what's already covered as shared context",
        "Run them sequentially with the same query",
        "Increase each subagent's temperature"
      ], 1,
      "Partitioning by distinct subtopic/source type and sharing coverage context minimizes overlap even in parallel runs. Identical queries (A) guarantee duplication, sequential-same-query (C) is slow and still redundant, and temperature (D) doesn't address scope overlap.",
      ["multi-agent", "parallel-execution", "scope-partitioning", "duplication"]),

    q(1, 62,
      "A support flow must honor an explicit customer request to speak with a human immediately, even mid-investigation.",
      "What is the correct agent behavior?",
      [
        "Finish the full investigation first, then escalate",
        "Escalate to a human right away, compiling a structured handoff summary of what is known so far",
        "Refuse and continue autonomously",
        "Ask the customer to justify the request before escalating"
      ], 1,
      "Explicit human-agent requests should be honored immediately, accompanied by a structured handoff of current findings. Forcing the customer to wait through investigation (A) or justify the request (D) ignores their explicit preference, and refusing (C) violates escalation policy.",
      ["escalation", "customer-preference", "handoff", "human-in-the-loop"]),

    q(1, 63,
      "You want to add a PostToolUse hook to audit every tool call, but the audit database is briefly unavailable.",
      "What should the hook do?",
      [
        "Silently skip the audit and continue as if nothing happened",
        "Return a structured error with retryable: true so the coordinator can retry or escalate while preserving the audit requirement",
        "Crash the entire session immediately",
        "Rewrite the tool result to hide the failure"
      ], 1,
      "For a transient infra failure on a compliance-critical audit, the hook should return a structured, retryable error so the coordinator retries or escalates - preserving the audit requirement. Silent skipping (A, D) breaks compliance, and crashing the session (C) is over-destructive for a transient issue.",
      ["hooks", "PostToolUse", "error-handling", "retryable"]),

    q(1, 64,
      "Your coordinator receives four structured errors: a timeout, an invalid-input error, a policy violation, and a permission error.",
      "Which classification helps it respond correctly to each?",
      [
        "Treat all four identically as generic failures",
        "Distinguish transient vs validation vs business vs permission errors and choose retry/escalate/inform accordingly",
        "Retry all four the same number of times",
        "Escalate all four to a human immediately"
      ], 1,
      "Different error categories demand different responses: retry transient timeouts, fix/inform on validation, honor/inform on business-rule violations, and escalate permission issues appropriately. Treating them identically (A), uniform retries (C), or blanket escalation (D) wastes effort or mishandles cases.",
      ["error-handling", "error-classification", "coordinator", "structured-errors"]),

    q(1, 65,
      "A microservice restructuring will touch 45+ files and involves choosing between two integration approaches with different infrastructure needs.",
      "Plan mode or direct execution?",
      [
        "Direct execution - it's just editing files",
        "Plan mode - large-scale, multi-file, architectural decision with multiple valid approaches",
        "Neither; run it as a batch job",
        "Direct execution with a high max_tokens"
      ], 1,
      "Large-scale, multi-file changes with architectural tradeoffs are exactly what plan mode is for: explore and design safely before committing. Direct execution (A, D) suits small well-scoped changes, and a batch job (C) doesn't fit interactive architectural planning.",
      ["plan-mode", "architecture", "multi-file", "task-decomposition"]),

    q(1, 66,
      "For a single-file bug fix with a clear stack trace, which execution style is appropriate?",
      "Choose the best fit.",
      [
        "Plan mode with a multi-phase design document",
        "Direct execution - the change is well-scoped and understood",
        "Spawn five subagents to debate the fix",
        "A 24-hour batch job"
      ], 1,
      "A well-understood, single-file fix with a clear stack trace is ideal for direct execution. Plan mode (A) is overkill for a scoped change, multiple debating subagents (C) add needless coordination, and a batch job (D) is inappropriate for an interactive fix.",
      ["direct-execution", "plan-mode", "scoping", "workflow-patterns"]),

    q(1, 67,
      "Your coordinator emits multiple Task calls in one turn to parallelize, but also has a step that depends on all of them finishing.",
      "How should the dependent step be handled?",
      [
        "Emit it in the same turn as the parallel Task calls",
        "Wait for the parallel subagents' results, then run the dependent step in a subsequent turn using their aggregated output",
        "Skip the dependent step to save time",
        "Run it before the parallel calls"
      ], 1,
      "Parallel Task calls run concurrently within a turn; a step that depends on all of them must run in a later turn after their results are aggregated. Emitting it in the same turn (A) or before (D) means it runs without required inputs, and skipping it (C) drops necessary work.",
      ["multi-agent", "parallel-execution", "dependencies", "aggregation"]),

    q(1, 68,
      "You are reviewing an agent that terminates whenever it has produced any assistant text, even mid-tool-sequence, causing truncated tasks.",
      "What is the single most important fix?",
      [
        "Increase the iteration cap",
        "Drive termination from stop_reason == 'end_turn' with no pending tool_use, not from text presence",
        "Lower temperature",
        "Add more few-shot examples of finishing"
      ], 1,
      "The bug is using text presence as a completion signal; the fix is to terminate only on stop_reason == 'end_turn' with no pending tool_use. Iteration caps (A) don't fix premature termination, and temperature (C) or few-shot examples (D) don't change the control-flow logic.",
      ["agentic-loop", "stop_reason", "loop-termination", "bugfix"]),
]


# =====================================================================
# DOMAIN 2 - Claude Code Configuration & Workflows  (add d2-014 .. d2-050)
# Task statements 3.1-3.6 (CLAUDE.md, commands/skills, path rules,
# plan vs direct, iterative refinement, CI/CD)
# =====================================================================
NEW[2] += [
    q(2, 14,
      "A new teammate clones the repo but does not receive the coding instructions you rely on. You placed those instructions in ~/.claude/CLAUDE.md.",
      "Why is the teammate missing them, and what is the fix?",
      [
        "User-level ~/.claude/CLAUDE.md is personal and not shared via version control; move shared instructions to project-level .claude/CLAUDE.md (or root CLAUDE.md)",
        "The teammate must run /memory to download your user settings",
        "CLAUDE.md files are ignored by Claude Code; use a README instead",
        "The instructions only load after 24 hours"
      ], 0,
      "User-level configuration in ~/.claude/CLAUDE.md applies only to you and is never shared through version control. Team-wide standards belong in project-scoped .claude/CLAUDE.md or a root CLAUDE.md that is committed. /memory (B) shows loaded files but can't sync personal config; CLAUDE.md is honored (C); and there is no time delay (D).",
      ["CLAUDE.md", "hierarchy", "project-scope", "user-scope"]),

    q(2, 15,
      "Your root CLAUDE.md has grown huge, mixing testing rules, API conventions, and deployment notes, and Claude often ignores parts of it.",
      "What is the recommended modular organization?",
      [
        "Keep one giant file but add ALL-CAPS emphasis",
        "Split into focused topic files under .claude/rules/ (e.g., testing.md, api-conventions.md, deployment.md)",
        "Delete the file and rely on model defaults",
        "Duplicate the whole file into every subdirectory"
      ], 1,
      "Large monolithic CLAUDE.md files are better decomposed into focused topic files under .claude/rules/, improving relevance and reducing noise. Emphasis (A) doesn't fix bloat, deleting (C) loses standards, and duplicating everywhere (D) creates maintenance and conflict problems.",
      ["CLAUDE.md", "rules-directory", "modular", "organization"]),

    q(2, 16,
      "Each package in your monorepo needs different standards, and you want CLAUDE.md to stay lean by referencing external standards files.",
      "Which mechanism keeps CLAUDE.md modular?",
      [
        "Paste every standard inline into each CLAUDE.md",
        "Use the @import syntax to reference the specific standards files relevant to each package",
        "Store standards only in the wiki and hope Claude reads them",
        "Use environment variables to inject standards at runtime"
      ], 1,
      "@import lets a CLAUDE.md reference external standards files, so each package includes only the relevant ones while keeping the file lean. Pasting inline (A) bloats and duplicates, a wiki (C) isn't loaded by Claude Code, and env vars (D) are for secrets/config, not standards inclusion.",
      ["CLAUDE.md", "import", "modular", "monorepo"]),

    q(2, 17,
      "Claude behaves inconsistently across sessions and you suspect the wrong memory files are loading.",
      "Which command helps you diagnose which memory files are active?",
      [
        "/compact",
        "/memory",
        "/resume",
        "/fork"
      ], 1,
      "The /memory command reports which memory files are currently loaded, letting you diagnose configuration-hierarchy issues causing inconsistent behavior. /compact (A) summarizes context, and resume/fork (C, D) are session operations, not memory inspection.",
      ["CLAUDE.md", "memory-command", "diagnosis", "claude-code"]),

    q(2, 18,
      "You want a slash command available to the whole team through version control.",
      "Where should it live?",
      [
        "~/.claude/commands/ (user scope)",
        ".claude/commands/ (project scope, committed to the repo)",
        "A gist linked in the README",
        "Inside CLAUDE.md as prose"
      ], 1,
      "Project-scoped commands in .claude/commands/ are shared team-wide via version control. User-scoped ~/.claude/commands/ (A) is personal only. A gist (C) isn't loaded by Claude Code, and prose in CLAUDE.md (D) is not an invokable slash command.",
      ["slash-commands", "project-scope", "version-control", "claude-code"]),

    q(2, 19,
      "A skill produces very verbose codebase-analysis output that pollutes the main conversation and crowds out context.",
      "Which SKILL.md frontmatter option isolates it?",
      [
        "context: fork - run the skill in an isolated sub-agent context so its output doesn't pollute the main session",
        "allowed-tools: none",
        "argument-hint: verbose",
        "context: inline"
      ], 0,
      "context: fork runs a skill in an isolated sub-agent context, keeping its verbose output out of the main conversation. allowed-tools (B) restricts tools, argument-hint (C) prompts for parameters, and there is no benefit from an 'inline' setting (D) for isolation.",
      ["skills", "context-fork", "SKILL.md", "isolation"]),

    q(2, 20,
      "You want a skill that can only write files and must never run destructive shell commands.",
      "Which frontmatter field enforces this?",
      [
        "context: fork",
        "allowed-tools - restrict the skill to specific tools (e.g., file writes only)",
        "argument-hint",
        "paths"
      ], 1,
      "allowed-tools in skill frontmatter restricts which tools the skill may use during execution, e.g., limiting it to file writes to prevent destructive actions. context: fork (A) isolates context, argument-hint (C) prompts for input, and paths (D) is for path-scoped rules, not skills.",
      ["skills", "allowed-tools", "SKILL.md", "safety"]),

    q(2, 21,
      "When developers invoke your skill without the required parameter, they get confusing behavior.",
      "Which frontmatter field prompts them for the needed argument?",
      [
        "argument-hint",
        "context: fork",
        "allowed-tools",
        "paths"
      ], 0,
      "argument-hint frontmatter prompts developers for required parameters when they invoke a skill without arguments, improving usability. context: fork (B) isolates context, allowed-tools (C) restricts tools, and paths (D) scopes rules by file glob.",
      ["skills", "argument-hint", "SKILL.md", "usability"]),

    q(2, 22,
      "You must decide whether to put a convention in a Skill or in CLAUDE.md.",
      "Which distinction is correct?",
      [
        "Skills are always-loaded universal standards; CLAUDE.md is on-demand",
        "Skills are on-demand, task-specific workflows invoked when needed; CLAUDE.md holds always-loaded universal standards",
        "They are identical; choose either",
        "CLAUDE.md can only hold slash commands"
      ], 1,
      "Skills are invoked on demand for task-specific workflows, whereas CLAUDE.md holds always-loaded universal standards. Option A inverts this. They are not interchangeable (C), and CLAUDE.md holds standards/instructions, not only slash commands (D).",
      ["skills", "CLAUDE.md", "on-demand", "standards"]),

    q(2, 23,
      "You want personal tweaks to a shared skill without affecting teammates.",
      "What is the recommended approach?",
      [
        "Edit the shared .claude/skills/ version directly",
        "Create a personal variant in ~/.claude/skills/ with a different name",
        "Delete the shared skill and recreate it privately",
        "Fork the whole repository"
      ], 1,
      "Create a personal skill variant in user-scoped ~/.claude/skills/ under a different name so your customization doesn't affect the shared project skill. Editing the shared version (A) changes it for everyone, deleting it (C) breaks the team, and forking the repo (D) is disproportionate.",
      ["skills", "user-scope", "personal-variant", "claude-code"]),

    q(2, 24,
      "Your test-file conventions must apply to test files scattered across many directories, not just one folder.",
      "Which mechanism applies them best?",
      [
        "A subdirectory CLAUDE.md in each folder that contains tests",
        "A .claude/rules/ file with YAML frontmatter paths using a glob like **/*.test.tsx",
        "Inline comments in each test file",
        "A single root CLAUDE.md line saying 'apply test rules'"
      ], 1,
      "Path-specific rules in .claude/rules/ with a glob (e.g., paths: [\"**/*.test.tsx\"]) apply conventions to files by type regardless of location, which subdirectory CLAUDE.md files (A) can't do cleanly for scattered files. Inline comments (C) don't scale, and a vague root line (D) lacks scoping.",
      ["path-rules", "glob", "rules-directory", "conditional-loading"]),

    q(2, 25,
      "You add Terraform-specific conventions that should load only when editing Terraform files.",
      "Which frontmatter achieves conditional activation?",
      [
        "context: fork",
        "paths: [\"terraform/**/*\"] in a .claude/rules/ file",
        "allowed-tools: terraform",
        "argument-hint: terraform"
      ], 1,
      "A .claude/rules/ file with paths: [\"terraform/**/*\"] loads the rule only when editing matching files, reducing irrelevant context and token usage. context: fork (A) isolates skill context, and allowed-tools/argument-hint (C, D) are skill fields, not path scoping.",
      ["path-rules", "glob", "conditional-loading", "terraform"]),

    q(2, 26,
      "A convention applies to all files of a certain type spread across the codebase, and you're choosing between a subdirectory CLAUDE.md and a path-scoped rule.",
      "Which is advantageous and why?",
      [
        "Subdirectory CLAUDE.md, because it always loads for the whole repo",
        "Path-scoped rule with a glob, because it applies by file type across directories and loads only when relevant",
        "Neither; put it in the system prompt",
        "Both are identical in behavior"
      ], 1,
      "Glob-based path-scoped rules apply conventions by file type across directories and load only when editing matching files - ideal for cross-cutting file types. A subdirectory CLAUDE.md (A) is directory-bound and would need duplication. The system prompt (C) isn't the mechanism, and the two options are not identical (D).",
      ["path-rules", "glob", "CLAUDE.md", "conditional-loading"]),

    q(2, 27,
      "A prose description of a data transformation keeps producing inconsistent results from Claude Code.",
      "Which iterative-refinement technique most effectively communicates the expected transformation?",
      [
        "Add the word 'carefully' to the prompt",
        "Provide 2-3 concrete input/output examples of the transformation",
        "Increase max_tokens",
        "Switch to plan mode permanently"
      ], 1,
      "Concrete input/output examples are the most effective way to convey a transformation when prose is interpreted inconsistently. Vague emphasis (A) and max_tokens (C) don't clarify intent, and plan mode (D) is about planning changes, not specifying transformations.",
      ["iterative-refinement", "examples", "input-output", "prompt-engineering"]),

    q(2, 28,
      "You want Claude Code to progressively improve an implementation against expected behavior and edge cases.",
      "Which workflow embodies test-driven iteration?",
      [
        "Write the implementation first, then never test",
        "Write a test suite covering behavior, edge cases, and performance first, then iterate by sharing test failures",
        "Ask Claude to guess edge cases without tests",
        "Run the code once and accept the output"
      ], 1,
      "Test-driven iteration writes the tests first, then feeds failures back to Claude to guide progressive improvement. Skipping tests (A, D) provides no signal, and guessing edge cases (C) is unreliable compared to explicit test cases.",
      ["iterative-refinement", "test-driven", "edge-cases", "workflow"]),

    q(2, 29,
      "Before implementing a caching layer in an unfamiliar domain, you want Claude to surface design considerations you might miss (invalidation, failure modes).",
      "Which pattern fits?",
      [
        "The interview pattern: have Claude ask clarifying questions to surface considerations before implementing",
        "Direct execution with no questions",
        "Batch processing the design overnight",
        "context: fork on the main session"
      ], 0,
      "The interview pattern has Claude ask questions to surface considerations (cache invalidation, failure modes) before coding, valuable in unfamiliar domains. Direct execution without questions (B) risks missing key concerns, batch processing (C) doesn't fit interactive design, and context: fork (D) isolates skill output rather than eliciting design questions.",
      ["iterative-refinement", "interview-pattern", "design", "workflow"]),

    q(2, 30,
      "You have several bugs to fix. Some are independent; others interact (fixing one changes another).",
      "How should you sequence the fixes?",
      [
        "Always fix them one at a time regardless of interaction",
        "Provide interacting problems together in a single detailed message; iterate sequentially for independent problems",
        "Always fix them all in one message regardless of independence",
        "Ignore interactions; order doesn't matter"
      ], 1,
      "Interacting problems should be described together so Claude can reconcile them in one pass; independent problems are fine to iterate on sequentially. Rigidly one-at-a-time (A) mishandles interactions, always-together (C) can conflate unrelated fixes, and interactions clearly do matter (D).",
      ["iterative-refinement", "sequencing", "interacting-issues", "workflow"]),

    q(2, 31,
      "Your CI pipeline runs `claude \"Analyze this PR for security issues\"` and the job hangs waiting for input.",
      "What is the correct fix for non-interactive execution?",
      [
        "Set CLAUDE_HEADLESS=true",
        "Add the -p (or --print) flag to run in non-interactive print mode",
        "Add a --batch flag",
        "Redirect stdin from /dev/null and hope it exits"
      ], 1,
      "The -p/--print flag is the documented way to run Claude Code non-interactively: it processes the prompt, prints the result, and exits - exactly what CI needs. CLAUDE_HEADLESS (A) and --batch (C) are not real features, and stdin redirection (D) is a fragile workaround that doesn't address the CLI's mode.",
      ["ci-cd", "print-flag", "non-interactive", "claude-code"]),

    q(2, 32,
      "You need Claude Code's CI output to be machine-parseable so a script can post inline PR comments.",
      "Which CLI flags produce structured output?",
      [
        "--verbose alone",
        "--output-format json together with --json-schema to enforce a structure",
        "--print only, then regex the prose",
        "--color=never"
      ], 1,
      "--output-format json with --json-schema yields machine-parseable, schema-conformant findings suitable for automated PR comment posting. --verbose (A) and --color (D) don't structure output, and regexing prose from --print (C) is fragile compared to enforced JSON.",
      ["ci-cd", "output-format-json", "json-schema", "structured-output"]),

    q(2, 33,
      "Re-running an automated review after new commits produces duplicate comments for issues already reported.",
      "How do you prevent duplicates?",
      [
        "Disable the review after the first run",
        "Include prior review findings in context and instruct Claude to report only new or still-unaddressed issues",
        "Post all findings again and let humans dedupe",
        "Lower max_tokens so fewer comments are produced"
      ], 1,
      "Feeding prior findings into context and instructing Claude to report only new or unresolved issues avoids duplicate comments across re-runs. Disabling the review (A) loses value, re-posting everything (C) burdens humans, and max_tokens (D) arbitrarily truncates rather than deduplicating.",
      ["ci-cd", "review", "deduplication", "context"]),

    q(2, 34,
      "Your generated tests keep duplicating scenarios already covered by the existing suite.",
      "What input reduces this?",
      [
        "Provide the existing test files in context so generation avoids duplicating covered scenarios",
        "Ask for more tests without any context",
        "Increase temperature to add variety",
        "Generate tests in a forked session with no repo access"
      ], 0,
      "Supplying the existing test files lets Claude avoid regenerating already-covered scenarios and focus on gaps. Asking blindly (B) or raising temperature (C) doesn't inform it of coverage, and removing repo access (D) makes it less aware of what exists.",
      ["ci-cd", "test-generation", "context", "deduplication"]),

    q(2, 35,
      "You want to improve the quality of CI-generated tests by giving Claude your team's testing standards and fixtures.",
      "Where should this project context live for CI-invoked Claude Code?",
      [
        "Only in the developer's shell history",
        "In CLAUDE.md (testing standards, fixture conventions, review criteria) so CI-invoked runs pick it up",
        "In a private user-level file not committed to the repo",
        "In the PR description each time"
      ], 1,
      "CLAUDE.md is the mechanism for supplying project context - testing standards, fixture conventions, review criteria - to CI-invoked Claude Code. Shell history (A) isn't loaded, user-level uncommitted files (C) won't reach CI, and PR descriptions (D) are ad hoc and inconsistent.",
      ["ci-cd", "CLAUDE.md", "testing-standards", "context"]),

    q(2, 36,
      "The same Claude session that generated a module is then asked to review its own changes and misses issues.",
      "What principle explains this and what's the fix?",
      [
        "Sessions never affect review quality; the model is stateless",
        "Session context isolation: an independent review instance (fresh context) reviews more effectively than the session that wrote the code",
        "Always reuse the authoring session for review to save tokens",
        "Reviews should be skipped for AI-generated code"
      ], 1,
      "A session biased by having authored the code is less effective at critiquing it; an independent review instance with fresh context catches more issues. The model isn't context-free here (A), reusing the authoring session (C) reintroduces bias, and skipping review (D) is unsafe.",
      ["ci-cd", "session-isolation", "review", "independent-review"]),

    q(2, 37,
      "A change is a simple single-file addition of one date-validation conditional with clear scope.",
      "Plan mode or direct execution?",
      [
        "Plan mode with a multi-phase plan",
        "Direct execution - simple, well-scoped, single-file change",
        "Spawn subagents to debate it",
        "Batch API overnight"
      ], 1,
      "Simple, well-scoped single-file edits are ideal for direct execution. Plan mode (A) is for complex, multi-file, architectural work; subagents (C) and batch processing (D) are unnecessary overhead for a one-line conditional.",
      ["plan-mode", "direct-execution", "scoping", "claude-code"]),

    q(2, 38,
      "You need to plan a library migration affecting 45+ files, then execute the planned approach.",
      "Which combination is recommended?",
      [
        "Direct execution for both planning and implementation",
        "Use plan mode to investigate and design, then direct execution to implement the planned approach",
        "Plan mode for everything including each edit",
        "Skip planning; migrate file by file ad hoc"
      ], 1,
      "Complex migrations benefit from plan mode for investigation/design followed by direct execution for the now-well-understood implementation. Direct execution for planning (A) risks costly rework, staying in plan mode for every edit (C) is inefficient, and ad hoc migration (D) invites inconsistency and errors.",
      ["plan-mode", "direct-execution", "migration", "workflow"]),

    q(2, 39,
      "During a multi-phase Claude Code task, a verbose discovery phase threatens to exhaust the context window.",
      "Which Claude Code feature isolates discovery output?",
      [
        "The Explore subagent, which runs discovery in isolation and returns a summary",
        "The /compact command applied to the system prompt",
        "Increasing max_tokens",
        "Disabling CLAUDE.md"
      ], 0,
      "The Explore subagent isolates verbose discovery and returns a concise summary, preserving main-context budget across phases. /compact (B) summarizes existing context but isn't a discovery-isolation subagent, max_tokens (C) is unrelated, and disabling CLAUDE.md (D) removes needed standards.",
      ["plan-mode", "explore-subagent", "context-management", "discovery"]),

    q(2, 40,
      "You want CI to fail fast when Claude Code output can't be parsed as the expected structure.",
      "Which approach is most robust?",
      [
        "Parse free-form text with brittle regexes",
        "Enforce a schema with --json-schema and validate the JSON output in the pipeline, failing on schema violations",
        "Trust the output and never validate",
        "Only check the exit code"
      ], 1,
      "Enforcing --json-schema and validating the JSON lets CI fail fast on malformed/unexpected output. Regexing free text (A) is fragile, skipping validation (C) is unsafe, and exit codes alone (D) don't confirm the payload structure.",
      ["ci-cd", "json-schema", "validation", "structured-output"]),

    q(2, 41,
      "Your CLAUDE.md hierarchy has user-level, project-level, and directory-level files. A directory-level instruction conflicts with a project-level one while editing a file in that directory.",
      "What is the expected effect of the more specific directory-level file?",
      [
        "It is ignored in favor of the project root",
        "More specific directory-level guidance applies for files in that directory, layered over broader project-level settings",
        "User-level always wins over everything",
        "Conflicts crash Claude Code"
      ], 1,
      "The hierarchy layers from user to project to directory, with more specific directory-level guidance applying for files within that directory. It isn't ignored (A), user-level isn't globally dominant (C - and isn't shared via VCS), and conflicts don't crash the tool (D).",
      ["CLAUDE.md", "hierarchy", "directory-level", "scoping"]),

    q(2, 42,
      "You want a slash command that runs a repeatable code-review workflow the whole team can invoke.",
      "Which combination is correct?",
      [
        "Put it in ~/.claude/commands/ so only you can run it",
        "Put it in .claude/commands/ and commit it so the team shares it via version control",
        "Describe it in the README and run manually",
        "Encode it as a path-scoped rule"
      ], 1,
      "A team-shared, repeatable workflow belongs in project-scoped .claude/commands/ committed to the repo. User scope (A) limits it to you, a README (C) isn't invokable, and path-scoped rules (D) are for conditional convention loading, not commands.",
      ["slash-commands", "project-scope", "version-control", "workflow"]),

    q(2, 43,
      "A brainstorming skill dumps many exploratory alternatives into the main chat, derailing the focused task.",
      "Which frontmatter setting keeps the exploration out of the main session?",
      [
        "argument-hint",
        "context: fork",
        "paths",
        "allowed-tools: all"
      ], 1,
      "context: fork runs the skill in an isolated sub-agent context so its exploratory output doesn't pollute the main conversation. argument-hint (A) prompts for input, paths (C) scopes rules, and allowed-tools: all (D) would broaden rather than isolate.",
      ["skills", "context-fork", "isolation", "exploration"]),

    q(2, 44,
      "You must choose the safest way to prevent a file-generation skill from accidentally deleting files.",
      "Which frontmatter configuration helps?",
      [
        "context: fork only",
        "allowed-tools limited to write/create operations, excluding destructive commands",
        "argument-hint: safe",
        "paths: [\"**/*\"]"
      ], 1,
      "Restricting allowed-tools to write/create operations (excluding destructive shell/delete) prevents accidental deletions during skill execution. context: fork (A) isolates context but doesn't limit tools, argument-hint (C) prompts for input, and a broad paths glob (D) is unrelated to tool safety.",
      ["skills", "allowed-tools", "safety", "SKILL.md"]),

    q(2, 45,
      "Two teammates get different Claude Code behavior on the same repo. One suspects a stray user-level instruction.",
      "What is the fastest way to confirm which memory files are loaded?",
      [
        "Diff the entire repo",
        "Run /memory to list the loaded memory files for each environment",
        "Restart the machine",
        "Increase logging verbosity in CI"
      ], 1,
      "/memory lists the currently loaded memory files, quickly revealing whether a user-level file is causing divergent behavior. Diffing the repo (A) misses user-level files, restarting (C) does nothing, and CI verbosity (D) doesn't reflect local memory loading.",
      ["CLAUDE.md", "memory-command", "diagnosis", "hierarchy"]),

    q(2, 46,
      "Your team wants conventions that apply to all GraphQL resolver files regardless of where they live.",
      "Which is the cleanest implementation?",
      [
        "A CLAUDE.md in every directory that might hold a resolver",
        "A .claude/rules/ file with a glob path like **/*.resolver.ts",
        "A comment at the top of each resolver",
        "A single sentence in the root CLAUDE.md with no scoping"
      ], 1,
      "A path-scoped rule with a glob (**/*.resolver.ts) applies to all matching files across directories and loads only when relevant. Per-directory CLAUDE.md (A) requires duplication, per-file comments (C) don't scale, and an unscoped root line (D) always loads and lacks targeting.",
      ["path-rules", "glob", "conventions", "conditional-loading"]),

    q(2, 47,
      "You are refining a migration script and want to fix a specific edge case: null values in a date column.",
      "Which iterative-refinement action is most effective?",
      [
        "Say 'handle nulls better' with no example",
        "Provide a specific test case with example input (null date) and expected output to fix the edge case",
        "Increase temperature",
        "Switch to batch processing"
      ], 1,
      "Providing a concrete test case (null-date input and expected output) precisely communicates the desired edge-case handling. Vague guidance (A) yields inconsistent results, temperature (C) doesn't specify behavior, and batch processing (D) is unrelated to refining logic.",
      ["iterative-refinement", "edge-cases", "examples", "test-cases"]),

    q(2, 48,
      "For a predictable pre-merge check that must complete before developers can merge, your manager suggests moving it to the Message Batches API for cost savings.",
      "From a Claude Code CI standpoint, is that appropriate?",
      [
        "Yes; batch is always cheaper so use it everywhere",
        "No; blocking pre-merge checks need timely results, so keep real-time; batch suits non-blocking overnight jobs",
        "Yes; batch has a guaranteed low-latency SLA",
        "No; batch cannot correlate requests at all"
      ], 1,
      "Blocking pre-merge checks require timely completion, which the batch API (up to 24h, no latency SLA) can't guarantee; keep them real-time and reserve batch for non-blocking jobs. Batch isn't universally appropriate (A), has no low-latency SLA (C), and can correlate via custom_id (D is false).",
      ["ci-cd", "batch-api", "latency", "workflow"]),

    q(2, 49,
      "You want to verify that a newly added .claude/rules/ file only affects the intended file type and isn't loading globally.",
      "What determines whether the rule loads?",
      [
        "It always loads globally regardless of frontmatter",
        "The YAML frontmatter paths glob - the rule loads only when editing files matching the pattern",
        "The file's alphabetical position",
        "Whether context: fork is set"
      ], 1,
      "A path-scoped rule loads only when the edited file matches its frontmatter paths glob, keeping it targeted. It doesn't load globally (A), isn't governed by filename order (C), and context: fork (D) is a skill setting, not a rule-loading trigger.",
      ["path-rules", "glob", "frontmatter", "conditional-loading"]),

    q(2, 50,
      "A large CLAUDE.md is being split. Some conventions apply everywhere; others only to specific file types.",
      "What is the best split strategy?",
      [
        "Put everything into path-scoped rules with no CLAUDE.md",
        "Keep universal always-on standards in CLAUDE.md (or .claude/rules/ without path scoping) and put type-specific conventions in path-scoped .claude/rules/ files",
        "Put everything into one path-scoped rule matching **/*",
        "Duplicate all conventions in every subdirectory"
      ], 1,
      "Universal standards belong in always-loaded CLAUDE.md/rules, while type-specific conventions go in path-scoped .claude/rules/ files that load only when relevant. Forcing everything into path rules (A) can drop universal coverage, a **/* rule (C) defeats scoping, and duplication (D) is unmaintainable.",
      ["CLAUDE.md", "rules-directory", "path-rules", "organization"]),
]


# =====================================================================
# DOMAIN 3 - Prompt Engineering & Structured Output  (add d3-013 .. d3-050)
# Task statements 4.1-4.5 (explicit criteria, few-shot, tool_use/JSON
# schema, validation/retry, batch processing)
# =====================================================================
NEW[3] += [
    q(3, 13,
      "Your code-review prompt says 'check that comments are accurate,' and it flags many false positives on stylistic comments.",
      "Which rewrite improves precision?",
      [
        "Add 'be conservative' and 'only report high-confidence findings'",
        "Use explicit categorical criteria: 'flag a comment only when its claimed behavior contradicts the actual code behavior'",
        "Lower the temperature",
        "Ask for fewer findings overall"
      ], 1,
      "Explicit categorical criteria (contradiction between claimed and actual behavior) outperform vague guidance for precision. Confidence-based hedging like 'be conservative' (A) doesn't define what to report, temperature (C) doesn't clarify criteria, and simply asking for fewer findings (D) may drop true positives.",
      ["explicit-criteria", "false-positives", "precision", "prompt-engineering"]),

    q(3, 14,
      "One review category (naming-style nitpicks) has a high false-positive rate and is eroding developer trust in the whole tool.",
      "What is a sound short-term action while you improve it?",
      [
        "Keep it enabled; trust will recover on its own",
        "Temporarily disable the high false-positive category to restore trust while refining its criteria",
        "Disable all categories to be safe",
        "Increase max_tokens for that category"
      ], 1,
      "Temporarily disabling a high-false-positive category restores trust in the accurate categories while you refine the problematic one. Leaving it on (A) continues eroding trust, disabling everything (C) throws away value, and max_tokens (D) doesn't change accuracy.",
      ["explicit-criteria", "false-positives", "developer-trust", "prompt-engineering"]),

    q(3, 15,
      "You need consistent severity classification (critical/major/minor) across reviews.",
      "Which technique yields the most consistent classification?",
      [
        "Tell the model to 'use good judgment' on severity",
        "Define explicit severity criteria with concrete code examples for each level",
        "Randomly assign severity to reduce bias",
        "Only allow one severity level"
      ], 1,
      "Explicit severity definitions anchored by concrete code examples per level produce consistent classification. 'Good judgment' (A) is vague, randomness (C) is nonsensical, and collapsing to one level (D) removes needed granularity.",
      ["explicit-criteria", "severity", "classification", "examples"]),

    q(3, 16,
      "Detailed prose instructions still produce inconsistently formatted, hard-to-action output from Claude.",
      "Which technique most effectively enforces consistent, actionable format?",
      [
        "Longer prose instructions",
        "2-4 targeted few-shot examples demonstrating the exact desired output format",
        "Higher temperature",
        "Repeating the instruction three times"
      ], 1,
      "Few-shot examples are the most effective way to lock in a consistent, actionable output format when instructions alone fall short. More prose (A), higher temperature (C), or repetition (D) don't demonstrate the target format the way concrete examples do.",
      ["few-shot", "output-format", "consistency", "prompt-engineering"]),

    q(3, 17,
      "For ambiguous tool-selection cases, you want the model to generalize good judgment rather than memorize fixed rules.",
      "How should few-shot examples be constructed?",
      [
        "Show only the final answer with no reasoning",
        "Show 2-4 examples that include the reasoning for why one action was chosen over plausible alternatives",
        "Provide 50 examples covering every case",
        "Provide contradictory examples to increase robustness"
      ], 1,
      "Few-shot examples that reveal the reasoning for choosing one action over plausible alternatives help the model generalize judgment to novel cases. Answer-only examples (A) hide the rationale, 50 examples (C) are unnecessary and costly, and contradictory examples (D) confuse the model.",
      ["few-shot", "reasoning", "generalization", "ambiguous-cases"]),

    q(3, 18,
      "Your extraction over varied documents (inline citations vs bibliographies) misses fields depending on structure.",
      "Which few-shot approach helps?",
      [
        "Examples from only one document structure",
        "Examples demonstrating correct handling of varied document structures (inline citations, bibliographies, methodology sections)",
        "No examples; rely on schema alone",
        "Examples with intentionally wrong extractions"
      ], 1,
      "Few-shot examples spanning the varied structures teach the model to handle each correctly and reduce structure-dependent misses. Single-structure examples (A) don't generalize, schema alone (C) doesn't teach structural handling, and wrong examples (D) mislead.",
      ["few-shot", "extraction", "document-structure", "generalization"]),

    q(3, 19,
      "You must guarantee schema-compliant JSON with no syntax errors from an extraction task.",
      "Which approach is most reliable?",
      [
        "Ask for JSON in the prompt and hope it's valid",
        "Use tool_use with a JSON schema; extract from the tool_use response to eliminate JSON syntax errors",
        "Post-process free text with a JSON repair library",
        "Increase max_tokens so JSON isn't truncated"
      ], 1,
      "tool_use with a JSON schema is the most reliable route to guaranteed schema-compliant output, eliminating syntax errors. Prompt-and-hope (A) and JSON repair (C) are unreliable, and max_tokens (D) only addresses truncation, not validity or schema conformance.",
      ["structured-output", "tool_use", "json-schema", "reliability"]),

    q(3, 20,
      "You have multiple extraction schemas and the document type is unknown, but you must ensure the model calls one of the extraction tools rather than replying with text.",
      "Which tool_choice setting fits?",
      [
        "tool_choice: 'auto'",
        "tool_choice: 'any'",
        "tool_choice: 'none'",
        "tool_choice: {\"type\": \"tool\", \"name\": \"specific\"}"
      ], 1,
      "tool_choice: 'any' forces a tool call while letting the model pick the appropriate extraction schema for an unknown document type. 'auto' (A) may return text, 'none' (C) forbids tools, and forcing a specific tool (D) is wrong when the type is unknown.",
      ["structured-output", "tool_choice", "any", "extraction"]),

    q(3, 21,
      "A metadata extraction must always run before enrichment tools in the same pipeline.",
      "Which tool_choice ensures the metadata tool runs first?",
      [
        "tool_choice: 'auto'",
        "tool_choice: {\"type\": \"tool\", \"name\": \"extract_metadata\"} to force it, then process later steps in follow-up turns",
        "tool_choice: 'any'",
        "tool_choice: 'none'"
      ], 1,
      "Forcing the named tool (extract_metadata) guarantees it runs first; enrichment proceeds in subsequent turns. 'auto' (A) and 'any' (C) don't guarantee which/whether the specific tool runs first, and 'none' (D) forbids tools entirely.",
      ["structured-output", "tool_choice", "forced-tool", "ordering"]),

    q(3, 22,
      "Strict JSON schemas via tool use removed all syntax errors, but you still see line items that don't sum to the stated total.",
      "What does this reveal about schema strictness?",
      [
        "Strict schemas also guarantee semantic correctness",
        "Strict schemas eliminate syntax errors but not semantic errors like arithmetic inconsistencies or misplaced values",
        "The schema must be malformed",
        "tool_use is the wrong approach"
      ], 1,
      "Strict schemas guarantee structural/syntactic validity but not semantics - values can still be wrong or inconsistent (line items not summing). This isn't a malformed schema (C) or a reason to abandon tool_use (D); it calls for semantic validation on top of the schema.",
      ["structured-output", "json-schema", "semantic-errors", "validation"]),

    q(3, 23,
      "Source documents sometimes lack a field, and your required-field schema causes the model to fabricate values.",
      "How should the schema be designed?",
      [
        "Keep all fields required to force complete output",
        "Make fields optional/nullable when the source may not contain them, so the model isn't pushed to fabricate",
        "Remove the field entirely",
        "Add more required fields to distract the model"
      ], 1,
      "Marking fields optional/nullable when the source may omit them prevents the model from inventing values to satisfy required fields. Forcing required (A) causes hallucination, deleting the field (C) loses data when present, and adding fields (D) worsens the problem.",
      ["structured-output", "json-schema", "nullable", "hallucination"]),

    q(3, 24,
      "You need an extensible category field that can gracefully handle values you didn't anticipate.",
      "Which schema pattern fits?",
      [
        "A closed enum with no escape value",
        "An enum plus an 'other' value with a detail string (and an 'unclear' value for ambiguous cases)",
        "A free-text field with no enum",
        "A boolean field"
      ], 1,
      "An enum with 'other' + a detail string (and 'unclear' for ambiguity) supports extensibility while keeping structure. A closed enum (A) can't represent novel values, free text (C) loses structure, and a boolean (D) can't categorize.",
      ["structured-output", "json-schema", "enum", "extensibility"]),

    q(3, 25,
      "An extraction failed a semantic validation. You will retry with feedback.",
      "What should the retry request include?",
      [
        "Only the instruction to 'try again'",
        "The original document, the failed extraction, and the specific validation errors for self-correction",
        "A different unrelated document",
        "A higher temperature and nothing else"
      ], 1,
      "Retry-with-error-feedback appends the original document, the failed output, and the specific validation errors so the model can self-correct. A bare 'try again' (A) gives no guidance, an unrelated document (C) is nonsensical, and temperature alone (D) doesn't communicate the errors.",
      ["validation", "retry", "error-feedback", "self-correction"]),

    q(3, 26,
      "The required information is simply not present in the provided document. Your pipeline keeps retrying extraction.",
      "Why will retries not help here?",
      [
        "Retries always help if you add more of them",
        "Retries can't produce information absent from the source; they help with format/structural errors, not missing data",
        "The schema must be wrong",
        "Temperature is too low"
      ], 1,
      "Retries correct format or structural mistakes, but they cannot conjure data that isn't in the source. Adding retries (A) wastes calls, and the issue is missing information, not a wrong schema (C) or temperature (D). Detect this case and stop retrying.",
      ["validation", "retry", "limits", "missing-data"]),

    q(3, 27,
      "You want to analyze which code constructs most often trigger findings that developers later dismiss (false positives).",
      "Which schema addition enables systematic analysis?",
      [
        "Remove all metadata to keep output small",
        "Add a detected_pattern field to each finding so you can correlate dismissals with patterns",
        "Add a random id to each finding",
        "Store findings as unstructured prose"
      ], 1,
      "A detected_pattern field lets you correlate dismissed findings with the constructs that triggered them, enabling targeted prompt improvements. Removing metadata (A) or using prose (D) prevents analysis, and a random id (C) doesn't capture the pattern.",
      ["validation", "feedback-loop", "detected_pattern", "false-positives"]),

    q(3, 28,
      "You want to catch invoices where line items don't add up to the stated total.",
      "Which self-correction validation design works?",
      [
        "Extract only the stated_total and trust it",
        "Extract calculated_total alongside stated_total and flag discrepancies; add a conflict_detected boolean for inconsistent source data",
        "Ask the model to 'double check' with no fields",
        "Round all totals to hide differences"
      ], 1,
      "Extracting both calculated_total and stated_total (plus a conflict_detected flag) surfaces arithmetic inconsistencies the schema alone can't catch. Trusting stated_total (A) misses errors, a vague 'double check' (C) is unreliable, and rounding (D) hides real discrepancies.",
      ["validation", "semantic-validation", "self-correction", "conflict-detection"]),

    q(3, 29,
      "Your manager wants to switch an overnight technical-debt report and a blocking pre-merge check both to the Message Batches API for 50% savings.",
      "How should you evaluate this?",
      [
        "Switch both to batch for maximum savings",
        "Use batch only for the overnight report (latency-tolerant); keep the blocking pre-merge check real-time",
        "Keep both real-time to avoid ordering issues",
        "Switch both to batch with a real-time timeout fallback"
      ], 1,
      "Batch (up to 24h, no latency SLA) suits latency-tolerant overnight jobs but not blocking pre-merge checks where developers wait. Switching both (A, D) risks blocking developers, and keeping both real-time (C) forgoes easy savings on the overnight job (batch results correlate via custom_id, so ordering isn't the concern).",
      ["batch-api", "latency", "cost", "workflow"]),

    q(3, 30,
      "You submit many documents to the Message Batches API and need to match each response to its request.",
      "Which mechanism correlates request/response pairs?",
      [
        "Response arrival order",
        "The custom_id field attached to each request and echoed in its response",
        "A timestamp heuristic",
        "The document's first line"
      ], 1,
      "custom_id fields correlate batch requests with their responses regardless of ordering. Arrival order (A) isn't guaranteed, and timestamps (C) or content heuristics (D) are unreliable ways to match pairs.",
      ["batch-api", "custom_id", "correlation", "structured-output"]),

    q(3, 31,
      "A workflow needs Claude to execute a tool mid-request, get the result, and continue reasoning within the same request.",
      "Is the Message Batches API appropriate?",
      [
        "Yes; batch supports multi-turn tool calling within one request",
        "No; the batch API does not support multi-turn tool calling within a single request",
        "Yes; batch is identical to real-time",
        "No; because batch has a guaranteed 1-minute SLA"
      ], 1,
      "The batch API does not support multi-turn tool calling within a single request, so mid-request tool execution isn't possible there. It is not identical to real-time (A, C), and it has no low-latency SLA (D's reasoning is wrong).",
      ["batch-api", "multi-turn", "tool-calling", "limits"]),

    q(3, 32,
      "Source documents use inconsistent formats (dates, units) but you enforce a strict output schema.",
      "How do you handle the inconsistency alongside the schema?",
      [
        "Only enforce the schema and ignore formatting",
        "Include format normalization rules in the prompt alongside the strict output schema",
        "Loosen the schema to accept any format",
        "Reject any document that isn't pre-normalized"
      ], 1,
      "Combining strict output schemas with in-prompt format normalization rules handles messy source formatting while keeping structured output. Ignoring formatting (A) yields inconsistent values, loosening the schema (C) defeats its purpose, and rejecting documents (D) is impractical.",
      ["structured-output", "normalization", "json-schema", "prompt-engineering"]),

    q(3, 33,
      "You want to reduce false positives while still letting the model generalize to genuinely new issues.",
      "Which few-shot strategy helps?",
      [
        "Only show examples of issues to report",
        "Include examples that distinguish acceptable patterns from genuine issues, so the model learns the boundary and generalizes",
        "Show no negative examples",
        "Provide only one example"
      ], 1,
      "Examples that contrast acceptable patterns with genuine issues teach the decision boundary, cutting false positives while preserving generalization. Only-positive examples (A, C) don't convey what to skip, and a single example (D) under-specifies the boundary.",
      ["few-shot", "false-positives", "generalization", "boundary"]),

    q(3, 34,
      "Extraction of a required field keeps coming back empty/null for documents with unusual layouts.",
      "Which fix directly targets this?",
      [
        "Make the field required and add retries",
        "Add few-shot examples showing correct extraction from documents with those varied formats",
        "Increase temperature",
        "Remove the field"
      ], 1,
      "Few-shot examples demonstrating correct extraction from the varied/unusual formats address empty/null results for those layouts. Forcing required + retries (A) risks fabrication or wasted retries, temperature (C) doesn't teach layout handling, and removing the field (D) loses needed data.",
      ["few-shot", "extraction", "null-fields", "document-format"]),

    q(3, 35,
      "You need machine-parseable findings (location, issue, severity, suggested fix) posted as PR comments.",
      "Which combination best guarantees the structure?",
      [
        "Ask for a bulleted list in prose",
        "Define a tool_use schema with those fields and few-shot examples demonstrating the exact format",
        "Use free text and parse with regex",
        "Rely on temperature 0 alone"
      ], 1,
      "A tool_use schema for the fields plus few-shot examples of the exact format yields reliable, machine-parseable output. Prose lists (A) and regex parsing (C) are fragile, and temperature 0 alone (D) doesn't guarantee structure.",
      ["structured-output", "tool_use", "few-shot", "ci-cd"]),

    q(3, 36,
      "You want to reduce hallucination in an extraction task over informal measurements (e.g., 'a pinch', '2 cups-ish').",
      "Which technique is most effective?",
      [
        "Raise temperature for creativity",
        "Provide few-shot examples showing how to handle informal/ambiguous measurements consistently",
        "Force all measurements into a required numeric field",
        "Ignore informal measurements"
      ], 1,
      "Few-shot examples demonstrating consistent handling of informal measurements reduce hallucination and standardize output. Higher temperature (A) increases variability, forcing required numerics (C) invites fabrication, and ignoring them (D) loses data.",
      ["few-shot", "hallucination", "extraction", "ambiguity"]),

    q(3, 37,
      "Your prompt says 'only report high-confidence findings,' yet precision hasn't improved.",
      "Why does confidence-based filtering underperform explicit criteria?",
      [
        "Confidence phrasing objectively improves precision every time",
        "Vague confidence instructions don't define WHAT to report; specific categorical criteria do, yielding better precision",
        "The model can't understand the word 'confidence'",
        "You must set a numeric confidence threshold in the API"
      ], 1,
      "'High-confidence only' doesn't specify which categories or conditions warrant a report, so precision stalls; explicit categorical criteria define the target and improve precision. It doesn't reliably help (A), the issue isn't vocabulary (C), and there's no built-in API confidence threshold to set here (D).",
      ["explicit-criteria", "confidence", "precision", "prompt-engineering"]),

    q(3, 38,
      "You must ensure the model returns structured data rather than a conversational reply, but any of several valid tools may be used.",
      "Which setting is appropriate?",
      [
        "tool_choice: 'auto'",
        "tool_choice: 'any'",
        "tool_choice: 'none'",
        "No tool_choice; rely on the prompt"
      ], 1,
      "tool_choice: 'any' forces a tool call (guaranteeing structured output) while letting the model choose among valid tools. 'auto' (A) or no setting (D) may yield text, and 'none' (C) forbids tools entirely.",
      ["structured-output", "tool_choice", "any", "reliability"]),

    q(3, 39,
      "A document type is known and one specific schema must be applied every time.",
      "Which tool_choice is most appropriate?",
      [
        "tool_choice: 'auto'",
        "tool_choice: {\"type\": \"tool\", \"name\": \"extract_known_type\"}",
        "tool_choice: 'any'",
        "tool_choice: 'none'"
      ], 1,
      "When exactly one schema applies, forcing that named tool guarantees it runs. 'auto' (A) may return text, 'any' (C) could pick a different tool, and 'none' (D) forbids tools.",
      ["structured-output", "tool_choice", "forced-tool", "extraction"]),

    q(3, 40,
      "You designed a schema with a required 'discount_code' field, but many invoices legitimately have no discount, and the model invents codes.",
      "What is the correct schema change?",
      [
        "Keep it required; invented codes are acceptable",
        "Make discount_code optional/nullable so the model can omit it when absent",
        "Rename the field",
        "Add a second required discount field"
      ], 1,
      "Making discount_code nullable/optional lets the model correctly omit it when there's no discount, preventing fabrication. Keeping it required (A) causes invented codes, renaming (C) doesn't address requiredness, and adding another required field (D) worsens it.",
      ["structured-output", "json-schema", "nullable", "hallucination"]),

    q(3, 41,
      "You want an extraction to flag when the source contains contradictory data (two different totals stated).",
      "Which design captures this?",
      [
        "Silently pick one total",
        "Add a conflict_detected boolean (and capture both values) so downstream systems can handle the inconsistency",
        "Reject the document outright",
        "Average the two totals"
      ], 1,
      "A conflict_detected boolean plus capturing both values surfaces source contradictions for downstream handling. Silently choosing (A) or averaging (D) hides/creates errors, and rejecting the document (C) may discard otherwise usable data.",
      ["validation", "conflict-detection", "structured-output", "provenance"]),

    q(3, 42,
      "For a nightly test-generation job that isn't time-sensitive, you want to cut cost.",
      "Is the Message Batches API a good fit?",
      [
        "No; batch is never worth it",
        "Yes; nightly, latency-tolerant jobs are ideal for the 50% batch savings",
        "No; test generation requires multi-turn tool calling in one request",
        "Yes, but only with a guaranteed latency SLA"
      ], 1,
      "Nightly, non-blocking test generation is latency-tolerant and a good fit for batch's 50% savings. Batch can be worth it (A is wrong), simple test generation needn't do multi-turn tool calling in one request (C), and batch offers no latency SLA (D).",
      ["batch-api", "cost", "latency", "test-generation"]),

    q(3, 43,
      "You want the model to choose whether to answer directly or call a tool, depending on the input.",
      "Which tool_choice reflects that flexibility?",
      [
        "tool_choice: 'auto'",
        "tool_choice: 'any'",
        "tool_choice: {\"type\": \"tool\", \"name\": \"x\"}",
        "tool_choice: 'none'"
      ], 0,
      "tool_choice: 'auto' lets the model decide between replying with text or calling a tool. 'any' (B) forces a tool call, forcing a named tool (C) removes choice, and 'none' (D) forbids tools.",
      ["structured-output", "tool_choice", "auto", "flexibility"]),

    q(3, 44,
      "Your reviewer prompt flags a pattern as a bug in one file but approves the identical pattern in another during the same run.",
      "Which prompt improvement best reduces this inconsistency?",
      [
        "Tell it to 'be consistent'",
        "Provide explicit criteria and few-shot examples that define the pattern as acceptable or a genuine issue, so classification is consistent",
        "Increase temperature",
        "Review each file in a separate model with no shared criteria"
      ], 1,
      "Explicit criteria plus few-shot examples pin down whether a pattern is acceptable or a real issue, producing consistent classification. 'Be consistent' (A) is vague, temperature (C) adds variance, and separate models with no shared criteria (D) can diverge further.",
      ["explicit-criteria", "few-shot", "consistency", "false-positives"]),

    q(3, 45,
      "A strict-schema extraction returns valid JSON, but 'shipping_cost' is placed in the 'tax' field.",
      "What kind of error is this and how do you catch it?",
      [
        "A syntax error caught by the schema",
        "A semantic (misplaced-value) error not caught by schema strictness; catch it with semantic validation/self-correction checks",
        "An impossible error with tool_use",
        "A truncation error fixed by max_tokens"
      ], 1,
      "Placing a value in the wrong field is a semantic error that strict schemas don't catch; semantic validation (e.g., cross-field checks, self-correction) is needed. It's not a syntax error (A), tool_use doesn't prevent semantic mistakes (C), and it isn't truncation (D).",
      ["validation", "semantic-errors", "json-schema", "self-correction"]),

    q(3, 46,
      "You want a retry loop that only retries when it can actually help.",
      "Which condition should trigger a retry?",
      [
        "The required data is absent from the source",
        "A format or structural output error occurred (e.g., malformed structure) that feedback can correct",
        "The document is simply long",
        "The model produced any output at all"
      ], 1,
      "Retries help for format/structural errors that error-feedback can correct; they don't help when required data is absent (A). Length alone (C) isn't a reason to retry, and producing some output (D) isn't a trigger by itself.",
      ["validation", "retry", "error-feedback", "limits"]),

    q(3, 47,
      "You need consistent, actionable review output and precise criteria at once.",
      "Which combined approach is strongest?",
      [
        "Explicit categorical criteria alone with no examples",
        "Explicit criteria for WHAT to report plus few-shot examples for HOW to format it",
        "Few-shot format examples with no criteria",
        "Neither; rely on temperature 0"
      ], 1,
      "Combining explicit criteria (what to report) with few-shot examples (how to format) yields both precision and consistent, actionable output. Criteria alone (A) may still format inconsistently, examples without criteria (C) may report the wrong things, and temperature 0 (D) addresses neither.",
      ["explicit-criteria", "few-shot", "precision", "output-format"]),

    q(3, 48,
      "Your schema must categorize support tickets, but new categories appear over time and some tickets are genuinely ambiguous.",
      "Which schema design handles both?",
      [
        "A closed enum only",
        "An enum with 'other' + detail for new categories and an 'unclear' value for ambiguous tickets",
        "A required free-text category",
        "A numeric category id with no labels"
      ], 1,
      "An enum plus 'other'+detail (extensibility) and an 'unclear' value (ambiguity) covers both evolving categories and ambiguous cases. A closed enum (A) can't grow, free text (C) loses structure, and unlabeled numeric ids (D) are opaque.",
      ["structured-output", "enum", "extensibility", "ambiguity"]),

    q(3, 49,
      "You must force a specific extraction to run before any enrichment, then handle enrichment in later turns.",
      "Which is the correct sequence design?",
      [
        "Set tool_choice: 'any' and hope extraction goes first",
        "Force the extraction tool with tool_choice: {\"type\":\"tool\",\"name\":\"extract\"}, then run enrichment in follow-up turns",
        "Put everything in one tool call",
        "Use batch processing to order them"
      ], 1,
      "Forcing the named extraction tool guarantees it runs first; enrichment then proceeds in subsequent turns. 'any' (A) doesn't guarantee order, a single mega tool call (C) conflates steps, and batch (D) can't do mid-request multi-turn sequencing.",
      ["structured-output", "tool_choice", "ordering", "forced-tool"]),

    q(3, 50,
      "After adding tool_use with a strict schema, syntax errors vanished but stakeholders still report 'wrong' extractions.",
      "What is the right mental model to communicate?",
      [
        "tool_use guarantees both syntax and semantics",
        "tool_use guarantees structure/syntax; semantic correctness needs additional validation, examples, and normalization",
        "The remaining errors mean tool_use failed",
        "Semantics are impossible to improve"
      ], 1,
      "tool_use guarantees structural/syntactic validity, but semantic correctness requires extra measures: semantic validation, few-shot examples, and normalization rules. It doesn't guarantee semantics (A), the errors don't mean tool_use failed (C), and semantics can indeed be improved (D).",
      ["structured-output", "tool_use", "semantic-errors", "validation"]),
]


# =====================================================================
# DOMAIN 4 - Tool Design & MCP Integration  (add d4-016 .. d4-045)
# Task statements 2.1-2.5 (tool interfaces, structured MCP errors, tool
# distribution/tool_choice, MCP server integration, built-in tools)
# =====================================================================
NEW[4] += [
    q(4, 16,
      "Two tools, analyze_content and analyze_document, have nearly identical one-line descriptions, and Claude keeps misrouting between them.",
      "What is the primary cause and best fix?",
      [
        "The model is broken; switch models",
        "Ambiguous/overlapping descriptions cause misrouting; rewrite them to clearly differentiate purpose, inputs, outputs, and when to use each (renaming if needed)",
        "Add both tools to a second agent",
        "Set tool_choice to 'none'"
      ], 1,
      "Tool descriptions are the primary signal for selection; near-identical descriptions cause misrouting. The fix is to differentiate them clearly - purpose, inputs, outputs, and usage boundaries - renaming where helpful (e.g., extract_web_results). Switching models (A) or duplicating tools (C) doesn't fix ambiguity, and 'none' (D) disables tools.",
      ["tool-design", "descriptions", "disambiguation", "tool-selection"]),

    q(4, 17,
      "You are writing a tool description to maximize reliable selection.",
      "What should a high-quality tool description include?",
      [
        "Only the tool's name",
        "Purpose, expected input formats, example queries, edge cases, and when to use it vs similar alternatives",
        "Just the output schema",
        "A marketing tagline"
      ], 1,
      "Effective descriptions specify purpose, input formats, example queries, edge cases, and how the tool differs from alternatives - giving the model what it needs to choose correctly. A bare name (A), output-only (C), or a tagline (D) leaves selection unreliable.",
      ["tool-design", "descriptions", "input-formats", "tool-selection"]),

    q(4, 18,
      "A generic analyze_document tool is used for extraction, summarization, and claim verification, and results are inconsistent.",
      "Which refactor improves reliability?",
      [
        "Add more text to the single tool's description",
        "Split it into purpose-specific tools (extract_data_points, summarize_content, verify_claim_against_source) with defined input/output contracts",
        "Remove the tool entirely",
        "Route all three uses through Grep"
      ], 1,
      "Splitting an overloaded generic tool into purpose-specific tools with clear contracts improves selection and result quality. More description text (A) doesn't resolve the overload, removing it (C) loses capability, and Grep (D) can't perform these semantic operations.",
      ["tool-design", "tool-splitting", "contracts", "specialization"]),

    q(4, 19,
      "A well-written tool description exists, but a keyword-sensitive line in the system prompt keeps steering Claude to the wrong tool.",
      "What should you review?",
      [
        "Only the tool description",
        "The system prompt for keyword-sensitive instructions that create unintended tool associations overriding good descriptions",
        "The model temperature",
        "The user's phrasing only"
      ], 1,
      "System-prompt wording can create keyword associations that override even good tool descriptions, so review it for such triggers. Focusing only on the description (A), temperature (C), or user phrasing (D) misses the actual cause in the system prompt.",
      ["tool-design", "system-prompt", "keyword-sensitivity", "tool-selection"]),

    q(4, 20,
      "An MCP tool fails and returns a generic 'Operation failed' message, so the agent can't decide what to do next.",
      "What is the recommended error-response design?",
      [
        "Keep the generic message; less detail is safer",
        "Return structured metadata: errorCategory (transient/validation/business/permission), isRetryable boolean, and a human-readable description",
        "Return an empty success",
        "Throw an unstructured exception"
      ], 1,
      "Structured error metadata (errorCategory, isRetryable, human-readable description) lets the agent choose the right recovery. Generic messages (A) block informed decisions, empty success (C) hides failures, and unstructured exceptions (D) crash the loop.",
      ["mcp", "error-handling", "structured-errors", "isError"]),

    q(4, 21,
      "Your MCP tool blocked an action due to a business-rule violation (over-limit refund).",
      "How should the error be represented so the agent responds appropriately?",
      [
        "isRetryable: true with a generic message",
        "A business-category error with retriable: false and a customer-friendly explanation so the agent communicates rather than retries",
        "A transient error so the agent retries",
        "No error; silently succeed"
      ], 1,
      "Business-rule violations are non-retryable; marking retriable: false with a clear explanation lets the agent communicate the outcome instead of pointlessly retrying. Marking it retryable/transient (A, C) causes wasted retries, and silent success (D) violates the rule.",
      ["mcp", "error-handling", "business-error", "retryable"]),

    q(4, 22,
      "The MCP isError flag is central to failure handling.",
      "What is its role?",
      [
        "It formats successful output",
        "It signals to the agent that a tool call failed, so failures are communicated back distinctly from successful results",
        "It caches results",
        "It sets tool_choice"
      ], 1,
      "The isError flag communicates tool failures back to the agent, distinguishing errors from successful results. It doesn't format success (A), cache (C), or configure tool_choice (D).",
      ["mcp", "isError", "error-handling", "tool-design"]),

    q(4, 23,
      "A subagent distinguishes between 'could not access the service' and 'query succeeded but returned no rows.'",
      "Why does this distinction matter for error handling?",
      [
        "It doesn't; both should be retried",
        "Access failures may warrant retry decisions, while valid empty results are successful and should not trigger retries",
        "Both should be treated as fatal",
        "Empty results should always raise exceptions"
      ], 1,
      "Access failures may need retries, but a valid empty result is a successful query with no matches and shouldn't be retried. Treating both as retryable (A) or fatal (C) is wrong, and raising exceptions on empty results (D) misrepresents success.",
      ["mcp", "error-handling", "empty-results", "retryable"]),

    q(4, 24,
      "An agent has been given 18 tools and its tool selection has become unreliable.",
      "What does this illustrate and how do you fix it?",
      [
        "More tools always improve capability; keep all 18",
        "Too many tools degrade selection reliability; scope each agent to the 4-5 tools it actually needs",
        "Reduce max_tokens",
        "Set tool_choice to 'any'"
      ], 1,
      "Giving an agent too many tools (e.g., 18) increases decision complexity and degrades selection; scoping to the ~4-5 relevant tools restores reliability. More tools aren't always better (A), and max_tokens (C) or tool_choice (D) don't address selection overload.",
      ["tool-design", "tool-distribution", "least-privilege", "tool-selection"]),

    q(4, 25,
      "A synthesis agent that shouldn't search the web has been given web-search tools and keeps misusing them.",
      "What principle guides the fix?",
      [
        "Give every agent every tool for flexibility",
        "Scope tool access to each agent's role; remove tools outside its specialization to prevent misuse",
        "Increase temperature so it self-corrects",
        "Add a second synthesis agent"
      ], 1,
      "Agents with tools outside their specialization tend to misuse them; scoping tools to role prevents this. Universal tool access (A) causes exactly this problem, temperature (C) doesn't fix scope, and adding agents (D) doesn't remove the misused tools.",
      ["tool-design", "tool-distribution", "separation-of-concerns", "scoping"]),

    q(4, 26,
      "A generic fetch_url tool is being used to load documents and sometimes fetches invalid or unintended URLs.",
      "Which replacement improves safety and reliability?",
      [
        "Keep fetch_url but add a prompt warning",
        "Replace it with a constrained load_document tool that validates document URLs",
        "Remove URL loading entirely",
        "Give the agent Bash to curl URLs"
      ], 1,
      "Replacing a broad tool with a constrained alternative (load_document that validates URLs) reduces misuse while preserving the needed capability. A prompt warning (A) is probabilistic, removing loading (C) breaks the feature, and Bash/curl (D) widens the attack surface.",
      ["tool-design", "constrained-tools", "validation", "safety"]),

    q(4, 27,
      "You want to guarantee the model calls a tool rather than replying with conversational text, though it may choose which tool.",
      "Which tool_choice setting applies?",
      [
        "tool_choice: 'auto'",
        "tool_choice: 'any'",
        "tool_choice: 'none'",
        "tool_choice: {\"type\":\"tool\",\"name\":\"x\"}"
      ], 1,
      "tool_choice: 'any' forces a tool call while leaving the choice to the model. 'auto' (A) permits text, 'none' (C) forbids tools, and forcing a named tool (D) removes choice.",
      ["tool-design", "tool_choice", "any", "structured-output"]),

    q(4, 28,
      "You want a shared MCP server available to the whole team with credentials injected without committing secrets.",
      "How do you configure it?",
      [
        "Hard-code the token in .mcp.json and commit it",
        "Configure the server in project-scoped .mcp.json using environment variable expansion (e.g., ${GITHUB_TOKEN}) for the credential",
        "Put it in ~/.claude.json so only you have it",
        "Store the token in CLAUDE.md"
      ], 1,
      "Project-scoped .mcp.json with env-var expansion (${GITHUB_TOKEN}) shares the server team-wide while keeping secrets out of version control. Hard-coding secrets (A) leaks them, user scope (C) doesn't share with the team, and CLAUDE.md (D) is not for credentials.",
      ["mcp", "server-config", "env-var-expansion", "project-scope"]),

    q(4, 29,
      "You are experimenting with a personal MCP server you don't want to impose on teammates.",
      "Where should it be configured?",
      [
        "Project-scoped .mcp.json committed to the repo",
        "User-scoped ~/.claude.json for personal/experimental servers",
        "In every teammate's shell profile",
        "In the root CLAUDE.md"
      ], 1,
      "Personal/experimental MCP servers belong in user-scoped ~/.claude.json so they don't affect the team. Project .mcp.json (A) would share them, teammates' profiles (C) is intrusive, and CLAUDE.md (D) is not an MCP config location.",
      ["mcp", "server-config", "user-scope", "experimental"]),

    q(4, 30,
      "You configure two MCP servers simultaneously and wonder whether the agent can use tools from both.",
      "What is true about tool discovery across servers?",
      [
        "Only the first server's tools are available",
        "Tools from all configured MCP servers are discovered at connection time and available simultaneously",
        "You must manually enable each tool per turn",
        "Servers are mutually exclusive"
      ], 1,
      "All configured MCP servers have their tools discovered at connection time and available to the agent simultaneously. It isn't limited to the first server (A), doesn't require per-turn enabling (C), and servers aren't mutually exclusive (D).",
      ["mcp", "server-config", "tool-discovery", "multi-server"]),

    q(4, 31,
      "Your agent keeps preferring built-in Grep over a more capable MCP tool that could answer directly.",
      "How do you encourage correct selection of the MCP tool?",
      [
        "Delete the Grep tool",
        "Enhance the MCP tool's description to clearly explain its capabilities and outputs so the agent prefers it when appropriate",
        "Lower temperature",
        "Force tool_choice to Grep"
      ], 1,
      "Improving the MCP tool's description to detail its capabilities/outputs helps the agent prefer it over built-ins like Grep when appropriate. Deleting Grep (A) removes a useful tool, temperature (C) doesn't change selection logic, and forcing Grep (D) is the opposite of the goal.",
      ["mcp", "tool-descriptions", "tool-selection", "built-in-tools"]),

    q(4, 32,
      "You need a standard integration with Jira and are deciding between building a custom MCP server or using an existing community one.",
      "What is the recommended approach?",
      [
        "Always build custom servers for full control",
        "Prefer existing community MCP servers for standard integrations; reserve custom servers for team-specific workflows",
        "Never use MCP for third-party tools",
        "Use Bash to call Jira's API directly"
      ], 1,
      "For standard integrations like Jira, prefer existing community MCP servers and reserve custom builds for genuinely team-specific needs. Always-custom (A) wastes effort, avoiding MCP (C) forgoes its benefits, and raw Bash API calls (D) bypass structured tooling.",
      ["mcp", "community-servers", "integration", "build-vs-buy"]),

    q(4, 33,
      "Your agents make many exploratory tool calls just to discover what data exists (issue lists, doc hierarchies, schemas).",
      "Which MCP capability reduces these exploratory calls?",
      [
        "More tools",
        "MCP resources that expose content catalogs so agents can see available data without exploratory tool calls",
        "Higher max_tokens",
        "tool_choice: 'any'"
      ], 1,
      "MCP resources expose content catalogs (issue summaries, doc hierarchies, schemas), giving agents visibility into available data and reducing exploratory tool calls. Adding tools (A) or tokens (C) doesn't provide a catalog, and tool_choice (D) doesn't expose data.",
      ["mcp", "resources", "content-catalog", "efficiency"]),

    q(4, 34,
      "You are deciding whether to model a capability as an MCP tool or an MCP resource.",
      "Which mapping is correct?",
      [
        "Use tools for content catalogs and resources for actions",
        "Use resources for content catalogs (browsable data) and tools for actions (operations the agent performs)",
        "Tools and resources are interchangeable",
        "Always use tools; resources are deprecated"
      ], 1,
      "Resources expose browsable content catalogs, while tools perform actions/operations. Option A inverts this. They aren't interchangeable (C), and resources are a first-class MCP concept, not deprecated (D).",
      ["mcp", "resources", "tools", "design"]),

    q(4, 35,
      "You need to search file contents across a codebase for all callers of a function.",
      "Which built-in tool is appropriate?",
      [
        "Glob",
        "Grep",
        "Write",
        "Edit"
      ], 1,
      "Grep searches file contents for patterns (like function names/callers), making it the right tool here. Glob (A) matches file paths by name/extension, and Write/Edit (C, D) modify files rather than search content.",
      ["built-in-tools", "grep", "content-search", "tool-selection"]),

    q(4, 36,
      "You need to find all files matching a naming pattern like **/*.test.tsx.",
      "Which built-in tool is appropriate?",
      [
        "Grep",
        "Glob",
        "Bash cat",
        "Read"
      ], 1,
      "Glob matches file paths by name/extension patterns (**/*.test.tsx). Grep (A) searches contents, cat (C) prints a file, and Read (D) loads a specific file's contents - none of which enumerate files by pattern.",
      ["built-in-tools", "glob", "file-matching", "tool-selection"]),

    q(4, 37,
      "You try to modify a file with Edit, but the anchor text appears multiple times and Edit can't uniquely match it.",
      "What is the recommended fallback?",
      [
        "Give up on the change",
        "Use Read to load the full file, then Write the updated contents",
        "Use Grep to overwrite the file",
        "Use Glob to modify the file"
      ], 1,
      "When Edit can't find a unique anchor, Read the full file then Write the modified contents as a reliable fallback. Giving up (A) is unnecessary, and Grep (C) / Glob (D) don't modify file contents.",
      ["built-in-tools", "edit", "read-write-fallback", "file-modification"]),

    q(4, 38,
      "You are exploring a large unfamiliar codebase and want to build understanding without reading everything upfront.",
      "Which incremental strategy is recommended?",
      [
        "Read every file first, then reason",
        "Start with Grep to find entry points, then Read to follow imports and trace flows incrementally",
        "Glob all files and load them into context",
        "Use Bash to print the whole repo"
      ], 1,
      "Incremental understanding - Grep for entry points, then Read to follow imports and trace flows - avoids context exhaustion and builds a targeted mental model. Reading everything (A), loading all files (C), or dumping the repo (D) floods context and wastes budget.",
      ["built-in-tools", "grep", "codebase-exploration", "context-management"]),

    q(4, 39,
      "You must trace how a function is used across wrapper modules that re-export it under different names.",
      "Which approach works?",
      [
        "Read one file and assume it's the only usage",
        "First identify all exported names, then Grep for each name across the codebase to trace usage",
        "Glob for the function's file only",
        "Rely on the model's memory of the code"
      ], 1,
      "Tracing usage through wrappers requires identifying all exported names, then Grepping each across the codebase. Reading one file (A) misses re-exports, Glob for one file (C) doesn't trace usage, and relying on memory (D) is unreliable for specific code.",
      ["built-in-tools", "grep", "usage-tracing", "wrappers"]),

    q(4, 40,
      "A synthesis agent occasionally needs simple fact verification, but full web tools would over-provision it.",
      "How do you balance capability and least privilege?",
      [
        "Give it all web tools",
        "Provide a scoped verify_fact tool for high-frequency simple lookups while routing complex verifications through the coordinator",
        "Give it no verification ability",
        "Set tool_choice: 'none'"
      ], 1,
      "A scoped cross-role tool (verify_fact) covers the common simple case without over-provisioning, while complex cases route through the coordinator. Full web tools (A) violate least privilege, no verification (C) breaks the need, and 'none' (D) disables tools.",
      ["tool-design", "scoped-tools", "least-privilege", "verify_fact"]),

    q(4, 41,
      "You want to force extract_metadata to run before enrichment tools within a tool-using agent.",
      "Which tool_choice configuration guarantees the first call?",
      [
        "tool_choice: 'auto'",
        "tool_choice: {\"type\":\"tool\",\"name\":\"extract_metadata\"}",
        "tool_choice: 'any'",
        "tool_choice: 'none'"
      ], 1,
      "Forcing the named tool (extract_metadata) guarantees it runs first; later steps proceed in follow-up turns. 'auto' (A) may return text, 'any' (C) may call a different tool, and 'none' (D) forbids tools.",
      ["tool-design", "tool_choice", "forced-tool", "ordering"]),

    q(4, 42,
      "An MCP tool experiences a timeout talking to a backend service.",
      "Which errorCategory best fits, and what should isRetryable be?",
      [
        "validation; isRetryable false",
        "transient; isRetryable true",
        "business; isRetryable false",
        "permission; isRetryable false"
      ], 1,
      "A backend timeout is a transient error and is typically retryable, so category 'transient' with isRetryable true is appropriate. Validation (A) and business (C) errors are input/policy issues (non-retryable), and permission (D) requires access changes, not a retry.",
      ["mcp", "error-classification", "transient", "retryable"]),

    q(4, 43,
      "Your team gives a coordinator many cross-role tools 'just in case,' and selection quality drops.",
      "Which distribution strategy is better?",
      [
        "Maximize tools on the coordinator",
        "Scope tools per role with only limited cross-role tools for specific high-frequency needs",
        "Put all tools on every subagent",
        "Remove all tools from subagents"
      ], 1,
      "Scoping tools per role, with only a few cross-role tools for genuine high-frequency needs, preserves selection quality. Maximizing tools (A) or putting all tools everywhere (C) degrades selection, and removing all subagent tools (D) breaks their function.",
      ["tool-design", "tool-distribution", "scoping", "coordinator"]),

    q(4, 44,
      "You must decide when to consolidate two tools into one versus keep them separate.",
      "Which guidance is soundest?",
      [
        "Always consolidate to reduce count",
        "Split when responsibilities/contracts differ enough to cause ambiguity; consolidate only when they truly share one clear purpose",
        "Always split every tool as finely as possible",
        "Tool boundaries don't affect selection"
      ], 1,
      "Boundaries should follow clear, distinct contracts: split when consolidation causes ambiguity, consolidate only when there's a single clear purpose. Always-consolidate (A) reintroduces overload, always-split (C) creates needless fragmentation, and boundaries clearly affect selection (D).",
      ["tool-design", "splitting-vs-consolidating", "contracts", "tool-selection"]),

    q(4, 45,
      "A tool description omits input format details, so the agent frequently passes malformed inputs.",
      "What is the fix?",
      [
        "Add retries around the tool",
        "Include input formats, example queries, and edge cases in the tool description so the agent supplies correct inputs",
        "Lower temperature",
        "Force the tool with tool_choice"
      ], 1,
      "Documenting input formats, example queries, and edge cases in the description helps the agent supply correct inputs. Retries (A) don't teach correct inputs, temperature (C) doesn't fix format knowledge, and forcing the tool (D) doesn't ensure valid arguments.",
      ["tool-design", "descriptions", "input-formats", "reliability"]),
]


# =====================================================================
# DOMAIN 5 - Context Management & Reliability  (add d5-016 .. d5-037)
# Context window optimization, summarization, lost-in-the-middle,
# scratchpads, confidence calibration, stratified sampling, human
# review, provenance, temporal handling, conflict/coverage reporting
# =====================================================================
NEW[5] += [
    q(5, 16,
      "A single very long context window holds hundreds of documents, and Claude reliably uses the first and last items but misses key facts buried in the middle.",
      "Which phenomenon is this and how do you mitigate it?",
      [
        "Token truncation; raise max_tokens",
        "The lost-in-the-middle effect; order the most important content near the start/end and extract key facts rather than dumping everything",
        "A model bug; switch models",
        "Rate limiting; slow down requests"
      ], 1,
      "The lost-in-the-middle effect degrades recall of content buried mid-context. Mitigate by position-aware ordering (important content near the beginning/end) and extracting key facts instead of dumping raw text. It isn't truncation (A), a model bug (C), or rate limiting (D).",
      ["context-management", "lost-in-the-middle", "position-aware", "reliability"]),

    q(5, 17,
      "A multi-turn conversation is approaching the context limit as tool outputs accumulate.",
      "Which technique preserves the essential state within budget?",
      [
        "Keep every raw tool output verbatim",
        "Progressive summarization: periodically compress prior turns/tool outputs into concise structured summaries",
        "Delete the system prompt",
        "Randomly drop messages"
      ], 1,
      "Progressive summarization compresses accumulated history into concise summaries, staying within budget while preserving essential state. Keeping everything verbatim (A) exhausts the window, deleting the system prompt (C) loses instructions, and random dropping (D) risks losing critical facts.",
      ["context-management", "summarization", "token-budget", "multi-turn"]),

    q(5, 18,
      "Tool outputs are extremely verbose (huge JSON blobs) and crowd out room for reasoning.",
      "What is the recommended optimization?",
      [
        "Feed the full raw outputs every time",
        "Trim/extract only the relevant fields from verbose tool outputs before adding them to context",
        "Increase temperature",
        "Stop using tools"
      ], 1,
      "Trimming verbose tool outputs to the relevant fields (structured fact extraction) frees context for reasoning while retaining needed data. Full raw outputs (A) waste budget, temperature (C) is unrelated, and abandoning tools (D) loses capability.",
      ["context-management", "tool-output-trimming", "extraction", "token-budget"]),

    q(5, 19,
      "A long-running task must remember intermediate findings across many steps without bloating the conversation.",
      "Which pattern helps?",
      [
        "Keep all findings inline in the conversation",
        "Use a scratchpad file to persist intermediate facts/state, reading back only what's needed",
        "Rely on the model to remember everything",
        "Increase max_tokens indefinitely"
      ], 1,
      "A scratchpad file externalizes intermediate state so the conversation stays lean, with the agent reading back only what it needs. Inlining everything (A) bloats context, trusting memory (C) is unreliable, and max_tokens (D) can't grow without bound.",
      ["context-management", "scratchpad", "state-persistence", "long-running"]),

    q(5, 20,
      "When passing context between agents, you keep the most position-sensitive information where the model attends best.",
      "Which ordering strategy reflects position awareness?",
      [
        "Bury critical facts in the middle of a long block",
        "Place the most important inputs near the beginning or end of the context, where recall is strongest",
        "Randomize order each turn",
        "Always alphabetize inputs"
      ], 1,
      "Because recall is strongest at the start and end, position-aware ordering places critical inputs there. Burying them mid-context (A) invites the lost-in-the-middle effect, and random (C) or alphabetical (D) ordering ignores attention position.",
      ["context-management", "position-aware", "lost-in-the-middle", "ordering"]),

    q(5, 21,
      "You want per-field confidence on extractions so downstream systems can decide what to trust.",
      "Which approach provides trustworthy confidence signals?",
      [
        "Ask the model for a single overall confidence with no calibration",
        "Emit field-level confidence and calibrate it against a labeled validation set",
        "Assume all fields are 100% confident",
        "Use response length as a proxy for confidence"
      ], 1,
      "Field-level confidence calibrated against a labeled validation set yields trustworthy signals for downstream decisions. A single uncalibrated score (A), assuming full confidence (C), or using length as a proxy (D) are unreliable.",
      ["reliability", "confidence-scoring", "calibration", "validation-set"]),

    q(5, 22,
      "To measure your extraction system's true error rate across document types, you plan to sample outputs for human review.",
      "Which sampling approach gives a representative error estimate?",
      [
        "Review only the easiest documents",
        "Use stratified sampling across document types (and fields) to measure error rates representatively",
        "Review a single random document",
        "Only review outputs the model flagged as low confidence"
      ], 1,
      "Stratified sampling across document types (and fields) produces representative error-rate estimates and reveals where accuracy varies. Easy-only (A) or single-document (C) samples bias the estimate, and reviewing only low-confidence flags (D) misses confident-but-wrong errors.",
      ["reliability", "stratified-sampling", "error-rate", "human-review"]),

    q(5, 23,
      "Your human-review workflow needs to decide which extractions get human eyes given limited reviewer time.",
      "How should confidence calibration inform this?",
      [
        "Send everything to humans regardless of confidence",
        "Route low-confidence (well-calibrated) items to human review while auto-accepting high-confidence ones, monitoring accuracy by segment",
        "Send only high-confidence items to humans",
        "Pick items to review at random with no confidence signal"
      ], 1,
      "Calibrated confidence lets you focus scarce human review on low-confidence items while auto-accepting reliable high-confidence ones, with ongoing accuracy monitoring by segment. Reviewing everything (A) wastes effort, reviewing only high-confidence items (C) is backwards, and pure random review (D) ignores useful signal.",
      ["reliability", "human-review", "confidence", "calibration"]),

    q(5, 24,
      "Accuracy differs sharply by document type and by field (e.g., dates vs free-text notes).",
      "What reliability practice does this call for?",
      [
        "Report one global accuracy number",
        "Segment accuracy by document type and field to target improvements where they're needed",
        "Ignore per-field differences",
        "Only track the best-performing field"
      ], 1,
      "Segmenting accuracy by document type and field reveals where the system is weak and guides targeted improvements. A single global number (A), ignoring differences (C), or tracking only the best field (D) hides the problem areas.",
      ["reliability", "accuracy-segmentation", "human-review", "monitoring"]),

    q(5, 25,
      "A cited research report must let readers trace each claim back to its source.",
      "Which practice ensures information provenance?",
      [
        "Summarize sources into one blended paragraph",
        "Maintain explicit claim-to-source mappings so each claim links to the document/URL it came from",
        "Drop sources to keep the report short",
        "Cite only the first source found"
      ], 1,
      "Explicit claim-source mappings preserve provenance so every claim is traceable to its origin. Blending sources (A) loses attribution, dropping sources (C) removes traceability, and citing only the first (D) misrepresents provenance.",
      ["reliability", "provenance", "claim-source-mapping", "citations"]),

    q(5, 26,
      "Your research aggregates data points that are time-sensitive (e.g., 'current CEO', 'latest price').",
      "How should temporal data be handled for reliability?",
      [
        "Ignore dates; treat all facts as timeless",
        "Annotate facts with their temporal context (as-of dates) so consumers know when each fact was valid",
        "Always use the newest-looking value with no date",
        "Delete anything with a date"
      ], 1,
      "Temporal facts should carry as-of dates so consumers understand validity windows. Treating facts as timeless (A), guessing the newest (C), or deleting dated facts (D) all undermine reliability for time-sensitive data.",
      ["reliability", "temporal-data", "provenance", "as-of-dates"]),

    q(5, 27,
      "Two sources give conflicting figures for the same metric.",
      "What is the reliable way to represent this in the output?",
      [
        "Silently pick one and hide the conflict",
        "Annotate the conflict, presenting both values with their sources so downstream consumers can adjudicate",
        "Average the two figures",
        "Drop both figures"
      ], 1,
      "Conflict annotation - surfacing both values with their sources - lets consumers adjudicate rather than trusting a hidden choice. Silently picking (A), averaging (C), or dropping both (D) obscure or distort the underlying disagreement.",
      ["reliability", "conflict-annotation", "provenance", "sources"]),

    q(5, 28,
      "A research report should be honest about what it could NOT find.",
      "Which practice supports this?",
      [
        "Omit any mention of gaps to look complete",
        "Report coverage gaps explicitly so readers know which questions remain unanswered",
        "Fill gaps with plausible guesses",
        "Only report what was found"
      ], 1,
      "Explicit coverage-gap reporting tells readers what remains unanswered, improving trust and guiding follow-up. Hiding gaps (A), filling them with guesses (C), or silently omitting them (D) misrepresent completeness.",
      ["reliability", "coverage-gaps", "provenance", "reporting"]),

    q(5, 29,
      "You resume a long analysis session, but several analyzed files changed since last time.",
      "What is the reliable handling?",
      [
        "Trust the cached tool results as-is",
        "Inform the resumed session which files changed for targeted re-analysis, or start fresh with an injected summary if results are largely stale",
        "Re-explore the entire codebase every time",
        "Ignore the changes"
      ], 1,
      "Reliable resumption tells the session exactly which files changed for targeted re-analysis, or restarts fresh with a summary when prior results are largely stale. Trusting stale caches (A) or ignoring changes (D) causes wrong reasoning, and full re-exploration (C) is wasteful.",
      ["reliability", "session-management", "stale-context", "resume"]),

    q(5, 30,
      "The same session that generated code is asked to self-review and misses defects.",
      "Which reliability principle applies?",
      [
        "Self-review is always as good as independent review",
        "Session context isolation: an independent review instance with fresh context reviews more effectively than the authoring session",
        "Reviews should be skipped for speed",
        "Increase max_tokens to improve review"
      ], 1,
      "An authoring session is biased toward its own output; an independent review instance with fresh context catches more issues. Self-review isn't equivalent (A), skipping review (C) is unsafe, and max_tokens (D) doesn't remove authoring bias.",
      ["reliability", "session-isolation", "independent-review", "context"]),

    q(5, 31,
      "You must decide whether to resume a prior session or start fresh with a structured summary.",
      "When is resumption the better choice?",
      [
        "When prior tool results are largely stale",
        "When prior context is mostly valid and only minor changes occurred, so continuity is worth keeping",
        "Always, regardless of staleness",
        "Never; fresh starts are always better"
      ], 1,
      "Resumption is preferable when prior context is mostly valid with only minor changes, preserving useful continuity. When results are largely stale (A), a fresh summary is safer; and neither 'always resume' (C) nor 'never resume' (D) is correct - it depends on staleness.",
      ["reliability", "session-management", "resume", "fresh-start"]),

    q(5, 32,
      "To calibrate confidence scores, you compare predicted confidence against actual correctness.",
      "What does a well-calibrated model look like?",
      [
        "It reports 100% confidence on everything",
        "Among items it marks ~80% confident, roughly 80% are actually correct",
        "Confidence is random noise",
        "Confidence equals output length"
      ], 1,
      "Calibration means predicted confidence matches empirical accuracy - ~80%-confident items are right ~80% of the time. Uniform 100% confidence (A), random confidence (C), or length-as-confidence (D) are all poorly calibrated.",
      ["reliability", "calibration", "confidence-scoring", "validation-set"]),

    q(5, 33,
      "Your context is filling with long historical tool outputs that are no longer needed for current reasoning.",
      "What is the most effective context-window action?",
      [
        "Keep all history to be safe",
        "Extract and retain only the still-relevant structured facts, dropping or summarizing obsolete verbose outputs",
        "Delete the current user question",
        "Switch to a smaller model"
      ], 1,
      "Retaining only still-relevant structured facts (and summarizing/dropping obsolete verbose outputs) optimizes the context window for current reasoning. Keeping everything (A) exhausts budget, deleting the question (C) breaks the task, and a smaller model (D) doesn't address the bloated context.",
      ["context-management", "extraction", "summarization", "token-budget"]),

    q(5, 34,
      "A pipeline extracts data from thousands of documents and needs a defensible error-rate figure for stakeholders.",
      "Which method produces a defensible estimate efficiently?",
      [
        "Manually review every document",
        "Stratified sampling by document type/field plus human review of the sample to estimate error rates per segment",
        "Trust the model's self-reported accuracy",
        "Review only documents that failed schema validation"
      ], 1,
      "Stratified sampling with human review of the sample yields defensible, segment-level error estimates without reviewing everything. Full manual review (A) doesn't scale, self-reported accuracy (C) is unverified, and reviewing only schema failures (D) misses semantic errors in valid-looking output.",
      ["reliability", "stratified-sampling", "error-rate", "human-review"]),

    q(5, 35,
      "You are designing how a synthesis agent receives search results so it can cite accurately.",
      "Which context-passing format best preserves reliability?",
      [
        "A single prose paragraph blending all findings",
        "A structured format separating each claim's content from its metadata (source URL, title, page) ",
        "Only the raw HTML of each page",
        "Just the search query with no results"
      ], 1,
      "A structured format that keeps each claim linked to its source metadata preserves attribution for accurate citation. A blended paragraph (A) loses provenance, raw HTML (C) is noisy and unstructured, and passing only the query (D) provides no findings.",
      ["reliability", "context-passing", "provenance", "structured-data"]),

    q(5, 36,
      "During a multi-phase task, verbose discovery output threatens to exhaust context before the main work begins.",
      "Which reliability technique isolates the noise?",
      [
        "Do discovery in the main session and hope it fits",
        "Run discovery via an Explore subagent (or context: fork) that returns a concise summary to the main context",
        "Increase max_tokens",
        "Skip discovery entirely"
      ], 1,
      "Isolating verbose discovery in an Explore subagent (or a context: fork skill) returns a concise summary and protects the main context budget. Doing it inline (A) risks exhaustion, max_tokens (C) doesn't isolate intake, and skipping discovery (D) loses needed understanding.",
      ["context-management", "explore-subagent", "context-fork", "discovery"]),

    q(5, 37,
      "You want end-to-end reliability: accurate extraction, honest uncertainty, and traceable claims.",
      "Which combination of practices best achieves this?",
      [
        "Strict schema only, no provenance or confidence",
        "Structured output plus calibrated field-level confidence, claim-source provenance, and stratified human review of a sample",
        "High temperature and long context",
        "Self-reported accuracy with no validation set"
      ], 1,
      "Combining structured output, calibrated field-level confidence, claim-source provenance, and stratified human-review sampling delivers accuracy, honest uncertainty, and traceability. Schema-only (A) lacks confidence/provenance, high temperature/long context (C) doesn't ensure reliability, and unvalidated self-reporting (D) isn't defensible.",
      ["reliability", "confidence-scoring", "provenance", "human-review"]),
]


def main():
    total_added = 0
    for domain, items in NEW.items():
        if not items:
            continue
        path = os.path.join(QDIR, FILES[domain])
        existing = json.load(open(path, encoding="utf-8"))
        by_id = {x["id"]: x for x in existing}
        added = 0
        for it in items:
            if it["id"] in by_id:
                continue
            by_id[it["id"]] = it
            added += 1
        merged = sorted(by_id.values(), key=lambda x: x["id"])
        with open(path, "w", encoding="utf-8") as f:
            json.dump(merged, f, ensure_ascii=False, indent=2)
            f.write("\n")
        total_added += added
        print(f"D{domain} {FILES[domain]}: +{added} -> {len(merged)} total")
    print(f"Added {total_added} new questions.")


if __name__ == "__main__":
    main()
