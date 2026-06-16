const GIST_FILENAME = 'ccaf-progress.json';
const GIST_DESCRIPTION = 'Aarya — AI Learning Hub Progress';

import type { QuizSession } from '../types/content';
import type { StudyPlan } from './plan-generator';
import { getSessions } from './storage';
import { getNotesSeen } from './storage';
import { getAllStudyPlans } from './plan-generator';

interface ProgressData {
  quizHistory: Array<{ date: string; skillId?: string; domain: string; score: number; total: number }>;
  domainProgress: Record<string, { correct: number; total: number }>;
  lastSync: string;
  /** Raw quiz sessions — restores full session history on new devices. */
  sessions?: QuizSession[];
  /** Notes-seen timestamps keyed by "examId:domainId". */
  notesSeen?: Record<string, string>;
  /** Study plans keyed by examId. */
  studyPlans?: Record<string, StudyPlan>;
}

export async function findProgressGist(token: string): Promise<string | null> {
  const res = await fetch('https://api.github.com/gists?per_page=100', {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return null;
  const gists = await res.json();
  const match = gists.find((g: { files: Record<string, unknown>; description: string }) =>
    g.description === GIST_DESCRIPTION && GIST_FILENAME in g.files
  );
  return match?.id ?? null;
}

export async function loadProgress(token: string): Promise<ProgressData | null> {
  const gistId = await findProgressGist(token);
  if (!gistId) return null;
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) return null;
  const gist = await res.json();
  const content = gist.files?.[GIST_FILENAME]?.content;
  if (!content) return null;
  try { return JSON.parse(content); } catch { return null; }
}

export async function saveProgress(token: string, data: ProgressData): Promise<boolean> {
  const gistId = await findProgressGist(token);
  // Include raw sessions, notes, and study plans so all devices can sync
  const payload: ProgressData = {
    ...data,
    sessions: getSessions(),
    notesSeen: getNotesSeen(),
    studyPlans: getAllStudyPlans(),
  };
  const body = JSON.stringify({
    description: GIST_DESCRIPTION,
    public: false,
    files: { [GIST_FILENAME]: { content: JSON.stringify({ ...payload, lastSync: new Date().toISOString() }, null, 2) } },
  });

  if (gistId) {
    const res = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body,
    });
    return res.ok;
  } else {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
      body,
    });
    return res.ok;
  }
}