---
name: mvp-weekly-analysis
description: >
  Orchestrates the weekly MVP & Growth analysis for Aarya — My AI Learning Hub.
  Use when asked to run MVP analysis, update MVP progress, find MVP gaps, produce
  an MVP strategy brief, refresh the dashboard, or "what should I focus on this
  week" for MVP purposes. Delegates to MVP Strategist, which fans out to Content
  Gap Analyst, Community Tracker, and Evidence Curator.
---

# MVP Weekly Analysis

Extracted from `staff-engineer.md`'s Multi-Agent Workflows so this procedure
only loads into context when actually triggered, not on every Staff Engineer
invocation (see the Context Budget Rule in `platform-vocabulary/SKILL.md` —
this skill is that rule applied to the framework itself).

**No security gate needed — read-only analysis, single JSON write.**

## Procedure

1. → **MVP Strategist**:
   - Calls Content Gap Analyst → domain coverage report
   - Calls Community Tracker → community metrics update
   - Calls Evidence Curator → closed MSMVPAI issue count + evidence pack
   - Synthesizes into `agentRecommendations[]`
   - Writes updated `agentRecommendations`, `agentLastRun`, `agentNextRun` to
     `public/content/mvp-progress.json`
2. Report to user: top 3 priority actions, overall health, next run date

**IMPORTANT:** Never surface MVP nomination intent in any public content. All
outputs go to `mvp-progress.json` only.
