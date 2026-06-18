# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

See `ROADMAP.md` for the prioritized list of ACC character/user fields not yet
implemented by the wizard.

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
  **data/generator editor** (indentation-based plain text). Contains the
  `{import:ai-text-plugin}` / `{import:text-to-image-plugin}` imports,
  `settings`, the `generate()` function, and `$meta` (title/description).
- **HTML panel** (`*-html-panel-*.txt`, `char-wiz-html`) → goes in Perchance's
  **HTML editor**. Contains the UI, all real JavaScript logic, and `<style>`.

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
`<script>` or `<style>`. So any *literal* square bracket or brace you want to
show in the UI (e.g. a placeholder like `[trigger, trigger]` or a hint
mentioning `[SYSTEM]`) must be entity-escaped — `&#91;` `&#93;` `&#123;`
`&#125;` `&#124;` — or it errors at render time ("[brackets] returned nothing").
JS string literals inside `<script>` are safe and need no escaping. The smoke
test guards the markup region (everything before the first `<script>`) against
unescaped `[..]` / `{a|b|c}` regressions.

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
- **Wizard current build:** `char-wiz-html` == `wizard-html-panel-11.txt`
  (canonical HTML) and `char-wiz-dat` == `wizard-data-panel-10.txt` (canonical
  data). These are the newest and the ones to edit. Older `wizard-html-panel-7..10`
  and `wizard-data-panel-6..9` are historical snapshots — do not edit them.

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

There is no automated test harness. To verify a tool actually works, paste its
data block and HTML block into the two editors of a Perchance generator and
exercise it; for the character/fixer tools, confirm the downloaded `.json`
imports cleanly into ACC. Treat the "Minimal checklist" in `char-info` §11 as
the acceptance checklist.
