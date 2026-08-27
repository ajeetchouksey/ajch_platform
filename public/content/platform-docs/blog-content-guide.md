# Writing a Blog Post

A step-by-step guide to publishing a Field Notes post — from a draft idea to it being live at `aaryaai.dev/blog`. Written for both routes: asking the agent pipeline to do it, or doing it by hand.

## Where the content lives

Blog content is **not** in this repo (`ajch_platform`). It lives in its own repo, [`ajeetchouksey/ajch_aaryaai_blogs`](https://github.com/ajeetchouksey/ajch_aaryaai_blogs), and `ajch_platform` pulls it in read-only via a version-pinned CDN link (`content-manifest.json`) — the same model HOL Labs, Skill Up, and Use Cases all use.

```
ajch_aaryaai_blogs/
└── content/blog/
    ├── index.json      ← manifest: one entry per post (slug, title, tags, dates, ...)
    └── posts/
        └── {slug}.md    ← the post body, plain markdown
```

## The two ways to add a post

### Route A — ask the agent pipeline (recommended)

Address **Content Lead** directly (or ask Staff Engineer to route a "write a blog post about X" request), starting with a GitHub Issue — this vertical's pipeline is issue-gated, unlike some of the others:

```
[GitHub Issue describing the post]
  → Content Lead        (understands intent, checks for existing coverage)
  → Tech Writer          (drafts the markdown, no file writes)
  → AppSec Engineer      (pre-flight: manifest schema, no leaked secrets — HARD GATE)
  → Release Engineer     (writes the .md file + updates index.json)
  → AppSec Engineer      (post-build audit — HARD GATE)
  → Content Lead          (reports back: files written, still needs a commit/push)
```

It won't commit, push, or open the PR — that's step 3 below.

### Route B — write it by hand

**1. Draft the post.** Write plain markdown in `ajch_aaryaai_blogs/content/blog/posts/{slug}.md` — no frontmatter in the file itself; all metadata lives in `index.json` instead.

**2. Add the manifest entry.** In `content/blog/index.json`, append to `posts[]`:

```json
{
  "slug": "your-post-slug",
  "title": "...",
  "excerpt": "1-2 sentence teaser shown on the catalog card",
  "author": "...",
  "authorGitHub": "optional-github-username",
  "date": "YYYY-MM-DD",
  "updated": null,
  "tags": ["..."],
  "category": "...",
  "readingTime": 6,
  "featured": false,
  "draft": false,
  "image": "optional/path/to/cover.jpg"
}
```

Set `"draft": true` if you want the manifest entry to exist without the post appearing live yet — the catalog and RSS/sitemap generation both filter on `draft: false`.

**3. Validate locally**, from the `ajch_aaryaai_blogs` repo root:

```bash
node scripts/validate-content.mjs content/blog/index.json content/blog/posts/*.md
```

This checks JSON validity, that every manifest entry has the required fields, and that `date` is `YYYY-MM-DD` — plus a basic empty-file/frontmatter check on the markdown. Fix everything it flags before moving on; CI runs the same check on your PR.

## 3. Commit, push, open a PR

```bash
git add -A
git commit -m "Add post: <title>"
git push -u origin <branch-name>
gh pr create --base main --title "Add post: <title>" --body "..."
```

## 4. Get it approved and merged

`ajch_aaryaai_blogs`'s branch protection requires the `validate` CI check to pass and at least one approving review before `main` accepts the merge. Its `CODEOWNERS` deliberately does **not** require an owner-specific review for `/content/` changes — the repo is meant to stay contributor-friendly for post content — but the general "1 approval" rule still applies, so someone other than the PR author needs to review it (GitHub doesn't allow self-approval). Governance paths (`.github/`, `scripts/`, `.claude/agents/`) do require the listed owners specifically.

## 5. Publish it to the platform

Merging into `ajch_aaryaai_blogs`'s `main` does **not** make it live by itself — `ajch_platform` only serves content pinned to a specific commit SHA. From an `ajch_platform`-rooted session:

```bash
git checkout main && git pull
git checkout -b feat/blog-promote-<short-description>
node scripts/sync-vertical-repo.mjs blog ajeetchouksey/ajch_aaryaai_blogs <merged-commit-sha>
```

That updates both `content-manifest.json` and `public/content-manifest.json` to the new SHA. Commit and push that as its own small PR (`chore(blog): promote "<post title>"`) — the actual "go live" switch, separate from the content PR itself.

## 6. Verify it's actually live

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://cdn.jsdelivr.net/gh/ajeetchouksey/ajch_aaryaai_blogs@<sha>/content/blog/index.json"
```

A `200` confirms jsDelivr has picked up the new commit. Then check `/blog` for the new card and `/blog/{slug}` for the full post.

## Reference

- Full agent pipeline contract: `.claude/skills/vertical-pipeline/SKILL.md` (in `ajch_platform`) — Shape A (strict 4-role), same pattern Use Cases and HOL Labs use.
- Agent definitions: `.claude/agents/content-lead.md`, `tech-writer.md`, `release-engineer.md` (canonical copies in `ajch_platform`, synced into `ajch_aaryaai_blogs` via `node scripts/sync-vertical-agents.mjs blog <path>`).
- Registry entry: `.claude/vertical-registry.json` → `blog`.
- `ajch_aaryaai_blogs`'s own `README.md`/`CLAUDE.md` cover the same ground for someone working entirely inside that repo.
