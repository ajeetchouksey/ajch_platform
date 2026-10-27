// ── Scenario walkthrough progress ─────────────────────────────────────────────
// Best score per scenario, so the list can show what's done and what isn't.
// Scenario answers are deliberately NOT written to the per-question attempt
// log (adaptive-quiz.ts): their IDs aren't bank question IDs, so they'd
// inflate the Missed & flagged queue without being drillable.
// localStorage key: aarya_scenarios_{examId}

import { isValidExamId } from '@/lib/plan-generator';

export interface ScenarioResult {
  best: number;        // best correct count across completed runs
  total: number;       // questions in the scenario
  completedAt: number; // last completion, Unix ms
}

function key(examId: string): string {
  return `aarya_scenarios_${examId}`;
}

export function getScenarioResults(examId: string): Record<string, ScenarioResult> {
  if (!isValidExamId(examId)) return {};
  try {
    return JSON.parse(localStorage.getItem(key(examId)) ?? '{}') as Record<string, ScenarioResult>;
  } catch {
    return {};
  }
}

export function saveScenarioResult(examId: string, scenarioId: string, correct: number, total: number): Record<string, ScenarioResult> {
  const all = getScenarioResults(examId);
  const prev = all[scenarioId];
  all[scenarioId] = { best: Math.max(prev?.best ?? 0, correct), total, completedAt: Date.now() };
  try { localStorage.setItem(key(examId), JSON.stringify(all)); }
  catch { /* storage unavailable — result lasts for this view only */ }
  return all;
}
