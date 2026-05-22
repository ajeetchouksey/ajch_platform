import type { Question, Scenario } from '../types/content';

const BASE = import.meta.env.BASE_URL;

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchText(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.text();
}

export async function loadAllQuestions(): Promise<Question[]> {
  const files = [
    'content/questions/domain1-agentic.json',
    'content/questions/domain2-claude-code.json',
    'content/questions/domain3-prompt-eng.json',
    'content/questions/domain4-tool-design.json',
    'content/questions/domain5-context-mgmt.json',
  ];
  const arrays = await Promise.all(files.map((f) => fetchJSON<Question[]>(f)));
  return arrays.flat();
}

export async function loadQuestionsByDomain(domain: number): Promise<Question[]> {
  const all = await loadAllQuestions();
  return all.filter((q) => q.domain === domain);
}

export async function loadNote(domain: number): Promise<string> {
  const map: Record<number, string> = {
    1: 'content/notes/d1-agentic-architecture.md',
    2: 'content/notes/d2-claude-code-config.md',
    3: 'content/notes/d3-prompt-engineering.md',
    4: 'content/notes/d4-tool-design-mcp.md',
    5: 'content/notes/d5-context-management.md',
  };
  return fetchText(map[domain]);
}

export async function loadAllScenarios(): Promise<Scenario[]> {
  const files = [
    'content/scenarios/customer-support-agent.json',
    'content/scenarios/code-gen-claude-code.json',
    'content/scenarios/multi-agent-research.json',
    'content/scenarios/developer-productivity.json',
    'content/scenarios/claude-code-cicd.json',
    'content/scenarios/structured-data-extraction.json',
  ];
  return Promise.all(files.map((f) => fetchJSON<Scenario>(f)));
}


import type { BlogManifest } from '../types/content';

export async function loadBlogManifest(): Promise<BlogManifest> {
  return fetchJSON<BlogManifest>('content/blog/index.json');
}

export async function loadBlogPost(slug: string): Promise<string> {
  return fetchText(`content/blog/posts/${slug}.md`);
}