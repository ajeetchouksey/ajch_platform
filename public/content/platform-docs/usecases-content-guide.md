# Creating Enterprise Use Case Blueprints

A step-by-step guide to publishing a new AI use case — from a draft to it being live at `aaryaai.dev/usecases`. Written for both routes: asking the agent pipeline to do it, or doing it by hand.

## Where the content lives

Use case content is **not** in this repo (`ajch_platform`). It lives in its own repo, [`ajeetchouksey/ajch_ai_usecases`](https://github.com/ajeetchouksey/ajch_ai_usecases), pulled in read-only via a version-pinned CDN link (`content-manifest.json`) — the same model Blog, Skill Up, and HOL Labs all use.

```
ajch_ai_usecases/
└── content/usecases/
    ├── index.json           ← catalog index: verticals, patterns, featuredIds, counts
    ├── _source-intel.json   ← what the live catalog grid (/usecases) actually renders from — see the note below
    └── cases/
        └── {id}.json         ← one full case per file — what /usecases/{id} renders
```

## The two ways to add a case

### Route A — ask the agent pipeline (recommended)

Address **Usecase Lead** directly (or ask Staff Engineer to route a "add a use case for X" request):

```
Usecase Lead
  → Usecase Writer       (researches + drafts the case as JSON, no file writes)
  → AppSec Engineer      (pre-flight — HARD GATE)
  → Usecase Publisher    (writes cases/{id}.json + updates index.json)
  → AppSec Engineer      (post-build audit — HARD GATE)
  → Usecase Lead          (reports back: files written, counts, still needs a commit/push)
```

Usecase Lead works in **small batches only (2-4 cases per run)** — don't ask it to close a large catalog gap in one shot, quality and cross-reference accuracy degrade past that. It won't commit, push, or open the PR — that's step 3 below.

### Route B — write it by hand

**1. Draft the case JSON**, matching the full schema — every field is required:

```json
{
  "id": "kebab-case-slug",
  "title": "...",
  "vertical": "must match an existing verticals[].id in index.json",
  "patterns": ["must match existing patterns[].id values"],
  "problem": "2-4 sentences — the real, quantified pain (time, cost, error rate)",
  "solution": "2-4 sentences — what the agent/system actually does",
  "whoItsFor": "comma-separated roles",
  "workflowSteps": ["ordered, concrete steps — trigger through resolution"],
  "keyInsights": "1-2 sentences — the non-obvious architectural lesson",
  "relatedExams": [{ "exam": "examId", "domain": 2, "why": "..." }],
  "relatedInterviewQs": ["existing q-ids, only if a genuine match exists"],
  "examScenarioPotential": "low | medium | high",
  "blogPotential": "low | medium | high",
  "mermaidDiagram": "flowchart TD ...",
  "architectureNotes": "2-4 sentences on the non-obvious design decisions",
  "relatedUseCases": [{ "id": "existing-case-id", "label": "...", "vertical": "..." }],
  "techStack": [{ "category": "...", "tools": ["..."] }],
  "failureModes": [{ "mode": "...", "mitigation": "..." }],
  "scalingConsiderations": ["..."],
  "integrations": [{ "system": "...", "type": "Read | Write | HITL", "note": "..." }]
}
```

`failureModes` needs at least 2 genuine entries — not padding. `vertical` and `patterns[]` must match existing ids in `index.json`; flag a genuinely new taxonomy entry rather than force-fitting.

**2. Update `index.json`**: increment `totalCount` and the matching `verticals[].count`/`patterns[].count`.

**3. Validate locally**, from the `ajch_ai_usecases` repo root:

```bash
node scripts/validate-content.mjs \
  content/usecases/index.json \
  content/usecases/_source-intel.json \
  content/usecases/cases/*.json
```

This checks JSON validity plus the full case schema (required fields, kebab-case `id`, minimum `failureModes` count). Fix everything it flags; CI runs the same check on your PR.

### ⚠️ Known gap: the catalog grid reads from `_source-intel.json`, not from `cases/`

This is worth knowing before you assume a merged case is fully live. `index.json` and `cases/{id}.json` are what the agent pipeline actually maintains — but `UseCasesCatalog.tsx` (the `/usecases` grid) renders from `_source-intel.json`'s `featuredUseCases[]` + `catalogUseCases[]` arrays, which is a **separately-maintained aggregation file, not auto-generated from `cases/`**. As of this writing `_source-intel.json` is stale (generated 2026-07-24) and several published cases — including ones the agent pipeline itself created — aren't in it, so they're reachable directly at `/usecases/{id}` but don't appear in the catalog grid.

Until this is fixed for real (regenerating `_source-intel.json` from `cases/*.json`, or pointing the catalog page at `index.json`/`cases/` directly), the honest workaround is: also add a lightweight entry to `_source-intel.json`'s `catalogUseCases[]` — `{ id, title, vertical, patterns }` — so your new case shows up in the grid, not just at its direct URL.

## 4. Commit, push, open a PR

```bash
git add -A
git commit -m "Add use case: <title>"
git push -u origin <branch-name>
gh pr create --base main --title "Add use case: <title>" --body "..."
```

## 5. Get it approved and merged

`ajch_ai_usecases`'s branch protection requires the `validate` CI check to pass and one approving review (from someone other than the PR author) before `main` accepts the merge. `CODEOWNERS` requires the listed owners on `content/usecases/`, `.claude/`, and governance paths.

## 6. Publish it to the platform

Merging into `ajch_ai_usecases`'s `main` does **not** make it live by itself. From an `ajch_platform`-rooted session:

```bash
git checkout main && git pull
git checkout -b feat/usecases-promote-<short-description>
node scripts/sync-vertical-repo.mjs usecases ajeetchouksey/ajch_ai_usecases <merged-commit-sha>
```

Commit and push that as its own small PR (`chore(usecases): promote "<case title>"`) — the actual "go live" switch.

## 7. Verify it's actually live

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://cdn.jsdelivr.net/gh/ajeetchouksey/ajch_ai_usecases@<sha>/content/usecases/cases/<id>.json"
```

A `200` confirms jsDelivr has picked up the new commit. Then check `/usecases/{id}` directly, and `/usecases` for the catalog grid — remembering the `_source-intel.json` caveat above if it doesn't show there yet.

## Reference

- Full agent pipeline contract: `.claude/skills/vertical-pipeline/SKILL.md` (in `ajch_platform`) — Shape A (strict 4-role), same pattern Blog and HOL Labs use.
- Agent definitions: `.claude/agents/usecase-lead.md`, `usecase-writer.md`, `usecase-publisher.md` (canonical copies in `ajch_platform`, synced into `ajch_ai_usecases` via `node scripts/sync-vertical-agents.mjs usecases <path>`).
- Registry entry: `.claude/vertical-registry.json` → `usecases`.
- `ajch_ai_usecases`'s own `README.md`/`CLAUDE.md` cover the same ground for someone working entirely inside that repo.
