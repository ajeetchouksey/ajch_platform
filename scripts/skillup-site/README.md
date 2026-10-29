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
| `--embed` | Write `skillup-data.js`, `skillup-app.js` and `skillup.css` for the in-site host page instead of `index.html` |
| `--asset-base` | URL prefix for diagrams and exam files with `--embed`, for example `/skillup-assets/`. Also splits the data into one file per exam |
| `--base` | URL path a standalone build is served from (adds a `<base>` tag) |

## Production: SkillUp inside the AaryaAI site

SkillUp runs at `/skillup` inside the site layout (header, navigation, footer, AaryaAI theme):

- `.github/workflows/deploy-cloudflare-pages.yml` checks out `ajch_skillup` at the commit pinned in `content-manifest.json` and runs `build.mjs --embed --asset-base /skillup-assets/` into `dist/skillup-assets/`. Promoting content (`promote-content.yml`) therefore also updates SkillUp.
- `--embed` writes `skillup-data.js`, `skillup-app.js` and `skillup.css`. With `--asset-base`, `skillup-data.js` holds only the catalog (about 5 KB), and each exam's data goes to `exams/<id>.js` (about 200–730 KB each). Each catalog entry's `src` carries a content hash (`?v=…`), so a changed exam is never served from cache. The runtime fetches an exam's file the first time the learner opens it, or as soon as they point at or focus its card. It shows a shimmer while the file loads, and if the download fails it returns to the catalog with a message. The CSS is `styles.css` scoped to `.skillup-host` plus `aaryaai-theme.css` (the site's dark tokens), so nothing leaks into the rest of the site.
- `src/features/skillup/SkillUpHost.tsx` loads those files once and calls `SkillUpApp.start(host, { embedded, scroller, exam, onRoute })`. The URL follows the open exam (`/skillup/ai901`).
- For local development, run `npm run skillup:dev` (writes `public/skillup-assets/`, which is git-ignored), then `npm run dev`.

Without `--embed`, the build still produces a standalone `index.html`, used for previews.

## Colour code

`colour-code.json` is the only place a SkillUp hue is defined: six domain colours, the four lesson parts, the answer states, the five mastery levels, provider colours, and the diagram node kinds. `build.mjs --embed` validates it and writes it as custom properties (`--d1`…`--d6`, `--k-key`, `--ok`, `--m1`…, `--pv-microsoft`…) ahead of `aaryaai-theme.css`, which only refers to the variables. `ajch_skillup/scripts/build-svg-diagrams.py` mirrors the `diagram` block, so diagrams use the same colours. The rules for using them (only indigo is clickable, colour always paired with an icon and a word, mastery never red) are in `.claude/skills/learner-experience-standard/SKILL.md` under Visual Language. To change a colour, edit the JSON, rebuild, and regenerate the diagrams if you changed the `diagram` block.

Where the colours show: exam cards take their provider colour; the exam home tiles take a lesson-part colour (notes = key idea, practice = choose when, case studies = real use); topic numbers, case-study stripes and topic chips take their domain colour; status pills and Today's session ticks use the answer states.

## Live feel

The exam home shows **Today's session**: up to three tasks (read the next topic, test it, then review the pile, or refresh one flagged topic when nothing is due) fixed for the day and stored with the learner's progress. A task is ticked only when the learner actually does it, and each tick confirms with a toast. Readiness rings fill from the last value the learner saw and count up; result rings count up from zero. Answers pop or shake, and lists arrive in sequence. All motion is off under `prefers-reduced-motion`. Nothing shows invented activity (no "N learners online"). While the assets load, `SkillUpHost.tsx` shows a placeholder shaped like the catalog.

## Review pile and streak

Every question the learner misses or guesses goes into that exam's **review pile** (`rq` in its stored state), due the next day. A confident right answer moves it on to 4 days, then 10, then out of the pile; a miss or a guess starts it again tomorrow. Practice exams add their wrong answers. A review session takes up to 10 due questions, and result pages state what really comes back and when. The pile uses the Flagged state (★, lilac).

Any study (opening a lesson, answering a question) marks the day in `skillup:days`, which all exams share. The exam home shows the current week, with studied days filled on the mastery ramp and today pulsing until the learner studies, plus the streak length. After three or more days away, a "Welcome back" note promises a lighter day; nothing piles up and nothing is shown as lost. Dates are local calendar days, so the day turns over at the learner's midnight.

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
