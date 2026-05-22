import { select } from '@inquirer/prompts';
import { runQuiz } from './quiz.js';

async function main() {
  console.clear();
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║     CCA-F Study App  — CLI Mode      ║');
  console.log('╚══════════════════════════════════════╝\n');

  const action = await select({
    message: 'What would you like to do?',
    choices: [
      { name: '🧠  Practice Quiz — all domains', value: 'quiz-all' },
      { name: 'D1  Quiz — Agentic Architecture (27%)', value: 'quiz-1' },
      { name: 'D2  Quiz — Claude Code Config (20%)', value: 'quiz-2' },
      { name: 'D3  Quiz — Prompt Engineering (20%)', value: 'quiz-3' },
      { name: 'D4  Quiz — Tool Design & MCP (18%)', value: 'quiz-4' },
      { name: 'D5  Quiz — Context Management (15%)', value: 'quiz-5' },
      { name: '✗   Exit', value: 'exit' },
    ],
  });

  if (action === 'exit') {
    console.log('\nGood luck on the exam!\n');
    process.exit(0);
  }

  const domainFilter = action === 'quiz-all' ? null : Number(action.split('-')[1]);
  await runQuiz(domainFilter);
}

main().catch(console.error);
