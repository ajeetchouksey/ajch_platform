---
name: content-structure-craft
description: >
  Portable prose/structure craft for Aarya — My AI Learning Hub's freeform
  Markdown content (blog posts, study notes). Not a color/typography system —
  this platform's Markdown renders through one fixed site theme, content
  agents never choose fonts or colors per post. Covers when a structural
  device (numbered list, callout, table) earns its place versus when it's
  clutter, and how to avoid generic AI-written-prose patterns. Tech Writer
  and Docs Engineer must follow it.
---

# Content Structure Craft

Applies only to freeform Markdown content — blog posts (Tech Writer) and
study notes (Docs Engineer). `usecase-writer` and `hol-lab-writer` produce
fixed-shape JSON fields, not freeform prose, so this file doesn't apply to
them (see `mermaid-diagram-craft/SKILL.md` for what does apply to all four).

## 1. Structure is information

Reach for a numbered list, table, or subheading only when the content is
genuinely sequential, comparative, or tabular — the structure should encode
something true about the content, not decorate it. Don't impose a numbered
list on prose that isn't a real sequence; don't flatten genuinely
structured content (a real decision table, a real ordered procedure) into a
wall of prose either. If the order of items doesn't matter, a numbered list
is the wrong device — use an unordered list or prose.

## 2. Callout economy

Applies directly to Docs Engineer's `note-trap` / `note-important` /
`note-scribble` HTML classes: a callout earns its place when it interrupts
the reader's default expectation — a genuine trap, a genuine warning that
contradicts the obvious reading. It does not earn its place when it just
restates the paragraph directly above it in a colored box. Overused
callouts train readers to skim past all of them, including the ones that
actually matter — economy is what keeps a callout meaningful.

## 3. Avoiding generic AI-prose patterns

Watch for and avoid:
- **Crutch rule-of-three lists** — reaching for exactly three bullet points
  out of habit rather than because the content has exactly three parts.
- **The "not just X, but Y" formula**, used more than once in a piece — it
  reads as a tic, not a rhetorical device, on repetition.
- **Empty transitions** — "It's important to note that...", "In
  conclusion,", "At the end of the day," — these add no information; cut
  them and the sentence loses nothing.
- **Hedge-everything without landing a position** — stacking qualifiers
  until the sentence no longer claims anything. State the claim, then
  qualify it once if the qualification is load-bearing.

This generalizes what Tech Writer's voice rules already ask for
("Opinionated: state positions clearly") into a shared craft bar both
Tech Writer and Docs Engineer hold — Docs Engineer's own Writing Standards
don't currently say any of this.

## 4. Match structural complexity to what the content needs

A short Exam Trap callout doesn't need three subheadings inside it; a
genuinely multi-branch Deep Dive scenario does need real structure to stay
readable. The right amount of structure is the amount the content's actual
shape calls for — no more, no less.
