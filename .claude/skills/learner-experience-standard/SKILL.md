---
name: learner-experience-standard
description: >
  The SkillUp learner-experience bar: six checkable principles every learner-facing
  flow and every content set must support (learner-driven, visibly reactive,
  felt progress, always a next step, real data, phone width), the Visual Language
  (colour code, cards, live feel, diagram colours), and the content signals that
  make adaptive experiences possible. Load when designing, building, or reviewing
  any SkillUp flow or diagram, and when authoring content that a flow will adapt on.
---

# Learner Experience Standard

**Owner's rule: UX comes first.** A SkillUp screen that would look the same no
matter what the learner did is a defect, even if the content on it is excellent.
Every flow is prototyped and approved before it is built.

## The Six Principles

| # | Principle | Pass when | Fail when |
|---|---|---|---|
| 1 | **Learner-driven** | Learner picks goal, date, pace, and starting point | One fixed path for everyone |
| 2 | **Visibly reactive** | Each choice or answer changes what's on screen right away — plan, forecast, next step | Inputs are collected and nothing visible changes |
| 3 | **Felt progress** | Mastery per domain/objective, streaks, and "since last time" are visible | A bare %, or nothing |
| 4 | **Always a next step** | Every screen ends in one obvious, specific action | Dead ends, or a menu of equal choices |
| 5 | **Real data** | Built from the real `index.json`, question bank, and task statements | Placeholder numbers, fake readiness, lorem ipsum |
| 6 | **Phone width** | Works at 360px: no sideways scroll, primary action visible | Breaks or hides the action on mobile |

Report a review as `Bar: 1 ✓ 2 ✗ 3 ✓ 4 ✗ 5 ✓ 6 ✓ · Visual ✓` plus the single biggest problem.

## Visual Language

SkillUp sits on the AaryaAI brand (dark navy, indigo, lilac, Barlow) and adds a
colour code where **every hue has exactly one job**. The values live in one file,
`ajch_platform/scripts/skillup-site/colour-code.json`; the build turns them into CSS
custom properties and the diagram script mirrors its `diagram` block. Never type a
colour-code hex anywhere else; change the JSON.

| Role | Colours | Where it shows |
|---|---|---|
| Action | Indigo `#5B4BD6` (lilac on hover) | Buttons and links only |
| Domain 1–6 | Lilac, Sky, Jade, Saffron, Coral, Orchid, in that fixed order | Domain cards, topic numbers, plan route, side rails, result breakdown, case-study chips |
| Lesson parts | Key idea ◆ lilac · Real use ▸ sky · Choose when ⇄ jade · Exam trap ⚠ saffron | Lesson section edge, heading and icon |
| Answer states | ✓ Correct green · ◐ Partly right saffron · ✕ Not quite rose · ★ Flagged lilac | Quiz feedback and options |
| Mastery | One indigo ramp: New → Seen → Practising → Confident → Exam-ready | Readiness ring and per-domain mastery |
| Provider | Microsoft sky · GitHub orchid · Anthropic saffron | Catalog cards |

Visual pass when all hold:

- **Only indigo is clickable.** No domain, part or state colour on a button.
- **Colour is never alone.** States and lesson parts always pair the hue with an icon and a word.
- **Tints, not fills.** Surfaces at 10–16% of the hue, borders about 30%; full colour only for edges, text, bars and icons.
- **Mastery is never red.** Low readiness means "not yet", not "failing".
- **Contrast.** Every hue used as text reaches 4.5:1 on `#0E1A2D` (the six domain hues and the state hues measure 6.5–9.9); rings, bars and edges reach 3:1. Indigo is a fill under white text, never text on navy.
- **Cards.** Glass surface tinted by the card's own colour, one primary action, a hover lift of at most 3px.
- **Live feel.** Every learner action gets a visible reaction within about 300ms (fill, count-up, toast, next step); motion stops under `prefers-reduced-motion`; loading shows a shimmer, never a blank page; any "live" number is the learner's own data, never invented activity.
- **Diagrams speak the same code.** Node kinds: `data` (input) sky, `good` (outcome or mitigation) green, `warn` (caution or false fix) saffron, `risk` rose, `focus` indigo; legend words match those meanings.

## Content Signals That Enable Adaptation

Flows can only adapt on what content exposes. Content authors (Assessment,
Docs, Scenario, Skill Track engineers) keep these intact:

| Signal | Where | Enables |
|---|---|---|
| Task/objective mapping | `task-statements.json` `questionIds`, lesson `objectives` | Readiness per objective, targeted drills |
| `difficulty` spread | MCQ `difficulty` | An easy first win, then ramping |
| Misconception-based distractors + per-distractor explanations | MCQ `explanation` | Feedback that teaches after a wrong answer |
| Note section per topic | `notes/*.md` headings | Routing a wrong answer to the exact reading |
| `holLabId` | Skill Track lessons | A hands-on mission to finish a lesson |

Missing signal ⇒ report it as a content gap, naming the field and the
experience it blocks — don't paper over it in the UI with fake data.

## Journey Moments to Cover

Arrive → set goal → first win in under 2 minutes → daily loop → setback (wrong
streak, missed day) → readiness check → exam day or track complete. A design
that skips the setback moment is incomplete — that is where learners quit.
