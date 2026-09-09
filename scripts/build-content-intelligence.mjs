#!/usr/bin/env node
/**
 * build-content-intelligence.mjs
 *
 * Regenerates public/content/stats.json (v2) from each vertical's own
 * authoritative counts — trusting declared fields (skillup catalog's
 * `questions`, hol-labs index's `totalCount`, etc.) rather than
 * re-deriving them independently, and covering ALL promoted verticals
 * (the old scripts/sync-stats.py — since removed — never counted usecases
 * or hol-labs at all, and its tool counter silently broke when routes moved
 * from src/App.tsx to src/app/router.tsx).
 *
 * Reuses the manifest-aware loaders in scripts/lib/content-sources.mjs so
 * there is exactly one implementation of "how to fetch a vertical's
 * content, promoted or local" in this repo.
 *
 * Also writes public/content/relationships.json — computed cross-vertical
 * relationships, scored by taxonomyIds overlap weighted by recency. The
 * scoring algorithm here is a plain-JS port of src/lib/relationships.ts
 * (which has the tested, documented reference implementation and its own
 * Vitest suite) — this script can't import that .ts file directly because
 * CI pins Node 22 without --experimental-strip-types. Change the formula in
 * BOTH places if you ever touch it.
 *
 * See IDEA-0008 in ajch_food_for_thoughts for the full phased plan. As of
 * Phase 4, hol-labs, usecases, blog, and interviews all have taxonomyIds
 * (blog via alias-resolved backfill — see scripts/lib/taxonomy.mjs — since
 * its tags are free text, unlike the other three's already-clean
 * vocabularies). Only skillup remains unannotated: its Question.tags are
 * per-question, not per-exam, and this pipeline's docs are one-per-exam —
 * bridging that gap means either aggregating a whole exam's tags (too
 * noisy, kills precision) or adding exam-domain-level docs (a real
 * architecture extension, not a backfill) — deliberately deferred rather
 * than shipping a low-precision shortcut.
 *
 * Gap-closure Epic (ajch_food_for_thoughts#39/#40, 2026-09): use cases now
 * cross-check the real cases/*.json file list against _source-intel.json
 * instead of trusting that summary alone (findExtraUsecaseDocs) — closes a
 * permanent sync-drift risk, not just a periodic backfill gap. The 9 AI
 * Tools pages now participate too, via alias-resolved keywords (buildToolDocs,
 * scripts/lib/tools-registry.mjs) — the same alias-resolution machinery
 * blog's free-text tags already use, so a tool only gets a taxonomyId where
 * a real taxonomy.json match exists, never a hand-guessed one. Discovery/
 * Pathways, individual skill-track lessons, and interview role-pack deltas
 * remain deliberately out of scope — see that issue's closing comment for
 * the written decision on each.
 *
 * Usage: node scripts/build-content-intelligence.mjs
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  loadBlogIndex,
  loadSkillupCatalog,
  loadUsecasesSourceIntel,
  loadHolLabsIndex,
  loadHolLabFile,
  loadInterviewsBank,
  listUsecasesCaseFileIds,
  loadUsecaseCaseFile,
} from './lib/content-sources.mjs';
import { buildGlossaryTerms } from './build-glossary.mjs';
import { loadTaxonomyTopics, buildAliasIndex } from './lib/taxonomy.mjs';
import { TOOLS } from './lib/tools-registry.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const manifestPath = join(root, 'content-manifest.json');

function loadManifest() {
  if (!existsSync(manifestPath)) return null;
  return JSON.parse(readFileSync(manifestPath, 'utf-8'));
}

function countBlogPosts(blogIndex) {
  if (!blogIndex?.posts) return 0;
  return blogIndex.posts.filter((p) => !p.draft).length;
}

function countSkillupAggregates(catalog) {
  const exams = catalog?.exams ?? [];
  return {
    questions: exams.reduce((sum, e) => sum + (e.questions ?? 0), 0),
    exams: exams.filter((e) => e.available).length,
    notes: exams.reduce((sum, e) => sum + (e.domains ?? []).filter((d) => d.notesFile).length, 0),
    scenarios: exams.reduce((sum, e) => sum + (e.scenarioFiles ?? []).length, 0),
  };
}

// featuredUseCases + catalogUseCases, deduped by id — mirrors the exact
// union logic in src/lib/content-loader.ts's use-case list builder, so this
// count matches what the app itself actually renders, not a re-derivation
// that could silently diverge from it.
function countUseCases(sourceIntel) {
  if (!sourceIntel) return 0;
  const featured = sourceIntel.featuredUseCases ?? [];
  const catalog = sourceIntel.catalogUseCases ?? [];
  const featuredIds = new Set(featured.map((u) => u.id));
  const catalogOnly = catalog.filter((u) => !featuredIds.has(u.id));
  return featured.length + catalogOnly.length;
}

function countHolLabs(holLabsIndex) {
  return holLabsIndex?.totalCount ?? (holLabsIndex?.labs ?? []).length;
}

function countAgents() {
  const dir = join(root, '.claude', 'agents');
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => f.endsWith('.md')).length;
}

// Route definitions moved from src/App.tsx (now a thin Suspense/Router
// shell — see its own file) to src/app/router.tsx some time ago.
// scripts/sync-stats.py's count_tools() still regex-scans the old file and
// has been silently reporting 0 tools ever since — a second, independent
// staleness bug beyond the one this whole script exists to fix.
function countTools() {
  const path = join(root, 'src', 'app', 'router.tsx');
  if (!existsSync(path)) return 0;
  const content = readFileSync(path, 'utf-8');
  const matches = content.match(/path="\/tools\/[^"]+"/g);
  return matches ? matches.length : 0;
}

function freshnessFor(manifest, vertical, fallback) {
  const entry = manifest?.[vertical];
  if (entry?.promotedAt) {
    return { source: 'cdn', promotedAt: entry.promotedAt, sha: entry.sha };
  }
  return { source: 'local', contentUpdatedAt: fallback ?? null };
}

// ── Relationship engine (plain-JS port of src/lib/relationships.ts) ────────

function loadTaxonomyTier1Ids() {
  const path = join(root, 'public', 'content', 'taxonomy.json');
  if (!existsSync(path)) return new Set();
  const taxonomy = JSON.parse(readFileSync(path, 'utf-8'));
  return new Set(taxonomy.topics.filter((t) => t.tier === 1).map((t) => t.id));
}

// ajch_food_for_thoughts#40 item 1 — any content/usecases/cases/{id}.json
// that exists but isn't summarized in _source-intel.json's featuredUseCases/
// catalogUseCases arrays used to be structurally invisible to collectRelDocs
// forever, not just until the next backfill run. Cross-checks the real file
// list (via listUsecasesCaseFileIds — a genuine CDN directory listing, not
// another read of the same summary file) against sourceIntel's coverage, and
// fetches the handful likely to differ directly.
async function findExtraUsecaseDocs(sourceIntel) {
  const covered = new Set([
    ...(sourceIntel?.featuredUseCases ?? []).map((u) => u.id),
    ...(sourceIntel?.catalogUseCases ?? []).map((u) => u.id),
  ]);
  const allCaseIds = await listUsecasesCaseFileIds().catch((e) => {
    console.error(`⚠ listUsecasesCaseFileIds: ${e.message}`);
    return [];
  });
  const missingIds = allCaseIds.filter((id) => !covered.has(id));
  if (missingIds.length === 0) return [];

  console.log(`Use cases: ${missingIds.length} case file(s) not in _source-intel.json — fetching directly: ${missingIds.join(', ')}`);
  const files = await Promise.all(missingIds.map((id) => loadUsecaseCaseFile(id)));
  return files.filter(Boolean);
}

// ajch_food_for_thoughts#40 item 2 — the 9 AI Tools pages have no content
// repo/taxonomyIds field of their own. Resolves each tool's existing
// TOOLS_MAP-derived keyword list (scripts/lib/tools-registry.mjs) through
// the same alias-resolution machinery blog's free-text tags already use —
// only a real taxonomy.json alias match counts, so this stays precision-safe
// rather than treating every keyword as if it were already canonical.
function buildToolDocs() {
  const { resolve } = buildAliasIndex(loadTaxonomyTopics());
  return TOOLS.map((tool) => ({
    id: `tool/${tool.id}`,
    type: 'tool',
    title: tool.title,
    url: tool.url,
    taxonomyIds: [...new Set(tool.keywords.map((k) => resolve(k)).filter(Boolean))],
  }));
}

// Flatten every currently-integrated vertical into the {id, type, title, url,
// taxonomyIds, updatedAt} shape relationship scoring needs. Ids/urls mirror
// src/lib/search.ts's scheme exactly (blog/{slug}, exam/{id}, usecase/{id},
// lab/{id}) so relationships.json's keys line up with the SPA's doc ids.
// Skillup only has an exam-level entry here (no domain-level breakdown) since
// exams don't carry taxonomyIds yet (Phase 4) — nothing is lost by keeping
// this minimal until that phase actually needs the finer granularity.
export function collectRelDocs({ blogIndex, skillupCatalog, sourceIntel, holLabsIndex, interviewsBank, extraUsecaseDocs = [], toolDocs = [] }) {
  const docs = [];

  for (const p of blogIndex?.posts ?? []) {
    if (p.draft) continue;
    docs.push({ id: `blog/${p.slug}`, type: 'blog', title: p.title, url: `/blog/${p.slug}`, taxonomyIds: p.taxonomyIds ?? [], updatedAt: p.updated ?? p.date });
  }

  // Domain-level, not exam-level — an exam covers many subtopics (see this
  // file's header), so relationship scoring needs the finer grain. Id/url
  // scheme matches src/lib/search.ts's buildExamDocs domain entries exactly
  // (id: exam/{examId}/domain-{domainId}, url: /exams/{examId}/notes) so a
  // relationship edge and a search result for the same domain agree.
  //
  // Skill tracks (IDEA-0016, kind: "skill-track") have modules[] instead of
  // domains[] and no per-domain notes route — every lesson renders inline on
  // the track's own overview page — so the doc id uses module- instead of
  // domain- and the url always points at the track overview, not a sub-route.
  for (const e of skillupCatalog?.exams ?? []) {
    if (e.kind === 'skill-track') {
      for (const m of e.modules ?? []) {
        docs.push({
          id: `exam/${e.id}/module-${m.id}`,
          type: 'exam',
          title: `${e.title} — ${m.title}`,
          url: `/skillup/${e.id}`,
          taxonomyIds: m.taxonomyIds ?? [],
          updatedAt: e.contentUpdatedAt,
        });
      }
      continue;
    }
    for (const d of e.domains ?? []) {
      docs.push({
        id: `exam/${e.id}/domain-${d.id}`,
        type: 'exam',
        title: `${e.title} — ${d.title}`,
        url: `/exams/${e.id}/notes`,
        taxonomyIds: d.taxonomyIds ?? [],
        updatedAt: e.contentUpdatedAt,
      });
    }
  }

  const featured = sourceIntel?.featuredUseCases ?? [];
  const catalogOnly = (sourceIntel?.catalogUseCases ?? []).filter((u) => !featured.some((f) => f.id === u.id));
  for (const u of [...featured, ...catalogOnly]) {
    docs.push({ id: `usecase/${u.id}`, type: 'usecase', title: u.title, url: `/usecases/${u.id}`, taxonomyIds: u.taxonomyIds ?? [], updatedAt: u.updatedDate ?? u.publishedDate });
  }

  // Case files present on disk/CDN but not summarized in _source-intel.json
  // — see findExtraUsecaseDocs(). taxonomyIds falls back to patterns (the
  // same convention loadUseCaseById's individual-file path already uses).
  for (const u of extraUsecaseDocs) {
    docs.push({ id: `usecase/${u.id}`, type: 'usecase', title: u.title, url: `/usecases/${u.id}`, taxonomyIds: u.taxonomyIds ?? u.patterns ?? [], updatedAt: u.updatedDate ?? u.publishedDate });
  }

  docs.push(...toolDocs);

  for (const l of holLabsIndex?.labs ?? []) {
    docs.push({ id: `lab/${l.id}`, type: 'lab', title: l.title, url: `/hol-labs/${l.id}`, taxonomyIds: l.taxonomyIds ?? [], updatedAt: l.updatedDate });
  }

  for (const q of interviewsBank ?? []) {
    docs.push({ id: `interview/${q.id}`, type: 'interview', title: q.question, url: `/roleprep/q/${q.id}`, taxonomyIds: q.taxonomyIds ?? [] });
  }

  return docs;
}

const RECENCY_HALF_LIFE_DAYS = 90;

export function recencyWeight(updatedAt, now) {
  if (!updatedAt) return 1; // no date on record — neutral, don't penalize
  const days = (now - new Date(updatedAt).getTime()) / 86_400_000;
  if (!Number.isFinite(days) || days < 0) return 1; // bad/future date — don't let it dominate scoring
  return Math.pow(0.5, days / RECENCY_HALF_LIFE_DAYS);
}

// Same algorithm as src/lib/relationships.ts's computeRelationshipEdges — see
// that file's Vitest suite for the tested behavior (overlap-only matching,
// same-type skip, tier bonus, recency ordering, why-merge-is-enrichment-only,
// edge capping). Kept here as plain JS; see this file's header for why.
export function computeRelationshipEdges(docs, { tier1Ids, now, maxEdgesPerDoc = 10, whyLookup = () => null }) {
  const participants = docs.filter((d) => d.taxonomyIds.length > 0);
  const edges = {};
  const push = (from, to, score, shared) => {
    (edges[from.id] ??= []).push({
      id: to.id, type: to.type, title: to.title, url: to.url,
      score, sharedTaxonomyIds: shared, why: whyLookup(from.id, to.id),
    });
  };

  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const a = participants[i];
      const b = participants[j];
      if (a.type === b.type) continue;

      const shared = a.taxonomyIds.filter((id) => b.taxonomyIds.includes(id));
      if (shared.length === 0) continue;

      const tierBonus = shared.some((id) => tier1Ids.has(id)) ? 2 : 0;
      const base = shared.length * 3 + tierBonus;

      push(a, b, base * recencyWeight(b.updatedAt, now), shared);
      push(b, a, base * recencyWeight(a.updatedAt, now), shared);
    }
  }

  for (const id of Object.keys(edges)) {
    edges[id].sort((x, y) => y.score - x.score);
    if (edges[id].length > maxEdgesPerDoc) edges[id] = edges[id].slice(0, maxEdgesPerDoc);
  }
  return edges;
}

// Hand-authored why text, directional (sourceId -> targetId -> why). Only
// HOL Labs and Use Cases carry any hand-authored cross-vertical relation
// fields today; extend this as other verticals grow their own (Phase 4).
async function buildWhyLookup(holLabsIndex, sourceIntel) {
  const map = new Map();
  const set = (sourceId, targetId, why) => { if (why) map.set(`${sourceId}|${targetId}`, why); };

  for (const summary of holLabsIndex?.labs ?? []) {
    const full = await loadHolLabFile(summary.id).catch(() => null);
    if (!full) continue;
    const sourceId = `lab/${full.id}`;
    for (const r of full.relatedExams ?? []) set(sourceId, `exam/${r.exam}`, r.why);
    for (const r of full.relatedBlogPosts ?? []) set(sourceId, `blog/${r.slug}`, r.why);
    for (const r of full.relatedUseCases ?? []) set(sourceId, `usecase/${r.id}`, r.why);
  }

  for (const u of sourceIntel?.featuredUseCases ?? []) {
    const sourceId = `usecase/${u.id}`;
    for (const r of u.relatedExams ?? []) set(sourceId, `exam/${r.exam}`, r.why);
  }

  return (sourceId, targetId) => map.get(`${sourceId}|${targetId}`) ?? null;
}

async function main() {
  const manifest = loadManifest();

  const [blogIndex, skillupCatalog, sourceIntel, holLabsIndex, interviewsBank] = await Promise.all([
    loadBlogIndex().catch((e) => { console.error(`⚠ blog: ${e.message}`); return null; }),
    loadSkillupCatalog().catch((e) => { console.error(`⚠ skillup: ${e.message}`); return null; }),
    loadUsecasesSourceIntel().catch((e) => { console.error(`⚠ usecases: ${e.message}`); return null; }),
    loadHolLabsIndex().catch((e) => { console.error(`⚠ hol-labs: ${e.message}`); return null; }),
    loadInterviewsBank().catch((e) => { console.error(`⚠ interviews: ${e.message}`); return null; }),
  ]);

  const skillupCounts = countSkillupAggregates(skillupCatalog);
  const glossaryTerms = await buildGlossaryTerms(skillupCatalog);

  const stats = {
    schema: '2.0',
    generated: new Date().toISOString(),
    note: 'Auto-generated by scripts/build-content-intelligence.mjs. Regenerates on every vertical content push (near-real-time dispatch) and on every promotion — never edit by hand.',
    platform: {
      blog_posts: countBlogPosts(blogIndex),
      questions: skillupCounts.questions,
      exams: skillupCounts.exams,
      notes: skillupCounts.notes,
      scenarios: skillupCounts.scenarios,
      usecases: countUseCases(sourceIntel),
      hol_labs: countHolLabs(holLabsIndex),
      agents: countAgents(),
      tools: countTools(),
      glossary_terms: glossaryTerms.filter((t) => t.usageCount > 0).length,
    },
    freshness: {
      blog: freshnessFor(manifest, 'blog', blogIndex?.generated),
      skillup: freshnessFor(manifest, 'skillup', skillupCatalog?.generated),
      usecases: freshnessFor(manifest, 'usecases'),
      'hol-labs': freshnessFor(manifest, 'hol-labs'),
    },
  };

  const outDir = join(root, 'public', 'content');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'stats.json'), JSON.stringify(stats, null, 2) + '\n', 'utf-8');

  const p = stats.platform;
  console.log(
    `Stats written: ${p.blog_posts} posts · ${p.questions} questions · ${p.exams} exams · ` +
    `${p.notes} notes · ${p.scenarios} scenarios · ${p.usecases} use cases · ${p.hol_labs} labs · ` +
    `${p.agents} agents · ${p.tools} tools · ${p.glossary_terms} glossary terms in use`
  );

  const glossary = {
    schemaVersion: 1,
    generated: new Date().toISOString(),
    note: 'Auto-generated by scripts/build-glossary.mjs from scripts/lib/glossary-source.mjs — definitions are hand-curated there; usageCount/usedIn are computed by scanning skillup exam/skill-track notes for backtick-wrapped mentions. Regenerates alongside relationships.json/stats.json in build-content-intelligence.mjs. Do not hand-edit this file.',
    terms: glossaryTerms,
  };
  writeFileSync(join(outDir, 'glossary.json'), JSON.stringify(glossary, null, 2) + '\n', 'utf-8');
  console.log(`Glossary written: ${glossaryTerms.length} term(s), ${p.glossary_terms} in active use across content`);

  const now = Date.now();
  const extraUsecaseDocs = await findExtraUsecaseDocs(sourceIntel);
  const toolDocs = buildToolDocs();
  const relDocs = collectRelDocs({ blogIndex, skillupCatalog, sourceIntel, holLabsIndex, interviewsBank, extraUsecaseDocs, toolDocs });
  const tier1Ids = loadTaxonomyTier1Ids();
  const whyLookup = await buildWhyLookup(holLabsIndex, sourceIntel);
  const edges = computeRelationshipEdges(relDocs, { tier1Ids, now, whyLookup });

  const relationships = {
    schemaVersion: 1,
    generated: new Date(now).toISOString(),
    edges,
  };
  writeFileSync(join(outDir, 'relationships.json'), JSON.stringify(relationships, null, 2) + '\n', 'utf-8');

  const participantCount = relDocs.filter((d) => d.taxonomyIds.length > 0).length;
  const edgeCount = Object.values(edges).reduce((sum, e) => sum + e.length, 0);
  console.log(`Relationships written: ${Object.keys(edges).length} doc(s) with edges, ${edgeCount} edge(s) total (${participantCount}/${relDocs.length} docs have taxonomyIds)`);
}

// Guarded so build-content-intelligence.test.mjs can import the pure
// functions above (computeRelationshipEdges, recencyWeight) without
// triggering a real network-fetching run as an import side effect.
// pathToFileURL (not a manual file:// string) correctly resolves argv[1]
// against cwd the same way Node resolves the entry module — argv[1] is
// relative when the script is invoked with a relative path (the common
// case: `node scripts/build-content-intelligence.mjs`), so a naive
// `file://${argv[1]}` string never matches import.meta.url's always-
// absolute form.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
