// ── Global Search Engine ──────────────────────────────────────────────────
// Pure TypeScript — no DOM, no React, no external deps.
// All URL segments come from validated manifest data (blog slugs validated
// by SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/ in generate-rss.mjs;
// exam IDs and domain IDs are loaded from server-side JSON, never from
// user input). AppSec binding condition from Sprint 4 pre-build gate met.
// ──────────────────────────────────────────────────────────────────────────

export type SearchDocType = 'blog' | 'exam' | 'tool' | 'note' | 'interview' | 'usecase' | 'lab';

export interface SearchDocument {
  id: string;
  type: SearchDocType;
  title: string;
  excerpt: string;
  url: string;           // always a local SPA path, e.g. "/blog/my-post"
  tags: string[];
  category?: string;
  // Populated once content carries taxonomyIds (see IDEA-0008, Phase 2) —
  // the relationship engine (Phase 3) scores doc pairs by taxonomyIds
  // overlap, weighted by updatedAt recency. Both optional and unused by
  // scoreDoc()/search() below until that phase lands.
  taxonomyIds?: string[];
  updatedAt?: string;
}

export interface SearchResult {
  doc: SearchDocument;
  score: number;
}

// ── Index builder ──────────────────────────────────────────────────────────

/**
 * Build a flat SearchDocument[] from blog manifest posts.
 * Slugs come from the server-side manifest; SLUG_RE already enforced
 * by generate-rss.mjs before they reach the index.
 */
export function buildBlogDocs(posts: Array<{
  slug: string;
  title: string;
  excerpt: string;
  tags?: string[];
  category?: string;
  draft?: boolean;
}>): SearchDocument[] {
  return posts
    .filter((p) => !p.draft)
    .map((p) => ({
      id: `blog/${p.slug}`,
      type: 'blog' as SearchDocType,
      title: p.title,
      excerpt: p.excerpt,
      url: `/blog/${p.slug}`,
      tags: p.tags ?? [],
      category: p.category,
    }));
}

/**
 * Build SearchDocument[] from exam registry entries.
 * Exam IDs come from the server-side exams/index.json — they are
 * hardcoded identifiers (e.g. "ccaf", "ab100"), not user input.
 */
export function buildExamDocs(exams: Array<{
  id: string;
  title: string;
  description: string;
  domains?: Array<{ id: number; title: string }>;
}>): SearchDocument[] {
  const docs: SearchDocument[] = [];
  for (const exam of exams) {
    docs.push({
      id: `exam/${exam.id}`,
      type: 'exam',
      title: exam.title,
      excerpt: exam.description,
      url: `/exams/${exam.id}`,
      tags: ['exam', 'certification'],
    });
    for (const domain of exam.domains ?? []) {
      docs.push({
        id: `exam/${exam.id}/domain-${domain.id}`,
        type: 'exam',
        title: `${exam.title} — ${domain.title}`,
        excerpt: `Domain ${domain.id}: ${domain.title}`,
        url: `/exams/${exam.id}/notes`,
        tags: ['exam', 'domain', 'notes'],
      });
    }
  }
  return docs;
}

// Static tool entries — URLs are hardcoded constants, not user input
export function buildToolDocs(): SearchDocument[] {
  return [
    { id: 'tool/token-counter', type: 'tool', title: 'Token Counter', excerpt: 'Count tokens for any text using cl100k_base tokenizer.', url: '/tools/token-counter', tags: ['tokens', 'llm', 'utility'] },
    { id: 'tool/context-visualizer', type: 'tool', title: 'Context Visualizer', excerpt: 'Visualise context window usage across a conversation.', url: '/tools/context-visualizer', tags: ['context', 'llm', 'visualize'] },
    { id: 'tool/model-cost-calc', type: 'tool', title: 'Model Cost Calculator', excerpt: 'Estimate API costs across models and providers.', url: '/tools/model-cost-calc', tags: ['cost', 'pricing', 'llm'] },
    { id: 'tool/prompt-tester', type: 'tool', title: 'Prompt Tester', excerpt: 'Test and iterate on prompts with structured output.', url: '/tools/prompt-tester', tags: ['prompt', 'testing', 'llm'] },
    { id: 'tool/mcp-scaffold', type: 'tool', title: 'MCP Scaffold', excerpt: 'Generate Model Context Protocol server scaffolding.', url: '/tools/mcp-scaffold', tags: ['mcp', 'scaffold', 'tool-use'] },
    { id: 'tool/system-prompt-builder', type: 'tool', title: 'System Prompt Builder', excerpt: 'Build structured system prompts with common patterns.', url: '/tools/system-prompt-builder', tags: ['prompt', 'system-prompt'] },
    { id: 'tool/tool-schema-builder', type: 'tool', title: 'Tool Schema Builder', excerpt: 'Generate JSON schema definitions for Claude tool use.', url: '/tools/tool-schema-builder', tags: ['schema', 'tools', 'json'] },
    { id: 'tool/rag-chunk-visualizer', type: 'tool', title: 'RAG Chunk Visualizer', excerpt: 'Visualise how text is chunked for retrieval.', url: '/tools/rag-chunk-visualizer', tags: ['rag', 'chunking', 'retrieval'] },
    { id: 'tool/prompt-library', type: 'tool', title: 'Prompt Library', excerpt: 'Browse and copy reusable prompt templates.', url: '/tools/prompt-library', tags: ['prompt', 'library', 'templates'] },
  ];
}

/**
 * Build SearchDocument[] from interview-prep bank items.
 * Bank item IDs are hardcoded slug-style identifiers (e.g. "q-orch-001")
 * authored by the Interview Prep Engineer, never derived from raw JD text.
 * Results are deduped by design because the bank is the single source of truth.
 */
export function buildInterviewDocs(items: Array<{
  id: string;
  question: string;
  competency: string;
  type: string;
  difficulty: string;
  tags?: string[];
  detailedAnswer?: { summary?: string };
}>): SearchDocument[] {
  return items.map((q) => ({
    id: `interview/${q.id}`,
    type: 'interview' as SearchDocType,
    title: q.question,
    excerpt: q.detailedAnswer?.summary ?? '',
    url: `/roleprep/q/${q.id}`,
    tags: [...(q.tags ?? []), q.type, q.difficulty],
    category: q.competency,
  }));
}

/**
 * Build SearchDocument[] from the deduped use-case list (loadAllUseCases()).
 * Use-cases carry `patterns`, not `tags` — mapped onto tags[] here since
 * that's what search scoring/rendering expects; `problem` (only present on
 * FeaturedUseCase, not CatalogUseCase) doubles as the excerpt when present.
 */
export function buildUseCaseDocs(cases: Array<{
  id: string;
  title: string;
  vertical: string;
  patterns: string[];
  problem?: string;
}>): SearchDocument[] {
  return cases.map((c) => ({
    id: `usecase/${c.id}`,
    type: 'usecase' as SearchDocType,
    title: c.title,
    excerpt: c.problem ?? '',
    url: `/usecases/${c.id}`,
    tags: c.patterns ?? [],
    category: c.vertical,
  }));
}

/**
 * Build SearchDocument[] from the HOL Labs index summaries
 * (loadHolLabsIndex().labs) — the lightweight per-lab entries carried in
 * index.json, not the full per-lab detail file (no N+1 fetch needed).
 */
export function buildHolLabDocs(labs: Array<{
  id: string;
  title: string;
  tagline: string;
  domain: string;
  tags?: string[];
}>): SearchDocument[] {
  return labs.map((l) => ({
    id: `lab/${l.id}`,
    type: 'lab' as SearchDocType,
    title: l.title,
    excerpt: l.tagline,
    url: `/hol-labs/${l.id}`,
    tags: l.tags ?? [],
    category: l.domain,
  }));
}

/**
 * Assemble the complete 7-type search index from already-fetched raw data.
 * Deliberately takes plain data, not loader functions — this file stays
 * dependency-free (see header) so it can be imported by both the browser
 * SPA (via src/lib/content-loader.ts's fetchers) and a future Node build
 * script (via scripts/lib/content-sources.mjs's fetchers), which resolve
 * promoted-vs-local content differently and must not be entangled here.
 * Each parameter is optional so a caller missing one source (e.g. a script
 * that only cares about some verticals) doesn't need to pass empty arrays.
 */
export function buildFullIndex(sources: {
  blogPosts?: Parameters<typeof buildBlogDocs>[0];
  exams?: Parameters<typeof buildExamDocs>[0];
  interviewItems?: Parameters<typeof buildInterviewDocs>[0];
  useCases?: Parameters<typeof buildUseCaseDocs>[0];
  holLabs?: Parameters<typeof buildHolLabDocs>[0];
}): SearchDocument[] {
  return [
    ...buildBlogDocs(sources.blogPosts ?? []),
    ...buildExamDocs(sources.exams ?? []),
    ...buildToolDocs(),
    ...buildInterviewDocs(sources.interviewItems ?? []),
    ...buildUseCaseDocs(sources.useCases ?? []),
    ...buildHolLabDocs(sources.holLabs ?? []),
  ];
}

// ── Search function ────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[\s\-_/,]+/).filter((t) => t.length > 1);
}

/**
 * Score a document against a set of query tokens.
 * title match = 3pts, tag match = 2pts, excerpt/category match = 1pt.
 */
function scoreDoc(doc: SearchDocument, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 0;
  const titleLow = doc.title.toLowerCase();
  const excerptLow = doc.excerpt.toLowerCase();
  const tagsLow = doc.tags.map((t) => t.toLowerCase());
  const categoryLow = (doc.category ?? '').toLowerCase();

  let score = 0;
  for (const term of queryTokens) {
    if (titleLow.includes(term)) score += 3;
    if (tagsLow.some((t) => t.includes(term))) score += 2;
    if (excerptLow.includes(term)) score += 1;
    if (categoryLow.includes(term)) score += 1;
  }
  return score;
}

/**
 * Search the document index.
 * @param query - raw user input string (used for comparison only, never eval'd)
 * @param docs  - pre-built document index
 * @param limit - max results to return (default 8)
 */
export function search(
  query: string,
  docs: SearchDocument[],
  limit = 8
): SearchResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const tokens = tokenize(trimmed);
  return docs
    .map((doc) => ({ doc, score: scoreDoc(doc, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
