import { useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import { loadProgress, saveProgress } from './gist-sync';
import { loadProfileProgress, saveProfileProgress } from './profile-sync';
import { getSessions, saveSessions, getNotesSeen, setNotesSeen, clearAllProgressData } from './storage';
import { loadPlan, savePlan } from './plan-generator';

// localStorage isn't scoped per-user — it's shared by whichever account is
// currently signed in on this browser. This tracks which identity last owned
// it, so switching accounts (GitHub -> Google or vice versa) doesn't leave
// the previous account's plans/scores visible under the new one.
const PROGRESS_OWNER_KEY = 'aarya_progress_owner';

const LOCAL_PROGRESS_KEY = 'aarya_progress';
const LEGACY_PROGRESS_KEY = 'ccaf_progress';

interface ProgressEntry {
  date: string;
  skillId?: string;  // exam id e.g. "ccaf", "ab100" — optional for legacy entries
  domain: string;    // "${examId}:${domainId}" e.g. "ccaf:1"
  score: number;
  total: number;
}

interface ProgressData {
  quizHistory: ProgressEntry[];
  domainProgress: Record<string, { correct: number; total: number }>;
  lastSync: string;
}

export function getLocalProgress(): ProgressData {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
    // Migrate data from legacy ccaf_progress key
    const legacy = localStorage.getItem(LEGACY_PROGRESS_KEY);
    if (legacy) {
      const data = JSON.parse(legacy) as ProgressData;
      localStorage.setItem(LOCAL_PROGRESS_KEY, legacy);
      localStorage.removeItem(LEGACY_PROGRESS_KEY);
      return data;
    }
  } catch { /* ignore */ }
  return { quizHistory: [], domainProgress: {}, lastSync: '' };
}

export function setLocalProgress(data: ProgressData) {
  localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(data));
}

export function addQuizResult(examId: string, domain: string, score: number, total: number) {
  const progress = getLocalProgress();
  const domainKey = `${examId}:${domain}`;
  progress.quizHistory.push({ date: new Date().toISOString(), skillId: examId, domain: domainKey, score, total });
  const dp = progress.domainProgress[domainKey] || { correct: 0, total: 0 };
  dp.correct += score;
  dp.total += total;
  progress.domainProgress[domainKey] = dp;
  setLocalProgress(progress);
  return progress;
}

export function useProgressSync() {
  const { token, user } = useAuth();
  const isRemoteProfile = user?.provider === 'google';
  // Stable string, not the user object — keeps effect deps free of referential churn.
  const identity = user ? `${user.provider}:${user.email ?? user.login}` : null;

  // Sync from Gist (GitHub) or the D1 profile store (Google) on login
  useEffect(() => {
    if (!token || !identity) return;

    // Different account than whoever last used this browser — wipe local
    // progress before pulling, so it never leaks into the new account's view.
    const prevOwner = localStorage.getItem(PROGRESS_OWNER_KEY);
    if (prevOwner && prevOwner !== identity) {
      clearAllProgressData();
      window.dispatchEvent(new Event('progress-updated'));
    }
    localStorage.setItem(PROGRESS_OWNER_KEY, identity);

    const pull = isRemoteProfile ? loadProfileProgress(token) : loadProgress(token);
    pull.then((remote) => {
      if (!remote) return;
      let didWrite = false;

      // ── Aggregated progress ────────────────────────────────────────────────
      const local = getLocalProgress();
      if (remote.quizHistory.length > local.quizHistory.length) {
        setLocalProgress(remote);
        didWrite = true;
      }

      // ── Raw sessions ────────────────────────────────────────────────────────
      if (remote.sessions && remote.sessions.length > getSessions().length) {
        saveSessions(remote.sessions);
        didWrite = true;
      }

      // ── Notes seen ─────────────────────────────────────────────────────────
      // Union-merge: keep the more recent ISO timestamp per key
      if (remote.notesSeen && Object.keys(remote.notesSeen).length > 0) {
        const localNotes = getNotesSeen();
        const merged = { ...localNotes };
        for (const [k, remoteTs] of Object.entries(remote.notesSeen)) {
          if (!merged[k] || remoteTs > merged[k]) {
            merged[k] = remoteTs;
          }
        }
        setNotesSeen(merged);
        didWrite = true;
      }

      // ── Study plans ─────────────────────────────────────────────────────────
      // Remote plan wins per exam if it was generated more recently
      if (remote.studyPlans) {
        for (const [examId, remotePlan] of Object.entries(remote.studyPlans)) {
          const localPlan = loadPlan(examId);
          if (!localPlan || remotePlan.generatedAt > localPlan.generatedAt) {
            savePlan(remotePlan);
            didWrite = true;
          }
        }
      }

      if (didWrite) {
        window.dispatchEvent(new Event('progress-updated'));
      }
    });
  }, [token, isRemoteProfile, identity]);

  // Push local progress to the provider's backend; on success, stamp lastSync locally
  // so the UI reflects it. Name kept as `syncToGist` — call sites don't need to know
  // which backend a given provider uses.
  const syncToGist = useCallback(async () => {
    if (!token) return false;
    const local = getLocalProgress();
    const ok = isRemoteProfile ? await saveProfileProgress(token, local) : await saveProgress(token, local);
    if (ok) setLocalProgress({ ...local, lastSync: new Date().toISOString() });
    return ok;
  }, [token, isRemoteProfile]);

  return { syncToGist };
}