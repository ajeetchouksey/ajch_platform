import { describe, it, expect } from 'vitest';
import { computeRelationshipEdges, type RelationshipDoc } from './relationships';

function doc(overrides: Partial<RelationshipDoc> = {}): RelationshipDoc {
  return {
    id: 'blog/test-post',
    type: 'blog',
    title: 'Test Post',
    url: '/blog/test-post',
    taxonomyIds: [],
    ...overrides,
  };
}

describe('computeRelationshipEdges', () => {
  it('returns no edges when there is no taxonomyIds overlap', () => {
    const a = doc({ id: 'blog/a', type: 'blog', taxonomyIds: ['rag'] });
    const b = doc({ id: 'lab/b', type: 'lab', taxonomyIds: ['prompt-flow'] });
    const edges = computeRelationshipEdges([a, b], { tier1Ids: new Set() });
    expect(edges['blog/a']).toBeUndefined();
    expect(edges['lab/b']).toBeUndefined();
  });

  it('creates symmetric edges for a cross-type pair with shared taxonomyIds', () => {
    const a = doc({ id: 'blog/a', type: 'blog', taxonomyIds: ['rag', 'agentic-ai'] });
    const b = doc({ id: 'lab/b', type: 'lab', taxonomyIds: ['rag'] });
    const edges = computeRelationshipEdges([a, b], { tier1Ids: new Set() });
    expect(edges['blog/a']).toHaveLength(1);
    expect(edges['lab/b']).toHaveLength(1);
    expect(edges['blog/a'][0].id).toBe('lab/b');
    expect(edges['lab/b'][0].id).toBe('blog/a');
    expect(edges['blog/a'][0].sharedTaxonomyIds).toEqual(['rag']);
  });

  it('skips same-type pairs even with full taxonomyIds overlap', () => {
    const a = doc({ id: 'blog/a', type: 'blog', taxonomyIds: ['rag'] });
    const b = doc({ id: 'blog/b', type: 'blog', taxonomyIds: ['rag'] });
    const edges = computeRelationshipEdges([a, b], { tier1Ids: new Set() });
    expect(edges['blog/a']).toBeUndefined();
    expect(edges['blog/b']).toBeUndefined();
  });

  it('skips docs with no taxonomyIds at all', () => {
    const a = doc({ id: 'blog/a', type: 'blog', taxonomyIds: [] });
    const b = doc({ id: 'lab/b', type: 'lab', taxonomyIds: ['rag'] });
    const edges = computeRelationshipEdges([a, b], { tier1Ids: new Set() });
    expect(edges['blog/a']).toBeUndefined();
    expect(edges['lab/b']).toBeUndefined();
  });

  it('scores a Tier-1 shared id higher than an equal-overlap Tier-2-only pair', () => {
    const now = Date.now();
    const source = doc({ id: 'blog/source', type: 'blog', taxonomyIds: ['tier1-topic', 'tier2-topic'], updatedAt: new Date(now).toISOString() });
    const tier1Match = doc({ id: 'lab/tier1', type: 'lab', taxonomyIds: ['tier1-topic'], updatedAt: new Date(now).toISOString() });
    const tier2Match = doc({ id: 'usecase/tier2', type: 'usecase', taxonomyIds: ['tier2-topic'], updatedAt: new Date(now).toISOString() });

    const edges = computeRelationshipEdges([source, tier1Match, tier2Match], {
      tier1Ids: new Set(['tier1-topic']),
      now,
    });

    const scoreFor = (targetId: string) => edges['blog/source'].find((e) => e.id === targetId)?.score;
    expect(scoreFor('lab/tier1')!).toBeGreaterThan(scoreFor('usecase/tier2')!);
  });

  it('ranks a fresher equally-relevant target above a stale one ("latest-first")', () => {
    const now = Date.now();
    const oneDayAgo = new Date(now - 1 * 86_400_000).toISOString();
    const oneYearAgo = new Date(now - 365 * 86_400_000).toISOString();

    const source = doc({ id: 'blog/source', type: 'blog', taxonomyIds: ['topic'], updatedAt: oneDayAgo });
    const fresh = doc({ id: 'lab/fresh', type: 'lab', taxonomyIds: ['topic'], updatedAt: oneDayAgo });
    const stale = doc({ id: 'usecase/stale', type: 'usecase', taxonomyIds: ['topic'], updatedAt: oneYearAgo });

    const edges = computeRelationshipEdges([source, fresh, stale], { tier1Ids: new Set(), now });
    expect(edges['blog/source'][0].id).toBe('lab/fresh');
    expect(edges['blog/source'][0].score).toBeGreaterThan(edges['blog/source'][1].score);
  });

  it('treats a doc with no updatedAt as neutral recency, not zero', () => {
    const source = doc({ id: 'blog/source', type: 'blog', taxonomyIds: ['topic'] });
    const undated = doc({ id: 'lab/undated', type: 'lab', taxonomyIds: ['topic'] }); // no updatedAt
    const edges = computeRelationshipEdges([source, undated], { tier1Ids: new Set() });
    expect(edges['blog/source'][0].score).toBeGreaterThan(0);
  });

  it('merges a hand-authored why onto a matching computed edge without changing its score', () => {
    const a = doc({ id: 'lab/a', type: 'lab', taxonomyIds: ['topic'] });
    const b = doc({ id: 'usecase/b', type: 'usecase', taxonomyIds: ['topic'] });
    const withoutWhy = computeRelationshipEdges([a, b], { tier1Ids: new Set() });
    const withWhy = computeRelationshipEdges([a, b], {
      tier1Ids: new Set(),
      whyLookup: (source, target) => (source === 'lab/a' && target === 'usecase/b' ? 'Hand-authored reason' : null),
    });
    expect(withWhy['lab/a'][0].why).toBe('Hand-authored reason');
    expect(withWhy['usecase/b'][0].why).toBeNull(); // why-lookup is directional — only matched one side
    expect(withWhy['lab/a'][0].score).toBe(withoutWhy['lab/a'][0].score);
  });

  it('does not fabricate an edge just because a hand-authored why exists with no taxonomyIds overlap', () => {
    const a = doc({ id: 'lab/a', type: 'lab', taxonomyIds: ['topic-a'] });
    const b = doc({ id: 'usecase/b', type: 'usecase', taxonomyIds: ['topic-b'] }); // no overlap with a
    const edges = computeRelationshipEdges([a, b], {
      tier1Ids: new Set(),
      whyLookup: () => 'This why should never surface — there is no computed baseline to attach it to',
    });
    expect(edges['lab/a']).toBeUndefined();
    expect(edges['usecase/b']).toBeUndefined();
  });

  it('caps edges per doc at maxEdgesPerDoc, keeping the highest scores', () => {
    const source = doc({ id: 'blog/source', type: 'blog', taxonomyIds: ['topic'] });
    const targets = Array.from({ length: 5 }, (_, i) =>
      doc({ id: `lab/target-${i}`, type: 'lab', taxonomyIds: ['topic'] })
    );
    const edges = computeRelationshipEdges([source, ...targets], { tier1Ids: new Set(), maxEdgesPerDoc: 2 });
    expect(edges['blog/source']).toHaveLength(2);
  });
});
