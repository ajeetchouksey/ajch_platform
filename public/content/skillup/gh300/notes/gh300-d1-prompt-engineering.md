# D1: Prompt Engineering & Copilot Chat

> **Exam weight**: ~25% · **Questions**: ~34 of 134

## Overview

GitHub Copilot Chat lets you interact with the AI model conversationally — inside your IDE, in GitHub.com, or via the CLI. Domain 1 tests your ability to craft prompts that produce accurate, relevant code suggestions and explanations.

> 💡 **Human Angle**: *"A good prompt is like a well-written ticket: the more context you give, the better the output. Vague asks get vague answers."*

## Prompt Engineering Fundamentals

### What Makes a Good Copilot Prompt

Effective prompts share four properties:
1. **Specificity** — say exactly what you need
2. **Context** — include language, framework, and surrounding code
3. **Scope** — define what should and shouldn't be changed
4. **Format** — specify output format when it matters (JSON, TypeScript, etc.)

### Inline vs Chat Prompts

| Mode | Best for |
|---|---|
| Inline (ghost text) | Short completions, boilerplate |
| Copilot Chat | Explanations, refactors, multi-step tasks |
| `/fix` `/explain` slash commands | Targeted single-purpose actions |

```
// Example: Specific inline prompt context
// TypeScript Express route — validate UUID param, return 404 if not found
router.get('/users/:id', async (req, res) => {
  // Copilot will generate a body that matches the comment above
```

### Exam Trap ⚠️

<div class="note-trap">
Students confuse *prompt length* with *prompt quality*. Longer prompts don't always produce better results — irrelevant context can dilute the signal. The exam tests whether you can identify the MINIMUM useful context, not the maximum.
</div>

## Copilot Chat Slash Commands

| Command | Purpose |
|---|---|
| `/explain` | Explain selected code |
| `/fix` | Fix bugs in selection |
| `/tests` | Generate unit tests |
| `/doc` | Add documentation |
| `/new` | Scaffold new files/projects |

### Context Variables in Chat

Use `#` variables to attach context:
- `#file` — attach a specific file
- `#selection` — attach current editor selection
- `#codebase` — search across the workspace

### Exam Trap ⚠️

<div class="note-trap">
The exam often asks which slash command is appropriate for a given task. `/fix` only works on selected code; `/explain` gives a human-readable explanation; `/tests` does not automatically run the tests — it only generates them.
</div>

## Work vs Web Toggle

Copilot Chat in VS Code and GitHub.com supports two search modes:
- **Work** toggle (default) — searches only your organization's data via **Microsoft Graph**
- **Web** toggle — searches the public internet via **Bing**

Enterprise admins can disable the Web toggle via policy.

## Deep Dive: Making Prompt Engineering Click

### 1. The connective narrative

Copilot is a prediction engine, not a mind reader. It predicts the most likely continuation of your code given the context visible in the editor. Prompt engineering is the skill of shaping that context — through comments, file structure, variable names, and explicit instructions — so the prediction lands where you want it.

The three levels of context Copilot uses:
1. **Local** — the lines immediately before/after your cursor
2. **Open tabs** — other files open in the editor (included automatically)
3. **Explicit** — `#file`, `#selection`, slash command arguments

Domain 1 questions test whether you know how to manipulate these three levels deliberately.

### 2. Worked scenario

> **Scenario.** A developer opens a new TypeScript file and types a single comment: `// get user`. Copilot generates a generic `getUser()` function that uses `fetch('/api/user')`. The developer wanted a function that calls an internal `UserRepository` class. What went wrong, and how should the prompt be improved?
>
> **Analysis.** Copilot only sees the comment and the empty file. It has no context about `UserRepository`. Better approaches:
> 1. Add a `import { UserRepository } from './UserRepository';` import line first
> 2. Write a more specific comment: `// get user by ID using UserRepository, throw NotFoundException if not found`
> 3. Open the `UserRepository.ts` file in another tab so Copilot sees the class definition
>
> **Correct answer on the exam**: The fix is to provide explicit context — either via imports, a more descriptive comment, or the `#file` context variable in Chat.

### 3. Memory aid

**SCIF** — the four dimensions of a good Copilot prompt:
- **S**pecificity — say exactly what you need
- **C**ontext — imports, framework, file type
- **I**ntent — what the code should do, not just its name
- **F**ormat — expected output shape

### 4. Exam strategy for this domain

- Questions about *which context source* Copilot uses — open tabs count; closed files do not
- Watch for questions about `#codebase` — it performs a workspace search, not a full-file read
- Slash commands: `/fix` requires a selection; `/explain` doesn't
- Work vs Web toggle: Work = Microsoft Graph (org data); Web = Bing (public internet)
- One sentence for exam prep: *"Good prompts give Copilot what it cannot see on its own."*

## Cheat Sheet 📋

| Concept | Key Rule |
|---|---|
| Ghost text source | Current file + open tabs |
| `/fix` requires | A selection |
| `#codebase` | Workspace search, not full read |
| Work toggle | Microsoft Graph — org data only |
| Web toggle | Bing — public internet |
| Best prompt tactic | Specificity + relevant context |
