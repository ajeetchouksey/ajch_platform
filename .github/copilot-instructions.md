# Copilot Instructions — Aarya, My AI Learning Hub

This repo is part of the Aarya — My AI Learning Hub platform: a Vite +
React 19 (TypeScript strict) SPA with no server-side rendering, called
`ajch_platform`, that renders content promoted from sibling content repos
(blog, skillup, usecases, hol-labs — each pinned to a commit SHA in
`ajch_platform`'s `content-manifest.json` and fetched from jsDelivr at
build/runtime). If you're reading this inside one of those content repos,
this file is a synced copy — the canonical source lives in `ajch_platform`.

Content authoring across the whole platform is maintained by a 24-agent
Claude Code system defined in `.claude/agents/*.md`, with shared standards
packaged as `.claude/skills/*/SKILL.md`. Every repo in this family carries
the subset of those agent/skill files relevant to the content it holds.
When editing here, match the conventions those files already establish
rather than introducing a parallel style.

## This app never runs inside an "Artifact" viewer

If you're familiar with Claude's Artifact tool and its runtime capability
API (`window.claude.use("db"|"room"|"mcp"|"sample"|"downloads"|"artifact")`),
none of that applies here. No page in this app is ever published or
rendered through that mechanism — blog posts, study notes, use cases, and
HOL labs are plain static content rendered by this app's own React
components. Don't suggest `window.claude.use(...)` or any Artifact-runtime
pattern for content pages; there is no call site it could ever reach.

## Diagrams — Mermaid, not hand-authored SVG

This app renders diagrams via the standard `mermaid` npm package
(`src/components/MermaidDiagram.tsx`), lazy-loaded per page. Content agents
and any diagram-authoring code should produce Mermaid syntax text, not raw
`<svg>` markup. Canonical standard:
**`.claude/skills/mermaid-diagram-craft/SKILL.md`** — read it for the full
rules; condensed here:

- A diagram earns its place when it shows branching, a multi-step pipeline,
  or a comparison — not for a single linear sequence a list already covers.
- Show the real mechanism (real node/service names from the actual
  content), never a generic `step1 → step2 → step3` restatement.
- Label edges with the verb/condition driving the transition.
- Enforced checklist a diagram is validated against: node/actor labels
  ≤ 40 chars, edge labels ≤ 25 chars, > 20 nodes triggers a split warning,
  no orphan nodes, explicit direction (`TD`/`LR`/`BT`/`RL`), any `fill`
  style paired with an explicit `color` (WCAG AA 4.5:1 against the
  `#1a2a42` background), font size `'14px'` (platform default — an inline
  override below `'12px'` is a violation), sequence messages ≤ 60 chars.

## Prose & structure — blog posts and study notes

Canonical standard: **`.claude/skills/content-structure-craft/SKILL.md`**
— read it for the full rules; condensed here:

- A structural device (numbered list, table, callout) earns its place only
  when the content is genuinely sequential/comparative/tabular — don't
  impose structure the content doesn't have, and don't flatten genuinely
  structured content into prose either.
- A callout (`note-trap`/`note-important`/`note-scribble`) earns its place
  when it interrupts a default expectation, not when it restates the
  paragraph above it.
- Avoid generic AI-prose patterns: crutch rule-of-three lists, repeated
  "not just X, but Y," empty transitions ("It's important to note that..."),
  hedging without landing a position.
- This platform's Markdown renders through one fixed site theme — content
  agents never choose colors or fonts per post; don't suggest per-post CSS.

## Source of truth

If this file and a `.claude/agents/*.md` file ever disagree on diagram or
prose/structure rules, the two `SKILL.md` files above win — treat the
disagreement as a bug in the agent file to fix, not a reason to follow the
agent file.
