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