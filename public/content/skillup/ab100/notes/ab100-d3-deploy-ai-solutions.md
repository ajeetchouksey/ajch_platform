# D3: Deploy AI-Powered Business Solutions

> **Exam weight**: 40–45% · **Questions**: ~30 of 90 · *Aligned to July 2026 syllabus*

## Overview

Domain 3 is the largest exam domain and covers the full deployment lifecycle: monitoring and tuning agents in production, managing testing and quality gates, ALM (Application Lifecycle Management) across all Microsoft AI platforms, and responsible AI with security, governance, and compliance. This domain merges what were previously Domains 3 and 4.

---

## Section 1: Analyze, Monitor, and Tune AI-Powered Business Solutions

### Evaluation Metrics Reference

| Metric | What It Measures | Requires | Interpretation |
|--------|-----------------|---------|----------------|
| **Groundedness** | Response supported by retrieved context | Retrieved context | Low = hallucination risk |
| **Relevance** | Response addresses user query | Query + response | Low = off-topic answers |
| **Coherence** | Response is logically structured | Response only | Low = confusing output |
| **Fluency** | Response is grammatically correct | Response only | Low = language quality issue |
| **Similarity** | Response matches reference answer | Ground truth | Low = factual deviation |
| **F1 Score** | Token overlap with correct answer | Ground truth | Low = missing key facts |

> **High Relevance + Low Groundedness** = hallucination pattern — agent answers the question but invents content not in the retrieved context.

### SLA Alert Design

Define alerts on two tiers:

| Tier | Metric | Typical Threshold |
|------|--------|------------------|
| Infrastructure | P95 latency | < 10 seconds |
| Infrastructure | Tool call failure rate | < 5% |
| Infrastructure | HTTP 5xx error rate | < 1% |
| Quality | Groundedness mean (nightly eval) | ≥ 3.5 / 5 |
| Quality | Relevance mean (nightly eval) | ≥ 3.5 / 5 |

> **Exam tip**: HTTP 5xx alerts catch infrastructure failures — they do NOT detect quality degradation. An agent can return HTTP 200 with a hallucinated response. Quality metric alerts are required for proactive quality monitoring.

### Telemetry Pattern Interpretation

| Pattern | Likely Cause | Action |
|---------|-------------|--------|
| Input tokens increasing + latency increasing | More chunks retrieved per query (knowledge base growth without quality filtering) | Apply relevance score thresholds, review chunking |
| Groundedness dropping over time | Knowledge base staleness or low-quality new content | Re-evaluate chunking, filter low-relevance chunks |
| Tool failure rate high + latency spike | Tool failures causing retries — fix tools first | Investigate tool errors (API timeouts, auth failures) |
| PAYG latency spikes at high concurrency | Rate limiting (TPM/RPM) | Switch to PTU or implement request queuing |

### Cost Optimization Techniques

| Technique | Mechanism | Savings |
|-----------|-----------|---------|
| **Prompt caching** | Cache static system prompt prefix (≥1,024 tokens) — 50% discount on cached tokens | Up to 50% of static prompt cost |
| **RAG optimization** | Fewer, higher-quality retrieved chunks — reduce context tokens | 10-30% input token reduction |
| **PTU for stable high volume** | Commit to throughput unit — predictable capacity | 20-40% vs PAYG at scale |
| **Model routing** | Route simple queries to cheaper models | 30-70% inference cost reduction |

---

## Section 2: Manage the Testing of AI-Powered Business Solutions

### Pre-Deployment Validation Pipeline

```
Golden Dataset → Evaluate (both versions) → Compare Metrics → Meet Thresholds? → Staging → Canary (1-5%) → Production
```

**Golden dataset requirements:**
- ≥ 50 representative examples (ideally 100-200)
- Covers edge cases, domain boundaries, adversarial inputs
- Has verified correct outputs (ground truth) for F1 and Similarity metrics
- Refreshed when new features or significant prompt changes are made

### A/B Test Decision Framework

When evaluating prompt variants with divergent metrics:
1. Define **metric priorities** based on business risk (e.g., for financial advice: Groundedness > Relevance)
2. Set **minimum thresholds** for each metric (not just averages — check outlier distributions)
3. Choose the variant that satisfies ALL minimum thresholds, prioritizing the highest-risk metric

> **Exam trap**: Never promote a variant based on one metric alone. A variant with higher Relevance but lower Groundedness may fail in production due to hallucinated content.

### Outlier Analysis

Mean scores can conceal systematic failures. Always analyze outlier distributions:
- 4.6% failure rate (23/500 with Groundedness = 1/5) is significant in high-stakes domains
- Investigate whether outliers cluster around specific query types, domains, or input patterns
- Block deployment if outlier patterns represent unmitigated failure modes

### Red-Team Testing

Systematic adversarial testing using Azure AI Studio Safety Evaluations:

| Attack Type | Description | Mitigation |
|-------------|-------------|-----------|
| **Direct jailbreak** | User overrides system instructions | Azure AI Content Safety input scanner |
| **Indirect injection** | Retrieved content contains instructions | Content Safety on retrieved content + structural delimiters |
| **Data extraction** | User extracts system prompt or other users' data | Output filtering + prompt confidentiality instruction |
| **Persona override** | User creates alternative persona (DAN, etc.) | Content Safety jailbreak detection |

### Copilot-Based Test Case Strategy

Use GitHub Copilot and Azure DevOps Copilot to accelerate test case creation:
- Generate test templates from acceptance criteria (10× faster than manual)
- Create scenario variations across all use case permutations
- Produce boundary condition test data
- Generate LLM-as-judge evaluation prompts for automated scoring

> Always validate and curate Copilot-generated test cases — Copilot generates candidates, humans validate correctness.

### D365 Multi-App End-to-End Test Scenarios

For solutions spanning multiple D365 apps, design tests that:
- Cross application boundaries (e.g., Copilot for Sales in Outlook triggers D365 Sales opportunity update)
- Validate data consistency across apps (D365 Finance → D365 SCM → Power BI)
- Include escalation paths from AI agent to human agent in D365 Contact Center

---

## Section 3: Design the ALM Process for AI-Powered Business Solutions

### ALM Across Microsoft AI Platforms

| Platform | ALM Approach | Key Artifacts |
|----------|-------------|--------------|
| **Copilot Studio** | Solution-based export/import (Power Platform Solutions); promote dev → staging → prod environments | `.zip` solution package, environment variables for endpoint config |
| **Foundry Agents** | IaC (Bicep/ARM) for Hub/Project; agent YAML in source control; GitHub Actions pipeline | `bicep` files, `agent.yaml`, environment param files |
| **Custom AI models** | ML pipeline versioning in AI Foundry; model registry; evaluation gate before promotion | Model version, evaluation report, deployment config |
| **Dynamics 365 AI** | D365 solution packages; standard ALM via Power Platform | Solution package, environment configuration |

### Copilot Studio ALM

Key ALM considerations:
- Agents, topics, connectors, and actions are packaged in **Power Platform Solutions**
- Use **environment variables** to configure connection references per environment (different endpoints for dev/staging/prod)
- Copilot Studio supports **managed solutions** — changes in production are tracked and can be rolled back
- Actions that call Power Automate flows are included in the solution package

### Foundry Agents ALM

Pipeline stages for Foundry Agents:
```
Source Control (agent YAML + Bicep)
    → CI: lint + validate schema + run golden dataset evaluation
    → Deploy to DEV Foundry Project (environment-specific model deployment names)
    → Deploy to STAGING + run integration tests
    → Canary to PRODUCTION (1-5% traffic)
    → Full PRODUCTION promotion
```

### ALM for AI in D365 Finance and Supply Chain

- Use **Lifecycle Services (LCS)** for D365 F&O environment management
- AI customizations (Copilot extensions, knowledge source configuration) are managed through D365 solution packages
- Data used in AI models (demand forecasting data, financial analytics) has its own ALM: dataset versioning, data pipeline promotion between environments

---

## Section 4: Responsible AI, Security, Governance, Risk, and Compliance

### Microsoft Responsible AI Principles

| Principle | Definition | Exam-Relevant Scenarios |
|-----------|-----------|------------------------|
| **Fairness** | AI doesn't discriminate based on protected characteristics | Loan denial bias via zip code proxies |
| **Reliability & Safety** | AI performs consistently and safely | Clinical AI failing on edge cases |
| **Privacy & Security** | Data is protected; access is controlled | GDPR compliance for conversation logs |
| **Inclusiveness** | AI works for all people | Accessible interfaces, multilingual support |
| **Transparency** | Users know they're interacting with AI | AI disclosure requirement (EU AI Act Art. 52) |
| **Accountability** | Clear responsibility for AI decisions | Business unit owns decisions; CoE owns standards |

### EU AI Act Classification

| Risk Level | Examples | Requirements |
|-----------|---------|-------------|
| **Prohibited** | Social scoring, real-time biometric surveillance in public | Banned — cannot deploy |
| **High Risk** | Credit scoring, clinical decision support, CV screening, access control | Conformity assessment, risk management, technical documentation, human oversight |
| **Limited Risk** | Chatbots (must disclose AI), deepfake generation | Transparency obligations |
| **Minimal Risk** | Spam filters, game AI, recommendation systems | No specific obligations |

### Agent Security Design

| Security Control | Implementation |
|-----------------|---------------|
| **Agent authentication** | Managed Identity for agent-to-service calls (no secrets in code) |
| **Model access control** | Azure RBAC on AI Foundry Project — scope model access per team |
| **Prompt injection defense** | Azure AI Content Safety input scanner + structural prompt delimiters |
| **Data access on grounding data** | Azure AI Search uses managed identity; index-level access controls |
| **Audit trail** | Log queries, retrieved context, and responses to immutable storage |

### Prompt Manipulation Vulnerabilities and Mitigations

| Vulnerability | Description | Mitigation |
|--------------|-------------|-----------|
| **Direct injection** | User instructs agent to ignore its system prompt | Azure AI Content Safety jailbreak detection at input layer |
| **Indirect injection** | Retrieved content contains embedded instructions | Content Safety on retrieved content + XML structural delimiters |
| **System prompt extraction** | User asks agent to repeat its instructions verbatim | Output filtering + explicit confidentiality instruction |
| **Persona override** | User creates alternative persona (DAN pattern) | Content Safety jailbreak detection blocks known patterns |

> **Defense-in-depth**: Apply multiple controls — no single mitigation fully eliminates prompt injection risk.

### Data Residency and Movement Compliance

For EU data residency under GDPR:
- Deploy AI Foundry Hubs in **West Europe or Sweden Central**
- Use **Private Endpoints** — data does not traverse public internet
- Verify model inference happens within the EU region (not geo-replicated to non-EU)
- For fine-tuning: training data must not leave the designated region

### Grounding Data Access Controls

| Control | Implementation |
|---------|---------------|
| **Field-level security** | Dataverse field permissions restrict which data the agent can retrieve |
| **Row-level security** | Azure AI Search security trimming using the user's identity token |
| **Model tuning access** | Private storage account + managed identity for fine-tuning datasets |
| **Data minimization** | Index only fields needed for the agent's tasks — not full record copies |

### Audit Trails for AI Systems

Requirements for regulated industries:

| Requirement | Implementation |
|-------------|---------------|
| **Immutability** | Azure Blob Storage with WORM policy (Write Once Read Many) |
| **Long-term retention** | Archive to cool/cold tier after 90 days; 7-year retention for financial services |
| **What to log** | Query, retrieved context chunks, model version, response, timestamp, user ID |
| **Who can access** | Separation of duties — ops team can read logs but cannot delete them |

> **Exam trap**: Azure Monitor (90-day max retention, deletable by admins) and Cosmos DB with soft-delete are NOT immutable audit stores. Use Azure Blob WORM.

### GDPR Compliance for AI Agents

| GDPR Requirement | AI Implementation |
|-----------------|------------------|
| **Storage limitation** (Art. 5) | TTL policy on conversation logs (e.g., 90 days) |
| **Right to erasure** (Art. 17) | Partition vector indexes by user ID; delete user partition on request |
| **Data minimization** (Art. 5) | Log only fields necessary for the stated purpose |
| **Right not to be subject to automated decisions** (Art. 22) | Require human review for high-impact AI decisions |

### Model Decommissioning

Fine-tuned model weights encode training data — deleting the source files does NOT remove learned information:

1. Delete all model weight files from AI Foundry model registry
2. Delete all deployment endpoints
3. Apply model unlearning techniques if specific data memorization is a concern
4. Document the decommissioning for audit purposes

---

## ALM for Data Used in AI Models and Agents

| Data Type | ALM Approach |
|-----------|-------------|
| **Training datasets** | Version datasets in Azure ML Data Assets; track lineage |
| **Knowledge base documents** | Re-index after every content update; validate coverage with test queries |
| **Evaluation datasets (golden sets)** | Version-controlled in source repo; updated when agent capabilities change |
| **Model weights** | Registered in AI Foundry model registry with version tags |

---

## Exam Quick Reference — Domain 3 (Deploy)

| Topic | Key Rule |
|-------|---------|
| Groundedness + Relevance | High Relevance + Low Groundedness = hallucination |
| Quality alerts | HTTP 5xx alerts ≠ quality alerts; need separate metric-based alerts |
| Prompt caching | ≥1,024 static prefix tokens → 50% cost reduction on those tokens |
| Golden dataset | ≥50 examples; validates quality before any deployment; refreshed per change |
| A/B promotion | Define metric priorities; check outliers, not just means |
| Red-team testing | Azure AI Studio Safety Evaluations + adversarial dataset |
| Copilot test generation | Generates templates + variations + eval prompts; humans validate |
| Copilot Studio ALM | Power Platform Solutions + environment variables per environment |
| Foundry Agents ALM | IaC (Bicep) + agent YAML in source control + CI/CD pipeline |
| EU AI Act: High Risk | Credit scoring, clinical decisions, CV screening → conformity assessment |
| EU AI Act: Limited Risk | Chatbots → must disclose AI identity |
| Prompt injection | Defense-in-depth: Content Safety (input) + structural delimiters + output filtering |
| Audit trail | Azure Blob WORM (immutable); NOT Cosmos DB soft-delete or Azure Monitor |
| GDPR storage limitation | TTL on conversation logs; right to erasure via user-partitioned index |
| Model decommissioning | Delete weights from registry; source file deletion does NOT remove learned info |
| Data residency | AI Foundry Hub in West Europe/Sweden Central + Private Endpoints |
