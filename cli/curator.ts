/**
 * Content Curator CLI — Maintenance utilities for the CCA-F study app.
 * 
 * Commands:
 *   stats     — Show content statistics per domain
 *   validate  — Validate all content files for schema compliance
 *   ids       — Show next available question IDs per domain
 *   dupes     — Check for duplicate questions (by similarity)
 *   coverage  — Show topic coverage gaps
 */

import fs from 'node:fs';
import path from 'node:path';

const CONTENT_DIR = path.resolve(import.meta.dirname, '..', 'public', 'content');
const QUESTIONS_DIR = path.join(CONTENT_DIR, 'questions');
const NOTES_DIR = path.join(CONTENT_DIR, 'notes');

interface Question {
  domain: number;
  id: string;
  scenario: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  tags: string[];
}

// --- Loaders ---

function loadAllQuestions(): Question[] {
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  const questions: Question[] = [];
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, file), 'utf-8'));
    questions.push(...data);
  }
  return questions;
}

function loadNotes(): { domain: number; file: string; lines: number; bytes: number }[] {
  const files = fs.readdirSync(NOTES_DIR).filter(f => f.endsWith('.md'));
  return files.map(f => {
    const content = fs.readFileSync(path.join(NOTES_DIR, f), 'utf-8');
    const domainMatch = f.match(/d(\d)/);
    return {
      domain: domainMatch ? parseInt(domainMatch[1]) : 0,
      file: f,
      lines: content.split('\n').length,
      bytes: Buffer.byteLength(content),
    };
  });
}

// --- Commands ---

function cmdStats() {
  const questions = loadAllQuestions();
  const notes = loadNotes();

  console.log('\n📊 CCA-F Content Statistics\n');
  console.log('─'.repeat(60));
  
  const domains = [1, 2, 3, 4, 5];
  const domainNames: Record<number, string> = {
    1: 'Agentic Architecture',
    2: 'Claude Code Config',
    3: 'Prompt Engineering',
    4: 'Tool Design & MCP',
    5: 'Context Management',
  };

  console.log(`${'Domain'.padEnd(30)} ${'Questions'.padEnd(12)} ${'Notes (lines)'.padEnd(15)} Tags`);
  console.log('─'.repeat(60));

  for (const d of domains) {
    const qs = questions.filter(q => q.domain === d);
    const note = notes.find(n => n.domain === d);
    const allTags = new Set(qs.flatMap(q => q.tags));
    console.log(
      `D${d}: ${domainNames[d].padEnd(26)} ${String(qs.length).padEnd(12)} ${String(note?.lines ?? 0).padEnd(15)} ${allTags.size}`
    );
  }

  console.log('─'.repeat(60));
  console.log(`Total: ${questions.length} questions, ${notes.reduce((s, n) => s + n.lines, 0)} lines of notes`);
  console.log();
}

function cmdValidate() {
  const questions = loadAllQuestions();
  let errors = 0;

  console.log('\n🔍 Validating content...\n');

  for (const q of questions) {
    const issues: string[] = [];

    // Schema checks
    if (q.domain < 1 || q.domain > 5) issues.push(`invalid domain: ${q.domain}`);
    if (!q.id.match(/^d\d-\d{3}$/)) issues.push(`invalid id format: ${q.id}`);
    if (q.options.length !== 4) issues.push(`expected 4 options, got ${q.options.length}`);
    if (q.correct < 0 || q.correct > 3) issues.push(`invalid correct index: ${q.correct}`);
    if (!q.tags || q.tags.length < 1) issues.push('missing tags');
    if (q.scenario.length < 20) issues.push('scenario too short');
    if (q.explanation.length < 50) issues.push('explanation too short');

    // Quality checks
    const optLengths = q.options.map(o => o.length);
    const maxLen = Math.max(...optLengths);
    const minLen = Math.min(...optLengths);
    if (maxLen > minLen * 3) issues.push('option length imbalance (longest > 3x shortest)');

    if (issues.length > 0) {
      console.log(`  ❌ ${q.id}: ${issues.join('; ')}`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log('  ✅ All questions pass validation!');
  } else {
    console.log(`\n  ${errors} question(s) with issues.`);
  }
  console.log();
}

function cmdIds() {
  const questions = loadAllQuestions();

  console.log('\n🔢 Next Available Question IDs\n');

  for (const d of [1, 2, 3, 4, 5]) {
    const domainQs = questions.filter(q => q.domain === d);
    const maxNum = domainQs.reduce((max, q) => {
      const num = parseInt(q.id.split('-')[1]);
      return num > max ? num : max;
    }, 0);
    console.log(`  Domain ${d}: next ID = d${d}-${String(maxNum + 1).padStart(3, '0')}`);
  }
  console.log();
}

function cmdDupes() {
  const questions = loadAllQuestions();

  console.log('\n🔄 Checking for similar questions...\n');

  const found: string[] = [];

  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const sim = jaccardSimilarity(
        tokenize(questions[i].question + ' ' + questions[i].scenario),
        tokenize(questions[j].question + ' ' + questions[j].scenario)
      );
      if (sim > 0.6) {
        found.push(`  ⚠️  ${questions[i].id} ↔ ${questions[j].id} (similarity: ${(sim * 100).toFixed(0)}%)`);
      }
    }
  }

  if (found.length === 0) {
    console.log('  ✅ No duplicate questions detected.');
  } else {
    found.forEach(f => console.log(f));
  }
  console.log();
}

function cmdCoverage() {
  const questions = loadAllQuestions();

  console.log('\n📋 Topic Coverage Analysis\n');

  const expectedTopics: Record<number, string[]> = {
    1: ['hooks', 'PreToolUse', 'PostToolUse', 'stop-hook', 'coordinator-subagent', 'agentic-loop', 'parallel-execution', 'HITL', 'error-propagation', 'checkpointing'],
    2: ['CLAUDE-md', 'scoped-rules', 'skills-vs-tools', 'MCP-config', 'headless-mode', 'slash-commands', 'permissions', 'yaml-frontmatter'],
    3: ['system-prompt', 'XML-tags', 'few-shot', 'extended-thinking', 'structured-output', 'validation-retry', 'prompt-injection', 'JSON-schema'],
    4: ['tool-description', '18-tool-limit', 'tool-choice', 'parallel-tools', 'graceful-failure', 'MCP-primitives', 'FastMCP'],
    5: ['context-window', 'lost-in-middle', 'prompt-caching', 'batches-API', 'rate-limiting', 'summarization', 'escalation'],
  };

  for (const [domain, topics] of Object.entries(expectedTopics)) {
    const domainQs = questions.filter(q => q.domain === parseInt(domain));
    const coveredTags = new Set(domainQs.flatMap(q => q.tags));
    
    const covered = topics.filter(t => coveredTags.has(t));
    const missing = topics.filter(t => !coveredTags.has(t));

    console.log(`  Domain ${domain}: ${covered.length}/${topics.length} topics covered`);
    if (missing.length > 0) {
      console.log(`    Missing: ${missing.join(', ')}`);
    }
  }
  console.log();
}

// --- Utilities ---

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  const intersection = new Set([...a].filter(x => b.has(x)));
  const union = new Set([...a, ...b]);
  return intersection.size / union.size;
}

// --- Main ---

const command = process.argv[2] || 'stats';

switch (command) {
  case 'stats': cmdStats(); break;
  case 'validate': cmdValidate(); break;
  case 'ids': cmdIds(); break;
  case 'dupes': cmdDupes(); break;
  case 'coverage': cmdCoverage(); break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log('Available: stats, validate, ids, dupes, coverage');
    process.exit(1);
}
