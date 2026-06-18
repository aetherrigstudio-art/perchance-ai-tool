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

### 1. `shortcutButtons` · `[]`
- **What:** Buttons rendered above the reply box for common actions.
- **Source:** Verified (docs). Schema: `{ name, message, autoSend,
  insertionType: "replace", clearAfterSend }`; wrapping reply text in `<...>`
  auto-highlights it as an editable placeholder.
- **Approach:** Builder UI to add/edit buttons; an "AI-suggest" that proposes
  scenario-appropriate actions ("continue", "describe the room", `/image`,
  "advance time"). Write the array in `characterRow()`.
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

### 7. `messageWrapperStyle` · `""`
- **What:** Per-character message/bubble styling (ACC "Message Styling" = CSS).
- **Source:** Verified (docs "Message Styling" with CSS examples).
- **Approach:** A few preset bubble themes + optional custom CSS; write the field.
- **Risk:** Low–medium. Validate/escape custom CSS; offer safe presets first.

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

### 14. `contextInfo` / `contextInfoPrompt` / `contextInfoToggle` / `detailedContextInfo*` · `""` / `"no"`
- Possibly a structured-context / RAG channel. Confirm how ACC populates and
  uses these (and the toggles) before wiring.

### 15. `stopSequences` · (unset)
- Settable via the `oc` API and the text plugin. Expose only if a concrete need
  arises (e.g. preventing the model from writing the user's lines).

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
