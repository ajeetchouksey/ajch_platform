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

describe('getSessions', () => {
  it('returns empty array when localStorage is empty', () => {
    expect(getSessions()).toEqual([]);
  });

  it('returns parsed sessions from localStorage', () => {
    const session = makeSession({ skillId: 'ccaf', score: 7, total: 10 });
    saveSession(session);
    expect(getSessions()).toHaveLength(1);
    expect(getSessions()[0]).toMatchObject({ skillId: 'ccaf', score: 7, total: 10 });
  });

  it('returns empty array when localStorage contains invalid JSON', () => {
    localStorage.setItem('aarya_quiz_sessions', 'not-json');
    expect(getSessions()).toEqual([]);
  });
});

describe('saveSession', () => {
  it('appends a new session', () => {
    saveSession(makeSession({ id: 'a' }));
    saveSession(makeSession({ id: 'b' }));
    expect(getSessions().map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('overwrites an existing session with the same id instead of duplicating it', () => {
    saveSession(makeSession({ id: 'a', score: 1 }));
    saveSession(makeSession({ id: 'a', score: 9 }));
    const sessions = getSessions();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].score).toBe(9);
  });
});

describe('saveSessions / clearSessions', () => {
  it('replaces the entire sessions array', () => {
    saveSession(makeSession({ id: 'stale' }));
    saveSessions([makeSession({ id: 'fresh' })]);
    expect(getSessions().map((s) => s.id)).toEqual(['fresh']);
  });

  it('removes all sessions', () => {
    saveSession(makeSession());
    clearSessions();
    expect(getSessions()).toEqual([]);
  });
});

describe('mergeAnonymousProgress', () => {
  it('tags anonymous sessions with the given userId', () => {
    saveSession(makeSession({ id: 'anon', userId: undefined }));
    mergeAnonymousProgress('user-123');
    expect(getSessions()[0].userId).toBe('user-123');
  });

  it('does not overwrite a session that already has a userId', () => {
    saveSession(makeSession({ id: 'owned', userId: 'user-original' }));
    mergeAnonymousProgress('user-new');
    expect(getSessions()[0].userId).toBe('user-original');
  });
});

describe('getScoreByDomain', () => {
  it('aggregates scores only for finished sessions matching the exam id', () => {
    saveSessions([
      makeSession({ skillId: 'ccaf', domainFilter: 1, score: 3, total: 5, finishedAt: Date.now() }),
      makeSession({ skillId: 'ccaf', domainFilter: 1, score: 2, total: 5, finishedAt: Date.now() }),
      makeSession({ skillId: 'other-exam', domainFilter: 1, score: 10, total: 10, finishedAt: Date.now() }),
    ]);
    expect(getScoreByDomain('ccaf')).toEqual({ 1: { correct: 5, total: 10 } });
  });

  it('ignores sessions with domainFilter null', () => {
    saveSessions([makeSession({ skillId: 'ccaf', domainFilter: null, finishedAt: Date.now() })]);
    expect(getScoreByDomain('ccaf')).toEqual({});
  });

  it('ignores unfinished sessions', () => {
    saveSessions([makeSession({ skillId: 'ccaf', domainFilter: 1, finishedAt: undefined })]);
    expect(getScoreByDomain('ccaf')).toEqual({});
  });
});

describe('notes-seen tracking', () => {
  it('returns an empty map when nothing has been marked seen', () => {
    expect(getNotesSeen()).toEqual({});
  });

  it('returns empty object when localStorage contains invalid JSON', () => {
    localStorage.setItem('aarya_notes_seen', 'not-json');
    expect(getNotesSeen()).toEqual({});
  });

  it('marks a domain seen with a timestamp retrievable via getNotesSeenAt', () => {
    markNotesSeen('ccaf', 2);
    expect(getNotesSeenAt('ccaf', 2)).not.toBeNull();
    expect(getNotesSeenAt('ccaf', 3)).toBeNull();
  });

  it('setNotesSeen replaces the entire map', () => {
    markNotesSeen('ccaf', 1);
    setNotesSeen({ 'other:9': '2026-01-01T00:00:00.000Z' });
    expect(getNotesSeenAt('ccaf', 1)).toBeNull();
    expect(getNotesSeenAt('other', 9)).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('clearAllProgressData', () => {
  it('removes sessions and notes-seen data', () => {
    saveSession(makeSession());
    markNotesSeen('ccaf', 1);
    clearAllProgressData();
    expect(getSessions()).toEqual([]);
    expect(getNotesSeen()).toEqual({});
  });

  it('removes prefixed progress keys but leaves unrelated keys untouched', () => {
    localStorage.setItem('study_plan_ccaf', '{}');
    localStorage.setItem('preferred_ai_tool', 'claude');
    clearAllProgressData();
    expect(localStorage.getItem('study_plan_ccaf')).toBeNull();
    expect(localStorage.getItem('preferred_ai_tool')).toBe('claude');
  });
});
