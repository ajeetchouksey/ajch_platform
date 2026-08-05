# D3: Privacy, Security & Trust Center

> **Exam weight**: ~25% · **Questions**: ~40 of 134

## Overview

Domain 3 tests how GitHub Copilot handles sensitive data, what controls organizations have over its behavior, and how to configure security guardrails — from content exclusion to IP indemnification policies.

> 💡 **Human Angle**: *"Privacy settings are like door locks — they only work if you know they exist and remember to configure them. Domain 3 tests whether you know where all the locks are."*

## Content Exclusion

### What It Does

Content exclusion lets admins prevent Copilot from using specific files, paths, or repositories as context when generating suggestions. This is the primary mechanism for keeping sensitive data out of Copilot's context window.

### Configuration Levels

| Level | Who sets it | Scope |
|---|---|---|
| Repository | Repo admin | `.github/copilot-instructions.md` or repo settings |
| Organization | Org admin | GitHub org → Copilot settings → Content exclusions |
| Enterprise | Enterprise admin | Enterprise cloud settings |

**Inheritance rule**: Enterprise > Organization > Repository — more restrictive settings at higher levels override lower levels.

### What Gets Excluded

When a file is excluded:
- It does NOT appear as context for suggestions
- The developer can still open and edit it — exclusion only affects Copilot's context assembly
- Excluded files are listed in the Copilot Chat "context" panel when active

### Exam Trap ⚠️

<div class="note-trap">
Students assume content exclusion prevents Copilot from *reading* a file. It doesn't — the developer can still see and edit the file. Exclusion means Copilot won't *use that file as prompt context*. The developer's suggestions from OTHER context are still served.
</div>

## Privacy Controls

### Data Retention

GitHub's privacy commitments for Copilot:
- Prompts (the assembled context) are NOT stored after the API call completes
- Suggestions shown to the user are retained for a short period for safety filtering
- Individual code is NOT used to train the shared model (Business/Enterprise default)

### Proxy & Firewall Considerations

Copilot routes API calls through `copilot-proxy.githubusercontent.com`. Enterprise customers using an HTTPS proxy must:
1. Allow this endpoint
2. Configure the proxy certificate in the IDE extension settings

### Audit Log

Org admins can access Copilot usage audit logs showing:
- Which users have Copilot enabled
- Policy changes
- Content exclusion changes

Audit logs do NOT show individual suggestion content (prompt or response).

## Trust Center & IP Indemnification

GitHub's Copilot Trust Center ([trust.github.com](https://trust.github.com)) documents:
- Data processing agreements
- Compliance certifications (SOC 2, ISO 27001)
- Regional data residency options

### IP Indemnification

GitHub provides IP indemnification for Copilot Business and Enterprise:
- GitHub defends customers against copyright infringement claims related to Copilot suggestions
- Requires: filter for matching public code is enabled (the "duplication detection" filter)
- NOT available for Copilot Individual

### Duplication Detection Filter

The **duplication detection filter** (also called "public code matching"):
- Filters out suggestions that match publicly available code
- When enabled, if a suggestion closely matches public code, it is blocked and not shown
- Configurable at org and enterprise level

### Exam Trap ⚠️

<div class="note-trap">
IP indemnification is only available when the duplication detection filter is ENABLED. Students often think indemnification is automatic with Business tier — it requires this filter. Individual tier never gets indemnification regardless of settings.
</div>

## Deep Dive: Making Privacy Controls Click

### 1. The connective narrative

Copilot's privacy architecture has two goals: protect organizational IP (via content exclusion and data handling policies) and protect developers from legal risk (via the duplication detection filter and IP indemnification). Understanding the relationship between these controls is what the exam really tests.

The three layers of protection:
1. **Content exclusion** — prevents sensitive files from entering Copilot's context
2. **Duplication detection** — prevents suggestions that reproduce copyrighted public code
3. **IP indemnification** — GitHub's legal backstop when you've enabled layer 2

All three can be configured independently, but only the combination of layers 2 + 3 provides legal protection.

### 2. Worked scenario

> **Scenario.** A legal team asks: "If Copilot suggests code that turns out to be copied from an open-source library, is the company protected?" What must the engineering manager verify?
>
> **Checklist:**
> 1. Is the organization on Copilot Business or Enterprise? (Individual doesn't qualify)
> 2. Is the **duplication detection filter** enabled? (Settings → Policies → Suggestions matching public code → Blocked)
> 3. Has the legal team reviewed GitHub's IP indemnification terms?
>
> If yes to all three: GitHub will defend the company in IP claims. If the filter is disabled: no indemnification applies.

### 3. Memory aid

**CDA** — the three things admins configure for compliance:
- **C**ontent exclusion (keep sensitive code out of context)
- **D**uplication detection filter (block public code matches)
- **A**udit log access (track who's using what)

### 4. Exam strategy for this domain

- Content exclusion ≠ access control — developers can still open excluded files
- IP indemnification requires: Business/Enterprise tier + duplication detection ENABLED
- Prompts are NOT stored after API call completion
- Audit logs record usage events, not suggestion content
- Proxy configuration: set at IDE extension level, not GitHub org level
- One sentence: *"Privacy controls limit what Copilot USES as context, not what humans can access."*

## Cheat Sheet 📋

| Concept | Key Rule |
|---|---|
| Content exclusion | Keeps files out of Copilot context — developer can still edit them |
| Duplication detection | Blocks suggestions matching public code |
| IP indemnification | Requires Business/Enterprise + duplication detection ON |
| Prompt retention | NOT stored after API call |
| Audit logs show | Usage events — NOT suggestion content |
| Exclusion hierarchy | Enterprise > Org > Repo |
