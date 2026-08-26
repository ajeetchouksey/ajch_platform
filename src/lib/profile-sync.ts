// Cross-device progress sync for Google users, backed by the aarya-subscribe
// Worker's D1 `user_profiles` table (GitHub users keep using the private-Gist
// path in gist-sync.ts — this mirrors its payload shape so both providers get
// identical sync coverage). Microsoft login is deferred; this module is
// already provider-agnostic aside from its name, so adding it back later is
// just a new OAuth callback on the Worker side.
import type { ProgressData } from './gist-sync';
import { getSessions, getNotesSeen } from './storage';
import { getAllStudyPlans } from './plan-generator';
import { getAllAttempts } from './adaptive-quiz';
import { getAllPrepLoops } from './prep-loop';
import { getAllExamStats } from './exam-stats';

const PROXY_URL = (import.meta.env.VITE_GH_OAUTH_PROXY as string | undefined) || '';

export async function loadProfileProgress(sessionToken: string): Promise<ProgressData | null> {
  if (!PROXY_URL) return null;
  try {
    const res = await fetch(`${PROXY_URL}/profile/load`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json() as { progress: ProgressData | null };
    return data.progress ?? null;
  } catch {
    return null;
  }
}

export async function saveProfileProgress(sessionToken: string, data: ProgressData): Promise<boolean> {
  if (!PROXY_URL) return false;
  const payload: ProgressData = {
    ...data,
    sessions: getSessions(),
    notesSeen: getNotesSeen(),
    studyPlans: getAllStudyPlans(),
    adaptiveAttempts: getAllAttempts(),
    prepLoops: getAllPrepLoops(),
    examStats: getAllExamStats(),
  };
  try {
    const res = await fetch(`${PROXY_URL}/profile/save`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${sessionToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, lastSync: new Date().toISOString() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
