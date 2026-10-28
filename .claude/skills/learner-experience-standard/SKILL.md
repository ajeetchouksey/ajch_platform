---
name: learner-experience-standard
description: >
  The SkillUp learner-experience bar: six checkable principles every learner-facing
  flow and every content set must support (learner-driven, visibly reactive,
  felt progress, always a next step, real data, phone width), plus the content
  signals that make adaptive experiences possible. Load when designing, building,
  or reviewing any SkillUp flow, and when authoring content that a flow will adapt on.
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

Report a review as `Bar: 1 ✓ 2 ✗ 3 ✓ 4 ✗ 5 ✓ 6 ✓` plus the single biggest problem.

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
