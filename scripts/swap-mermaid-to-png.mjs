/**
 * Replaces mermaid code blocks in notes files with PNG image references.
 * Run AFTER render-diagrams.mjs has generated the PNGs.
 * Usage: node scripts/swap-mermaid-to-png.mjs --exam ab731
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLUP = join(ROOT, 'public/content/skillup');
const MERMAID_RE = /```mermaid\r?\n[\s\S]*?```/g;

const argIdx = process.argv.indexOf('--exam');
const examArg = argIdx !== -1 ? process.argv[argIdx + 1] : null;
const examIds = examArg
  ? [examArg]
  : readdirSync(SKILLUP, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);

let totalReplaced = 0;
let totalFiles = 0;

for (const examId of examIds) {
  const notesDir = join(SKILLUP, examId, 'notes');
  const imagesDir = join(SKILLUP, examId, 'images');
  if (!existsSync(notesDir) || !existsSync(imagesDir)) continue;

  for (const notesFile of readdirSync(notesDir).filter((f) => f.endsWith('.md'))) {
    const slug = notesFile.replace('.md', '');
    const filePath = join(notesDir, notesFile);
    let content = readFileSync(filePath, 'utf8');
    const matches = [...content.matchAll(MERMAID_RE)];
    if (matches.length === 0) continue;

    let replaced = 0;
    let newContent = content;
    for (let i = 0; i < matches.length; i++) {
      const imgName = `${slug}-${String(i + 1).padStart(2, '0')}.png`;
      const imgPath = join(imagesDir, imgName);
      if (!existsSync(imgPath)) {
        console.log(`  ✗ Missing ${imgName} — keeping mermaid block`);
        continue;
      }
      const webPath = `/content/skillup/${examId}/images/${imgName}`;
      newContent = newContent.replace(matches[i][0], `![Diagram ${i + 1}](${webPath})`);
      replaced++;
    }

    if (replaced > 0) {
      writeFileSync(filePath, newContent);
      totalFiles++;
      totalReplaced += replaced;
      console.log(`  ✓ ${notesFile}: ${replaced}/${matches.length} mermaid blocks replaced`);
    }
  }
}

console.log(`\nDone: ${totalReplaced} blocks replaced across ${totalFiles} file(s)`);
