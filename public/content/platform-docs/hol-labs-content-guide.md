# Creating HOL Labs Content

A step-by-step guide to adding a new HOL Lab — from a blank idea to it being live at `aaryaai.dev/hol-labs`. Written for both routes: asking the agent pipeline to do it, or doing it by hand.

## Where the content lives

HOL Labs content is **not** in this repo (`ajch_platform`). It lives in its own repo, [`ajeetchouksey/ajch_hol_labs`](https://github.com/ajeetchouksey/ajch_hol_labs), and `ajch_platform` pulls it in read-only via a version-pinned CDN link (`content-manifest.json`). This is the same model already used for Blog, Skill Up, and Use Cases — content is versioned and reviewable in its own repo before it ever reaches the live site.

```
ajch_hol_labs/
└── content/hol-labs/
    ├── index.json          ← catalog: domains, per-lab summaries, featuredIds
    └── labs/
        └── {id}.json        ← one full lab per file
```

## The two ways to add a lab

### Route A — ask the agent pipeline (recommended)

Address **HOL Lab Lead** directly (or ask Staff Engineer to route a "create a hands-on lab for X" request), from a session that has `ajch_hol_labs` checked out as an additional working directory alongside `ajch_platform`. It orchestrates the whole authoring chain for you:

```
HOL Lab Lead
  → HOL Lab Writer      (researches + drafts the lab as JSON, no file writes)
  → AppSec Engineer     (pre-flight: schema, cost-tier, no leaked credentials — HARD GATE)
  → HOL Lab Publisher    (writes the lab file + updates index.json)
  → AppSec Engineer     (post-build audit — HARD GATE)
  → HOL Lab Lead         (reports back: files written, counts, still needs a commit/push)
```

Give it a topic and — if you have one in mind — the real problem/use case it should solve; it will refuse to author a lab with no grounded problem behind it rather than invent one. It won't commit, push, or open the PR — that's step 4 below.

### Route B — write it by hand

Useful for a first draft you want full control over, or when adapting the steps below manually.

**1. Draft the lab JSON.** Copy an existing file under `ajch_hol_labs/content/hol-labs/labs/` as your template and fill in every field — nothing should be left as `"..."`. The schema:

```json
{
  "id": "kebab-case-slug",
  "schema": "hol-lab@1",
  "title": "...",
  "tagline": "one short, punchy sentence for the catalog card",
  "domain": "azure-ai-foundry | github-copilot | agentic-ai | ai-architecture | ai-engineering",
  "difficulty": "beginner | intermediate | advanced",
  "estimatedMinutes": 45,
  "problemStatement": "the real, grounded problem this lab solves — never invented",
  "approachRationale": "why this specific tool/approach, naming a real alternative you rejected",
  "prerequisites": ["exact, checkable items — not \"basic Azure knowledge\""],
  "learningObjectives": ["verb + concrete outcome, 3-5 bullets"],
  "steps": [
    {
      "order": 1,
      "title": "...",
      "instructions": "second-person imperative",
      "whyItMatters": "the underlying trade-off this step teaches — required on every step",
      "code": { "language": "...", "snippet": "real, runnable — no pseudocode" },
      "expectedResult": "a specific, checkable outcome"
    }
  ],
  "conceptChecks": [{ "afterStep": 3, "question": "tests applied reasoning, not recall", "answer": "..." }],
  "validationChecklist": ["3-6 yes/no checks, independent of the step-by-step"],
  "cleanup": ["one teardown line per billable resource created in the steps"],
  "costEstimate": { "tier": "free | low-cost | paid", "monthlyEstimateUSD": 0, "freeTierNotes": "..." },
  "relatedExams": [{ "exam": "examId", "domain": 2, "why": "..." }],
  "relatedBlogPosts": [{ "slug": "...", "why": "..." }],
  "relatedUseCases": [{ "id": "...", "vertical": "...", "why": "..." }],
  "relatedLabs": [{ "id": "...", "relation": "prerequisite | next | alternative", "why": "..." }],
  "tags": ["..."],
  "publishedDate": "YYYY-MM-DD",
  "updatedDate": "YYYY-MM-DD"
}
```

Two rules that matter more than the schema itself: **every step needs a real `whyItMatters`** (a lab that's just click-here-click-there fails the whole point of this vertical), and **every cross-link must be genuine** — check the target actually exists (grep the skillup catalog, blog index, usecases index, or this repo's own `index.json`) before writing it. An honestly empty `relatedX` array beats a fabricated link every time.

**2. Update `index.json`.** Three things, every time you add a lab:
- Increment `totalCount` and the matching `domains[].count`.
- Append a `HolLabSummary` entry to `labs[]` — `{ id, title, tagline, domain, difficulty, estimatedMinutes, costTier, tags, relatedExamIds, relatedUseCaseIds, relatedBlogSlugs, relatedLabIds }`. The four `relatedXIds` arrays are **flattened copies** of the full lab's relation arrays (just the ids/slugs, no `why` text) — this is what lets the platform show "Related Lab" links on exam/use-case/blog pages without fetching every lab file. Keep it in sync with the full lab's relations or the reverse-link feature silently goes stale.
- If this lab relates to an earlier lab, update *that* lab's file too, adding the reverse `relatedLabs` entry (e.g. lab A says `"relation": "next"` pointing at lab B; lab B says `"relation": "prerequisite"` pointing back at lab A) — cross-links between labs should go both directions, not just forward.

**3. Validate locally**, from the `ajch_hol_labs` repo root:

```bash
node scripts/validate-content.mjs content/hol-labs/index.json content/hol-labs/labs/*.json
```

This checks JSON validity, the full lab schema, kebab-case ids, that every step has a non-empty `whyItMatters`, and that `costEstimate.tier` is one of `free|low-cost|paid`. Fix everything it flags before moving on — this is the same check CI runs on your PR.

## 4. Commit, push, open a PR

```bash
git add -A
git commit -m "Add lab: <title>"
git push -u origin <branch-name>
gh pr create --base main --title "Add lab: <title>" --body "..."
```

CI (`.github/workflows/validate-content.yml`) runs the same validator automatically on the PR.

## 5. Get it approved and merged

`ajch_hol_labs` currently has no branch-protection rule — a green CI check is enough for the PR to be mergeable, no required review is enforced. That doesn't mean skip review: give a lab dealing with anything safety-sensitive (like a Content Safety or Responsible AI lab) an actual read before merging, the same way you would in any repo — the missing "Approve" requirement is a repo-config gap, not a signal that review doesn't matter. Merge it (`gh pr merge --merge --delete-branch`, or the button in GitHub's UI) once you're satisfied.

## 6. Publish it to the platform

Merging into `ajch_hol_labs`'s `main` does **not** make it live by itself — `ajch_platform` only serves content pinned to a specific commit SHA in `content-manifest.json`. From an `ajch_platform`-rooted session:

```bash
git checkout main && git pull
git checkout -b feat/hol-labs-promote-<short-description>
node scripts/sync-vertical-repo.mjs hol-labs ajeetchouksey/ajch_hol_labs <merged-commit-sha>
```

That updates both `content-manifest.json` and `public/content-manifest.json` to the new SHA. Commit and push that as its own small PR (`chore(hol-labs): promote <lab title>`) — this is a separate, lighter-weight PR from the content PR itself, and it's the actual "go live" switch.

**Optional but recommended**: bump `public/content/mvp-progress.json`'s `current.holLabs` to match the new total lab count, so the MVP dashboard stays accurate.

## 7. Verify it's actually live

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://cdn.jsdelivr.net/gh/ajeetchouksey/ajch_hol_labs@<sha>/content/hol-labs/labs/<id>.json"
```

A `200` confirms jsDelivr has picked up the new commit. Then check the live site: `/hol-labs` should show the new card, and `/hol-labs/<id>` should render the full lab. If you promoted a related lab, click through its cross-links to confirm nothing 404s.

## Reference

- Full agent pipeline contract: `.claude/skills/vertical-pipeline/SKILL.md` (in `ajch_platform`) — Shape A (strict 4-role), same pattern Blog and Use Cases use.
- Agent definitions: `.claude/agents/hol-lab-lead.md`, `hol-lab-writer.md`, `hol-lab-publisher.md` (canonical copies in `ajch_platform`, synced into `ajch_hol_labs` via `node scripts/sync-vertical-agents.mjs hol-labs <path>` — don't hand-edit the copies in `ajch_hol_labs`, they get overwritten on the next sync).
- Registry entry: `.claude/vertical-registry.json` → `hol-labs` (repo, checkout path, agent roles, pipeline shape).
- `ajch_hol_labs`'s own `README.md` and `CLAUDE.md` cover the same ground for someone working entirely inside that repo with no `ajch_platform` checkout alongside it.
