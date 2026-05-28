---
name: gh-project-config
description: >
  GitHub Projects v2 configuration for the AI Product Owner Agent.
  Stores board identifiers, label taxonomy, milestone structure, and
  platform personas for the ajch_platform repository.
---

# GitHub Project Configuration

> **Product Owner Agent** reads this file on every invocation.
> Update the CONFIG block after the board is bootstrapped via the Setup module.

---

## CONFIG (update after setup)

```yaml
OWNER: ajeetchouksey
REPO: ajch_platform
TOKEN_ENV: GH_PO_TOKEN          # PAT with scopes: repo, project
PROJECT_NUMBER: 12              # https://github.com/users/ajeetchouksey/projects/12
PROJECT_ID: PVT_kwHOBmF8RM4BY8v6  # GraphQL node ID for project board
```

**First-time setup**: If you already have a GitHub Project, find its number from the URL
(`https://github.com/users/ajeetchouksey/projects/N`) and paste it below.
Otherwise invoke `Product Owner Agent → Setup` to create one.

**Token setup**: Create a **classic PAT** at https://github.com/settings/tokens
→ "Generate new token (classic)" with scopes `repo` + `project`, then paste it into
`gh_po_token.env` at the workspace root (already in `.gitignore`):
```
GH_PO_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
The PO Agent reads this file in Module 1 (Setup). Never echo or log the token value.

---

## Label Taxonomy

### Type labels (what kind of work)
| Label | Hex Color | Description |
|-------|-----------|-------------|
| `type:feat` | `#7c3aed` | New feature or capability |
| `type:content` | `#0ea5e9` | Study notes, MCQs, exams, blog posts |
| `type:ux` | `#f59e0b` | UI/UX improvements |
| `type:infra` | `#6b7280` | Build, deploy, config, tooling |
| `type:bug` | `#ef4444` | Something is broken |
| `type:chore` | `#94a3b8` | Maintenance, refactor, cleanup |
| `type:epic` | `#6d28d9` | Parent epic grouping related stories |

### Priority labels
| Label | Hex Color | Description |
|-------|-----------|-------------|
| `P0-critical` | `#dc2626` | Must fix immediately — breaks platform |
| `P1-high` | `#ea580c` | Next sprint inclusion expected |
| `P2-medium` | `#ca8a04` | Scheduled in upcoming milestone |
| `P3-low` | `#64748b` | Nice to have, backlog |

### Domain labels
| Label | Hex Color | Description |
|-------|-----------|-------------|
| `domain:exam` | `#2563eb` | Exam framework and content |
| `domain:blog` | `#16a34a` | Blog publishing pipeline |
| `domain:tools` | `#0891b2` | AI tools and utilities |
| `domain:platform` | `#7c3aed` | Core platform / UX |
| `domain:agent` | `#9333ea` | AI agent infrastructure |

---

## Milestone Structure

| Milestone | Target | Focus |
|-----------|--------|-------|
| `v2.0 — Content Expansion` | Q2 2026 | 3 new exams, blog series, study notes |
| `v2.1 — Platform Features` | Q3 2026 | Search, bookmarks, user dashboard |
| `v2.2 — Tooling & Agents` | Q4 2026 | MCP scaffolder, context viz, agent builder |
| `Backlog` | Unscheduled | Ideas not yet committed to a milestone |

---

## Platform Personas

Used in user story generation ("As a **[persona]**…"):

| Persona | Description |
|---------|-------------|
| **AI Practitioner** | Engineer or architect learning AI patterns and tooling |
| **Exam Candidate** | Person studying for a specific certification (CCA-F, GH-BP) |
| **Blog Reader** | Tech professional reading articles for insights |
| **Platform Contributor** | Developer contributing content or features to the platform |
| **Study Partner** | User engaging with the AI study companion for exam prep |

---

## GitHub API Endpoints

```
BASE_REST:      https://api.github.com/repos/ajeetchouksey/ajch_platform
BASE_GRAPHQL:   https://api.github.com/graphql
```

### GraphQL — Board operations

```graphql
# List all user projects (use to find PROJECT_NUMBER after creating board)
query GetUserProjects {
  user(login: "ajeetchouksey") {
    projectsV2(first: 20) {
      nodes { number title id url }
    }
  }
}

# Get full board state (backlog read)
query GetProjectItems($number: Int!) {
  user(login: "ajeetchouksey") {
    projectV2(number: $number) {
      id title url
      items(first: 100) {
        nodes {
          id
          fieldValues(first: 10) {
            nodes {
              ... on ProjectV2ItemFieldTextValue {
                text field { ... on ProjectV2FieldCommon { name } }
              }
              ... on ProjectV2ItemFieldSingleSelectValue {
                name field { ... on ProjectV2FieldCommon { name } }
              }
              ... on ProjectV2ItemFieldNumberValue {
                number field { ... on ProjectV2FieldCommon { name } }
              }
            }
          }
          content {
            ... on Issue {
              number title state url
              labels(first: 5) { nodes { name color } }
              milestone { title }
              assignees(first: 3) { nodes { login } }
            }
          }
        }
      }
    }
  }
}

# Create project board (run once during Setup)
mutation CreateProject($ownerId: ID!) {
  createProjectV2(input: {
    ownerId: $ownerId
    title: "AI Architect Hub — Platform Roadmap"
  }) {
    projectV2 { id number url }
  }
}

# Add an issue to the project board
mutation AddToProject($projectId: ID!, $contentId: ID!) {
  addProjectV2ItemById(input: {
    projectId: $projectId
    contentId: $contentId
  }) {
    item { id }
  }
}

# Get user node ID (needed for createProjectV2 ownerId)
query GetUserId {
  user(login: "ajeetchouksey") { id }
}
```

### REST — Issues, labels, milestones

```
# Create label
POST /labels
{ "name": "type:feat", "color": "7c3aed", "description": "New feature or capability" }

# Create milestone
POST /milestones
{ "title": "v2.0 — Content Expansion", "due_on": "2026-06-30T00:00:00Z", "description": "..." }

# Create issue
POST /issues
{ "title": "...", "body": "...", "labels": ["type:feat", "P1-high"], "milestone": 1 }

# List open issues (backlog read)
GET /issues?state=open&per_page=100

# List merged PRs since date (release notes)
GET /pulls?state=closed&sort=updated&direction=desc&per_page=50
```
