# SkillUp site framework

Builds the SkillUp learning experience from `ajch_skillup` content, for every exam and skill track in `content/skillup/catalog.json`:

- **Catalog**: all exams and skill tracks, with search, provider filters and per-exam progress
- **Per exam**: three-step setup with a live plan preview, study notes, lessons, topic tests with confidence rating, a skill check, a timed practice exam, case studies and spaced-review prompts
- **Version metadata** on every page: content version, last updated, the skills outline it's aligned to, and a Page info sheet with the source and recent changes

The design follows the SkillUp brand (Indigo Scholar co-brand of AaryaAI). Progress is kept in the learner's browser, per exam.

## Build

```bash
# From ajch_platform, with ajch_skillup checked out next to it
npm run skillup:site                      # → dist/skillup-site/index.html + <exam>/images/
node scripts/skillup-site/build.mjs --content ../ajch_skillup --out dist/skillup-site --inline   # one self-contained file
node scripts/skillup-site/build.mjs --content ../ajch_skillup --out dist/skillup-ai901 --exam ai901
```

| Flag | Meaning |
|---|---|
| `--content` | `ajch_skillup` checkout (default `../ajch_skillup`) |
| `--out` | Output folder (default `dist/skillup-site`) |
| `--inline` | Embed diagrams as `data:` URIs so `index.html` stands alone |
| `--exam` | Comma-separated ids to build (default: every available, non-deprecated entry) |
| `--base` | URL path the site is served from, for example `/skillup/` (adds a `<base>` tag) |

## Production

`.github/workflows/deploy-cloudflare-pages.yml` builds this into `dist/skillup/` on every deploy, from the `ajch_skillup` commit pinned in `content-manifest.json`. Promoting new SkillUp content (`promote-content.yml`) therefore also updates the experience. In the React app, every `/skillup/...` route does a full page load to `/skillup/`, keeping the exam as a deep link (`/skillup/ai901/notes` becomes `/skillup/#ai901`).

No new dependencies: Markdown is rendered with `micromark` and `micromark-extension-gfm`, which the app already has through `react-markdown`/`remark-gfm`.

## Content modes

Each catalog entry is rendered in the best mode its content supports. Upgrading an exam's notes needs **no framework change**; rebuild and it moves up a mode.

| Mode | When | Learner sees |
|---|---|---|
| `lessons` | ≥ 80% of `task-statements.json` tasks have a `## {taskId} {title}` notes section **and** those sections use the lesson shape (`### Real use`, `### Choose when`) | One lesson page per official objective: key idea, diagram, real use, how it works, choose when, quick check, how to do it, exam trap, go deeper |
| `classic` | Older per-domain notes | Domain notes with a section index; tests, the skill check and practice still work per task |
| `track` | `kind: "skill-track"` | Modules as domains, lessons as topics with objectives, `knowledgeCheck` as each lesson's test, `practiceBank` for practice |

## Content contract (read from `ajch_skillup`)

| File | Used for |
|---|---|
| `catalog.json` | Which entries exist; `deprecatedAt` entries are skipped (for example `gh300` is superseded by `ghc`) |
| `{id}/index.json` | Title, code, provider, level, `contentVersion`, `contentUpdatedAt`, `changelog`, exam facts, file lists |
| `{id}/task-statements.json` | Domains, official tasks, `shortTitle` (learner-facing name; generated from the title if missing), `questionIds` per task, `sourceUrl` |
| `{id}/notes/*.md` | Lessons (task-keyed standard, see `.claude/agents/docs-engineer.md`) or classic domain notes |
| `{id}/questions/*.json` | Question bank |
| `{id}/scenarios/*.json` | Case studies; `taskIds` link decisions back to topics |
| `{id}/images/*.svg` | Diagrams referenced from notes |

## Bringing an exam up to the full lesson experience

1. Run `blueprint-gap-analyst` on the exam to get the baseline.
2. Have Curriculum Engineer → Docs Engineer rewrite the notes to the task-keyed standard, with one diagram per task.
3. Add `shortTitle` to each task in `task-statements.json`.
4. Fill question gaps with Assessment Engineer, and add `taskIds` to scenarios with Scenario Engineer.
5. Rebuild. The catalog card shows "New lessons" once the exam qualifies.

AI-901 is the reference implementation of this path.
