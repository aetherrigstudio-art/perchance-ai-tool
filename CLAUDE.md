# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

This is **not** a conventional application with a build/test/lint toolchain. It is a
collection of **Perchance.org generator source files** plus the authoritative
reference that governs how they are written. The product is the
**AI Character Set Builder** — a Perchance generator that builds casts of
characters (scenario, main character, persona, side characters, lore,
relationships, portraits, scene images) and exports them ready to import into
**AI Character Chat (ACC)**.

There is no `package.json`, no compiler, and no test runner in this branch.
"Building" means producing the two text blocks below and pasting them into the
two editors at perchance.org; "running" and "testing" happen in the browser on
the live Perchance site.

## The two-block model (read this before editing any tool)

Every Perchance generator is **two separate editors**, and each tool here is
stored as a matching pair of files:

- **Data / generator editor** — indentation-based plain text. Holds the
  `{import:...}` plugin lines, the `settings` block, `generate()`, and `$meta`.
  Files: `char-wiz-dat`, `*-data-panel-*.txt`.
- **HTML editor** — normal HTML + `<script>` + `<style>`. Holds all UI and
  essentially all JavaScript logic. Files: `char-wiz-html`, `*-html-panel-*.txt`.

Always deliver these as **two separate blocks** — never merge them. The data
editor stays tiny and delegates to the HTML side via `window.*` functions; for
the main tool the data editor's `instruction()` returns
`window.buildWizardPrompt()`, and almost all real code lives in `char-wiz-html`.

**`char-info` is the spec.** Load `char-info` (identical copy:
`perchance-character-creation-3.md`) before writing or changing any generator.
It is the verified reference for the AI text plugin API, the ACC Dexie import
schema, the character row fields, image/lore rules, and — critically — a
"verified vs. unverified" section (§9). Do not present unverified ACC internals
as fact, and do not auto-build group threads or seeded messages (§9 explains
why).

## File map

- `char-wiz-dat` / `char-wiz-html` — the main **AI Character Set Builder** (the
  primary deliverable). `char-wiz-html` is ~1240 lines and contains all logic.
- `wizard-data-panel-*.txt` / `wizard-html-panel-*.txt` — **versioned snapshots**
  of the wizard pair (e.g. `wizard-html-panel-7.txt` and `-8.txt` are byte-identical
  to `char-wiz-html`). Treat the unsuffixed `char-wiz-*` files as the working copy.
- `fixer-data-panel-1.txt` / `fixer-html-panel-1.txt` — **AI Character Fixer**, a
  companion tool that rebuilds a broken/garbled pasted character.
- `image-style-builder-data-panel-8.txt` / `image-style-builder-html-panel-8.txt`
  — **AI Image Style Builder**, a companion tool for composing image-prompt styles.
- `char-info` / `perchance-character-creation-3.md` — the build reference (spec).
- `ai-workspace/MEMORY.md` — cross-session working notes: branch map, branch
  divergence warnings, and outstanding work. Read it for current state; it is not
  a spec.

## Architecture of the wizard (`char-wiz-html`)

- **Two tabs**, toggled by `window.showTab('builder'|'image')`: the Character
  Builder (`#tab-builder`) and the Image Generator (`#tab-image`).
- **Generation flow.** The data editor's `instruction()` calls
  `window.buildWizardPrompt()`, which assembles a structured prompt in JS.
  Because the prompt is built in JS and returned via `instruction()`, **no
  Perchance bracket-escaping is needed** — `{{char}}`, `[]`, `{}` pass through
  literally (escaping only matters for literal text typed in the data editor).
  `startGen(kind, outId, refine, extraIndex)` sets `window.activeOutputEl` to the
  visible textarea, then runs `generate()`.
- **Streaming.** `outputTo` points at a hidden `responseEl`; `onChunk` mirrors it
  into `window.activeOutputEl` so output streams into whichever field the user
  triggered. `onFinish` calls `window.onWizFinish()`.
- **Section generators** (`window.genScenario`, `genChar`, `genLore`, `genExtra`,
  `genOpening`, `genStyle`, `genConsistency`) each produce a labeled section; the
  output is parsed with the robust `getSection(label, text)` parser (see
  `char-info` §8 — avoid greedy regex).
- **Side characters & relationships** are dynamic arrays (`extras`, `rels`) kept
  in sync with the DOM (`syncExtrasFromDOM`, `renderExtras`, `renderRels`).
- **Export pipeline** (`char-info` §4 has the canonical implementations):
  `characterRow(c, seed, isPersona)` → `buildDexie([rows])` →
  `downloadFile(name, text)`. Exposed as `window.exportCombined` /
  `window.exportSeparate`. `learnSchema` / `importBack` let a user feed in their
  own ACC export so the builder preserves their `databaseVersion`.
- **Persistence.** State is saved to `localStorage` under a **versioned key**
  with type-coercion on load and a `resetAll()` ("start over"). This matters
  because multiple pasted generators share storage at the same Perchance URL
  (`char-info` §10).

## Hard rules that have each caused real failures

These come from `char-info` §3–§4 and are easy to get wrong:

- The ACC import envelope is a **Dexie dump** for `databaseName: "chatbot-ui-v1"`,
  `databaseVersion: 90`, `formatVersion: 1`. **All 9 tables** must appear in both
  `tables[]` and `data[]` (each with a `rows` array, even if `[]`) or import throws.
- Use high-entropy `uuid` (`crypto.randomUUID()`) and a timestamp-based numeric
  `id` per character, or you can overwrite the user's existing characters.
- **There is no `maxTokens` setting** on the AI plugin — control length through
  the prompt text.
- Put the per-message `<image>...</image>` scene directive on **every** non-persona
  character (each speaker uses its own instruction/reminder). For group chats only
  the **main** character's `customCode` block actually runs.

## Working in this repo

- **Develop on the branch you were assigned**; commit and push there, then open a
  draft PR. Check `ai-workspace/MEMORY.md` first — it tracks branch divergence
  (notably incompatible versions of `char-wiz-html` across branches) and the
  outstanding work queue.
- **There is no automated test in this branch.** perchance.org HTML pages 403 all
  automated fetches; only `/api/downloadGenerator` is reachable. The real
  verification loop is: paste the data block + HTML block into the two Perchance
  editors and exercise the UI in the browser. When validating exports, confirm the
  generated JSON imports into ACC without error.
- When you change `char-wiz-html`, decide whether the matching `wizard-*-panel-*`
  snapshot and/or `char-wiz-dat` should move with it — they are meant to stay in
  sync with the working copy.
