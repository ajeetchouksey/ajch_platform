import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CONTENT_MANIFEST,
  contentBase,
  loadContentManifest,
  resolveContentUrl,
  extractSchemaVersion,
  SUPPORTED_SCHEMA_VERSIONS,
} from './content-manifest';

test('content manifest stays local-by-default until a vertical is promoted', () => {
  assert.deepEqual(CONTENT_MANIFEST, {});
  assert.equal(contentBase('blog'), '/content/blog/');
  assert.equal(resolveContentUrl('content/blog/index.json'), '/content/blog/index.json');
});

test('supported schema versions are normalized from strings and numbers', () => {
  assert.equal(extractSchemaVersion('1.0'), 1);
  assert.equal(extractSchemaVersion(1), 1);
  assert.equal(extractSchemaVersion('interviews@1'), 1);
  assert.ok(SUPPORTED_SCHEMA_VERSIONS.has(1));
});

test('runtime manifest hydration loads the repo-level manifest snapshot', async () => {
  const manifest = await loadContentManifest();
  assert.ok(manifest && typeof manifest === 'object');
  assert.equal(typeof CONTENT_MANIFEST, 'object');
});
