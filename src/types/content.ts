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

export type ContentLevel = '101' | '201' | '301' | '401';

export interface ExamConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  contentLevel?: ContentLevel; // skill difficulty level
  schemaVersion?: string;
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
  // ── Legacy (CCA-F) schema ──
  architecture_notes?: string;
  key_patterns?: string[];
  questionIds?: string[];
  // ── Rich (GH-300 / GHBP / AB-100) schema ──
  examId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;
  domains?: number[];
  scenario?: {
    background: string;
    characters: ScenarioCharacter[];
  };
  questions?: ScenarioQuestion[];
  keyLearnings?: string[];
}

export interface ScenarioCharacter {
  name: string;
  role: string;
  concern: string;
}

export interface ScenarioQuestion {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface QuizSession {
  id: string;
  skillId: string;         // which skill this session belongs to
  startedAt: number;
  finishedAt?: number;
  domainFilter: number | null; // null = all domains
  answers: Record<string, number>; // questionId → chosen index
  score: number;
  total: number;
  userId?: string;         // GitHub user ID — set on login, undefined for anonymous
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