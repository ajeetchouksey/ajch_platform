param([string]$Repo = "ajeetchouksey/ajch_platform")

$LABELS = "MSMVPAI,agentic-ai,p2,usecase"
$PARENT = 339

$useCases = @(
  # ── Manufacturing ────────────────────────────────────────────────────────
  @{
    title   = "[usecase][manufacturing] Quality Control Vision Agent"
    file    = "quality-control-vision-agent.json"
    vertical= "manufacturing"
    pattern = "Trigger → Extract → Validate → Route"
    problem = "Assembly-line QC teams manually inspect components, averaging 3-8 defects per 1,000 units that escape into field — each costing $400-1,200 in returns/rework."
    solution= "An AI vision agent streams images from line cameras, runs defect-detection inference (Azure AI Vision / Custom Vision), classifies defect type and severity, and routes: pass → conveyor continue; minor defect → rework queue; critical → line halt + supervisor HITL alert."
    ac      = @(
      "Vision model classifies defect type (scratch, crack, misalignment, foreign object)",
      "Severity scoring: pass / rework / reject / halt",
      "HITL alert to supervisor for line-halt decisions",
      "Audit log: image + classification + action + timestamp",
      "Case JSON file created in cases/ and index.json count updated",
      "index.json manufacturing count updated"
    )
  }
  @{
    title   = "[usecase][manufacturing] Supply Chain Disruption Alert Agent"
    file    = "supply-chain-disruption-alert.json"
    vertical= "manufacturing"
    pattern = "Research → Synthesise → Generate"
    problem = "Procurement teams learn about supply disruptions (port closures, supplier insolvency, weather events) hours to days late — leading to production stoppages costing $50k–500k/day."
    solution= "Agent monitors news APIs, supplier portals, and logistics feeds. On disruption signal: synthesises impact assessment (affected SKUs, lead-time delta, estimated cost), generates alternative supplier shortlist, routes to procurement lead for approval before issuing RFQs."
    ac      = @(
      "Monitors ≥3 external feeds (news, logistics, supplier portal)",
      "Impact assessment: affected SKUs, lead-time delta, cost estimate",
      "Alternative supplier shortlist with contact details",
      "HITL gate before sending RFQs",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][manufacturing] Predictive Maintenance IoT Agent"
    file    = "predictive-maintenance-iot.json"
    vertical= "manufacturing"
    pattern = "Trigger → Extract → Validate → Route"
    problem = "Reactive maintenance causes unplanned downtime averaging 800 hours/year per plant. Maintenance teams lack early-warning signals from sensor data."
    solution= "Agent ingests IoT sensor streams (vibration, temperature, pressure). Anomaly detection model flags equipment approaching failure threshold. Agent generates maintenance work order, assigns technician, orders parts — all before failure occurs. Critical failures escalate to plant manager via HITL."
    ac      = @(
      "Ingests sensor data from Azure IoT Hub / Event Hub",
      "Anomaly detection with configurable thresholds per equipment type",
      "Auto-creates maintenance work order in CMMS",
      "Parts ordering recommendation with cost approval gate",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][manufacturing] Factory Shift Handover Agent"
    file    = "factory-shift-handover-agent.json"
    vertical= "manufacturing"
    pattern = "Document RAG + Research → Synthesise → Generate"
    problem = "Shift handovers take 20-30 minutes of verbal briefing, key issues get lost, and incoming teams often restart work already in progress — costing 1-2 hours of productive time per shift."
    solution= "Agent reads MES (Manufacturing Execution System) logs, quality alerts, maintenance tickets, and production KPIs for the ending shift. Generates a structured handover report: output vs target, open issues, equipment status, pending tasks. Outgoing supervisor approves before distribution."
    ac      = @(
      "Reads MES logs, quality alerts, maintenance tickets",
      "Structured report: output, quality, equipment, pending tasks",
      "Supervisor approval before distribution",
      "Report delivered to incoming shift via Teams / email",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }

  # ── Banking ───────────────────────────────────────────────────────────────
  @{
    title   = "[usecase][banking] Loan Application Underwriting Agent"
    file    = "loan-application-underwriting.json"
    vertical= "banking"
    pattern = "Document RAG + HITL Approval Gate"
    problem = "Manual underwriting takes 3-7 days per application. Loan officers spend 60% of time gathering documents and running credit checks — delaying decisions and losing customers to faster competitors."
    solution= "Agent extracts data from uploaded documents (pay stubs, bank statements, ID), runs credit bureau API, computes debt-to-income ratio, flags risk factors, and presents a structured credit memo to the underwriter for final HITL decision. Approvals under threshold can be auto-approved."
    ac      = @(
      "Document extraction: income, assets, liabilities from uploaded files",
      "Credit bureau API integration (mock/stub acceptable for demo)",
      "Risk scoring: debt-to-income, LTV, credit score band",
      "HITL decision gate for underwriter with pre-populated credit memo",
      "Auto-approval path for low-risk applications under configured threshold",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][banking] Fraud Dispute Investigation Agent"
    file    = "fraud-dispute-investigation.json"
    vertical= "banking"
    pattern = "Trigger → Extract → Validate → Route + HITL"
    problem = "Fraud analysts manually review 200-500 dispute cases/day. Each case requires pulling transaction history, merchant data, and prior dispute patterns — averaging 20 minutes per case."
    solution= "On dispute submission, agent pulls transaction history, merchant profile, geo-velocity analysis, and prior dispute record. Generates a case summary with fraud likelihood score. Low-confidence cases → analyst HITL queue with pre-built summary. High-confidence fraud → auto-provisional credit + chargeback initiation."
    ac      = @(
      "Transaction history extraction and pattern analysis",
      "Geo-velocity and merchant risk scoring",
      "Prior dispute record lookup",
      "Auto-provisional credit for high-confidence fraud cases",
      "Analyst HITL queue with case summary for ambiguous cases",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][banking] KYC Document Verification Agent"
    file    = "kyc-document-verification.json"
    vertical= "banking"
    pattern = "Document Eval + Structured Output + HITL"
    problem = "KYC onboarding takes 5-10 business days due to manual document review. Compliance teams process 300-800 applications/month with error rates causing regulatory penalties."
    solution= "Agent extracts and validates identity documents (passport, national ID, proof of address), cross-references against sanctions lists (OFAC, PEP databases), computes risk tier (low/medium/high), and generates a KYC summary. High-risk applicants route to compliance officer HITL."
    ac      = @(
      "ID document extraction: name, DOB, document number, expiry",
      "Proof of address validation: address, date, issuer",
      "Sanctions list check (OFAC / PEP — mock API acceptable)",
      "Risk tier classification with rationale",
      "Compliance HITL for high-risk applications",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][banking] Trade Reconciliation Agent"
    file    = "trade-reconciliation-agent.json"
    vertical= "banking"
    pattern = "Parallel Subagents + HITL Approval Gate"
    problem = "Operations teams spend 4-6 hours daily matching trades across custody, settlement, and internal systems. Unmatched trades trigger costly fails (penalty fees, counterparty disputes)."
    solution= "Agent runs parallel subagents per trading book: each matches trades between internal OMS and counterparty confirmations. Exceptions (value mismatch, missing confirmation, wrong settlement date) are classified by severity — auto-resolved where possible, escalated to ops analyst for review within 30 minutes of trade date."
    ac      = @(
      "Parallel matching across ≥2 systems (OMS + settlement)",
      "Exception classification: value break, missing confirm, date mismatch",
      "Auto-resolution for known exception types (e.g. rounding differences < $0.01)",
      "Ops analyst HITL queue for unresolved exceptions",
      "Exception aging alert if unresolved > 2 hours",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }

  # ── Retail ────────────────────────────────────────────────────────────────
  @{
    title   = "[usecase][retail] Product Return Resolution Agent"
    file    = "product-return-resolution-agent.json"
    vertical= "retail"
    pattern = "Trigger → Extract → Validate → Route"
    problem = "Return processing averages 8-12 minutes per case due to manual policy lookup, eligibility checking, and refund/exchange routing. Customer satisfaction drops when resolution takes >24 hours."
    solution= "Customer submits return request (order ID, reason, photos). Agent validates against return policy (window, condition, category), determines resolution (full refund, exchange, store credit, deny), and routes to the appropriate system. Edge cases and high-value items route to customer service HITL."
    ac      = @(
      "Order lookup and eligibility check against return policy",
      "Reason classification: defective, wrong item, changed mind, etc.",
      "Resolution routing: refund / exchange / store credit / deny",
      "Photo analysis for condition assessment (optional AI vision step)",
      "HITL for high-value items (> configurable threshold) and policy exceptions",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][retail] Inventory Demand Forecasting Agent"
    file    = "inventory-demand-forecasting.json"
    vertical= "retail"
    pattern = "Research → Synthesise → Generate"
    problem = "Buyers manually forecast demand using spreadsheets, leading to 15-25% overstock on slow movers and 8-12% stockouts on fast movers — costing 3-6% of revenue."
    solution= "Agent pulls 12-month sales history, promotional calendar, seasonal indices, and external signals (weather, local events, competitor pricing). Generates SKU-level demand forecast with reorder recommendations. Buyer reviews and approves purchase orders before submission."
    ac      = @(
      "Sales history ingestion (12-month minimum)",
      "Seasonal decomposition and trend extraction",
      "External signal integration (at least one: weather / events / pricing)",
      "SKU-level forecast with confidence interval",
      "Reorder recommendation with quantity and lead-time",
      "Buyer HITL approval before PO submission",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][retail] Personalised Promotion Engine Agent"
    file    = "personalised-promotion-engine.json"
    vertical= "retail"
    pattern = "Research → Synthesise → Generate + HITL"
    problem = "Marketing teams send the same promotion to all customers, achieving 1-3% conversion. Personalised offers require data science resources unavailable to most mid-market retailers."
    solution= "Agent segments customers by purchase history, browsing behaviour, and CLV tier. For each segment, generates personalised offer variants (discount depth, product selection, messaging). Marketing lead approves offer set before deployment. Agent tracks redemption rates and feeds back into the next cycle."
    ac      = @(
      "Customer segmentation: ≥3 segments based on purchase and behaviour data",
      "Offer generation: product selection + discount + copy per segment",
      "Marketing HITL approval before campaign launch",
      "A/B variant generation for subject line / offer",
      "Redemption tracking and feedback loop noted in architecture",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][retail] Store Operations Incident Logger Agent"
    file    = "store-ops-incident-logger.json"
    vertical= "retail"
    pattern = "Trigger → Extract → Validate → Route"
    problem = "Store incidents (slips, theft, equipment failure, customer complaints) are logged inconsistently in spreadsheets or email — leading to compliance gaps and unresolved safety issues."
    solution= "Staff submit incident via mobile form or voice. Agent extracts: incident type, location, severity, involved parties. Classifies urgency, generates structured incident report, routes to safety manager (critical) or store ops log (minor). Regulatory incidents auto-flagged for compliance team."
    ac      = @(
      "Multi-channel intake: form, voice-to-text, chat",
      "Incident classification: safety, theft, equipment, complaint, other",
      "Severity routing: critical → safety manager alert, minor → ops log",
      "Regulatory flag for incidents requiring OSHA / food safety reporting",
      "Structured report with timestamp, location, parties, description",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][retail] Supplier Invoice Reconciliation Agent"
    file    = "supplier-invoice-reconciliation.json"
    vertical= "retail"
    pattern = "Document Eval + Structured Output + HITL"
    problem = "AP teams manually match 500-2,000 supplier invoices/month against POs and GRNs — taking 3-5 minutes per invoice with 2-4% error rate causing duplicate payments and missed discounts."
    solution= "Agent extracts invoice data (supplier, line items, amounts, terms), matches against open POs and goods received notes. Perfect matches auto-post. Discrepancies (price variance, quantity mismatch, missing PO) route to AP analyst with pre-populated dispute draft. Early payment discount opportunities flagged to finance."
    ac      = @(
      "Invoice data extraction: supplier, line items, amounts, payment terms",
      "3-way match: invoice vs PO vs GRN",
      "Auto-post for perfect matches",
      "Discrepancy routing to AP analyst with dispute draft",
      "Early payment discount detection and finance alert",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }

  # ── HR ────────────────────────────────────────────────────────────────────
  @{
    title   = "[usecase][hr] Performance Review Drafting Agent"
    file    = "performance-review-drafting.json"
    vertical= "hr"
    pattern = "Document RAG + Research → Synthesise → Generate"
    problem = "Managers spend 3-5 hours per direct report writing performance reviews — pulling data from OKR tools, project trackers, and peer feedback. Reviews are often inconsistent and rating-anchored rather than evidence-based."
    solution= "Agent gathers OKR completion rates, project contributions, peer feedback themes, and 1:1 notes. Synthesises a structured draft review: achievements, development areas, rating rationale. Manager reviews, edits, and approves before HR submission. Ensures consistent language and evidence-based ratings."
    ac      = @(
      "Data ingestion: OKR tool, project tracker, peer feedback, 1:1 notes",
      "Draft structured review: achievements, development areas, rating rationale",
      "Manager HITL edit-and-approve workflow",
      "Calibration flag if rating is 2+ bands from team average",
      "Consistent language check (no bias indicators)",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][hr] Job Description Generator Agent"
    file    = "job-description-generator.json"
    vertical= "hr"
    pattern = "Research → Synthesise → Generate + HITL"
    problem = "Recruiters spend 45-90 minutes writing each JD, often copying from stale templates. Inconsistent JDs reduce applicant quality and create compliance risks (non-inclusive language, missing requirements)."
    solution= "Recruiter provides role brief (title, team, key skills, level, location). Agent generates 3 JD variants: concise (LinkedIn), detailed (careers page), inclusive-optimised. Runs bias-language check. Hiring manager reviews and selects/edits. Final JD auto-posted to ATS."
    ac      = @(
      "Input: role title, team, key skills, level, location, salary band",
      "3 JD variants: concise / detailed / inclusive-optimised",
      "Bias language detection and suggested alternatives",
      "Hiring manager HITL approval",
      "Auto-post to ATS on approval (mock API acceptable)",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][hr] Employee Offboarding Checklist Agent"
    file    = "offboarding-checklist-agent.json"
    vertical= "hr"
    pattern = "Trigger → Extract → Validate → Route + Parallel Subagents"
    problem = "Offboarding is poorly coordinated — IT leaves access active for an average of 11 days post-departure, knowledge transfer is inconsistent, and exit interview completion rates are under 40%."
    solution= "Exit trigger (resignation accepted or termination) fires orchestrator. Parallel subagents: AccessAgent (schedules Entra ID / SaaS revocation on last day), KnowledgeAgent (generates knowledge transfer plan from employee's docs and projects), ExitAgent (schedules exit interview, sends survey). Manager reviews transfer plan before execution."
    ac      = @(
      "Trigger: HRIS resignation or termination event",
      "AccessAgent: schedules access revocation for last working day",
      "KnowledgeAgent: generates transfer plan from docs and project history",
      "ExitAgent: schedules interview and sends survey",
      "Manager HITL for knowledge transfer plan approval",
      "Audit trail: all revocations logged with timestamps",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][hr] Leave Policy Q&A RAG Agent"
    file    = "leave-policy-qa-agent.json"
    vertical= "hr"
    pattern = "Document RAG"
    problem = "HR teams receive 50-200 repetitive leave policy questions/month via email and Slack. Each takes 5-15 minutes to answer, pulling HR away from strategic work. Answers are often inconsistent."
    solution= "RAG agent over HR policy documents (leave policy, employee handbook, local statutory requirements). Employee asks a question in natural language. Agent retrieves relevant policy sections, synthesises a clear cited answer, and logs the Q&A. Unresolvable questions escalate to HR Business Partner."
    ac      = @(
      "RAG over ≥3 policy documents (leave policy, handbook, statutory reqs)",
      "Answer includes cited source section",
      "Handles: annual leave, sick leave, parental leave, public holidays, carry-over",
      "Escalation path for questions outside policy scope",
      "Q&A log for HR to identify policy gaps",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }

  # ── Technology ────────────────────────────────────────────────────────────
  @{
    title   = "[usecase][technology] Incident Postmortem Agent"
    file    = "incident-postmortem-agent.json"
    vertical= "technology"
    pattern = "Document RAG + Research → Synthesise → Generate"
    problem = "Postmortems take 4-8 hours to write manually. Engineers pull PagerDuty timelines, Slack threads, runbooks, and monitoring charts — often producing shallow root-cause analysis under time pressure."
    solution= "Agent ingests PagerDuty incident timeline, relevant Slack thread, monitoring alerts, and runbook steps taken. Synthesises: incident summary, timeline, root cause (5-why), contributing factors, customer impact, action items. SRE lead reviews and approves before publishing. Blameless language enforced."
    ac      = @(
      "Ingests PagerDuty timeline, Slack thread (via API/export), monitoring alerts",
      "5-why root cause analysis",
      "Customer impact quantification (duration × affected users/services)",
      "Action items with suggested owner and due date",
      "Blameless language check",
      "SRE lead HITL review before publish",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][technology] Code Review Summary Agent"
    file    = "code-review-summary-agent.json"
    vertical= "technology"
    pattern = "Document Eval + Structured Output"
    problem = "Reviewers spend 20-40 minutes understanding context before reviewing a PR. Large PRs (500+ lines) are frequently rubber-stamped, missing security and logic issues."
    solution= "Agent reads PR diff, linked issue/ticket, and related code context. Generates: change summary (what changed and why), risk areas (security, performance, breaking changes), suggested reviewer focus areas, and a complexity score. Posted as PR comment before human review begins."
    ac      = @(
      "PR diff analysis: changed files, functions, dependencies",
      "Linked issue/ticket context extraction",
      "Change summary: what, why, how",
      "Risk classification: security / performance / breaking change / none",
      "Suggested reviewer focus areas",
      "Complexity score with rationale",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][technology] Release Notes Generator Agent"
    file    = "release-notes-generator.json"
    vertical= "technology"
    pattern = "Research → Synthesise → Generate + HITL"
    problem = "Engineering managers spend 1-3 hours per release compiling commit messages, Jira tickets, and Slack updates into release notes. Notes are often too technical for stakeholders or too vague for developers."
    solution= "Agent reads merged PRs, linked Jira tickets, and milestone issues between two tags. Classifies changes (feature, fix, breaking change, deprecation, performance). Generates three-audience release notes: developer changelog, product manager summary, and customer-facing what's new. PM approves before publish."
    ac      = @(
      "Ingests merged PRs and linked tickets between two Git tags",
      "Change classification: feature / fix / breaking / deprecation / perf",
      "Three-audience output: technical changelog, PM summary, customer what's new",
      "Breaking change prominent callout",
      "PM HITL approval before publishing",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][technology] Cloud Cost Anomaly Alert Agent"
    file    = "cloud-cost-anomaly-alert.json"
    vertical= "technology"
    pattern = "Trigger → Extract → Validate → Route"
    problem = "Engineering teams discover cloud overspend weeks after the fact via monthly billing. Untagged resources, forgotten dev environments, and mis-configured auto-scaling cost organisations $50k-500k/year in waste."
    solution= "Agent polls cloud billing API daily. Anomaly detection flags: day-over-day spike > 20%, new untagged resources, service cost exceeding budget threshold, orphaned resources (storage, IPs, snapshots). Generates cost report with specific culprit resources and remediation steps. FinOps team HITL for actions > $500 impact."
    ac      = @(
      "Daily billing API poll (Azure Cost Management / AWS Cost Explorer)",
      "Anomaly detection: day-over-day spike, threshold breach, untagged resources",
      "Orphaned resource detection (storage, IPs, snapshots, idle VMs)",
      "Remediation recommendations with estimated savings",
      "FinOps HITL for high-impact actions",
      "Weekly cost summary report to engineering leads",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
  @{
    title   = "[usecase][technology] Security Alert Triage Agent"
    file    = "security-triage-agent.json"
    vertical= "technology"
    pattern = "Trigger → Extract → Validate → Route + HITL"
    problem = "SOC analysts manually triage 500-2,000 SIEM alerts/day. Over 90% are false positives, causing alert fatigue and missed real threats buried in noise."
    solution= "Agent ingests SIEM alerts, enriches with threat intel (IP reputation, CVE lookup, user behaviour baseline), computes severity score. Low-severity false positives are auto-suppressed with rationale. Medium → analyst queue with enriched context. High/Critical → immediate SOC lead notification + incident creation. Response SLA enforced."
    ac      = @(
      "SIEM alert ingestion (Sentinel / Splunk — mock acceptable)",
      "Threat intel enrichment: IP reputation, CVE, user baseline",
      "Severity scoring: critical / high / medium / low / false-positive",
      "Auto-suppression of confirmed false positives with audit log",
      "Analyst HITL queue for medium severity",
      "SLA enforcement: critical alerts escalate if unacknowledged > 15 min",
      "Case JSON file created in cases/ and index.json count updated"
    )
  }
)

Write-Host "Creating $($useCases.Count) sub-issues for #$PARENT..."
$createdNumbers = @()

foreach ($uc in $useCases) {
  $acLines = $uc.ac | ForEach-Object { "- [ ] $_" }
  $body = @"
## Parent Issue
Closes part of #$PARENT — Use Case Library (Q2)

## Use Case File
``$($uc.file)`` → public/content/usecases/cases/

## Vertical
$($uc.vertical)

## Agentic Pattern
$($uc.pattern)

## Problem Statement
$($uc.problem)

## Solution Overview
$($uc.solution)

## Acceptance Criteria
$($acLines -join "`n")
"@

  $num = gh issue create `
    --repo $Repo `
    --title $uc.title `
    --body $body `
    --label $LABELS 2>&1

  if ($num -match "https://github.com/.*/issues/(\d+)") {
    $issueNum = $Matches[1]
    $createdNumbers += $issueNum
    Write-Host "  Created #$issueNum : $($uc.title)"
  } else {
    Write-Host "  ERROR: $num"
  }

  Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "Created issues: $($createdNumbers -join ', ')"
Write-Host "Now linking as sub-issues of #$PARENT..."

foreach ($n in $createdNumbers) {
  $id = (gh api "repos/$Repo/issues/$n" --jq '.id').Trim()
  $result = gh api `
    --method POST `
    "repos/$Repo/issues/$PARENT/sub_issues" `
    -f sub_issue_id=$id 2>&1
  Write-Host "  Linked #$n (db_id=$id) → parent #$PARENT : $result"
  Start-Sleep -Milliseconds 300
}

Write-Host "Done."




