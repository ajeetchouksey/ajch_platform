# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest on `main` | ✅ |
| Any previous commit | ❌ — redeploy from `main` |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Report privately using [GitHub Security Advisories](https://github.com/ajeetchouksey/ajch_platform/security/advisories/new).

Include in your report:
- A clear description of the vulnerability
- Steps to reproduce (PoC if possible)
- Potential impact (what an attacker could achieve)
- Affected files / components
- Suggested fix (optional but appreciated)

### Response SLA

| Severity | Acknowledgement | Patch target |
|----------|----------------|--------------|
| Critical | 24 hours | 7 days |
| High | 48 hours | 14 days |
| Medium / Low | 5 business days | Next sprint |

## Scope

This is a React SPA deployed on GitHub Pages. Relevant attack surface:

| Area | In scope |
|------|----------|
| Client-side XSS / content injection | ✅ |
| GitHub Actions supply-chain attacks | ✅ |
| Exposed secrets / tokens in source | ✅ |
| Markdown rendering (user-supplied content) | ✅ |
| Third-party dependency vulnerabilities | ✅ |
| GitHub infrastructure / Pages CDN | ❌ — report to GitHub |
| Social engineering | ❌ |
| Issues requiring physical device access | ❌ |

## Security Measures in Place

- GitHub Secret Scanning enabled
- Dependabot alerts and auto-PRs for npm + Actions
- CodeQL SAST on every push to `main` and every PR
- Dependency Review blocks PRs with high-severity CVEs
- Minimal workflow permissions (`contents: read` by default)
- No server-side execution — static site only
