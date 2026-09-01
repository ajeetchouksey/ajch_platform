import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  CONTENT_MANIFEST,
  contentBase,
  loadContentManifest,
  resolveContentUrl,
  extractSchemaVersion,
  SUPPORTED_SCHEMA_VERSIONS,
  verticalFromContentPath,
  validateSchemaCompatibility,
} from './content-manifest';

/** CONTENT_MANIFEST is a shared, mutable module singleton — reset it between tests. */
function resetManifest(): void {
  Object.keys(CONTENT_MANIFEST).forEach((key) => delete CONTENT_MANIFEST[key]);
}

describe('contentBase / resolveContentUrl with no promoted vertical', () => {
  beforeEach(() => resetManifest());

  it('resolves to the local /content/<vertical>/ path when nothing is promoted', () => {
    expect(contentBase('blog')).toBe('/content/blog/');
    expect(resolveContentUrl('content/blog/index.json')).toBe('/content/blog/index.json');
  });

  it('prefixes a bare relative path with content/ automatically', () => {
    expect(resolveContentUrl('blog/index.json')).toBe('/content/blog/index.json');
  });
});

describe('contentBase / resolveContentUrl with a promoted vertical', () => {
  beforeEach(() => resetManifest());
  afterEach(() => resetManifest());

  it('uses the jsDelivr CDN URL when repo + sha are set', () => {
    CONTENT_MANIFEST.blog = { repo: 'org/repo', sha: 'abc123' };
    expect(contentBase('blog')).toBe('https://cdn.jsdelivr.net/gh/org/repo@abc123/');
    expect(resolveContentUrl('content/blog/index.json')).toBe(
      'https://cdn.jsdelivr.net/gh/org/repo@abc123/content/blog/index.json',
    );
  });

  it('uses the entry baseUrl override when provided', () => {
    CONTENT_MANIFEST.blog = { repo: 'org/repo', sha: 'abc123', baseUrl: 'https://example.com/cdn' };
    expect(contentBase('blog')).toBe('https://example.com/cdn/org/repo@abc123/');
  });

  it('falls back to the local path when repo is set but sha is missing', () => {
    CONTENT_MANIFEST.blog = { repo: 'org/repo' };
    expect(contentBase('blog')).toBe('/content/blog/');
  });
});

describe('verticalFromContentPath', () => {
  it('extracts the vertical segment from a content path', () => {
    expect(verticalFromContentPath('content/blog/index.json')).toBe('blog');
  });

  it('returns null when the path does not start with content/', () => {
    expect(verticalFromContentPath('blog/index.json')).toBeNull();
  });

  it('normalizes leading slashes and backslashes before matching', () => {
    expect(verticalFromContentPath('\\content\\skillup\\ab100')).toBe('skillup');
  });
});

describe('extractSchemaVersion', () => {
  it('returns the number unchanged for integer input', () => {
    expect(extractSchemaVersion(1)).toBe(1);
  });

  it('parses a numeric string into an integer', () => {
    expect(extractSchemaVersion('1.0')).toBe(1);
  });

  it('extracts trailing digits from a composite string like "interviews@1"', () => {
    expect(extractSchemaVersion('interviews@1')).toBe(1);
  });

  it('returns null for a non-numeric string with no digits', () => {
    expect(extractSchemaVersion('not-a-version')).toBeNull();
  });

  it('returns null for a non-integer number', () => {
    expect(extractSchemaVersion(1.5)).toBeNull();
  });

  it('returns null for null, undefined, and non-string/number types', () => {
    expect(extractSchemaVersion(null)).toBeNull();
    expect(extractSchemaVersion(undefined)).toBeNull();
    expect(extractSchemaVersion({})).toBeNull();
  });
});

describe('SUPPORTED_SCHEMA_VERSIONS', () => {
  it('includes versions 1 and 2 but not 3', () => {
    expect(SUPPORTED_SCHEMA_VERSIONS.has(1)).toBe(true);
    expect(SUPPORTED_SCHEMA_VERSIONS.has(2)).toBe(true);
    expect(SUPPORTED_SCHEMA_VERSIONS.has(3)).toBe(false);
  });
});

describe('validateSchemaCompatibility', () => {
  it('does nothing when the payload has no schemaVersion or schema field', () => {
    expect(() => validateSchemaCompatibility('blog', { foo: 'bar' })).not.toThrow();
  });

  it('does nothing for non-object payloads', () => {
    expect(() => validateSchemaCompatibility('blog', null)).not.toThrow();
    expect(() => validateSchemaCompatibility('blog', 'a string')).not.toThrow();
  });

  it('accepts a supported schema version', () => {
    expect(() => validateSchemaCompatibility('blog', { schemaVersion: 2 })).not.toThrow();
  });

  it('throws for an unsupported schema version', () => {
    expect(() => validateSchemaCompatibility('blog', { schemaVersion: 99 })).toThrow(
      /Unsupported schema version/,
    );
  });

  it('throws when the schema declaration cannot be parsed to a number', () => {
    expect(() => validateSchemaCompatibility('blog', { schemaVersion: 'not-a-version' })).toThrow(
      /Unsupported schema declaration/,
    );
  });
});

describe('loadContentManifest', () => {
  beforeEach(() => {
    resetManifest();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetManifest();
  });

  it('merges valid manifest entries from the fetched JSON into CONTENT_MANIFEST', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ blog: { repo: 'org/repo', sha: 'deadbeef', schemaVersion: 2 } }),
    } as Response);

    const result = await loadContentManifest();

    expect(result.blog).toEqual({
      repo: 'org/repo',
      sha: 'deadbeef',
      baseUrl: undefined,
      schemaVersion: 2,
      promotedAt: undefined,
    });
    expect(CONTENT_MANIFEST.blog).toEqual(result.blog);
  });

  it('returns the manifest unchanged when the fetch response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);

    const result = await loadContentManifest();
    expect(result).toEqual({});
  });

  it('returns the manifest unchanged when fetch rejects (graceful single-repo fallback)', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('network down'));

    const result = await loadContentManifest();
    expect(result).toEqual({});
  });

  it('ignores non-object entries in the manifest payload', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ blog: 'not-an-object', valid: { repo: 'a/b', sha: 'x' } }),
    } as Response);

    const result = await loadContentManifest();
    expect(result.blog).toBeUndefined();
    expect(result.valid).toEqual({
      repo: 'a/b',
      sha: 'x',
      baseUrl: undefined,
      schemaVersion: undefined,
      promotedAt: undefined,
    });
  });
});
