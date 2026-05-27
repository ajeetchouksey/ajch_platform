// ── Exam Registry ─────────────────────────────────────────────────────────
export interface DomainConfig {
  id: number;
  title: string;
  weight: number;
  color: string;      // Tailwind bg class, e.g. "bg-violet-600"
  notesFile: string;  // relative to public/, e.g. "content/notes/d1-..."
}

export interface ExamResource {
  label: string;
  url: string;
}

export interface ExamConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  questions: number;
  duration: string;
  passScore: string;
  passThreshold: number; // numeric %, e.g. 72
  available: boolean;
  accentColor: string;
  colorScheme: string;   // key into EXAM_SCHEMES, e.g. "violet" | "blue"
  domains: DomainConfig[];
  questionFiles: string[];
  scenarioFiles: string[];
  resources: ExamResource[];
}

export interface ExamRegistry {
  exams: ExamConfig[];
}

// Color scheme lookup — all Tailwind classes pre-defined for purge safety
export const EXAM_SCHEMES: Record<string, {
  sidebarActive: string;
  resourceHover: string;
  startButton: string;
}> = {
  violet: {
    sidebarActive: 'bg-violet-500/15 text-violet-200 border-l-2 border-violet-400 pl-2.5',
    resourceHover: 'hover:text-violet-300',
    startButton: 'bg-violet-700 hover:bg-violet-600 hover:shadow-lg hover:shadow-violet-500/20',
  },
  blue: {
    sidebarActive: 'bg-blue-500/15 text-blue-200 border-l-2 border-blue-400 pl-2.5',
    resourceHover: 'hover:text-blue-300',
    startButton: 'bg-blue-700 hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/20',
  },
};

// ── Questions ──────────────────────────────────────────────────────────────
export interface Question {
  domain: number;
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
  domain: number;
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