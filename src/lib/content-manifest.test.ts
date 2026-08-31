import {
  CONTENT_MANIFEST,
  contentBase,
  loadContentManifest,
  resolveContentUrl,
  extractSchemaVersion,
  SUPPORTED_SCHEMA_VERSIONS,
} from './content-manifest';

describe('content manifest', () => {
  it('stays local-by-default until a vertical is promoted', () => {
    expect(CONTENT_MANIFEST).toEqual({});
    expect(contentBase('blog')).toBe('/content/blog/');
    expect(resolveContentUrl('content/blog/index.json')).toBe('/content/blog/index.json');
  });

  it('normalizes supported schema versions from strings and numbers', () => {
    expect(extractSchemaVersion('1.0')).toBe(1);
    expect(extractSchemaVersion(1)).toBe(1);
    expect(extractSchemaVersion('interviews@1')).toBe(1);
    expect(SUPPORTED_SCHEMA_VERSIONS.has(1)).toBe(true);
  });

  it('hydrates the runtime manifest from the repo-level manifest snapshot', async () => {
    const manifest = await loadContentManifest();
    expect(manifest).toBeTypeOf('object');
    expect(CONTENT_MANIFEST).toBeTypeOf('object');
  });
});
