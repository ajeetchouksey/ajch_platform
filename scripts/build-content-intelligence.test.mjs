#!/usr/bin/env node
// Regression test for the plain-JS relationship scorer in
// build-content-intelligence.mjs — this file isn't in vitest's coverage
// scope (src/lib/** only, see test-engineer.md), so it uses Node's built-in
// test runner directly. Mirrors a subset of src/lib/relationships.test.ts's
// cases; the two files aren't literally shared code (see
// build-content-intelligence.mjs's header for why: CI pins Node 22 without
// --experimental-strip-types, so that script can't import the .ts reference
// directly) — this exists specifically to catch the JS port drifting from
// the tested TS reference implementation.
//
// Usage: node --test scripts/build-content-intelligence.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRelationshipEdges } from './build-content-intelligence.mjs';

function doc(overrides) {
  return { id: 'blog/a', type: 'blog', title: 'A', url: '/a', taxonomyIds: [], ...overrides };
}

test('skips pairs with no taxonomyIds overlap', () => {
  const a = doc({ id: 'blog/a', type: 'blog', taxonomyIds: ['rag'] });
  const b = doc({ id: 'lab/b', type: 'lab', taxonomyIds: ['prompt-flow'] });
  const edges = computeRelationshipEdges([a, b], { tier1Ids: new Set() });
  assert.equal(edges['blog/a'], undefined);
  assert.equal(edges['lab/b'], undefined);
});

test('creates symmetric edges for a cross-type pair with shared taxonomyIds', () => {
  const a = doc({ id: 'blog/a', type: 'blog', taxonomyIds: ['rag', 'agentic-ai'] });
  const b = doc({ id: 'lab/b', type: 'lab', taxonomyIds: ['rag'] });
  const edges = computeRelationshipEdges([a, b], { tier1Ids: new Set() });
  assert.equal(edges['blog/a'].length, 1);
  assert.equal(edges['blog/a'][0].id, 'lab/b');
  assert.equal(edges['lab/b'][0].id, 'blog/a');
  assert.deepEqual(edges['blog/a'][0].sharedTaxonomyIds, ['rag']);
});

test('skips same-type pairs even with full overlap', () => {
  const a = doc({ id: 'blog/a', type: 'blog', taxonomyIds: ['rag'] });
  const b = doc({ id: 'blog/b', type: 'blog', taxonomyIds: ['rag'] });
  const edges = computeRelationshipEdges([a, b], { tier1Ids: new Set() });
  assert.equal(edges['blog/a'], undefined);
});

test('scores a Tier-1 shared id higher than an equal-overlap Tier-2-only pair', () => {
  const now = Date.now();
  const iso = new Date(now).toISOString();
  const source = doc({ id: 'blog/source', taxonomyIds: ['tier1-topic', 'tier2-topic'], updatedAt: iso });
  const tier1Match = doc({ id: 'lab/tier1', type: 'lab', taxonomyIds: ['tier1-topic'], updatedAt: iso });
  const tier2Match = doc({ id: 'usecase/tier2', type: 'usecase', taxonomyIds: ['tier2-topic'], updatedAt: iso });
  const edges = computeRelationshipEdges([source, tier1Match, tier2Match], { tier1Ids: new Set(['tier1-topic']), now });
  const scoreFor = (id) => edges['blog/source'].find((e) => e.id === id).score;
  assert.ok(scoreFor('lab/tier1') > scoreFor('usecase/tier2'));
});

test('merges hand-authored why onto a matching computed edge without changing its score', () => {
  const a = doc({ id: 'lab/a', type: 'lab', taxonomyIds: ['topic'] });
  const b = doc({ id: 'usecase/b', type: 'usecase', taxonomyIds: ['topic'] });
  const without = computeRelationshipEdges([a, b], { tier1Ids: new Set() });
  const withWhy = computeRelationshipEdges([a, b], {
    tier1Ids: new Set(),
    whyLookup: (s, t) => (s === 'lab/a' && t === 'usecase/b' ? 'Hand-authored reason' : null),
  });
  assert.equal(withWhy['lab/a'][0].why, 'Hand-authored reason');
  assert.equal(withWhy['usecase/b'][0].why, null);
  assert.equal(withWhy['lab/a'][0].score, without['lab/a'][0].score);
});

test('does not fabricate an edge from a why-lookup with no taxonomyIds overlap', () => {
  const a = doc({ id: 'lab/a', type: 'lab', taxonomyIds: ['topic-a'] });
  const b = doc({ id: 'usecase/b', type: 'usecase', taxonomyIds: ['topic-b'] });
  const edges = computeRelationshipEdges([a, b], { tier1Ids: new Set(), whyLookup: () => 'should never surface' });
  assert.equal(edges['lab/a'], undefined);
});
