#!/usr/bin/env pwsh
# Creates 12 backlog issues (onboarding + MCQ + study notes) for 4 Microsoft AB-series exams:
#   AB-900  Microsoft 365 Copilot and Agent Administration Fundamentals
#   AB-100  Agentic AI Business Solutions Architect Expert  (content already exists — issues track remaining work)
#   AB-731  AI Transformation Leader
#   AB-730  AI Business Professional
#
# Prerequisites: gh auth login must be active.
# Labels used: type:feat  type:content  domain:exam  P2-medium
# Run: pwsh scripts/create-ab-exam-backlog.ps1

$repo    = "ajeetchouksey/ajch_platform"
$results = @()

# ─────────────────────────────────────────────────────────────────────────────
# Helper: ensure labels exist (creates if missing, skips on 409 conflict)
# ─────────────────────────────────────────────────────────────────────────────
function Ensure-Label($name, $color, $desc) {
    gh label create $name --repo $repo --color $color --description $desc 2>&1 | Out-Null
}
Ensure-Label "type:feat"    "7c3aed" "New feature or capability"
Ensure-Label "type:content" "0ea5e9" "Study notes, MCQs, exams, blog posts"
Ensure-Label "domain:exam"  "2563eb" "Exam framework and content"
Ensure-Label "P2-medium"    "ca8a04" "Scheduled in upcoming milestone"

Write-Host "Labels verified.`n"

# ═════════════════════════════════════════════════════════════════════════════
# AB-900  Microsoft 365 Copilot and Agent Administration Fundamentals
# ═════════════════════════════════════════════════════════════════════════════

# ── AB-900 | 1/3 · Exam Onboarding ───────────────────────────────────────────
$body = @'
## Exam
**AB-900: Microsoft 365 Copilot and Agent Administration Fundamentals**
**Vendor:** Microsoft
**Level:** Fundamentals
**Passing score:** 700 / 1000

## Summary
Add the AB-900 exam track to the SkillUp catalog — exam page, route, nav entry, and metadata JSON.

## Exam Domains
| # | Domain | Weight |
|---|--------|--------|
| 1 | Identify the core features and objects of Microsoft 365 services | 30–35% |
| 2 | Understand data protection and governance tasks for M365 and Copilot | 35–40% |
| 3 | Perform basic administrative tasks for Copilot and agents | 25–30% |

## Acceptance Criteria
- [ ] `public/content/skillup/ab900/index.json` created with exam metadata (title, domains, passScore, accentColor)
- [ ] Exam route registered in the platform router
- [ ] AB-900 card appears in the SkillUp catalog grid
- [ ] Exam detail page loads without errors (even with empty question files)
- [ ] Nav / catalog links to `/skillup/ab900`
- [ ] `domain:exam` label applied, milestone set to `v2.0 — Content Expansion`

## Resources
- [AB-900 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-900)
- [M365 Copilot Docs](https://learn.microsoft.com/en-us/microsoft-365/)

## Out of Scope
- MCQ question bank (tracked separately)
- Study notes (tracked separately)
'@

$url = gh issue create --repo $repo `
  --title "[feat] Add AB-900: Microsoft 365 Copilot and Agent Administration Fundamentals to exam catalog" `
  --label "type:feat,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-900 Onboarding  #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-900"; Title="[feat] Add AB-900: M365 Copilot and Agent Administration Fundamentals to exam catalog"; Type="onboarding" }

# ── AB-900 | 2/3 · MCQ Bank ──────────────────────────────────────────────────
$body = @'
## Exam
**AB-900: Microsoft 365 Copilot and Agent Administration Fundamentals**
**Vendor:** Microsoft

## Summary
Author and publish a minimum of 60 MCQ questions covering all three AB-900 exam domains.

## Domain Coverage
| # | Domain | Weight | Target Qs |
|---|--------|--------|-----------|
| 1 | Core features and objects of Microsoft 365 services | 30–35% | 20 |
| 2 | Data protection and governance (M365 + Copilot) | 35–40% | 22 |
| 3 | Basic administrative tasks for Copilot and agents | 25–30% | 18 |

## Key Topics per Domain
**Domain 1 — M365 Core Features:**
- License types, Exchange, SharePoint, Teams admin objects
- Zero Trust, MFA, conditional access, Entra ID, PIM
- Audit logs, SSO, app registrations

**Domain 2 — Data Protection & Governance:**
- Microsoft Purview: Information Protection, DLP, Insider Risk, Communication Compliance
- Sensitivity labels, data classification, retention
- Copilot data access, Microsoft Graph influence, DSPM for AI
- Oversharing in SharePoint, restricted access control

**Domain 3 — Copilot & Agent Admin:**
- Built-in Copilot capabilities vs. agent experiences
- License models (monthly, pay-as-you-go)
- Assigning licenses, managing billing, Copilot analytics
- Creating, approving, and monitoring agents (Power Platform + M365 admin center)

## Acceptance Criteria
- [ ] Minimum 60 MCQ questions authored across all 3 domains
- [ ] Questions stored in `public/content/skillup/ab900/questions/ab900-domain*.json`
- [ ] Each question has: stem, 4 options, correct answer key, explanation
- [ ] Question bank validated by `scripts/validate-content.mjs`
- [ ] No duplicate questions within or across domain files

## Resources
- [AB-900 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-900)
- [Microsoft Purview Docs](https://learn.microsoft.com/en-us/purview/)
- [Copilot Admin Center Docs](https://learn.microsoft.com/en-us/microsoft-365/admin/)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add MCQ bank for AB-900: M365 Core Features, Data Protection, Copilot Admin" `
  --label "type:content,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-900 MCQ         #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-900"; Title="[content] Add MCQ bank for AB-900: M365 Core Features, Data Protection, Copilot Admin"; Type="mcq" }

# ── AB-900 | 3/3 · Study Notes ───────────────────────────────────────────────
$body = @'
## Exam
**AB-900: Microsoft 365 Copilot and Agent Administration Fundamentals**
**Vendor:** Microsoft

## Summary
Author domain-aligned study notes for AB-900 covering all three exam domains.

## Notes to Create
| File | Domain |
|------|--------|
| `ab900-d1-m365-core-features.md` | Core features and objects of Microsoft 365 services |
| `ab900-d2-data-protection-governance.md` | Data protection and governance for M365 and Copilot |
| `ab900-d3-copilot-agent-admin.md` | Basic administrative tasks for Copilot and agents |

## Content Requirements per Note
- Key concepts cheat-sheet (table format)
- Exam tip callouts for commonly-tested items
- Comparison tables (e.g. sensitivity label vs DLP, MFA types)
- Mermaid diagram where helpful (e.g. Copilot data access flow)
- "What to remember" summary section

## Acceptance Criteria
- [ ] 3 Markdown note files created under `public/content/skillup/ab900/notes/`
- [ ] Each file has frontmatter: `title`, `domain`, `exam`, `updated`
- [ ] Domain files referenced in `public/content/skillup/ab900/index.json` `domains[].notesFile`
- [ ] Notes render correctly on the exam study page
- [ ] Spell-checked and reviewed for accuracy against official study guide

## Resources
- [AB-900 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-900)
- [Microsoft Purview Docs](https://learn.microsoft.com/en-us/purview/)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add study notes for AB-900: M365 Core Features, Data Protection, Copilot Admin" `
  --label "type:content,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-900 Notes       #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-900"; Title="[content] Add study notes for AB-900: M365 Core Features, Data Protection, Copilot Admin"; Type="notes" }

# ═════════════════════════════════════════════════════════════════════════════
# AB-100  Agentic AI Business Solutions Architect Expert
# Note: Exam scaffold + Domain 1–4 notes already exist. Issues track remaining
# content work: scenario packs, additional MCQs, and catalog metadata audit.
# ═════════════════════════════════════════════════════════════════════════════

# ── AB-100 | 1/3 · Catalog Audit & Metadata Completeness ────────────────────
$body = @'
## Exam
**AB-100: Agentic AI Business Solutions Architect Expert**
**Vendor:** Microsoft
**Level:** Expert
**Passing score:** 700 / 1000

## Summary
AB-100 already has a scaffold in `public/content/skillup/ab100/`. This issue tracks a catalog audit, metadata validation, and any missing linkages (scenario packs, catalog registration, stats sync).

## Exam Domains
| # | Domain | Weight |
|---|--------|--------|
| 1 | Plan AI-Powered Business Solutions | 28% |
| 2 | Design Agentic AI Solutions | 28% |
| 3 | Monitor, Test & Optimize | 22% |
| 4 | Lifecycle Management & Responsible AI | 22% |

## Acceptance Criteria
- [ ] `public/content/skillup/ab100/index.json` passes schema validation
- [ ] All 4 `notesFile` references resolve to existing Markdown files
- [ ] All `questionFiles` references resolve (no 404)
- [ ] All 3 `scenarioFiles` resolve (hr-onboarding-agent, invoice-processing, compliance-monitoring)
- [ ] AB-100 card visible and correctly styled in SkillUp catalog
- [ ] `public/content/stats.json` reflects correct question and note counts for AB-100
- [ ] Pass score, duration, and domain weights match the official AB-100 study guide

## Resources
- [AB-100 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- [Azure AI Foundry Docs](https://learn.microsoft.com/en-us/azure/ai-foundry/)
- [Copilot Studio Docs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/)
'@

$url = gh issue create --repo $repo `
  --title "[feat] AB-100: Audit catalog metadata and validate all content linkages" `
  --label "type:feat,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-100 Onboarding  #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-100"; Title="[feat] AB-100: Audit catalog metadata and validate all content linkages"; Type="onboarding" }

# ── AB-100 | 2/3 · MCQ Completeness ─────────────────────────────────────────
$body = @'
## Exam
**AB-100: Agentic AI Business Solutions Architect Expert**
**Vendor:** Microsoft

## Summary
Verify and expand the AB-100 MCQ bank to ensure ≥ 60 high-quality questions across all 4 domains, with scenario-based questions included.

## Domain Coverage Target
| # | Domain | Weight | Minimum Qs |
|---|--------|--------|-----------|
| 1 | Plan AI-Powered Business Solutions | 28% | 17 |
| 2 | Design Agentic AI Solutions | 28% | 17 |
| 3 | Monitor, Test & Optimize | 22% | 13 |
| 4 | Lifecycle Management & Responsible AI | 22% | 13 |

## Key Topics per Domain
**Domain 1 — Plan:**
- Azure AI Foundry project setup, skill identification, ROI estimation
- Solution scoping for agentic vs non-agentic scenarios

**Domain 2 — Design:**
- Agent orchestration patterns, tool use, memory types
- Copilot Studio agent design, retrieval-augmented generation (RAG)
- Microsoft Agent Framework, multi-agent topologies

**Domain 3 — Monitor & Optimize:**
- Evaluation metrics: groundedness, coherence, relevance, safety
- AI Foundry evaluation pipelines, prompt iteration
- Cost and latency optimization techniques

**Domain 4 — Lifecycle & Responsible AI:**
- Microsoft Responsible AI principles: fairness, reliability, safety, privacy, transparency
- AI risk classification (EU AI Act alignment)
- Model versioning, deprecation strategies, governance policies

## Acceptance Criteria
- [ ] ≥ 60 total MCQ questions across 4 domain files
- [ ] Each question: stem, 4 options, correct answer, explanation
- [ ] ≥ 5 scenario-based questions (multi-paragraph case stems)
- [ ] Validated by `scripts/validate-content.mjs`
- [ ] No duplicate questions

## Resources
- [AB-100 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
'@

$url = gh issue create --repo $repo `
  --title "[content] Expand MCQ bank for AB-100: Plan, Design Agentic, Monitor, Responsible AI" `
  --label "type:content,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-100 MCQ         #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-100"; Title="[content] Expand MCQ bank for AB-100: Plan, Design Agentic, Monitor, Responsible AI"; Type="mcq" }

# ── AB-100 | 3/3 · Study Notes Completeness ──────────────────────────────────
$body = @'
## Exam
**AB-100: Agentic AI Business Solutions Architect Expert**
**Vendor:** Microsoft

## Summary
Review and complete the 4 existing AB-100 study note files. Ensure all domains have full coverage, correct frontmatter, and rich reference tables.

## Notes to Review & Complete
| File | Domain | Status |
|------|--------|--------|
| `ab100-d1-plan-ai-solutions.md` | Plan AI-Powered Business Solutions | Exists — review coverage |
| `ab100-d2-design-agentic.md` | Design Agentic AI Solutions | Exists — review coverage |
| `ab100-d3-monitor-test.md` | Monitor, Test & Optimize | Exists — review coverage |
| `ab100-d4-lifecycle-responsible.md` | Lifecycle Management & Responsible AI | Exists — review coverage |

## Per-Note Acceptance Criteria
- [ ] Frontmatter complete: `title`, `domain`, `exam`, `updated`
- [ ] Key concepts table present
- [ ] At least 1 Mermaid diagram per note
- [ ] Exam tip callouts highlighting highest-weight topics
- [ ] "What to remember" summary section at end of each note
- [ ] Content aligned with official AB-100 study guide (updated 2026)

## Resources
- [AB-100 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-100)
- [Azure AI Foundry Docs](https://learn.microsoft.com/en-us/azure/ai-foundry/)
'@

$url = gh issue create --repo $repo `
  --title "[content] Complete and review study notes for AB-100: all 4 domains" `
  --label "type:content,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-100 Notes       #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-100"; Title="[content] Complete and review study notes for AB-100: all 4 domains"; Type="notes" }

# ═════════════════════════════════════════════════════════════════════════════
# AB-731  AI Transformation Leader
# ═════════════════════════════════════════════════════════════════════════════

# ── AB-731 | 1/3 · Exam Onboarding ───────────────────────────────────────────
$body = @'
## Exam
**AB-731: AI Transformation Leader**
**Vendor:** Microsoft
**Level:** Associate
**Passing score:** 700 / 1000

## Summary
Add the AB-731 exam track to the SkillUp catalog — exam page, route, nav entry, and metadata JSON. This exam targets business decision-makers responsible for guiding AI transformation (no coding required).

## Exam Domains
| # | Domain | Weight |
|---|--------|--------|
| 1 | Identify the business value of generative AI solutions | 35–40% |
| 2 | Identify benefits, capabilities, and opportunities for Microsoft AI apps and services | 35–40% |
| 3 | Identify an implementation and adoption strategy for Microsoft AI apps and services | 20–25% |

## Acceptance Criteria
- [ ] `public/content/skillup/ab731/index.json` created with exam metadata (title, domains, passScore, accentColor)
- [ ] Exam route registered in the platform router
- [ ] AB-731 card appears in the SkillUp catalog grid
- [ ] Exam detail page loads without errors (even with empty question files)
- [ ] Nav / catalog links to `/skillup/ab731`
- [ ] Milestone set to `v2.0 — Content Expansion`

## Color scheme suggestion
`accentColor: "#7c3aed"` (purple — leadership / strategy)

## Resources
- [AB-731 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-731)
- [Azure AI Foundry Docs](https://learn.microsoft.com/en-us/azure/ai-foundry/)
- [Copilot Studio Docs](https://learn.microsoft.com/en-us/microsoft-copilot-studio/)

## Out of Scope
- MCQ question bank (tracked separately)
- Study notes (tracked separately)
'@

$url = gh issue create --repo $repo `
  --title "[feat] Add AB-731: AI Transformation Leader to exam catalog" `
  --label "type:feat,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-731 Onboarding  #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-731"; Title="[feat] Add AB-731: AI Transformation Leader to exam catalog"; Type="onboarding" }

# ── AB-731 | 2/3 · MCQ Bank ──────────────────────────────────────────────────
$body = @'
## Exam
**AB-731: AI Transformation Leader**
**Vendor:** Microsoft

## Summary
Author and publish a minimum of 60 MCQ questions covering all three AB-731 exam domains. Questions should be scenario-based and business-decision oriented (no coding).

## Domain Coverage
| # | Domain | Weight | Target Qs |
|---|--------|--------|-----------|
| 1 | Business value of generative AI solutions | 35–40% | 23 |
| 2 | Benefits, capabilities & opportunities for Microsoft AI apps/services | 35–40% | 22 |
| 3 | Implementation & adoption strategy for Microsoft AI apps/services | 20–25% | 15 |

## Key Topics per Domain
**Domain 1 — Business Value of GenAI:**
- GenAI vs other AI types; model types (fine-tuned vs pretrained)
- Cost drivers: tokens, ROI considerations
- Fabrications, reliability, bias — challenges
- Prompt engineering impact; RAG for grounding
- Data quality impact; ML lifecycle; security considerations

**Domain 2 — Microsoft AI Apps & Services:**
- Microsoft 365 Copilot capabilities (chat, M365 apps, Researcher, Analyst)
- Copilot Studio; Microsoft Graph
- Foundry Tools: Azure AI Search, Azure Vision in Foundry, Microsoft Foundry
- When to build vs buy vs extend (M365 Copilot extensibility framework)
- Scalability and security benefits of integrated Microsoft AI

**Domain 3 — Implementation & Adoption Strategy:**
- Responsible AI: fairness, reliability, safety, privacy, transparency, accountability
- AI governance: council, champions program, adoption barriers
- License types: monthly, pay-as-you-go, included with M365
- Foundry Tools: pay-as-you-go vs commitment tiers
- Change management and cross-functional alignment

## Acceptance Criteria
- [ ] ≥ 60 MCQ questions across 3 domain files
- [ ] Each question: stem, 4 options, correct answer key, explanation
- [ ] ≥ 8 scenario-based questions (business context, no code)
- [ ] Validated by `scripts/validate-content.mjs`
- [ ] No duplicate questions

## Resources
- [AB-731 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-731)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add MCQ bank for AB-731: GenAI Business Value, M365 AI Apps, Adoption Strategy" `
  --label "type:content,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-731 MCQ         #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-731"; Title="[content] Add MCQ bank for AB-731: GenAI Business Value, M365 AI Apps, Adoption Strategy"; Type="mcq" }

# ── AB-731 | 3/3 · Study Notes ───────────────────────────────────────────────
$body = @'
## Exam
**AB-731: AI Transformation Leader**
**Vendor:** Microsoft

## Summary
Author 3 domain-aligned study note files for AB-731, written for business leaders (no code, strategy-focused).

## Notes to Create
| File | Domain |
|------|--------|
| `ab731-d1-genai-business-value.md` | Business value of generative AI solutions |
| `ab731-d2-microsoft-ai-apps.md` | Benefits, capabilities & opportunities for Microsoft AI apps/services |
| `ab731-d3-implementation-adoption.md` | Implementation & adoption strategy for Microsoft AI apps/services |

## Content Requirements per Note
- Executive summary callout (what a business leader needs to know)
- Key concept definitions table
- Comparison tables (e.g. Copilot vs Foundry Tools, build vs buy vs extend)
- Decision framework / flowchart (Mermaid diagram)
- Responsible AI principles quick reference
- "What to remember" exam summary section

## Acceptance Criteria
- [ ] 3 Markdown note files created under `public/content/skillup/ab731/notes/`
- [ ] Each file has frontmatter: `title`, `domain`, `exam`, `updated`
- [ ] Domain files referenced in `public/content/skillup/ab731/index.json` `domains[].notesFile`
- [ ] Notes render correctly on the exam study page
- [ ] Business-leader tone: strategy, governance, ROI — no code blocks

## Resources
- [AB-731 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-731)
- [Microsoft Responsible AI](https://www.microsoft.com/en-us/ai/responsible-ai)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add study notes for AB-731: GenAI Business Value, M365 AI Apps, Adoption Strategy" `
  --label "type:content,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-731 Notes       #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-731"; Title="[content] Add study notes for AB-731: GenAI Business Value, M365 AI Apps, Adoption Strategy"; Type="notes" }

# ═════════════════════════════════════════════════════════════════════════════
# AB-730  AI Business Professional
# ═════════════════════════════════════════════════════════════════════════════

# ── AB-730 | 1/3 · Exam Onboarding ───────────────────────────────────────────
$body = @'
## Exam
**AB-730: AI Business Professional**
**Vendor:** Microsoft
**Level:** Associate
**Passing score:** 700 / 1000

## Summary
Add the AB-730 exam track to the SkillUp catalog — exam page, route, nav entry, and metadata JSON. This exam targets business users who use Copilot and agents in daily work (no coding).

## Exam Domains
| # | Domain | Weight |
|---|--------|--------|
| 1 | Understand generative AI fundamentals | 25–30% |
| 2 | Manage prompts and conversations by using AI | 35–40% |
| 3 | Draft and analyze business content by using AI | 25–30% |

## Acceptance Criteria
- [ ] `public/content/skillup/ab730/index.json` created with exam metadata (title, domains, passScore, accentColor)
- [ ] Exam route registered in the platform router
- [ ] AB-730 card appears in the SkillUp catalog grid
- [ ] Exam detail page loads without errors (even with empty question files)
- [ ] Nav / catalog links to `/skillup/ab730`
- [ ] Milestone set to `v2.0 — Content Expansion`

## Color scheme suggestion
`accentColor: "#0891b2"` (cyan — practitioner / productivity)

## Resources
- [AB-730 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-730)
- [Microsoft 365 Copilot Docs](https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/microsoft-365-copilot)

## Out of Scope
- MCQ question bank (tracked separately)
- Study notes (tracked separately)
'@

$url = gh issue create --repo $repo `
  --title "[feat] Add AB-730: AI Business Professional to exam catalog" `
  --label "type:feat,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-730 Onboarding  #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-730"; Title="[feat] Add AB-730: AI Business Professional to exam catalog"; Type="onboarding" }

# ── AB-730 | 2/3 · MCQ Bank ──────────────────────────────────────────────────
$body = @'
## Exam
**AB-730: AI Business Professional**
**Vendor:** Microsoft

## Summary
Author and publish a minimum of 60 MCQ questions covering all three AB-730 exam domains. Questions should reflect real Copilot UI workflows and end-user business contexts (no coding).

## Domain Coverage
| # | Domain | Weight | Target Qs |
|---|--------|--------|-----------|
| 1 | Understand generative AI fundamentals | 25–30% | 18 |
| 2 | Manage prompts and conversations by using AI | 35–40% | 24 |
| 3 | Draft and analyze business content by using AI | 25–30% | 18 |

## Key Topics per Domain
**Domain 1 — GenAI Fundamentals:**
- How Copilot keeps data private and secure
- Context influence on Copilot responses (files, web, app)
- Chat experience vs agent experience
- When to create a custom agent
- Copilot capabilities per M365 app
- Responsible AI: fabrications, prompt injection, over-reliance, sensitive data risks

**Domain 2 — Manage Prompts & Conversations:**
- Effective prompt construction; referencing resources in prompts
- Saving, scheduling, and sharing prompts
- Finding, renaming, deleting, and adding chats to notebooks
- Agent Store vs creating a custom agent
- Creating agents from templates; configuring knowledge, instructions, capabilities
- Sharing agents with team members

**Domain 3 — Draft & Analyze Business Content:**
- Creating documents from prompts; generating from existing documents
- Management summaries; moving data between M365 apps
- Using Copilot for meetings
- Copilot Pages for collaboration
- How Copilot memory and instructions work

## Acceptance Criteria
- [ ] ≥ 60 MCQ questions across 3 domain files
- [ ] Each question: stem, 4 options, correct answer key, explanation
- [ ] ≥ 5 UI-workflow scenario questions (e.g. "A user wants to… which steps?")
- [ ] Validated by `scripts/validate-content.mjs`
- [ ] No duplicate questions

## Resources
- [AB-730 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-730)
- [Microsoft 365 Copilot Docs](https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/microsoft-365-copilot)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add MCQ bank for AB-730: GenAI Fundamentals, Prompt Management, Business Content" `
  --label "type:content,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-730 MCQ         #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-730"; Title="[content] Add MCQ bank for AB-730: GenAI Fundamentals, Prompt Management, Business Content"; Type="mcq" }

# ── AB-730 | 3/3 · Study Notes ───────────────────────────────────────────────
$body = @'
## Exam
**AB-730: AI Business Professional**
**Vendor:** Microsoft

## Summary
Author 3 domain-aligned study note files for AB-730, written for business users. Practical, task-oriented, with UI workflow examples.

## Notes to Create
| File | Domain |
|------|--------|
| `ab730-d1-genai-fundamentals.md` | Understand generative AI fundamentals |
| `ab730-d2-prompts-conversations.md` | Manage prompts and conversations by using AI |
| `ab730-d3-business-content.md` | Draft and analyze business content by using AI |

## Content Requirements per Note
- Plain-English concept explanations (no jargon overload)
- Step-by-step workflow walkthroughs (e.g. "How to save a prompt in Copilot")
- Comparison tables (e.g. Agent Store agent vs custom agent; chat vs agent experience)
- Screenshot callout blocks (describe what the UI shows — no actual images required)
- Responsible AI quick reference (Domain 1)
- "What to remember" exam summary section

## Acceptance Criteria
- [ ] 3 Markdown note files created under `public/content/skillup/ab730/notes/`
- [ ] Each file has frontmatter: `title`, `domain`, `exam`, `updated`
- [ ] Domain files referenced in `public/content/skillup/ab730/index.json` `domains[].notesFile`
- [ ] Notes render correctly on the exam study page
- [ ] End-user tone: practical, workflow-focused, no code blocks

## Resources
- [AB-730 Study Guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-730)
- [M365 Copilot Community Hub](https://techcommunity.microsoft.com/category/microsoft365copilot)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add study notes for AB-730: GenAI Fundamentals, Prompt Management, Business Content" `
  --label "type:content,domain:exam,P2-medium" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "AB-730 Notes       #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="AB-730"; Title="[content] Add study notes for AB-730: GenAI Fundamentals, Prompt Management, Business Content"; Type="notes" }

# ─────────────────────────────────────────────────────────────────────────────
# Output summary
# ─────────────────────────────────────────────────────────────────────────────
Write-Host "`n=== AB Exam Backlog Summary ==="
$results | Format-Table -AutoSize

$json = $results | ConvertTo-Json -Depth 3
$json | Out-File "$PSScriptRoot\..\ab-exam-backlog-result.json"
Write-Host "`nResults saved to ab-exam-backlog-result.json"
