import type { QuizSession } from '@/types/content';

let _sessionId = 0;

export function makeSession(overrides: Partial<QuizSession> = {}): QuizSession {
  return {
    id: `session-${_sessionId++}`,
    skillId: 'ccaf',
    startedAt: Date.now(),
    finishedAt: Date.now(),
    domainFilter: null,
    answers: {},
    score: 5,
    total: 10,
    ...overrides,
  };
}
