"""
Add mermaidDiagram field to all 14 featured use cases in _source-intel.json
"""
import json
from pathlib import Path

DIAGRAMS = {
    "invoice-ops-hitl": (
        "flowchart LR\n"
        "  A([Email Trigger]) --> B[Extract Invoice Fields]\n"
        "  B --> C{Matches PO?}\n"
        "  C -->|Yes| D[Auto-Approve]\n"
        "  C -->|Anomaly| E[HITL Review Gate]\n"
        "  E -->|Approved| D\n"
        "  E -->|Rejected| F([Flag and Escalate])\n"
        "  D --> G([ERP Write + Idempotency Key])"
    ),
    "aml-parallel-hitl": (
        "flowchart LR\n"
        "  A([AML Alert Email]) --> B[Coordinator]\n"
        "  B --> C1[Public Profile Search]\n"
        "  B --> C2[Bank Account Lookup]\n"
        "  B --> C3[AML Policy Docs]\n"
        "  C1 & C2 & C3 --> D[Merge Typed Evidence]\n"
        "  D --> E[Draft Closure Decision]\n"
        "  E --> F[HITL Reviewer Portal]\n"
        "  F -->|Approved| G([Close Account + Audit Log])\n"
        "  F -->|Rejected| H([Escalate to Senior Officer])"
    ),
    "investor-helpdesk": (
        "flowchart LR\n"
        "  A([Investor Query]) --> B[Coordinator LLM]\n"
        "  B --> C1[CRM-LLM: Account History]\n"
        "  B --> C2[Product-LLM: Investment Docs]\n"
        "  C1 & C2 --> D[Typed Merge]\n"
        "  D --> E[Formatter-LLM: Compliance Language]\n"
        "  E --> F([Compliant Personalized Response])"
    ),
    "soc2-compliance-eval": (
        "flowchart TD\n"
        "  A([SOC 2 PDF Upload]) --> B[Extract Controls Section by Section]\n"
        "  B --> C[Evaluate vs FFIEC Framework]\n"
        "  C --> D{Rating per Control}\n"
        "  D -->|Pass| E[CUEC or URSIT Rating]\n"
        "  D -->|Gap Found| F[Flag + Remediation Note]\n"
        "  E & F --> G[Structured Evaluation Report]\n"
        "  G --> H([SharePoint Upload])\n"
        "  G --> I([Slack Notification])"
    ),
    "policy-qa-rag": (
        "flowchart LR\n"
        "  A([User Question]) --> B[Embed Query]\n"
        "  B --> C[RBAC Pre-Filter by Policy Type]\n"
        "  C --> D[Vector Search Top-K]\n"
        "  D --> E{Freshness Gate}\n"
        "  E -->|Current| F[LLM Answer with Citations]\n"
        "  E -->|Stale| G[Staleness Disclaimer + LLM Answer]\n"
        "  F & G --> H([Grounded Answer])"
    ),
    "policy-memo-writer": (
        "flowchart TD\n"
        "  A([Policy Brief Input]) --> B[Parallel Research]\n"
        "  B --> C1[Internal Memo Archive]\n"
        "  B --> C2[Regulatory Database]\n"
        "  B --> C3[Public Comment Records]\n"
        "  C1 & C2 & C3 --> D[Synthesize Key Findings]\n"
        "  D --> E[Draft Memo with Source Attribution]\n"
        "  E --> F([Supervisor Review])"
    ),
    "inbound-lead-magnet": (
        "flowchart LR\n"
        "  A([Form Submission]) --> B[Enrich Lead Data]\n"
        "  B --> C1[Web Search: Company News]\n"
        "  B --> C2[LinkedIn: Company Profile]\n"
        "  C1 & C2 --> D[Generate Custom PDF]\n"
        "  D --> E([Email to Prospect])\n"
        "  D --> F([HubSpot CRM Write + Idempotency Key])"
    ),
    "city-council-summary": (
        "flowchart TD\n"
        "  A([Meeting Recording + Transcript]) --> B[Transcription Agent]\n"
        "  B --> C[Summary Agent: Agenda + Decisions + Quotes]\n"
        "  C --> D[Index with Meeting Metadata]\n"
        "  D --> E([Natural Language Q&A Across Full Meeting History])"
    ),
    "internal-audit-testing": (
        "flowchart TD\n"
        "  A([Audit Objectives]) --> C[Extract and Map to Criteria]\n"
        "  B([Loan File Population]) --> C\n"
        "  C --> D{Exception Found?}\n"
        "  D -->|Yes| E[Flag + Evidence Citation]\n"
        "  D -->|No| F[Objective Pass]\n"
        "  E & F --> G[Draft Workpaper Section]\n"
        "  G --> H[Auditor Sign-Off HITL Gate]\n"
        "  H --> I([Archive])"
    ),
    "vendor-onboarding": (
        "flowchart LR\n"
        "  A([Vendor Form + Docs]) --> B[Parallel Parse]\n"
        "  B --> C1[Entity + Tax ID]\n"
        "  B --> C2[Banking Details]\n"
        "  B --> C3[Certifications]\n"
        "  C1 & C2 & C3 --> D[Validate + Dedup Check]\n"
        "  D --> E[HITL Approval Gate]\n"
        "  E -->|Approved| F([Update Vendor Master + Notify])\n"
        "  E -->|Incomplete| G([Request Missing Docs from Vendor])"
    ),
    "investment-proposal-drafting": (
        "flowchart LR\n"
        "  A([RFP or DDQ Input]) --> B[Classify Request Type]\n"
        "  B --> C[Search Archives]\n"
        "  C --> D1[Past Pitch Books]\n"
        "  C --> D2[ADV Filings]\n"
        "  C --> D3[DDQ Archives]\n"
        "  D1 & D2 & D3 --> E[Draft Sections: House Style + Disclosures]\n"
        "  E --> F([Lead Advisor Review])"
    ),
    "safety-ops-chatbot": (
        "flowchart LR\n"
        "  A([Safety Question]) --> B[Parallel Search]\n"
        "  B --> C1[OSHA Standards - Regulatory Authority]\n"
        "  B --> C2[Company Safety Policies - Internal Guidance]\n"
        "  B --> C3[Incident Records - Historical Data]\n"
        "  C1 & C2 & C3 --> D[Synthesize with Source Hierarchy]\n"
        "  D --> E([Compliant Answer with Citations])"
    ),
    "meeting-prep-agent": (
        "flowchart LR\n"
        "  A([Attendees + Meeting Context]) --> B[Coordinator]\n"
        "  B --> C1[Web Search: Company News]\n"
        "  B --> C2[LinkedIn: Attendee Profiles]\n"
        "  B --> C3[SharePoint: Account History]\n"
        "  C1 & C2 & C3 --> D[Token-Bounded Merge]\n"
        "  D --> E[Draft Prep Email: Agenda + Talking Points]\n"
        "  E --> F([Exec or AE Inbox])"
    ),
    "scholarship-matching": (
        "flowchart TD\n"
        "  A([Student Profile Submitted]) --> B{Hard Eligibility Filter}\n"
        "  B -->|Eligible| C[Semantic Fit Scoring]\n"
        "  B -->|Ineligible| X([Excluded])\n"
        "  C --> D[Score by Fit + Deadline Proximity]\n"
        "  D --> E[Ranked Shortlist]\n"
        "  E --> F([Application Guidance per Match])"
    ),
}

target = Path("public/content/usecases/_source-intel.json")
data = json.loads(target.read_text(encoding="utf-8"))

added = 0
for uc in data["featuredUseCases"]:
    if uc["id"] in DIAGRAMS:
        uc["mermaidDiagram"] = DIAGRAMS[uc["id"]]
        added += 1

target.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
print(f"Done — added mermaidDiagram to {added}/{len(data['featuredUseCases'])} featured use cases")
