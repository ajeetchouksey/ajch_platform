// REPL driver for ajch_platform (Vite React SPA + Cloudflare Worker).
// Drives a headless Chromium (Playwright) against the local Vite dev server.
// Designed for agents: run it, pipe commands to stdin, or wrap in tmux and
// use send-keys/capture-pane for iterative debugging.
//
// Must be run with cwd (or an ancestor) containing node_modules/playwright —
// Node's ESM resolver walks up from THIS FILE's path, so running it from
// inside the repo (anywhere under ajch_platform/) resolves fine. Running a
// copy of this file from outside the repo tree (e.g. a scratch/tmp dir) will
// fail with ERR_MODULE_NOT_FOUND even if playwright is installed at the repo
// root — this bit us the first time.
import { chromium } from 'playwright';
import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const BASE_URL = process.env.APP_URL || 'http://localhost:5173';
const SHOT_DIR = process.env.SCREENSHOT_DIR || path.join(os.tmpdir(), 'ajch-platform-shots');
fs.mkdirSync(SHOT_DIR, { recursive: true });

let browser = null;
let page = null;
let consoleErrors = [];

const COMMANDS = {
  async launch() {
    if (browser) return console.log('already launched');
    browser = await chromium.launch(); // headless by default — no xvfb needed on any OS
    page = await browser.newPage();
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + err.message));
    page.on('response', (res) => { if (res.status() >= 400) console.log('  HTTP', res.status(), res.url()); });
    console.log('launched. base url:', BASE_URL);
  },

  // `nav /blog` or `nav http://localhost:5173/blog` — waits for network idle,
  // which is what lets React.lazy chunk fetches settle before you screenshot.
  async nav(pathArg) {
    if (!page) return console.log('ERROR: launch first');
    const url = pathArg.startsWith('http') ? pathArg : BASE_URL + pathArg;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
    console.log('nav ->', url);
  },

  async ss(name) {
    if (!page) return console.log('ERROR: launch first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f });
    console.log('screenshot:', f);
  },

  // `ss-el <css-sel> [name]` — element-only screenshot (auto-scrolls to fit
  // the full element bounding box regardless of viewport height), for a
  // clean product shot without surrounding page chrome/margins.
  async 'ss-el'(argsStr) {
    if (!page) return console.log('ERROR: launch first');
    const [sel, ...nameParts] = argsStr.trim().split(/\s+/);
    if (!sel) return console.log('ERROR: usage — ss-el <css-sel> [name]');
    const f = path.join(SHOT_DIR, (nameParts.join(' ') || `ss-el-${Date.now()}`) + '.png');
    try {
      await page.locator(sel).first().screenshot({ path: f });
      console.log('screenshot:', f);
    } catch (e) { console.log('ERROR:', e.message); }
  },

  async click(sel) {
    if (!page) return console.log('ERROR: launch first');
    try { await page.click(sel, { timeout: 5000 }); console.log('clicked:', sel); }
    catch (e) { console.log('ERROR:', e.message); }
  },

  async 'click-text'(text) {
    if (!page) return console.log('ERROR: launch first');
    const r = await page.evaluate((t) => {
      const els = [...document.querySelectorAll('a, button, [role="button"]')];
      const el = els.find((e) => e.textContent?.trim() === t) ?? els.find((e) => e.textContent?.includes(t));
      if (!el) return 'NOT_FOUND';
      el.click();
      return 'OK: ' + el.tagName;
    }, text);
    console.log('click-text', JSON.stringify(text), '->', r);
  },

  async wait(sel) {
    if (!page) return console.log('ERROR: launch first');
    try { await page.waitForSelector(sel, { timeout: 10000 }); console.log('found:', sel); }
    catch { console.log('TIMEOUT:', sel); }
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try { console.log(JSON.stringify(await page.evaluate(expr))); }
    catch (e) { console.log('ERROR:', e.message); }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first');
    console.log(await page.evaluate((s) => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)', sel || null));
  },

  // First link matching an href prefix — handy for jumping into a real
  // /blog/:slug or /skillup/:examId page without hardcoding a slug.
  async 'first-link'(hrefPrefix) {
    if (!page) return console.log('ERROR: launch first');
    const href = await page.evaluate((p) => document.querySelector(`a[href^="${p}"]`)?.getAttribute('href') ?? null, hrefPrefix);
    console.log(href ?? 'NOT_FOUND');
    return href;
  },

  async errors() {
    console.log('console errors so far:', consoleErrors.length);
    consoleErrors.forEach((e) => console.log(' -', e));
  },

  async 'clear-errors'() { consoleErrors = []; console.log('cleared'); },

  async quit() { if (browser) await browser.close().catch(() => {}); browser = null; page = null; },
  help() { console.log('commands:', Object.keys(COMMANDS).join(', ')); },
};

// Plain process.stdin (unlike the Electron driver pattern, there's no
// Electron app here trying to steal stdin, so no /dev/stdin fd trick needed —
// that trick also doesn't work on Windows, which has no /dev/stdin).
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'driver> ' });

// readline fires 'line' for every buffered line back-to-back when input is
// piped (heredoc, a script, an agent sending several commands at once) —
// it does NOT wait for an async listener to resolve before firing the next
// one. Without this queue, `launch` (which takes ~1s to spawn the browser)
// loses the race against every command piped after it, which all see
// browser===null and fail with "launch first". Interactive typing never
// triggers this because a human waits for the prompt between lines.
const queue = [];
let draining = false;
let exited = false;
async function drain() {
  if (draining) return;
  draining = true;
  while (queue.length) {
    const line = queue.shift();
    const [cmd, ...rest] = line.trim().split(/\s+/);
    if (cmd) {
      const fn = COMMANDS[cmd];
      if (!fn) console.log('unknown:', cmd, '- try: help');
      else {
        try { await fn(rest.join(' ')); } catch (e) { console.log('ERROR:', e.message); }
        if (cmd === 'quit') { exited = true; rl.close(); process.exit(0); }
      }
    }
    // With piped input, Node auto-closes the readline interface on EOF as
    // soon as all lines have been emitted — which can happen while we're
    // still mid-command (e.g. still awaiting `launch`). prompt() throws
    // ERR_USE_AFTER_CLOSE in that case; harmless to swallow since there's no
    // interactive terminal left to show a prompt to anyway.
    if (!exited) { try { rl.prompt(); } catch { /* interface already closed */ } }
  }
  draining = false;
}
rl.on('line', (line) => { queue.push(line); void drain(); });
// With piped input (heredoc/script), 'close' (EOF) can fire before the async
// drain() above finishes running the queued commands — wait it out so a
// script that never sends an explicit `quit` still runs to completion
// instead of getting cut off mid-queue.
rl.on('close', async () => {
  while (draining || queue.length) await new Promise((r) => setTimeout(r, 50));
  if (exited) return;
  await COMMANDS.quit();
  process.exit(0);
});

console.log('ajch_platform driver - "help" for commands, "launch" to start');
rl.prompt();
