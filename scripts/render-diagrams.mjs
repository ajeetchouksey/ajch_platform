/**
 * Renders mermaid code blocks in notes markdown files to PNG via mermaid.ink.
 * Usage: node scripts/render-diagrams.mjs [--exam <examId>]
 *        Omit --exam to process all exams.
 * Output: public/content/skillup/{examId}/images/{slug}-{N}.png
 *         Mermaid blocks in notes are replaced with absolute img references.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SKILLUP = join(ROOT, 'public/content/skillup');
const MERMAID_RE = /```mermaid\r?\n([\s\S]*?)```/g;

const argIdx = process.argv.indexOf('--exam');
const examArg = argIdx !== -1 ? process.argv[argIdx + 1] : null;

const examIds = examArg
  ? [examArg]
  : readdirSync(SKILLUP, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);

async function fetchPng(mermaidCode) {
  // mermaid.ink expects standard base64 of the raw mermaid syntax
  const encoded = Buffer.from(mermaidCode.trim()).toString('base64');
  const url = `https://mermaid.ink/img/${encoded}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // mermaid.ink returns SVG when given unsupported diagrams — reject non-PNG
  if (buf.slice(0, 4).toString('hex') !== '89504e47') {
    throw new Error('Response was not a PNG (may be SVG fallback)');
  }
  return buf;
}

let totalDiagrams = 0;
let totalFailed = 0;
let totalFiles = 0;

for (const examId of examIds) {
  const notesDir = join(SKILLUP, examId, 'notes');
  if (!existsSync(notesDir)) continue;

  const imagesDir = join(SKILLUP, examId, 'images');
  const notesFiles = readdirSync(notesDir).filter((f) => f.endsWith('.md'));

  for (const notesFile of notesFiles) {
    const filePath = join(notesDir, notesFile);
    const content = readFileSync(filePath, 'utf8');
    const matches = [...content.matchAll(MERMAID_RE)];
    if (matches.length === 0) continue;

    mkdirSync(imagesDir, { recursive: true });
    const slug = notesFile.replace('.md', '');
    let newContent = content;
    let fileChanged = false;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const imgName = `${slug}-${String(i + 1).padStart(2, '0')}.png`;
      // absolute path from web root so it resolves correctly in the React app
      const webPath = `/content/skillup/${examId}/images/${imgName}`;
      const diskPath = join(imagesDir, imgName);

      process.stdout.write(`  [${examId}] ${notesFile} diagram ${i + 1}/${matches.length} ... `);
      try {
        const png = await fetchPng(match[1]);
        writeFileSync(diskPath, png);
        // preserve alt hint from first node label if extractable
        const firstNode = match[1].trim().split('\n')[1]?.match(/\["?([^"\]]{0,40})/)?.[1] ?? `Diagram ${i + 1}`;
        newContent = newContent.replace(match[0], `![${firstNode}](${webPath})`);
        fileChanged = true;
        totalDiagrams++;
        console.log(`✓ ${Math.round(png.length / 1024)}KB`);
      } catch (err) {
        totalFailed++;
        console.log(`✗ ${err.message} — keeping mermaid block`);
      }
    }

    if (fileChanged) {
      writeFileSync(filePath, newContent);
      totalFiles++;
    }
  }
}

console.log(`\nDone: ${totalDiagrams} rendered, ${totalFailed} failed, ${totalFiles} file(s) updated`);
if (totalFailed > 0) process.exit(1);
