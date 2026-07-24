import type { Question, Scenario, ExamRegistry, BlogManifest } from '../types/content';

const BASE = import.meta.env.BASE_URL;

// ── Module-level registry cache (loaded once) ──────────────────────────────
let _registryCache: ExamRegistry | null = null;

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchJSONFresh<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: 'no-store' });
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

// ── Interview-prep loaders ──────────────────────────────────────────────────

export interface InterviewBankItem {
  id: string;
  competency: string;
  type: string;
  difficulty: string;
  question: string;
  detailedAnswer: {
    summary: string;
    deepDive: string;
    realScenario: string;
    workedExample: string;
    useCases: string[];
    tradeoffs: string[];
    antiPatterns: string[];
  };
  explanation: string;
  followUps: Array<{ q: string; a: string }>;
  redFlags: string[];
  tags: string[];
  diagram?: { caption: string; chart: string };
  roles: string[];
}

export async function loadInterviewBank(): Promise<InterviewBankItem[]> {
  return fetchJSON<InterviewBankItem[]>('content/interviews/bank/questions.json');
}

export interface InterviewIndustry {
  label: string;
  domain?: string;
  summary: string;
  focusAreas: string[];
}

export interface InterviewRoleSummary {
  id: string;
  title: string;
  shortTitle?: string;
  seniority: string;
  location?: string;
  description: string;
  industry?: InterviewIndustry;
  colorScheme: string;
  accentColor?: string;
  questionCount: number;
  available: boolean;
  jdFile: string;
  packFile: string;
}

export interface InterviewIndex {
  schema: string;
  generated: string;
  bank: { competenciesFile: string; questionsFile: string };
  roles: InterviewRoleSummary[];
}

export interface InterviewCompetency {
  id: string;
  title: string;
  group: string;
}

export interface InterviewAddendum {
  whyForThisRole?: string;
  additionalContext?: string;
  industryAngle?: string;
  extraFollowUps?: Array<{ q: string; a: string }>;
}

export interface InterviewPackItemRef {
  ref?: string;
  addendum?: InterviewAddendum;
  id?: string;
}

export interface InterviewPack {
  schema: string;
  roleId: string;
  title: string;
  seniority: string;
  experience?: string;
  location?: string;
  jdFile: string;
  industry?: InterviewIndustry;
  competencyWeights: Record<string, number>;
  items: InterviewPackItemRef[];
}

export async function loadInterviewIndex(): Promise<InterviewIndex> {
  return fetchJSON<InterviewIndex>('content/interviews/index.json');
}

export async function loadInterviewCompetencies(): Promise<InterviewCompetency[]> {
  const data = await fetchJSON<{ competencies: InterviewCompetency[] }>(
    'content/interviews/bank/competencies.json',
  );
  return data.competencies;
}

export async function loadInterviewPack(roleId: string): Promise<InterviewPack> {
  const index = await loadInterviewIndex();
  const role = index.roles.find((r) => r.id === roleId);
  if (!role) throw new Error(`Interview role "${roleId}" not found`);
  return fetchJSON<InterviewPack>(role.packFile);
}

export async function loadInterviewJd(roleId: string): Promise<string> {
  const index = await loadInterviewIndex();
  const role = index.roles.find((r) => r.id === roleId);
  if (!role) throw new Error(`Interview role "${roleId}" not found`);
  return fetchText(role.jdFile);
}

/** Resolve a pack's items against the canonical bank, merging any addendum deltas. */
export interface ResolvedInterviewItem extends InterviewBankItem {
  addendum?: InterviewAddendum;
}

export async function loadResolvedPackItems(roleId: string): Promise<ResolvedInterviewItem[]> {
  const [pack, bank] = await Promise.all([loadInterviewPack(roleId), loadInterviewBank()]);
  const byId = new Map(bank.map((q) => [q.id, q]));
  const resolved: ResolvedInterviewItem[] = [];
  for (const item of pack.items) {
    if (item.ref) {
      const base = byId.get(item.ref);
      if (base) resolved.push({ ...base, addendum: item.addendum });
    } else if (item.id) {
      const inline = byId.get(item.id);
      if (inline) resolved.push(inline);
    }
  }
  return resolved;
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
    users_today:  number | null;
    users_28d:    number | null;
    synced_at:    string | null;
  };
  pageViews?: {
    dateFrom:                  string;
    total:                     number | null;
    avgEngagementDurationSecs: number | null;
    byPath:                    Record<string, number>;
    synced_at:                 string | null;
  };
}

// Live analytics are served from the public Gist that analytics-sync.yml
// updates every 30 minutes — no rebuild required, always fresh.
const _GIST_ID = (import.meta.env.VITE_STATS_GIST_ID as string | undefined)
  ?? '4ccf1b49e144256342d92bab727fbb89';
const _GIST_RAW = `https://gist.githubusercontent.com/ajeetchouksey/${_GIST_ID}/raw/aarya-stats.json`;

interface _GistPayload {
  users_today?: number | null;
  users_28d?:   number | null;
  page_views?: {
    date_from?:           string;
    total?:               number;
    avg_engagement_secs?: number;
    by_path?:             Record<string, number>;
  };
  synced_at?: string;
}

export async function loadPlatformStats(): Promise<PlatformStats> {
  const [baseResult, gistResult] = await Promise.allSettled([
    fetchJSONFresh<PlatformStats>('content/stats.json'),
    fetch(`${_GIST_RAW}?t=${Date.now()}`, { cache: 'no-store' })
      .then(r => r.ok ? (r.json() as Promise<_GistPayload>) : null)
      .catch(() => null),
  ]);

  const stats = baseResult.status === 'fulfilled'
    ? baseResult.value
    : ({} as PlatformStats);
  const g = gistResult.status === 'fulfilled' ? gistResult.value : null;

  // Overlay live Gist analytics on top of the build-time stats.json values
  if (g?.page_views) {
    stats.pageViews = {
      dateFrom:                  g.page_views.date_from          ?? stats.pageViews?.dateFrom                  ?? '2026-05-01',
      total:                     g.page_views.total              ?? stats.pageViews?.total                     ?? null,
      avgEngagementDurationSecs: g.page_views.avg_engagement_secs ?? stats.pageViews?.avgEngagementDurationSecs ?? null,
      byPath:                    g.page_views.by_path            ?? stats.pageViews?.byPath                    ?? {},
      synced_at:                 g.synced_at                     ?? stats.pageViews?.synced_at                 ?? null,
    };
  }
  if (g) {
    stats.audience = {
      users_today: g.users_today ?? stats.audience?.users_today ?? null,
      users_28d:   g.users_28d   ?? stats.audience?.users_28d   ?? null,
      synced_at:   g.synced_at   ?? stats.audience?.synced_at   ?? null,
    };
  }

  return stats;
}

// ── Use Cases (AI UseCases section) ────────────────────────────────────────

export interface UseCaseRelatedExam {
  exam: string;
  domain: number;
  why: string;
}

export interface FeaturedUseCase {
  id: string;
  title: string;
  vertical: string;
  patterns: string[];
  problem: string;
  solution?: string;
  whoItsFor?: string;
  workflowSteps?: string[];
  keyInsights?: string;
  relatedExams?: UseCaseRelatedExam[];
  relatedInterviewQs?: string[];
  examScenarioPotential?: string;
  blogPotential?: string;
}

export interface CatalogUseCase {
  id: string;
  title: string;
  vertical: string;
  patterns: string[];
}

export interface SourceIntel {
  schema: string;
  generated: string;
  verticals: Array<{ id: string; label: string; useCaseCount: number; primaryPatterns: string[] }>;
  featuredUseCases: FeaturedUseCase[];
  catalogUseCases: CatalogUseCase[];
}

export type AnyUseCase = FeaturedUseCase | CatalogUseCase;

let _sourceIntelCache: SourceIntel | null = null;

export async function loadSourceIntel(): Promise<SourceIntel> {
  if (_sourceIntelCache) return _sourceIntelCache;
  _sourceIntelCache = await fetchJSON<SourceIntel>('content/usecases/_source-intel.json');
  return _sourceIntelCache;
}

export async function loadAllUseCases(): Promise<AnyUseCase[]> {
  const intel = await loadSourceIntel();
  const featuredIds = new Set(intel.featuredUseCases.map((u) => u.id));
  const catalog = intel.catalogUseCases.filter((u) => !featuredIds.has(u.id));
  return [...intel.featuredUseCases, ...catalog];
}

export async function loadUseCaseById(id: string): Promise<AnyUseCase | null> {
  const intel = await loadSourceIntel();
  return (
    intel.featuredUseCases.find((u) => u.id === id) ??
    intel.catalogUseCases.find((u) => u.id === id) ??
    null
  );
}