# char-wiz-html — Implementation-Ready Issue Tracker

> **30-Minute Wins** (highest impact, lowest effort)
> 1. **`save()` debounce** (Critical, line 761) — wrap `localStorage.setItem` in a 300ms `setTimeout`; eliminates per-keystroke main-thread blocks with ~5 lines.
> 2. **`{{char}}:` regex fix** (High, line 2038) — one-line swap: `indexOf("{{char}}:")` → `/\{\{char\}\}\s*:/i.test(...)`. Zero regression risk.
> 3. **`refineWrap()` directive rewrite** (High, line 521) — replace one string literal. Directly improves every re-roll/refine output quality.

---

## CRITICAL

| Issue | Effort | Line Ref | Fix Summary |
|---|---|---|---|
| `save()` fires on every keystroke (no debounce) | XS | 761, 824–842 | Add `clearTimeout(saveTimer); saveTimer = setTimeout(()=>{ localStorage.setItem(...) }, 300)` wrapper |
| Generation blindly overwrites live user edits | S | data-panel `onChunk` | Add `window.generating` flag; skip write if textarea has `data-user-edited` attr set by `input` event |
| No structured form fields — all textarea blobs | L | throughout | Add named `<input>` fields for name, age, role, personality tags; bind to state object |
| No onboarding / guided first-load flow | L | all sections | Add collapsible "Start here" banner + section-level tooltips; hide advanced sections behind "Show more" |

---

## HIGH

| Issue | Effort | Line Ref | Fix Summary |
|---|---|---|---|
| Color picker hidden behind double gate | S | 196 | Move color swatches to always-visible export summary row, not inside collapsed advanced card |
| Output textarea overwrite race (mid-generation user edit) | S | onChunk | Same `data-user-edited` guard as CRITICAL row above — shared fix |
| `charSeed()` purple prose clause | XS | 439 | Delete `"Let " + rotatePool(SEED.sensory) + " " + rotatePool(SEED.verb) + " the scene."` segment |
| `refineWrap()` weak directive | XS | 521 | Replace string with `"Apply the ADJUSTMENT decisively; rewrite whatever conflicts; keep what works."` |
| Re-roll UX opaque — dropdown only, no per-field dice | M | re-roll UI | Add 🎲 icon button beside each major output textarea; wire to existing roll logic |
| `{{char}}:` parse breaks on whitespace | XS | 2038 | Replace `indexOf("{{char}}:")` with `/\{\{char\}\}\s*:/i.test(line)` |
| `userCharacter` never populated with persona data | S | 1644 | After persona generation, write parsed fields into `userCharacter` object before export |
| Section order buries Opening after 6 sections | S | section layout | Reorder: Scenario → Main → Persona → Opening → Extras → Lore → Relationships → Consistency |
| Image errors silently swallowed | S | 6+ try-catch blocks | Add `catch(e){ showStatus("Image error: "+e.message, "error"); }` to each image try-catch |
| `SCENE_DIRECTIVE` doubled in both export fields | XS | 365 | For `sceneMode:"both"` append only to `reminderMessage`; omit from `generalWritingInstructions` |
| `getSection()` returns "" with no warning | S | 443–453 | If label not found, log a console warning and return a sensible default, not empty string |
| `parseChar()` defaults name to "Character" silently | XS | 468 | If NAME section missing, flag in importStatus, don't silently export "Character" |
| `charSeed()` sensory/verb injection unsafe | S | 439 | If SEED pool element contains newline or "===", output parsing breaks; sanitize pool values |

---

## MEDIUM

| Issue | Effort | Line Ref | Fix Summary |
|---|---|---|---|
| 73 inline `style=` attributes, no CSS vars or dark mode | L | throughout | Extract to `<style>` block; add `--accent`, `--bg`, `--surface` CSS custom properties |
| `.out` textarea hardcoded `220px` height | XS | inline style 2248 | Replace with `min-height:220px; height:auto` or `rows` attr |
| `renderVoiceList()` called on every `load()` even when TTS off | S | 901 | Guard with `if(!immersion.tts) return;` at function entry |
| `VOCAB` lacks explicit cliché suppression | XS | 418 | Append `"Avoid comparisons to honey, silk, smoke, velvet as default descriptors."` |
| `alert()` used for all validation (15+ sites) | M | multiple | Replace with `showStatus(msg, "error")` inline banner pattern |
| Image tab outputs never auto-populate characters | M | image tab | On image generation success, write URL into matching character's avatar field |
| No progressive validation — only at export | M | validateCast() | Add lightweight field-level checks (`blur` event) for required fields |
| Share link is main-character-only | M | 2164 | Serialize full cast array into share payload |
| `IMMERSION_FN` serialized via `.toString()` | M | 1073 | Fragile to minification/build tools; document clearly or refactor to string template |
| EMO_KEYWORDS English-only heuristic | S | 1063–1068 | Add note in UI; or make keyword list user-configurable |
| `buildSceneCode` template replacement unsafe | S | 1056–1058 | If wardrobe JSON contains `__WARDROBE__` literal, output is corrupted; use a unique delimiter |
| wardrobeMap embedded in customCode | S | 1545 | Large wardrobe inflates customCode; consider external reference or size cap |
| `SCENE_DIRECTIVE` 365 chars repeated per character | XS | 365 | Trim or reference once in system message instead of per-character |
| `SCENE_SHOTS_TEMPLATE` ignores user genre/style selection | S | 1042 | Interpolate `styleNotes` or selected style tag into the scene-shot instruction inside `buildSceneCode()` |
| `IMMERSION_FN` serialized via `.toString()` embeds ~1184 lines per export | M | 1073 | Document the serialization approach with a comment; consider a pre-minified string constant to decouple from source formatting |
| `withRels()` appends relationship text with no size cap | S | 1022–1025 | Cap relationship text at N chars or summarize if cast is large; prevents `roleInstruction` overflow past ACC context limits |
| Zero accessibility attributes across 2256 lines | M | throughout | Add `aria-label` to all buttons and major inputs; add `aria-live="polite"` to `#busyHint` and `#status` |
| No mobile keyboard hints on any input or textarea | S | throughout | Add `inputmode="numeric"` to number inputs, `inputmode="url"` to URL inputs, `autocorrect="off" autocapitalize="off"` to all textareas |
| `onWizFinish()` calls `save()` unconditionally after every generation | XS | 706 | Skip if no state changed, or rely on the debounced save already triggered by textarea `onInput` |
| `getSection()` fallback in `rerollBuf` uses raw LLM text on header-not-found | S | 692 | If fallback triggered, strip leading lines until first non-empty non-header line before using text |
| `validateCast()` only checks NAME + ROLE INSTRUCTION + FIRST MESSAGE | S | 938–963 | Add checks for APPEARANCE, TAGLINE, WRITING INSTRUCTION; warn on export if missing |
| `load()` registers 30+ event handlers every call; stacks on repeated calls | M | 823–842 | Guard with a `handlersAttached` flag; only attach once |
| `updateStatus()` runs `parseChar()` on all textareas every keystroke | S | 899, 824 | Memoize last-seen textarea values; only re-parse if content changed |
| `parseLore()` silently guesses trigger keys when format not matched | S | 1752 | Log a warning in `importStatus` when fallback guessing is used |

---

## LOW

| Issue | Effort | Line Ref | Fix Summary |
|---|---|---|---|
| Global mutable state in script tag, no encapsulation | M | top of `<script>` | Wrap in IIFE or namespace object |
| `setSafeHints()` covers only 2 of ~30 placeholder fields | S | 2227 | Extend to cover all `.out` textareas with meaningful safe placeholder strings |
| Style adj inputs lose focus on mobile Safari keyboard dismiss | S | adj inputs | Add `touchend` handler to re-focus; set `inputmode="text"` |
| No `aria-label` on icon buttons or textareas | M | throughout | Add accessibility labels for screen reader compatibility |
| `crc32` implemented from scratch inline | XS | 1959 | Works fine, but worth a comment explaining why (no crypto dependency allowed in Perchance) |
| No viewport meta tag in `char-wiz-html`; mobile scaling deferred to Perchance outer page | XS | n/a | Document as a known Perchance constraint in `CLAUDE.md`; no fix available within the tool |

---

## Missing Features (not bugs, but user-impacting gaps)

| Feature | Priority | Notes |
|---|---|---|
| Per-field dice/randomize buttons | High | `doReroll()` exists; just needs 🎲 button UI per field |
| Onboarding / "Start here" banner | High | Zero guidance on first load |
| Structured character data-sheet form | High | Name, age, role, personality tags as `<input>` fields with dice beside each |
| `userCharacter` populated with persona | High | Schema verified field; builder ignores it |
| Full-cast share link | Medium | Currently main character only |
| Import round-trip without builderSource | Medium | `reconstructFromRows()` is "approximate" fallback |
| Test-drive harness / run-all preset | Medium | No way to validate full pipeline end-to-end |
| Progressive section validation | Medium | Only validates at export |
| Image auto-populate from image tab | Medium | Images generated on Image tab never flow to characters |
| Non-English emotion keywords | Low | TTS/immersion EMO_KEYWORDS are English-only |
