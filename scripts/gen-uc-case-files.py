#!/usr/bin/env python3
"""
Generate individual case JSON files for each featured use case.
Output: public/content/usecases/cases/{id}.json
Each file extends the featured use case with relatedUseCases cross-links.
Run: python scripts/gen-uc-case-files.py
"""

import json
import os
from pathlib import Path

ROOT = Path(__file__).parent.parent
INTEL = ROOT / "public/content/usecases/_source-intel.json"
OUT_DIR = ROOT / "public/content/usecases/cases"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Vertical label mapping (matches _source-intel.json vertical IDs)
VERTICAL_LABEL = {
    "operations": "Finance & Ops",
    "compliance": "Compliance & Legal",
    "insurance": "Insurance",
    "government": "Policy & Government",
    "gtm": "Sales & GTM",
    "industrials": "Construction & Safety",
    "banking": "Banking",
    "wealth-management": "Investment Management",
    "education": "Education & Nonprofit",
}

# Hand-curated relatedUseCases cross-links (by id)
RELATED: dict[str, list[str]] = {
    "invoice-ops-hitl":            ["aml-parallel-hitl", "vendor-onboarding", "internal-audit-testing"],
    "aml-parallel-hitl":           ["invoice-ops-hitl", "soc2-compliance-eval", "internal-audit-testing"],
    "investor-helpdesk":           ["investment-proposal-drafting", "policy-qa-rag", "meeting-prep-agent"],
    "soc2-compliance-eval":        ["aml-parallel-hitl", "internal-audit-testing", "policy-qa-rag"],
    "policy-qa-rag":               ["city-council-summary", "policy-memo-writer", "investor-helpdesk"],
    "policy-memo-writer":          ["policy-qa-rag", "city-council-summary"],
    "inbound-lead-magnet":         ["meeting-prep-agent", "investor-helpdesk"],
    "city-council-summary":        ["policy-qa-rag", "policy-memo-writer"],
    "internal-audit-testing":      ["aml-parallel-hitl", "soc2-compliance-eval", "invoice-ops-hitl"],
    "vendor-onboarding":           ["invoice-ops-hitl", "meeting-prep-agent", "inbound-lead-magnet"],
    "investment-proposal-drafting":["investor-helpdesk", "meeting-prep-agent"],
    "safety-ops-chatbot":          ["policy-qa-rag", "vendor-onboarding"],
    "meeting-prep-agent":          ["investor-helpdesk", "inbound-lead-magnet", "investment-proposal-drafting"],
    "scholarship-matching":        ["policy-qa-rag", "safety-ops-chatbot"],
}

# Architecture notes per use case (concise explanation of the diagram)
ARCH_NOTES: dict[str, str] = {
    "invoice-ops-hitl": (
        "The agent extracts structured fields (vendor, amount, line items) from raw invoice PDFs using an extraction model, "
        "then compares them against PO records. Matched invoices are auto-approved and written to the ERP with an idempotency key. "
        "Mismatches or low-confidence extractions are routed to a human reviewer via a structured task queue. "
        "The HITL gate prevents erroneous payments while keeping auto-approval rates high for routine invoices."
    ),
    "aml-parallel-hitl": (
        "Multiple risk-check agents run in parallel (velocity, watchlist, typology) against the same transaction record. "
        "A scoring aggregator collects their outputs and applies a threshold rule: score ≥ threshold triggers a SAR draft; "
        "score between the soft and hard limits routes to a human analyst for review. "
        "Parallelism cuts latency vs. sequential checks; the HITL layer satisfies regulatory oversight requirements."
    ),
    "investor-helpdesk": (
        "A RAG pipeline retrieves relevant chunks from fund fact sheets, prospectuses, and performance reports "
        "stored in a vector database. The retrieval context is injected into the LLM prompt, which produces a "
        "grounded, cited answer. An eligibility filter runs pre-retrieval to restrict content by investor tier. "
        "A reranker prioritises the most topically relevant chunks when the query spans multiple funds."
    ),
    "soc2-compliance-eval": (
        "The agent ingests a SOC 2 report PDF and an internal control catalog. For each control in the catalog it "
        "runs a targeted extraction pass to find the matching section in the report, then applies an evaluator model "
        "to score coverage (Met / Partial / Gap). A summary table is emitted alongside a risk narrative and "
        "recommended remediation items ordered by impact."
    ),
    "policy-qa-rag": (
        "Policy documents are chunked at the section level (not page) to preserve logical boundaries, then embedded "
        "and stored in a vector index. At query time, a query rewriter normalises insurance jargon before retrieval. "
        "Top-k chunks are reranked by section relevance and recency. The LLM answers with section citations; "
        "a confidence scorer flags low-confidence answers for human escalation."
    ),
    "policy-memo-writer": (
        "The agent receives a legislative text URL and optional focus topics. It runs a multi-pass summarisation: "
        "first a structural pass to extract sections, then a policy-impact pass per section, then a cross-section "
        "synthesis. The final memo follows a fixed template (summary, key changes, stakeholder impact, recommended actions). "
        "A reviewer step checks for unsupported claims before the memo is sent."
    ),
    "inbound-lead-magnet": (
        "Inbound form submissions trigger the agent. It scores the lead using a classification model, "
        "then branches: high-fit leads get a personalised nurture email drafted by an LLM and queued for "
        "human approval; low-fit leads receive an automated acknowledgement. CRM records are created or "
        "updated idempotently. A daily digest surfaces leads awaiting human action."
    ),
    "city-council-summary": (
        "Meeting audio or transcript is segmented by speaker-turn. Each segment is summarised and tagged "
        "by topic (budget, zoning, public comment, etc.). A synthesis agent merges per-topic summaries "
        "into a structured minutes document with action items and vote records. The output is posted to "
        "a public portal and emailed to subscribers automatically."
    ),
    "internal-audit-testing": (
        "The agent reads the audit test plan and control list, then queries the ERP/transaction system for "
        "sample data matching each test criteria. For each sample it applies the test logic (e.g., approval-chain "
        "verification, limit checks) and records pass/fail with evidence links. A HITL review step is triggered "
        "for any failed test before the finding is escalated. The audit workpaper is generated automatically."
    ),
    "vendor-onboarding": (
        "Vendor submissions (forms, documents) are ingested and routed through parallel validation agents: "
        "sanctions screening, financial health check, document completeness check. A coordinator aggregates "
        "results into an overall risk score. Low-risk vendors proceed to automatic approval and ERP provisioning; "
        "medium-risk vendors route to procurement review; high-risk vendors are rejected with a documented reason."
    ),
    "investment-proposal-drafting": (
        "The agent takes client profile data (risk tolerance, horizon, objectives) and pulls relevant market "
        "data and fund performance metrics from internal APIs. A portfolio-fit model scores available products "
        "against the client profile. The drafting LLM produces a personalised proposal narrative; a compliance "
        "check step validates suitability statements and required disclosures before human RM sign-off."
    ),
    "safety-ops-chatbot": (
        "Site workers query the chatbot via a mobile interface. RAG retrieves relevant procedures from the "
        "safety manual and incident database. Hazard-specific queries trigger additional context from the "
        "regulatory compliance database. Answers include direct citations; high-severity hazard queries "
        "simultaneously alert the site safety officer. All queries are logged for compliance audit trails."
    ),
    "meeting-prep-agent": (
        "The agent ingests the meeting invite (attendee list, company names) and pulls CRM data, recent "
        "news, and LinkedIn profiles. A synthesis model produces a briefing document: attendee bios, "
        "company context, open opportunities, recommended talking points, and risk flags. "
        "The briefing is delivered to the sales rep 30 minutes before the meeting via email and CRM note."
    ),
    "scholarship-matching": (
        "Applicant profiles (demographics, financials, academic records, essays) are embedded and matched "
        "against a scholarship catalog using vector similarity. A scoring model ranks scholarships by "
        "eligibility fit. For top matches, the agent drafts personalised application guidance and identifies "
        "missing documents. A counsellor review step approves the shortlist before it is shared with the student."
    ),
}


def get_related_entries(uc_id: str, all_featured: list[dict]) -> list[dict]:
    """Build relatedUseCases list for a given use case."""
    by_id = {u["id"]: u for u in all_featured}
    related_ids = RELATED.get(uc_id, [])
    result = []
    for rid in related_ids:
        if rid in by_id:
            u = by_id[rid]
            result.append({
                "id": u["id"],
                "label": u["title"],
                "vertical": VERTICAL_LABEL.get(u["vertical"], u["vertical"]),
            })
    return result


def main() -> None:
    data = json.loads(INTEL.read_text(encoding="utf-8"))
    featured = data["featuredUseCases"]
    created = 0

    for uc in featured:
        uc_id = uc["id"]
        case = dict(uc)  # copy all existing fields
        case["architectureNotes"] = ARCH_NOTES.get(uc_id, "")
        case["relatedUseCases"] = get_related_entries(uc_id, featured)

        out_path = OUT_DIR / f"{uc_id}.json"
        out_path.write_text(json.dumps(case, indent=2, ensure_ascii=False), encoding="utf-8")
        created += 1
        print(f"  ✓  {uc_id}.json  ({len(case['relatedUseCases'])} related)")

    print(f"\nDone — created {created} case files in public/content/usecases/cases/")


if __name__ == "__main__":
    main()
