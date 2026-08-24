# Campaign Plan: Growing Awareness for Aarya (aaryaai.dev)

**Prepared:** August 23, 2026 — grounded in the live `ajch_platform` repo (v3.5.0)

**What changed from the first draft:** the earlier version of this plan was built from the public site alone and had to guess at a lot. Now that the codebase is connected, this version replaces those guesses with what's actually there — real content counts, the open-source repos, and the platform's most distinctive (and most shareable) story: it's built by a 33-subagent agentic pipeline running natively on Claude Code, not just about agentic AI.

**Correction (Aug 23):** an earlier version of this plan said "24-agent... GitHub Copilot pipeline," sourced from the repo's README at the time. The architecture review turned up that the README itself was stale — the platform actually runs 33 subagents natively on Claude Code (the GitHub Copilot-format agent registry was retired mid-2026 after the two systems drifted out of sync). This version uses the corrected numbers throughout; if you already shared the old framing anywhere, worth a follow-up correction.

---

## 1. Objectives & KPIs

The goal is still awareness, not signups — get Aarya recognized in the AI/dev practitioner community as the free resource to point people at for Claude/AI certification prep and hands-on agentic-AI content. With real baseline numbers now available, targets can be concrete instead of placeholder guesses:

- **Primary: Organic reach signal.** 3x baseline impressions/engagement on @aaryaai posts within 60 days, tracked via X analytics.
- **Distribution proof points:** At least 3 organic pickups within 90 days — a Hacker News front-page/discussion, a subreddit thread, or a newsletter mention — of either the content hub or, separately, the 33-subagent agentic development pipeline itself (these are two distinct hooks; see Positioning below, and it's worth tracking which one lands harder).
- **GitHub signal:** Meaningful star/watch growth on the open-source repos (`ajch_platform`, and the content repos `ajch_aaryaai_blogs`, `ajch_skillup`, `ajch_ai_usecases`) — a concrete, public number that's currently near zero and easy to move, making it a good early proof point to point to.
- **Content-baseline growth:** Track `stats.json` output over time (590+ practice questions across 4 certs, 58+ blog articles, 19 study notes, 13 AI scenarios as of today) alongside engagement — the question isn't just "is content growing" but "is engagement growing faster than content volume," which is the real signal of awareness spreading rather than just more being published.

## 2. Audience & Positioning

**Primary audience:** AI/dev practitioners studying for or interested in AI certifications — specifically the four Aarya already covers (CCA-F, AB-100, GitHub Copilot certification, AI-900) — who are currently choosing between paid bootcamps and scattered free content.

**Secondary audience — and probably the sharper hook:** engineers and technical leads interested in *agentic software development as a practice*, not just AI content consumption. Aarya isn't just a site about AI — it's a live, public case study of a real product shipping through a 7-step gated pipeline run by 33 specialized Claude Code subagents (Staff Engineer → PM → AppSec → Domain Lead → AppSec audit → Design Systems → SRE → DevRel), with the subagent specs themselves open-sourced in `.claude/agents/`. That's a genuinely uncommon thing to point to right now, and it's likely to travel further in AI-builder communities than "another study site" framing would.

**What they currently believe/do:** Most practitioners either pay for certification bootcamps or piece together prep from scattered blog posts and vendor docs, without much visibility into *how* a solo/small-team AI-native product actually gets built and shipped in practice.

**Core message — two angles, worth testing separately rather than picking one:**
1. *For the certification/learning audience:* "Free, practitioner-built prep for CCA-F, AB-100, GitHub Copilot, and AI-900 — 590+ questions, 58+ field notes, real architecture guides, no paywall."
2. *For the AI-builder/agentic audience:* "This entire platform ships through a 33-subagent pipeline running natively on Claude Code — and the specs are open source. Here's what that actually looks like in production."

Lead with whichever angle fits the specific community being posted to — the certification angle for study-focused spaces (r/AI_Agents study threads, cert-prep Discords), the agentic-pipeline angle for builder-focused spaces (Hacker News, r/LocalLLaMA, agentic-AI Discords) — rather than using one generic pitch everywhere.

## 3. Channels & Timeline

Zero paid budget, so this leans entirely on owned (X/@aaryaai, the open-source repos) and earned/community channels. Having real, public GitHub repos to point to is a meaningful advantage over the first draft of this plan — "here's the repo" is a much stronger organic hook than "here's a website."

| Phase | Timeframe | Channel(s) | Key activity |
|---|---|---|---|
| **Foundation** | Week 1 | Site, X bio, `ajch_platform` README | Confirm the README/site lead with whichever framing is sharpest for a first-time visitor — right now the README leads with the agentic-pipeline story, which is the stronger hook; make sure aaryaai.dev's homepage does too. Add a short "if you're here for the agent pipeline, start with `.claude/agents/`" pointer for GitHub visitors. |
| **Seeding — agentic angle** | Weeks 1–3 | Hacker News (Show HN), r/LocalLLaMA, r/ClaudeAI, agentic-AI Discords | Submit a "Show HN: I ship a real product through a 33-subagent pipeline on Claude Code — specs are open source" post pointing at the repo. This is the highest-potential single post in this plan — Show HN rewards exactly this kind of concrete, inspectable, slightly unusual build story. Time it for a US morning window; only submit once. |
| **Seeding — certification angle** | Weeks 2–4 | r/MachineLearning, cert-prep subreddits/Discords, relevant study communities | Share the practice-question hub and study notes natively, framed as "built this while prepping for CCA-F/AI-900 myself, made it free" — practitioner-to-practitioner framing outperforms anything that reads as promotional. |
| **Amplify** | Weeks 4–8 | X threads, dev.to/Medium cross-posts, 3–5 AI-builder newsletters | Turn the strongest field notes and the agentic-pipeline writeup into X threads; republish top articles to dev.to with a canonical link back to aaryaai.dev; pitch newsletters that cover agentic AI tooling or dev-workflow experiments specifically (not just general AI newsletters — the pipeline story fits "how we built this" roundups particularly well). |
| **Sustain** | Weeks 8–12+ | X (ongoing), GitHub repo activity, community engagement | Move to a steady weekly cadence — one new or repackaged piece shared per week — and treat visible, ongoing GitHub activity (commits, releases, the CHANGELOG the SRE agent generates) as part of the story: "still actively shipping" is itself content for the agentic-AI audience. |

## 4. Competitive Context

On the certification-prep side, Aarya competes with paid bootcamps and generalist free resources (freeCodeCamp, vendor docs) — its edge is being free, current, and specific to four named certifications rather than broad. On the agentic-development side, the competitive set is different and thinner: relatively few public projects show a real, shipping product built through a fully agent-run pipeline with the specs open-sourced. Most "agentic AI" content right now is explanatory (how agents work) rather than demonstrative (here's one actually running my release process) — that gap is Aarya's clearest opening, and it's worth leaning on harder than the certification angle if only one story can be told at a time.

## 5. Risks & Contingencies

- **Risk: Posts read as self-promotion in technical communities.** Contingency: lead every post with the specific, inspectable thing (the repo, the agent specs, the question count) rather than an adjective-heavy pitch, and engage honestly in comments afterward.
- **Risk: The agentic-pipeline story invites skepticism** ("is this actually agent-run or is that marketing copy?"). Contingency: the open-sourced subagent specs in `.claude/agents/` are the answer to that skepticism — link them directly rather than just asserting the pipeline exists, and be ready to answer detailed questions about how it actually works.
- **Risk: No consistent owner for the Sustain-phase weekly cadence.** Contingency: block a fixed weekly slot for it now, since campaigns like this typically fade once the initial launch burst ends.
- **Risk: A Show HN or Reddit hit causes a traffic spike.** Contingency: since the site is static (Cloudflare Pages, no database), this is low-risk infrastructure-wise — worth confirming Cloudflare's plan/limits are fine at a sudden traffic spike, but there's no backend to fall over.

## Notes on process

No Budget & Resourcing section, per the $0/organic brief. This version supersedes the earlier draft — the main changes are swapping guessed positioning for the real content numbers and repos, and adding the agentic-pipeline angle as a distinct, probably-stronger hook alongside the certification-prep angle.
