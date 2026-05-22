---
name: question-generator
description: >
  Generate exam-quality MCQ questions from analyzed content.
  Produces questions with plausible distractors, detailed explanations,
  and proper domain/tag classification.
---

# Question Generator Skill

## Purpose
Transform analyzed concepts into high-quality exam questions that:
- Test understanding, not memorization
- Have exactly ONE unambiguous correct answer
- Include plausible distractors that test common misconceptions
- Provide educational explanations

## Question Design Patterns

### Pattern 1: "Which approach best..." (Architecture Decision)
```
Scenario: Real-world situation requiring a design choice
Question: "Which approach best [achieves goal]?"
Options: 4 valid-sounding approaches, only 1 is optimal
Correct: The Anthropic-recommended pattern
Explanation: Why correct wins + why each distractor fails
```

### Pattern 2: "What happens when..." (Behavior Prediction)
```
Scenario: Specific technical configuration described
Question: "What happens when [condition]?"
Options: 4 plausible outcomes
Correct: The actual documented behavior
Explanation: Technical reason for the behavior
```

### Pattern 3: "What is the issue with..." (Debugging)
```
Scenario: Code or config with a subtle bug
Question: "What is the primary issue?"
Options: 4 potential issues (only 1 is the real problem)
Correct: The actual root cause
Explanation: How to identify and fix it
```

### Pattern 4: "Which is true/false about..." (Fact Check)
```
Scenario: Context about a feature/concept
Question: "Which statement is TRUE about [concept]?"
Options: 3 common misconceptions + 1 truth (or vice versa)
Correct: The factually accurate statement
Explanation: Reference to documentation/specification
```

## Distractor Engineering

Good distractors are:
- **Plausible** — They sound reasonable to someone who hasn't studied deeply
- **Educational** — Explaining why they're wrong teaches something
- **Common misconceptions** — Things people actually get confused about
- **Related** — From the same domain/topic area

Bad distractors:
- Obviously absurd answers
- Answers from completely unrelated domains
- Answers that are "too long" or "too short" (length bias)
- Answers containing "always" or "never" (test-taking heuristics)

## ID Assignment Rules

Check existing questions to determine next available ID:
- Domain 1: d1-001 through d1-NNN
- Domain 2: d2-001 through d2-NNN
- etc.

Always use the next sequential number after the highest existing ID.

## Tag Taxonomy

Use 2-4 tags per question from this taxonomy:

### Domain 1 Tags
hooks, PreToolUse, PostToolUse, stop-hook, coordinator-subagent, 
agentic-loop, parallel-execution, sequential-execution, 
error-propagation, HITL, human-in-the-loop, checkpointing,
multi-agent, delegation, observability

### Domain 2 Tags
CLAUDE-md, scoped-rules, yaml-frontmatter, skills-vs-tools,
MCP-config, headless-mode, CI-CD, slash-commands, permissions,
hierarchy, settings-json

### Domain 3 Tags
system-prompt, XML-tags, few-shot, extended-thinking,
structured-output, tool-use-output, validation-retry,
multi-pass-review, prompt-injection, JSON-schema,
chain-of-thought, output-config

### Domain 4 Tags
tool-description, 18-tool-limit, tool-choice, parallel-tools,
graceful-failure, MCP-primitives, resources, prompts-primitive,
FastMCP, stdio-transport, tool-parameters, tool-segmentation

### Domain 5 Tags
context-window, lost-in-middle, summarization, prompt-caching,
cache-control, TTL, breakpoints, batches-API, custom-id,
rate-limiting, exponential-backoff, token-budget, escalation

## Validation Checklist

Before outputting a question, verify:
- [ ] Exactly 4 options (no more, no less)
- [ ] `correct` index (0-3) points to the right answer
- [ ] Explanation covers why correct answer wins
- [ ] Explanation mentions why at least 2 distractors fail
- [ ] Scenario is realistic (not contrived)
- [ ] No two options are functionally identical
- [ ] Tags are from the approved taxonomy
- [ ] ID follows sequential pattern
- [ ] Domain number matches the topic
