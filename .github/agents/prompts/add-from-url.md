---
description: >
  Add content from a web URL to the CCA-F study app.
  Fetches the page, analyzes for exam-relevant content,
  checks for duplicates, then generates questions and/or notes.
---

# Add Content from URL

This prompt is handled by **Curriculum Engineer** (Exam Commander).

## Workflow (v2 pipeline)

1. **Curriculum Engineer** fetches URL and extracts CCA-F concepts
2. Deduplicates against existing `public/content/`
3. Routes to sub-agents:
   - MCQs → **Assessment Engineer Agent** (`public/content/questions/`)
   - Notes → **Docs Engineer** (`public/content/notes/`)
4. **AppSec Engineer** validates schemas + file paths (hard gate)
5. Sub-agents write their files on PASS ✓

## Usage

```
@exam-content Add content from: https://docs.anthropic.com/en/docs/...
@exam-content Update D3 notes with info from: [URL]
@exam-content Generate 5 questions from: [URL]
```

## What gets created

| Content type | Written by | Location |
|-------------|-----------|----------|
| MCQ questions | Assessment Engineer | `public/content/questions/d{N}-questions.json` |
| Domain notes | Docs Engineer | `public/content/notes/d{N}-*.md` |

