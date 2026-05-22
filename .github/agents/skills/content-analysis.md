---
name: content-analysis
description: >
  Analyze web content or documents to extract CCA-F exam-relevant concepts.
  Classifies content into domains, identifies key patterns, and determines
  what's new vs already covered.
---

# Content Analysis Skill

## Purpose
Given raw content (from a URL, document, or paste), analyze it to:
1. Identify concepts relevant to the CCA-F exam
2. Classify each concept into Domain 1-5
3. Determine novelty (new vs already in our content)
4. Rate exam-relevance (high/medium/low)

## Analysis Framework

For each concept found, produce:

```json
{
  "concept": "Name of the concept",
  "domain": 1-5,
  "subtopic": "Which section it belongs to (e.g., '1.3 Hooks')",
  "relevance": "high|medium|low",
  "already_covered": true/false,
  "coverage_location": "file path if already covered",
  "suggested_action": "add_question|update_note|add_scenario|skip",
  "key_facts": ["Fact 1", "Fact 2"],
  "exam_angle": "How this might appear as an exam question"
}
```

## Domain Classification Rules

### Domain 1: Agentic Architecture (27%)
Keywords: agent, coordinator, subagent, loop, hook, PreToolUse, PostToolUse, 
Stop hook, HITL, human-in-the-loop, parallel execution, sequential, 
error propagation, checkpoint, orchestration, multi-agent

### Domain 2: Claude Code Configuration (20%)
Keywords: CLAUDE.md, scoped rules, .claude/rules, frontmatter, path:, 
skills vs tools, MCP server config, settings.json, headless mode, -p flag,
slash commands, .claude/commands, permissions, allow/deny

### Domain 3: Prompt Engineering (20%)
Keywords: system prompt, XML tags, few-shot, extended thinking, 
structured output, tool_use, output_config, validation-retry, 
multi-pass review, prompt injection, JSON schema, chain-of-thought

### Domain 4: Tool Design & MCP (18%)
Keywords: tool description, 18-tool limit, tool_choice, auto/any/tool/none,
parallel tool calls, graceful failure, MCP primitives, resources, prompts,
FastMCP, stdio transport, tool parameters, JSON schema

### Domain 5: Context Management (15%)
Keywords: context window, lost-in-the-middle, progressive summarization,
prompt caching, cache_control, ephemeral, TTL, breakpoints, Message Batches,
custom_id, rate limiting, exponential backoff, token budget

## Deduplication Process

1. Extract key terms from the new concept
2. Search existing files using grep_search with those terms
3. If found in notes → check if our coverage is sufficient
4. If found in questions → check if the exam angle is different
5. Only mark "already_covered" if the SPECIFIC insight is present

## Relevance Scoring

- **High**: Core exam concept, likely to appear as a question
- **Medium**: Supporting detail that enriches understanding
- **Low**: Tangential or too advanced for foundations exam
