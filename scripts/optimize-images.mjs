#!/usr/bin/env node
// Compress PNG images in skillup exam image dirs that exceed the size threshold.
// Usage: node scripts/optimize-images.mjs [--exam <id>] [--max-kb <N>]
// Defaults: max-kb=300, processes all exams.
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');

const args = process.argv.slice(2);
const examIdx = args.indexOf('--exam');
const examArg = examIdx >= 0 ? args[examIdx + 1] : null;
const maxKbIdx = args.indexOf('--max-kb');
const THRESHOLD = (maxKbIdx >= 0 ? parseInt(args[maxKbIdx + 1]) : 300) * 1024;
const ROOT = resolve('public/content/skillup');

async function optimizeExam(examId) {
  const imgDir = join(ROOT, examId, 'images');
  let files;
  try { files = await readdir(imgDir); } catch { return; }

  const pngs = files.filter(f => f.endsWith('.png'));
  if (!pngs.length) return;
  console.log(`\n[${examId}] — threshold ${Math.round(THRESHOLD / 1024)}KB`);

  for (const file of pngs) {
    const filePath = join(imgDir, file);
    const { size } = await stat(filePath);
    if (size <= THRESHOLD) {
      console.log(`  ✓ ${file} (${Math.round(size / 1024)}KB)`);
      continue;
    }

    const buf = await readFile(filePath);
    const meta = await sharp(buf).metadata();
    let result;

    // Pass 1 — lossless max compression
    result = await sharp(buf).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    if (result.length <= THRESHOLD) {
      await writeFile(filePath, result);
      console.log(`  ↓ ${file}: ${Math.round(size / 1024)}KB → ${Math.round(result.length / 1024)}KB (compression only)`);
      continue;
    }

    // Pass 2 — resize to 75% + max compression
    const w75 = Math.round(meta.width * 0.75);
    result = await sharp(buf).resize(w75).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    if (result.length <= THRESHOLD) {
      await writeFile(filePath, result);
      console.log(`  ↓ ${file}: ${Math.round(size / 1024)}KB → ${Math.round(result.length / 1024)}KB (75% resize)`);
      continue;
    }

    // Pass 3 — resize to 50% + max compression
    const w50 = Math.round(meta.width * 0.5);
    result = await sharp(buf).resize(w50).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    if (result.length <= THRESHOLD) {
      await writeFile(filePath, result);
      console.log(`  ↓ ${file}: ${Math.round(size / 1024)}KB → ${Math.round(result.length / 1024)}KB (50% resize)`);
      continue;
    }

    // Pass 4 — resize to 25% (last resort)
    const w25 = Math.round(meta.width * 0.25);
    result = await sharp(buf).resize(w25).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
    await writeFile(filePath, result);
    const note = result.length > THRESHOLD ? ' ⚠ still over threshold' : '';
    console.log(`  ↓ ${file}: ${Math.round(size / 1024)}KB → ${Math.round(result.length / 1024)}KB (25% resize)${note}`);
  }
}

const allExams = (await readdir(ROOT, { withFileTypes: true }))
  .filter(e => e.isDirectory())
  .map(e => e.name);

const targets = examArg ? allExams.filter(e => e === examArg) : allExams;
if (!targets.length) { console.error(`No exam found: ${examArg}`); process.exit(1); }

for (const exam of targets) await optimizeExam(exam);
console.log('\nDone.');
