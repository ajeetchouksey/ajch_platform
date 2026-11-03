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

Rule: pay for the strongest model only where an error is expensive to detect later, or where one run steers many downstream runs. Everything mechanical goes to the cheapest tier.

| Subagent | Model | Why |
|---|---|---|
| `curriculum-engineer` | `claude-opus-5-5` | Orchestrator: research, concept extraction, delegation. Low volume, high leverage; a bad plan poisons every sub-agent. |
| `assessment-engineer` | `claude-sonnet-5-5` | MCQ generation (largest volume); needs correct keys and plausible distractors. |
| `docs-engineer`, `skill-track-engineer` | `claude-sonnet-5-5` | Long-form structured writing. |
| `scenario-engineer` | `claude-sonnet-5-5` | Structured multi-step JSON, schema-validated afterwards. |
| `blueprint-gap-analyst`, `learning-experience-designer` | `claude-sonnet-5-5` | Read-only judgment over coverage / flows. |
| `appsec-engineer` | `claude-sonnet-5-5` | PASS/BLOCK gate; a false PASS is costly, do not downgrade. |
| `learning-analytics` | `claude-haiku-5-5` | Aggregation and formatting of data. |
| `exam-coach` | `claude-haiku-5-5` | Serves and scores pre-authored questions. |
| `sre`, `qa-engineer`, `platform-engineer`, `release-engineer`, `hol-lab-publisher`, `usecase-publisher` | `claude-haiku-5-5` | Mechanical git/CI, rule-matching, two-file edits, writing pre-validated content. |

**Pilot evidence (2026-11-03, `assessment-engineer`, AB-100 Domain 1, 20 questions per run, blind Opus judge, 1-5 scores):**

| Run | Key | Distractors | Blueprint | No giveaways |
|---|---|---|---|---|
| Opus 5.5 | 4.95 | 3.75–3.80 | 4.50–4.75 | 3.95–4.00 |
| Sonnet 5.5, unmodified skill | 4.90 | 2.45 | 4.65 | 1.95 |
| Haiku 5.5, unmodified skill | 4.95 | 2.75 | 4.50 | 2.00 |
| Sonnet 5.5, + length / distractor / uniqueness rules | 4.85 | 3.50 | 4.80 | 4.70 |

Out of the box, Sonnet and Haiku both wrote the correct option longest (Sonnet 20/20, mean 2.1x the distractors) and used strawman distractors. The rules added to `question-generator` (length-bias, distractor, uniqueness) plus the checker `ajch_skillup/scripts/check-option-lengths.mjs` closed most of the gap, which is why `assessment-engineer` stays on Sonnet. Single domain, one run per condition, same-family judge: re-pilot on another exam before treating this as settled. Haiku-tier (`learning-analytics`, `exam-coach`) and the other Sonnet-tier agents are not yet piloted.

Move an agent up a tier if it regresses.

Other subagents (`staff-engineer`, `principal-mentor`, `platform-architect`, `product-manager`, and the rest) stay on `model: inherit`.

## Deprecated

- `pair-programmer.md` — superseded by `principal-mentor` (teaching) + `junior-dev` (student simulation). Kept only so a direct invocation by name still resolves to something; `staff-engineer` does not route to it.
