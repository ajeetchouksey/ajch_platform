// One-time decoder: reads Playwright run_playwright_code result and writes PNGs
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const [, , tmpFile, slug] = process.argv;
if (!tmpFile || !slug) {
  console.error('Usage: node scripts/decode-png.mjs <tmpFile> <slug>');
  process.exit(1);
}

const raw = readFileSync(tmpFile, 'utf8');
// run_playwright_code wraps output as: Result: "JSON_STRING"<page info...>
const match = raw.match(/^Result:\s*"([\s\S]*?)"\s*(?:Page Title|$)/);
if (!match) {
  // Try direct JSON (in case the result is not wrapped)
  try {
    const data = JSON.parse(raw);
    writeAll(data, slug);
    process.exit(0);
  } catch {
    console.error('Could not parse result file. Raw starts with:', raw.slice(0, 80));
    process.exit(1);
  }
}
const inner = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
const data = JSON.parse(inner);
writeAll(data, slug);

function writeAll(data, slug) {
  mkdirSync('public/content/skillup/ab731/images', { recursive: true });
  for (const { idx, b64 } of data) {
    const fname = `public/content/skillup/ab731/images/${slug}-${String(idx).padStart(2, '0')}.png`;
    writeFileSync(fname, Buffer.from(b64, 'base64'));
    console.log('Wrote', fname, Math.round(Buffer.from(b64, 'base64').length / 1024) + 'KB');
  }
}
