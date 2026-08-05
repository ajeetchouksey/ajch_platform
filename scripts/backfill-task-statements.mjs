#!/usr/bin/env node
/**
 * backfill-task-statements.mjs
 * Assigns unmapped questions to task-statements.json for all SkillUp exams.
 *
 * Usage: node scripts/backfill-task-statements.mjs [--dry-run] [--exam <id>]
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const SKILLUP = join(ROOT, 'public', 'content', 'skillup');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FILTER = (() => { const i = args.indexOf('--exam'); return i !== -1 ? args[i+1] : null; })();

function readJson(p) { return JSON.parse(readFileSync(p, 'utf8')); }
function writeJson(p, data) {
  if (DRY_RUN) { console.log(`  [dry-run] would write ${p}`); return; }
  writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
function absContent(rel) {
  if (rel.startsWith('content/')) return join(ROOT, 'public', rel);
  return join(ROOT, rel);
}

// ── Tag keyword → task-id routing helpers ─────────────────────────────────────

/** Returns true if any of the tag values include any of the keywords (case-insensitive) */
function tagsMatch(tags, keywords) {
  return keywords.some(kw => tags.some(t => t.toLowerCase().includes(kw.toLowerCase())));
}

// ── GH-300: 1 task per domain, trivial mapping ───────────────────────────────

function routeGH300(q) {
  const domainToTask = { 1: '1.1', 2: '2.1', 3: '3.1', 4: '4.1' };
  return domainToTask[q.domain] ?? null;
}

// ── GH-BP: 2 tasks per domain, tag-based routing ─────────────────────────────

function routeGHBP(q) {
  const tags = (q.tags || []).map(t => t.toLowerCase());
  if (q.domain === 1) {
    // 1.1 = branch protection + rulesets  |  1.2 = branching strategies
    const is11 = tagsMatch(tags, ['branch-protection','ruleset','codeowner','force-push','lock-branch',
      'required-review','break-glass','signed-commit','conversation-resolution','emergency-bypass',
      'tag-protection','required-deployment']);
    return is11 ? '1.1' : '1.2';
  }
  if (q.domain === 2) {
    // 2.1 = security  |  2.2 = CD / automation / performance
    const is21 = tagsMatch(tags, ['security','supply-chain','oidc','permissions','dependabot',
      'codeql','secret','self-hosted','pull_request_target','least-privilege','token','fork']);
    return is21 ? '2.1' : '2.2';
  }
  if (q.domain === 3) {
    // 3.1 = repo security features  |  3.2 = governance / structure
    const is31 = tagsMatch(tags, ['security','secret-scanning','push-protection','history-rewrite',
      'git-filter','dependabot','oidc','signed-commit','webhook','sarif','code-scanning',
      'deploy-key','audit-log','incident-response','vulnerability','cve','github-apps',
      'organization-polic','least-privilege','responsible-disclosure','federated-identity',
      'github-packages','ghes']);
    return is31 ? '3.1' : '3.2';
  }
  return null;
}

// ── CCA-F: domain number cross-mapping + tag-based sub-task routing ───────────
// Question domain numbers in question files follow index.json order:
//   Q d1 = Index D1 Agentic         → task domain 1
//   Q d2 = Index D2 Claude Code     → task domain 3
//   Q d3 = Index D3 Prompt Eng      → task domain 4
//   Q d4 = Index D4 Tool Design     → task domain 2
//   Q d5 = Index D5 Context Mgmt    → task domain 5

const CCAF_TASK_KEYWORDS = {
  // Domain 1 — Agentic
  '1.1': ['agentic-loop','task-execution','autonomous','executor','orchestrat'],
  '1.2': ['multi-agent','coordinator','subagent','spawn','orchestrat','parallel'],
  '1.3': ['subagent-invocation','context-passing','spawning','invoke','handoff'],
  '1.4': ['multi-step','workflow','enforcement','handoff','sequential'],
  '1.5': ['hook','intercept','pre-tool','post-tool','normalisation','normalize'],
  '1.6': ['task-decomposition','decompose','planning','subtask'],
  '1.7': ['session','resume','fork','state','checkpoint'],
  // Domain 2 — Tool Design (Q d4-*)
  '2.1': ['tool-description','tool-interface','boundary','function-signature'],
  '2.2': ['error-response','mcp-error','structured-error','graceful-failure'],
  '2.3': ['tool-choice','distribute','18-tool','tool-limit','tool_choice'],
  '2.4': ['mcp-server','mcp-config','fastmcp','integration','claude-code'],
  '2.5': ['read-tool','write-tool','edit-tool','bash-tool','grep-tool','glob-tool','built-in'],
  // Domain 3 — Claude Code (Q d2-*)
  '3.1': ['claude.md','hierarchy','scoped-rule','modular','global-rule'],
  '3.2': ['slash-command','custom-command','skill','workflow-command'],
  '3.3': ['path-specific','path-glob','conditional','convention-loading'],
  '3.4': ['plan-mode','direct-execution','plan vs'],
  '3.5': ['iterative','refinement','progressive','improvement-loop'],
  '3.6': ['ci/cd','pipeline','continuous-integration','automation','github-actions'],
  // Domain 4 — Prompt Engineering (Q d3-*)
  '4.1': ['explicit-criteria','precision','false-positive','reduce-ambig'],
  '4.2': ['few-shot','consistency','example','in-context'],
  '4.3': ['structured-output','json-schema','tool-use','enforce-output'],
  '4.4': ['validation','retry','feedback-loop','extraction-quality'],
  '4.5': ['batch','batch-processing','throughput','batch-api'],
  '4.6': ['multi-instance','multi-pass','review-architecture','review-loop'],
  // Domain 5 — Context Management (Q d5-*)
  '5.1': ['conversation-context','context-window','critical-information','long-interaction'],
  '5.2': ['escalation','ambiguity','clarification','uncertainty-resolution'],
  '5.3': ['error-propagation','multi-agent-error','fault-tolerance'],
  '5.4': ['codebase','large-codebase','repository-exploration','context-exploration'],
  '5.5': ['human-review','confidence','calibration','hitl','human-in-the-loop'],
  '5.6': ['provenance','multi-source','synthesis','information-provenance'],
};

// Q domain → task domain cross-map
const CCAF_DOMAIN_REMAP = { 1: 1, 2: 3, 3: 4, 4: 2, 5: 5 };

function routeCCAF(q) {
  const taskDomain = CCAF_DOMAIN_REMAP[q.domain];
  if (!taskDomain) return null;
  const tags = (q.tags || []).map(t => t.toLowerCase());
  const qText = (q.question || '').toLowerCase();
  const taskIds = Object.keys(CCAF_TASK_KEYWORDS).filter(tid => tid.startsWith(taskDomain + '.'));
  for (const tid of taskIds) {
    const kws = CCAF_TASK_KEYWORDS[tid];
    if (kws.some(kw => tags.some(t => t.includes(kw)) || qText.includes(kw))) return tid;
  }
  // Fallback: first task in the domain
  return `${taskDomain}.1`;
}

// ── AB-100: tag-based routing to correct tasks ────────────────────────────────

const AB100_TASK_KEYWORDS = {
  '1.1': ['requirements','use-case-selection','problem-statement','feasibility'],
  '1.2': ['strategy','roadmap','ai-strategy','framework','governance','coe','enterprise'],
  '1.3': ['cost-benefit','roi','tco','business-case','investment'],
  '2.1': ['agent-design','agentic','multi-agent','copilot-studio','declarative-agent',
          'copilot-sales','d365','m365-copilot','voice-mode','orchestration','a2a',
          'customer-service','finance','scm','teams','sharepoint','graph'],
  '2.2': ['extensibility','build-buy','extend','plugin','connector','skill','api'],
  '2.3': ['prebuilt','configure','orchestration','classic','generative','prompt-action'],
  '3.1': ['monitor','alert','evaluation','telemetry','rag-quality','groundedness',
          'performance','application-insights'],
  '3.2': ['test','golden-dataset','test-strategy','qa','ci/cd','mlops','canary',
          'deployment-gate'],
  '3.3': ['alm','lifecycle','infra-as-code','foundry-agents','rollback','decommission'],
  '4.1': ['responsible-ai','fairness','bias','transparency','accountability','governance',
          'explainability','eu-ai-act','gdpr','compliance','content-safety','security',
          'jailbreak','injection','privacy','audit','worm'],
};

function routeAB100(q) {
  const tags = (q.tags || []).map(t => t.toLowerCase());
  const qText = (q.question || '').toLowerCase();
  for (const [tid, kws] of Object.entries(AB100_TASK_KEYWORDS)) {
    if (kws.some(kw => tags.some(t => t.includes(kw)) || qText.includes(kw))) return tid;
  }
  // Fallback by domain
  const domainFallback = { 1: '1.1', 2: '2.1', 3: '3.1', 4: '4.1' };
  return domainFallback[q.domain] ?? '4.1';
}

// ── GHC: route overflow questions to existing tasks ───────────────────────────
// Domain → task pair map (each domain has 2 tasks in the task-statements)
const GHC_DOMAIN_TASKS = {
  1: ['d1-t1', 'd1-t2'],
  2: ['d2-t1', 'd2-t2', 'd2-t3', 'd2-t4'],
  3: ['d3-t1', 'd3-t2'],
  4: ['d4-t1', 'd4-t2'],
  5: ['d5-t1', 'd5-t2'],
  6: ['d6-t1', 'd6-t2'],
};
// T1 keywords for each domain — unmatched goes to T2
const GHC_T1_KEYWORDS = {
  3: ['data-handling','data-flow','pipeline','training-data','data-privacy','proxy','llm','model'],
  4: ['prompt','natural-language','clarity','context','instruction'],
  5: ['productivity','code-quality','completion','suggestion','inline'],
  6: ['privacy','content-exclusion','settings','policy','exclusion'],
};
function routeGHC(q) {
  const domain = q.domain;
  const tasks = GHC_DOMAIN_TASKS[domain];
  if (!tasks) return null;
  if (tasks.length === 2) {
    const tags = (q.tags || []).map(t => t.toLowerCase());
    const kws = GHC_T1_KEYWORDS[domain] || [];
    const isT1 = kws.some(kw => tags.some(t => t.includes(kw)));
    return isT1 ? tasks[0] : tasks[1];
  }
  // For D2 with 4 tasks: distribute by index
  const qNum = parseInt((q.id || '').replace(/[^\d]/g, '')) || 0;
  return tasks[qNum % tasks.length];
}

// ── AB-731: create task-statements.json from scratch ─────────────────────────

const AB731_TASK_STATEMENTS = {
  schemaVersion: '1.0',
  examCode: 'AB-731',
  domains: [
    {
      id: 1,
      tasks: [
        { id: '1.1', title: 'Identify and evaluate generative AI use cases', questionIds: [] },
        { id: '1.2', title: 'Assess risks, limitations, and responsible AI factors', questionIds: [] },
        { id: '1.3', title: 'Calculate ROI, costs, and business value', questionIds: [] },
        { id: '1.4', title: 'Apply grounding, RAG, and contextualisation techniques', questionIds: [] },
        { id: '1.5', title: 'Evaluate AI agents and agentic automation', questionIds: [] },
        { id: '1.6', title: 'Select AI models and address security considerations', questionIds: [] },
      ],
    },
    {
      id: 2,
      tasks: [
        { id: '2.1', title: 'Use Microsoft 365 Copilot features and experiences', questionIds: [] },
        { id: '2.2', title: 'Manage permissions, data access, and Microsoft Graph', questionIds: [] },
        { id: '2.3', title: 'Extend and build solutions with Copilot Studio and Azure AI', questionIds: [] },
        { id: '2.4', title: 'Optimise AI model costs, licensing, and selection', questionIds: [] },
        { id: '2.5', title: 'Map and automate business processes with AI', questionIds: [] },
      ],
    },
    {
      id: 3,
      tasks: [
        { id: '3.1', title: 'Apply Responsible AI principles and governance', questionIds: [] },
        { id: '3.2', title: 'Design AI governance structures and councils', questionIds: [] },
        { id: '3.3', title: 'Lead AI adoption, champions programme, and change management', questionIds: [] },
        { id: '3.4', title: 'Manage AI licensing and deployment economics', questionIds: [] },
        { id: '3.5', title: 'Address privacy, data protection, and compliance', questionIds: [] },
        { id: '3.6', title: 'Scale AI initiatives with governance frameworks', questionIds: [] },
      ],
    },
  ],
};

const AB731_TASK_KEYWORDS = {
  '1.1': ['gen-ai-vs-ml','classification','use-case-selection','predictive-ml'],
  '1.2': ['hallucination','bias','reliability','non-determinism','temperature','fabrication','security','privacy'],
  '1.3': ['roi','tco','cost','tokens','api-billing','cost-benefit'],
  '1.4': ['rag','grounding','fine-tune','knowledge-cutoff','knowledge-base'],
  '1.5': ['ai-agents','agentic','copilot-vs-agent','automation'],
  '1.6': ['model-selection','phi','latency','foundry-models','authentication','data-isolation'],
  '2.1': ['m365-copilot','copilot-teams','analyst-copilot','researcher-copilot','copilot-pages',
          'copilot-experiences','meeting-recap','m365-apps'],
  '2.2': ['microsoft-graph','permissions','sharepoint','data-access','microsoft-project','pre-deployment'],
  '2.3': ['copilot-studio','foundry-tools','azure-vision','azure-ai-search','no-code','semantic-search',
          'build-buy-extend','declarative-agent','extensibility'],
  '2.4': ['model-selection','cost-optimisation','phi','ptu','provisioned-throughput','licensing'],
  '2.5': ['process-mapping','automatable','augmentable','copilot-roi','business-process'],
  '3.1': ['responsible-ai','fairness','transparency','accountability','reliability','governance-policy',
          'ai-principles','risk','human-in-the-loop','hr-ai','governance-framework'],
  '3.2': ['ai-council','governance','cross-functional','deployment','governance-structure','policies-controls'],
  '3.3': ['adoption','champions-programme','change-management','peer-coaching','culture-change',
          'acceptable-use-policy','training'],
  '3.4': ['licensing','pay-as-you-go','pilot','copilot-licence','commitment-tiers','cost-optimisation'],
  '3.5': ['privacy','data-training','microsoft-commitments','employee-trust','gdpr','data-protection'],
  '3.6': ['scale-ai','ai-council','centre-of-excellence','champions','governance-structure','ai-prioritisation',
          'strategic-alignment','value-feasibility'],
};

function routeAB731(q) {
  const tags = (q.tags || []).map(t => t.toLowerCase());
  const qText = (q.question || '').toLowerCase();
  for (const [tid, kws] of Object.entries(AB731_TASK_KEYWORDS)) {
    if (kws.some(kw => tags.some(t => t.includes(kw)) || qText.includes(kw))) return tid;
  }
  const domainFallback = { 1: '1.1', 2: '2.1', 3: '3.1' };
  return domainFallback[q.domain] ?? '1.1';
}

// ── Per-exam backfill runners ─────────────────────────────────────────────────

function backfillExam(examId, routeFn, tsOverride = null) {
  const idxPath = join(SKILLUP, examId, 'index.json');
  const idx = readJson(idxPath);
  const tsPath = idx.taskStatementsFile
    ? absContent(idx.taskStatementsFile)
    : join(SKILLUP, examId, 'task-statements.json');

  let ts;
  if (tsOverride) {
    ts = tsOverride;
  } else if (existsSync(tsPath)) {
    ts = readJson(tsPath);
  } else {
    console.error(`  [skip] no task-statements.json found for ${examId}`);
    return;
  }

  // Build set of already-mapped IDs
  const alreadyMapped = new Set();
  ts.domains.forEach(d => d.tasks.forEach(t => t.questionIds.forEach(id => alreadyMapped.add(id))));

  // Build task lookup: taskId → task object
  const taskLookup = {};
  ts.domains.forEach(d => d.tasks.forEach(t => { taskLookup[t.id] = t; }));

  // Load all questions
  const allQ = [];
  (idx.questionFiles || []).forEach(f => {
    const p = absContent(f);
    if (!existsSync(p)) { console.warn(`  [warn] missing questionFile: ${f}`); return; }
    allQ.push(...readJson(p));
  });

  // Route unmapped questions
  let added = 0;
  allQ.forEach(q => {
    if (alreadyMapped.has(q.id)) return;
    const taskId = routeFn(q);
    if (!taskId) { console.warn(`  [warn] no route for ${q.id}`); return; }
    const task = taskLookup[taskId];
    if (!task) { console.warn(`  [warn] task ${taskId} not found in ${examId}`); return; }
    task.questionIds.push(q.id);
    added++;
  });

  writeJson(tsPath, ts);

  // Update index.json taskStatementsFile if missing
  if (!idx.taskStatementsFile) {
    idx.taskStatementsFile = `content/skillup/${examId}/task-statements.json`;
    writeJson(idxPath, idx);
  }

  const total = Object.values(taskLookup).reduce((s, t) => s + t.questionIds.length, 0);
  console.log(`  [${examId}] +${added} questions added → ${total} total mapped`);
  Object.values(taskLookup)
    .filter(t => t.questionIds.length === 0)
    .forEach(t => console.log(`    ⚠ task ${t.id} still empty`));
}

// ── Fix gh300/index.json questionFiles paths ──────────────────────────────────

function fixGH300Index() {
  const idxPath = join(SKILLUP, 'gh300', 'index.json');
  const idx = readJson(idxPath);
  idx.questionFiles = [
    'content/skillup/gh300/questions/gh300-domain1.json',
    'content/skillup/gh300/questions/gh300-domain2.json',
    'content/skillup/gh300/questions/gh300-domain3.json',
    'content/skillup/gh300/questions/gh300-domain4.json',
  ];
  // Recount
  let total = 0;
  idx.questionFiles.forEach(f => {
    const p = absContent(f);
    if (existsSync(p)) total += readJson(p).length;
  });
  idx.questions = total;
  idx.taskStatementsFile = 'content/skillup/gh300/task-statements.json';

  // Add notesFile to domains if missing
  idx.domains = idx.domains || [];
  const slugs = ['prompt-engineering','ai-model-data-pipeline','privacy-security','ide-integration'];
  idx.domains.forEach((d, i) => {
    if (!d.notesFile) d.notesFile = `content/skillup/gh300/notes/gh300-d${d.id}-${slugs[i]}.md`;
  });

  writeJson(idxPath, idx);
  console.log(`  [gh300] index.json fixed — ${total} questions, questionFiles + taskStatementsFile + notesFiles set`);
}

// ── Add GHC extra question files to index ─────────────────────────────────────

function fixGHCIndex() {
  const idxPath = join(SKILLUP, 'ghc', 'index.json');
  const idx = readJson(idxPath);
  const extraFiles = [
    'content/skillup/ghc/questions/ghc-domain3-gh300.json',
    'content/skillup/ghc/questions/ghc-domain4-gh300.json',
    'content/skillup/ghc/questions/ghc-domain5-gh300.json',
    'content/skillup/ghc/questions/ghc-domain6-gh300.json',
  ];
  const current = new Set(idx.questionFiles || []);
  let added = 0;
  extraFiles.forEach(f => {
    if (!current.has(f) && existsSync(absContent(f))) {
      idx.questionFiles.push(f);
      added++;
    }
  });
  // Recount
  let total = 0;
  idx.questionFiles.forEach(f => {
    const p = absContent(f);
    if (existsSync(p)) total += readJson(p).length;
  });
  idx.questions = total;
  writeJson(idxPath, idx);
  console.log(`  [ghc] +${added} question files added to index → ${total} total questions`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

const EXAMS = [
  { id: 'gh300',  fix: fixGH300Index, route: routeGH300 },
  { id: 'ghbp',  fix: null,          route: routeGHBP },
  { id: 'ab731', fix: null,          route: routeAB731, tsOverride: AB731_TASK_STATEMENTS },
  { id: 'ab100', fix: null,          route: routeAB100 },
  { id: 'ccaf',  fix: null,          route: routeCCAF },
  { id: 'ghc',   fix: fixGHCIndex,   route: routeGHC },  // index fix + map overflow
];

console.log(`\nSkillUp Task-Statements Backfill${DRY_RUN ? ' [DRY RUN]' : ''}\n${'─'.repeat(50)}`);

for (const exam of EXAMS) {
  if (FILTER && exam.id !== FILTER) continue;
  console.log(`\n${exam.id.toUpperCase()}`);
  if (exam.fix) exam.fix();
  if (exam.route) backfillExam(exam.id, exam.route, exam.tsOverride ?? null);
}

console.log('\n✓ Backfill complete. Run: node scripts/check-exam-completeness.mjs\n');
