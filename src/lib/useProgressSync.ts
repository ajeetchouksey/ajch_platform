import { useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import { loadProgress, saveProgress } from './gist-sync';

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
  const { token } = useAuth();

  // Sync from Gist on login
  useEffect(() => {
    if (!token) return;
    loadProgress(token).then((remote) => {
      if (!remote) return;
      const local = getLocalProgress();
      // Merge: take whichever has more history entries (simple conflict resolution)
      if (remote.quizHistory.length > local.quizHistory.length) {
        setLocalProgress(remote);
        window.dispatchEvent(new Event('progress-updated'));
      }
    });
  }, [token]);

  // Push local to Gist; on success, stamp lastSync locally so the UI reflects it
  const syncToGist = useCallback(async () => {
    if (!token) return false;
    const local = getLocalProgress();
    const ok = await saveProgress(token, local);
    if (ok) setLocalProgress({ ...local, lastSync: new Date().toISOString() });
    return ok;
  }, [token]);

  return { syncToGist };
}