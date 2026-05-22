---
description: >
  Add content from a web URL to the CCA-F study app.
  Fetches the page, analyzes for exam-relevant content,
  checks for duplicates, then generates questions and/or notes.
---

# Add Content from URL

## Steps

1. Fetch the provided URL and extract the main content
2. Run content analysis to identify CCA-F relevant concepts
3. For each concept, search existing content for duplicates:
   - `grep_search` in `public/content/questions/` for the concept keywords
   - `grep_search` in `public/content/notes/` for the concept keywords
4. For NEW concepts (not already covered):
   - Classify into Domain 1-5
   - Determine action: add_question, update_note, or both
5. Generate content following exact schemas
6. Run `npm run curator:validate` to verify
7. Report what was added/updated

## Usage

```
@content-curator Add content from: https://docs.anthropic.com/en/docs/...
@content-curator Update D3 notes with info from: [URL]
@content-curator Generate 5 questions from: [URL]
```
