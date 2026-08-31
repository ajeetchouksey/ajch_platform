import { vi } from 'vitest';
import { findProgressGist, loadProgress, saveProgress } from './gist-sync';

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('findProgressGist', () => {
  it('returns the gist id when a matching description + filename is found', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([
      { id: 'other-gist', description: 'unrelated', files: {} },
      { id: 'progress-gist', description: 'Aarya — AI Learning Hub Progress', files: { 'ccaf-progress.json': {} } },
    ]));
    await expect(findProgressGist('token')).resolves.toBe('progress-gist');
  });

  it('returns null when no matching gist is found', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([{ id: 'x', description: 'unrelated', files: {} }]));
    await expect(findProgressGist('token')).resolves.toBeNull();
  });

  it('returns null when the request fails (non-200)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(null, false, 403));
    await expect(findProgressGist('token')).resolves.toBeNull();
  });
});

describe('loadProgress', () => {
  it('returns null when there is no progress gist yet', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]));
    await expect(loadProgress('token')).resolves.toBeNull();
  });

  it('parses and returns the gist file content', async () => {
    const progress = { quizHistory: [], domainProgress: {}, lastSync: '2026-01-01T00:00:00.000Z' };
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([
        { id: 'progress-gist', description: 'Aarya — AI Learning Hub Progress', files: { 'ccaf-progress.json': {} } },
      ]))
      .mockResolvedValueOnce(jsonResponse({ files: { 'ccaf-progress.json': { content: JSON.stringify(progress) } } }));
    await expect(loadProgress('token')).resolves.toEqual(progress);
  });

  it('returns null when the gist file content is invalid JSON', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([
        { id: 'progress-gist', description: 'Aarya — AI Learning Hub Progress', files: { 'ccaf-progress.json': {} } },
      ]))
      .mockResolvedValueOnce(jsonResponse({ files: { 'ccaf-progress.json': { content: 'not-json' } } }));
    await expect(loadProgress('token')).resolves.toBeNull();
  });
});

describe('saveProgress', () => {
  const progress = { quizHistory: [], domainProgress: {}, lastSync: '2026-01-01T00:00:00.000Z' };

  it('PATCHes the existing gist when one is found', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([
        { id: 'progress-gist', description: 'Aarya — AI Learning Hub Progress', files: { 'ccaf-progress.json': {} } },
      ]))
      .mockResolvedValueOnce(jsonResponse({}));
    await expect(saveProgress('token', progress)).resolves.toBe(true);
    expect(vi.mocked(fetch).mock.calls[1][1]).toMatchObject({ method: 'PATCH' });
  });

  it('POSTs a new gist when none is found', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({}));
    await expect(saveProgress('token', progress)).resolves.toBe(true);
    expect(vi.mocked(fetch).mock.calls[1][1]).toMatchObject({ method: 'POST' });
  });

  it('returns false and does not throw on a 403 Forbidden write', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(null, false, 403));
    await expect(saveProgress('token', progress)).resolves.toBe(false);
  });
});
