---
description: >
  Review existing content for accuracy, completeness, and alignment
  with current Anthropic documentation. Flag outdated information.
---

# Audit Existing Content

## Steps

1. Read all question files and notes for the specified domain (or all domains)
2. Check each fact/claim against known Anthropic patterns:
   - API parameter names and signatures
   - Model names and capabilities
   - Feature availability and behavior
   - Recommended patterns and anti-patterns
3. Flag any outdated or incorrect content
4. Suggest specific fixes with file paths and line numbers
5. Run `npm run curator:validate` after any fixes

## Audit Checklist

### API Accuracy
- [ ] Model names are current (claude-sonnet-4-20250514, etc.)
- [ ] Method calls use Messages API (not old Completions)
- [ ] Parameter names match official SDK
- [ ] Response structure matches actual API responses

### Content Quality
- [ ] No factual errors
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
