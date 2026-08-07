---
name: exam-registry
description: >
  Canonical reference for the registry-driven exam framework. Describes
  the schema for public/content/skillup/{examId}/index.json and public/content/skillup/catalog.json.
  All agents must follow these conventions when adding or modifying exam content.
---

# Exam Registry Skill

## Purpose

Each exam has its own `index.json` at `public/content/skillup/{examId}/index.json`.
This is the **single source of truth** for that exam. Adding a new exam requires only:
1. Content files under `public/content/skillup/{examId}/`
2. One `index.json` entry in that directory
3. An entry in `public/content/skillup/catalog.json`
4. **Zero TypeScript changes, zero new routes, zero new page components**

## Registry Schema (v3.x)

```jsonc
// public/content/skillup/{examId}/index.json
{
  "schemaVersion": "2.0",
  "contentVersion": "1.0.0",        // semver — bump on every content write
  "contentUpdatedAt": "2026-08-06", // ISO date of last content change
  "id": "ccaf",                     // URL slug → /skillup/ccaf
  "provider": "Anthropic",          // Certification provider (non-empty string)
  "title": "Full exam title",
  "shortTitle": "CCA-F",
  "description": "One-line description for catalog card",
  "questions": 250,
  "duration": "120 min",
  "passScore": "72%",
  "passThreshold": 72,              // Numeric, used by adaptive-quiz engine
  "available": true,
  "contentTypes": ["mcq", "notes", "scenario"],  // drives ExamHome tab rendering
  "prerequisites": [],              // exam IDs that should be completed first
  "accentColor": "linear-gradient(90deg,#7c3aed,#a78bfa)",
  "colorScheme": "violet",          // key into EXAM_SCHEMES in src/types/content.ts
  "palette": {                      // CSS values — NOT Tailwind classes
    "color": "#7c3aed",
    "bg": "rgba(124,58,237,0.08)",
    "border": "rgba(124,58,237,0.3)",
    "glow": "rgba(124,58,237,0.15)",
    "btn": "bg-violet-800/60 hover:bg-violet-700/70 text-violet-300"
  },
  "changelog": [
    { "version": "1.0.0", "date": "2026-08-06", "type": "major",
      "summary": "Initial release" }
  ],
  "domains": [
    {
      "id": 1,
      "title": "Domain Title",
      "weight": 27,
      "color": "bg-violet-500",
      "notesFile": "content/skillup/ccaf/notes/d1-agentic-architecture.md"
    }
  ],
  "questionFiles": [
    "content/skillup/ccaf/questions/domain1.json"
  ],
  "taskStatementsFile": "content/skillup/ccaf/task-statements.json",
  "resources": [
    { "label": "Official Docs", "url": "https://..." }
  ]
}
```

## colorScheme Values

The `colorScheme` field maps to `EXAM_SCHEMES` in `src/types/content.ts` (Tailwind classes — must stay in TS, never JSON):

| Scheme | Used by |
|--------|--------|
| `violet` | ccaf |
| `blue` | ab100, ab731, ghc |
| `emerald` | ghbp |
| `slate` | gh300 |
| `amber` | (reserved) |

To add a new scheme: add an entry to `EXAM_SCHEMES` in `src/types/content.ts`.

**`palette`** is separate — CSS values in JSON, used for non-Tailwind dynamic styling.

## File Path Conventions (v3.x)

| Content type | Path pattern |
|---|---|
| Exam index | `public/content/skillup/{examId}/index.json` |
| Questions | `public/content/skillup/{examId}/questions/{examId}-domain{N}.json` |
| Notes | `public/content/skillup/{examId}/notes/d{N}-{slug}.md` |
| Scenarios | `public/content/skillup/{examId}/scenarios/{examId}-{slug}.json` |
| Task statements | `public/content/skillup/{examId}/task-statements.json` |

All paths in `questionFiles`, `notesFile`, and `taskStatementsFile` must be full paths
relative to the repo root prefixed with `content/skillup/...` (as in the schema above).

## Adding a New Exam — Checklist

## Adding a New Exam — Checklist

- [ ] Create `public/content/skillup/{examId}/index.json` with all required fields
- [ ] Create question files: `public/content/skillup/{examId}/questions/{examId}-domain{N}.json`
- [ ] Create notes files: `public/content/skillup/{examId}/notes/d{N}-{slug}.md`
- [ ] Create scenarios (optional): `public/content/skillup/{examId}/scenarios/`
- [ ] Create `task-statements.json` linking task IDs to question IDs
- [ ] Add entry to `public/content/skillup/catalog.json`
- [ ] Set `contentVersion: "1.0.0"`, `contentUpdatedAt`, `provider`, `palette`
- [ ] Verify `available: false` until content is ready, then flip to `true`
- [ ] Run `node scripts/content-health-report.mjs` — must exit 0
- [ ] Run `node scripts/domain-content-audit.mjs --exam {examId}` — review output
- [ ] **No TypeScript or routing changes needed**

## Loader Functions (src/lib/content-loader.ts)

| Function | What it loads |
|---|---|
| `loadExamRegistry()` | Full registry with caching |
| `loadQuestionsForExam(examId)` | All questions for an exam (all questionFiles) |
| `loadQuestionsByDomainForExam(examId, domain)` | Questions filtered by domain number |
| `loadNoteForExam(examId, domainId)` | Note markdown for one domain |
| `loadScenariosForExam(examId)` | All scenarios for an exam |
