# Agent & Skill Framework

## System

`ajch_platform` runs on **Claude Code's native subagent and Skill system**, defined under `.claude/agents/*.md` (subagents) and `.claude/skills/*/SKILL.md` (skills). This is the single source of truth — there is no other agent-definition system in this repo.

That wasn't always true. Through mid-2026 the repo ran two parallel systems: `.claude/agents/*.md` alongside a **GitHub Copilot**-format `.github/agents/*.agent.md` (distinguishable by its `version`/`last_modified`/`mode: plan` frontmatter and Copilot-specific tool IDs like `edit/editFiles`). They drifted — cross-references inside `.claude/agents/*.md` files pointed at agent names and file paths that only existed on the Copilot side, some correct only on one side or the other. The consolidation onto Claude Code natively (this doc's reason for existing) retired the Copilot format entirely, including the CI gate (`agents-validate.yml`) and release-notes step that were built around its per-file `version:`/`last_modified:` fields — git history is now the source of truth for when a subagent file last changed.

## Terminology

Used precisely and consistently across subagent files, skill files, and docs:

| Term | Meaning | Not this |
|---|---|---|
| **Subagent** | A unit defined in `.claude/agents/*.md`, invoked via the Agent/Task tool — has its own tool permissions, model, and system prompt. | "agent" alone is fine in casual prose, but architecture docs should be precise — this repo has direct evidence of what casual naming costs (the drift above). |
| **Skill** (capital S) | A unit defined in `.claude/skills/*/SKILL.md`, loaded into context only when its `description` matches the current task — not always-resident like a subagent listing. | "prompt template," "playbook" |
| **Frontmatter** | The `---`-delimited YAML block at the top of a subagent or Skill file (`name`, `description`, `tools`, `model`). | "the YAML bit," "config header" |
| **Tool permissions** / **allowed tools** | The `tools:` frontmatter field — what a subagent is allowed to call. | "capabilities," "access list" |
| **System prompt** | The markdown body of a subagent file — becomes that subagent's actual instructions when invoked. | "the instructions," "the body" |
| **Orchestrator** / **dispatcher** | The architectural pattern `staff-engineer` implements: a central subagent that classifies intent and delegates to specialists. This is a standard, named multi-agent pattern — **orchestrator-worker**. | "commander," "controller" as the *pattern* name — individual subagents can keep stylistic display names (e.g. "Blog Commander") without that becoming the term for the pattern itself. |
| **Vertical** | A distinct content area of the platform (blog, skillup, usecases, interviews, pathways, tools). Deliberately *not* renamed to "domain" — `domain` already means something else and unrelated in this codebase (exam domains: `domainId`, `DomainReadiness`, "Domain 1: Plan AI-Powered Business Solutions"). Reusing it for verticals would collide, not clarify. | "domain" (in this context) |

## Where things live

- **Subagents**: `.claude/agents/*.md` — one file per subagent, frontmatter + system prompt.
- **Skills**: `.claude/skills/*/SKILL.md` — loaded on demand by description match, not always resident.
- **Orchestrator**: `.claude/agents/staff-engineer.md` — routing tables + Decision Logic. Large, situational multi-step procedures (e.g. MVP Weekly Analysis, Tooling Radar) are extracted into their own Skills rather than embedded in the orchestrator's always-loaded body — see `.claude/skills/mvp-weekly-analysis/` and `.claude/skills/tooling-radar/` for the pattern.
- **Vertical-agent sync policy**: unchanged in spirit from `docs/content-architecture.md` — canonical subagent/validator definitions live centrally in this repo and are mirrored into promoted vertical repos via `scripts/sync-vertical-repo.mjs`, never edited independently there.

## Model tiering

Every subagent defaulted to `model: inherit` (whatever model the parent session uses) until this pass. Mechanical, narrow-scope subagents are now pinned to a cheaper model instead:

| Subagent | Model | Why |
|---|---|---|
| `sre` | `claude-haiku-4-5-20251001` | Routine git/CI/CHANGELOG ops — mechanical, not reasoning-heavy. |
| `qa-engineer` | `claude-haiku-4-5-20251001` | Pattern-matches Mermaid syntax against fixed rules. |
| `platform-engineer` | `claude-haiku-4-5-20251001` | Edits exactly two files (`App.tsx` routes, `Layout.tsx` nav). |
| `release-engineer` | `claude-haiku-4-5-20251001` | Writes pre-validated markdown to disk; no editorial judgment. |

Reasoning-heavy subagents (`staff-engineer`, `principal-mentor`, `platform-architect`, `curriculum-engineer`, `product-manager`, and the rest) stay on `model: inherit`.

## Deprecated

- `pair-programmer.md` — superseded by `principal-mentor` (teaching) + `junior-dev` (student simulation). Kept only so a direct invocation by name still resolves to something; `staff-engineer` does not route to it.
