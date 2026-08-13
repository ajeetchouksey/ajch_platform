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

export type ContentType = 'mcq' | 'notes' | 'scenario' | 'flashcard' | 'lab';

// CSS values for exam card styling — stored in index.json, not hardcoded in TS
export interface ExamPalette {
  color: string;
  bg: string;
  border: string;
  glow: string;
  btn: string;
}

export interface ContentChangelog {
  version: string;
  date: string;
  type: 'major' | 'minor' | 'patch';
  summary: string;
}

export interface ExamConfig {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  provider: string;
  palette: ExamPalette;
  contentVersion: string;
  contentUpdatedAt: string;
  contentLevel?: ContentLevel;
  schemaVersion?: string;
  questions: number;
  duration: string;
  passScore: string;
  passThreshold: number;
  available: boolean;
  accentColor: string;
  colorScheme: string;   // key into EXAM_SCHEMES for sidebar/nav Tailwind classes
  contentTypes?: ContentType[];
  domains: DomainConfig[];
  questionFiles: string[];
  scenarioFiles: string[];
  resources: ExamResource[];
  changelog?: ContentChangelog[];
  deprecatedAt?: string;
  prerequisites?: string[];
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
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface DomainNote {
  id: string;
  domain: number;
  title: string;
  weight: number; // exam weight %
  content: string; // raw markdown
}

export interface LegacyScenario {
  id: string;
  title: string;
  description: string;
  architecture_notes?: string;
  key_patterns?: string[];
  questionIds?: string[];
}

export interface RichScenario {
  schemaVersion: '2.0';
  id: string;
  title: string;
  description: string;
  examId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedMinutes: number;
  domains: number[];
  scenario: {
    background: string;
    characters: ScenarioCharacter[];
  };
  questions: ScenarioQuestion[];
  keyLearnings: string[];
}

export type Scenario = LegacyScenario | RichScenario;

export function isRichScenario(s: Scenario): s is RichScenario {
  return (s as RichScenario).schemaVersion === '2.0';
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
  /** GitHub username — used for avatar and profile link */
  authorGitHub?: string;
  date: string;
  updated: string | null;
  tags: string[];
  category: string;
  readingTime: number;
  featured: boolean;
  draft: boolean;
  /** Relative path to cover image, e.g. /images/blog/post.jpg — used for OG image */
  image?: string;
}

export interface BlogManifest {
  posts: BlogPostMeta[];
}

// ── 2-Loop Prep ────────────────────────────────────────────────────────────

/** One question answered in a prep loop session. */
export interface QuestionAttempt {
  questionId: string;
  examId: string;
  domain: number;
  chosenIndex: number;
  correct: boolean;
  timeSpentMs: number;
  attemptedAt: number; // Unix ms
  loop: 1 | 2;
  /** Loop 2 only: student's free-text reasoning before answer reveal. */
  reasoning?: string;
}

export interface DomainReadiness {
  domainId: number;
  score: number;                              // 0–100 weighted accuracy
  attempts: number;
  confidence: 'low' | 'medium' | 'high';     // <10 attempts / 10–25 / >25
  trend: 'improving' | 'stable' | 'declining';
}

export interface ReadinessReport {
  examId: string;
  generatedAt: string;
  overallScore: number;                       // weighted across domains
  domains: DomainReadiness[];
  predictedPassProbability: number;           // 0–1
  recommendedFocusDomain: number | null;
  totalAttempts: number;
}

/** A single Loop 1 or Loop 2 prep session. */
export interface PrepLoop {
  id: string;
  examId: string;
  startedAt: string;
  lastActiveAt: string;
  targetDate: string;
  loop: 1 | 2;
  attempts: QuestionAttempt[];
  report: ReadinessReport | null;
  /** Loop 2: critique returned by the secondary AI model. */
  aiValidation?: string;
  completed: boolean;
}