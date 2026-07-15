# Domain 4: Apply Prompt Engineering and Context Crafting

> **Exam Weight:** 13% | **GH-300 GitHub Copilot Certification**

---

## Overview

Prompt engineering is the practice of crafting inputs to AI models to maximize the quality and relevance of their outputs. For GitHub Copilot, effective prompting means providing the right context, specificity, and structure so Copilot can generate accurate, useful code suggestions.

---

## 1. Prompt Structure and Elements

### The Anatomy of an Effective Copilot Prompt

An effective prompt has four elements:

| Element | Description | Example |
|---------|-------------|---------|
| **Context** | What you're working on | "In a FastAPI application..." |
| **Intent** | What you want Copilot to do | "...generate a function that..." |
| **Constraints** | Requirements and restrictions | "...handles authentication via JWT..." |
| **Format** | Expected input/output shape | "...returns `Dict[str, Any]` with user data" |

### Example: Poor vs. Effective Prompt

```python
# ❌ POOR — too vague
# Process data

# ✅ EFFECTIVE — specific, contextual
# Process a List[Dict[str, Any]] of sales records.
# Each record has: id (str), amount (float), currency (str: 'USD'|'EUR'|'GBP'), date (ISO 8601).
# Convert all amounts to USD using rates: EUR=1.09, GBP=1.27.
# Return Dict[str, float] mapping date (YYYY-MM-DD) to total USD amount.
# Raise ValueError if unsupported currency encountered.
```

---

## 2. How Copilot Determines Context

### Context Sources (in priority order)

```
1. Current file content (before and after cursor)
2. Neighboring open tabs (recently viewed files)
3. copilot-instructions.md (always included in Chat)
4. @workspace index (for explicit @workspace queries)
5. Chat history (previous messages in session)
6. Explicit #file: references
```

### Best Practices for Context Optimization

**Open relevant files as tabs:**
- Type definitions / interfaces
- Example implementations following the desired pattern
- Related utilities and helpers

**Use descriptive naming:**
```python
# Good naming provides context implicitly:
def calculate_compound_interest(principal: float, annual_rate: float, years: int) -> float:
    # Copilot understands exactly what this should do from the name alone

# vs.
def calc(p, r, n):  # Copilot has no context
```

**Include type annotations:**
```typescript
// TypeScript interfaces help Copilot understand data shapes:
interface TransactionRecord {
  id: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  timestamp: Date;
}

// Now Copilot can generate type-safe transformations
function aggregateByMonth(transactions: TransactionRecord[]): Map<string, number> {
  // Copilot suggestion will be correctly typed
}
```

---

## 3. Prompting Techniques

### Zero-Shot Prompting

Asking Copilot to perform a task **without providing any examples**. Relies entirely on Copilot's pre-trained knowledge.

**When to use:** Common, well-understood tasks (sort an array, validate an email, fetch from an API).

```python
# Zero-shot: no examples needed — Copilot knows this pattern
# Validate an email address using RFC 5321 format rules. Return bool.
def validate_email(email: str) -> bool:
```

### Few-Shot Prompting

Providing **2–5 concrete examples** of the desired input/output pattern before requesting the new completion.

**When to use:** Non-standard, domain-specific, or organization-specific patterns.

```python
# Few-shot: showing examples of the desired transformation pattern

# Example 1:
# Input: "2024-01-15T10:30:00Z" → Output: "Jan 15, 2024 at 10:30 AM UTC"

# Example 2:
# Input: "2024-06-20T14:00:00Z" → Output: "Jun 20, 2024 at 2:00 PM UTC"

# Now apply the same pattern:
def format_timestamp_for_display(iso_timestamp: str) -> str:
    # Copilot infers the exact formatting pattern from examples
```

### Role Prompting

Asking Copilot to adopt an expert persona.

```
"Act as a security engineer reviewing this authentication middleware 
for OWASP Top 10 vulnerabilities. Identify specific risks and 
suggest concrete remediation for each finding."
```

### Single-Responsibility Prompting

Breaking complex tasks into focused, sequential prompts.

```
# Instead of: "Build a complete user authentication system with 
#              registration, login, JWT tokens, refresh tokens, 
#              and rate limiting"

# Do this sequentially:
# Step 1: Generate the User model with password hashing
# Step 2: Generate the JWT token generation utilities  
# Step 3: Generate the login endpoint with credential validation
# Step 4: Generate the refresh token endpoint
# Step 5: Generate the rate limiting middleware
```

---

## 4. Chat Context Variables

### Available Context References in Copilot Chat

| Reference | Description | When to Use |
|-----------|-------------|-------------|
| `@workspace` | Search across all indexed workspace files | Codebase discovery questions |
| `@vscode` | VS Code settings and feature questions | IDE configuration |
| `@terminal` | Current terminal context and output | Shell command help |
| `#file:path/to/file.ts` | Specific file as context | Known file, targeted question |
| `#selection` | Currently selected editor text | Code-specific questions |
| `#codebase` | Broader codebase context | General architecture questions |

### When to Use `#file:` vs. `@workspace`

| Use `#file:` when... | Use `@workspace` when... |
|---------------------|------------------------|
| You know exactly which file contains the context | You need to discover where something is defined |
| You want precise, targeted context | You're asking about patterns across the codebase |
| You need to reference a specific API or type | You want Copilot to find the relevant context itself |

---

## 5. Chat History Usage

### How Chat History Works

- Each Copilot Chat session maintains conversation history
- Previous messages and responses are included in subsequent prompts
- Copilot uses history to maintain coherence and resolve references ("it", "the function we discussed")
- **Starting a new conversation clears history** — use for unrelated tasks

### Effective History Management

```
Session 1: "I'm working on the order processing pipeline"
→ Copilot has order processing context for the rest of this session

Later: "Add error handling to the processor we just built"
→ Copilot knows "the processor" from chat history

New task: Start a NEW conversation to avoid old context polluting new task
```

---

## 6. The Prompt Process Flow

### End-to-End Process

```
1. Developer types a message in Copilot Chat or a comment in editor
   ↓
2. IDE extension collects context (open files, selection, workspace index)
   ↓
3. Context assembled with chat history + copilot-instructions.md
   ↓
4. Complete prompt constructed and sent to Copilot proxy
   ↓
5. Safety pre-processing
   ↓
6. LLM inference — model generates response
   ↓
7. Post-processing (safety, public code filter)
   ↓
8. Response returned to IDE
   ↓
9. Developer reviews, iterates if needed
```

---

## Prompt Engineering Best Practices Summary

| Practice | Impact |
|----------|--------|
| **Be specific about inputs and outputs** | High — dramatically improves suggestion accuracy |
| **Use descriptive variable/function names** | High — implicit prompt engineering at no extra cost |
| **Include type annotations** | High — enables type-safe suggestions |
| **Open relevant neighboring files** | Medium — provides context about patterns and types |
| **Use single-responsibility prompts** | Medium — focused prompts outperform multi-task prompts |
| **Provide examples for non-standard patterns** | High (when needed) — few-shot learning is effective |
| **Iterate and refine** | High — first attempt isn't always optimal |
| **Use `#file:` for precision** | Medium — avoid adding noise from irrelevant files |

---

## Key Exam Traps ⚠️

| Trap | Correct Answer |
|------|---------------|
| "Few-shot means providing 1 example" | Few-shot is **2–5 examples** (1 is one-shot) |
| "Zero-shot means no prompt" | Zero-shot means **no examples** but you still write a prompt |
| "Longer prompts always produce better results" | Focused, shorter prompts often outperform noisy multi-task prompts |
| "Chat history persists across sessions" | Chat history is **session-scoped** — clears when new conversation starts |
| "`@workspace` searches the internet" | `@workspace` searches your **local indexed codebase** only |

---

## Quick Reference

| Technique | Use When |
|-----------|---------|
| Zero-shot | Common, well-established patterns |
| Few-shot | Domain-specific or non-standard patterns |
| Role prompting | Expert review or specialized perspective needed |
| Single-responsibility | Complex multi-step tasks |
| `#file:` | You know exactly which file has the context |
| `@workspace` | You need Copilot to discover relevant context |
| New conversation | Switching to an unrelated task (prevents context pollution) |
