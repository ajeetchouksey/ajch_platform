---
name: run-ajch-platform
description: Build, run, and drive ajch_platform (the Aarya — My AI Learning Hub Vite/React SPA and its Cloudflare Worker backend). Use when asked to start the app, take a screenshot of it, click through its routes, verify a frontend change actually renders, or run/smoke-test the subscribe/mentor Worker.
---

ajch_platform is a Vite + React 19 SPA (frontend) plus a Cloudflare
Worker at `workers/subscribe.ts` (backend: newsletter subscribe,
`/mentor/*` AI endpoints, GitHub OAuth proxy). Drive the frontend via
the Playwright REPL at `.claude/skills/run-ajch-platform/driver.mjs`;
smoke-test the Worker via `wrangler dev` + `curl`. All paths below are
relative to the repo root.

## Prerequisites

No OS packages needed — this is a pure Node project, and Playwright's
default headless Chromium needs no virtual display (`xvfb`) on any OS,
Windows included (verified in this container, which is Windows).

```bash
node -v   # verified against Node 24.12.0 in this container
```

## Setup

`playwright` is a **driver-only** dependency, deliberately not added to
`package.json`/`package-lock.json` (keeps the app's real dependency
tree untouched). Install it once per fresh checkout:

```bash
npm install                       # normal project deps (runs the app's own postinstall/husky)
npm install --no-save playwright  # driver-only, not persisted to package.json
npx playwright install chromium   # downloads the browser binary (~300MB, one-time)
```

## Run (agent path) — Frontend SPA

Start the dev server, then drive it with the REPL:

```bash
npm run dev > /tmp/vite-dev.log 2>&1 &
disown
timeout 30 bash -c 'until curl -sf http://localhost:5173 >/dev/null; do sleep 1; done'
```

```bash
node .claude/skills/run-ajch-platform/driver.mjs
```

It's a REPL over stdin — type commands at the `driver>` prompt, or
pipe them in (a heredoc works; the driver queues piped lines so they
run one at a time instead of racing each other):

```bash
node .claude/skills/run-ajch-platform/driver.mjs <<'EOF'
launch
nav /
ss home
nav /skillup/ab100/notes
wait svg
ss notes
errors
quit
EOF
```

Screenshots land in `%TEMP%\ajch-platform-shots\` (Linux/Mac:
`/tmp/ajch-platform-shots/`) — override with `SCREENSHOT_DIR`. Actually
open and look at the PNG; a blank or error-page screenshot is a
failure even if no command errored.

Stop the dev server when done — this is Windows/Git Bash, `lsof` doesn't
exist here (see Gotchas), use netstat + taskkill instead:

```bash
PID=$(netstat -ano | grep ":5173" | grep LISTENING | awk '{print $NF}' | head -1)
[ -n "$PID" ] && taskkill //F //PID "$PID"
```

| command | what it does |
|---|---|
| `launch` | launch headless Chromium |
| `nav <path>` | navigate (e.g. `nav /blog`); waits for network idle |
| `ss [name]` | screenshot → `$SCREENSHOT_DIR/<name>.png` |
| `click <css-sel>` | click via Playwright's normal click |
| `click-text <text>` | click first link/button/`[role=button]` matching visible text |
| `wait <css-sel>` | wait up to 10s for a selector |
| `first-link <href-prefix>` | print (and return) the first `href` starting with the prefix — e.g. `first-link /blog/` to find a real post slug without hardcoding one |
| `eval <js-expr>` | `page.evaluate()`, prints JSON |
| `text [css-sel]` | print `innerText` of selector (or `body`) |
| `errors` | print console errors seen since launch |
| `clear-errors` | reset the error log |
| `quit` | close the browser, exit |

## Run (agent path) — Cloudflare Worker (`subscribe`)

The subscriber list lives in D1 (`workers/schema.sql`), not KV — a fresh checkout's
local D1 simulation has no tables until you seed it once (idempotent, safe to
re-run; state persists in `.wrangler/state/v3/d1` between runs after that):

```bash
npx wrangler d1 execute aarya-subscribers --file=workers/schema.sql --local
```

```bash
npx wrangler dev -c wrangler.toml --port 8787 > /tmp/wrangler-dev.log 2>&1 &
disown
timeout 60 bash -c 'until curl -sf -o /dev/null http://localhost:8787/subscribe -X OPTIONS -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST"; do sleep 1; done'
```

`wrangler dev` can take 30-40s to bind the port and finish D1/KV local
simulation setup (slower than Vite's readiness) — a 30s timeout has
been observed to fire before the server is actually ready even though
it comes up fine a few seconds later; 60s gives it margin.

```bash
# CORS preflight
curl -si http://localhost:8787/subscribe -X OPTIONS \
  -H "Origin: http://localhost:5173" -H "Access-Control-Request-Method: POST"

# /mentor/plan without ANTHROPIC_API_KEY set → clean 503, not a crash
curl -si http://localhost:8787/mentor/plan -X POST \
  -H "Origin: http://localhost:5173" -H "Content-Type: application/json" \
  -d '{"examId":"ab100","examTitle":"AB-100","targetDate":"2026-12-01","domainScores":{"D1":50},"domainWeights":{"D1":28},"request":"help me study"}'

# /subscribe input validation
curl -si http://localhost:8787/subscribe -X POST \
  -H "Origin: http://localhost:5173" -H "Content-Type: application/json" \
  -d '{"type":"email","value":"not-an-email"}'

# Inspect the local D1 subscriber table directly
npx wrangler d1 execute aarya-subscribers --local --command="SELECT * FROM subscribers"
```

Stop it the same way (netstat + taskkill, port 8787 this time):

```bash
PID=$(netstat -ano | grep ":8787" | grep LISTENING | awk '{print $NF}' | head -1)
[ -n "$PID" ] && taskkill //F //PID "$PID"
```

To exercise the full `/mentor/*` path (including the response-caching
logic in `handleMentorPlan`) you need a real key:
`wrangler secret put ANTHROPIC_API_KEY` or a local `.dev.vars` file —
not something to provision in an agent container by default.

## Run (human path)

```bash
npm run dev       # http://localhost:5173 — Ctrl-C to stop
npx wrangler dev   # http://localhost:8787 — Ctrl-C to stop
```

## Test

No test runner is installed yet (`vitest`/`playwright-test` aren't in
`package.json`, and there's no `test` script) — `npm run build`
(`tsc -b && vite build`) is the closest thing to a correctness check
right now.

---

## Gotchas

- **The homepage logs two harmless `401` console errors on every load.**
  It fires an unauthenticated `GET https://api.github.com/repos/...`
  call (repo stats widget) that GitHub rate-limits/401s without a
  token — this happens on a clean load with no interaction, shows up
  in `errors`, and is not a sign anything is broken. Don't chase it;
  if `errors` reports *more* than these two on the home route, or any
  on another route, that's the real signal.

- **`playwright` script must live inside the repo tree, or `require`/`import` fails.**
  Node's ESM resolver walks *up* from the importing file's own path
  looking for `node_modules` — it does not use `cwd`. A copy of the
  driver run from outside the repo (e.g. a scratch/tmp directory)
  throws `ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'` even
  with `playwright` installed at the repo root, because the scratch
  dir isn't an ancestor of the repo's `node_modules`. Keep the driver
  under `.claude/skills/run-ajch-platform/` (an ancestor of
  `<repo>/node_modules` either way) and it resolves fine.

- **Piped/heredoc REPL input races the first async command.** Node's
  `readline` fires a `line` event for every buffered line back-to-back
  when input is piped — it does not wait for an async listener (like
  `launch`, which takes ~1s to spawn the browser) to resolve before
  firing the next one. Without an explicit queue, every command piped
  after `launch` sees `browser === null` and fails with "launch
  first". `driver.mjs` queues incoming lines and drains them one at a
  time for exactly this reason.

- **`readline` auto-closes on stdin EOF mid-command.** With piped
  input, Node closes the interface as soon as the last line has been
  *emitted* — which can be while `drain()` is still awaiting an
  earlier async command. A subsequent `rl.prompt()` call then throws
  `ERR_USE_AFTER_CLOSE`. Harmless (there's no interactive terminal
  left to prompt anyway) — `driver.mjs` swallows it in a try/catch.

- **No `/dev/stdin` on Windows.** The Electron driver pattern this was
  adapted from reads `fs.openSync('/dev/stdin', 'r')` to protect the
  REPL's stdin from the app stealing it. There's no Electron process
  here to steal stdin, and `/dev/stdin` doesn't exist on Windows
  anyway — `driver.mjs` uses `process.stdin` directly.

- **`wrangler dev` without secrets set still starts fine.** `/subscribe`
  actually succeeds locally with no secrets at all now — the subscriber
  write goes to D1 (local simulated storage, no secret needed), and the
  only place `GIST_TOKEN` is still used (updating the public aggregate-stats
  gist) is a non-fatal step *after* the D1 write, so its absence just logs
  `stats-update-failed` without affecting the `201 subscribed` response.
  `/mentor/*` still needs `ANTHROPIC_API_KEY` and returns a clean `503`
  without it. The `RATE_LIMITER` KV binding works out of the box under
  `wrangler dev` (local simulated storage) — hitting `/subscribe` 5 times
  rapidly correctly returns `429` on the 6th.

- **D1 tables don't exist until you seed them.** A fresh checkout's local
  D1 simulation (`.wrangler/state/v3/d1`) starts empty — `env.DB.prepare(...)`
  queries fail with a SQLite "no such table" error until
  `wrangler d1 execute aarya-subscribers --file=workers/schema.sql --local`
  has been run at least once. It's idempotent (`CREATE TABLE IF NOT EXISTS`),
  so safe to re-run; state then persists across `wrangler dev` restarts.

- **D1 dedup is genuinely atomic, unlike the Gist it replaced.** Firing 10
  concurrent identical `/subscribe` requests (`for i in $(seq 1 10); do curl
  ... & done; wait`) against the same new value produces exactly one row —
  `INSERT ... ON CONFLICT(type, value) DO NOTHING` relies on the `(type,
  value)` primary key in `workers/schema.sql` to make the race impossible
  at the database level, verified directly against the local D1 table.

- **`lsof` does not exist on this Windows/Git Bash container — and fails
  silently, not loudly, if you assume it does.** `lsof -ti:PORT | xargs -r kill`
  looks like a normal, safe way to free a port. Here `lsof` itself
  errors with "command not found," produces no stdout, and `xargs -r`
  (no-run-if-empty) then quietly does nothing and exits 0 — the whole
  pipeline "succeeds" with the port never actually freed. This isn't
  hypothetical: it happened while building this skill and left two
  background servers (Vite on 5173, `wrangler dev` on 8787) running
  for the rest of the session undetected, because every subsequent
  "stop the server" step reported success. Use `netstat -ano | grep
  ":<port>" | grep LISTENING` to get the real PID and `taskkill //F
  //PID <pid>` to kill it — and double `/` before `F`/`PID` matters:
  Git Bash's path-mangling rewrites a single `/F` into a Windows path
  before `taskkill` ever sees it.

## Troubleshooting

- **`ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'`**: the
  driver script (or a copy of it) is running from outside the repo
  tree. See the Gotchas entry above — move it back under `.claude/skills/run-ajch-platform/` or anywhere else inside the repo.
- **All piped commands after `launch` fail with "launch first"**: you're
  running an old copy of the driver without the line-queue fix — see
  Gotchas. `driver.mjs` in this directory already has it.
- **`EADDRINUSE` on 5173 or 8787, or a "stopped" server that's actually
  still serving requests**: a previous run's process is still bound to
  the port — `lsof` silently failing to kill it is the most likely
  cause (see Gotchas). Confirm with
  `netstat -ano | grep ":<port>" | grep LISTENING` and kill the PID it
  reports with `taskkill //F //PID <pid>` before relaunching.
