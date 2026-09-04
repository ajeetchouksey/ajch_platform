import { describe, it, expect } from 'vitest';

import {
  getSessions,
  saveSession,
  saveSessions,
  clearSessions,
  mergeAnonymousProgress,
  getScoreByDomain,
  getNotesSeen,
  markNotesSeen,
  getNotesSeenAt,
  setNotesSeen,
  clearAllProgressData,
} from './storage';
import { makeSession } from '@/test/factories';

const SESSIONS_KEY = 'aarya_quiz_sessions';

describe('getSessions', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(getSessions()).toEqual([]);
  });

  it('returns parsed sessions from localStorage', () => {
    const session = makeSession({ domainFilter: 1, score: 7, total: 10 });
    localStorage.setItem(SESSIONS_KEY, JSON.stringify([session]));
    expect(getSessions()).toHaveLength(1);
    expect(getSessions()[0]).toEqual(session);
  });

  it('returns empty array when localStorage contains invalid JSON', () => {
    localStorage.setItem(SESSIONS_KEY, 'not-json');
    expect(getSessions()).toEqual([]);
  });
});

describe('saveSession', () => {
  it('appends a new session when its id is not already present', () => {
    saveSession(makeSession({ id: 'a' }));
    saveSession(makeSession({ id: 'b' }));
    expect(getSessions().map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('updates an existing session in place when the id already matches', () => {
    saveSession(makeSession({ id: 'a', score: 1 }));
    saveSession(makeSession({ id: 'a', score: 9 }));
    const sessions = getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].score).toBe(9);
  });
});

describe('mergeAnonymousProgress', () => {
  it('tags anonymous sessions (no userId) with the given userId', () => {
    saveSessions([makeSession({ id: 'a' })]);
    mergeAnonymousProgress('user-123');
    expect(getSessions()[0].userId).toBe('user-123');
  });

  it('does not overwrite a userId that is already set', () => {
    saveSessions([makeSession({ id: 'a', userId: 'original-user' })]);
    mergeAnonymousProgress('new-user');
    expect(getSessions()[0].userId).toBe('original-user');
  });
});

describe('getScoreByDomain', () => {
  it('aggregates scores only for finished sessions matching the exam and a domain filter', () => {
    saveSessions([
      makeSession({ id: 'a', skillId: 'ccaf', domainFilter: 1, score: 3, total: 5, finishedAt: Date.now() }),
      makeSession({ id: 'b', skillId: 'ccaf', domainFilter: 1, score: 2, total: 5, finishedAt: Date.now() }),
    ]);
    expect(getScoreByDomain('ccaf')).toEqual({ 1: { correct: 5, total: 10 } });
  });

  it('ignores sessions with domainFilter null', () => {
    saveSessions([
      makeSession({ id: 'a', skillId: 'ccaf', domainFilter: null, score: 3, total: 5, finishedAt: Date.now() }),
    ]);
    expect(getScoreByDomain('ccaf')).toEqual({});
  });

  it('ignores unfinished sessions', () => {
    saveSessions([
      makeSession({ id: 'a', skillId: 'ccaf', domainFilter: 1, score: 3, total: 5, finishedAt: undefined }),
    ]);
    expect(getScoreByDomain('ccaf')).toEqual({});
  });

  it('ignores sessions belonging to a different skill', () => {
    saveSessions([
      makeSession({ id: 'a', skillId: 'other-exam', domainFilter: 1, score: 3, total: 5, finishedAt: Date.now() }),
    ]);
    expect(getScoreByDomain('ccaf')).toEqual({});
  });
});

describe('saveSessions', () => {
  it('replaces the entire sessions array', () => {
    saveSessions([makeSession({ id: 'a' }), makeSession({ id: 'b' })]);
    saveSessions([makeSession({ id: 'c' })]);
    expect(getSessions().map((s) => s.id)).toEqual(['c']);
  });
});

describe('clearSessions', () => {
  it('removes the sessions key from localStorage', () => {
    saveSessions([makeSession({ id: 'a' })]);
    clearSessions();
    expect(localStorage.getItem(SESSIONS_KEY)).toBeNull();
    expect(getSessions()).toEqual([]);
  });
});

describe('notes-seen tracking', () => {
  it('getNotesSeen returns an empty object by default', () => {
    expect(getNotesSeen()).toEqual({});
  });

  it('getNotesSeen returns an empty object when localStorage contains invalid JSON', () => {
    localStorage.setItem('aarya_notes_seen', 'not-json');
    expect(getNotesSeen()).toEqual({});
  });

  it('markNotesSeen records an ISO timestamp keyed by examId:domainId', () => {
    markNotesSeen('ccaf', 2);
    const seen = getNotesSeen();
    expect(Object.keys(seen)).toEqual(['ccaf:2']);
    expect(() => new Date(seen['ccaf:2']).toISOString()).not.toThrow();
  });

  it('getNotesSeenAt returns null for a domain that has not been seen', () => {
    expect(getNotesSeenAt('ccaf', 3)).toBeNull();
  });

  it('getNotesSeenAt returns the timestamp after markNotesSeen', () => {
    markNotesSeen('ccaf', 1);
    expect(getNotesSeenAt('ccaf', 1)).not.toBeNull();
  });

  it('setNotesSeen replaces the entire notes-seen map', () => {
    markNotesSeen('ccaf', 1);
    setNotesSeen({ 'other:9': '2026-01-01T00:00:00.000Z' });
    expect(getNotesSeen()).toEqual({ 'other:9': '2026-01-01T00:00:00.000Z' });
  });
});

describe('clearAllProgressData', () => {
  it('removes exact progress keys (sessions, notes seen, legacy blobs, exam stats)', () => {
    localStorage.setItem(SESSIONS_KEY, '[]');
    localStorage.setItem('aarya_notes_seen', '{}');
    localStorage.setItem('aarya_progress', '{}');
    localStorage.setItem('ccaf_progress', '{}');
    localStorage.setItem('aarya_exam_stats', '{}');

    clearAllProgressData();

    expect(localStorage.getItem(SESSIONS_KEY)).toBeNull();
    expect(localStorage.getItem('aarya_notes_seen')).toBeNull();
    expect(localStorage.getItem('aarya_progress')).toBeNull();
    expect(localStorage.getItem('ccaf_progress')).toBeNull();
    expect(localStorage.getItem('aarya_exam_stats')).toBeNull();
  });

  it('removes keys matching the known progress-data prefixes', () => {
    localStorage.setItem('study_plan_ccaf', '{}');
    localStorage.setItem('study_daily_mins_ccaf', '30');
    localStorage.setItem('aarya_attempts_ccaf', '[]');
    localStorage.setItem('aarya_preploop_ccaf', '{}');

    clearAllProgressData();

    expect(localStorage.getItem('study_plan_ccaf')).toBeNull();
    expect(localStorage.getItem('study_daily_mins_ccaf')).toBeNull();
    expect(localStorage.getItem('aarya_attempts_ccaf')).toBeNull();
    expect(localStorage.getItem('aarya_preploop_ccaf')).toBeNull();
  });

  it('does not remove unrelated, non-progress preference keys', () => {
    localStorage.setItem('preferred_ai_tool', 'copilot');
    clearAllProgressData();
    expect(localStorage.getItem('preferred_ai_tool')).toBe('copilot');
  });
});
