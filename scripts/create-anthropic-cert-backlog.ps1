#!/usr/bin/env pwsh
# Creates 9 backlog issues (onboarding + MCQ + study notes) for 3 Anthropic certifications:
#   CCARF  Claude Certified Associate – Foundations
#   CCDF   Claude Certified Developer – Foundations
#   CCAP   Claude Certified Architect – Professional
#
# Prerequisites: gh auth login must be active.
# Labels used: type:feat  type:content  domain:exam  P2-medium  vendor:anthropic
# Run: pwsh scripts/create-anthropic-cert-backlog.ps1

$repo    = "ajeetchouksey/ajch_platform"
$results = @()

# ─────────────────────────────────────────────────────────────────────────────
# Helper: ensure labels exist (creates if missing, skips on 409 conflict)
# ─────────────────────────────────────────────────────────────────────────────
function Ensure-Label($name, $color, $desc) {
    gh label create $name --repo $repo --color $color --description $desc 2>&1 | Out-Null
}
Ensure-Label "type:feat"        "7c3aed" "New feature or capability"
Ensure-Label "type:content"     "0ea5e9" "Study notes, MCQs, exams, blog posts"
Ensure-Label "domain:exam"      "2563eb" "Exam framework and content"
Ensure-Label "P2-medium"        "ca8a04" "Scheduled in upcoming milestone"
Ensure-Label "vendor:anthropic" "d97706" "Anthropic certification content"

Write-Host "Labels verified.`n"

# ═════════════════════════════════════════════════════════════════════════════
# CCARF  Claude Certified Associate – Foundations
# ═════════════════════════════════════════════════════════════════════════════

# ── CCARF | 1/3 · Exam Onboarding ────────────────────────────────────────────
$body = @'
## Exam
**Claude Certified Associate – Foundations (CCA-F)**
**Vendor:** Anthropic
**Level:** Associate / Foundations
**Questions:** 60 | **Duration:** 120 min | **Passing score:** 720 / 1000 (scaled)
**Price:** $99 USD | **Validity:** 12 months
**Delivery:** Online proctored or Pearson test center

## Summary
Add the CCA-F exam track to the SkillUp catalog — exam page, route, nav entry, and metadata JSON.

## Exam Domains
| # | Domain | Weight |
|---|--------|--------|
| 1 | Output Evaluation and Validation | 21% |
| 2 | Workflow Integration and Solution Design | 16% |
| 3 | Governance, Risk, and Responsible Use | 15% |
| 4 | Prompting and Task Execution | 14% |
| 5 | Product and Model Selection | 12% |
| 6 | Configuration and Knowledge Management | 12% |
| 7 | Troubleshooting and Optimization | 10% |

## Acceptance Criteria
- [ ] `public/content/skillup/ccarf/index.json` created with exam metadata (title, domains, passScore, accentColor)
- [ ] Exam route registered in the platform router
- [ ] CCA-F card appears in the SkillUp catalog grid
- [ ] Exam detail page loads without errors (even with empty question files)
- [ ] Nav / catalog links to `/skillup/ccarf`
- [ ] `domain:exam` and `vendor:anthropic` labels applied, milestone set

## Resources
- [Official Exam Page](https://anthropic-partners.skilljar.com/claude-certified-associate-foundations-certification)
- [Exam Guide PDF](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542847%2FClaude+Certified+Associate+%E2%80%93+Foundations+Exam+Guide.pdf)
- [Anthropic Docs](https://docs.anthropic.com)

## Out of Scope
- MCQ question bank (tracked separately)
- Study notes (tracked separately)
'@

$url = gh issue create --repo $repo `
  --title "[feat] Add CCA-F: Claude Certified Associate – Foundations to SkillUp catalog" `
  --label "type:feat,domain:exam,P2-medium,vendor:anthropic" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "CCARF Onboarding   #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="CCA-F"; Title="[feat] Add CCA-F: Claude Certified Associate – Foundations to SkillUp catalog"; Type="onboarding" }

# ── CCARF | 2/3 · MCQ Bank ───────────────────────────────────────────────────
$body = @'
## Exam
**Claude Certified Associate – Foundations (CCA-F)**
**Vendor:** Anthropic

## Summary
Author and publish a minimum of 60 MCQ questions covering all seven CCA-F exam domains.

## Domain Coverage
| # | Domain | Weight | Target Qs |
|---|--------|--------|-----------|
| 1 | Output Evaluation and Validation | 21% | 13 |
| 2 | Workflow Integration and Solution Design | 16% | 10 |
| 3 | Governance, Risk, and Responsible Use | 15% | 9 |
| 4 | Prompting and Task Execution | 14% | 8 |
| 5 | Product and Model Selection | 12% | 7 |
| 6 | Configuration and Knowledge Management | 12% | 7 |
| 7 | Troubleshooting and Optimization | 10% | 6 |

## Key Topics per Domain
**Domain 1 — Output Evaluation and Validation:**
- Evaluating Claude responses for accuracy, completeness, and relevance
- Output quality metrics, rubrics, and evaluation frameworks
- Identifying hallucinations and factual errors

**Domain 2 — Workflow Integration and Solution Design:**
- Integrating Claude into existing business workflows
- Designing end-to-end solutions with Claude
- API usage patterns, batching, streaming

**Domain 3 — Governance, Risk, and Responsible Use:**
- Anthropic's Acceptable Use Policy and safety guidelines
- Responsible AI principles: fairness, transparency, accountability
- Data privacy considerations, GDPR/CCPA relevance

**Domain 4 — Prompting and Task Execution:**
- System prompts, user prompts, multi-turn conversations
- Few-shot prompting, chain-of-thought, role assignment
- Formatting instructions, output constraints

**Domain 5 — Product and Model Selection:**
- Claude model family: Haiku, Sonnet, Opus — tradeoffs
- Choosing models by use case, latency, cost
- Claude.ai vs API, Workspaces, enterprise tier

**Domain 6 — Configuration and Knowledge Management:**
- Projects, memory, knowledge sources
- System prompt configuration best practices
- Context window management

**Domain 7 — Troubleshooting and Optimization:**
- Diagnosing degraded outputs
- Prompt iteration, temperature/top-p tuning
- Rate limits, error codes, retry strategies

## Acceptance Criteria
- [ ] Minimum 60 MCQ questions authored across all 7 domains
- [ ] Questions stored in `public/content/skillup/ccarf/questions/ccarf-domain*.json`
- [ ] Each question has: stem, 4 options, correct answer key, explanation
- [ ] Question bank validated by `scripts/validate-content.mjs`
- [ ] No duplicate questions within or across domain files

## Resources
- [Official Exam Guide PDF](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542847%2FClaude+Certified+Associate+%E2%80%93+Foundations+Exam+Guide.pdf)
- [Anthropic Docs](https://docs.anthropic.com)
- [Claude Model Overview](https://docs.anthropic.com/en/docs/about-claude/models/overview)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add MCQ bank for CCA-F: Output Evaluation, Workflow Integration, Governance, Prompting" `
  --label "type:content,domain:exam,P2-medium,vendor:anthropic" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "CCARF MCQ          #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="CCA-F"; Title="[content] Add MCQ bank for CCA-F: Output Evaluation, Workflow Integration, Governance, Prompting"; Type="mcq" }

# ── CCARF | 3/3 · Study Notes ────────────────────────────────────────────────
$body = @'
## Exam
**Claude Certified Associate – Foundations (CCA-F)**
**Vendor:** Anthropic

## Summary
Author domain-aligned study notes for CCA-F covering all seven exam domains.

## Notes to Create
| File | Domain |
|------|--------|
| `ccarf-d1-output-evaluation.md` | Output Evaluation and Validation |
| `ccarf-d2-workflow-integration.md` | Workflow Integration and Solution Design |
| `ccarf-d3-governance-risk.md` | Governance, Risk, and Responsible Use |
| `ccarf-d4-prompting-task-execution.md` | Prompting and Task Execution |
| `ccarf-d5-product-model-selection.md` | Product and Model Selection |
| `ccarf-d6-config-knowledge-mgmt.md` | Configuration and Knowledge Management |
| `ccarf-d7-troubleshooting-optimization.md` | Troubleshooting and Optimization |

## Content Requirements per Note
- Key concepts cheat-sheet (table format)
- Exam tip callouts for commonly-tested items
- Comparison tables (e.g. Haiku vs Sonnet vs Opus, Projects vs API)
- Mermaid diagram where helpful (e.g. prompt → output evaluation flow)
- "What to remember" summary section

## Acceptance Criteria
- [ ] 7 Markdown note files created under `public/content/skillup/ccarf/notes/`
- [ ] Each file has frontmatter: `title`, `domain`, `exam`, `updated`
- [ ] Domain files referenced in `public/content/skillup/ccarf/index.json` `domains[].notesFile`
- [ ] Notes render correctly on the exam study page
- [ ] Spell-checked and reviewed for accuracy against official exam guide

## Resources
- [Official Exam Guide PDF](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542847%2FClaude+Certified+Associate+%E2%80%93+Foundations+Exam+Guide.pdf)
- [Anthropic Docs](https://docs.anthropic.com)
- [Anthropic Responsible AI](https://www.anthropic.com/responsible-disclosure-policy)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add study notes for CCA-F: all 7 domains" `
  --label "type:content,domain:exam,P2-medium,vendor:anthropic" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "CCARF Notes        #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="CCA-F"; Title="[content] Add study notes for CCA-F: all 7 domains"; Type="notes" }

# ═════════════════════════════════════════════════════════════════════════════
# CCDF  Claude Certified Developer – Foundations
# ═════════════════════════════════════════════════════════════════════════════

# ── CCDF | 1/3 · Exam Onboarding ─────────────────────────────────────────────
$body = @'
## Exam
**Claude Certified Developer – Foundations (CCD-F)**
**Vendor:** Anthropic
**Level:** Developer / Foundations
**Questions:** 53 | **Duration:** 120 min | **Passing score:** 720 / 1000 (scaled)
**Price:** $125 USD | **Validity:** 12 months
**Delivery:** Online proctored or Pearson test center

## Summary
Add the CCD-F exam track to the SkillUp catalog — exam page, route, nav entry, and metadata JSON.

## Exam Domains
| # | Domain | Weight |
|---|--------|--------|
| 1 | Applications and Integration | 33.1% |
| 2 | Model Selection and Optimization | 16.8% |
| 3 | Agents and Workflows | 14.7% |
| 4 | Prompt and Context Engineering | 11.0% |
| 5 | Tools and MCPs | 10.6% |
| 6 | Security and Safety | 8.1% |
| 7 | Claude Code | 3.1% |
| 8 | Eval, Testing, and Debugging | 2.6% |

## Acceptance Criteria
- [ ] `public/content/skillup/ccdf/index.json` created with exam metadata (title, domains, passScore, accentColor)
- [ ] Exam route registered in the platform router
- [ ] CCD-F card appears in the SkillUp catalog grid
- [ ] Exam detail page loads without errors (even with empty question files)
- [ ] Nav / catalog links to `/skillup/ccdf`
- [ ] `domain:exam` and `vendor:anthropic` labels applied, milestone set

## Resources
- [Official Exam Page](https://anthropic-partners.skilljar.com/claude-certified-developer-foundations-certification)
- [Exam Guide PDF](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542875%2FClaude+Certified+Developer+%E2%80%93+Foundations+Exam+Guide.pdf)
- [Anthropic API Docs](https://docs.anthropic.com)
- [MCP Documentation](https://modelcontextprotocol.io)

## Out of Scope
- MCQ question bank (tracked separately)
- Study notes (tracked separately)
'@

$url = gh issue create --repo $repo `
  --title "[feat] Add CCD-F: Claude Certified Developer – Foundations to SkillUp catalog" `
  --label "type:feat,domain:exam,P2-medium,vendor:anthropic" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "CCDF Onboarding    #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="CCD-F"; Title="[feat] Add CCD-F: Claude Certified Developer – Foundations to SkillUp catalog"; Type="onboarding" }

# ── CCDF | 2/3 · MCQ Bank ────────────────────────────────────────────────────
$body = @'
## Exam
**Claude Certified Developer – Foundations (CCD-F)**
**Vendor:** Anthropic

## Summary
Author and publish a minimum of 53 MCQ questions covering all eight CCD-F exam domains.

## Domain Coverage
| # | Domain | Weight | Target Qs |
|---|--------|--------|-----------|
| 1 | Applications and Integration | 33.1% | 18 |
| 2 | Model Selection and Optimization | 16.8% | 9 |
| 3 | Agents and Workflows | 14.7% | 8 |
| 4 | Prompt and Context Engineering | 11.0% | 6 |
| 5 | Tools and MCPs | 10.6% | 6 |
| 6 | Security and Safety | 8.1% | 4 |
| 7 | Claude Code | 3.1% | 2 |
| 8 | Eval, Testing, and Debugging | 2.6% | 2 |

## Key Topics per Domain
**Domain 1 — Applications and Integration:**
- Claude API: Messages API, streaming, batching
- SDKs (Python, TypeScript), client libraries
- Embeddings, multimodal inputs, vision capabilities
- Webhook integrations, serverless deployment patterns

**Domain 2 — Model Selection and Optimization:**
- Claude Haiku / Sonnet / Opus tradeoffs (cost, latency, capability)
- Context window sizes, token counting
- Cost optimization strategies, caching
- Extended thinking / reasoning models

**Domain 3 — Agents and Workflows:**
- Single-agent vs multi-agent architectures
- Orchestration patterns (sequential, parallel, hierarchical)
- Tool use in agentic loops, human-in-the-loop
- Memory: in-context, external (vector DBs), structured

**Domain 4 — Prompt and Context Engineering:**
- System prompts, user turns, assistant turns
- Chain-of-thought, few-shot examples, XML tagging
- Context window management, prompt caching
- Structured output with JSON mode

**Domain 5 — Tools and MCPs:**
- Tool/function calling: definition, invocation, result handling
- Model Context Protocol (MCP): servers, clients, transport
- Building custom MCP servers
- Tool choice strategies (auto, any, specific)

**Domain 6 — Security and Safety:**
- Prompt injection and jailbreak mitigations
- Input/output validation, guardrails
- Anthropic's safety layers: Constitutional AI, RLHF
- Sensitive data handling, secrets management

**Domain 7 — Claude Code:**
- Claude Code CLI usage, sub-agents, headless mode
- Custom slash commands, CLAUDE.md configuration
- Agentic coding workflows

**Domain 8 — Eval, Testing, and Debugging:**
- Evaluation frameworks: LLM-as-judge, human eval
- A/B testing prompts, regression testing
- Debugging streaming errors, tool call failures

## Acceptance Criteria
- [ ] Minimum 53 MCQ questions authored across all 8 domains
- [ ] Questions stored in `public/content/skillup/ccdf/questions/ccdf-domain*.json`
- [ ] Each question has: stem, 4 options, correct answer key, explanation
- [ ] Question bank validated by `scripts/validate-content.mjs`
- [ ] No duplicate questions within or across domain files

## Resources
- [Official Exam Guide PDF](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542875%2FClaude+Certified+Developer+%E2%80%93+Foundations+Exam+Guide.pdf)
- [Anthropic API Reference](https://docs.anthropic.com/en/api)
- [MCP Docs](https://modelcontextprotocol.io)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add MCQ bank for CCD-F: API Integration, Agents, Tools/MCP, Prompt Engineering, Security" `
  --label "type:content,domain:exam,P2-medium,vendor:anthropic" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "CCDF MCQ           #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="CCD-F"; Title="[content] Add MCQ bank for CCD-F: API Integration, Agents, Tools/MCP, Prompt Engineering, Security"; Type="mcq" }

# ── CCDF | 3/3 · Study Notes ─────────────────────────────────────────────────
$body = @'
## Exam
**Claude Certified Developer – Foundations (CCD-F)**
**Vendor:** Anthropic

## Summary
Author domain-aligned study notes for CCD-F covering all eight exam domains.

## Notes to Create
| File | Domain |
|------|--------|
| `ccdf-d1-applications-integration.md` | Applications and Integration |
| `ccdf-d2-model-selection-optimization.md` | Model Selection and Optimization |
| `ccdf-d3-agents-workflows.md` | Agents and Workflows |
| `ccdf-d4-prompt-context-engineering.md` | Prompt and Context Engineering |
| `ccdf-d5-tools-mcp.md` | Tools and MCPs |
| `ccdf-d6-security-safety.md` | Security and Safety |
| `ccdf-d7-claude-code.md` | Claude Code |
| `ccdf-d8-eval-testing-debugging.md` | Eval, Testing, and Debugging |

## Content Requirements per Note
- Key concepts cheat-sheet (table format)
- Exam tip callouts for commonly-tested items
- Code snippets for API usage patterns
- Comparison tables (e.g. tool use vs MCP, Haiku vs Opus)
- Mermaid diagram where helpful (e.g. agentic loop, MCP architecture)
- "What to remember" summary section

## Acceptance Criteria
- [ ] 8 Markdown note files created under `public/content/skillup/ccdf/notes/`
- [ ] Each file has frontmatter: `title`, `domain`, `exam`, `updated`
- [ ] Domain files referenced in `public/content/skillup/ccdf/index.json` `domains[].notesFile`
- [ ] Notes render correctly on the exam study page
- [ ] Spell-checked and reviewed for accuracy against official exam guide

## Resources
- [Official Exam Guide PDF](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542875%2FClaude+Certified+Developer+%E2%80%93+Foundations+Exam+Guide.pdf)
- [Anthropic API Docs](https://docs.anthropic.com)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add study notes for CCD-F: all 8 domains" `
  --label "type:content,domain:exam,P2-medium,vendor:anthropic" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "CCDF Notes         #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="CCD-F"; Title="[content] Add study notes for CCD-F: all 8 domains"; Type="notes" }

# ═════════════════════════════════════════════════════════════════════════════
# CCAP  Claude Certified Architect – Professional
# ═════════════════════════════════════════════════════════════════════════════

# ── CCAP | 1/3 · Exam Onboarding ─────────────────────────────────────────────
$body = @'
## Exam
**Claude Certified Architect – Professional (CCA-P)**
**Vendor:** Anthropic
**Level:** Architect / Professional
**Questions:** 63 | **Duration:** 120 min | **Passing score:** 720 / 1000 (scaled)
**Price:** $175 USD | **Validity:** 12 months
**Delivery:** Online proctored or Pearson test center

## Summary
Add the CCA-P exam track to the SkillUp catalog — exam page, route, nav entry, and metadata JSON.

## Exam Domains
| # | Domain | Weight |
|---|--------|--------|
| 1 | Integration | 19% |
| 2 | Solution Design & Architecture | 17% |
| 3 | Evaluation, Testing & Optimization | 16% |
| 4 | Governance, Safety & Risk Management | 14% |
| 5 | Stakeholder Communication & Lifecycle Management | 14% |
| 6 | Claude Models, Prompting & Context Engineering | 13% |
| 7 | Developer Productivity & Operational Enablement | 7% |

## Acceptance Criteria
- [ ] `public/content/skillup/ccap/index.json` created with exam metadata (title, domains, passScore, accentColor)
- [ ] Exam route registered in the platform router
- [ ] CCA-P card appears in the SkillUp catalog grid
- [ ] Exam detail page loads without errors (even with empty question files)
- [ ] Nav / catalog links to `/skillup/ccap`
- [ ] `domain:exam` and `vendor:anthropic` labels applied, milestone set

## Resources
- [Official Exam Page](https://anthropic-partners.skilljar.com/claude-certified-architect-professional-certification)
- [Exam Guide PDF](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542810%2FClaude+Certified+Architect+%E2%80%93+Professional+Exam+Guide.pdf)
- [Anthropic Docs](https://docs.anthropic.com)

## Out of Scope
- MCQ question bank (tracked separately)
- Study notes (tracked separately)
'@

$url = gh issue create --repo $repo `
  --title "[feat] Add CCA-P: Claude Certified Architect – Professional to SkillUp catalog" `
  --label "type:feat,domain:exam,P2-medium,vendor:anthropic" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "CCAP Onboarding    #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="CCA-P"; Title="[feat] Add CCA-P: Claude Certified Architect – Professional to SkillUp catalog"; Type="onboarding" }

# ── CCAP | 2/3 · MCQ Bank ────────────────────────────────────────────────────
$body = @'
## Exam
**Claude Certified Architect – Professional (CCA-P)**
**Vendor:** Anthropic

## Summary
Author and publish a minimum of 63 MCQ questions covering all seven CCA-P exam domains.

## Domain Coverage
| # | Domain | Weight | Target Qs |
|---|--------|--------|-----------|
| 1 | Integration | 19% | 12 |
| 2 | Solution Design & Architecture | 17% | 11 |
| 3 | Evaluation, Testing & Optimization | 16% | 10 |
| 4 | Governance, Safety & Risk Management | 14% | 9 |
| 5 | Stakeholder Communication & Lifecycle Management | 14% | 9 |
| 6 | Claude Models, Prompting & Context Engineering | 13% | 8 |
| 7 | Developer Productivity & Operational Enablement | 7% | 4 |

## Key Topics per Domain
**Domain 1 — Integration:**
- Enterprise API integration patterns at scale
- Authentication (API keys, OAuth, SSO federation)
- Middleware, gateways, rate limiting at enterprise scale
- Integration with Salesforce, ServiceNow, Microsoft 365, Slack
- Event-driven architectures, webhooks, pub/sub

**Domain 2 — Solution Design & Architecture:**
- Enterprise agentic architecture blueprints
- Multi-agent topologies: supervisor, swarm, pipeline
- Retrieval-Augmented Generation (RAG) at scale: chunking, indexing, reranking
- Context window strategy: compression, summarisation, tiered memory
- Hybrid human-AI workflows, approval gates

**Domain 3 — Evaluation, Testing & Optimization:**
- Building evaluation pipelines and benchmarking frameworks
- LLM-as-judge, human annotation, automated regression suites
- Latency profiling, throughput optimisation, cost modelling
- Prompt version control, A/B testing infrastructure
- Canary deployments for model updates

**Domain 4 — Governance, Safety & Risk Management:**
- Enterprise AI governance frameworks (NIST AI RMF, ISO 42001)
- Audit trails, explainability requirements, compliance reporting
- Anthropic's usage policies in enterprise contexts
- Risk tiers: sensitive data, regulated industries, PII
- Incident response for AI system failures

**Domain 5 — Stakeholder Communication & Lifecycle Management:**
- Communicating AI capabilities and limitations to non-technical stakeholders
- Change management, adoption roadmaps
- ROI measurement, KPI frameworks for AI initiatives
- Vendor management, SLA negotiation with AI providers
- Managing deprecation cycles (model versioning, migration planning)

**Domain 6 — Claude Models, Prompting & Context Engineering:**
- Advanced prompt engineering: multi-step reasoning, reflection patterns
- Extended thinking / interleaved thinking
- System prompt architecture for large organisations
- Context engineering: retrieval, compression, prefill
- Fine-tuning considerations vs prompt-based customisation

**Domain 7 — Developer Productivity & Operational Enablement:**
- Internal AI tooling platforms, prompt libraries
- Claude Code in enterprise engineering workflows
- Developer onboarding, documentation standards
- Observability: logging, tracing, alerting for LLM calls
- Cost attribution and chargeback models

## Acceptance Criteria
- [ ] Minimum 63 MCQ questions authored across all 7 domains
- [ ] Questions stored in `public/content/skillup/ccap/questions/ccap-domain*.json`
- [ ] Each question has: stem, 4 options, correct answer key, explanation
- [ ] Question bank validated by `scripts/validate-content.mjs`
- [ ] No duplicate questions within or across domain files
- [ ] Questions reflect professional/expert difficulty (scenario-based, multi-step reasoning)

## Resources
- [Official Exam Guide PDF](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542810%2FClaude+Certified+Architect+%E2%80%93+Professional+Exam+Guide.pdf)
- [Anthropic Docs](https://docs.anthropic.com)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
- [MCP Docs](https://modelcontextprotocol.io)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add MCQ bank for CCA-P: Integration, Architecture, Evaluation, Governance, Lifecycle" `
  --label "type:content,domain:exam,P2-medium,vendor:anthropic" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "CCAP MCQ           #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="CCA-P"; Title="[content] Add MCQ bank for CCA-P: Integration, Architecture, Evaluation, Governance, Lifecycle"; Type="mcq" }

# ── CCAP | 3/3 · Study Notes ─────────────────────────────────────────────────
$body = @'
## Exam
**Claude Certified Architect – Professional (CCA-P)**
**Vendor:** Anthropic

## Summary
Author domain-aligned study notes for CCA-P covering all seven exam domains.

## Notes to Create
| File | Domain |
|------|--------|
| `ccap-d1-integration.md` | Integration |
| `ccap-d2-solution-design-architecture.md` | Solution Design & Architecture |
| `ccap-d3-evaluation-testing-optimization.md` | Evaluation, Testing & Optimization |
| `ccap-d4-governance-safety-risk.md` | Governance, Safety & Risk Management |
| `ccap-d5-stakeholder-lifecycle.md` | Stakeholder Communication & Lifecycle Management |
| `ccap-d6-models-prompting-context.md` | Claude Models, Prompting & Context Engineering |
| `ccap-d7-developer-productivity.md` | Developer Productivity & Operational Enablement |

## Content Requirements per Note
- Key concepts cheat-sheet (table format)
- Exam tip callouts for professional-level traps
- Architecture diagrams (Mermaid) — e.g. enterprise RAG pipeline, multi-agent topology
- Comparison tables (e.g. governance frameworks, memory tier strategies)
- Decision frameworks (e.g. "when to use extended thinking")
- "What to remember" summary section

## Acceptance Criteria
- [ ] 7 Markdown note files created under `public/content/skillup/ccap/notes/`
- [ ] Each file has frontmatter: `title`, `domain`, `exam`, `updated`
- [ ] Domain files referenced in `public/content/skillup/ccap/index.json` `domains[].notesFile`
- [ ] Notes render correctly on the exam study page
- [ ] Content reflects Professional-level depth (architectural decisions, trade-offs, enterprise context)
- [ ] Spell-checked and reviewed for accuracy against official exam guide

## Resources
- [Official Exam Guide PDF](https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542810%2FClaude+Certified+Architect+%E2%80%93+Professional+Exam+Guide.pdf)
- [Anthropic Docs](https://docs.anthropic.com)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
'@

$url = gh issue create --repo $repo `
  --title "[content] Add study notes for CCA-P: all 7 domains" `
  --label "type:content,domain:exam,P2-medium,vendor:anthropic" `
  --body $body 2>&1
$num = $url -replace '.*issues/(\d+).*','$1'
Write-Host "CCAP Notes         #$num  $url"
$results += [pscustomobject]@{ Number="$num"; Exam="CCA-P"; Title="[content] Add study notes for CCA-P: all 7 domains"; Type="notes" }

# ─────────────────────────────────────────────────────────────────────────────
# Write results JSON
# ─────────────────────────────────────────────────────────────────────────────
$results | ConvertTo-Json -Depth 3 | Set-Content "anthropic-cert-backlog-result.json" -Encoding UTF8
Write-Host "`nDone — 9 issues created. Results saved to anthropic-cert-backlog-result.json"
$results | Format-Table -AutoSize
