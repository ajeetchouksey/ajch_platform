// SkillUp learner counts, backed by the aarya-subscribe Worker's D1 `skillup_learners`
// table. A signed-in learner is recorded against an exam the first time they open it;
// the Worker stores only an HMAC of the account id, so counts are anonymous.

const WORKER_URL = (import.meta.env.VITE_SUBSCRIBE_WORKER_URL as string | undefined) ?? '';
const RECORDED_KEY = 'skillup_learner_recorded';

function recordedThisSession(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(RECORDED_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

/**
 * Count the signed-in user as a learner of this exam. Fire-and-forget: sent at most once
 * per exam per tab, and a failure never affects learning.
 */
export function recordSkillUpLearner(examId: string, token: string): void {
  if (!WORKER_URL || !token) return;
  const done = recordedThisSession();
  if (done.includes(examId)) return;
  try {
    sessionStorage.setItem(RECORDED_KEY, JSON.stringify([...done, examId]));
  } catch { /* storage blocked: may send again next open, the Worker dedupes */ }
  void fetch(`${WORKER_URL}/api/skillup/enrol`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ examId }),
  }).catch(() => { /* counting is best-effort */ });
}

/** Unique learners per exam id, for the catalog cards. Empty when unavailable. */
export async function fetchSkillUpLearnerCounts(): Promise<Record<string, number>> {
  if (!WORKER_URL) return {};
  try {
    const res = await fetch(`${WORKER_URL}/api/skillup/learners`);
    if (!res.ok) return {};
    const data = await res.json() as { exams?: Record<string, number> };
    return data.exams ?? {};
  } catch {
    return {};
  }
}

export interface SkillUpExamLearners {
  exam_id: string;
  total: number;
  new7: number;
  new30: number;
  active7: number;
  google: number;
  github: number;
}

export interface SkillUpLearnerStats {
  exams: SkillUpExamLearners[];
  overall: { learners: number; active7: number } | null;
  generatedAt: string;
}

/** Admin-only breakdown. Throws with the Worker's status so the page can explain it. */
export async function fetchSkillUpLearnerStats(token: string): Promise<SkillUpLearnerStats> {
  if (!WORKER_URL) throw new Error('VITE_SUBSCRIBE_WORKER_URL is not set');
  const res = await fetch(`${WORKER_URL}/api/admin/skillup/learners`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(res.status === 403 ? 'Your account is not on the admin list.' : `The API returned ${res.status}.`);
  return res.json() as Promise<SkillUpLearnerStats>;
}
