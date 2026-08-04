#!/usr/bin/env python3
"""
Expand all 14 featured use case JSON files with rich technical content.
Adds: techStack, failureModes, scalingConsiderations, integrations
Run: python scripts/expand-uc-content.py
"""

import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
CASES_DIR = ROOT / "public/content/usecases/cases"

# ── Technical expansions per use case ────────────────────────────────────────

EXPANSIONS = {

  "invoice-ops-hitl": {
    "techStack": [
      { "category": "Document AI", "tools": ["Azure Form Recognizer", "AWS Textract", "Google Document AI"] },
      { "category": "LLM", "tools": ["claude-3-5-haiku (extraction)", "claude-3-5-sonnet (validation)"] },
      { "category": "Workflow Engine", "tools": ["Temporal", "AWS Step Functions", "Prefect"] },
      { "category": "Storage", "tools": ["PostgreSQL (audit log)", "S3/Blob (documents)", "Redis (idempotency keys)"] },
      { "category": "ERP / Finance", "tools": ["SAP S/4HANA", "Oracle NetSuite", "Microsoft Dynamics 365"] },
    ],
    "failureModes": [
      { "mode": "Extraction hallucination on low-quality scan", "mitigation": "Confidence threshold gate — route to HITL if extraction score < 0.85; store raw OCR alongside structured output for audit." },
      { "mode": "ERP write failure causes duplicate posting on retry", "mitigation": "Idempotency key (invoice_id + fiscal_period) stored in Redis; ERP adapter checks key before posting and returns 200 if already applied." },
      { "mode": "HITL queue backlog during month-end processing", "mitigation": "Priority queue with SLA timer; auto-escalate to manager after 4 hours; route high-value invoices to dedicated reviewers." },
      { "mode": "PO system unavailable during validation", "mitigation": "Circuit breaker with fallback to cached PO snapshot (TTL 1h); mark invoice as 'pending PO validation' and retry async." },
    ],
    "scalingConsiderations": [
      "Use async email-to-queue fanout (SQS/Service Bus) to decouple ingestion from processing — handles burst at month-end without dropping invoices.",
      "Batch extraction for PDF-to-structured jobs; single-pass models (Form Recognizer) are 3–5× cheaper than multi-turn LLM extraction for standard templates.",
      "HITL queue capacity: plan for 15–20% manual review rate on first deployment; drops to 3–5% after 90 days of fine-tuning on company-specific invoice formats.",
      "ERP write throughput: apply back-pressure — max 50 concurrent ERP writes to avoid lock contention on the GL tables.",
    ],
    "integrations": [
      { "system": "Email / Mailbox", "type": "Trigger", "note": "Microsoft Exchange / Gmail via Graph API or IMAP listener" },
      { "system": "ERP (SAP / NetSuite)", "type": "Write", "note": "BAPI or REST API for GL posting; must be idempotent" },
      { "system": "PO / Procurement System", "type": "Read", "note": "Validates invoice against open purchase orders" },
      { "system": "Document Storage (S3 / Blob)", "type": "Write", "note": "Archives raw PDF + structured JSON for audit" },
      { "system": "Approval Workflow (ServiceNow / Jira)", "type": "HITL", "note": "Routes exceptions to human reviewers with full context" },
    ],
  },

  "aml-parallel-hitl": {
    "techStack": [
      { "category": "LLM", "tools": ["claude-3-5-haiku (typology classification)", "GPT-4o-mini (SAR narrative draft)"] },
      { "category": "Rules Engine", "tools": ["NICE Actimize", "Drools", "custom Python rule evaluator"] },
      { "category": "Watchlist API", "tools": ["OFAC SDN API", "Dow Jones Risk & Compliance", "Refinitiv World-Check"] },
      { "category": "Workflow", "tools": ["Temporal (parallel activity dispatch)", "Kafka (event streaming)"] },
      { "category": "Case Management", "tools": ["Verint FICA", "Oracle FCCM", "custom PostgreSQL case store"] },
    ],
    "failureModes": [
      { "mode": "Watchlist API timeout breaks parallel fan-out", "mitigation": "Per-agent timeout with partial-result aggregation; flag transaction for deferred re-check rather than blocking the entire pipeline." },
      { "mode": "High false-positive rate triggers alert fatigue", "mitigation": "Calibrate threshold with monthly tuning loop; track precision/recall per rule; introduce feedback loop from analyst verdicts back into scoring weights." },
      { "mode": "SAR narrative contains hallucinated transaction details", "mitigation": "Narrative generation uses only structured fields passed in context (no retrieval); post-generation diff check against source data before submission." },
      { "mode": "Regulatory deadline missed on SAR filing", "mitigation": "30-day clock starts at alert creation; automated reminders at 20 and 25 days; hard escalation to compliance officer at day 28." },
    ],
    "scalingConsiderations": [
      "Parallel agent fan-out cuts latency from O(n) to O(1) for independent checks — critical for real-time card authorization use cases.",
      "Throughput limit: watchlist APIs typically rate-limit at 100–500 req/s; use request pooling and local cache for repeat entity lookups within a 24h window.",
      "Scoring model drift: retrain threshold monthly using analyst verdicts as ground truth; track false-positive rate as a platform SLO.",
      "SAR volume compliance: most institutions file 500–5000 SARs/month; agent can handle 10× that with no human bottleneck on standard cases.",
    ],
    "integrations": [
      { "system": "Core Banking System", "type": "Read", "note": "Transaction feed via Kafka or database CDC" },
      { "system": "OFAC / Watchlist APIs", "type": "Read", "note": "Real-time sanctions and PEP screening" },
      { "system": "Case Management (FCCM)", "type": "Write", "note": "Creates and updates AML alert cases" },
      { "system": "FinCEN / Regulatory Portal", "type": "Write", "note": "SAR submission via BSA e-Filing API" },
      { "system": "Analyst Workstation", "type": "HITL", "note": "Serves full transaction context and draft SAR for review" },
    ],
  },

  "investor-helpdesk": {
    "techStack": [
      { "category": "Embedding", "tools": ["text-embedding-3-large (OpenAI)", "voyage-finance-2 (Voyage AI)"] },
      { "category": "Vector Store", "tools": ["pgvector (PostgreSQL)", "Pinecone", "Weaviate"] },
      { "category": "LLM", "tools": ["claude-3-5-sonnet (answer generation)", "claude-3-haiku (reranking prompt)"] },
      { "category": "Reranker", "tools": ["Cohere Rerank v3", "cross-encoder/ms-marco-MiniLM-L-6-v2"] },
      { "category": "Access Control", "tools": ["JWT claims → pre-filter SQL", "OPA (Open Policy Agent)"] },
    ],
    "failureModes": [
      { "mode": "Answer cites wrong fund performance figures", "mitigation": "Ground answer strictly to retrieved chunks — no parametric knowledge for financial data; add citation check that each figure in the answer has a source reference." },
      { "mode": "Entitlement filter bypass serves restricted fund data", "mitigation": "Pre-filter applied at vector search time (WHERE investor_tier IN (…)), not post-retrieval; security audit on every retrieval path change." },
      { "mode": "Embedding index staleness after NAV update", "mitigation": "Event-driven re-embed on document publish event (not scheduled batch); use document version hash to detect changes and trigger incremental re-indexing." },
      { "mode": "Reranker latency causes P99 > 3s for complex queries", "mitigation": "Cap reranking to top-20 candidates; apply async prefetch on common query patterns; cache reranker scores for repeated query/document pairs." },
    ],
    "scalingConsiderations": [
      "Vector index size: at 10,000 fund documents × 500 chunks/doc = 5M vectors; pgvector handles this with HNSW index; Pinecone recommended above 50M vectors.",
      "Embedding refresh cadence: NAV and performance data updates daily — use change-data-capture to trigger incremental re-embed rather than full re-index.",
      "Latency SLA: wealth management investors expect < 2s response; pre-compute embeddings for top-100 recurring query patterns as cache layer.",
      "Multi-tenancy: isolate vector namespaces per fund family to prevent cross-contamination of proprietary product data.",
    ],
    "integrations": [
      { "system": "Document Management (SharePoint / S3)", "type": "Read", "note": "Source of fund fact sheets, prospectuses, performance reports" },
      { "system": "CRM (Salesforce / Dynamics)", "type": "Read", "note": "Investor tier and entitlement data for RBAC pre-filter" },
      { "system": "Market Data (Bloomberg / Refinitiv)", "type": "Read", "note": "Real-time NAV and benchmark data for freshness check" },
      { "system": "Investor Portal", "type": "Serve", "note": "Web UI or chatbot widget exposing the Q&A interface" },
      { "system": "Audit Log (SIEM)", "type": "Write", "note": "All queries and retrieved chunks logged for compliance" },
    ],
  },

  "soc2-compliance-eval": {
    "techStack": [
      { "category": "LLM", "tools": ["claude-3-5-sonnet (report parsing + evaluation)", "claude-3-haiku (section extraction)"] },
      { "category": "Document Processing", "tools": ["PyPDF2 / pdfplumber (PDF parsing)", "LlamaParse (structured extraction)"] },
      { "category": "Storage", "tools": ["PostgreSQL (control catalog + eval results)", "S3 (report archive)"] },
      { "category": "Workflow", "tools": ["Python async pipeline", "Celery (long-running eval jobs)"] },
      { "category": "Reporting", "tools": ["Jinja2 templates (markdown reports)", "Confluence / Notion API (publish)"] },
    ],
    "failureModes": [
      { "mode": "LLM misidentifies which section covers a control", "mitigation": "Section extraction uses exact SOC 2 heading patterns (Type I/II nomenclature); human spot-check on first run per auditor; low-confidence evals flagged for manual review." },
      { "mode": "Control catalog grows stale vs. framework updates", "mitigation": "Version-pin the control catalog with effective dates; quarterly review by GRC team; changes trigger re-evaluation of existing reports." },
      { "mode": "Report structure varies wildly across auditors", "mitigation": "Multi-pass extraction: try structured heading parse first, fall back to semantic search if structure not found; log parsing method used per report." },
      { "mode": "Gap narrative misrepresents actual risk level", "mitigation": "Risk severity mapping is rule-based (not LLM-generated) — deterministic mapping from coverage score to risk tier; LLM only writes prose around the determined tier." },
    ],
    "scalingConsiderations": [
      "Typical SOC 2 report: 80–200 pages; full eval run takes 3–8 minutes per report at claude-3-5-sonnet pricing — acceptable for quarterly compliance cycles.",
      "Control catalog size: 60–120 controls typical; each requires one extraction pass + one evaluation call; batch and cache intermediate section extractions to avoid re-parsing.",
      "Multi-standard support (SOC 2 + ISO 27001 + PCI DSS): same architecture, swap control catalog; maintain separate eval pipelines per standard.",
    ],
    "integrations": [
      { "system": "GRC Platform (ServiceNow GRC / Archer)", "type": "Write", "note": "Pushes evaluation results and remediation items to risk register" },
      { "system": "Document Store (SharePoint / S3)", "type": "Read", "note": "Source of third-party SOC 2 reports" },
      { "system": "Ticketing (Jira / ServiceNow)", "type": "Write", "note": "Creates remediation tasks for each identified gap" },
      { "system": "Confluence / Notion", "type": "Write", "note": "Publishes evaluation summary report for stakeholders" },
    ],
  },

  "policy-qa-rag": {
    "techStack": [
      { "category": "Embedding", "tools": ["text-embedding-3-small (cost-efficient for insurance corpus)", "voyage-law-2 (domain-tuned)"] },
      { "category": "Vector Store", "tools": ["pgvector", "Qdrant (recommended for filter-heavy queries)"] },
      { "category": "LLM", "tools": ["claude-3-5-haiku (query rewriting)", "claude-3-5-sonnet (answer + citations)"] },
      { "category": "Query Processing", "tools": ["Custom jargon normalizer", "SpaCy NER for policy entity detection"] },
      { "category": "Confidence Scoring", "tools": ["Custom logistic regression on retrieval scores", "Self-ask chain-of-thought verification"] },
    ],
    "failureModes": [
      { "mode": "Policy jargon in query not matched to indexed terminology", "mitigation": "Query rewriter normalises: 'TPD' → 'total permanent disability'; maintain insurance term dictionary; test with real adjuster queries before go-live." },
      { "mode": "Stale section retrieved after policy amendment", "mitigation": "Section-level versioning with effective_date field; pre-filter retrieval to latest version by default; archived versions accessible with explicit flag." },
      { "mode": "Low-confidence answer delivered without disclaimer", "mitigation": "Confidence score gate: < 0.70 triggers 'I cannot confirm this — please consult the policy document directly' response template." },
      { "mode": "Multi-policy query retrieves from wrong product line", "mitigation": "Namespace isolation per product line (home, auto, life, commercial); query classifier routes to correct namespace before retrieval." },
    ],
    "scalingConsiderations": [
      "Policy corpus size: large insurer has 500–2000 policy documents; section-level chunking at ~800 tokens yields 50,000–200,000 vectors — manageable in pgvector with HNSW.",
      "Query volume: claims adjuster use case sees 50–200 queries/day per user; embed caching for repeated queries reduces cost by 30–40%.",
      "Policy amendment cadence: regulatory changes may require re-indexing 10–20% of corpus quarterly; design for incremental rather than full re-index.",
    ],
    "integrations": [
      { "system": "Policy Administration System (Majesco / Guidewire)", "type": "Read", "note": "Source of truth for policy documents and amendments" },
      { "system": "Claims Management System", "type": "Serve", "note": "Embedded Q&A widget in claims adjuster workflow" },
      { "system": "Compliance Document Store", "type": "Read", "note": "Regulatory filings and state-specific endorsements" },
      { "system": "SIEM / Audit Log", "type": "Write", "note": "All queries logged for E&O compliance" },
    ],
  },

  "policy-memo-writer": {
    "techStack": [
      { "category": "LLM", "tools": ["claude-3-5-sonnet (multi-pass summarization + memo drafting)", "claude-3-haiku (structural pass)"] },
      { "category": "Document Retrieval", "tools": ["Trafilatura (web scraping)", "PyPDF2 (PDF parsing)", "Requests + BeautifulSoup"] },
      { "category": "Templating", "tools": ["Jinja2 (memo template rendering)", "python-docx (Word output)"] },
      { "category": "Fact Checking", "tools": ["Self-ask chain-of-thought", "Citation extraction + source URL pinning"] },
      { "category": "Output", "tools": ["Markdown → HTML", "Microsoft Word export", "Email delivery"] },
    ],
    "failureModes": [
      { "mode": "LLM fabricates a statutory reference not in the source", "mitigation": "Every factual claim must link to a direct quote from the parsed document; citation check step compares each claim against retrieved text before memo is released." },
      { "mode": "Legislation website changes structure, breaking parser", "mitigation": "Use multiple fallback parsers (Trafilatura → BeautifulSoup → PDF download); alert on parse failures; human review gate if primary parser fails." },
      { "mode": "Multi-section synthesis loses nuance of exceptions and carve-outs", "mitigation": "Preserve section-level summaries as structured data before synthesis; exceptions/carve-outs extracted with dedicated prompt pass." },
    ],
    "scalingConsiderations": [
      "Typical memo generation: 3–5 LLM calls (structural pass, section summaries, cross-section synthesis, compliance check, formatting); total ~30–60s at sonnet pricing.",
      "For high-volume policy teams (50+ memos/month): pre-cache parsed document structure; only re-run synthesis when a new amendment is detected.",
      "Multi-jurisdiction support: parameterise by jurisdiction (US federal, state, EU, UK); maintain jurisdiction-specific templates and citation styles.",
    ],
    "integrations": [
      { "system": "Federal / State Legislative Portals", "type": "Read", "note": "Scrape or download bill text and regulatory filings" },
      { "system": "Regulatory Database (Westlaw / LexisNexis)", "type": "Read", "note": "Cross-reference with existing case law and regulations" },
      { "system": "Document Management (SharePoint)", "type": "Write", "note": "Archives final memo with version history" },
      { "system": "Email / Teams", "type": "Write", "note": "Delivers memo to policy team for review" },
    ],
  },

  "inbound-lead-magnet": {
    "techStack": [
      { "category": "Lead Scoring", "tools": ["Claude classification (industry, company size, intent signals)", "Clearbit / Apollo enrichment"] },
      { "category": "LLM", "tools": ["claude-3-5-haiku (lead scoring + email draft)", "GPT-4o-mini (A/B variant generation)"] },
      { "category": "CRM", "tools": ["Salesforce (CRM record creation)", "HubSpot", "Pipedrive"] },
      { "category": "Email", "tools": ["SendGrid", "AWS SES", "Postmark (transactional)"] },
      { "category": "Workflow", "tools": ["n8n / Zapier (trigger orchestration)", "Custom FastAPI webhook handler"] },
    ],
    "failureModes": [
      { "mode": "Lead enrichment returns stale company data (M&A, rebranding)", "mitigation": "TTL cache on enrichment data (7 days); flag low-confidence enrichments for human QA; use multiple enrichment sources and take majority." },
      { "mode": "Personalised email contains wrong company or role details", "mitigation": "Template sanity check: verify all {{variables}} are populated before send; staging send to internal inbox for visual QA on first 50 leads." },
      { "mode": "CRM duplicate created for returning lead", "mitigation": "Upsert by email (dedupe key); check existing records before insert; merge logic for same-company different-contact scenarios." },
      { "mode": "High-fit leads missed due to miscalibrated scoring model", "mitigation": "Sales feedback loop: reps mark leads as 'should have been prioritised'; retrain scoring prompt monthly; track lead-to-opportunity conversion by score tier." },
    ],
    "scalingConsiderations": [
      "Enrichment cost: Clearbit ~$0.05–0.10/lead; for high-volume (10,000+ leads/month), gate enrichment behind score threshold to avoid enriching all spam.",
      "Email send timing: personalised email within 5 minutes of form submit shows 3× higher open rates; prioritise queue processing for hot leads.",
      "CRM sync latency: Salesforce API rate limits at 100 calls/s; use bulk upsert endpoint for batch processing; real-time upsert for high-priority leads only.",
    ],
    "integrations": [
      { "system": "Web Form / Landing Page", "type": "Trigger", "note": "Webhook on form submit (Typeform, HubSpot forms, custom)" },
      { "system": "Clearbit / Apollo / ZoomInfo", "type": "Read", "note": "Lead enrichment — company size, industry, tech stack" },
      { "system": "CRM (Salesforce / HubSpot)", "type": "Write", "note": "Creates/updates lead record with score and context" },
      { "system": "Email Platform (SendGrid / SES)", "type": "Write", "note": "Sends personalised nurture email" },
      { "system": "Slack / Teams", "type": "Write", "note": "Notifies sales rep for high-score leads" },
    ],
  },

  "city-council-summary": {
    "techStack": [
      { "category": "Transcription / Diarization", "tools": ["OpenAI Whisper-large-v3", "AWS Transcribe (speaker diarization)", "AssemblyAI (speaker labels)"] },
      { "category": "LLM", "tools": ["claude-3-5-haiku (per-segment topic tagging)", "claude-3-5-sonnet (synthesis + minutes)"] },
      { "category": "Topic Classification", "tools": ["Zero-shot classification with Claude", "Custom fine-tuned BERT classifier"] },
      { "category": "Output / Publishing", "tools": ["Markdown → HTML", "CivicPlus / NovusAgenda integration", "WordPress REST API"] },
      { "category": "Storage", "tools": ["PostgreSQL (structured minutes)", "S3 (audio archive)"] },
    ],
    "failureModes": [
      { "mode": "Speaker diarization confuses multiple speakers with similar voices", "mitigation": "Require meeting agenda with speaker list for pre-registration; post-process diarization with name-to-segment alignment using agenda timestamps." },
      { "mode": "Action item captured incorrectly due to vague phrasing ('we should look into that')", "mitigation": "Action item extraction uses structured prompt: requires explicit assignee + verb + deadline; vague items flagged for human confirmation." },
      { "mode": "Technical audio quality too low for transcription accuracy", "mitigation": "Audio quality check (SNR threshold) before processing; reject and alert if below threshold; fallback to manual transcript upload path." },
    ],
    "scalingConsiderations": [
      "Average city council meeting: 2–4 hours audio → 50,000–80,000 words transcript; process in 15-minute segments to stay within context window.",
      "Multiple concurrent meetings (large city): queue-based processing with priority for live meetings; async for recordings.",
      "Retention policy: audio archived for 7 years per most municipal retention schedules; structure storage accordingly.",
    ],
    "integrations": [
      { "system": "Video Conferencing (Zoom / Teams / Webex)", "type": "Read", "note": "Auto-download recording via webhook after meeting ends" },
      { "system": "Agenda Management (NovusAgenda / Granicus)", "type": "Read", "note": "Pre-meeting agenda for topic pre-seeding" },
      { "system": "City Website / CMS", "type": "Write", "note": "Publishes minutes and action items to public portal" },
      { "system": "Email (Mailchimp / GovDelivery)", "type": "Write", "note": "Sends summary digest to subscribed residents" },
    ],
  },

  "internal-audit-testing": {
    "techStack": [
      { "category": "LLM", "tools": ["claude-3-5-sonnet (test logic evaluation + finding narrative)", "claude-3-haiku (sampling criteria generation)"] },
      { "category": "Data Access", "tools": ["Direct SQL (read-only audit role)", "Snowflake / BigQuery (data warehouse queries)", "REST API for ERP data"] },
      { "category": "Workflow", "tools": ["Temporal (durable audit workflow)", "Apache Airflow (scheduled test runs)"] },
      { "category": "Workpaper Generation", "tools": ["python-docx", "Jinja2 templates", "SharePoint upload via Graph API"] },
      { "category": "Evidence Management", "tools": ["Auditboard integration", "TeamMate+ API", "Custom PostgreSQL evidence store"] },
    ],
    "failureModes": [
      { "mode": "SQL query returns sample that misses actual control failures (sample bias)", "mitigation": "Risk-stratified sampling: always include edge cases (month-end transactions, large amounts, new employees); supplement random sample with targeted high-risk queries." },
      { "mode": "LLM misinterprets ambiguous control description", "mitigation": "Control descriptions stored with structured acceptance criteria (not prose); LLM evaluates against boolean criteria, not narrative interpretation." },
      { "mode": "Finding escalated incorrectly due to data quality issue not control failure", "mitigation": "Data quality pre-check before running test logic; data quality exceptions logged separately from control failures." },
      { "mode": "Sensitive financial data in LLM context", "mitigation": "PII masking (employee names → IDs, account numbers → last 4) before passing to LLM; data never leaves enterprise network boundary (on-premise or VPC deployment)." },
    ],
    "scalingConsiderations": [
      "Audit plan scale: 200–500 controls typical for a large bank; prioritize automated testing for high-frequency, data-rich controls (transaction limits, access reviews) over judgment-heavy controls.",
      "Run cadence: quarterly comprehensive audit + monthly continuous monitoring for key controls (SOX-scoped especially).",
      "Workpaper volume: automated testing generates 3–5 pages of workpaper evidence per control; review process must scale accordingly.",
    ],
    "integrations": [
      { "system": "ERP (SAP / Oracle)", "type": "Read", "note": "Transaction data for test population and sample" },
      { "system": "IAM System (Active Directory / Okta)", "type": "Read", "note": "Access and approval chain verification" },
      { "system": "Audit Management (AuditBoard / TeamMate+)", "type": "Write", "note": "Pushes findings, evidence, and workpapers" },
      { "system": "Data Warehouse (Snowflake / BigQuery)", "type": "Read", "note": "Historical transaction data for trend analysis" },
      { "system": "SharePoint", "type": "Write", "note": "Stores workpaper packages in audit folder structure" },
    ],
  },

  "vendor-onboarding": {
    "techStack": [
      { "category": "LLM", "tools": ["claude-3-5-haiku (document completeness check)", "claude-3-5-sonnet (risk narrative)"] },
      { "category": "Screening APIs", "tools": ["Dow Jones Risk & Compliance", "LexisNexis WorldCompliance", "Dun & Bradstreet Supplier Risk"] },
      { "category": "Document Verification", "tools": ["Socure / Onfido (document AI)", "Custom certificate parser (W-9, insurance certs)"] },
      { "category": "Workflow", "tools": ["Temporal (parallel validation)", "ServiceNow Vendor Management"] },
      { "category": "ERP / Procurement", "tools": ["SAP Ariba", "Coupa", "Oracle Procurement Cloud"] },
    ],
    "failureModes": [
      { "mode": "False sanctions match blocks legitimate vendor", "mitigation": "Fuzzy match threshold tuning; human review gate for all sanctions hits before rejection; clear appeal process; log all matches with match score." },
      { "mode": "Expired insurance certificate not detected", "mitigation": "Certificate parser extracts explicit expiry date field; validation rejects certificates expiring within 30 days; renewal reminder automated at 60 days." },
      { "mode": "ERP provisioning fails silently after approval", "mitigation": "ERP API call wrapped in saga pattern; rollback on failure; status field tracks provisioning state; alert on any stalled 'provisioning' status > 24h." },
      { "mode": "Parallel validation creates race condition on shared vendor record", "mitigation": "Optimistic locking on vendor record; each validation agent writes to separate field; coordinator merges results atomically before status update." },
    ],
    "scalingConsiderations": [
      "Onboarding volume: enterprise procurement teams process 500–2000 new vendors/year; automated handling reduces time from 15 days to 2–3 days average.",
      "Screening API cost: ~$5–15/vendor for comprehensive screen; gate expensive screens behind preliminary document completeness check.",
      "ERP provisioning: SAP Ariba API rate limits vary; batch provisioning for non-urgent vendors; real-time for strategic/critical suppliers.",
    ],
    "integrations": [
      { "system": "Vendor Portal / Intake Form", "type": "Trigger", "note": "Web form submission initiates onboarding workflow" },
      { "system": "Sanctions / Risk Screening APIs", "type": "Read", "note": "Dow Jones, LexisNexis, OFAC SDN check" },
      { "system": "Financial Data (D&B / Experian)", "type": "Read", "note": "Credit and financial health assessment" },
      { "system": "ERP (SAP Ariba / Coupa)", "type": "Write", "note": "Creates approved vendor master record" },
      { "system": "Procurement Review Queue (ServiceNow)", "type": "HITL", "note": "Medium-risk vendors routed for human approval" },
    ],
  },

  "investment-proposal-drafting": {
    "techStack": [
      { "category": "LLM", "tools": ["claude-3-5-sonnet (proposal narrative + suitability)", "claude-3-haiku (data formatting)"] },
      { "category": "Portfolio Analytics", "tools": ["FactSet", "Bloomberg PORT", "Custom Python portfolio optimizer"] },
      { "category": "Suitability Engine", "tools": ["Rules-based suitability engine (MiFID II / Reg BI)", "LLM suitability narrative generator"] },
      { "category": "Document Generation", "tools": ["python-docx", "LaTeX (PDF rendering)", "DocuSign (e-signature)"] },
      { "category": "Compliance Check", "tools": ["Compliance rulebook validator", "Automated disclosure checker"] },
    ],
    "failureModes": [
      { "mode": "Proposal recommends product outside client risk tolerance", "mitigation": "Hard constraint layer pre-filters product universe by risk band BEFORE LLM drafts prose; compliance rule engine validates final recommendation independently." },
      { "mode": "Required regulatory disclosures missing from final proposal", "mitigation": "Disclosure checklist applied post-generation; each required disclosure has a presence check; proposal blocked from delivery if any disclosure absent." },
      { "mode": "Portfolio return figures use wrong benchmark", "mitigation": "Benchmark selection is a deterministic rule (client geography × asset class → benchmark ID); LLM receives pre-computed figures, never calculates returns independently." },
    ],
    "scalingConsiderations": [
      "Relationship manager productivity: typical RM spends 4–6 hours on a proposal; agent reduces to 30-minute review + sign-off — enables 5× more proposal throughput.",
      "Regulatory variation: MiFID II (EU), Reg BI (US), MAS FAA (Singapore) have different disclosure requirements; parameterise by jurisdiction.",
      "Proposal versioning: client may request multiple scenario variations (conservative / moderate / aggressive); agent generates all three in parallel for single review session.",
    ],
    "integrations": [
      { "system": "CRM (Salesforce / Dynamics)", "type": "Read", "note": "Client profile, risk tolerance, investment objectives" },
      { "system": "Portfolio Analytics (FactSet / Bloomberg)", "type": "Read", "note": "Historical performance, current holdings, benchmark data" },
      { "system": "Product Catalog (internal)", "type": "Read", "note": "Approved investment products and their suitability profiles" },
      { "system": "DocuSign / Adobe Sign", "type": "Write", "note": "Sends proposal for client and RM e-signature" },
      { "system": "Document Management (SharePoint)", "type": "Write", "note": "Archives signed proposal with version history" },
    ],
  },

  "safety-ops-chatbot": {
    "techStack": [
      { "category": "LLM", "tools": ["claude-3-5-haiku (fast mobile response)", "claude-3-5-sonnet (complex multi-regulation queries)"] },
      { "category": "RAG", "tools": ["pgvector (safety manual embeddings)", "Qdrant (incident database)"] },
      { "category": "Alerting", "tools": ["PagerDuty (safety officer escalation)", "Twilio SMS (site-wide emergency broadcast)"] },
      { "category": "Mobile Interface", "tools": ["Progressive Web App (offline support)", "React Native + offline SQLite fallback"] },
      { "category": "Compliance", "tools": ["OSHA CFR Title 29 document corpus", "ISO 45001 standards library"] },
    ],
    "failureModes": [
      { "mode": "Worker asks hazard question offline (no network on site)", "mitigation": "Critical safety procedures cached locally on device; offline mode serves cached answers with clear staleness warning; sync on reconnect." },
      { "mode": "Chatbot gives wrong PPE recommendation for chemical exposure", "mitigation": "Hazard queries routed to curated regulatory corpus only (SDS sheets + OSHA standards); no parametric model knowledge used for PPE recommendations; source citation required in every answer." },
      { "mode": "Safety officer not alerted for high-severity incident report", "mitigation": "Severity classification is rule-based (keyword match on injury/fatality/fire/chemical release); PagerDuty integration fires immediately on match regardless of LLM response path." },
    ],
    "scalingConsiderations": [
      "Site count: multi-site construction companies have 50–200 active projects; deploy shared corpus with project-specific addendum layer for site-specific procedures.",
      "Query volume: 10–50 safety queries/day per active site; embedding corpus size manageable (<100K vectors for typical safety manual + incident database).",
      "Regulatory update frequency: OSHA standards update infrequently; re-index quarterly or on published change notification.",
    ],
    "integrations": [
      { "system": "Safety Manual (SharePoint / Procore)", "type": "Read", "note": "Source of site procedures, PPE requirements, emergency protocols" },
      { "system": "Incident Management (Procore / Intelex)", "type": "Read/Write", "note": "Historical incident data for RAG; logs new incident reports" },
      { "system": "OSHA / Regulatory Database", "type": "Read", "note": "CFR Title 29, state OSHA standards, SDS sheets" },
      { "system": "PagerDuty / Twilio", "type": "Write", "note": "Real-time alerts for high-severity hazard queries" },
      { "system": "Procore / Safety Culture", "type": "Write", "note": "Logs inspections and corrective actions" },
    ],
  },

  "meeting-prep-agent": {
    "techStack": [
      { "category": "LLM", "tools": ["claude-3-5-haiku (news summarization)", "claude-3-5-sonnet (briefing synthesis + talking points)"] },
      { "category": "Data Sources", "tools": ["LinkedIn Sales Navigator API", "Clearbit Company API", "NewsAPI / Bing News Search"] },
      { "category": "CRM", "tools": ["Salesforce (opportunity context)", "HubSpot CRM", "Pipedrive"] },
      { "category": "Delivery", "tools": ["SendGrid (email briefing)", "Slack Bot (channel notification)", "Salesforce Chatter"] },
      { "category": "Scheduling Integration", "tools": ["Google Calendar API", "Microsoft Graph (Outlook)", "Calendly webhook"] },
    ],
    "failureModes": [
      { "mode": "LinkedIn profile data not found for attendee", "mitigation": "Graceful degradation: brief includes available data (CRM history, company news) and flags missing profile with manual lookup suggestion." },
      { "mode": "News API returns irrelevant or negative articles about the company", "mitigation": "Relevance filter (company name exact match + recency weight); sentiment classifier flags negative news for explicit inclusion with recommended framing." },
      { "mode": "Briefing delivered too late (< 5 min before meeting)", "mitigation": "Scheduled trigger fires 40 minutes before meeting start; SLA alert if briefing not delivered 30 minutes before; retry with degraded content if full run fails." },
    ],
    "scalingConsiderations": [
      "Sales team scale: enterprise sales teams of 50–200 reps each doing 3–5 meetings/day = 150–1000 briefings/day; async queue handles burst; priority for meetings starting within 2 hours.",
      "Data freshness: LinkedIn data cached for 24h; company news fetched fresh for each meeting; CRM data always fetched live.",
      "Cost profile: ~$0.15–0.30/briefing at claude-3-5-haiku for summarization + claude-3-5-sonnet for synthesis; < $50/day for 200 meetings.",
    ],
    "integrations": [
      { "system": "Calendar (Google / Outlook)", "type": "Trigger", "note": "Meeting invite triggers briefing generation workflow" },
      { "system": "LinkedIn Sales Navigator", "type": "Read", "note": "Attendee profiles, connections, recent activity" },
      { "system": "CRM (Salesforce / HubSpot)", "type": "Read", "note": "Account history, open opportunities, previous interactions" },
      { "system": "News APIs (NewsAPI / Bing)", "type": "Read", "note": "Recent company news, press releases, earnings" },
      { "system": "Email / Slack", "type": "Write", "note": "Delivers formatted briefing 30 min before meeting" },
    ],
  },

  "scholarship-matching": {
    "techStack": [
      { "category": "Embedding", "tools": ["text-embedding-3-small (applicant + scholarship profile vectors)", "sentence-transformers/all-MiniLM-L6-v2 (lightweight option)"] },
      { "category": "Vector Store", "tools": ["pgvector (applicant-scholarship match matrix)", "Qdrant"] },
      { "category": "LLM", "tools": ["claude-3-5-haiku (eligibility screening)", "claude-3-5-sonnet (application guidance + essay feedback)"] },
      { "category": "Data Sources", "tools": ["Scholarship database (Fastweb / College Board API)", "FAFSA data integration", "Institutional SIS (Banner / Ellucian)"] },
      { "category": "Workflow", "tools": ["Python async pipeline", "Celery (batch matching runs)"] },
    ],
    "failureModes": [
      { "mode": "Applicant matched to scholarship they are ineligible for", "mitigation": "Hard eligibility filters applied as vector search pre-conditions (GPA floor, major, citizenship, state residency) — not soft suggestions; LLM only explains confirmed matches." },
      { "mode": "Essay feedback reveals private applicant information to wrong counsellor", "mitigation": "Tenant isolation: each applicant's data scoped to their assigned counsellor only; no cross-applicant context in any LLM call." },
      { "mode": "Scholarship database contains expired or discontinued awards", "mitigation": "Daily freshness check against scholarship source; expired awards soft-deleted and excluded from matching; re-index on source update." },
    ],
    "scalingConsiderations": [
      "Applicant pool: regional program 500–2000 applicants; national platform 50,000+; embedding-based matching scales linearly; pre-compute top-20 matches per applicant during off-peak hours.",
      "Scholarship catalog: 5,000–50,000 active scholarships with complex eligibility criteria; represent as structured metadata + free-text description for hybrid search.",
      "Batch processing: run matching at enrollment time and update monthly as new scholarships are added; real-time for user-initiated searches.",
    ],
    "integrations": [
      { "system": "Student Information System (Banner / Ellucian)", "type": "Read", "note": "Academic records, financial data, enrollment status" },
      { "system": "FAFSA / CSS Profile", "type": "Read", "note": "Financial need data for need-based scholarship matching" },
      { "system": "Scholarship Database (Fastweb / College Board)", "type": "Read", "note": "Catalog of available scholarships with eligibility criteria" },
      { "system": "Counsellor Portal (Naviance / Scoir)", "type": "Write", "note": "Pushes match shortlist and guidance to counsellor view" },
      { "system": "Student Email / Portal", "type": "Write", "note": "Delivers personalised match report and application checklist" },
    ],
  },

}


def main() -> None:
    updated = 0
    for uc_id, expansion in EXPANSIONS.items():
        path = CASES_DIR / f"{uc_id}.json"
        if not path.exists():
            print(f"  ✗  {uc_id}.json NOT FOUND — skipping")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        for key, value in expansion.items():
            data[key] = value
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        updated += 1
        print(f"  ✓  {uc_id}.json — added {list(expansion.keys())}")

    print(f"\nDone — expanded {updated}/{len(EXPANSIONS)} case files")


if __name__ == "__main__":
    main()
