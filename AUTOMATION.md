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
https://raw.githubusercontent.com/aetherrigstudio-art/perchance-ai-tool/claude/init-9i0np9/char-wiz-html
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
