---
name: vertical-pipeline
description: >
  The canonical Lead → Writer → Security Gate → Publisher content-authoring
  pattern used by every promoted vertical (blog, skillup, usecases). Load
  when authoring or reviewing a vertical Lead/Writer/Publisher agent file,
  or when deciding how a new vertical's pipeline should be shaped.
---

# Vertical Pipeline Pattern

Extracted so the pipeline contract is defined once instead of independently
re-described inside every vertical's Lead/Writer/Publisher agent files (see
the Context Budget Rule in `platform-vocabulary/SKILL.md` — this skill is
that rule applied to the pipeline shape itself). A vertical's own agent
files should state only what's genuinely vertical-specific — schema shape,
content directory, trigger keywords, batch size, voice — and point back
here for the shared contract.

## Path resolution (all shapes, all roles)

Never hardcode a sibling repo's absolute local path in agent prose. Resolve
it at run time:

1. `Read` `.claude/vertical-registry.json` in `ajch_platform`.
2. If invoked from a session rooted in `ajch_platform`: use that vertical's
   `localCheckoutWindows` + `contentRoot` as the write/research target. This
   requires the sibling repo to be reachable as an additional working
   directory in the current session — if it isn't, stop and say so.
3. If invoked from a session already rooted in the vertical repo itself: use
   its own relative `contentRoot` path instead — no cross-repo resolution
   needed.
4. Never target a vertical's `staleLocalPath` (e.g. `public/content/{x}/`
   inside `ajch_platform`) — that path was removed in the vertical-split
   migration and must be BLOCKed by AppSec Engineer if targeted.

## Shape A — Strict 4-role (blog, usecases, hol-labs)

```
User request / Issue Gate
    ↓
Lead — understand intent, gather context, check for existing coverage
    ↓
Writer — researches + drafts content (no file I/O)
    ↓
QA Engineer — validates mermaidDiagram, if present (HARD GATE)
    ↓ PASS ✓ / N/A — no diagram
AppSec Engineer — validates content + planned paths (HARD GATE)
    ↓ PASS ✓
Publisher — writes file(s) + updates the vertical's index/manifest
    ↓
AppSec Engineer — post-build audit (HARD GATE)
    ↓ PASS ✓
Lead — synthesize result back to user
```

The QA Engineer diagram gate applies to usecases (mermaidDiagram is a
required field there — always runs) and hol-labs (optional field — runs
only when the Writer's output includes one). It doesn't apply to blog,
whose diagram checks run through Staff Engineer's own `.md`-file flow
directly in `ajch_platform` rather than through this Lead pipeline. Invoke
QA Engineer via its raw-chart-string mode (pass the `mermaidDiagram` field
value directly) — see `.claude/skills/mermaid-diagram-craft/SKILL.md` for
the standard it's checked against.

## Shape B — Loose 2-role (skillup)

Used when a vertical has multiple parallel content types (MCQs, notes,
scenarios) that don't share one output shape, so one generic "Writer" role
doesn't fit. Each specialist is both writer and publisher for its own
directory — there is no separate Publisher role.

```
User request / Issue Gate
    ↓
Lead — research + concept extraction directly, then classifies work
    ↓
AppSec Engineer — pre-flight (HARD GATE)
    ↓ PASS ✓
Specialist(s) — write directly to their own scoped directory (parallel, if independent)
    ↓
AppSec Engineer — post-build audit (HARD GATE)
    ↓ PASS ✓
Lead — synthesize result back to user
```

## Non-negotiable rules (both shapes)

1. **Only the Publisher (Shape A) or a Specialist (Shape B) ever writes
   files.** Lead and Writer roles never call `Write`/`Edit` — if a Lead or
   Writer's tool grant includes them, that's a bug in the agent file.
2. **The Security Gate is mandatory pre- and post-build, never skippable.**
   `PASS ✓` before any write; `POST-BUILD PASS ✓` after. A Lead that skips
   either step has broken the pipeline, not taken a shortcut.
2a. **Shape A's QA Engineer diagram gate is equally mandatory whenever a
    `mermaidDiagram` field is present** — the same hard-gate discipline as
    the Security Gate, just scoped to diagram content. A Lead that publishes
    an un-validated diagram has broken the pipeline the same way as one that
    skips the Security Gate.
3. **Publisher/Specialist scope is exactly one directory**, per that
   vertical's `contentRoot` in the registry — never wider "while I'm at it."
4. **Adding a new vertical or changing the pipeline shape itself** happens
   in exactly two places: one entry in `.claude/vertical-registry.json`, and
   (if the security checklist needs vertical-specific schema rules) one
   `###` subsection in `appsec-engineer.md`'s "Vertical Schema & Path
   Addenda". Never by editing the generic routing/checklist logic in
   `staff-engineer.md` or `appsec-engineer.md`'s Core sections.
