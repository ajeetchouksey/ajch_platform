import { useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import { loadProgress, saveProgress } from './gist-sync';

const LOCAL_PROGRESS_KEY = 'ccaf_progress';

interface ProgressEntry {
  date: string;
  domain: string;
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
  } catch { /* ignore */ }
  return { quizHistory: [], domainProgress: {}, lastSync: '' };
}

export function setLocalProgress(data: ProgressData) {
  localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify(data));
}

export function addQuizResult(domain: string, score: number, total: number) {
  const progress = getLocalProgress();
  progress.quizHistory.push({ date: new Date().toISOString(), domain, score, total });
  const dp = progress.domainProgress[domain] || { correct: 0, total: 0 };
  dp.correct += score;
  dp.total += total;
  progress.domainProgress[domain] = dp;
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

  // Push local to Gist
  const syncToGist = useCallback(async () => {
    if (!token) return false;
    const local = getLocalProgress();
    return saveProgress(token, local);
  }, [token]);

  return { syncToGist };
}