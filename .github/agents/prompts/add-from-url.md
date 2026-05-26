---
description: >
  Add content from a web URL to the CCA-F study app.
  Fetches the page, analyzes for exam-relevant content,
  checks for duplicates, then generates questions and/or notes.
---

# Add Content from URL

This prompt is handled by **Exam Content Agent** (Exam Commander).

## Workflow (v2 pipeline)

1. **Exam Content Agent** fetches URL and extracts CCA-F concepts
2. Deduplicates against existing `public/content/`
3. Routes to sub-agents:
   - MCQs → **Question Generator Agent** (`public/content/questions/`)
   - Notes → **Study Notes Agent** (`public/content/notes/`)
4. **Security & Governance Agent** validates schemas + file paths (hard gate)
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
| MCQ questions | Question Generator | `public/content/questions/d{N}-questions.json` |
| Domain notes | Study Notes Agent | `public/content/notes/d{N}-*.md` |

