/**
 * tools-registry.mjs
 *
 * The 9 AI Tools pages (src/features/tools/pages/*.tsx, routed under
 * /tools/*) are static client-side utilities with no content repo, no
 * taxonomyIds field, and no build-time index of their own — collectRelDocs()
 * in build-content-intelligence.mjs structurally excluded them entirely
 * until now (see IDEA-0008 gap-closure Epic, ajch_food_for_thoughts#39/#40).
 *
 * This is the ONE canonical list of each tool's id/title/keywords, replacing
 * src/components/RelatedContent.tsx's hardcoded TOOLS_MAP as the source of
 * truth (that component is scheduled for retirement — ajch_food_for_thoughts
 * #42 — once ComputedRelatedList covers everywhere it covered). Keywords are
 * copied verbatim from TOOLS_MAP at the time this file was created; resolve
 * them through scripts/lib/taxonomy.mjs's buildAliasIndex() to get real
 * taxonomyIds — do NOT hand-assign taxonomyIds here, that reintroduces the
 * exact "second parallel system, no shared vocabulary" problem this file
 * exists to close.
 */
export const TOOLS = [
  {
    id: 'token-counter',
    title: 'Token Counter',
    url: '/tools/token-counter',
    keywords: ['tokens', 'context', 'claude', 'llm', 'prompt', 'ai', 'model', 'budget'],
  },
  {
    id: 'system-prompt-builder',
    title: 'System Prompt Builder',
    url: '/tools/system-prompt-builder',
    keywords: ['prompt-engineering', 'system-prompt', 'claude', 'prompting', 'ai', 'llm'],
  },
  {
    id: 'mcp-scaffold',
    title: 'MCP Scaffold',
    url: '/tools/mcp-scaffold',
    keywords: ['mcp', 'tool-design', 'tools', 'server', 'claude', 'api'],
  },
  {
    id: 'context-visualizer',
    title: 'Context Visualizer',
    url: '/tools/context-visualizer',
    keywords: ['context', 'tokens', 'llm', 'ai', 'claude', 'window'],
  },
  {
    id: 'model-cost-calc',
    title: 'Model Cost Calculator',
    url: '/tools/model-cost-calc',
    keywords: ['cost', 'pricing', 'claude', 'azure-ai', 'azure-openai', 'model', 'ptu'],
  },
  {
    id: 'tool-schema-builder',
    title: 'Tool Schema Builder',
    url: '/tools/tool-schema-builder',
    keywords: ['mcp', 'tool-design', 'json', 'schema', 'tools', 'api'],
  },
  {
    id: 'rag-chunk-visualizer',
    title: 'RAG Chunk Visualizer',
    url: '/tools/rag-chunk-visualizer',
    keywords: ['rag', 'embeddings', 'context', 'ai', 'llm', 'search'],
  },
  {
    id: 'prompt-tester',
    title: 'Prompt Tester',
    url: '/tools/prompt-tester',
    keywords: ['prompt-engineering', 'prompting', 'testing', 'api', 'claude', 'llm'],
  },
  {
    id: 'prompt-library',
    title: 'Prompt Library',
    url: '/tools/prompt-library',
    keywords: ['prompt-engineering', 'prompting', 'templates', 'claude', 'ai'],
  },
];
