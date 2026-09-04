---
name: content-standard
description: >
  Platform-level content quality standard for Aarya — My AI Learning Hub.
  Exam-agnostic. Applies to all exams. Governs MCQ questions, study notes,
  and scenarios. All content agents (Assessment Engineer, Docs Engineer,
  Scenario Engineer) must conform to this standard.
---

# Content Standard — Platform Level

## 1. MCQ Question Schema (v3.x)

Every question file must be a JSON array. Each item must satisfy:

```typescript
interface Question {
  domain: number;          // Integer matching a domain.id in this exam's index.json
  id: string;              // Format: "{examId}-d{N}-{NNN}" — unique across ALL files for this exam
  question: string;        // The stem — clear, unambiguous, ≤ 160 chars preferred
  options: string[];       // Exactly 4 options, each starting with a capital letter
  correct: number;         // 0-based index into options[]
  explanation: string;     // 2-5 sentences covering correct answer AND key distractors
  tags: string[];          // 2-4 strings from the tag taxonomy (Section 3)

  // v3.x additions — both are STRONGLY RECOMMENDED on all new questions:
  difficulty: 'easy' | 'medium' | 'hard';   // required on every new question
  scenario?: string;       // 1-4 sentences of realistic context (omit for direct recall Qs)
}
```

### Hard rules (enforced by validate-content.mjs)
- `domain`, `id`, `question`, `options`, `correct`, `explanation`, `tags` are **required**
- `options` must have ≥ 2 entries (4 is the expected standard)
- `correct` must be a valid index into `options`
- `tags` must be a non-empty array of strings
- `difficulty` if present must be `easy`, `medium`, or `hard`
- No two questions in the same exam may share the same `id`

### Difficulty classification guide

| Level  | Criteria |
|--------|----------|
| `easy` | Direct recall of a single documented fact or rule; no reasoning required |
| `medium` | Applies a concept to a scenario; requires understanding, not just recall |
| `hard` | Multi-step reasoning, trade-off analysis, or distinguishing close alternatives |

Target distribution per exam: ≥ 20% easy · ≥ 40% medium · ≥ 20% hard.

### Quality rules (enforced by content-validator skill)
1. Exactly ONE option must be unambiguously correct
2. All three distractors must be plausible to someone with partial knowledge
3. No "all of the above" / "none of the above" options
4. Options must be roughly equal in length (±40%)
5. Explanation must say WHY the correct answer is right AND why each distractor fails

---

## 2. Tag Taxonomy

Tags must come from the controlled vocabulary below. New tags require a PR that
updates this section.

### Category: Content type
`concept`, `scenario-based`, `best-practice`, `anti-pattern`, `troubleshooting`,
`configuration`, `comparison`, `architecture`

### Category: Cognitive level (Bloom's)
`recall`, `comprehension`, `application`, `analysis`, `evaluation`

### Category: Exam relevance
`high-weight`, `exam-trap`, `frequently-tested`, `edge-case`

### Minimum requirement
Every question must have ≥ 1 content-type tag and ≥ 1 cognitive-level tag.

---

## 3. Study Notes Schema

Notes files are markdown. Every notes file must:

```
# D{N}: {Domain Title}
<!-- exam: {examId}, domain: {N}, version: {contentVersion} -->

## Overview
[2-4 sentence summary of the domain]

## Key Concepts
### {Concept Name}
...

## Exam Traps
> **Trap:** [common misconception]
> **Reality:** [what's actually true]

## Quick Reference
[cheat-sheet table or bullet list for last-minute review]
```

### Hard rules
- Must begin with `# D{N}: ...` H1 heading
- Must contain at least one `### Exam Trap ⚠️` callout (H3, singular — this is the actual convention used across every exam in the catalog; not the H2 `## Exam Traps` you might expect)
- Must not be empty (enforced by validate-content.mjs)
- No frontmatter comment is required or expected — no note file in the catalog has ever used one, and it is not enforced by validate-content.mjs

---

## 4. Scenario Schema (RichScenario v2.0)

Scenario files follow the discriminated union defined in `src/types/content.ts`.
Use `"schemaVersion": "2.0"` for all new scenarios. This is the real, current interface —
keep this block in sync with `src/types/content.ts` rather than trusting this doc blindly.

```typescript
interface RichScenario {
  schemaVersion: '2.0';
  id: string;              // Format: "{examId}-scenario-{NNN}"
  title: string;
  description: string;     // 2-4 sentences
  examId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  domains: number[];       // plural — a scenario may span multiple domain ids
  scenario: {
    background: string;
    characters: ScenarioCharacter[];
  };
  questions: ScenarioQuestion[];
  keyLearnings: string[];  // NOT keyTakeaways
}
```

Use `isRichScenario()` type guard (src/types/content.ts) — never duck-type check.

---

## 5. Content Versioning Protocol

Applies to every write that adds or modifies content (questions, notes, scenarios).

1. **Identify** the exam's `contentVersion` in its `index.json`
2. **Bump** the patch version (e.g., `1.0.0` → `1.0.1`) for ≤ 5 question edits;
   bump minor version for new domain coverage or ≥ 6 new questions
3. **Update** `contentUpdatedAt` to today's ISO date (`YYYY-MM-DD`)
4. **Append** a changelog entry:
   ```json
   { "version": "1.0.1", "date": "2026-08-06", "type": "patch",
     "summary": "Added 3 questions to D2; fixed explanation on ccaf-d2-017" }
   ```
5. **Verify** `node scripts/validate-content.mjs <changed-files>` exits 0

---

## 6. Domain Coverage Minimums

The following minimums apply to every exam in the catalog:

| Metric | Minimum |
|--------|---------|
| Questions per domain | ≥ 10 |
| Notes file per domain | Required |
| Difficulty coverage (exam-wide) | ≥ 50% of questions must have `difficulty` set |
| Tag coverage | 100% of questions must have ≥ 1 tag |

Run `node scripts/content-health-report.mjs` after any batch write to verify.

---

## 7. Agent Responsibilities Matrix

| Agent | May write | May read | Gates required |
|-------|-----------|----------|----------------|
| Assessment Engineer | `questions/*.json`, bumps `index.json` | Registry, notes, scenarios | AppSec + Content Gate |
| Docs Engineer | `notes/*.md`, bumps `index.json` | Registry, questions | AppSec + Content Gate |
| Scenario Engineer | `scenarios/*.json`, bumps `index.json` | Registry, questions | AppSec + Content Gate |
| Learning Analytics | Nothing | All content | None (read-only) |
| Performance Analyzer | Nothing | All content | None (read-only) |
| Exam Coach | Nothing | All content | None (read-only) |
