---
name: mermaid-diagram-craft
description: >
  Single source of truth for Mermaid diagram craft on Aarya — My AI Learning
  Hub: when a diagram earns its place, how to draw one that shows the real
  mechanism, and the platform's enforced readability/contrast rules. QA
  Engineer's validation checklist is generated from this file — do not
  hardcode diagram rules anywhere else. Docs Engineer, Usecase Writer, HOL
  Lab Writer, Tech Writer, and Interview Prep Engineer must follow it
  whenever they author a mermaidDiagram/diagram.chart field or a ```mermaid
  fenced block.
---

# Mermaid Diagram Craft

Every diagram-producing agent on this platform reads this file instead of
independently re-describing diagram rules (same Context Budget Rule
`platform-vocabulary/SKILL.md` applies to prose terms — see
`vertical-pipeline/SKILL.md`'s own note on this pattern). If a diagram rule
needs to change, it changes **here**, once.

## 1. Does this diagram earn its place?

A diagram belongs when it shows branching, a multi-step pipeline with more
than one path, or a comparison the reader needs to see at a glance. A single
linear sequence usually doesn't need one — numbered steps already convey
that. Don't add a diagram to satisfy a "should have a diagram" checkbox;
an unearned diagram is clutter, not proof of effort.

## 2. Show the real mechanism, not a restatement

Diagrams must show the actual structure of what's being described — real
node/service names sourced from the actual content (the lab's steps, the
use case's `workflowSteps`, the answer's real architecture) — never a
generic `step 1 → step 2 → step 3` restatement of a list that already reads
fine as a list. If a diagram doesn't add information a plain list wouldn't,
skip the diagram.

## 3. Labeled edges

An edge carries the verb or condition driving the transition —
`retries with error context`, `escalates after 3 failures` — not a bare
arrow. This matters most at decision points: an unlabeled branch out of a
decision node forces the reader to guess which condition goes where.

## 4. Comparison shows the difference

When contrasting two approaches (before/after, two branches, two
architectures), put both in one diagram so the delta is visible at a
glance. Two separate diagrams force the reader to hold one in memory while
scanning the other — the comparison is lost.

## 5. Platform mechanics

This platform renders diagrams via the standard `mermaid` npm package
(`src/components/MermaidDiagram.tsx`), lazy-loaded per page — **not**
hand-authored inline SVG. Content agents write Mermaid syntax text, never
raw `<svg>` markup. The live theme config (`MermaidDiagram.tsx`):
`theme: 'dark'`, background `#0e1a2d`/`#1a2a42`, primary `#6d28d9`,
`fontSize: '14px'`, `flowchart.curve: 'basis'`.

## 6. Color-by-meaning palette

Use `style`/`classDef` directives to encode meaning, matched to the live
theme's color families — not decoration, not arbitrary:

```
Happy path / output  →  fill:#1a2a12,stroke:#34d399   (green)
Control / decision   →  fill:#1a2a42,stroke:#7c3aed   (violet)
Warning / risk        →  fill:#2a1a22,stroke:#fbbf24   (amber)
Error / never-do      →  fill:#2a1a1a,stroke:#fb7185   (rose)
Data / storage        →  fill:#162236,stroke:#60a5fa   (blue)
```

Every `fill` must pair with an explicit `color` (text color) — see the
Enforced Standards Checklist § Color & Contrast below for why.

## 7. Diagram type selection

| Content shape | Recommended diagram | When to use |
|---|---|---|
| Control flow / process | `flowchart TD` or `flowchart LR` | Coordinator loops, pipelines, decision gates, approval flows |
| Time-ordered interactions | `sequenceDiagram` | Agent↔tool calls, crash-replay scenarios, API call chains |
| Data architecture / tiers | `flowchart TD` | RAG pipelines, data classification tiers, storage layers |
| Adoption / lifecycle | `flowchart LR` | Stakeholder sequencing, adoption flywheel, timeline-shaped content |

## 8. JSON-encoding rules

For any consumer whose diagram lives inside a JSON string field
(`usecase-writer`'s `mermaidDiagram`, `hol-lab-writer`'s `mermaidDiagram`,
`interview-prep-engineer`'s `diagram.chart`):

- Newlines **must** be encoded as `\n` (JSON string escape) — never literal
  newlines.
- **No raw `"` double-quotes** inside Mermaid node labels — they break JSON
  parsing. Use plain text, parentheses, or angle-brackets for emphasis
  instead.
- **No trailing `end` keyword** artifacts left over from editing — not
  needed and causes parse errors.
- Node labels with spaces are fine without quotes: `A[My Node Label]`.
- Multi-word labels on two visual lines: `A[Line one\nLine two]`.
- `&` fans multiple edges to one node: `A & B --> C` is valid.

## 9. Caption rule

Every diagram that reaches a reader needs a stated caption — a sighted
user and a screen reader should both get a claim about what the diagram
shows, not just its topic. Where the consumer's schema has a
`mermaidDiagramCaption` (`usecase-writer`, `hol-lab-writer`) or
`diagram.caption` (`interview-prep-engineer`) field, populate it:

- 5-10 words, lowercase except proper nouns.
- Describes what the diagram *shows*, not just the topic — e.g.
  `"Bounded planner-executor-critic loop with escalation"`, not just
  `"Orchestration"`.

## 10. Enforced Standards Checklist

This is the checklist QA Engineer runs against every diagram it validates —
whether from a `.md` file's fenced block or a raw chart string passed
directly. A diagram **PASSES** only when all checks are green.

### Syntax Validity
- Must begin with a valid Mermaid graph type keyword: `graph`, `flowchart`,
  `sequenceDiagram`, `classDiagram`, `stateDiagram`, `erDiagram`, `gantt`,
  `pie`, `gitGraph`, `mindmap`, `timeline`, `xychart-beta`
- No unclosed brackets, missing arrows, or malformed node IDs

### Label Length
- **Node / actor labels**: ≤ 40 characters (labels beyond that render
  truncated or overlap on small screens)
- **Edge labels**: ≤ 25 characters

### Node Count & Complexity
- **Warning** (not a hard fail) if a single diagram has > 20 nodes —
  suggest splitting into sub-diagrams
- Flowcharts must have exactly one start node (no entry-point ambiguity)

### Orphan Nodes
- Every non-start node must have at least one incoming edge
- Every non-terminal node must have at least one outgoing edge
- Report orphans as violations with node ID

### Direction Clarity
- `flowchart`/`graph` diagrams must declare explicit direction: `TD`, `LR`,
  `BT`, or `RL`
- Missing direction defaults to `TD` — flag as a warning if omitted

### Color & Contrast (style/classDef checks)
- Any `style`/`classDef` directive that sets `fill` must pair it with an
  explicit `color` (text color). Reason: the dark background (`#1a2a42`)
  requires light text — minimum contrast ratio 4.5:1 per WCAG AA
- Flag `fill:#fff`/`fill:white` without `color:#000` as a violation

### Font Size (themeVariables)
- The platform's `mermaid.initialize` config sets `fontSize: '14px'`
  globally (`MermaidDiagram.tsx`). Any inline `%%{init: ...}%%` override
  that sets `fontSize` below `'12px'` is a violation.

### Text Readability
- Sequence diagram messages should be ≤ 60 characters
- `note`/`Note over` blocks should be ≤ 80 characters
- Long notes push diagram width beyond viewport on mobile

### Caption Presence (non-blocking warning)
- A diagram passed with no caption at all (see §9 above) should receive a
  **warning**, not a violation, for both usecases and hol-labs — new
  content should include one; existing content without one is a known,
  separately-tracked backfill, not a gate failure.
- A diagram passed with a caption should have it checked against the §9
  rule (5-10 words, describes what it shows).
- Note: Mermaid's own `---\ntitle: ...\n---` frontmatter directive is
  **not** a substitute — this platform's renderer (`MermaidDiagram.tsx`)
  does nothing with it, so it's never actually visible to a reader.
