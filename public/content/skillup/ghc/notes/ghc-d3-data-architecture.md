# Domain 3: Understand GitHub Copilot Data and Architecture

> **Exam Weight:** 13% | **GH-300 GitHub Copilot Certification**

---

## Overview

This domain covers how GitHub Copilot processes data — from the moment a developer types in the IDE to the suggestion appearing on screen — and the fundamental architectural and LLM limitations developers must understand.

---

## 1. Data Flow Architecture

### The Copilot Data Pipeline

```
[Developer IDE]
      |
      | (1) Editor context collected
      v
[Copilot Extension/Plugin]
      |
      | (2) Context assembled into prompt
      v
[GitHub Copilot Proxy (GitHub servers)]
      |
      | (3) Safety filtering applied
      | (4) Prompt sent to LLM
      v
[Large Language Model]
      |
      | (5) Suggestions generated
      v
[GitHub Copilot Proxy]
      |
      | (6) Post-processing (public code filter, safety checks)
      v
[Developer IDE]
      |
      | (7) Suggestions displayed to developer
```

### Step-by-Step Breakdown

**Step 1: Context Collection**
The Copilot extension collects context from the IDE:
- Current file content (before and after cursor)
- Open neighboring tab files
- File language and type information
- Workspace/repository structure (for `@workspace`)
- Chat history (for Copilot Chat)

**Step 2: Prompt Construction**
Context is assembled into a structured prompt sent to the model. The prompt includes:
- System instructions (Copilot behavior guidelines)
- Code context (current file, neighbors)
- User's explicit request (comment or chat message)
- Examples (few-shot, from `copilot-instructions.md`)

**Step 3: Safety Filtering (Pre-processing)**
The GitHub Copilot proxy applies filters before sending to the LLM:
- Content policy checks
- Potentially harmful content detection

**Step 4: LLM Inference**
The assembled prompt is sent to GitHub's hosted LLM (based on GPT-4/Claude technology) for generation.

**Step 5 & 6: Post-processing**
Returned suggestions are filtered:
- **Public code filter**: Suppress suggestions matching public OSS code (when enabled)
- **Safety filters**: Remove potentially harmful suggestions
- **Format cleanup**: Clean up the suggestion for IDE display

**Step 7: Suggestion Display**
The processed suggestion is returned to the IDE as ghost text (inline) or a chat response.

---

## 2. Data Usage and Sharing Policies

### What Data Is Transmitted?

| Data | Transmitted? | Notes |
|------|-------------|-------|
| Code context (current file) | Yes | Used for prompt construction |
| Open neighboring files | Yes | Included as context when relevant |
| Your prompt text | Yes | Sent to model for processing |
| Copilot suggestions | Yes (back to you) | Returned by model |
| Telemetry/usage metrics | Depends on tier | See below |

### Data Retention

- **Prompts and suggestions**: Retained for up to 28 days for safety and abuse monitoring
- **Telemetry data**: Used for service improvement (configurable)

### Copilot Business / Enterprise Data Commitments

| Commitment | Individual | Business | Enterprise |
|-----------|-----------|---------|-----------|
| Code snippets used to train model | Opt-out available | **NEVER** | **NEVER** |
| Prompts retained for training | Opt-out available | **NEVER** | **NEVER** |
| Telemetry collection | Yes (opt-out available) | Limited | Limited |

> **Key Exam Fact:** GitHub Copilot **Business** and **Enterprise** never use customer code snippets (prompts or suggestions) to train or improve Copilot models.

---

## 3. How Context Is Determined

### Neighboring Files (Neighboring Tab Context)

Copilot uses **open editor tabs** as context beyond the current file:

- **Why**: Other open files provide codebase patterns, type definitions, and conventions
- **How**: Content from open tabs is included in the prompt (limited by token window)
- **Best practice**: Open relevant files (interfaces, utilities, examples) before requesting suggestions

### Context Hierarchy

```
1. Current file (highest priority)
   ├─ Before-cursor content
   └─ After-cursor content (post-fill context)

2. Open neighboring tabs
   └─ Most recently interacted files

3. Workspace index (@workspace)
   └─ Semantic search across all indexed files

4. copilot-instructions.md
   └─ Always included in Chat system context

5. Chat history
   └─ Previous messages in current conversation
```

### The Context Window Limit

Every LLM has a maximum **context window** (measured in tokens — roughly 3–4 characters per token). When context exceeds this limit:
- Older or lower-priority content is truncated
- Content exclusions help by removing irrelevant files from consideration
- Focused, specific prompts are more effective than broad ones

---

## 4. Code Suggestion Lifecycle

### Complete Lifecycle of an Inline Suggestion

```
1. Developer types code
   ↓
2. Copilot extension detects pause/trigger
   ↓
3. Context snapshot taken (current file, open tabs)
   ↓
4. Prompt assembled with system instructions + context
   ↓
5. Prompt sent to GitHub Copilot proxy over HTTPS
   ↓
6. Pre-processing filters applied
   ↓
7. Prompt sent to LLM for inference
   ↓
8. LLM generates candidate completions
   ↓
9. Post-processing filters applied (public code filter, etc.)
   ↓
10. Suggestion returned to extension
    ↓
11. Ghost text displayed in IDE
    ↓
12. Developer accepts (Tab) or rejects (Esc)
```

### Latency Factors

- Network latency to GitHub servers
- Model inference time (varies by model complexity)
- Post-processing time
- Extensions and IDE responsiveness

---

## 5. LLM Limitations

### The Fundamental Limitations Every Developer Must Know

**1. Training Data Cutoff**
- LLMs have a knowledge cutoff date — they don't know about events, libraries, or APIs released after training
- **Impact**: Copilot may suggest deprecated APIs, removed functions, or outdated security practices
- **Mitigation**: Verify against current documentation; don't blindly trust library versions suggested

**2. Hallucinations**
- LLMs confidently generate plausible-sounding but incorrect information
- **Examples**:
  - Non-existent API methods (`df.rolling_sum()` that doesn't exist in pandas)
  - Wrong function signatures with incorrect parameter counts or types
  - Made-up library names that don't exist on npm/PyPI
- **Mitigation**: Always verify method existence in official docs before committing

**3. Context Window Constraints**
- Limited context means Copilot may not "see" all relevant code in large files
- May produce suggestions inconsistent with code that exists outside its context window
- **Mitigation**: Keep files focused; open only relevant files; use specific `#file:` references

**4. Probabilistic Output**
- LLMs are fundamentally probabilistic — the same prompt can produce different outputs
- Copilot's suggestions are the statistically most likely continuation, not necessarily the "correct" answer
- **Mitigation**: Validate suggestions with tests; never assume the first suggestion is correct

**5. No Runtime Knowledge**
- Copilot cannot run code or access actual runtime state
- Cannot know your current variable values, database state, or API responses
- **Mitigation**: Provide explicit values and expected behavior in prompts

**6. Potential for Bias**
- Trained on human-written code that may contain biased patterns or non-inclusive conventions
- **Mitigation**: Review generated code for inclusive naming, non-discriminatory logic

---

## Key Exam Traps ⚠️

| Trap | Correct Answer |
|------|---------------|
| "Copilot reads from your filesystem at rest" | No — it reads open editor content and context |
| "Business tier code is used to train models" | **FALSE** — Business/Enterprise never train on customer code |
| "Copilot has real-time internet access" | **FALSE** — training data cutoff applies |
| "Context window is unlimited" | **FALSE** — limited; older content gets truncated |
| "All suggestions are 100% accurate" | **FALSE** — probabilistic; must validate |

---

## Quick Reference

| Concept | Key Fact |
|---------|---------|
| Data retention | Prompts retained up to 28 days for safety |
| Business/Enterprise training | NEVER use customer code for training |
| Context sources | Current file, open tabs, workspace index, instructions.md, chat history |
| Public code filter | Post-processing step; suppresses OSS-matching suggestions |
| LLM hallucinations | Confidently wrong — always verify API usage |
| Training cutoff | May suggest deprecated/removed APIs |
| Context window | Token-limited; large files may have truncated context |
