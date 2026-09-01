import type { Question, Scenario, ExamRegistry, BlogManifest } from '../types/content';
import {
  ensureContentManifestLoaded,
  resolveContentUrl,
  validateSchemaCompatibility,
  verticalFromContentPath,
} from './content-manifest';

// ── Generic content cache ──────────────────────────────────────────────────
// Every fetchJSON/fetchText call is deduped three ways:
//   1. in-memory (Map)          — instant on any repeat call this session
//   2. in-flight promise (Map)  — concurrent callers for the same URL share one fetch
//   3. localStorage (versioned) — survives a full reload / a later visit
// Cache key is the *resolved* URL, not the logical path: a CDN-promoted vertical
// (e.g. blog) resolves to a URL pinned to a commit SHA (see content-manifest.ts),
// so a content promotion naturally invalidates the cache by changing the key.
// Locally-served content (still most of skillup) has a stable URL regardless of
// content changes, so the persisted entry is additionally tagged with
// __APP_VERSION__ — a new deploy invalidates it even though the URL didn't change.
const _memCache = new Map<string, unknown>();
const _inflight = new Map<string, Promise<unknown>>();
const LS_PREFIX = 'ajch:content:';

function readPersisted<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as { v: string; data: T };
    return entry.v === __APP_VERSION__ ? entry.data : null;
  } catch {
    return null; // storage unavailable (private browsing) or corrupt entry
  }
}

function writePersisted<T>(key: string, data: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify({ v: __APP_VERSION__, data }));
  } catch {
    // Quota exceeded or storage unavailable — memory cache for this session still works.
  }
}

/** True if `path` is already resolvable from cache — no network call needed. */
function isCached(path: string): boolean {
  const key = resolveContentUrl(path);
  return _memCache.has(key) || readPersisted(key) !== null;
}

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (_memCache.has(key)) return _memCache.get(key) as T;

  const persisted = readPersisted<T>(key);
  if (persisted !== null) {
    _memCache.set(key, persisted);
    return persisted;
  }

  const pending = _inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((data) => {
      _memCache.set(key, data);
      writePersisted(key, data);
      return data;
    })
    .finally(() => { _inflight.delete(key); });

  _inflight.set(key, promise);
  return promise;
}

async function fetchJSON<T>(path: string): Promise<T> {
  await ensureContentManifestLoaded();
  const url = resolveContentUrl(path);
  return cached(url, async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    const json = await res.json() as T;
    validateSchemaCompatibility(verticalFromContentPath(path), json);
    return json;
  });
}

// Live analytics only — intentionally bypasses the cache above (always cache: 'no-store').
async function fetchJSONFresh<T>(path: string): Promise<T> {
  await ensureContentManifestLoaded();
  const url = resolveContentUrl(path);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  const json = await res.json() as T;
  validateSchemaCompatibility(verticalFromContentPath(path), json);
  return json;
}

async function fetchText(path: string): Promise<string> {
  await ensureContentManifestLoaded();
  const url = resolveContentUrl(path);
  return cached(url, async () => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
    return res.text();
  });
}

const BLOG_MANIFEST_PATH = 'content/blog/index.json';
const blogPostPath = (slug: string): string => `content/blog/posts/${slug}.md`;

export async function loadBlogManifest(): Promise<BlogManifest> {
  return fetchJSON<BlogManifest>(BLOG_MANIFEST_PATH);
}

export async function loadBlogPost(slug: string): Promise<string> {
  return fetchText(blogPostPath(slug));
}

export function hasCachedBlogManifest(): boolean {
  return isCached(BLOG_MANIFEST_PATH);
}

export function hasCachedBlogPost(slug: string): boolean {
  return isCached(blogPostPath(slug));
}

// ── Registry-driven loaders (exam-agnostic) ────────────────────────────────

export async function loadExamRegistry(): Promise<ExamRegistry> {
  // RC-4: read from auto-generated skillup/catalog.json (replaces exams/index.json)
  return fetchJSON<ExamRegistry>('content/skillup/catalog.json');
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
  relatedUseCases?: UseCaseRelatedLink[];
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

export interface InterviewTopSkill {
  id: string;
  label: string;
  group: string;
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
  topSkills?: InterviewTopSkill[];
  skillGroup?: string;
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
    usecases?: number;
    hol_labs?: number;
    agents: number;
    tools: number;
  };
  // Per-vertical source/freshness info — added when stats.json is generated
  // by scripts/build-content-intelligence.mjs (schema "2.0"). Absent on
  // older stats.json payloads (schema "1.0"), so always optional-check.
  freshness?: Record<string, { source: 'cdn' | 'local'; promotedAt?: string; sha?: string; contentUpdatedAt?: string | null }>;
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

let _platformStatsCache: PlatformStats | null = null;
let _platformStatsInflight: Promise<PlatformStats> | null = null;

export async function loadPlatformStats(): Promise<PlatformStats> {
  if (_platformStatsCache) return _platformStatsCache;
  if (_platformStatsInflight) return _platformStatsInflight;

  _platformStatsInflight = (async () => {
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

    _platformStatsCache = stats;
    _platformStatsInflight = null;
    return stats;
  })().catch((error) => {
    _platformStatsInflight = null;
    throw error;
  });

  return _platformStatsInflight;
}

// ── Use Cases (AI UseCases section) ────────────────────────────────────────

export interface UseCaseRelatedExam {
  exam: string;
  domain: number;
  why: string;
}

export interface UseCaseRelatedLink {
  id: string;
  label: string;
  vertical: string;
}

export interface UseCaseTechStackCategory {
  category: string;
  tools: string[];
}

export interface UseCaseFailureMode {
  mode: string;
  mitigation: string;
}

export interface UseCaseIntegration {
  system: string;
  type: string;
  note: string;
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
  mermaidDiagram?: string;
  architectureNotes?: string;
  techStack?: UseCaseTechStackCategory[];
  failureModes?: UseCaseFailureMode[];
  scalingConsiderations?: string[];
  integrations?: UseCaseIntegration[];
  relatedExams?: UseCaseRelatedExam[];
  relatedInterviewQs?: string[];
  relatedUseCases?: UseCaseRelatedLink[];
  examScenarioPotential?: string;
  blogPotential?: string;
  publishedDate?: string;
  updatedDate?: string;
  // Populated by scripts/backfill-taxonomy-ids.mjs — for use cases this is
  // currently identical to `patterns` (already canonical taxonomy-shaped
  // ids per content/usecases/index.json's patterns[] catalog), but kept as
  // its own field so the relationship engine (IDEA-0008 Phase 3) reads one
  // consistent field name across every vertical, not each vertical's own
  // differently-named display-tag field.
  taxonomyIds?: string[];
}

export interface CatalogUseCase {
  id: string;
  title: string;
  vertical: string;
  patterns: string[];
  taxonomyIds?: string[];
}

export interface SourceIntel {
  schema: string;
  generated: string;
  verticals: Array<{ id: string; label: string; useCaseCount: number; primaryPatterns: string[] }>;
  featuredUseCases: FeaturedUseCase[];
  catalogUseCases: CatalogUseCase[];
}

export type AnyUseCase = FeaturedUseCase | CatalogUseCase;

export async function loadSourceIntel(): Promise<SourceIntel> {
  return fetchJSON<SourceIntel>('content/usecases/_source-intel.json');
}

export async function loadAllUseCases(): Promise<AnyUseCase[]> {
  const intel = await loadSourceIntel();
  const featuredIds = new Set(intel.featuredUseCases.map((u) => u.id));
  const catalog = intel.catalogUseCases.filter((u) => !featuredIds.has(u.id));
  return [...intel.featuredUseCases, ...catalog];
}

export async function loadUseCaseById(id: string): Promise<AnyUseCase | null> {
  // Try the individual case file first (has architectureNotes + relatedUseCases) —
  // cached like everything else in this module, so a repeat visit costs no network call.
  try {
    const caseFile = await fetchJSON<FeaturedUseCase>(`content/usecases/cases/${id}.json`);
    if (caseFile?.id) return caseFile;
  } catch {
    // fall through to source-intel
  }
  const intel = await loadSourceIntel();
  return (
    intel.featuredUseCases.find((u) => u.id === id) ??
    intel.catalogUseCases.find((u) => u.id === id) ??
    null
  );
}

// ── Generic vertical index loader factory ──────────────────────────────────
// Extracts the "load index, find by id" pattern otherwise duplicated per
// vertical (exam registry, interview roles, use cases each hand-roll their
// own). HOL Labs is the first vertical built directly on this.
export function createIndexLoader<TIndex, TItem>(
  indexPath: string,
  getItems: (index: TIndex) => TItem[],
  getId: (item: TItem) => string,
) {
  async function loadIndex(): Promise<TIndex> {
    return fetchJSON<TIndex>(indexPath);
  }
  async function findById(id: string): Promise<TItem | undefined> {
    const index = await loadIndex();
    return getItems(index).find((item) => getId(item) === id);
  }
  return { loadIndex, findById };
}

// ── HOL Labs ─────────────────────────────────────────────────────────────
export interface HolLabRelatedExam { exam: string; domain: number; why: string; }
export interface HolLabRelatedBlogPost { slug: string; why: string; }
export interface HolLabRelatedUseCase { id: string; vertical: string; why: string; }
export interface HolLabRelatedLab { id: string; relation: 'prerequisite' | 'next' | 'alternative'; why: string; }

export interface HolLabStep {
  order: number;
  title: string;
  instructions: string;
  whyItMatters: string;
  code?: { language: string; snippet: string };
  screenshot?: string;
  expectedResult: string;
}

export interface HolLabConceptCheck { afterStep: number; question: string; answer: string; }

export interface HolLabCostEstimate {
  tier: 'free' | 'low-cost' | 'paid';
  monthlyEstimateUSD: number;
  freeTierNotes: string;
}

export interface HolLab {
  id: string;
  schema: string; // "hol-lab@1"
  title: string;
  tagline: string; // one-sentence hook for catalog cards, distinct from the full problemStatement
  domain: string; // matches HolLabsIndex.domains[].id
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  problemStatement: string;
  approachRationale: string;
  mermaidDiagram?: string; // optional flow diagram — include when the lab's flow genuinely benefits from a picture
  prerequisites: string[];
  learningObjectives: string[];
  steps: HolLabStep[];
  conceptChecks: HolLabConceptCheck[];
  validationChecklist: string[];
  cleanup: string[];
  costEstimate: HolLabCostEstimate;
  relatedExams: HolLabRelatedExam[];
  relatedBlogPosts: HolLabRelatedBlogPost[];
  relatedUseCases: HolLabRelatedUseCase[];
  relatedLabs: HolLabRelatedLab[];
  tags: string[];
  // Populated by scripts/backfill-taxonomy-ids.mjs — currently identical to
  // `tags` (already clean kebab-case values registered as Tier-2 taxonomy
  // nodes), kept as its own field for the same cross-vertical-consistency
  // reason as FeaturedUseCase.taxonomyIds above.
  taxonomyIds?: string[];
  publishedDate: string;
  updatedDate: string;
}

// Lightweight per-lab summary carried in index.json — enough for catalog cards,
// filtering, and reverse-link lookups (see useRelatedLabs in related-labs.ts)
// without fetching every lab file. hol-lab-publisher writes both the full lab
// file AND this flattened summary at publish time, so no N+1 fetch is ever
// needed to answer "what labs relate to this exam/usecase/blog/lab".
export interface HolLabSummary {
  id: string;
  title: string;
  tagline: string;
  domain: string;
  difficulty: HolLab['difficulty'];
  estimatedMinutes: number;
  costTier: HolLabCostEstimate['tier'];
  tags: string[];
  taxonomyIds?: string[];
  relatedExamIds: string[];
  relatedUseCaseIds: string[];
  relatedBlogSlugs: string[];
  relatedLabIds: string[];
}

export interface HolLabDomainMeta { id: string; label: string; count: number; }

export interface HolLabsIndex {
  schema: string; // "hol-labs-index@1"
  domains: HolLabDomainMeta[];
  labs: HolLabSummary[];
  featuredIds: string[];
  totalCount: number;
}

const HOL_LABS_INDEX_PATH = 'content/hol-labs/index.json';
const holLabIndexLoader = createIndexLoader<HolLabsIndex, HolLabSummary>(
  HOL_LABS_INDEX_PATH,
  (index) => index.labs,
  (lab) => lab.id,
);

export async function loadHolLabsIndex(): Promise<HolLabsIndex> {
  return holLabIndexLoader.loadIndex();
}

export async function loadHolLabById(id: string): Promise<HolLab> {
  return fetchJSON<HolLab>(`content/hol-labs/labs/${id}.json`);
}

export async function findHolLabSummaryById(id: string): Promise<HolLabSummary | undefined> {
  return holLabIndexLoader.findById(id);
}