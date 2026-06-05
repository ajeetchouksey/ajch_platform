import type { Question, Scenario, ExamRegistry, BlogManifest } from '../types/content';

const BASE = import.meta.env.BASE_URL;

// ── Module-level registry cache (loaded once) ──────────────────────────────
let _registryCache: ExamRegistry | null = null;

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

export async function loadBlogManifest(): Promise<BlogManifest> {
  return fetchJSON<BlogManifest>('content/blog/index.json');
}

export async function loadBlogPost(slug: string): Promise<string> {
  return fetchText(`content/blog/posts/${slug}.md`);
}

// ── Registry-driven loaders (exam-agnostic) ────────────────────────────────

export async function loadExamRegistry(): Promise<ExamRegistry> {
  if (_registryCache) return _registryCache;
  // RC-4: read from auto-generated skillup/catalog.json (replaces exams/index.json)
  _registryCache = await fetchJSON<ExamRegistry>('content/skillup/catalog.json');
  return _registryCache;
}

export async function loadQuestionsForExam(examId: string): Promise<Question[]> {
  const registry = await loadExamRegistry();
  const exam = registry.exams.find((e) => e.id === examId);
  if (!exam) throw new Error(`Exam "${examId}" not found in registry`);
  const arrays = await Promise.all(exam.questionFiles.map((f) => fetchJSON<Question[]>(f)));
  return arrays.flat();
}

export async function loadQuestionsByDomainForExam(examId: string, domain: number): Promise<Question[]> {
  const all = await loadQuestionsForExam(examId);
  return all.filter((q) => q.domain === domain);
}

export async function loadNoteForExam(examId: string, domainId: number): Promise<string> {
  const registry = await loadExamRegistry();
  const exam = registry.exams.find((e) => e.id === examId);
  const domain = exam?.domains.find((d) => d.id === domainId);
  if (!domain) throw new Error(`Domain ${domainId} not found for exam "${examId}"`);
  return fetchText(domain.notesFile);
}

export async function loadScenariosForExam(examId: string): Promise<Scenario[]> {
  const registry = await loadExamRegistry();
  const exam = registry.exams.find((e) => e.id === examId);
  if (!exam) throw new Error(`Exam "${examId}" not found in registry`);
  return Promise.all(exam.scenarioFiles.map((f) => fetchJSON<Scenario>(f)));
}

// ── Platform stats ─────────────────────────────────────────────────────────
export interface PlatformStats {
  schema: string;
  generated: string;
  platform: {
    blog_posts: number;
    questions: number;
    exams: number;
    notes: number;
    scenarios: number;
    agents: number;
    tools: number;
  };
  audience?: {
    users_today: number | null;
    users_28d:   number | null;
    synced_at:   string | null;
  };
  pageViews?: {
    dateFrom:                  string;
    total:                     number | null;
    avgEngagementDurationSecs: number | null;
    byPath:                    Record<string, number>;
    synced_at:                 string | null;
  };
}

export async function loadPlatformStats(): Promise<PlatformStats> {
  return fetchJSON<PlatformStats>('content/stats.json');
}