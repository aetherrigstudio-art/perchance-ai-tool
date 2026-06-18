# char-wiz-html — Implementation-Ready Issue Tracker

> **File:** `char-wiz-html` (2302 lines as of wizard-html-panel-13.txt)
> **Branch:** `claude/phase3-a11y-api`
> **Last audited:** 2026-06-18 (30-pass audit + Phase 2A/B/C applied)

> **Top Priority (new 2026-06-18):** Perchance API integration
> See `ai-workspace/perchance-api-research.md` — `/api/downloadGenerator` is stable
> and callable without a browser. CI verification, `stopSequences`, and `pip install
> perchance` end-to-end tests are the next concrete steps.

> **Quick wins remaining:**
> 1. **`refineWrap()` directive** (High, line 545) — replace one string literal; improves every re-roll.
> 2. **`SCENE_DIRECTIVE` doubled** (XS, line 366) — `sceneMode:"both"` writes it to both fields; omit from `generalWritingInstructions`.
> 3. **`stopSequences` exploit** (XS, data panel) — set `"=== END ==="` for deterministic output termination.

---

## COMPLETED ✅

These were addressed in Phase 2A/B/C (branch reconciliation 2026-06-18):

| Issue | Fix Applied |
|---|---|
| `save()` fires on every keystroke (no debounce) | Phase 2A: 500ms debounce, `_saveTimer`, line 804 |
| `updateStatus()` runs full DOM parse every keystroke | Phase 2A: 50ms debounce, line 935 |
| `uniqueId()` collides in same-millisecond loops | Phase 2A: monotonic `Date.now()*10000 + ++_idSeq`, line 1677 |
| `{{char}}:` parse breaks on whitespace | Phase 2C: `/^\{\{char\}\}\s*:/i` regex, line 2083 |
| `getSection()` returns "" with no warning | Phase 2B: `console.warn`, line 462 |
| `parseChar()` defaults name to "Character" silently | Phase 2B: explicit NAME warn, line 485 |
| `parseLore()` silently guesses trigger keys | Phase 2B: `console.warn` on fallback, line 1789 |
| `downloadTextFile()` leaks ObjectURL on exception | Phase 2B: try/finally, line 1897 |
| Prose VOCAB was ornate/purple | Refinement branch: grounded directive, line 419 |

---

## NEW — Perchance API Integration

| Task | Effort | Notes |
|---|---|---|
| Map `/api/downloadGenerator` response shape | XS | curl against live generator; document in AUTOMATION.md |
| GitHub Actions CI: verify data panel imports | S | fetch char-wiz-dat via API, assert `{import:ai-text-plugin}` resolves |
| `pip install perchance` session-start hook + `test/generation.py` | S | end-to-end: TextGenerator → assert `=== NAME ===` in output |
| Exploit `stopSequences` in data panel settings | XS | set `"=== END ==="` for deterministic termination; remove length-hack prompts |
| Update char-info for September 2025 ACC changes | M | Main Prompt Template editor, creativity slider, emdash fix, improved summarization |
| fetch-plugin for dynamic lorebooks | M | host lorebook on GitHub Pages; pull live from generator |

---

## NEW — Content-authoring quality (research synthesis 2026-06-18)

From `ai-workspace/research-synthesis-2026-06-18.md` (petra's prose §2.2.2 / §3.3 +
Part 2.5-C, all `✓verified`). These change what char-wiz's prompts **emit**, not the
schema — high quality-per-effort, no export-shape risk. Line refs are approximate
against `wizard-html-panel-24` (re-confirm before editing).

| Task | Effort | Where | Fix Summary |
|---|---|---|---|
| Lore entries not self-contained | S | lore-gen prompt in `buildWizardPrompt` / `withLore()` | Instruct: each entry stands alone, **repeat the subject's proper name** (no "he"/"the above" — AI retrieves entries in isolation), order-independent |
| Lore over-split into fragments | S | lore-gen prompt | Instruct: **merge related facts**, ~120–200 words per entry; the AI often won't retrieve all entries on a subject |
| Character info leaking into lore | XS | lore-gen prompt + grader | Keep character facts in the **description/role**, not lore (description is the reliable channel); grader flag if lore entries describe the main character |
| `reminderMessage` unconstrained | S | reminder generation in `buildWizardPrompt` | Restrict generated reminder to **only four** kinds: conversational style, quirks, custom-race physiology, one very strong belief. Blank is allowed |
| No explicit RP formatting directive | XS | prompt binding-rules (~419 `VOCAB`) | Add: "asterisks around actions, quotes around speech, typical roleplay style" (petra Part 2.5-C) |
| `shortcutButtons` manual-entry only | S | "Quick reply buttons" card | Offer petra's verified defaults as one-click presets: `🖼️ Image → "/image --num=1"` (autoSend); `📜 Narrator → "/nar …"` (no autoSend) |
| Image-Style tool ignores petra's prompt formula | S | `buildStylePrompt` (`image-style-builder-html-panel-8.txt`) | Offer her template `[style] drawing of [subject]. [build/expr]. [hair]. [clothing]. [eyes]. [background], [time], [weather].`; note Bing/DALL-E ~480-char cap |

---

## CRITICAL

| Issue | Effort | Line | Fix Summary |
|---|---|---|---|
| Generation blindly overwrites live user edits | S | data-panel `onChunk` | Add `window.generating` flag; skip write if textarea has `data-user-edited` attr set by `input` event |
| No structured form fields — all textarea blobs | L | throughout | Add named `<input>` fields for name, age, role, personality tags; bind to state object |
| No onboarding / guided first-load flow | L | all sections | Add collapsible "Start here" banner + section-level tooltips; hide advanced sections behind "Show more" |

---

## HIGH

| Issue | Effort | Line | Fix Summary |
|---|---|---|---|
| Color picker hidden behind double gate | S | 196 | Move color swatches to always-visible export summary row, not inside collapsed advanced card |
| Output textarea overwrite race (mid-generation user edit) | S | `onChunk` | Same `data-user-edited` guard as CRITICAL row above — shared fix |
| `refineWrap()` weak directive | XS | 545 | Replace string with `"Apply the ADJUSTMENT decisively; rewrite whatever conflicts; keep what works."` |
| Re-roll UX opaque — dropdown only, no per-field dice | M | re-roll UI | Add 🎲 icon button beside each major output textarea; wire to existing roll logic |
| `userCharacter` never populated with persona data | S | ~1740 | After persona generation, write parsed fields into `userCharacter` object before export |
| Section order buries Opening after 6 sections | S | section layout | Reorder: Scenario → Main → Persona → Opening → Extras → Lore → Relationships → Consistency |
| Image errors silently swallowed | S | 6+ try-catch blocks | Add `catch(e){ showStatus("Image error: "+e.message, "error"); }` to each image try-catch |
| `SCENE_DIRECTIVE` doubled in both export fields | XS | 366 | For `sceneMode:"both"` append only to `reminderMessage`; omit from `generalWritingInstructions` |
| `charSeed()` sensory/verb injection unsafe | S | 443 | If SEED pool element contains newline or "===", output parsing breaks; sanitize pool values |

---

## MEDIUM

| Issue | Effort | Line | Fix Summary |
|---|---|---|---|
| 73 inline `style=` attributes, no CSS vars or dark mode | L | throughout | Extract to `<style>` block; add `--accent`, `--bg`, `--surface` CSS custom properties |
| `.out` textarea hardcoded `220px` height | XS | ~2248 | Replace with `min-height:220px; height:auto` or `rows` attr |
| `renderVoiceList()` called on every `load()` even when TTS off | S | ~901 | Guard with `if(!immersion.tts) return;` at function entry |
| `VOCAB` lacks explicit cliché suppression | XS | 419 | Append `"Avoid comparisons to honey, silk, smoke, velvet as default descriptors."` |
| `alert()` used for all validation (15+ sites) | M | multiple | Replace with `showStatus(msg, "error")` inline banner pattern |
| Image tab outputs never auto-populate characters | M | image tab | On image generation success, write URL into matching character's avatar field |
| No progressive validation — only at export | M | `validateCast()` | Add lightweight field-level checks (`blur` event) for required fields |
| Share link is main-character-only | M | ~2164 | Serialize full cast array into share payload |
| `IMMERSION_FN` serialized via `.toString()` | M | ~1073 | Fragile to minification/build tools; document clearly or refactor to string template |
| EMO_KEYWORDS English-only heuristic | S | ~1063 | Add note in UI; or make keyword list user-configurable |
| `buildSceneCode` template replacement unsafe | S | ~1056 | If wardrobe JSON contains `__WARDROBE__` literal, output is corrupted; use a unique delimiter |
| wardrobeMap embedded in customCode | S | ~1545 | Large wardrobe inflates customCode; consider external reference or size cap |
| `SCENE_DIRECTIVE` 365 chars repeated per character | XS | 366 | Trim or reference once in system message instead of per-character |
| `withRels()` appends relationship text with no size cap | S | ~1022 | Cap relationship text at N chars; prevents `roleInstruction` overflow past ACC context limits |
| Zero accessibility attributes | M | throughout | `aria-label` on all buttons/inputs; `aria-live="polite"` on `#busyHint` and `#status` |
| No mobile keyboard hints | S | throughout | `inputmode="numeric"` on number inputs, `autocorrect="off"` on textareas |
| `onWizFinish()` calls `save()` unconditionally | XS | 729 | Skip if no state changed, or rely on debounced save from textarea `onInput` |
| `validateCast()` only checks NAME + ROLE INSTRUCTION + FIRST MESSAGE | S | ~938 | Add checks for APPEARANCE, TAGLINE, WRITING INSTRUCTION |
| `load()` registers 30+ event handlers every call | M | ~823 | Guard with `handlersAttached` flag; only attach once |

---

## LOW

| Issue | Effort | Line | Fix Summary |
|---|---|---|---|
| Global mutable state in script tag, no encapsulation | M | top of `<script>` | Wrap in IIFE or namespace object |
| `setSafeHints()` covers only 2 of ~30 placeholder fields | S | ~2227 | Extend to cover all `.out` textareas with meaningful safe placeholder strings |
| Style adj inputs lose focus on mobile Safari keyboard dismiss | S | adj inputs | Add `touchend` handler to re-focus; set `inputmode="text"` |
| `crc32` implemented from scratch inline | XS | ~1959 | Works fine; add a comment explaining why (no crypto dependency allowed in Perchance) |
| No viewport meta tag | XS | n/a | Document as Perchance constraint in `CLAUDE.md`; no fix available within the tool |

---

## Missing Features (not bugs, but user-impacting gaps)

| Feature | Priority | Notes |
|---|---|---|
| Per-field dice/randomize buttons | High | `doReroll()` exists; just needs 🎲 button UI per field |
| Onboarding / "Start here" banner | High | Zero guidance on first load |
| Structured character data-sheet form | High | Name, age, role, personality tags as `<input>` fields |
| `userCharacter` populated with persona | High | Schema verified field; builder ignores it |
| `startWith` priming in data panel | Medium | Set `"=== NAME ===\n"` to guarantee first section header present |
| Full-cast share link | Medium | Currently main character only |
| Import round-trip without builderSource | Medium | `reconstructFromRows()` is "approximate" fallback |
| Test-drive harness / run-all preset | Medium | No way to validate full pipeline end-to-end; see Phase 5 plan |
| Progressive section validation | Medium | Only validates at export |
| Image auto-populate from image tab | Medium | Images generated on Image tab never flow to characters |
| Non-English emotion keywords | Low | TTS/immersion EMO_KEYWORDS are English-only |
