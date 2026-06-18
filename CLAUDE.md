# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⬛ Workspace rules — standardized, read first

Every session inherits this setup from **`main`**. Do not diverge from it — this
is what keeps all agents on the same page.

1. **One line: `main`.** Work directly on `main`; do **not** create feature
   branches. If your session was auto-assigned a `claude/*` branch, fast-forward
   `main` to your work and `git push origin main`. Never leave parallel branches.
2. **One config.** `CLAUDE.md` + `.claude/` (committed on `main`) are THE shared
   setup — identical hooks, skills, permissions, and MCP for everyone. Extend the
   committed files; never spin up competing local/global configs.
3. **Read order at start:** this file → **`README.md`** (environment, tooling,
   pitfalls, end-of-life) → basic-memory note *"WORKSPACE STANDARD"* (live state).
   README is the operational layer; this file is the contract.
4. **MCP:** basic-memory uses project **`main`** (use it if `perchar` errors);
   context7 loads only after the SessionStart warm-up. Details: README §4.
5. **Memory:** at start, `recent_activity` / `search_notes` (project `main`);
   before ending, `write_note` your state + decisions. The *"WORKSPACE STANDARD"*
   note is the current source of truth; older session notes are historical.
6. **End of life:** verify → commit → memory note → `git push origin main`
   (README §6). The "Unverified signature" git nag is harmless — ignore it.
7. **Plan non-trivial work with `/plan`.** For any multi-step / multi-file task,
   run **`/plan` first** — it chains `plan-mode` (system-aware analysis) +
   `pi-planning-with-files` (durable `task_plan.md` / `progress.md`), gets plan
   approval before code, and lets a fresh session resume mid-task. Don't
   free-solo big changes.

Everything below is the build reference; the rules above govern *how we work*.

See `ROADMAP.md` for the prioritized list of ACC character/user fields not yet
implemented by the wizard.

See `AUTOMATION.md` for the **loader** deploy path: `wizard-loader-html.txt` is
pasted into the Perchance HTML editor once, then fetches `char-wiz-html` from
GitHub at runtime — so editing the repo deploys, with no re-paste.

**v2 architecture (verified live 2026-06-18).** Both panels are now **paste-once**.
The data panel was reduced to a minimal stub — only the load-time constructs
Perchance requires (`{import:...}` plugin lines, the `settings` block, `$meta`).
The former data-panel functions (`generate`, `genCharacterImage`, `wordBank`,
`uploadShare`) now live in `char-wiz-html` as `window.*` functions; the loader
**bridges the plugin imports** (`ai`, `imageGen`, `adjBank`, `nounBank`,
`verbBank`, `uploader`, `settings`) onto `window` so the loader-fetched HTML can
call them. Verified: calling the plugin imports from the HTML scope works on a
live generator. So **all** ongoing changes — HTML and data-side logic — deploy
via the loader from `main`; the data panel only changes if you add/remove a
plugin import. See the basic-memory note "VERIFIED - minimal data panel + import
bridge works on Perchance".

**Perchance API — status (verified 2026-06-18):** `/api/downloadGenerator`
is reachable via plain GET (no browser, no auth). It returns a rendered HTML
page, but the generator source is **embedded as URL-encoded JSON** in
`<script id="preloaded-generator-data">` — keys `modelText` (data panel) and
`outputTemplate` (HTML panel). `scripts/perchance_api.py` parses this and works;
`scripts/ci-verify.sh` uses it for sync checks. `pip install perchance`
(`eeemoon/perchance`) uses Playwright internally — avoid it. No upload/publish
API exists; the runtime-fetch loader (`wizard-loader-html.txt` → fetches
`char-wiz-html` from GitHub) remains the correct deploy path. See
`ai-workspace/perchance-api-research.md` and `scripts/` for full details.

## What this repository is

This is **not** a conventional application. It holds the source for several
**Perchance.org generators** — browser-based AI tools that build, repair, and
style characters for **Perchance AI Character Chat (ACC)**. There is no build
step, no package manager, no test runner, and no server. Each "tool" is a pair
of plain-text blocks that a human pastes into Perchance's two online editors.
Development means editing these text files; "running" means pasting the two
blocks into a generator at perchance.org and clicking generate.

Because of that, ignore any instinct to add `npm`/build/lint/test scaffolding
unless explicitly asked — it would have nothing to operate on.

## The canonical reference: read it first

`char-info` (identical copy: `perchance-character-creation-3.md`) is the
authoritative build reference for everything here: the Perchance two-editor
model, the `ai-text-plugin` API, the **confirmed** ACC Dexie import schema, the
~51-field character row, persona/lore/image conventions, and a "verified vs.
unverified" section (§9) that marks which fields are proven against a real
export versus assumed. **Read `char-info` before writing or modifying any
tool**, and respect its verified/unverified boundary — do not present
unverified fields or community speculation (model names, context sizes) as
fact, and do not auto-build group threads or seeded messages (those table
shapes are unverified).

## Anatomy of a tool: two blocks

Every generator is delivered as **two separate blocks** that must never be
merged:

- **Data panel** (`*-data-panel-*.txt`, `char-wiz-dat`) → goes in Perchance's
  **data/generator editor** (indentation-based plain text). **v2: minimal stub** —
  only the `{import:...}` plugin lines, the `settings` block (whose hooks delegate
  to `window.*`), and `$meta`. The functions `generate`/`genCharacterImage`/
  `wordBank`/`uploadShare` are **no longer here** — they moved to the HTML panel.
- **HTML panel** (`*-html-panel-*.txt`, `char-wiz-html`) → goes in Perchance's
  **HTML editor**. Contains the UI, **all** real JavaScript logic (now including
  `window.generate`/`genCharacterImage`/`wordBank`/`uploadShare`, which use the
  plugin imports the loader bridges onto `window`), and `<style>`.

The two halves communicate by convention: the data panel's `instruction()`
calls a `window.build*Prompt()` function defined in the HTML panel, and streams
output into DOM elements the HTML panel must provide (`responseEl`,
`generateBtn`, `stopBtn`, `loaderEl`). **Build prompt strings in HTML
JavaScript**, not in the data editor — that sidesteps Perchance's `[] {} `
escaping rules entirely (see `char-info` §1).

**Perchance templates HTML *markup*, not just the data panel.** Perchance
evaluates `[...]` and `{a|b|c}` template expressions in the HTML panel's
**markup** — placeholder text, hint copy, visible labels, attribute values —
the same way it does in the data editor. It does **not** touch the contents of
`<script>` or `<style>`. So a *literal* square bracket or brace shown in the UI
(e.g. a placeholder like `[trigger, trigger]` or a hint mentioning `[SYSTEM]`)
errors at render time ("[brackets] returned nothing").

**HTML-entity escaping (`&#91;` …) is NOT reliable here** — Perchance may decode
entities before templating, so the bracket comes back and still errors. The
rule for this repo is therefore: **keep all `[ ] { }` out of the markup
entirely.** Either reword the copy (e.g. "in square brackets" instead of
"in [brackets]"), or, when the literal bracket *is* the useful content (a format
example like `[trigger, trigger]`), set it from `<script>` —
`el("loreOut").placeholder = "[trigger, trigger] …"` — since Perchance never
templates script. JS string literals inside `<script>` are always safe. The
smoke test guards the markup region (everything before the first `<script>`)
against any bracket/brace, raw **or** entity-escaped.

### The three tools currently in the repo

| Tool | Data panel | HTML panel | Prompt builder |
|------|-----------|-----------|----------------|
| AI Character Set Builder ("wizard") | `char-wiz-dat`, `wizard-data-panel-*.txt` | `char-wiz-html`, `wizard-html-panel-*.txt` | `window.buildWizardPrompt` |
| AI Character Fixer | `fixer-data-panel-1.txt` | `fixer-html-panel-1.txt` | `window.buildFixerPrompt` |
| AI Image Style Builder | `image-style-builder-data-panel-8.txt` | `image-style-builder-html-panel-8.txt` | `window.buildStylePrompt` |

## File naming and duplicates — important

Filenames carry a **version suffix** (`-1`, `-6`, `-7`, `-8`, `-9`); the higher
number is newer. Several files are byte-identical snapshots kept under different
names, and the differences between near-versions are the real signal — diff
before assuming. Current state at time of writing:

- `char-info` == `perchance-character-creation-3.md` (identical).
- **Wizard current build (v2):** `char-wiz-html` == `wizard-html-panel-20.txt`
  (canonical HTML) and `char-wiz-dat` == `wizard-data-panel-14.txt` (canonical,
  minimal v2 data stub). These are the newest and the ones to edit. Lower-numbered
  `wizard-html-panel-*` / `wizard-data-panel-*` are historical snapshots — do not
  edit them. (`-20` fixed a triplicated `<select id="buildMode">`; an in-progress
  4-phase IA regroup + post-generation "second pass / review & refine" phase is the
  current active task — see the basic-memory "SESSION STATE 2026-06-18" handoff note.)

When editing, update the canonical pair (`char-wiz-html` / `char-wiz-dat`),
mirror the result to a new highest-numbered `wizard-html-panel-N.txt` /
`wizard-data-panel-N.txt`, and leave older snapshots untouched.

## Conventions any new or edited tool must follow

These come from `char-info` §§3–11 and are load-bearing — violating them breaks
import or corrupts user data:

- **ACC export = a Dexie database dump** for `chatbot-ui-v1`. All **9 tables**
  declared in `tables[]` must also appear in `data[]` with a `rows` array (empty
  `[]` is fine), or import throws. Use the `buildDexie(rows)` helper.
- **Collision-proof identity**: give every character a fresh
  `crypto.randomUUID()` and a timestamp-based numeric `id` (`uniqueUuid()` /
  `uniqueId(seed)`), or you can overwrite the user's existing characters.
- Keep `databaseVersion: 90`, `modelName: "perchance-ai"`,
  `textEmbeddingModelName: "Xenova/bge-base-en-v1.5"`,
  `fitMessagesInContextMethod: "summarizeOld"`.
- **Persona** = the user's own character: `customData.isPersona: true`, no
  `initialMessages`, no `reminderMessage`/`generalWritingInstructions`.
- **Streaming to a chosen field**: `outputTo` points at a hidden `responseEl`
  buffer; mirror it to `window.activeOutputEl` in `onChunk`. Set
  `activeOutputEl` to the visible textarea before each `generate()`.
- **Output parsing**: emit labeled `=== SECTION ===` blocks and parse with the
  non-greedy `getSection(label, text)` helper. There is no `maxTokens` —
  control length via prompt wording.
- **State persistence**: use a **versioned** `localStorage` key (e.g.
  `accWizardV3`) and validate/coerce on load, because multiple generators at the
  same Perchance URL share storage. Provide a "start over" reset.

## Verifying changes

Three layers, in order of cost:

1. **`node test/smoke.mjs`** — drives the real export pipeline against a fake DOM
   and asserts the Dexie export *shape* is import-safe (9 tables, persona flag,
   high-entropy uuid, lore modes, immersion `customCode` parses). Run after any
   `char-wiz-html` edit. Also `bash .claude/hooks/check-wizard.sh` (pipe it JSON)
   for a `node --check` of the wizard `<script>`.
2. **`node test/grade-generation.mjs`** — grades the *content quality* of an
   actual generation (smoke only checks shape). Generation runs on Perchance, so
   copy a character's `=== SECTION ===` output out of the field and feed it:
   `node test/grade-generation.mjs out.txt` (or `… -` for stdin). It scores a
   rubric — sections present, name-like NAME, role within ~500w budget,
   in-character FIRST MESSAGE, visual APPEARANCE, image triggers reference the
   name, **no leaked prompt text, no unfilled `[ ]`/`{ }` placeholders** — and
   prints a letter grade (A–F). Run with no args to run its own good/bad
   self-tests. Exit 0 = grade C+.
3. **Live on Perchance** — paste the two blocks into a generator's two editors
   (HTML = the loader, data = `char-wiz-dat`) and exercise it; confirm the
   downloaded `.json` imports cleanly into ACC. Treat the "Minimal checklist" in
   `char-info` §11 as the acceptance checklist.

## Skills, commands & tools — routing rules

Use the right dispatch for each type of work:

| What | Use | Why |
|---|---|---|
| Deep knowledge, fires rarely (<30% of turns) | **Skill** | Auto-triggered by description; large context |
| Small, must-fire workflow you explicitly invoke | **Slash command** `/name` | Deterministic; no routing uncertainty |
| Parallel or isolated work | **Subagent** (`Agent` tool) | Isolated worktree or context; splits load |
| Independent calls in one turn | **Parallel tool calls** | Batch in one message; faster |

**When to use which skill.** Match the work to the most *specific* skill; if a
built-in tool or a one-line edit suffices, use no skill. (`ON` = auto-fires on its
description; `name-only` = no description loaded, so invoke it deliberately by name.)

| Situation | Skill(s) |
|---|---|
| Plan any non-trivial / multi-file task (do FIRST) | **`/plan`** → `plan-mode` + `pi-planning-with-files` |
| Build / edit the wizard UI (vanilla HTML/CSS/JS) | `vanilla-web`, `mobile-responsiveness` |
| A11y / ARIA / live-regions / WCAG | `accessibility-engineer`, `aria-live-regions` |
| Run / render / screenshot / lint the wizard | `run-perchance-ai-tool` |
| Find bugs / review changed code | `debugger`, `code-review-quality`; or `/code-review` |
| Security review of a change | `code-security-audit`; or `/security-review` |
| Multi-source web research | `deep-research-agent`, `websearch-deep`, `web-search` |
| Hard trade-off / competing-factor decision | `thought-based-reasoning` |
| Author a command / hook / setting | `command-development`, `hook-development`, `plugin-settings` |
| Orchestrate parallel / isolated multi-agent work | `parallel-agents`, `subagent-task-execution`, `agent-orchestrator-task` |
| UX / information-architecture / layout calls | `ui-ux-pro-max`, `usability-testing` |
| Roadmap / ACC-field prioritization | `roadmap-planning` |
| Recap state / post-task reflect | `recap`, `reflect` |
| Search for / install a new skill | `/find-skills` |

Rules: (1) **`/plan` precedes any non-trivial change** (workspace rule 7). (2) One
domain → one skill; don't stack overlapping skills on the same step. (3) Shared-file
edits (`char-wiz-html`) stay inline or in one worktree — never fan out (below).
(4) Prefer the project's own tooling (`test/smoke.mjs`, `run-perchance-ai-tool`,
the hooks) over generic skills.

**Installed slash commands** (`.claude/commands/`): `/plan`, `/recap`, `/reflect`, `/find-skills`, `/audit`

**`/plan`** = the must-fire planning workflow: `plan-mode` (analysis) → `pi-planning-with-files` (durable `task_plan.md`/`progress.md`) → approval → tracked execution. Both skills are kept ON so the command can invoke them. Run it before any non-trivial change.

**Subagent delegation rules** (from `ai-workspace/workflow-tool-calling-research.md`):
- The delegation prompt is the *only* input channel — make it fully self-contained.
- Hand off via explicit file paths, not descriptions.
- Use `isolation: "worktree"` for any work that modifies `char-wiz-html` or other shared files.
- Cherry-pick the worktree branch back to main after review; resolve conflicts keeping the newest ARIA/CSS attrs.

**Skill count discipline**: the real lever is the **skill-listing budget** (~1% of
context, `skillListingBudgetFraction`), not raw count. Keep **≤ ~8 `on` skills**;
push the rest to **`name-only`** or **`off`**. NOTE: `user-invocable-only` hides a
skill from the model but does **not** free listing budget (and a command/skill
cannot invoke it — only `/name` can); only `name-only`/`off` reclaim budget. Diagnose
drops with `/doctor`. (See `findings.md` ② + `task_plan.md` Phase 1 for the consolidation.)

## Shared memory (basic-memory MCP)

`ai-workspace/memory/` (basic-memory MCP, project `perchar`, declared in `.mcp.json`)
is the shared cross-session/cross-agent memory. **At session start, consult it**
(`search_notes` / `recent_activity`) for current state; **record durable findings and
decisions** with `write_note` before ending a task. A SessionStart hook injects this
rule each session. The git-tracked markdown is the source of truth; the `.bm/` index is
local and rebuildable.

## Other MCP / tooling

- **Context7 MCP** (`@upstash/context7-mcp`, declared in `.mcp.json`, enabled in
  `.claude/settings.json` `enabledMcpjsonServers`) provides up-to-date library/API docs
  via `resolve-library-id` / `get-library-docs`. Loads at session start (no API key).
- **Audit reports** live in `ai-workspace/audit/` (a11y+mobile, correctness+export,
  security+content) with matching basic-memory notes — open findings to work through.
- **Screenshots work here** despite the run-perchance-ai-tool SKILL.md warning: the
  Chromium download is reachable in this container. Install with
  `PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright npx -y playwright@1.56.1 install chromium`,
  then render `char-wiz-html` headless (setContent) and screenshot. Render the panel
  directly, not the loader (the loader's GitHub fetch hits an `ERR_CERT_AUTHORITY_INVALID`
  sandbox TLS-proxy quirk, not a real bug).
