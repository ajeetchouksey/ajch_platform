import { readFileSync } from 'fs';
const files = [
  'public/content/skillup/ab731/notes/d1-business-value.md',
  'public/content/skillup/ab731/notes/d2-microsoft-ai-services.md',
  'public/content/skillup/ab731/notes/d3-adoption-strategy.md',
];
const RE = /```mermaid\r?\n([\s\S]*?)```/g;
let issues = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const blocks = [...src.matchAll(RE)];
  console.log(`\n${f.split('/').pop()} — ${blocks.length} mermaid block(s)`);
  for (const [, body] of blocks) {
    const first = body.trim().split('\n')[0];
    const valid = /^(graph|flowchart|mindmap|sequenceDiagram|classDiagram|gitGraph)/.test(first);
    if (!valid) { console.log('  ✗ Unknown type:', first); issues++; }
    if (body.includes('%%')) { console.log('  ✗ Contains %% comment (parse risk)'); issues++; }
    console.log(`  ${valid ? '✓' : '✗'} ${first.slice(0, 70)}`);
  }
}
console.log(issues === 0 ? '\nDIAGRAM GATE: PASS ✅' : `\nDIAGRAM GATE: ${issues} issue(s) ✗`);
process.exit(issues > 0 ? 1 : 0);
