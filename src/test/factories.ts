import type { QuizSession, QuestionAttempt, PrepLoop, ReadinessReport } from '@/types/content';

let _sessionId = 0;

/** Typed factory for QuizSession — matches src/types/content.ts. */
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

let _attemptId = 0;

/** Typed factory for QuestionAttempt — matches src/types/content.ts. */
export function makeAttempt(overrides: Partial<QuestionAttempt> = {}): QuestionAttempt {
  return {
    questionId: `q-${_attemptId++}`,
    examId: 'ccaf',
    domain: 1,
    chosenIndex: 0,
    correct: true,
    timeSpentMs: 1000,
    attemptedAt: Date.now(),
    loop: 1,
    ...overrides,
  };
}

/** Typed factory for ReadinessReport — matches src/types/content.ts. */
export function makeReadinessReport(overrides: Partial<ReadinessReport> = {}): ReadinessReport {
  return {
    examId: 'ccaf',
    generatedAt: new Date().toISOString(),
    overallScore: 0,
    domains: [],
    predictedPassProbability: 0,
    recommendedFocusDomain: null,
    totalAttempts: 0,
    ...overrides,
  };
}

let _loopId = 0;

/** Typed factory for PrepLoop — matches src/types/content.ts. */
export function makePrepLoop(overrides: Partial<PrepLoop> = {}): PrepLoop {
  return {
    id: `loop-${_loopId++}`,
    examId: 'ccaf',
    startedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    targetDate: new Date().toISOString(),
    loop: 1,
    attempts: [],
    report: null,
    completed: false,
    ...overrides,
  };
}
