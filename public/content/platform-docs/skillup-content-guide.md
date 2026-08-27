# Creating Skill Up Content

A step-by-step guide to adding exam content — questions, notes, or scenarios — from a draft to it being live at `aaryaai.dev/skillup`. Written for both routes: asking the agent pipeline to do it, or doing it by hand.

## Where the content lives

Skill Up content is **not** in this repo (`ajch_platform`). It lives in its own repo, [`ajeetchouksey/ajch_skillup`](https://github.com/ajeetchouksey/ajch_skillup), pulled in read-only via a version-pinned CDN link (`content-manifest.json`) — the same model Blog, Use Cases, and HOL Labs all use.

```
ajch_skillup/
├── content/skillup/catalog.json          ← auto-generated summary of all exams
└── content/skillup/{examId}/
    ├── index.json                         ← domains, question/note file lists, versioning
    ├── questions/{domain}.json            ← MCQ arrays, one file per domain (or however split)
    ├── notes/{examId}-d{N}-....md         ← study notes per domain
    └── scenarios/{id}.json                ← RichScenario v2.0 JSON
```

This vertical has **three parallel content types with no shared shape**, so it doesn't use the Lead → Writer → Publisher pattern the other verticals do — see below.

## The two ways to add content

### Route A — ask the agent pipeline (recommended)

Address **Curriculum Engineer** directly (or ask Staff Engineer to route a "new exam content" / "add from URL" request). Unlike Blog/Use Cases/HOL Labs' strict 4-role shape, Skill Up uses a **loose 2-role** pipeline — Curriculum Engineer does research and concept extraction itself, then classifies work to whichever specialist owns that content type. There is no separate Publisher; each specialist writes directly to its own directory:

```
User request / Issue Gate
    ↓
Curriculum Engineer   (research + concept extraction, classifies the work)
    ↓
AppSec Engineer        (pre-flight — HARD GATE)
    ↓ PASS ✓
Assessment Engineer → questions/{domain}.json
Docs Engineer        → notes/{examId}-d{N}-....md
Scenario Engineer    → scenarios/{id}.json
    (parallel, whichever specialist(s) the work needs)
    ↓
AppSec Engineer        (post-build audit — HARD GATE)
    ↓ PASS ✓
Curriculum Engineer   (synthesizes result back to user)
```

It won't commit, push, or open the PR — that's step 3 below.

### Route B — write it by hand

**1. Draft the content**, matching the shape for whichever type you're adding:

**Questions** (`content/skillup/{examId}/questions/{domain}.json`, an array):
```json
{
  "domain": 2,
  "id": "kebab-or-namespaced-id",
  "scenario": "context paragraph the question is grounded in",
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "correct": 0,
  "explanation": "why the correct answer is right and the others aren't",
  "tags": ["..."]
}
```

**Notes** (`content/skillup/{examId}/notes/{file}.md`): plain markdown study notes for one domain.

**Scenarios** (`content/skillup/{examId}/scenarios/{id}.json`): RichScenario v2.0 shape — `{ schemaVersion: "2.0", id, title, description, examId, difficulty, estimatedMinutes, domains[], scenario: { background, characters[] }, questions[], keyLearnings[] }`.

**2. Update `content/skillup/{examId}/index.json` — the versioning gate.** This is the part that's easy to miss and specific to this vertical: any change to `questions/**` or `notes/**` requires, in the **same commit**:
- `contentVersion` bumped (patch at minimum) — must match `/^\d+\.\d+\.\d+$/`
- `contentUpdatedAt` set to today's date (`YYYY-MM-DD`)
- A new entry appended to the `changelog` array describing the change
- `palette` still has all five fields (`color`, `bg`, `border`, `glow`, `btn`) and `provider` is non-empty — these don't usually change, but AppSec checks them on every touch of `index.json`

**3. Validate locally**, from the `ajch_skillup` repo root:

```bash
node scripts/validate-content.mjs \
  content/skillup/{examId}/index.json \
  content/skillup/{examId}/questions/*.json
```

This checks MCQ schema (required fields, options length, `correct` index in range, non-empty `tags`), the exam `index.json`'s required fields and file references (broken `notesFile`/`questionFiles` paths fail here), and — if you're touching `task-statements.json` — that every `questionIds` entry actually resolves to a real question. Fix everything it flags; CI runs the same check on your PR.

## 4. Commit, push, open a PR

```bash
git add -A
git commit -m "Add <examId> domain N questions/notes/scenario"
git push -u origin <branch-name>
gh pr create --base main --title "..." --body "..."
```

## 5. Get it approved and merged

`ajch_skillup`'s branch protection requires the `validate` CI check to pass and one approving review (from someone other than the PR author — GitHub doesn't allow self-approval) before `main` accepts the merge. `CODEOWNERS` requires the listed owners specifically on `content/skillup/`, `.claude/`, and governance paths.

## 6. Publish it to the platform

Merging into `ajch_skillup`'s `main` does **not** make it live by itself. From an `ajch_platform`-rooted session:

```bash
git checkout main && git pull
git checkout -b feat/skillup-promote-<short-description>
node scripts/sync-vertical-repo.mjs skillup ajeetchouksey/ajch_skillup <merged-commit-sha>
```

Commit and push that as its own small PR (`chore(skillup): promote <examId> domain N`) — the actual "go live" switch.

## 7. Verify it's actually live

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://cdn.jsdelivr.net/gh/ajeetchouksey/ajch_skillup@<sha>/content/skillup/catalog.json"
```

A `200` confirms jsDelivr has picked up the new commit. Then check `/skillup/{examId}` and the specific quiz/notes/scenario section for the new content.

## Reference

- Full pipeline contract: `.claude/skills/vertical-pipeline/SKILL.md` (in `ajch_platform`) — Shape B (loose 2-role), the one vertical that uses it.
- Agent definitions: `.claude/agents/curriculum-engineer.md`, `assessment-engineer.md`, `docs-engineer.md`, `scenario-engineer.md` (canonical copies in `ajch_platform`, synced into `ajch_skillup` via `node scripts/sync-vertical-agents.mjs skillup <path>`).
- Registry entry: `.claude/vertical-registry.json` → `skillup`.
- `ajch_skillup`'s own `README.md`/`CLAUDE.md` cover the same ground for someone working entirely inside that repo.
