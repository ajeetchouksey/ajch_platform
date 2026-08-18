---
name: tooling-radar
description: >
  Runs the Tooling Radar → Backlog Intelligence pipeline for Aarya — My AI
  Learning Hub. Use when asked to run tooling radar, find platform tooling
  opportunities, "what AI tools should we build?", or feed the backlog with
  research. Delegates to AI Researcher (Tooling Radar mode), then Delivery
  Manager, then Product Manager.
---

# Tooling Radar → Backlog Intelligence Pipeline

Extracted from `staff-engineer.md`'s Multi-Agent Workflows so this procedure
only loads into context when actually triggered, not on every Staff Engineer
invocation (see the Context Budget Rule in `platform-vocabulary/SKILL.md` —
this skill is that rule applied to the framework itself).

## Procedure

1. → **AI Researcher** (Tooling Radar mode):
   - Scans arXiv, Hugging Face, GitHub trending, Anthropic/OpenAI release notes
     for emerging AI tooling
   - For each opportunity, emits a `ToolingRadarPayload`:
     ```json
     {
       "title": "[Tool/feature opportunity]",
       "source": "[URL]",
       "category": "tools-page | interactive-demo | api-integration | exam-content",
       "effort": "S | M | L",
       "reach": "[who benefits — practitioners / learners / maintainer]",
       "rationale": "[1-2 sentences — why this fits Aarya — My AI Learning Hub]",
       "suggestedIssueTitle": "[ready-to-use GitHub issue title]"
     }
     ```
   - Returns array of payloads (max 10 per run) — no file writes

2. → **Delivery Manager**: receives payload array, filters by `effort ≤ M` for
   current sprint candidate list, generates sprint candidate table

3. → **Product Manager**: receives filtered list + full payload array, applies
   RICE scoring, creates GitHub issues for top 3 opportunities, updates project
   board

4. Report to user: radar findings, RICE-ranked shortlist, issue numbers created
