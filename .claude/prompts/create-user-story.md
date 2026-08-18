---
name: create-user-story
description: >
  Prompt template for the Product Manager when creating structured
  GitHub Issues. Defines the mandatory fields, format rules, and validation
  checklist for platform user stories.
---

# Create User Story — Prompt Template

## Purpose

This template defines the exact schema the Product Manager must follow when
generating a GitHub Issue from a rough feature request, idea, or discussion.

---

## Input (from user or Orchestrator)

```
raw_input: "<free-form description of the feature or need>"
persona_hint: "<optional: which persona benefits most>"
domain_hint: "<optional: exam | blog | tools | platform | agent>"
priority_hint: "<optional: P0 | P1 | P2 | P3>"
milestone_hint: "<optional: v2.0 | v2.1 | v2.2 | Backlog>"
```

---

## Mandatory Issue Structure

Every GitHub Issue created by the PO Agent MUST contain all sections below.

```markdown
## User Story

**As a** [persona from gh-project-config.md personas],
**I want** [one clear capability or outcome],
**so that** [specific value / benefit delivered].

---

## Context

[1-3 sentences explaining WHY this matters now and what problem it solves.
Reference existing platform state if relevant — e.g., "the current exam catalog
has no search, forcing users to scroll through all entries."]

---

## Acceptance Criteria

- [ ] AC1: [specific, testable condition — user-facing]
- [ ] AC2: [specific, testable condition]
- [ ] AC3: [specific, testable condition]
- [ ] AC4: [edge case or error state handled]
<!-- Minimum 3 ACs. Each must be independently verifiable. -->

---

## Technical Notes

[Optional. Mention known implementation constraints, affected files, or
dependencies. Leave blank if none — do NOT guess at implementation details
beyond what is known from the codebase.]

---

## Out of Scope

- [What this story explicitly does NOT include — prevents scope creep]

---

## RICE Score

| Factor | Value | Rationale |
|--------|-------|-----------|
| **Reach** | /10 | How many users/sessions impacted per sprint? |
| **Impact** | 0.25/0.5/1/2/3 | Massive=3, High=2, Medium=1, Low=0.5, Minimal=0.25 |
| **Confidence** | % | How confident in Reach/Impact estimates? |
| **Effort** | person-weeks | Estimated dev effort |
| **RICE Score** | (R×I×C)/E | Computed — higher = higher priority |

---

## Links

- Epic: #[epic issue number if applicable]
- Depends on: #[issue number if blocked by another issue]
- Blocks: #[issue number if this blocks another]
```

---

## Labels to Apply

Select from [gh-project-config.md](../skills/gh-project-config.md):

1. **Type**: one of `type:feat`, `type:content`, `type:ux`, `type:infra`, `type:bug`, `type:chore`
2. **Priority**: one of `P0-critical`, `P1-high`, `P2-medium`, `P3-low`
3. **Domain**: one or more of `domain:exam`, `domain:blog`, `domain:tools`, `domain:platform`, `domain:agent`

---

## Size Estimates

Use T-shirt sizing in the issue title suffix:

| Size | Effort | Typical scope |
|------|--------|---------------|
| `[XS]` | < 2h | Single file edit, copy change, config tweak |
| `[S]` | 2-4h | Single component, one content file |
| `[M]` | 1-2 days | Feature with 2-4 files, minimal new infrastructure |
| `[L]` | 3-5 days | Multi-component feature, new page, new API integration |
| `[XL]` | > 1 week | New domain module, major refactor, new agent |

Issue title format: `[size] Short imperative title (#domain)`
Example: `[M] Add search to exam catalog (#platform)`

---

## Validation Checklist (PO Agent must verify before creating)

- [ ] User story follows "As a / I want / so that" format
- [ ] At least 3 acceptance criteria, each independently testable
- [ ] RICE score computed (even if rough estimates)
- [ ] Labels assigned: type + priority + domain
- [ ] Size estimate in title
- [ ] Out of scope section populated (at least 1 item)
- [ ] Milestone assigned
- [ ] Epic linked if applicable

---

## Content-Specific Extensions

When `domain_hint` is `content`, also include:

```markdown
## Content Spec

- **Content type**: exam | notes | blog-post | scenario
- **Target persona**: [from personas list]
- **Source material**: [URL or reference to authoritative source]
- **Estimated word count / question count**: ~
- **Review needed**: Yes / No
- **Related exam**: [exam ID if applicable, e.g. ccaf, ghbp]
```
