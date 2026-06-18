# Deploying without copy-paste (the loader)

**Perchance API — corrected understanding (2026-06-18):**
Perchance 403s the *HTML/visual editor layer* — it does NOT block the underlying
API endpoints. `/api/downloadGenerator` is stable, backwards-compatible, and
callable via curl/Node.js/Python with no browser. The Python package
`eeemoon/perchance` (`pip install perchance`) provides `TextGenerator` and
`ImageGenerator` async clients. A Node.js proxy pattern (`ouoertheo/sd-webui-perchance`)
can run the generator engine locally. See `ai-workspace/perchance-api-research.md`.

The API layer does NOT help with pushing code into the editors — that still
requires the loader below. But it enables CI verification, output testing, and
data-panel fetching without a browser.

---

The way to stop re-pasting the HTML panel on every change is to **invert the
flow**: paste a tiny loader once, and let it pull the real build from GitHub at
runtime. After that, **editing the repo is deploying.**

## One-time setup

1. **Data editor** (data/generator panel): paste `char-wiz-dat` once. It rarely
   changes - only re-paste if `char-wiz-dat` itself changes.
2. **HTML editor**: paste `wizard-loader-html.txt` once. You never touch this
   editor again.
3. Save the generator. Open it - the loader fetches `char-wiz-html` from the
   GitHub branch, injects it, and the builder appears.

## From then on

- Edit `char-wiz-html` (the canonical HTML panel), commit, push.
- Reload the generator. The new build is live - **no paste.**
- GitHub raw caches for ~5 min; the loader cache-busts per load, but if you see
  a stale build, hard-refresh once.

## What the loader fetches

`wizard-loader-html.txt` points at one URL:

```
https://raw.githubusercontent.com/aetherrigstudio-art/perchance-ai-tool/main/char-wiz-html
```

If you merge to `main` (or rename the branch), change that single `SRC` line in
the loader and re-paste it once.

## Requirements (all currently satisfied)

- The repo is **public** so the file is fetchable without a token (don't embed a
  token in a published generator).
- GitHub raw serves `access-control-allow-origin: *`, so the cross-origin fetch
  is allowed.
- **The one thing only an in-Perchance test can confirm:** that Perchance's
  generator iframe doesn't block the outbound `fetch` via CSP. If it does, the
  loader shows a "Could not load… paste manually" message and you fall back to
  the normal copy-paste. (Perchance generators routinely make network calls, so
  this is expected to work - verify once.)

## Side benefit

Because the real markup is injected by JavaScript, Perchance never *templates*
it - so the `[ ] { }` bracket rules that break a direct paste stop applying to
the loaded build. The smoke-test guard on markup brackets stays in place anyway
for anyone who pastes `char-wiz-html` directly.

---

## Scripted deploy

Two scripts in `scripts/` automate the most useful CI/deploy checks. Neither
requires browser access or a Perchance account.

### scripts/deploy.sh

Checks whether the local files are in sync with the live deploy state and
prints step-by-step instructions for anything that still requires a manual step.

```bash
# Check HTML panel sync (GitHub raw comparison only):
./scripts/deploy.sh

# Also check data panel against live Perchance (requires perchance.org to be
# reachable — works locally, may 403 in cloud CI):
./scripts/deploy.sh --check-dat
```

**What it checks:**

| Check | How | Expected |
|-------|-----|---------|
| `char-wiz-html` uncommitted? | `git diff HEAD` | No local edits pending |
| `char-wiz-html` pushed? | `git diff HEAD origin/branch` | Local = remote |
| GitHub raw matches local? | `curl` + `diff` | Byte-identical |
| `char-wiz-dat` matches Perchance? | `/api/downloadGenerator` | Byte-identical (local only) |

Exit 0 = all in sync. Exit 1 = action required. Exit 2 = prereq/network missing.

### scripts/ci-verify.sh

Lightweight sync check designed for CI pipelines. Compares local source against
the live endpoint without touching the Perchance editor.

```bash
# Check HTML panel only (default, CI-safe — uses GitHub raw):
./scripts/ci-verify.sh
./scripts/ci-verify.sh html

# Check data panel only (uses /api/downloadGenerator, may 403 in cloud CI):
./scripts/ci-verify.sh dat

# Check both:
./scripts/ci-verify.sh both
```

Exit codes: **0** = in sync, **1** = drift detected, **2** = API/network unreachable.

### Which check to use where

| Context | Command | Notes |
|---------|---------|-------|
| After a push, confirm HTML is live | `./scripts/ci-verify.sh html` | Uses GitHub raw — always reachable |
| Before pasting dat panel | `./scripts/ci-verify.sh dat` | Run locally; perchance.org may 403 in CI |
| Full pre-release check | `./scripts/deploy.sh --check-dat` | Run locally |
| GitHub Actions (push hook) | `./scripts/ci-verify.sh html` | Safe in cloud — no perchance.org call |

### The data panel: why it rarely needs re-pasting (and why it's not zero)

Perchance exposes `/api/downloadGenerator` for **reads** but no upload/write
endpoint, so the *source* of `char-wiz-dat` can only be saved by pasting into the
data editor at `perchance.org/q83iy9tti5#edit`. That sounds like the data panel
can't be auto-deployed — but most of it effectively *is*, because of how Perchance
executes generators (verified 2026-06-18; see the deep-research note in
`ai-workspace/memory/`):

- The data editor is **full JavaScript** and shares one `window` global scope with
  the HTML editor's classic `<script>` (which the loader fetches from GitHub). HTML
  `<script>`s run *before* the data editor's functions, so data-editor code can call
  `window.*` defined by the loaded HTML. [verified: perchance.org/advanced-tutorial]
- Function-valued `settings` properties (`instruction`, `startWith`, `stopSequences`)
  are **re-evaluated per generation**, so even a settings value can read live state
  from the HTML panel. [verified: perchance.org/ai-text-plugin]

So `char-wiz-dat` is kept as a **thin bridge**: the six `{import:plugin}` lines and
the bare `settings`/function declarations must stay (Perchance load-time constructs),
but every mutable *body* delegates to a `window.*` function in `char-wiz-html` (which
the loader auto-deploys). Net: the data panel only needs re-pasting when you add or
remove a plugin import or change the settings structure — not for logic changes.

A literal GitHub-fetch-and-`eval` loader for the data panel is *plausible but
unverified* (the imports can't be eval'd anyway, so it offers nothing over the
delegation approach). Don't pursue it without a live Perchance test.
