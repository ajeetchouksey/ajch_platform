# Docs Engineer — Punch-First Writing Framework

This is a standalone reference for the "punch-first" prose convention that `docs-engineer.md` now
requires inside every `### Key Concept` and `### In Practice` block. The rule itself lives in
`docs-engineer.md` (Key Concept Formatting Standard + In Practice Standard); this file explains the
*why* and shows a worked before/after so the convention is easy to apply consistently, hand to
someone else, or reference without opening the full agent definition.

## Why this exists

Comparing two study-note formats in the CCAP/GH-600 exam content surfaced a structural insight:
GH-600's skeleton (Key Concept → In Practice → Exam Trap, one concept fully unpacked before moving
on) is the right shape — it's what makes a real "Decision trigger / When you'd choose differently"
pattern possible, which a flatter, table-only format can't do.

But the *prose inside that skeleton* had a problem: Key Concept blocks were single 90–120 word
paragraphs with no visual break, several 40+ word sentences, and no bolded anchor for the eye to
land on. The core claim and the memorable analogy were both buried mid-paragraph, arriving *after*
the reader's attention had already dropped.

Two things explain why that costs retention:

- **Isolation effect** — the brain remembers what's visually distinct, not what's uniform. If the
  only visually distinct element in a topic section is the Exam Trap box, everything else —
  including the actual core idea — reads as equally-weighted grey text.
- **Cognitive load** — a long unbroken paragraph forces the reader to hold everything in working
  memory before the payoff lands. Chunking it into a punchline + elaboration lets the reader bank
  the payoff first, then choose how deep to go.

The fix doesn't touch the skeleton at all — no headings change. It's a prose-craft rule: lead with
the claim, keep paragraphs short, and give the analogy its own sentence instead of tucking it onto
the end of something else.

## The Key Concept template

```markdown
### Key Concept

**{One-line claim, ≤20 words — the whole idea stated flat.}**

{Paragraph 1: 2-3 sentences. First sentence signposts what this paragraph does
(define, contrast, situate). Don't open with throat-clearing like "It is
important to understand that...".}

{Paragraph 2: 2-3 sentences, ending in a **bolded analogy or metaphor** stated
as its own clause — not buried as a trailing dependent clause.}
```

**Rules**:
- The bolded claim comes first, standalone, before any explanatory prose — it's the sentence a
  learner should still remember a week later even if they forget everything else in the block.
- No single paragraph may run past ~70 words / 3 sentences — split it. Two short paragraphs beat
  one long one.
- If an analogy is used (encouraged, not mandatory), bold it and give it its own sentence; don't
  tack it onto the end of an explanatory sentence as an afterthought.

**Anti-patterns**:
- Opening with definition-and-context and letting the sharp, quotable version of the idea arrive
  two sentences in, unmarked.
- One 90+ word paragraph with no visual break.
- An analogy that's technically present but grammatically subordinate to something else, so it
  doesn't stand out.

## The In Practice extension

Same principle, applied to the three required fields ("What breaks without this", "Decision
trigger", "When you'd choose differently"): each should lead with its sharpest sentence first, not
build up to it. A practitioner scanning under exam-week time pressure should get the payoff from
the first sentence of each field, not the last.

**Anti-pattern**: burying the actual failure mode or trigger question after a sentence of setup
instead of leading with it.

## Worked example (before/after)

Taken from `content/skillup/ccap/notes/ccap-d3-integration.md`, the "Capability bloat" Key Concept
block.

### Before

> Capability bloat is the accumulation of tools, permissions, or sub-agents beyond what any single
> task actually requires. It happens gradually — a team adds "just one more tool" to solve a
> narrow problem, and eighteen months later an agent has forty tool definitions, most unused on any
> given turn. The cost is not just token overhead in the system prompt; it is a measurable
> degradation in tool-selection accuracy. As the number of semantically similar tool descriptions
> grows, the model's ability to pick the *correct* one drops, because ambiguity between look-alike
> tools (`update_ticket` vs `update_ticket_status` vs `patch_ticket`) rises faster than the model's
> discriminative signal.

### After

> **More tools doesn't mean a more capable agent — past a point, it means a less accurate one.**
>
> Capability bloat is the slow accumulation of tools, permissions, or sub-agents beyond what any
> single task needs. It never arrives as one decision — a team adds "just one more tool" to solve a
> narrow problem, and eighteen months later an agent carries forty tool definitions, most unused on
> any given turn.
>
> The real cost isn't token overhead. It's that tool-selection accuracy quietly degrades as
> look-alike tools pile up (`update_ticket` vs `update_ticket_status` vs `patch_ticket`) —
> ambiguity grows faster than the model's ability to tell them apart. **Think of it like a junk
> drawer**: the more things you cram in, the longer it takes to find the one you actually need,
> even though everything in it is technically useful.

Same information, roughly the same length — but now there's a one-line claim to remember, a
bolded analogy that lands where the eye actually pauses, and two breathing points instead of one
wall of text.
