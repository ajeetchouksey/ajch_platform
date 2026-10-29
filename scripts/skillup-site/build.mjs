#!/usr/bin/env node
/**
 * SkillUp site builder — the reusable framework that turns ajch_skillup content
 * into the SkillUp learning experience (catalog → exam → lessons, tests,
 * practice exam, case studies), for every exam and skill track in the catalog.
 *
 *   node scripts/skillup-site/build.mjs --content ../ajch_skillup --out dist/skillup-site [--inline] [--exam ai901,gh600]
 *
 * --content  ajch_skillup checkout (reads content/skillup/catalog.json and each entry's files)
 * --out      output folder: index.html (+ <exam>/images/* unless --inline)
 * --inline   embed every diagram as a data: URI → one self-contained index.html
 * --exam     build only these ids (default: every catalog entry)
 * --embed    write skillup-data.js + skillup-app.js + skillup.css (scoped, AaryaAI theme) for the React
 *            host page instead of a standalone index.html; use with --asset-base
 * --asset-base URL prefix for diagrams in --embed mode, e.g. /skillup-assets/
 * --base     URL path the site is served from, e.g. /skillup/ (sets <base> so diagrams resolve with or without a trailing slash)
 *
 * Content modes are detected per entry, so upgrading an exam's notes needs no
 * framework change:
 *   lessons  notes follow the task-keyed standard (`## {taskId} {title}` with
 *            Key Concept / Real use / How it works / Choose when / How to do it /
 *            Exam Trap / Go deeper) → one lesson page per official task
 *   classic  older per-domain notes → rendered per domain with a section index;
 *            tasks still get their own tests from task-statements.json
 *   track    kind "skill-track" → modules as domains, lessons as topics,
 *            knowledgeCheck questions as each lesson's test
 * See README.md for the content contract.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { micromark } from 'micromark';
import { gfm, gfmHtml } from 'micromark-extension-gfm';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : d; };
const CONTENT = arg('--content', '../ajch_skillup');
const OUT = arg('--out', 'dist/skillup-site');
const INLINE = process.argv.includes('--inline');
const ONLY = arg('--exam', '')?.split(',').filter(Boolean);
const BASE = arg('--base', '');
const EMBED = process.argv.includes('--embed');
const ASSET_BASE = arg('--asset-base', '');
if (ASSET_BASE && !/^\/[\w\-/]*\/$/.test(ASSET_BASE)) throw new Error('--asset-base must look like /path/');
if (BASE && !/^\/[\w\-/]*\/$/.test(BASE)) throw new Error('--base must look like /path/');

const rd = p => readFileSync(join(CONTENT, p), 'utf-8');
const tryJSON = p => { try { return JSON.parse(rd(p)); } catch { return null; } };
const catalog = JSON.parse(rd('content/skillup/catalog.json'));

// Learner-facing short name when the content has no shortTitle (keeps navigation scannable).
function shorten(t) {
  let s = t.replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/^(Describe|Identify|Implement|Create|Build|Design|Configure|Manage|Explain|Understand|Use|Apply|Plan|Evaluate|Choose|Select|Deploy|Develop|Integrate|Monitor|Prepare|Define|Recognize|Determine|Analyze|Perform)\s+(considerations for|features of|scenarios for|appropriate|an appropriate|common|how|the|a|an)?\s*/i, '')
    .split(/,\s*including|\s+including|\s+by using|\s+using|\s+in an AI solution|;|:\s/i)[0].trim();
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return s.length > 42 ? s.slice(0, 40).replace(/\s+\S*$/, '') + '…' : s;
}
const words = s => s.replace(/<[^>]+>|```[\s\S]*?```/g, ' ').split(/\s+/).filter(Boolean).length;
const SEC = { 'key concept': 'key', 'real use': 'use', 'how it works': 'how', 'choose when': 'choose', 'how to do it': 'do', 'exam trap': 'trap', 'go deeper': 'more' };

function buildEntry(entry) {
  const id = entry.id, base = `content/skillup/${id}`;
  const images = new Set();
  const fix = md => md.replace(/\/?content\/skillup\/([^/]+)\/images\/([^)"'\s]+)/g, (_, ex, f) => { if (ex === id) images.add(f); return `${id}/images/${f}`; })
                      .replace(/\]\((?:\.\.\/)?images\/([^)\s]+)\)/g, (_, f) => { images.add(f); return `](${id}/images/${f})`; });
  const html = md => micromark(fix(md), { allowDangerousHtml: true, extensions: [gfm()], htmlExtensions: [gfmHtml()] });
  const idx = tryJSON(`${base}/index.json`) || entry;
  const kind = idx.kind || 'exam';
  const qFiles = kind === 'skill-track' ? (idx.practiceBank?.questionFiles || []) : (idx.questionFiles || []);
  const bank = qFiles.flatMap(f => tryJSON(f) || []);
  const qs = {};
  const addQ = (q, extra = {}) => { qs[q.id] = { id: q.id, s: q.scenario || '', q: q.question || q.stem, o: (q.options || []).map(o => String(o).replace(/^[A-D]:\s*/, '')), c: q.correct, e: q.explanation || '', d: q.difficulty || 'medium', dom: q.domain, ...extra }; };
  bank.forEach(q => addQ(q));
  const topics = {}, domainPages = {}, domains = [];
  let mode = 'classic', asOf = '';

  if (kind === 'skill-track') {
    mode = 'track';
    (idx.modules || []).forEach((m, mi) => {
      const tids = [];
      for (const l of m.lessons || []) {
        const md = l.notesFile && existsSync(join(CONTENT, l.notesFile)) ? rd(l.notesFile) : '';
        const kc = (l.knowledgeCheck || []).map((q, i) => { const qid = q.id || `${l.id}-k${i + 1}`; addQ({ ...q, id: qid, domain: mi + 1 }); return qid; });
        topics[l.id] = { id: l.id, title: l.title, short: l.shortTitle || shorten(l.title), domain: mi + 1, objectives: l.objectives || [], classicHtml: html(md.replace(/^# .*\n/, '')), toc: [...md.matchAll(/^## (.+)$/mg)].map(x => x[1].trim()), qids: kc, mins: Math.max(2, Math.round(words(md) / 200)), lab: l.holLabId || '' };
        tids.push(l.id);
      }
      domains.push({ id: mi + 1, title: m.title, weight: '', tasks: tids });
    });
  } else {
    const ts = tryJSON(idx.taskStatementsFile || `${base}/task-statements.json`) || { domains: [] };
    const qById = Object.fromEntries(bank.map(q => [q.id, q]));
    const notes = {};
    for (const d of idx.domains || []) notes[d.id] = d.notesFile && existsSync(join(CONTENT, d.notesFile)) ? rd(d.notesFile) : '';
    const allTaskIds = ts.domains.flatMap(d => d.tasks.map(t => t.id));
    const keyed = new Set(Object.values(notes).flatMap(md => [...md.matchAll(/^## (\d+\.\d+) /mg)].map(m => m[1])));
    const coverage = allTaskIds.length ? allTaskIds.filter(t => keyed.has(t)).length / allTaskIds.length : 0;
    // lessons mode needs the task-keyed standard itself, not just numbered headings that
    // happen to look like task ids: most task sections must carry Real use + Choose when.
    const sections = Object.values(notes).flatMap(md => md.split(/^## (?=\d+\.\d+ )/m).slice(1));
    const shaped = sections.filter(s => /^### Real use/m.test(s) && /^### Choose when/m.test(s)).length;
    mode = coverage >= 0.8 && shaped >= 0.8 * allTaskIds.length ? 'lessons' : 'classic';
    for (const d of idx.domains || []) {
      const md = notes[d.id];
      asOf = asOf || (md.match(/Skills measured as of\*\*:?\s*([^·\n]+)/i) || [])[1]?.trim() || '';
      const page = { overview: '', deep: '', deepTitle: '', cheat: '', classicHtml: '', toc: [] };
      if (mode === 'classic') {
        page.classicHtml = html(md.replace(/^# .*\n/, ''));
        page.toc = [...md.matchAll(/^## (.+)$/mg)].map(x => x[1].trim());
        page.mins = Math.max(2, Math.round(words(md) / 200));
      } else {
        for (const p of md.split(/^## /m).slice(1)) {
          const nl = p.indexOf('\n'), head = p.slice(0, nl).trim(), body = p.slice(nl + 1).replace(/\n---\s*$/, '');
          const m = head.match(/^(\d+\.\d+)\s+(.+)$/);
          if (m) {
            const t = { id: m[1], title: m[2], domain: d.id, secs: [] };
            for (const s of body.split(/^### /m).slice(1)) {
              const i = s.indexOf('\n'), h = s.slice(0, i).replace(/[⚠️📋]/gu, '').trim().toLowerCase(), smd = s.slice(i + 1).trim(), k = SEC[h];
              if (!k) continue;
              if (k === 'key') {
                t.claim = (smd.match(/^\*\*(.+?)\*\*\s*$/m) || [])[1] || '';
                t.figs = [...smd.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)].map(x => ({ alt: x[1], src: fix(x[2]) }));
                t.keyHtml = html(smd.replace(/^\*\*(.+?)\*\*\s*$/m, '').replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim());
              } else t.secs.push({ k, html: html(smd) });
            }
            t.mins = Math.max(2, Math.round(words(body) / 200));
            topics[t.id] = t;
          } else if (/^overview/i.test(head)) page.overview = html(body);
          else if (/^deep dive/i.test(head)) { page.deepTitle = head.replace(/^Deep Dive:?\s*/i, ''); page.deep = html(body); }
          else if (/^cheat sheet/i.test(head)) page.cheat = html(body);
        }
      }
      domainPages[d.id] = page;
    }
    for (const d of ts.domains) {
      const reg = (idx.domains || []).find(x => x.id === d.id) || {};
      domains.push({ id: d.id, title: reg.title || d.title, weight: d.officialWeight || (reg.weight ? `${reg.weight}%` : ''), tasks: d.tasks.map(t => t.id) });
      for (const t of d.tasks) {
        const tp = topics[t.id] || (topics[t.id] = { id: t.id, title: t.title, domain: d.id, secs: [], classic: mode === 'classic' });
        tp.title = t.title || tp.title;
        tp.short = t.shortTitle || shorten(tp.title);
        tp.qids = (t.questionIds || []).filter(q => qById[q]);
        tp.mins = tp.mins || 0;
      }
    }
  }
  const cases = (idx.scenarioFiles || []).map(f => tryJSON(f)).filter(Boolean).map(s => ({ id: s.id, title: s.title, desc: s.description, mins: s.estimatedMinutes, bg: s.scenario?.background, chars: s.scenario?.characters || [], taskIds: s.taskIds || [],
    qs: (s.questions || []).map(q => ({ id: q.id, s: '', q: q.stem || q.question, o: (q.options || []).map(o => String(o).replace(/^[A-D]:\s*/, '')), c: q.correct, e: q.explanation || '', d: s.difficulty })) }));
  const ts2 = tryJSON(idx.taskStatementsFile || `${base}/task-statements.json`);
  const meta = {
    examId: id, kind, mode, code: idx.examCode || idx.shortTitle || id.toUpperCase(), title: idx.title, short: idx.shortTitle, provider: idx.provider || '', level: idx.contentLevel || '',
    description: idx.description || '', version: idx.contentVersion || '', updated: idx.contentUpdatedAt || '', asOf, duration: idx.duration || '', pass: idx.passScore || '',
    passThreshold: idx.passThreshold || 70, questions: Object.keys(qs).length, studyGuide: ts2?.sourceUrl || (idx.resources || [])[0]?.url || '',
    changelog: (idx.changelog || []).slice(-4).reverse(), palette: idx.palette || null
  };
  return { data: { meta, domains, topics, domainPages, qs, cases }, images };
}

// JSON is valid JS; escape "<" (no "</script>" breakout) and the two line separators JS strings reject in old engines.
const LS = new RegExp(String.fromCharCode(0x2028), 'g'), PS = new RegExp(String.fromCharCode(0x2029), 'g');
const BS = String.fromCharCode(92); // literal backslash: emit the 6-char escape, not the character itself
const jsSafe = s => s.replace(/</g, BS + 'u003c').replace(LS, BS + 'u2028').replace(PS, BS + 'u2029');
const entries = catalog.exams.filter(e => !e.deprecatedAt && e.available !== false && (!ONLY?.length || ONLY.includes(e.id)));
mkdirSync(OUT, { recursive: true });
const blocks = [], list = [];
for (const e of entries) {
  const { data, images } = buildEntry(e);
  let json = JSON.stringify(data);
  for (const f of images) {
    const src = join(CONTENT, 'content', 'skillup', e.id, 'images', f);
    if (!existsSync(src)) continue;
    if (INLINE) json = json.split(`${e.id}/images/${f}`).join(`data:image/${f.endsWith('.svg') ? 'svg+xml' : f.split('.').pop()};base64,` + readFileSync(src).toString('base64'));
    else {
      mkdirSync(join(OUT, e.id, 'images'), { recursive: true }); copyFileSync(src, join(OUT, e.id, 'images', f));
      if (ASSET_BASE) json = json.split(`${e.id}/images/${f}`).join(`${ASSET_BASE}${e.id}/images/${f}`);
    }
  }
  // Data is embedded as script values, never JSON text read back out of the DOM.
  blocks.push(`<script>SKILLUP.exams[${JSON.stringify(e.id)}]=${jsSafe(json)};</script>`);
  const m = data.meta;
  list.push({ id: e.id, code: m.code, title: m.title, provider: m.provider, level: m.level, kind: m.kind, mode: m.mode, version: m.version, updated: m.updated, description: m.description,
    topics: Object.keys(data.topics).length, questions: m.questions, cases: data.cases.length, diagrams: images.size });
  console.log(`  ${e.id.padEnd(17)} ${m.mode.padEnd(8)} v${m.version.padEnd(7)} ${String(Object.keys(data.topics).length).padStart(3)} topics ${String(m.questions).padStart(4)} q ${String(data.cases.length).padStart(2)} cases ${String(images.size).padStart(3)} img`);
}
const style = readFileSync(join(HERE, 'styles.css'), 'utf-8');
const app = readFileSync(join(HERE, 'app.js'), 'utf-8');
const catalogJs = `var SKILLUP={exams:{},catalog:${jsSafe(JSON.stringify({ built: new Date().toISOString().slice(0, 10), exams: list }))}};`;

if (EMBED) {
  // React host mode: the AaryaAI layout supplies header, menu, footer and fonts.
  const data = catalogJs + '\n' + blocks.map(b => b.replace(/^<script>|<\/script>$/g, '')).join('\n');
  writeFileSync(join(OUT, 'skillup-data.js'), data);
  writeFileSync(join(OUT, 'skillup-app.js'), app);
  const css = scopeCss(style, '.skillup-host') + '\n' + readFileSync(join(HERE, 'aaryaai-theme.css'), 'utf-8');
  writeFileSync(join(OUT, 'skillup.css'), css);
  console.log(`✓ ${entries.length} entries → ${OUT}/skillup-{data,app}.js + skillup.css (${(data.length / 1048576).toFixed(1)} MB data)`);
} else {
  const page = `${BASE ? `<base href="${BASE}">\n` : ''}<title>SkillUp</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=Barlow+Condensed:wght@500;600;700&display=swap" rel="stylesheet">
<style>${style}</style>
<div id="skillup-standalone"></div>
<script>${catalogJs}</script>
${blocks.join('\n')}
<script>${app}</script>
`;
  writeFileSync(join(OUT, 'index.html'), page);
  console.log(`✓ ${entries.length} entries → ${join(OUT, 'index.html')} (${(page.length / 1048576).toFixed(1)} MB${INLINE ? ', diagrams inlined' : ''})`);
}

/**
 * Scope a stylesheet to one container for embedding: every selector is prefixed with `scope`,
 * :root/body/html rules map onto the scope (or are dropped when page-level), colour-scheme
 * switching and view-transition rules are dropped (the host site owns theme and page chrome).
 */
function scopeCss(css, scope) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const out = [];
  const pre = sel => sel.split(',').map(x => x.trim()).filter(Boolean).map(x => {
    if (/^(:root|html|body)$/.test(x)) return scope;
    if (/^\*$/.test(x)) return `${scope} *,${scope}`;
    if (/^(body::before|html)\b/.test(x) || /view-transition/.test(x) || /\[data-theme/.test(x)) return null;
    return `${scope} ${x}`;
  }).filter(Boolean).join(',');
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf('{', i); if (open < 0) break;
    const head = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === '{') depth++; else if (css[j] === '}') depth--; j++; }
    const body = css.slice(open + 1, j - 1);
    i = j;
    if (/^@keyframes/.test(head)) { out.push(`${head}{${body}}`); continue; }
    if (/^@media[^{]*prefers-color-scheme/.test(head)) continue;
    if (/^@media/.test(head)) { const inner = scopeCss(body, scope); if (inner.trim()) out.push(`${head}{${inner}}`); continue; }
    if (/^@/.test(head)) continue;
    const sel = pre(head);
    if (sel) out.push(`${sel}{${body}}`);
  }
  return out.join('\n');
}
