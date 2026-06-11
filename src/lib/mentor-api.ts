// ── Mentor API — client-side wrapper for /mentor/* Worker endpoints ───────────
// Security: user input is sanitized (length-capped, HTML stripped) before send.
// AI responses are rendered via react-markdown (not dangerouslySetInnerHTML).

const WORKER_URL = (import.meta.env.VITE_SUBSCRIBE_WORKER_URL as string | undefined) ?? '';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MentorSession {
  domainId: number;
  sessionType: 'review' | 'reinforce' | 'full';
  mentorNote?: string;
}

export interface MentorPlanPayload {
  examId: string;
  examTitle: string;
  targetDate: string;
  domainScores: Record<string, number>;
  domainWeights: Record<string, number>;
  request: string;
}

export interface MentorPlanResponse {
  sessions: MentorSession[];
  coachNote: string;
}

// ── Sanitize helper ────────────────────────────────────────────────────────────

function sanitizeInput(s: string, maxLen: number): string {
  // Remove < and > individually first — prevents any partial or complete tag injection.
  // A second pass removes quotes before truncation.
  return s.replace(/[<>]/g, '').replace(/["']/g, '').substring(0, maxLen).trim();
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** Call Worker /mentor/plan endpoint. Returns parsed MentorPlanResponse or throws. */
export async function callMentorPlan(payload: MentorPlanPayload): Promise<MentorPlanResponse> {
  const body = {
    examId: payload.examId,
    examTitle: sanitizeInput(payload.examTitle, 100),
    targetDate: payload.targetDate,
    domainScores: payload.domainScores,
    domainWeights: payload.domainWeights,
    request: sanitizeInput(payload.request, 500),
  };

  const res = await fetch(`${WORKER_URL}/mentor/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(errData.error ?? `mentor_unavailable:${res.status}`);
  }

  return res.json() as Promise<MentorPlanResponse>;
}

/** Call Worker /mentor/chat endpoint. Returns plain text answer or throws. */
export async function callMentorChat(
  examId: string,
  domainTitle: string,
  question: string,
): Promise<string> {
  const res = await fetch(`${WORKER_URL}/mentor/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examId,
      domainTitle: sanitizeInput(domainTitle, 80),
      question: sanitizeInput(question, 300),
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(errData.error ?? `mentor_unavailable:${res.status}`);
  }

  const data = await res.json() as { answer: string };
  return data.answer ?? '';
}

// ── LocalStorage helpers for chat state ──────────────────────────────────────
// Key: mentor_chat_{examId}_{day}  (day is an integer — no injection risk)

function chatKey(examId: string, day: number): string {
  return `mentor_chat_${examId}_${Math.round(day)}`;
}

export function loadMentorChat(examId: string, day: number): string | null {
  try {
    return localStorage.getItem(chatKey(examId, day));
  } catch {
    return null;
  }
}

export function saveMentorChat(examId: string, day: number, answer: string): void {
  try {
    localStorage.setItem(chatKey(examId, day), answer);
  } catch {
    // localStorage unavailable — silently skip
  }
}
