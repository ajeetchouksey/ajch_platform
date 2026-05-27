---
name: exam-registry
description: >
  Canonical reference for the registry-driven exam framework. Describes
  the schema for public/content/exams/index.json and the conventions all
  agents must follow when adding or modifying exam content.
---

# Exam Registry Skill

## Purpose

`public/content/exams/index.json` is the **single source of truth** for all exams on the platform. Adding a new exam requires only:
1. Content files in `public/content/questions/`, `notes/`, `scenarios/`
2. One JSON entry in `exams/index.json`
3. **Zero TypeScript changes, zero new routes, zero new page components**

## Registry Schema

```jsonc
{
  "exams": [
    {
      "id": "ccaf",                        // URL slug, e.g. /exams/ccaf
      "title": "Full exam title",
      "shortTitle": "CCA-F",               // Badge label
      "description": "One-line description for catalog card",
      "questions": 68,                     // Total question count
      "duration": "120 min",
      "passScore": "72%",
      "passThreshold": 72,                 // Numeric, used by Quiz.tsx
      "available": true,
      "accentColor": "linear-gradient(90deg,#7c3aed,#a78bfa)",  // CSS gradient for card-accent-top
      "colorScheme": "violet",             // Key into EXAM_SCHEMES in src/types/content.ts
      "domains": [
        {
          "id": 1,                         // Domain number (used in ?d= query param)
          "title": "Domain Title",
          "weight": 27,                    // Exam weight percent
          "color": "bg-violet-500",        // Tailwind class for sidebar dot + weight bar
          "notesFile": "d1-agentic-architecture.md"  // Filename in public/content/notes/
        }
      ],
      "questionFiles": [                   // Filenames in public/content/questions/
        "domain1-agentic.json"
      ],
      "scenarioFiles": [                   // Filenames in public/content/scenarios/
        "customer-support-agent.json"
      ],
      "resources": [                       // External links shown in sidebar
        { "label": "Anthropic Docs", "url": "https://docs.anthropic.com" }
      ]
    }
  ]
}
```

## colorScheme Values

The `colorScheme` field maps to `EXAM_SCHEMES` in `src/types/content.ts`. Currently defined:

| Scheme | Active sidebar class | Resource hover |
|--------|---------------------|----------------|
| `violet` | `bg-violet-500/15 text-violet-200 border-l-2 border-violet-400 pl-2.5` | `hover:text-violet-300` |
| `blue` | `bg-blue-500/15 text-blue-200 border-l-2 border-blue-400 pl-2.5` | `hover:text-blue-300` |

To add a new color scheme, add an entry to `EXAM_SCHEMES` in `src/types/content.ts`.

## File Path Conventions

| Content type | Path pattern |
|---|---|
| Questions | `public/content/questions/{examId}-domain{N}.json` |
| Notes | `public/content/notes/{examId}-d{N}-{slug}.md` |
| Scenarios | `public/content/scenarios/{examId}-{slug}.json` |

CCA-F uses legacy filenames (e.g. `domain1-agentic.json`, `d1-agentic-architecture.md`). New exams use the `{examId}-` prefix convention.

## Adding a New Exam — Checklist

- [ ] Create question files: `public/content/questions/{examId}-domain{N}.json` (one per domain)
- [ ] Create notes files: `public/content/notes/{examId}-d{N}-{slug}.md` (one per domain)
- [ ] Create scenario files: `public/content/scenarios/{examId}-*.json` (optional)
- [ ] Add entry to `public/content/exams/index.json`
- [ ] Verify `available: true` when content is ready to publish
- [ ] **No TypeScript or routing changes needed**

## Loader Functions (src/lib/content-loader.ts)

| Function | What it loads |
|---|---|
| `loadExamRegistry()` | Full registry with caching |
| `loadQuestionsForExam(examId)` | All questions for an exam (all questionFiles) |
| `loadQuestionsByDomainForExam(examId, domain)` | Questions filtered by domain number |
| `loadNoteForExam(examId, domainId)` | Note markdown for one domain |
| `loadScenariosForExam(examId)` | All scenarios for an exam |
