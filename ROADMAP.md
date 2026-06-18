# ROADMAP — unimplemented ACC character/user fields & settings

Tracks the AI Character Chat (ACC) character-row fields and user/persona settings
the **AI Character Set Builder** (`char-wiz-html` / `char-wiz-dat`) does **not**
yet meaningfully populate, prioritized for future work.

**Method & sources.** Field names and defaults are taken verbatim from the
wizard's `defaultTemplate()` and `char-info` §4 (no invented fields). "Verified"
traces to `char-info` (from a real export/docs) or a cited Perchance doc;
"unverified" follows `char-info` §9 ("leave blank unless you know their
purpose"). Docs: [AI Character Chat Docs](https://perchance.org/ai-character-chat-docs),
[Complete Guide](https://perchance.org/6b6c5aeogh),
[Shortcut buttons thread](https://lemmy.world/post/24187801),
[Text to Speech Plugin](https://perchance.org/text-to-speech-plugin).

Each entry: **field · default · what it does · source · approach · risk.**

## ⮕ Recommended build order (2026-06-18 optimization research)
From the deep-research synthesis in `findings.md` / `task_plan.md` Phase 7:
1. ✅ **SHIPPED** — **`stopSequences: ["=== END ==="]`** (#15). The data panel
   already wired `stopSequences() => window.WIZ_STOP_SEQUENCES || ["=== END ==="]`,
   so no data-panel change was needed; activated it by appending a terminal
   `=== END ===` instruction to the character + persona multi-section prompts so
   the model emits the stop marker. (Live-confirm it improves termination.)
2. ✅ **SHIPPED** — **`shortcutButtons`** (#1) — "Quick reply buttons" UI in the
   presentation card; exported per AI character as `{name, message,
   insertionType:"replace", autoSend, clearAfterSend, type:"message"}`. Empty `[]`
   default; persona gets none; partial entries filtered.
3. **Richer `messageWrapperStyle`** (#7) — *still deferred* until rendering is
   confirmed in-app; extend only with a strict `#hex`-style validator
   (CSS-injection surface). The per-character `#hex` color is already shipped.

**Also tracked (infra, not ACC fields — see `task_plan.md` Phases 5–6):**
- ✅ **SHIPPED — Loader integrity** (was HIGH): `wizard-loader-html.txt` now
  fetches the committed `char-wiz-html.sha256` and compares it to a
  `crypto.subtle.digest` of the injected bytes. **Soft-fail** — on mismatch it
  shows a warning banner but never blocks (the loader is paste-once; a hard fail
  would brick the generator). `scripts/gen-hash.sh` + `.githooks/pre-commit`
  (enabled via `core.hooksPath`, auto-set by `session-start.sh`) keep the digest
  in lock-step; CI fails on drift.
- ✅ **SHIPPED — CI**: `.github/workflows/verify.yml` runs `smoke.mjs` +
  `grade-generation.mjs` + `node --check` on the wizard `<script>` + the
  hash-sync check on push/PR to `main`. (`ci-verify.sh` stays local/manual — it
  compares against CDN-lagged GitHub raw and would flake in CI.)

## Already populated (not on the roadmap)

`name`, `roleInstruction`, `reminderMessage`, `generalWritingInstructions`,
`metaTitle`, `metaDescription`, `imagePromptPrefix/Suffix/Triggers`,
`initialMessages`, `loreBookUrls` (main), `customData.isPersona/builderSource/
refImage/memory`, `maxTokensPerMessage` (800 for AI chars), `customCode`
(scene/immersion), `id`/`uuid`/`creationTime`/`lastMessageTime`, `$types`.

Reusable builders to extend: `defaultTemplate()`, `characterRow()`, `withLore()`,
`withRels()`, `withPersona()`, `immersionConfig()`, plus the builder
UI + `save`/`load`/`builderSnapshot`/`resetAll` state pattern (all in
`char-wiz-html`), and `genCharacterImage()` (data panel).

---

## Tier 1 — High value, verified, safe to populate (build first)

> **Batch A shipped** (PR #1): items **2** (`avatar.shape`/`avatar.size`),
> **3** (default `scene.background.url`/`scene.music.url`), and **4** (static
> `avatar.url` from a generated portrait) are implemented as the opt-in,
> global-default **"Character presentation"** card (`advanced` state →
> `characterRow()`), with smoke-test regressions.
>
> **Batch B shipped** (PR #1): a "Model & memory tuning" card (`tuning` state)
> covers items **5** (`temperature`, `maxTokensPerMessage`, `maxParagraphCountPerMessage`)
> and **6** (`autoGenerateMemories` none/v1), PLUS the now-confirmed
> **context-tracking** fields (`contextInfo*`/`detailedContextInfo*`, basic/detailed,
> with best-practice default prompts generalised from a real export) and a
> **writing preset** selector (built-in / petrafied-acc `@roleplay1`/`@roleplay2`).
> Off by default; smoke regressions cover off-unchanged, on-applied, persona-untouched.
> The scene-image instruction also adopts Subject→Action→Setting ordering.
> **Batch C partially shipped** (2026-06-18 optimization): item **1**
> (`shortcutButtons`) is implemented as the "Quick reply buttons" sub-card in the
> presentation card → exported per AI character in `characterRow()`. Remaining:
> richer `messageWrapperStyle` (#7), still deferred until confirmed in-app.

### 1. `shortcutButtons` · `[]` — ✅ SHIPPED (2026-06-18)
- **What:** Buttons rendered above the reply box for common actions.
- **Source:** Verified (docs). Schema: `{ name, message, autoSend,
  insertionType: "replace", clearAfterSend, type: "message" }`; wrapping reply
  text in angle brackets auto-highlights it as an editable placeholder.
- **Shipped:** "Quick reply buttons" sub-card in the "Character presentation"
  card — a global list (name / message / auto-send / clear-after-send) on
  `advanced.shortcutButtons`, exported per **AI** character in `characterRow()`
  (persona gets none; entries missing a label or message are filtered out).
- **Not done:** the optional "AI-suggest" that proposes scenario-appropriate
  actions — left as a future nicety; buttons are entered manually.
- **Risk:** Low. Cosmetic/UX; empty array is the safe default.

### 2. `avatar.shape` / `avatar.size` · `"square"` / `1`
- **What:** Avatar shape (square vs circle) and scale.
- **Source:** Verified (docs list "change avatar size and shape").
- **Approach:** Per-character select/slider; set on the row's `avatar`.
- **Risk:** Low.

### 3. Static `scene.background.url` / `scene.music.url` · `""` / `""`
- **What:** A default chat background image and ambient music for the character
  — applies even when the immersion pack is off.
- **Source:** Verified (docs list "set a chat background, add background music").
- **Approach:** Reuse `genCharacterImage()` to make a background; URL field for
  music (free/no-signup hosting). Set `row.scene.background.url` /
  `row.scene.music.url`. Complements immersion's *dynamic* keyword swapping.
- **Risk:** Low. (Music URL must be a direct/playable link.)

### 4. Static `avatar.url` · `""`
- **What:** Set a generated portrait as the actual avatar. Today only
  `customData.refImage` is set (by immersion); non-immersion exports still show
  ACC's default avatar.
- **Source:** Verified field; `char-info` §4 notes a URL is needed (we now
  generate one).
- **Approach:** When a portrait/expression set is generated, offer "use as
  avatar" → write `avatar.url` directly.
- **Risk:** Low.

### 5. Sampling / model controls — `temperature` (`0.8`), `maxTokensPerMessage`, `modelName` (`"perchance-ai"`)
- **What:** Response randomness, length cap, model.
- **Source:** Verified fields (values confirmed).
- **Approach:** Advanced builder controls (temperature slider, reply-length
  select). Keep current defaults; only emit non-defaults. Leave `modelName`
  default unless ACC exposes alternatives in-app.
- **Risk:** Low.

### 6. Memory / context controls — `autoGenerateMemories` (`"none"`), `fitMessagesInContextMethod` (`"summarizeOld"`), `maxParagraphCountPerMessage` (`0`)
- **What:** Whether ACC auto-builds memories, how it fits old messages into
  context, and a per-message paragraph cap.
- **Source:** Verified fields; docs note disabling summaries/memories speeds
  replies (at some quality cost).
- **Approach:** Advanced "speed vs quality" toggles; tie `autoGenerateMemories`
  to the immersion memory feature so they don't fight.
- **Risk:** Low–medium. Confirm accepted values for `autoGenerateMemories`
  beyond `"none"` in-app.

### 7. `messageWrapperStyle` · `""`  — **partially shipped (per-character color)**
- **What:** Per-character message/bubble styling (ACC "Message Styling" = CSS).
- **Source:** Verified (docs "Message Styling" with CSS examples); exact field
  format unconfirmed (perchance docs 403) — treated as inline-style declarations.
- **Shipped:** the "Character presentation" card now sets a **per-character static
  chat color** → `messageWrapperStyle: "background-color: #hex;"`, with a strict
  `#hex` validator (rejects anything else, no CSS injection). Confirm the exact
  rendering in-app.
- **Remaining:** richer bubble themes / fonts / borders; confirm the field format.
- **Risk:** Low–medium.

---

## Tier 2 — Persona / user-side & sharing

### 8. `userCharacter.avatar` · `{}` (+ persona portrait)
- **What:** Give the user's persona its own avatar.
- **Source:** Verified field; docs mention customizing the user's name & avatar.
- **Approach:** Generate a persona portrait via `genCharacterImage()` (we already
  build the persona row) and populate `userCharacter.avatar`.
- **Risk:** Low; confirm exact persona-avatar location in-app.

### 9. `markForPersona` / `userCharacterSelection` / `autoUpdatePersona` · `"no"` / `""` / `"no"`
- **What:** Persona-linking / auto-update semantics.
- **Source:** Verified fields; **behavior unverified** (`char-info` §9).
- **Approach:** Validate in-app before wiring; likely a single "this is my
  persona / keep it updated" toggle.
- **Risk:** Medium — don't populate blindly.

### 10. `customData.PUBLIC` · unset
- **What:** Metadata shared via character-share URLs.
- **Source:** Documented in `char-info` §4 (`customData.PUBLIC`).
- **Approach:** Store a safe public blurb/tags; never secrets.
- **Risk:** Low–medium. Treat as public; exclude `builderSource`/secrets.

### 11. `messageInputPlaceholder` · `""`
- **What:** Custom placeholder text in the reply box.
- **Source:** Verified field.
- **Approach:** Optional builder text field.
- **Risk:** Low.

---

## Tier 3 — Unverified; investigate & confirm before populating

`char-info` §4: "leave blank unless you know their purpose"; §9 marks semantics
unverified. **Action = controlled in-app experiment first, not blind population.**

### 12. `roleplay1Instructions` / `roleplay2Instructions` · `""`
- Purpose unknown; `char-info` warns stuffing them degrades output. Investigate
  what ACC's UI writes here before using.

### 13. `vitalWritingInstructions` / `vitalRoleInstructions` · `""`
- Same as above — likely "always-injected" variants; confirm.

### 14. `contextInfo` / `contextInfoPrompt` / `contextInfoToggle` / `detailedContextInfo` / `detailedContextInfoPrompt` / `detailedContextInfoToggle` · `""` / `"no"`
- Possibly a structured-context / RAG channel (a `*Prompt` describing what to
  extract, a `*Toggle` enabling it, and the extracted `contextInfo` text).
- **Lead (unconfirmed):** community reports a Perchance "2026 update" adding
  structured **Lore / World / NPC / Instruction** boxes for long-term
  consistency — these may surface in-app as the `contextInfo` / `detailedContextInfo`
  pair. Confirm against a real export before wiring.

### 15. `stopSequences` · (unset) — ✅ SHIPPED (2026-06-18)
- **Research update (2026-06-18):** The `ai-text-plugin` accepts a `stopSequences`
  array in the data panel's `settings` block. Setting `["=== END ==="]` gives
  deterministic output termination.
- **Shipped:** the data panel already wired
  `stopSequences() => window.WIZ_STOP_SEQUENCES || ["=== END ==="]`, so no
  data-panel change was needed. Activated it on the HTML side by appending a
  terminal `=== END ===` instruction to the character + persona multi-section
  prompts (`charPromptCtx`/`personaPromptCtx`) so the model emits the marker and
  generation stops cleanly. stopSequences excludes the marker from the output, so
  the grader's no-leak check still holds.
- **Still open (live test):** confirm on Perchance that this improves termination
  vs. the prompt's existing length guidance; if so, the length-control wording
  could be trimmed further. Also settable on the exported character row (ACC-side)
  — untested.
- **Priority upgraded to Medium** — implement in data panel alongside the CI work.

### 16. Low-priority / mostly leave-default
- `writingFormat` · `""` — investigate.
- `petraCustomLorebookUsageOptions` · `"default"` — lorebook usage mode; confirm
  alternatives.
- `petraCustomSecretInformation` · `""` — appears legacy/internal.
- `systemCharacter.avatar` · `{}` — narrator/system avatar.
- `metaImage` · `""` — could take the generated portrait (share-card image).
- `folderPath` · `""` — could organize multi-character exports into folders.
- `streamingResponse` · `true` — leave on.

---

## Notes & guardrails

- Keep honoring `char-info` §9: all 9 Dexie tables present, high-entropy
  `uuid`/`id`, no `threads`/`messages` seeding, no blind use of unverified fields.
- Most Tier 1/2 items are simple additions to `defaultTemplate()` /
  `characterRow()` plus a builder control and a `save`/`load` field; gate richer
  ones (shortcut buttons, message CSS) behind advanced UI so default exports stay
  unchanged.
- Tier 3 requires a real ACC export/in-app check first — capture findings back
  into `char-info` when confirmed.

## Research status

**Field catalog: complete.** All 51 character-row fields in the wizard's
`defaultTemplate()` are accounted for here — populated (listed above) or on the
roadmap. Verified vs. unverified follows `char-info` and cited Perchance docs.

**Tier-3 semantics: web research exhausted (for undocumented fields).** Many
fields are now confirmed from real exports (see Tier-3 section below). Remaining
unknowns (`vitalWritingInstructions`, `vitalRoleInstructions`, `writingFormat`)
cannot be resolved remotely — confirm via in-app A/B test or inspecting a real
export that populates them.

**Perchance API correction (2026-06-18):** The statement "perchance.org 403s
automated fetch" is **wrong for the API layer** — `/api/downloadGenerator` is
stable and callable without a browser. See `ai-workspace/perchance-api-research.md`.
This opens CI verification of the data panel without a browser.

**September 2025 ACC updates** (confirmed via research — not yet in char-info):
- **Main Prompt Template editor** — users can customize the system prompt wrapper
  around character definitions. Our `roleInstruction + reminderMessage +
  generalWritingInstructions` triple may interact differently with custom templates.
- **Creativity slider** — maps to temperature; users can override the
  `temperature: 0.8` we export.
- **Emdash fix** — model no longer auto-inserts em-dashes.
- **Improved summarization** — `fitMessagesInContextMethod: "summarizeOld"` now
  works better; no change needed on our end.
- **`customCode` expanded** — now supports internet access, 3D/VR avatar, voice,
  JavaScript and Python execution. The immersion `customCode` block is more
  powerful than char-info describes.
- **Source:** `perchance.org/ai-character-chat-docs` (confirmed 2026-06-18 via
  deep research; direct fetch blocked by Cloudflare).
These updates are not yet reflected in `perchance-character-creation-3.md`
(char-info). A web-search update pass against the docs page is the correct fix.

---

## Generation-quality enhancements (shipped — not fields)

Beyond character-row fields, these prompt/quality features are now live in the
wizard (HTML), with smoke regressions in `test/smoke.mjs`:

- **Richer `{a|b|c}` variety pools** (tone/trait/speech/vibe/lore + sensory/verb/
  pacing) expanded via `roll()`.
- **`VOCAB` directive** (strong nouns, vivid verbs, sensory adjectives, varied
  rhythm) woven into generation prompts AND baked into exported
  `generalWritingInstructions` (improves in-chat prose too).
- **4-hour pool rotation** — each pool keeps a rotating ~60% active subset that
  swaps every 4h, derived deterministically from the clock (`rotatePool` /
  `fourHourBucket`). No infra, no agent, no commits.
- **Perchance word-bank integration** — data panel imports
  `{adjective|noun|verb}` and exposes `wordBank()`; HTML pulls a few fresh words
  **cached per 4h bucket** and offers them as optional "use only if it fits"
  flavour. Fully optional / self-healing.

**Future:** optional Claude/CI job to introduce genuinely *new* words over time
(deferred — the in-tool rotation covers freshness without the cost/dependency).

## Interoperability with petrafied-acc / ACC

Where the user chats: **petrafied-acc** (Petra's fork of Perchance AI Character
Chat). It reads the same `chatbot-ui-v1` Dexie import format the wizard exports,
and supports `?data=Name~uuid.gz` share-link loading. Sources:
[petrafied-acc](https://perchance.org/petrafied-acc),
[share-link example](https://perchance.org/petrafied-acc?data=Emry~f4c47deac8860e27def76f03f2fc231d.gz),
[same-origin policy](https://perchance.org/perchance-faq).

**Shipped / works today**
- **JSON import** — wizard combined/separate export → petrafied-acc import button.
- **Schema-learning** (`learnSchema()`) — paste a real petrafied-acc export into
  "read real schema from this file" → exports become byte-compatible with the
  user's exact build (incl. Petra's custom fields). The strongest connector.
- **Round-trip editing** (`importBack()` / `customData.builderSource`).
- **Lorebooks by URL** (`loreBookUrls`), **in-chat `customCode`** (immersion),
  and the Petra-aware schema (`petraCustom*` fields already present).

**Shipped — one-click share link**
- The wizard now builds the main character in petrafied-acc's exact share format
  (`{ addCharacter:{…}, quickAdd:true }`, learned from a real export), gzips it
  (`CompressionStream`), uploads via the data panel's `uploader =
  {import:upload-plugin}` → `uploadShare()`, and assembles a
  `perchance.org/<gen>?data=Name~uuid.gz` link (generator configurable; default
  `petrafied-acc`). Best-effort (link-format reconstruction unverified live);
  the raw uploaded file URL is also surfaced as a fallback. `shareMainRow` /
  `rowToShare` / `buildShareJSON` / `shareLink` / `genShareLink` in
  `char-wiz-html`; smoke regressions cover the format + link assembly.

**Still to build**
1. **Confirm TavernAI PNG import** support in petrafied-acc (we already export
   the cards).
2. **Embed the persona** into the share's `userCharacter` (real exports do this).

### Tier-3 field semantics — CONFIRMED from a real petrafied-acc export

Inspecting a live share file (`user.uploads.dev/file/…gz`) resolved several
previously-unverified fields (see Tier 3 above — these can now be implemented):
- **`roleplay1Instructions` / `roleplay2Instructions`** are named writing-instruction
  presets: `generalWritingInstructions` can be `"@roleplay1"` to pull in
  `roleplay1Instructions`. So they ARE used (via `@roleplayN` references).
- **`contextInfo` family** is a real structured-context channel: `contextInfoPrompt`
  / `detailedContextInfoPrompt` hold extraction prompts, `*Toggle` enables them.
- **`autoGenerateMemories`** takes `"v1"` (not just `"none"`) to enable memory.
- **`avatar.shape`** accepts `"portrait"` (alongside square/circle); `avatar.size`
  can be e.g. `1.5`.
- **`messageWrapperStyle`** is inline CSS (e.g. `"backdrop-filter: blur(4px);
  border-radius:5px; …"`) — confirms our per-character color format.
- **`shortcutButtons`** items: `{name, message, insertionType:"replace", autoSend,
  clearAfterSend, type:"message"}`.
- **`userCharacter`** embeds the persona `{avatar, roleInstruction, reminderMessage}`;
  **`systemCharacter`** is `{avatar, name}`.
- **`scene.background.url` / `scene.music.url`** confirmed in active use (hosted URLs).

**Hard limit (not possible)**
- No live shared-database link: the wizard and petrafied-acc run on separate
  Perchance subdomains/origins, so same-origin policy blocks direct writes into
  petrafied-acc's IndexedDB. Seamless-no-file would require the builder to live
  *inside* the petrafied-acc generator (needs control of its code).
