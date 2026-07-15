# Domain 6: Configure Privacy, Content Exclusions, and Safeguards

> **Exam Weight:** 15% | **GH-300 GitHub Copilot Certification**

---

## Overview

This domain covers how to protect sensitive code and data through content exclusions, how to manage Copilot's public code filter, and the privacy and IP considerations organizations must understand when deploying Copilot.

---

## 1. Content Exclusions

### What Are Content Exclusions?

Content exclusions prevent GitHub Copilot from **reading and using specific files, directories, or repositories** as context when generating suggestions. This is critical for protecting:

- Credentials, API keys, and secrets
- Proprietary algorithms and business logic
- Personally Identifiable Information (PII) in data files
- Configuration files with sensitive environment data

### Configuration Levels

Content exclusions can be configured at three levels (listed in priority order):

```
Organization Level (highest priority — overrides repo and IDE)
    ↓ applies to all repos in the org
Repository Level (overrides IDE-level settings)
    ↓ applies to all developers using Copilot on that repo
Individual IDE Level (lowest priority — can be overridden by org/repo)
```

### Configuring Repository-Level Exclusions

**Location:** Repository → Settings → GitHub Copilot → Content Exclusion

**Format:** Glob patterns, one per line

```
# Exclude all .env files recursively
**/.env

# Exclude the entire secrets directory
secrets/**

# Exclude all PEM certificate files
**/*.pem

# Exclude all private key files
**/*.key

# Exclude configuration files with sensitive data
config/production.yml
config/staging.yml

# Exclude SQL seed files with PII test data
database/seeds/users.sql
```

### Configuring Organization-Level Exclusions

**Location:** Organization → Settings → GitHub Copilot → Content Exclusion

Organization-level exclusions apply to ALL repositories in the organization automatically — the most scalable approach for consistent security policy.

**Recommended organization-level exclusions:**
```
# Secret and credential files
**/.env
**/.env.*
**/credentials.json
**/secrets.yml
**/secrets.yaml

# Certificate and key files
**/*.pem
**/*.key
**/*.p12
**/*.pfx
**/*.crt

# Infrastructure as Code with secrets
**/terraform.tfvars
**/terraform.tfvars.json
```

---

## 2. Glob Pattern Reference

### Glob Syntax for Content Exclusions

| Pattern | What It Matches | Example Match |
|---------|----------------|--------------|
| `*.env` | `.env` files in root only | `.env` |
| `**/.env` | `.env` files at any depth | `app/config/.env` |
| `secrets/**` | Everything inside `secrets/` | `secrets/db.txt`, `secrets/api/keys.json` |
| `**/*.pem` | All `.pem` files at any depth | `certs/server.pem`, `ssl/root.pem` |
| `src/**/*.test.ts` | All `.test.ts` files inside `src/` | `src/utils/helper.test.ts` |
| `config/production.yml` | Exact file at exact path | `config/production.yml` only |

### Common Pattern Mistakes

```
# ❌ WRONG — only excludes root-level .env
*.env

# ✅ CORRECT — excludes .env at any directory depth
**/.env

# ❌ WRONG — syntax not supported in Copilot exclusions
exclude: secrets/

# ✅ CORRECT — use glob directly
secrets/**

# ❌ WRONG — using negation (not supported)
!public/**

# ✅ CORRECT — list what to exclude, not what to include
```

---

## 3. Public Code Filter (Duplication Detection)

### What Is the Public Code Filter?

The public code filter (also called the **duplication detection filter** or **suggestions matching public code filter**) prevents Copilot from suggesting code that closely matches publicly available open-source code.

**How it works:**
- Copilot compares generated suggestions against a database of publicly known code
- If a suggestion closely matches (~150 characters) known public code, it is suppressed
- A different, non-matching suggestion may be provided, or no suggestion if alternatives aren't available

### Why Enable It?

1. **IP protection**: Reduces risk of inadvertently including open-source code without proper attribution
2. **License compliance**: Helps avoid copyleft-licensed code entering your proprietary codebase
3. **GitHub Indemnification**: Required to qualify for GitHub's IP indemnification policy

### Enabling the Public Code Filter

**Location:** Organization → Settings → Copilot → Policies → "Suggestions matching public code"

| Setting | Behavior |
|---------|---------|
| **Allowed** (default) | Copilot suggestions may match public code |
| **Blocked** | Suggestions matching public code are suppressed |

> **Key Exam Fact:** Setting this to "Blocked" is a prerequisite for GitHub's IP indemnification coverage.

### Limitations

- The filter is not 100% comprehensive — it doesn't catch all matching code
- Some unique implementations in Copilot's training may not be in the public code database
- It's a risk-reduction tool, not an absolute legal guarantee

---

## 4. Output Ownership and Intellectual Property

### Who Owns Copilot-Generated Code?

**You (the developer/organization) own the code you generate and accept.**

Per GitHub's Terms of Service:
- Generated code is assigned to the user who created it
- GitHub does not claim ownership of Copilot outputs
- The code you accept becomes your code — subject to applicable law

### Limitations and Caveats

| Topic | Reality |
|-------|---------|
| AI IP law | Still evolving globally — legal landscape is not fully settled |
| Copyright of AI output | Varies by jurisdiction; consult legal counsel for regulated industries |
| Indemnification | Conditional — requires following GitHub's responsible use guidelines |
| Public code filter | Required for indemnification; reduces but doesn't eliminate risk |

### GitHub's IP Indemnification

GitHub offers indemnification for Copilot-generated code **subject to conditions**:
1. Use Copilot Business or Enterprise (not Individual)
2. Public code filter must be enabled and set to "Blocked"
3. Follow GitHub's responsible use guidelines
4. Don't knowingly use Copilot to reproduce public code

---

## 5. Privacy Settings

### Individual Privacy Controls

Individual users (Copilot Individual subscriptions only) can control:

| Setting | What It Controls |
|---------|----------------|
| **Telemetry** | Whether usage data is sent to GitHub for product improvement |
| **Code snippets for training** | Whether code snippets from suggestions are used to train future models |

**For Individual users:** Settings → GitHub Copilot → Opt out of telemetry and/or training data collection.

### Organization Override

Organization admins can **lock** individual settings:
- An org admin can prevent individual members from overriding certain privacy settings
- Organization-level policy takes precedence over individual preferences

### Copilot Business / Enterprise Privacy Commitment

| Tier | Training on customer code | Telemetry |
|------|--------------------------|-----------|
| **Individual** | Opt-out available | Opt-out available |
| **Business** | **NEVER used for training** | Limited; no code snippets |
| **Enterprise** | **NEVER used for training** | Limited; no code snippets |

---

## 6. Troubleshooting Content Exclusions

### Common Issues and Solutions

| Issue | Likely Cause | Solution |
|-------|-------------|---------|
| Excluded file still appears in suggestions | IDE not reloaded after config change | Reload/restart the IDE |
| Exclusion pattern not working | Incorrect glob syntax | Verify pattern with glob tester; check `**` usage |
| Org-level exclusions not applying | IDE extension version | Update Copilot extension to latest version |
| Repo-level exclusions not applying | Permission issue | Verify you're a repo admin |
| No suggestions in any file | Entire repo excluded at org level | Review org-level exclusion patterns |

### Validation Workflow

```
1. Configure exclusion pattern
   ↓
2. RELOAD the IDE (critical step many miss)
   ↓
3. Open a file that SHOULD be excluded
   ↓
4. Verify Copilot does NOT suggest content derived from that file
   ↓
5. Open a file that should NOT be excluded
   ↓
6. Verify Copilot still provides normal suggestions
   ↓
7. Test Copilot Chat: ask about the excluded content
   ↓
8. Verify Copilot cannot surface information from excluded files
```

---

## 7. Audit Log Events

### Copilot-Related Audit Log Events

Organization admins can monitor governance changes via:  
**Organization → Settings → Audit Log → Filter by "copilot"**

| Event | Description |
|-------|-------------|
| `copilot.policy_change` | Admin changed a Copilot policy setting |
| `copilot.seat_assigned` | A seat was assigned to a user |
| `copilot.seat_removed` | A seat was revoked from a user |
| `copilot.content_exclusion_created` | A new content exclusion rule was added |
| `copilot.content_exclusion_updated` | An exclusion rule was modified |

---

## Key Exam Traps ⚠️

| Trap | Correct Answer |
|------|---------------|
| "Content exclusions automatically apply without IDE reload" | **FALSE** — IDE must be reloaded after configuration |
| "Exclusions only affect inline suggestions, not Chat" | **FALSE** — exclusions apply to both features |
| "The public code filter guarantees no IP issues" | **FALSE** — it reduces risk; it's not an absolute guarantee |
| "Organization owns all Copilot-generated code" | Correct for Enterprise/Business tiers per GitHub ToS |
| "Individual exclusions override organization exclusions" | **FALSE** — org-level takes precedence |
| "`*.env` excludes all .env files" | **FALSE** — use `**/.env` for recursive matching |
| "Enterprise tier data is used to train models" | **FALSE** — Business and Enterprise NEVER train on customer code |

---

## Quick Reference

| Topic | Key Fact |
|-------|---------|
| Exclusion levels | Org (highest) → Repo → IDE (lowest) |
| Reload required | Always reload IDE after configuring exclusions |
| Glob `**` | Matches any directory depth (recursive) |
| Public code filter | Set to "Blocked" for GitHub indemnification eligibility |
| Who owns output | Developer/organization (per GitHub ToS) |
| Business/Enterprise training | NEVER use customer code for training |
| Audit log | Monitor policy changes, seat assignments |
| Validation | Open excluded file → verify no suggestions from it |
