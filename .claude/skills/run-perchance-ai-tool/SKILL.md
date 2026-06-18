---
name: run-perchance-ai-tool
description: Run, test, validate, lint, or screenshot the Perchance AI Character Set Builder (the char-wiz / wizard panels). Use to exercise the export/immersion logic end-to-end, syntax-check the wizard <script>, or render the builder UI. Keywords run start test validate lint screenshot perchance wizard character builder ACC.
---

# Run the Perchance AI Character Set Builder

This repo is **not** a conventional app — it's the source for **Perchance.org
generators** (see `CLAUDE.md`). Each tool is two plain-text blocks pasted into
Perchance's two online editors; the full app only runs on perchance.org (which
returns **403** to automated fetch). There is no package manager, build, or
server.

What you *can* run here is the part every change touches: the **export /
immersion logic** inside `char-wiz-html`. The driver extracts the panel's
largest `<script>`, evaluates it against a fake DOM, and drives the real export
pipeline (`castList → characterRow → buildDexie`, immersion config + baked
`customCode`). That driver is committed at **`test/smoke.mjs`**.

All paths below are relative to the repo root (the `<unit>`).

## Prerequisites

Node (preinstalled; v22 here) and `jq` (used by the syntax-check hook):

```bash
command -v jq >/dev/null || apt-get update -qq && apt-get install -y -qq jq
```

No build step. No dependencies to install.

## Run (agent path) — exercise the real export pipeline

This is the primary driver. It asserts the load-bearing contract: exports are
import-safe ACC Dexie JSON (9 tables, persona flag, high-entropy uuid), inline
vs. `loreBookUrls` lore modes, and that the baked immersion `customCode` parses
as JavaScript with a valid embedded `CFG`.

```bash
node test/smoke.mjs
```

Expected: 18 `PASS` lines then `all checks passed`, exit 0.

## Lint — syntax-check the wizard panel after an edit

The wizard's logic lives in the largest `<script>` block of `char-wiz-html`.
Check it parses (this is exactly what the repo's PostToolUse hook runs):

```bash
echo '{"tool_input":{"file_path":"'"$PWD"'/char-wiz-html"}}' | bash .claude/hooks/check-wizard.sh
```

Expected: `{"systemMessage":"wizard <script>: syntax OK"}`. Equivalently:

```bash
node -e 'const fs=require("fs");const h=fs.readFileSync("char-wiz-html","utf8");const m=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).sort((a,b)=>b.length-a.length)[0];fs.writeFileSync("/tmp/wiz.js",m)' && node --check /tmp/wiz.js && echo "syntax OK"
```

## Screenshot the builder UI (optional — needs a browser this container can't get)

A render harness is committed at
`.claude/skills/run-perchance-ai-tool/render.mjs`. It loads `char-wiz-html` in
Chromium and screenshots the builder UI.

```bash
npx playwright@1.56.1 install chromium     # download the browser
NODE_PATH=$(npm root -g) node .claude/skills/run-perchance-ai-tool/render.mjs /tmp/wizard-ui.png
```

**Not runnable in the default Claude-on-the-web container:** the network policy
silently blocks the Playwright Chromium CDN (`install` exits 0 but downloads
nothing), and perchance.org 403s automated access. Run this only where the
Chromium download is reachable. The logic driver above needs no browser and is
the verified path here.

## Run (human path)

Paste the two blocks into a Perchance generator's two editors and click
generate: `char-wiz-dat` → the **data/generator** editor, `char-wiz-html` → the
**HTML** editor (live example: `perchance.org/q83iy9tti5#edit`). Then export a
character and confirm the downloaded `.json` imports into AI Character Chat.
Headless/automated, this is unavailable (403).

## Gotchas

- **The exported character's `customCode` (`IMMERSION_FN`) runs inside ACC, not
  here** — it references `oc`, `window.speechSynthesis`, `document`. Off-Perchance
  you can only prove it *parses* (the smoke test does this via `node --check` /
  `vm.Script`), never that it behaves.
- **Node ≥18's `crypto` is a read-only global** — you cannot reassign
  `globalThis.crypto` in a harness (throws "Cannot set property crypto"). The
  wizard calls `crypto.randomUUID()`; rely on the real global (smoke.mjs does).
- **`char-wiz-html` has no `<html>` wrapper** — it's a Perchance HTML-editor
  panel. The largest `<script>` block is the logic; smaller ones are inline.
- **Canonical vs. snapshots:** edit the canonical pair `char-wiz-html` /
  `char-wiz-dat`, then mirror to the highest-numbered `wizard-html-panel-N.txt` /
  `wizard-data-panel-N.txt`. The `wizard-*-panel-*.txt` files are byte-identical
  snapshots — don't review them separately (diff to confirm).
- **`npx playwright install chromium` "succeeds" but installs nothing** in this
  container — that's the network policy, not a bug in your command.

## Troubleshooting

- `TypeError: Cannot set property crypto of #<Object>` in a harness → you stubbed
  `globalThis.crypto`; remove it, Node provides `crypto.randomUUID()`.
- `node test/smoke.mjs` fails right after editing `char-wiz-html` → run the Lint
  command; a broken `<script>` reports the exact line (`SYNTAX ERROR — …:N`).
- Syntax-check hook prints nothing for a file → it only acts on `char-wiz-html`
  and `wizard-html-panel-*.txt` (other files are intentionally skipped).
- `jq: command not found` (hook) → `apt-get install -y jq` (see Prerequisites).
