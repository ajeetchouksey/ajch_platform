/**
 * RelatedContent — Issue #63
 * Surfaces related SkillUp tracks and AI Tools based on tag/keyword overlap.
 * No network calls — all matching done at render time from static keyword maps.
 */
import { Link } from 'react-router-dom';
import { BookOpen, Wrench, ArrowRight } from 'lucide-react';

// ── Skill track keyword map ───────────────────────────────────────────────────
const SKILL_MAP: { id: string; shortTitle: string; title: string; href: string; color: string; keywords: string[] }[] = [
  {
    id: 'ccaf',
    shortTitle: 'CCA-F',
    title: 'Claude Certified Architect – Foundations',
    href: '/skillup/ccaf',
    color: '#7c3aed',
    keywords: ['claude', 'anthropic', 'mcp', 'agentic', 'prompt-engineering', 'prompting',
      'ai', 'llm', 'model', 'tool-design', 'context', 'agent', 'ai-agents',
      'ai-architecture', 'structured-output', 'system-prompt'],
  },
  {
    id: 'ab100',
    shortTitle: 'AB-100',
    title: 'Agentic AI Business Solutions Architect Expert',
    href: '/skillup/ab100',
    color: '#1d4ed8',
    keywords: ['azure', 'copilot-studio', 'azure-ai', 'foundry', 'microsoft',
      'agentic', 'responsible-ai', 'ai-governance', 'guardrails', 'power-platform',
      'azure-openai', 'ptu', 'capacity-planning'],
  },
  {
    id: 'ghbp',
    shortTitle: 'GH-BP',
    title: 'GitHub Engineering Best Practices',
    href: '/skillup/ghbp',
    color: '#16a34a',
    keywords: ['github', 'branch-protection', 'devops', 'ci-cd', 'governance',
      'security', 'actions', 'pipeline', 'platform-engineering', 'codeowners',
      'dependabot', 'branch', 'repository'],
  },
];

// ── AI Tools keyword map ──────────────────────────────────────────────────────
const TOOLS_MAP: { label: string; href: string; desc: string; keywords: string[] }[] = [
  {
    label: 'Token Counter',
    href: '/tools/token-counter',
    desc: 'Count tokens per section with live budget bar.',
    keywords: ['tokens', 'context', 'claude', 'llm', 'prompt', 'ai', 'model', 'budget'],
  },
  {
    label: 'System Prompt Builder',
    href: '/tools/system-prompt-builder',
    desc: 'Assemble production-ready system prompts.',
    keywords: ['prompt-engineering', 'system-prompt', 'claude', 'prompting', 'ai', 'llm'],
  },
  {
    label: 'MCP Scaffold',
    href: '/tools/mcp-scaffold',
    desc: 'Generate MCP server boilerplate instantly.',
    keywords: ['mcp', 'tool-design', 'tools', 'server', 'claude', 'api'],
  },
  {
    label: 'Context Visualizer',
    href: '/tools/context-visualizer',
    desc: 'See how your context window fills up.',
    keywords: ['context', 'tokens', 'llm', 'ai', 'claude', 'window'],
  },
  {
    label: 'Model Cost Calculator',
    href: '/tools/model-cost-calc',
    desc: 'Compare pricing across Claude, GPT-4o, Gemini.',
    keywords: ['cost', 'pricing', 'claude', 'azure-ai', 'azure-openai', 'model', 'ptu'],
  },
  {
    label: 'Tool Schema Builder',
    href: '/tools/tool-schema-builder',
    desc: 'Build valid MCP tool definitions visually.',
    keywords: ['mcp', 'tool-design', 'json', 'schema', 'tools', 'api'],
  },
  {
    label: 'RAG Chunk Visualizer',
    href: '/tools/rag-chunk-visualizer',
    desc: 'Visualise how chunking splits your text.',
    keywords: ['rag', 'embeddings', 'context', 'ai', 'llm', 'search'],
  },
  {
    label: 'Prompt Tester',
    href: '/tools/prompt-tester',
    desc: 'Compose prompts and get a ready-to-run API payload.',
    keywords: ['prompt-engineering', 'prompting', 'testing', 'api', 'claude', 'llm'],
  },
  {
    label: 'Prompt Library',
    href: '/tools/prompt-library',
    desc: 'Curated, ready-to-use prompts for real tasks.',
    keywords: ['prompt-engineering', 'prompting', 'templates', 'claude', 'ai'],
  },
];

// ── Matching helpers ──────────────────────────────────────────────────────────
function normalize(s: string): string {
  return s.toLowerCase().trim();
}

function score(itemKeywords: string[], tags: string[]): number {
  const normalizedTags = tags.map(normalize);
  return itemKeywords.reduce((acc, kw) => {
    return normalizedTags.some(t => t === kw || t.includes(kw) || kw.includes(t)) ? acc + 1 : acc;
  }, 0);
}

// ── Component ─────────────────────────────────────────────────────────────────
interface RelatedContentProps {
  /** Tags / keywords from the current page (blog tags, exam id, tool category) */
  tags: string[];
  /** Route of the current page — used to exclude "self" from results */
  currentPath: string;
  /** Max skill tracks to show (default 2) */
  maxSkills?: number;
  /** Max tools to show (default 2) */
  maxTools?: number;
  /** Optional heading override */
  heading?: string;
}

export default function RelatedContent({
  tags,
  currentPath,
  maxSkills = 2,
  maxTools = 2,
  heading = 'Related Resources',
}: RelatedContentProps) {
  const relatedSkills = SKILL_MAP
    .filter(s => !currentPath.includes(s.id))
    .map(s => ({ ...s, _score: score(s.keywords, tags) }))
    .filter(s => s._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, maxSkills);

  const relatedTools = TOOLS_MAP
    .filter(t => t.href !== currentPath)
    .map(t => ({ ...t, _score: score(t.keywords, tags) }))
    .filter(t => t._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, maxTools);

  if (relatedSkills.length === 0 && relatedTools.length === 0) return null;

  return (
    <aside
      className="rounded-2xl p-5 space-y-4 mt-8"
      style={{
        background: 'rgba(15,23,42,0.85)',
        border: '1px solid rgba(71,85,105,0.22)',
      }}
    >
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        {heading}
      </h3>

      {/* Skill Tracks */}
      {relatedSkills.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
            <BookOpen size={9} /> Skill Tracks
          </p>
          {relatedSkills.map(skill => (
            <Link
              key={skill.id}
              to={skill.href}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl group transition-all hover:scale-[1.01]"
              style={{
                background: `rgba(${hexToRgb(skill.color)},0.08)`,
                border: `1px solid rgba(${hexToRgb(skill.color)},0.22)`,
              }}
            >
              <div className="min-w-0">
                <span
                  className="text-[9px] font-black uppercase tracking-[0.15em] mr-2"
                  style={{ color: skill.color }}
                >
                  {skill.shortTitle}
                </span>
                <span className="text-xs text-slate-300 truncate">{skill.title}</span>
              </div>
              <ArrowRight
                size={13}
                className="shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors"
              />
            </Link>
          ))}
        </div>
      )}

      {/* AI Tools */}
      {relatedTools.length > 0 && (
        <div className="space-y-2">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-slate-600 flex items-center gap-1.5">
            <Wrench size={9} /> AI Tools
          </p>
          {relatedTools.map(tool => (
            <Link
              key={tool.href}
              to={tool.href}
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl group transition-all hover:scale-[1.01]"
              style={{
                background: 'rgba(56,189,248,0.06)',
                border: '1px solid rgba(56,189,248,0.18)',
              }}
            >
              <div className="min-w-0">
                <span className="text-xs font-semibold text-sky-300 block truncate">{tool.label}</span>
                <span className="text-[10px] text-slate-500 truncate">{tool.desc}</span>
              </div>
              <ArrowRight
                size={13}
                className="shrink-0 text-slate-600 group-hover:text-sky-500 transition-colors"
              />
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}

// ── Hex → RGB helper ──────────────────────────────────────────────────────────
function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
