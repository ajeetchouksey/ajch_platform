$ErrorActionPreference = 'Stop'

# ── Auth: prefer valid gh CLI token, fall back to gh_po_token.env ──────────────
$token = (gh auth token 2>$null)
if (-not $token) {
    $tokenLine = (Get-Content "$PSScriptRoot\..\gh_po_token.env") | Where-Object { $_ -match '^GH_PO_TOKEN=' }
    $token     = $tokenLine -replace '^GH_PO_TOKEN=', ''
}

$headers = @{
    'Authorization'        = "Bearer $token"
    'Accept'               = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
}
$repo      = 'ajeetchouksey/ajch_platform'
$labelsUrl = "https://api.github.com/repos/$repo/labels"
$issuesUrl = "https://api.github.com/repos/$repo/issues"

# ── Labels: base + "where it belongs" categories ──────────────────────────────
$labels = @(
    @{ name = 'field-notes';       color = '5319e7'; description = 'Field Notes blog series (practitioner, one sharp idea)' },
    @{ name = 'ai-tech';           color = '1d76db'; description = 'AI/LLM technical topic' },
    @{ name = 'reliability';       color = 'd93f0b'; description = 'Correctness, non-determinism, failure modes' },
    @{ name = 'cost-performance';  color = 'fbca04'; description = 'Token cost, latency, caching' },
    @{ name = 'data';              color = '0e8a16'; description = 'RAG, chunking, embeddings, memory' },
    @{ name = 'security';          color = 'b60205'; description = 'Prompt injection, leakage, supply chain' },
    @{ name = 'eval';              color = 'c5def5'; description = 'Evaluation, testing, quality gates' },
    @{ name = 'governance';        color = '006b75'; description = 'Responsible AI, policy, compliance' },
    @{ name = 'platform';          color = '0052cc'; description = 'Platform-engineering topic' },
    @{ name = 'operational';       color = 'e99695'; description = 'LLMOps, running AI in production' },
    @{ name = 'low-level-design';  color = 'bfdadc'; description = 'System/LLD design decisions' }
)
foreach ($l in $labels) {
    try {
        Invoke-RestMethod -Uri $labelsUrl -Method Post -Headers $headers -ContentType 'application/json' -Body ($l | ConvertTo-Json) | Out-Null
        Write-Host "Label '$($l.name)' created."
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 422) { Write-Host "Label '$($l.name)' exists - skipping." }
        else { throw }
    }
}

# ── Topics (title, category label, brief) ─────────────────────────────────────
$topics = @(
    # Exam-reinforcing / AI tech
    @{ t = "Copilot Isn't Autocomplete - It's a Context Negotiation";                  c = 'ai-tech';          b = 'How copilot-instructions.md, scope, and open-file context change output quality. Cross-link: GH-300 D2/D3.' },
    @{ t = "Your Prompt Isn't Vague - It's Under-Specified";                           c = 'ai-tech';          b = 'The vague->precise iteration loop; zero/one/few-shot as an example-count dial. Cross-link: GH-300 D4 / CCA-F D3.' },
    @{ t = "The 18-Tool Wall: Why Your Agent Gets Dumber As You Add Tools";            c = 'ai-tech';          b = 'Tool-count limits, tool_choice, graceful failure. Cross-link: CCA-F D4.' },
    @{ t = "Context Windows Are a Budget, Not a Bucket";                               c = 'ai-tech';          b = 'Lost-in-the-middle, caching, what to leave out. Cross-link: CCA-F D5.' },
    @{ t = "MCP Is Just a Contract - Stop Treating It Like Magic";                     c = 'ai-tech';          b = 'What the Model Context Protocol actually standardizes and where it does not help.' },
    @{ t = "Fine-Tuning Was the Wrong Answer";                                         c = 'ai-tech';          b = 'When RAG/prompting beats fine-tuning, and the maintenance cost nobody budgets for.' },
    @{ t = "Structured Output Is a Contract, Not a Prompt Trick";                      c = 'ai-tech';          b = 'JSON mode, function schemas, forcing shape instead of hoping for it.' },
    @{ t = "Small Models Are Winning the Boring Jobs";                                 c = 'ai-tech';          b = 'Routing/classification/extraction where a 7B beats a frontier model on cost + latency.' },
    @{ t = "The Router Pattern: One Prompt to Pick the Right Model";                   c = 'ai-tech';          b = 'Cascade cheap->expensive, fallback chains, cost-aware routing.' },
    @{ t = "Multi-Agent Is Usually a Distributed-Systems Problem in Disguise";         c = 'ai-tech';          b = 'Coordinator/subagent, message passing, partial failure - old lessons, new labels.' },
    @{ t = "Extended Thinking / Reasoning Tokens: When They Help, When They Just Cost"; c = 'ai-tech';         b = 'Where reasoning tokens earn their spend and where they burn it.' },

    # Reliability
    @{ t = "The RAG Answered Confidently - and It Was Wrong";                          c = 'reliability';      b = 'Retrieval returned the plausible chunk, not the correct one. Chunking, re-ranking, similarity != relevance.' },
    @{ t = "Same Prompt, Different Answer: Living With Non-Determinism";               c = 'reliability';      b = 'Temperature/sampling, and how to build tests when output is not stable.' },
    @{ t = "Tool-Calling Works in the Demo, Fails in Production";                      c = 'reliability';      b = 'Malformed JSON args, hallucinated tool names, silent argument drift. Schema validation + graceful failure.' },
    @{ t = "Your Agent Got Stuck in a Loop (And Burned Forty Dollars)";               c = 'reliability';      b = 'Infinite re-planning, no termination condition. Loop guards, step budgets, circuit breakers.' },

    # Cost / performance
    @{ t = "Context Stuffing Is a Tax You Pay Every Request";                          c = 'cost-performance'; b = 'Dumping the whole doc into the prompt: latency, cost, and worse answers.' },
    @{ t = "Streaming Hid Your Latency Problem - Until It Did Not";                    c = 'cost-performance'; b = 'TTFT vs total time; why p95 matters more than the happy-path demo.' },
    @{ t = "Caching Is the Cheapest Forty Percent You Will Ever Save";                 c = 'cost-performance'; b = 'Prompt caching, semantic cache, and cache-invalidation for LLMs.' },

    # Data
    @{ t = "The Embedding Model Changed and Your Vectors Rotted";                      c = 'data';             b = 'Re-embedding migrations, version pinning, silent recall degradation.' },
    @{ t = "Garbage Chunks In, Garbage Answers Out";                                   c = 'data';             b = 'PDF/table extraction reality, metadata, why 80% of RAG quality is ingestion.' },
    @{ t = "Memory Is Not a Vector Store";                                             c = 'data';             b = 'Conversation state, summarization decay, the multi-turn drift problem.' },

    # Security
    @{ t = "Prompt Injection Is Not Theoretical - It Is in Your Support Inbox";        c = 'security';         b = 'Indirect injection via retrieved content/user data; input sanitization != prompt safety. OWASP LLM Top 10.' },
    @{ t = "The Model Leaked the System Prompt";                                       c = 'security';         b = 'Extraction attacks, and why secrets never belong in the prompt.' },
    @{ t = "The Lockfile Is Your Real Dependency Manifest";                            c = 'security';         b = 'Transitive dev-deps (esbuild/undici/ws) are your true attack surface. Riffs on a recent npm audit fix.' },

    # Eval
    @{ t = "Guardrails You Cannot Measure Are Decorations";                            c = 'eval';             b = 'Building eval harnesses for refusals/jailbreaks instead of vibes-based safety.' },
    @{ t = "You Cannot Ship What You Cannot Eval";                                     c = 'eval';             b = 'Golden datasets, LLM-as-judge pitfalls, regression suites for prompts.' },

    # Governance
    @{ t = "AI Exclusions vs. the Public-Code Filter - They Are Not the Same Control"; c = 'governance';       b = 'The precedence trap most teams get wrong. Cross-link: GH-300 D6.' },
    @{ t = "Who Owns the Output? A Field Guide to AI Indemnification";                 c = 'governance';       b = 'Practical IP/liability angle for platform teams.' },
    @{ t = "Absolute Language Is a Code Smell in AI Policy";                           c = 'governance';       b = 'Why never/always distractors fail in both exams and real governance docs.' },

    # Platform
    @{ t = "Passwordless Is Not a Feature Flag - It Is an Identity Migration";         c = 'platform';         b = 'Entra ID / managed identity war story for platform teams.' },

    # Operational
    @{ t = "Observability for LLMs: Logs, Traces, and the Token Meter";                c = 'operational';      b = 'What to instrument: prompt, tokens, latency, tool calls, refusals.' },
    @{ t = "You Need a Kill Switch Before You Need a Roadmap";                         c = 'operational';      b = 'Feature flags, rate limits, spend caps, graceful degradation.' },
    @{ t = "Prompt Versioning Is Source Control You Forgot to Do";                     c = 'operational';      b = 'Treating prompts as deployable artifacts with rollback.' },
    @{ t = "Rate Limits, Retries, and the 429 That Took Down Your Feature";           c = 'operational';      b = 'Backoff, queues, provider failover.' },
    @{ t = "The Eval Pipeline in CI: Blocking Merges on Quality Regression";          c = 'operational';      b = 'Golden sets and LLM-as-judge gates in the merge path.' },
    @{ t = "Cost Attribution: Who Spent the Money Last Month?";                        c = 'operational';      b = 'Per-tenant / per-feature token accounting.' },
    @{ t = "Data Retention and PII in Prompts - Your Real Compliance Surface";         c = 'operational';      b = 'What actually gets logged and retained, and the compliance exposure.' },

    # Low-level design
    @{ t = "Where Does the Prompt Live? Config, Not Code";                             c = 'low-level-design'; b = 'Externalizing prompts, environments, hot-reload.' },
    @{ t = "Idempotency for Non-Deterministic Systems";                               c = 'low-level-design'; b = 'Request IDs, dedupe, safe retries when output varies.' },
    @{ t = "The Sync vs. Async Decision for AI Endpoints";                            c = 'low-level-design'; b = 'Request/response vs job queue + webhook for long generations.' },
    @{ t = "Streaming Architecture: SSE vs. WebSockets vs. Polling";                  c = 'low-level-design'; b = 'The tradeoffs you commit to early and regret later.' },
    @{ t = "Vector Store Is a Database - Treat It Like One";                          c = 'low-level-design'; b = 'Indexing, backups, schema/metadata design, hybrid search.' },
    @{ t = "Timeouts, Circuit Breakers, and Bulkheads for Model Calls";              c = 'low-level-design'; b = 'Resilience patterns borrowed from microservices.' },
    @{ t = "Designing the Fallback: What Happens When the Model Is Down?";            c = 'low-level-design'; b = 'Cached answers, degraded mode, human handoff.' },
    @{ t = "The Boring Interface: Abstracting the Provider So You Can Swap It";       c = 'low-level-design'; b = 'Anti-vendor-lock design for LLM SDKs.' }
)

Write-Host "`nCreating $($topics.Count) field-note issues..." -ForegroundColor Cyan
$created = @()
$n = 0
foreach ($topic in $topics) {
    $n++
    $body = @"
## Field Note brief

$($topic.b)

## What a good post includes
- [ ] One sharp, opinionated thesis (practitioner voice - one idea per post)
- [ ] A worked production scenario with real numbers / tools / config
- [ ] An actionable takeaway or checklist the reader can apply
- [ ] Cross-link to the matching SkillUp exam domain (where applicable)

_Pipeline: draft -> AppSec gate -> publish. Category: **$($topic.c)**._
"@
    $payload = @{
        title  = $topic.t
        body   = $body
        labels = @('field-notes', $topic.c)
    } | ConvertTo-Json -Depth 5

    try {
        $resp = Invoke-RestMethod -Uri $issuesUrl -Method Post -Headers $headers -ContentType 'application/json' -Body $payload
        Write-Host ("  [{0,2}/{1}] #{2}  {3}" -f $n, $topics.Count, $resp.number, $topic.t) -ForegroundColor Green
        $created += [pscustomobject]@{ number = $resp.number; title = $topic.t; category = $topic.c; url = $resp.html_url }
    } catch {
        Write-Host ("  [{0,2}/{1}] FAILED: {2} - {3}" -f $n, $topics.Count, $topic.t, $_.Exception.Message) -ForegroundColor Red
    }
    Start-Sleep -Milliseconds 800   # respect GitHub secondary rate limits
}

$created | ConvertTo-Json -Depth 5 | Set-Content "$PSScriptRoot\..\field-notes-issues-result.json"
Write-Host "`nDone. Created $($created.Count) issues. Result -> field-notes-issues-result.json" -ForegroundColor Cyan
