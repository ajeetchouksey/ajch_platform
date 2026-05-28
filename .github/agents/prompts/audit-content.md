---
description: >
  Review existing content for accuracy, completeness, and alignment
  with current Anthropic documentation. Flag outdated information.
---

# Audit Existing Content

This prompt is handled by **Curriculum Engineer** (Exam Commander).

## Workflow (v2)

1. Curriculum Engineer reads all question files and notes for the specified domain
2. Checks facts against known Anthropic patterns (via web/fetch to docs if needed)
3. Flags outdated or incorrect content with file path + line reference
4. Suggests fixes → delegates corrections to:
   - **Assessment Engineer** (for question fixes)
   - **Docs Engineer** (for notes fixes)
5. **AppSec Engineer** validates before any write

## Usage

```
@exam-content Audit all content
@exam-content Audit D3 questions for accuracy
@exam-content Check if model names are current across all notes
```

## Audit Checklist

### API Accuracy
- [ ] Model names are current (`claude-sonnet-4-20250514`, etc.)
- [ ] Method calls use Messages API (not old Completions)
- [ ] Parameter names match official SDK
- [ ] Response structure matches actual API responses

### Content Quality
- [ ] No factual errors or contradictions with official docs
- [ ] No deprecated features presented as current
- [ ] Domain weights still match official exam guide
- [ ] All question IDs follow `d{N}-{NNN}` format

- [ ] Code examples are runnable (not pseudocode)
- [ ] Mermaid diagrams render correctly
- [ ] No broken markdown formatting

### Exam Alignment
- [ ] Questions have exactly one defensible answer
- [ ] Explanations are accurate and complete
- [ ] Domain classification is correct
- [ ] Tags are from approved taxonomy

## Usage

```
@content-curator Audit domain 3 for accuracy
@content-curator Audit all questions for outdated API calls
@content-curator Check notes for deprecated patterns
```
