# D4: IDE Integration & Developer Tools

> **Exam weight**: ~25% · **Questions**: ~23 of 134

## Overview

Domain 4 covers how Copilot integrates into development environments — VS Code, JetBrains IDEs, Visual Studio, Neovim, and the GitHub CLI. It tests your ability to configure, enable/disable, and troubleshoot Copilot across these surfaces.

> 💡 **Human Angle**: *"Copilot lives where you work. Domain 4 tests whether you know how to set it up, shut it down when needed, and get the most out of every surface."*

## Supported IDEs and Surfaces

| Surface | Plugin/Extension | Notes |
|---|---|---|
| VS Code | GitHub Copilot + GitHub Copilot Chat | Most feature-rich; supports all slash commands |
| JetBrains (IntelliJ, PyCharm, etc.) | GitHub Copilot plugin | Chat available; some slash commands supported |
| Visual Studio | GitHub Copilot extension | Windows-only; Chat supported |
| Neovim | `copilot.vim` / `copilot.lua` | Completions only; no Chat |
| GitHub.com (web) | Built-in (Enterprise only) | Chat in PR, Issues, Code Search |
| GitHub CLI | `gh copilot` | Terminal-based Chat; `explain` and `suggest` subcommands |

### Exam Trap ⚠️

<div class="note-trap">
Neovim does NOT support Copilot Chat — completions only. This is a frequent exam distractor. Questions like "Which IDE supports inline suggestions but NOT Chat?" → Neovim.
</div>

## VS Code Configuration

### Enable/Disable Copilot

| Action | Where |
|---|---|
| Disable globally | Status bar → Copilot icon → Disable |
| Disable for a language | Status bar → Disable for `<language>` |
| Disable per workspace | `.vscode/settings.json` → `"github.copilot.enable": { "<language>": false }` |

### Settings of Note

```jsonc
// .vscode/settings.json
{
  "github.copilot.enable": {
    "*": true,
    "markdown": false,      // Disable for markdown
    "plaintext": false       // Disable for plain text
  },
  "github.copilot.advanced": {
    "length": 500           // Max suggestion length in tokens
  }
}
```

### Exam Trap ⚠️

<div class="note-trap">
The `github.copilot.enable` key takes a *language map*, not a boolean. Setting `"github.copilot.enable": false` at the top level does NOT work — you must set `"*": false` in the language map.
</div>

## GitHub Copilot CLI

The GitHub CLI extension adds Copilot Chat to the terminal:

```bash
gh copilot explain "git rebase --interactive HEAD~3"
gh copilot suggest "undo the last commit without losing changes"
```

**Key commands**:
| Command | Purpose |
|---|---|
| `gh copilot explain` | Explain a shell command |
| `gh copilot suggest` | Suggest a shell command for a task |

The CLI integration is **read-only** by default — it suggests commands but doesn't run them. Users must review and execute manually.

## JetBrains Configuration

- The Copilot plugin installs from JetBrains Marketplace
- Requires signing in with a GitHub account
- Chat is available via a dedicated side panel
- Inline completions work in all file types

## Copilot in GitHub.com (Enterprise Only)

Enterprise subscribers get Copilot Chat integrated into:
- **Pull request** review — ask Copilot to explain a diff
- **Issues** — ask Copilot to summarize or draft responses
- **Code Search** — natural-language queries against the codebase

This surface is NOT available on Copilot Business or Individual.

## Deep Dive: Making IDE Integration Click

### 1. The connective narrative

Copilot is not a single product — it's a family of integrations across editors, the web, and the CLI. Each surface has slightly different capabilities, and the exam tests whether you can match the right surface to the right use case. The VS Code extension is the reference implementation; other surfaces are subsets.

The hierarchy of capabilities (most → least):
```
VS Code (Chat + completions + slash commands + workspace context)
  └─ JetBrains (Chat + completions + most slash commands)
      └─ Visual Studio (Chat + completions)
          └─ GitHub.com Enterprise (Chat in PR/Issues/Search)
              └─ GitHub CLI (explain + suggest only)
                  └─ Neovim (completions only)
```

### 2. Worked scenario

> **Scenario.** A developer asks: "I'm using PyCharm and I want to use `/fix` on a selected block of code in Copilot Chat. Is that possible?"
>
> **Answer.** Yes — JetBrains supports the Copilot plugin with Chat, and `/fix` is supported in Chat for selected code. The developer should install the GitHub Copilot plugin from JetBrains Marketplace, authenticate with their GitHub account, and open the Chat panel with `Alt+Shift+C`.
>
> **Exam angle.** If the question said "Neovim" instead of "PyCharm" → the answer would be NO, Copilot Chat is not available in Neovim.

### 3. Memory aid

**JVVNG** (in decreasing capability order):
- **J**etBrains — Chat + completions
- **V**S Code — full (Chat + completions + workspace context)
- **V**isual Studio — Chat + completions (Windows)
- **N**eovim — completions ONLY
- **G**itHub.com — Enterprise Chat (web only)
- **G**itHub CLI — explain + suggest only

### 4. Exam strategy for this domain

- Neovim = completions only, no Chat (classic exam trap)
- VS Code `github.copilot.enable` requires a language map, not a boolean
- GitHub.com Chat = Enterprise only (Business doesn't get it)
- CLI: `gh copilot suggest` suggests commands, doesn't run them
- Content exclusion settings are in GitHub org settings, NOT in the IDE
- One sentence: *"Know which Copilot feature lives in which surface — capability gaps between surfaces are always tested."*

## Cheat Sheet 📋

| Surface | Chat? | Completions? |
|---|---|---|
| VS Code | ✅ Full | ✅ |
| JetBrains | ✅ Most slash commands | ✅ |
| Visual Studio | ✅ | ✅ |
| Neovim | ❌ | ✅ |
| GitHub.com | Enterprise only | ❌ |
| GitHub CLI | `explain`/`suggest` only | ❌ |

| Config | Key |
|---|---|
| Disable globally in VS Code | Status bar → Copilot icon |
| Disable by language in VS Code | `"github.copilot.enable": { "markdown": false }` |
| CLI suggest but not run | `gh copilot suggest` — user must run manually |
