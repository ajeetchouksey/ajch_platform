import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { select, confirm } from '@inquirer/prompts';
import type { Question } from '../src/types/content.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const contentDir = join(__dirname, '..', 'public', 'content', 'questions');

const DOMAIN_FILES: Record<number, string> = {
  1: 'domain1-agentic.json',
  2: 'domain2-claude-code.json',
  3: 'domain3-prompt-eng.json',
  4: 'domain4-tool-design.json',
  5: 'domain5-context-mgmt.json',
};

const DOMAIN_NAMES: Record<number, string> = {
  1: 'Agentic Architecture & Orchestration',
  2: 'Claude Code Configuration & Workflows',
  3: 'Prompt Engineering & Structured Output',
  4: 'Tool Design & MCP Integration',
  5: 'Context Management & Reliability',
};

function loadQuestions(domainFilter: number | null): Question[] {
  const files = domainFilter ? [DOMAIN_FILES[domainFilter]] : Object.values(DOMAIN_FILES);
  const all: Question[] = [];
  for (const file of files) {
    const raw = readFileSync(join(contentDir, file), 'utf-8');
    all.push(...(JSON.parse(raw) as Question[]));
  }
  return shuffle(all);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function green(s: string) { return `\x1b[32m${s}\x1b[0m`; }
function red(s: string) { return `\x1b[31m${s}\x1b[0m`; }
function bold(s: string) { return `\x1b[1m${s}\x1b[0m`; }
function dim(s: string) { return `\x1b[2m${s}\x1b[0m`; }
function cyan(s: string) { return `\x1b[36m${s}\x1b[0m`; }

export async function runQuiz(domainFilter: number | null): Promise<void> {
  const questions = loadQuestions(domainFilter);
  const label = domainFilter ? `D${domainFilter}: ${DOMAIN_NAMES[domainFilter]}` : 'All Domains';
  console.log(`\n${bold(`Starting quiz: ${label}`)}`);
  console.log(dim(`${questions.length} questions loaded\n`));

  let correct = 0;
  const wrong: Array<{ q: Question; chosen: number }> = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n${bold(`Q${i + 1}/${questions.length}`)}  ${dim(`[D${q.domain}] ${q.tags.join(', ')}`)}`);

    if (q.scenario) {
      console.log(dim(`\nScenario: ${q.scenario}`));
    }

    console.log(`\n${bold(q.question)}\n`);

    const answer = await select({
      message: 'Your answer:',
      choices: q.options.map((opt, idx) => ({
        name: `${String.fromCharCode(65 + idx)}. ${opt}`,
        value: idx,
      })),
    });

    if (answer === q.correct) {
      console.log(green(`\n✓ Correct!`));
      correct++;
    } else {
      console.log(red(`\n✗ Incorrect`));
      console.log(`  ${green(`Correct: ${String.fromCharCode(65 + q.correct)}. ${q.options[q.correct]}`)}`);
      console.log(`  ${red(`Your answer: ${String.fromCharCode(65 + answer)}. ${q.options[answer]}`)}`);
      wrong.push({ q, chosen: answer });
    }

    console.log(dim(`\nExplanation: ${q.explanation}`));

    if (i < questions.length - 1) {
      await confirm({ message: 'Continue to next question?', default: true });
    }
  }

  // Final results
  const pct = Math.round((correct / questions.length) * 100);
  const passed = pct >= 72;

  console.log('\n' + '═'.repeat(50));
  console.log(bold(`\nSession Complete`));
  console.log(`Score: ${passed ? green(`${pct}%`) : red(`${pct}%`)} (${correct}/${questions.length} correct)`);
  console.log(passed ? green(`✓ Above 72% pass threshold`) : red(`✗ Below 72% pass threshold`));

  if (wrong.length > 0) {
    console.log(`\n${bold(cyan('Questions to Review:'))}`);
    for (const { q } of wrong) {
      console.log(`  • ${q.id}: ${q.question.slice(0, 70)}…`);
      console.log(`    ${dim('Tags: ' + q.tags.join(', '))}`);
    }
  }

  console.log('\n' + '═'.repeat(50) + '\n');
}
