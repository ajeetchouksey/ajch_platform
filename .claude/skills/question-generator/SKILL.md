---
name: question-generator
description: >
  Generate exam-quality MCQ questions from analyzed content.
  Produces questions with plausible distractors, detailed explanations,
  and proper domain/tag classification.
---

# Assessment Engineer Skill

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
Explanation: See 3-part standard below
```

### Pattern 2: "What happens when..." (Behavior Prediction)
```
Scenario: Specific technical configuration described
Question: "What happens when [condition]?"
Options: 4 plausible outcomes
Correct: The actual documented behavior
Explanation: See 3-part standard below
```

### Pattern 3: "What is the issue with..." (Debugging)
```
Scenario: Code or config with a subtle bug
Question: "What is the primary issue?"
Options: 4 potential issues (only 1 is the real problem)
Correct: The actual root cause
Explanation: See 3-part standard below
```

### Pattern 4: "Which is true/false about..." (Fact Check)
```
Scenario: Context about a feature/concept
Question: "Which statement is TRUE about [concept]?"
Options: 3 common misconceptions + 1 truth (or vice versa)
Correct: The factually accurate statement
Explanation: See 3-part standard below
```

## Explanation Standard (REQUIRED — 3-part skill-building format)

Every explanation must follow this structure. The goal is transferable skill, not answer recognition.
A reader who already knows the correct answer must still learn something from the explanation.

```
**The principle**: [1–2 sentences stating the underlying design or architectural truth this
question tests. Frame it as a universal rule that applies beyond this specific scenario —
not exam language like "Anthropic recommends" but engineering language like "this pattern
exists because...". This is the sentence a practitioner would cite in a design review.]

**Why [correct option] is correct**: [Reasoning tied to the principle above. Explain the
causal chain — not just that it works, but WHY it works and what would happen if it didn't.]

**Why the distractors fail**:
- [Option A]: [Specific failure mode — what breaks in a real system, not just "less reliable"]
- [Option C]: [Same — concrete consequence, not exam-language]
- [Option D]: [Same]

**In practice**: [1–2 sentences connecting this to real engineering decisions. Answer at least
one of: What breaks in production if you get this wrong? What question do senior engineers ask
themselves when facing this choice? When would you choose differently if the requirement shifted?]
```

### Explanation Anti-patterns (reject these)

- Starting with "The correct answer is B because..." — puts exam before understanding
- Distractor explanations that only say "less reliable" or "not recommended" — must state the failure mode
- Missing the **In practice** section — this is what separates skill-building from exam-pointing
- Citing "Anthropic recommends" as the sole justification — always explain the engineering reason behind the recommendation

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

### Distractor rule (no strawmen)

Every wrong option must be an answer a competent practitioner could genuinely pick, wrong for a specific, statable reason (a real misconception, a right tool for a different constraint, or a correct idea applied at the wrong layer or time). Before finalising each question, write one line per distractor: "someone picks this because ___; it fails because ___". Rewrite any distractor where the first blank is empty or silly.

Reject on sight:
- Absurd or self-sabotaging options ("bypass security", "ignore the requirement", "do it manually and hope")
- Absolutes and hedged-away giveaways ("never", "cannot ... at all", "always", "assume")
- An option that merely negates the key
- Options that name a different product category with no plausible link to the scenario

### Uniqueness rule

Within one batch, no two questions may test the same decision with the same answer in different words, and no question may contradict another's guidance. Before writing, list the topics already covered (existing question file plus this batch so far) and pick the next question from an uncovered task statement or an uncovered decision within one.

### Length-bias rule (hard, machine-checked)

The correct option must not be recognisable by its length. Models drift toward writing the right answer as the most complete, most qualified sentence and the wrong ones as terse fragments — a learner can then pass by picking the longest option. Enforced limits:

- **Per question**: the correct option's character length is at most **1.3×** the mean length of the three distractors (and at least 0.7×).
- **Per set**: the correct option is the single longest option in at most **50%** of the questions.

How to comply: give every distractor the same level of specificity and the same kind of qualifying clause as the key (a distractor should name a concrete service, condition or trade-off, not a bare label); trim hedging from the key rather than only padding the distractors; write the options, then compare lengths before finalising. Vary which position holds the key.

Check a draft file with `node scripts/check-option-lengths.mjs <questions.json>` (exits non-zero on violations) before returning it.

## ID Assignment Rules

Check existing questions to determine next available ID:

**Format**: `{examId}-d{domain}-{NNN}` (zero-padded to 3 digits)

Examples:
- CCA-F Domain 2: `ccaf-d2-014`
- AB-100 Domain 3: `ab100-d3-002`

**`domain` is a `number`** — not a string union. Any positive integer is valid.
- Domain 1: {examId}-d1-001 through {examId}-d1-NNN  (e.g. ccaf-d1-001, ab731-d1-015)
- Domain 2: {examId}-d2-001 through {examId}-d2-NNN
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
- [ ] `difficulty` is set to `easy`, `medium`, or `hard` (required on all new questions)
- [ ] Explanation covers why correct answer wins
- [ ] Explanation mentions why at least 2 distractors fail
- [ ] Scenario is realistic (not contrived)
- [ ] No two options are functionally identical
- [ ] Length-bias rule passes (`node scripts/check-option-lengths.mjs <file>`; script lives in `ajch_skillup`)
- [ ] Tags are from the approved taxonomy
- [ ] ID follows sequential pattern: `{examId}-d{N}-{NNN}`
- [ ] Domain number matches the topic
