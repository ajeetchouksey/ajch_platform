export interface Question {
  domain: 1 | 2 | 3 | 4 | 5;
  id: string;
  scenario: string;
  question: string;
  options: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
  tags: string[];
}

export interface DomainNote {
  id: string;
  domain: 1 | 2 | 3 | 4 | 5;
  title: string;
  weight: number; // exam weight %
  content: string; // raw markdown
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  architecture_notes: string;
  key_patterns: string[];
  questionIds: string[];
}

export interface QuizSession {
  id: string;
  startedAt: number;
  finishedAt?: number;
  domainFilter: number | null; // null = all domains
  answers: Record<string, number>; // questionId → chosen index
  score: number;
  total: number;
}

export const DOMAIN_META: Record<number, { title: string; weight: number; color: string }> = {
  1: { title: 'Agentic Architecture & Orchestration', weight: 27, color: 'bg-violet-600' },
  2: { title: 'Claude Code Configuration & Workflows', weight: 20, color: 'bg-blue-600' },
  3: { title: 'Prompt Engineering & Structured Output', weight: 20, color: 'bg-emerald-600' },
  4: { title: 'Tool Design & MCP Integration', weight: 18, color: 'bg-amber-600' },
  5: { title: 'Context Management & Reliability', weight: 15, color: 'bg-rose-600' },
};


export interface BlogPostMeta {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  updated: string | null;
  tags: string[];
  category: string;
  readingTime: number;
  featured: boolean;
  draft: boolean;
}

export interface BlogManifest {
  posts: BlogPostMeta[];
}