---
title: "Governance Layer Best Practices in GitHub"
date: "2025-07-07"
slug: github-governance-best-practices
excerpt: "Proven best practices for GitHub governance — branch protection, CODEOWNERS, rulesets, and compliance automation for both Enterprise and Free tiers."
tags: ["github", "governance", "devops", "branch-protection", "platform-engineering"]
category: "Tutorials"
readingTime: 4
---

As a DevOps engineer who's implemented governance across numerous repositories, I've learned that robust policies and automated controls are essential for security, compliance, and collaboration. In this post, I'll share proven best practices—leveraging both GitHub Enterprise and the Free tier—to enforce branch protection, define clear code ownership, and automate compliance checks. Whenever Enterprise-only features appear, I'll provide practical workarounds for Free-tier environments.

## 1. Branch Protection Rules

- **Enable on Critical Branches**: Protect `main` and release branches.
  - Available in both Enterprise and Free.
- **Required Status Checks**:
  - Enforce CI/CD pipelines (e.g., `terraform fmt`, `terraform validate`, security scans).
  - Specify checks in branch protection settings (UI for Free, YAML for Enterprise).
    - GitHub Free: Configure via repository Settings > Branches.
    - GitHub Enterprise: Can use `.github/branch-protection.yml` for org-wide automation.
    ```yaml
    protect-branches:
      required_status_checks:
        contexts:
          - ci/terraform-fmt
          - ci/terraform-validate
          - ci/tfsec-scan
      enforce_admins: true
      required_pull_request_reviews:
        required_approving_review_count: 2
        dismiss_stale_reviews: true
    ```
- **Enforce Linear History**: Require squash or rebase merges (both tiers).
- **Include Administrators**: Apply rules to admins to ensure consistency (both tiers).

## 2. CODEOWNERS Configuration

- **Define Ownership**:
  - Assign teams or individuals to directories for automatic review requests.
  - Example `CODEOWNERS`:
    ```text
    # Modules owned by module-team
    /modules/* @org/module-team

    # CI/CD configs owned by platform-team
    /.github/workflows/* @org/platform-team
    ```
- **Enforce Reviews**: Pair with branch protection to require review by code owners.
  - Both tiers support CODEOWNERS, but team-based ownership requires organization accounts (available in both Free and Enterprise for public repos, Enterprise for private repos).

## 3. GitHub Enterprise Policies & Rulesets

- **Organization-Level Rulesets**:
  - GitHub Enterprise: Create rulesets to enforce policies across all repositories (e.g., tag protection, branch protection, required reviews).
  - GitHub Free: No org-wide rulesets; apply branch protection and tag protection per repo via Settings.
- **Custom Properties & Labels**:
  - Both tiers: Use repository labels (`env:prod`, `tier:critical`) to categorize and apply targeted rules (manual for Free, automated for Enterprise).
- **Tag Management**:
  - GitHub Enterprise: Restrict tag creation and deletion to release managers using rulesets.
  - GitHub Free: Tag protection must be managed manually; restrict via branch protection and team permissions.
  - Example Ruleset YAML (Enterprise):
    ```yaml
    name: "Tag Protection"
    target: ["MODULE_REPOSITORIES"]
    rules:
      - type: TAG_CREATION_RULE
        parameters:
          protected_prefixes:
            - "v"
      - type: TAG_DELETION_RULE
        parameters:
          prevent_deletion: true
    ```

## 4. Security & Compliance

- **Enable Advanced Security**:
  - GitHub Enterprise: Advanced Security (secret scanning, code scanning, Dependabot alerts, CodeQL) for private repos.
  - GitHub Free: Secret scanning and Dependabot alerts for public repos; limited code scanning for private repos.
  - Configure scans in `.github/dependabot.yml` and `.github/codeql/`.
- **Audit Logs & Monitoring**:
  - GitHub Enterprise: Organization-level audit logs and security dashboards.
  - GitHub Free: Basic audit logs at repo level; no org-wide dashboards.

## 5. Automation & Enforcement

- **Reusable GitHub Actions**:
  - Both tiers: Create reusable actions for policy checks (linting, compliance).
  - GitHub Enterprise: Publish org-wide actions in a central repo and reference via `uses: org/actions/policy-check@v1`.
  - GitHub Free: Reference actions from public repos or GitHub Marketplace.
- **GitHub Apps & Webhooks**:
  - Both tiers: Integrate with external policy engines (e.g., Open Policy Agent) and automate enforcement (manual setup for Free).
- **Scheduled Audits**:
  - GitHub Enterprise: Automate nightly scans and reporting via org-level tools.
  - GitHub Free: Use scheduled GitHub Actions or external scripts to check for drift and report via email or Slack.

## 6. Training & Documentation

- **Internal Wiki or Docs Site**:
  - Both tiers: Host governance guidelines, examples, and troubleshooting in a repo wiki, GitHub Pages, or external docs site.
- **Onboarding**:
  - Both tiers: Include governance training in onboarding checklist.
- **Governance Champions**:
  - Both tiers: Assign a point of contact for governance questions and escalations.

---

**References:**
- [GitHub Enterprise Administration Guide](https://docs.github.com/en/enterprise)
- [GitHub Branch Protection Rules Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-protected-branches)
- [GitHub Advanced Security Best Practices](https://docs.github.com/en/code-security/secure-coding/best-practices)
