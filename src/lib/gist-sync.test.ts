import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { findProgressGist, loadProgress, saveProgress } from './gist-sync';
import type { ProgressData } from './gist-sync';

// Synthetic fake credential — never a real GitHub token.
const FAKE_TOKEN = 'fake-test-token-not-a-real-credential';
const GIST_DESCRIPTION = 'Aarya — AI Learning Hub Progress';
const GIST_FILENAME = 'ccaf-progress.json';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const minimalProgress: ProgressData = {
  quizHistory: [],
  domainProgress: {},
  lastSync: '2026-01-01T00:00:00.000Z',
};

describe('findProgressGist', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns gist id when matching description + filename found', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, [
        { id: 'other-gist', description: 'unrelated gist', files: {} },
        { id: 'progress-gist', description: GIST_DESCRIPTION, files: { [GIST_FILENAME]: {} } },
      ]),
    );

    expect(await findProgressGist(FAKE_TOKEN)).toBe('progress-gist');
  });

  it('returns null when no matching gist found', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, []));

    expect(await findProgressGist(FAKE_TOKEN)).toBeNull();
  });

  it('returns null when fetch fails (non-200)', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(403, {}));

    expect(await findProgressGist(FAKE_TOKEN)).toBeNull();
  });

  it('sends the token as a Bearer authorization header', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValue(jsonResponse(200, []));

    await findProgressGist(FAKE_TOKEN);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://api.github.com/gists'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${FAKE_TOKEN}` }),
      }),
    );
  });
});

describe('loadProgress', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null when no matching gist exists', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, []));

    expect(await loadProgress(FAKE_TOKEN)).toBeNull();
  });

  it('returns null when the gist detail fetch fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(200, [{ id: 'g1', description: GIST_DESCRIPTION, files: { [GIST_FILENAME]: {} } }]),
      )
      .mockResolvedValueOnce(jsonResponse(404, {}));

    expect(await loadProgress(FAKE_TOKEN)).toBeNull();
  });

  it('returns parsed ProgressData when the gist content is valid JSON', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(200, [{ id: 'g1', description: GIST_DESCRIPTION, files: { [GIST_FILENAME]: {} } }]),
      )
      .mockResolvedValueOnce(
        jsonResponse(200, { files: { [GIST_FILENAME]: { content: JSON.stringify(minimalProgress) } } }),
      );

    expect(await loadProgress(FAKE_TOKEN)).toEqual(minimalProgress);
  });

  it('returns null when the gist file content is invalid JSON', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse(200, [{ id: 'g1', description: GIST_DESCRIPTION, files: { [GIST_FILENAME]: {} } }]),
      )
      .mockResolvedValueOnce(jsonResponse(200, { files: { [GIST_FILENAME]: { content: 'not-json' } } }));

    expect(await loadProgress(FAKE_TOKEN)).toBeNull();
  });
});

describe('saveProgress', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('PATCHes existing gist when gistId found', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch
      .mockResolvedValueOnce(
        jsonResponse(200, [{ id: 'g1', description: GIST_DESCRIPTION, files: { [GIST_FILENAME]: {} } }]),
      )
      .mockResolvedValueOnce(jsonResponse(200, {}));

    const ok = await saveProgress(FAKE_TOKEN, minimalProgress);

    expect(ok).toBe(true);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/gists/g1',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('POSTs new gist when no existing gist is found', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(jsonResponse(200, [])).mockResolvedValueOnce(jsonResponse(201, {}));

    const ok = await saveProgress(FAKE_TOKEN, minimalProgress);

    expect(ok).toBe(true);
    expect(mockFetch).toHaveBeenNthCalledWith(
      2,
      'https://api.github.com/gists',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns false and does not throw on 403 Forbidden from the write request', async () => {
    const mockFetch = vi.mocked(fetch);
    mockFetch.mockResolvedValueOnce(jsonResponse(200, [])).mockResolvedValueOnce(jsonResponse(403, {}));

    await expect(saveProgress(FAKE_TOKEN, minimalProgress)).resolves.toBe(false);
  });
});
