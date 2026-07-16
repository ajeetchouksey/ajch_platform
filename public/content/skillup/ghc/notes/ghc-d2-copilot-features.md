# Domain 2: Use GitHub Copilot Features

> **Exam Weight:** 27% | **GH-300 GitHub Copilot Certification**

---

## Overview

This is the highest-weight domain — covering the full breadth of Copilot's feature set across IDE integration, CLI usage, advanced capabilities, and organizational administration.

---

## 1. Using Copilot in the IDE

### Supported IDEs

| IDE | Support Level |
|-----|--------------|
| Visual Studio Code | Full (inline, Chat, Agent Mode, Edits) |
| JetBrains (IntelliJ, PyCharm, etc.) | Full |
| Visual Studio | Full |
| Vim / Neovim | Inline suggestions |
| Azure Data Studio | Inline suggestions |

### Enabling Copilot

1. Install the **GitHub Copilot** extension from the marketplace
2. Sign in with your GitHub account that has a Copilot subscription
3. Extension authenticates and activates automatically

### Inline Suggestions (Ghost Text)

- Copilot provides grey "ghost text" suggestions as you type
- **Accept:** `Tab`
- **Reject:** `Escape`
- **Next suggestion:** `Alt+]` (VS Code)
- **Previous suggestion:** `Alt+[` (VS Code)
- **Accept word by word:** `Ctrl+Right` (VS Code)

### Copilot Chat

Copilot Chat is an AI conversation panel within the IDE.

**Chat Participants / Context**

| Participant | Purpose |
|------------|---------|
| `@workspace` | Search and reason about the entire indexed codebase |
| `@vscode` | Ask about VS Code settings, extensions, and features |
| `@terminal` | Get help with the current terminal command or output |
| `#file:path` | Reference a specific file as context |
| `#selection` | Reference the current editor selection as context |

**Slash Commands**

| Command | Action |
|---------|--------|
| `/explain` | Explain selected code in natural language |
| `/fix` | Suggest fixes for problems in selected code |
| `/tests` | Generate unit tests for selected code |
| `/doc` | Generate documentation for selected code |
| `/optimize` | Suggest performance improvements for selected code |
| `/new` | Generate a new file or project scaffold |
| `/clear` | Clear the current chat conversation history |

---

## 2. GitHub Copilot CLI

### What Is Copilot CLI?

Copilot CLI extends GitHub Copilot's AI capabilities into the **terminal/command line** interface, helping developers with shell commands, scripts, and CLI tool usage.

### Installation

```bash
# Requires GitHub CLI (gh) to be installed first
gh extension install github/gh-copilot

# Verify installation
gh copilot --version
```

### Key Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `gh copilot explain "<command>"` | Explains what a command does | `gh copilot explain "git rebase -i HEAD~3"` |
| `gh copilot suggest "<task>"` | Suggests a command for a task | `gh copilot suggest "find all files larger than 100MB"` |

### CLI Sessions

- Copilot CLI supports multi-turn sessions for iterative command refinement
- Context from previous commands in the session is preserved
- Sessions end when the terminal process ends

### Use Cases

- Understand complex git commands without leaving the terminal
- Generate `awk`, `sed`, `grep` patterns from descriptions
- Create Docker and Kubernetes commands from natural language
- Generate GitHub Actions workflow commands

---

## 3. Advanced Copilot Features

### Agent Mode

Agent Mode enables GitHub Copilot to autonomously complete **multi-step, multi-file development tasks**.

**Characteristics:**
- Copilot iterates autonomously: plans, executes, self-corrects
- Can create, modify, and delete multiple files
- Runs terminal commands when needed (with user approval)
- Stops and asks when encountering ambiguity

**When to Use:**
- "Build a complete login form with validation, API call, and unit tests"
- "Refactor all usages of the deprecated API across the repository"
- "Set up a GitHub Actions CI/CD pipeline for this Node.js project"

**How to Invoke (VS Code):**
- Open Copilot Chat
- Select "Agent" from the model/mode dropdown
- Describe the multi-step task

### Copilot Edits

Copilot Edits enables multi-file editing from a single natural language instruction.

**vs. Chat:**
- Chat: conversational, single-response suggestions in the chat panel
- Edits: applies changes directly across multiple open files simultaneously

**Workflow:**
1. Open the files you want to modify
2. Open Copilot Edits panel
3. Describe the change (e.g., "Add TypeScript types to all these React components")
4. Review the proposed changes per file
5. Accept or reject individual changes

### Model Context Protocol (MCP)

MCP is an open standard that enables Copilot to connect to **external tools and data sources**.

```
IDE + Copilot ←→ MCP Server ←→ External Systems
                              (databases, APIs, file systems, services)
```

**Examples:**
- Connect Copilot to a database for schema-aware SQL generation
- Connect to Jira/GitHub Issues for context about requirements
- Connect to documentation sources for up-to-date API information

### Copilot Sub-Agents and Extensions

- **Sub-Agents:** Specialized Copilot capabilities for specific domains (code review, testing)
- **Extensions:** Third-party integrations that add context or capabilities to Copilot Chat

### GitHub Copilot Spaces

- Collaborative AI environment on GitHub.com
- Allows teams to share Copilot context and conversations
- Can be configured with shared instructions and knowledge bases

### GitHub Copilot Spark

- Create full web applications from natural language descriptions on github.com
- No prior coding experience required
- Generates, hosts, and deploys web apps

### PR Summaries

Copilot automatically generates PR descriptions summarizing:
- What changed and why
- Files modified
- Testing performed
- Impact assessment

Enable in Repository Settings → Copilot → Pull Request Summaries.

### Copilot Code Review

Automated AI-powered code review on pull requests:
- Identifies potential issues
- Suggests improvements
- Provides actionable inline comments
- Complements (does not replace) human code review

Enable per-repository or org-wide in Copilot settings.

### copilot-instructions.md

Repository-level customization for Copilot Chat behavior:

```markdown
<!-- .github/copilot-instructions.md -->
# GitHub Copilot Instructions

## Code Style
- Use snake_case for Python variables
- Prefer async/await over callback patterns
- All React components must be functional components with TypeScript

## Architecture
- Backend: FastAPI with SQLAlchemy ORM
- Frontend: React 19 + TypeScript + Vite
- Database: PostgreSQL via psycopg3

## Testing
- Use pytest for backend; Vitest for frontend
- Minimum 80% coverage required for all new features
```

This file is automatically included in Copilot Chat's system context for all users in the repository.

---

## 4. Organization-Wide Administration

### Copilot Policy Management

Organization admins manage Copilot via **Settings → GitHub Copilot → Policies**.

| Policy | Options |
|--------|---------|
| Suggestions matching public code | Allowed / Blocked |
| Copilot in IDE | Enabled / Disabled |
| Copilot Chat in IDE | Enabled / Disabled |
| Copilot on github.com | Enabled / Disabled |
| Agent Mode | Enabled / Disabled |
| Copilot Edits | Enabled / Disabled |

### Seat Management via REST API

```bash
# List seats
GET /orgs/{org}/copilot/billing/seats

# Add seats
POST /orgs/{org}/copilot/billing/selected_users

# Remove seats
DELETE /orgs/{org}/copilot/billing/selected_users
```

### Audit Log Events

Monitor Copilot governance changes via Organization → Settings → Audit Log:

| Event | Trigger |
|-------|---------|
| `copilot.policy_change` | Admin changes a Copilot policy |
| `copilot.seat_assigned` | User is assigned a Copilot seat |
| `copilot.seat_removed` | User's Copilot seat is revoked |

---

## Key Exam Traps ⚠️

| Trap | Correct Answer |
|------|---------------|
| "Agent Mode requires a specific keyboard shortcut" | Agent Mode is selected from the Chat mode dropdown |
| "copilot-instructions.md goes in the repo root" | It goes in `.github/copilot-instructions.md` |
| "`gh copilot explain` is for text only" | It works on shell commands and their output |
| "Copilot Code Review replaces human review" | It **complements** human review — not a replacement |
| "Content exclusions only affect inline suggestions" | They affect **both** inline suggestions AND Chat |

---

## Quick Reference

| Feature | Where to Find It |
|---------|-----------------|
| Inline suggestions | Any file in the IDE as you type |
| Copilot Chat | IDE side panel (beaker/chat icon) |
| Copilot Edits | Copilot Chat panel → Edits mode |
| Agent Mode | Copilot Chat panel → Agent mode dropdown |
| CLI | Terminal: `gh copilot explain/suggest` |
| PR Summary | PR creation page → Copilot Summary button |
| Code Review | PR page → Request Copilot Review |
| Spark | github.com/copilot |
| Organization settings | Organization → Settings → Copilot |

---

## Deep Dive: Choosing the Right Feature for the Job

Domain 2 carries the **highest exam weight (27%)**, and the most common question style is: *"A developer wants to do X — which Copilot feature should they use?"* The features overlap, so understanding the **decision boundaries** is worth more than memorising each feature in isolation.

### Inline vs. Chat vs. Edits vs. Agent Mode — the mental model

Think of these four as a ladder of increasing **autonomy and scope**:

| Feature | Scope | Autonomy | Best for |
|---------|-------|----------|----------|
| **Inline suggestions** | Current cursor position | None — you drive every keystroke | Completing the line/block you're actively typing |
| **Copilot Chat** | Conversational, single file/selection | Low — you apply changes manually | Asking questions, explaining, generating a snippet to copy |
| **Copilot Edits** | Multiple files you choose | Medium — proposes diffs across files, you approve each | A *known* change spanning several files ("add types to these components") |
| **Agent Mode** | Whole task, files it decides | High — plans, edits, runs commands, self-corrects | An *open-ended* multi-step goal ("build the login flow with tests") |

**The exam distinction that trips people up:** *Edits* vs *Agent Mode*. Use **Edits** when *you* already know which files change and roughly what the change is. Use **Agent Mode** when the task requires the AI to **figure out the plan itself**, potentially touching files you didn't anticipate and running commands. Edits = you hold the map; Agent = Copilot draws the map.

### A concrete walkthrough

> **Task:** "Migrate our REST client from `axios` to the native `fetch` API across the project."
>
> - If you open the 3 files you *know* use axios and want controlled, file-by-file diffs → **Copilot Edits**.
> - If you're not sure how many files are affected and want Copilot to search, plan the migration, update each call site, and run the test suite to confirm → **Agent Mode**.
> - If you just want to understand *how* one tricky axios interceptor maps to fetch before deciding → **Chat** with `/explain`.

### Where MCP fits

MCP (Model Context Protocol) is not a "mode" — it's a **connector**. It extends *any* of the above by giving Copilot live access to external systems (a database schema, an issue tracker, live docs). The exam framing: MCP answers the question *"how does Copilot get context it can't see in your open files?"* When a question mentions **schema-aware SQL** or **pulling live requirements from Jira**, MCP is the mechanism.

### `copilot-instructions.md` — why it matters more than it looks

This single file is the highest-leverage customisation in the exam. It is:
- Located at **`.github/copilot-instructions.md`** (a very common trap answer places it in repo root).
- **Always injected** into Chat's system context for *every* developer on the repo — so it standardises AI behaviour team-wide without each person configuring anything.
- The right answer whenever a question asks *"how do you make Copilot consistently follow our team's conventions?"*

### Exam Strategy for Domain 2

- Because this is the biggest domain, budget the most study time here. Expect several "which feature" scenario questions.
- Memorise the **invocation locations** (Agent Mode = Chat mode dropdown, not a shortcut; CLI = `gh copilot`; Spark = github.com).
- Remember Copilot Code Review **complements** human review — any answer saying it *replaces* reviewers is wrong.
- Content exclusions affect **both** inline *and* Chat (see Domain 6) — features don't leak excluded content.
