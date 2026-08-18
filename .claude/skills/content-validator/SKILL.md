---
name: content-validator
description: >
  Validate generated content for schema compliance, Anthropic alignment,
  and quality standards before committing to the repository.
  NOTE: This skill handles content quality. Security validation (OWASP, path
  traversal, secrets) is handled separately by AppSec Engineer.
---

# Content Validator Skill

## Role in v2 Pipeline

This skill handles **content quality and accuracy** — it is separate from and runs alongside the AppSec Engineer:

| Gate | Handles | Agent |
|------|---------|-------|
| Security Gate | Path traversal, secrets, OWASP, XSS, dependency gate | AppSec Engineer |
| Content Gate (this skill) | Schema compliance, Anthropic alignment, question quality | content-validator skill |

Both gates must pass before content is written to disk.

## Question Validation

### Schema Compliance (v3.x — exam-agnostic)
```typescript
interface Question {
  domain: number;              // Must match a domain.id in this exam's index.json
  id: string;                  // Format: "{examId}-d{N}-{NNN}" — unique across all files for this exam
  scenario?: string;           // Optional: 1-4 sentences of context (omit for direct recall Qs)
  question: string;            // Clear, unambiguous stem
  options: [string, string, string, string];  // Exactly 4, similar length
  correct: 0 | 1 | 2 | 3;    // Index into options array
  explanation: string;         // 2-5 sentences, 3-part skill-building format
  tags: string[];              // 2-4 non-empty strings from the tag taxonomy
  difficulty?: 'easy' | 'medium' | 'hard';   // REQUIRED on all new questions
}
```

### Quality Checks
1. **No duplicate IDs** — Check against all existing question files
2. **Answer uniqueness** — Only one option should be defensibly correct
3. **Distractor plausibility** — Each wrong answer should be believable
4. **Length balance** — Options should be similar length (±30%)
5. **No "all of the above"** — These are prohibited
6. **No trick questions** — Test knowledge, not reading comprehension
7. **Explanation completeness** — Must address correct AND wrong answers

### Anthropic Alignment Checks (CCA-F specific)
> These checks apply to CCA-F (`ccaf`) content only. For other exams, apply the
> equivalent accuracy checks against that exam's official documentation.
1. **API accuracy** — Parameter names, method signatures must be real
2. **Feature existence** — Don't reference features that don't exist
3. **Behavioral accuracy** — Model behavior claims must match docs
4. **Version awareness** — Use current API (Messages API, not old Completions)
5. **Naming accuracy** — "claude-sonnet-4-20250514" not "claude-2" or invented names

## Notes Validation

### Structure Checks
1. **Heading hierarchy** — H1 (domain title) → H2 (topics) → H3 (subtopics)
2. **Mermaid syntax** — Diagrams must be valid mermaid (graph TD/LR, sequenceDiagram, etc.)
3. **Code block language** — All code blocks must have language annotation
4. **Table formatting** — All tables must have header row + separator

### Content Checks
1. **No hallucinated APIs** — Every API call shown must be real
2. **Correct parameter names** — match official Anthropic docs
3. **Accurate behavior descriptions** — verified against documentation
4. **Exam relevance** — content should map to a likely exam question

## Common Mistakes to Catch

| Mistake | Example | Fix |
|---------|---------|-----|
| Old API | `client.complete()` | Use `client.messages.create()` |
| Wrong model name | `claude-3-opus` | Use `claude-sonnet-4-20250514` |
| Invented parameter | `thinking_mode: true` | Use `thinking: {"type": "enabled", "budget_tokens": N}` |
| Wrong cache syntax | `cache: true` | Use `cache_control: {"type": "ephemeral"}` |
| Wrong tool_choice | `tool_choice: "forced"` | Use `tool_choice: {"type": "tool", "name": "X"}` |
| Non-existent hook | `PreMessage hook` | Only: PreToolUse, PostToolUse, Stop |
| Wrong YAML key | `glob:` or `scope:` | Only `path:` in scoped rules |

## Validation Output Format

```json
{
  "valid": true/false,
  "errors": [
    {"field": "options[2]", "issue": "Nearly identical to options[0]", "severity": "error"},
    {"field": "explanation", "issue": "Doesn't explain why option C is wrong", "severity": "warning"}
  ],
  "suggestions": [
    "Consider adding a mermaid diagram to illustrate the flow",
    "The scenario could be more specific (add concrete numbers)"
  ]
}
```
