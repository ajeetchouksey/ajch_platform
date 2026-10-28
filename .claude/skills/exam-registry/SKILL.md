---
name: exam-registry
description: >
  Canonical reference for the registry-driven exam framework. Describes
  the schema for content/skillup/{examId}/index.json and content/skillup/catalog.json.
  All agents must follow these conventions when adding or modifying exam content.
---

# Exam Registry Skill

> **SkillUp content moved.** As of 2026-08-20, exam content lives in its own repo, `ajeetchouksey/ajch_skillup` — not `content/skillup/` in this repo anymore. Every `content/skillup/...` path below is relative to that repo, not this one, and the `src/...` references describe `ajch_platform`'s consuming app.

## Purpose

Each exam has its own `index.json` at `content/skillup/{examId}/index.json`.
This is the **single source of truth** for that exam. Adding a new exam requires only:
1. Content files under `content/skillup/{examId}/`
2. One `index.json` entry in that directory
3. An entry in `content/skillup/catalog.json`
4. **Zero TypeScript changes, zero new routes, zero new page components**

## Registry Schema (v3.x)

```jsonc
// content/skillup/{examId}/index.json
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
| Exam index | `content/skillup/{examId}/index.json` |
| Questions | `content/skillup/{examId}/questions/{examId}-domain{N}.json` |
| Notes | `content/skillup/{examId}/notes/d{N}-{slug}.md` |
| Scenarios | `content/skillup/{examId}/scenarios/{examId}-{slug}.json` |
| Task statements | `content/skillup/{examId}/task-statements.json` |

All paths in `questionFiles`, `notesFile`, and `taskStatementsFile` must be full paths
relative to the repo root prefixed with `content/skillup/...` (as in the schema above).

## Adding a New Exam — Checklist

- [ ] Create `content/skillup/{examId}/index.json` with all required fields
- [ ] Create question files: `content/skillup/{examId}/questions/{examId}-domain{N}.json`
- [ ] Create notes files: `content/skillup/{examId}/notes/d{N}-{slug}.md`
- [ ] Create scenarios (optional): `content/skillup/{examId}/scenarios/`
- [ ] Create `task-statements.json` linking task IDs to question IDs
- [ ] Add entry to `content/skillup/catalog.json`
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

## Skill Tracks (`kind: "skill-track"`) — IDEA-0016

Not every topic worth learning has a certification to model against (Azure
AI Foundry, GitHub Copilot mastery, MCP servers — tools, not credentials).
For those, add `"kind": "skill-track"` to the entry instead of the implicit
default. **Every entry without a `kind` field is treated as `"exam"`** —
this is purely additive; none of the existing exam entries need editing.

```jsonc
// content/skillup/{trackId}/index.json — kind: "skill-track"
{
  "schemaVersion": "1.0",
  "kind": "skill-track",
  "contentVersion": "2.0.0",
  "contentUpdatedAt": "2026-09-06",
  "provider": "Microsoft",
  "id": "azure-ai-foundry",
  "title": "Azure AI Foundry Practitioner",
  "shortTitle": "AI Foundry",
  "contentLevel": "201",
  "description": "One-line description for the catalog card.",
  "available": true,
  "accentColor": "#1d4ed8",
  "colorScheme": "blue",
  "palette": { "color": "#60a5fa", "bg": "...", "border": "...", "glow": "...", "btn": "..." },
  "changelog": [{ "version": "2.0.0", "date": "2026-09-06", "type": "major", "summary": "Reshaped from exam to skill track" }],
  "modules": [
    {
      "id": "m1",
      "title": "Module title",
      "taxonomyIds": ["aggregated from this module's lesson content — mirrors DomainConfig.taxonomyIds, drives the cross-vertical relationship engine (IDEA-0008)"],
      "lessons": [
        {
          "id": "m1-l1",
          "title": "Lesson title",
          "objectives": ["What the learner can do after this lesson"],
          "notesFile": "content/skillup/{trackId}/notes/{trackId}-m1-l1-slug.md",
          "holLabId": "an-id-from-ajch_hol_labs — omit if no matching lab exists, never invent one",
          "knowledgeCheck": [
            { "id": "m1-l1-k1", "question": "...", "options": ["...", "...", "...", "..."], "correct": 1, "explanation": "..." }
          ]
        }
      ]
    }
  ],
  "practiceBank": {
    "description": "Opt-in full-length MCQ bank kept from prior exam-shaped content, if any — never fabricate one to fill this in.",
    "questionFiles": ["content/skillup/{trackId}/questions/{trackId}-domain1.json"],
    "questions": 47
  },
  "resources": [{ "label": "Official Docs", "url": "https://..." }]
}
```

**What's deliberately absent, and why**: no `examCode`, `duration`,
`passScore`, `passThreshold`, `examFee` — those imply a real, timed,
gated certification that doesn't exist for a skill track. Their presence
on a `kind: "skill-track"` entry is a defect, not a stylistic choice (this
is the exact mistake `azure-ai-foundry`'s fabricated `"examCode": "AIF-200"`
made before this schema existed).

**`knowledgeCheck` vs. `practiceBank`**: `knowledgeCheck` is light —
3-5 questions per lesson, no timer, no scoring gate, mirrors
`german_skill`'s `Lesson.quiz` field. `practiceBank` is the **legacy
exam-shaped MCQ bank**, kept opt-in for learners who still want
exam-style drilling — retained content, never deleted, but deliberately
nested off the top level so exam-shaped tooling (question-count recount,
`examCode` presence checks) doesn't treat it as this entry's primary
question bank.

**HOL Lab cross-links**: `holLabId` must reference a real, existing lab id
in `ajch_hol_labs`'s `content/hol-labs/index.json` — verify it exists
before writing it; omit the field rather than invent one. A lesson links
to a lab for the hands-on rep; it never duplicates the lab's steps inline.

### Adding a New Skill Track — Checklist

- [ ] Create `content/skillup/{trackId}/index.json` with `kind: "skill-track"` and no exam-only fields
- [ ] Create per-lesson notes: `content/skillup/{trackId}/notes/{trackId}-{moduleId}-{lessonId}-{slug}.md`
- [ ] Verify any `holLabId` referenced actually exists in `ajch_hol_labs`
- [ ] Add entry to `content/skillup/catalog.json` (via `python scripts/generate-catalog.py`, never by hand)
- [ ] Run `node scripts/check-exam-completeness.mjs --exam {trackId}` — it branches on `kind` automatically
- [ ] **No TypeScript or routing changes needed in `ajch_skillup`** — the `ajch_platform` rendering side is a separate, already-scoped change (IDEA-0016's platform-rendering issue)
