# Findings — Agent 1 (review-agent-1)

> Scope: char-wiz-html (read-only). Four passes: cross-tool duplication, inline-style extraction,
> magic-number naming, long-function decomposition. De-duped against ISSUES.md, findings.md (root),
> and audit-a11y-mobile / audit-correctness / audit-security-content.

---

## Pass 1 — Cross-tool duplication & shared-helper extraction

---

### P1-1

**pass#** 1 · **tool** code-review-quality · **lens** cross-tool duplication

**title** `getSection` copied verbatim in all three HTML tools

**observation** `char-wiz-html:501–511` defines `getSection(label, text)`. An identical copy
lives in `fixer-html-panel-1.txt:47–57` and `image-style-builder-html-panel-8.txt:73–80`
(pre-seeded catalog). The three copies share the same regex `\n===\s+[A-Z]` and the same
`console.warn` guard added in Phase 2B — but that guard is only in the wizard copy; the sister
tool copies are still unguarded. A bug fix or wording change to one must be manually propagated
to all three.

**suggested improvement** Maintain the wizard's copy as the canonical implementation. In the
fixer and style-builder, add a leading comment: "getSection — shared from wizard; keep in sync".
For a harder sync guarantee, store a single authoritative copy in `scripts/shared-helpers.js`
and have `ci-verify.sh` diff all three tool copies against it — failing CI if they diverge.

**value** Med · **effort** S

**status** NEW

**risk/constraint notes** Each tool is a self-contained paste-in; runtime includes are not
possible in Perchance. The improvement is CI-level drift detection only.

---

### P1-2

**pass#** 1 · **tool** code-review-quality · **lens** cross-tool duplication

**title** Char-card HTML pattern repeated three times in static markup and renderExtras

**observation** The markup pattern "label row + notes textarea + generate button + out textarea +
adj input + apply-adjustment button + reroll select/button" appears three times: the static
main-character card (~lines 49–75), the static persona card (~lines 63–75), and `renderExtras()`
at `char-wiz-html:1045–1062` which builds it as an innerHTML string. The reroll `<select>` option
list for main (line 58) and persona (line 72) diverges already — persona omits FIRST MESSAGE,
WARDROBE, REMINDER. Any new section added to character output must be reflected in all three
option lists independently.

**suggested improvement** Extract a `buildCharCard(config)` factory that accepts
`{ role, outId, noteId, adjId, rerollSel, rerollOptions, excludeKey }` and builds the subcard DOM
with `createElement` (matching the pattern already used in `renderShortcuts`). Replace all three
sites with one factory call. The reroll option list becomes an array constant per role type so
divergence is visible in one place.

**value** Med · **effort** M

**status** FINER-GRAIN (ISSUES.md MEDIUM "No structured form fields — all textarea blobs" is
related but addresses data shape; this finding covers structural HTML duplication)

**risk/constraint notes** Refactor touches markup generation. Must preserve aria-label attributes
(confirmed present in static markup). JS-built elements avoid Perchance bracket-templating issue.

---

### P1-3

**pass#** 1 · **tool** code-review-quality · **lens** cross-tool duplication

**title** Image-gen call pattern repeated three times without shared error surface

**observation** `genExpressionAvatars` (`char-wiz-html:1739`), `genBackgrounds`
(`char-wiz-html:1762`), and `genDefaultBg` (`char-wiz-html:1869`) each call
`await genCharacterImage(prompt, IMG_NEG, resolution)` inside a `try { url = ... } catch(e){ url = ""; }`
block that silently discards the error. Each surfaces only a string to a different busy-hint
element. ISSUES.md HIGH "Image errors silently swallowed" calls for `catch(e){ showStatus(...) }`
but does not address extracting the shared pattern.

**suggested improvement** Extract `genImage(prompt, resolution, busyEl)` that wraps the
`genCharacterImage` call with a unified error path. Each of the three callers passes its own
`busyEl`. This eliminates three independent silent-catch blocks and makes the ISSUES.md fix
apply to all three sites simultaneously.

**value** Med · **effort** S

**status** FINER-GRAIN (ISSUES.md HIGH "Image errors silently swallowed" — this adds the shared
wrapper as a multiplier fix)

---

### P1-4

**pass#** 1 · **tool** code-review-quality · **lens** cross-tool duplication

**title** Narrative-injection triple: `withLore` / `withPersona` / `openingSystemMessage` each
append to `row.roleInstruction` with an inconsistent delimiter pattern

**observation**
- `withLore` at `char-wiz-html:2176`: `row.roleInstruction += "\n\nWorld facts:\n- " + lore.join("\n- ")`
- `withPersona` at `char-wiz-html:2189`: `row.roleInstruction += "\n\nThe person you are talking to is..."`
- `openingSystemMessage` at `char-wiz-html:2209`: appends to a local `txt` string, not roleInstruction — but same string-append shape.

Each mutates in place. The `"\n\n"` separator is implicit per site. If the base roleInstruction
ends with trailing whitespace the separator may produce triple-newlines silently.

**suggested improvement** Introduce `appendBlock(row, text)`:
`row.roleInstruction = (row.roleInstruction || "").trimEnd() + (text ? "\n\n" + text : ""); return row;`
Each call site becomes one self-documenting line and the triple-newline edge case is eliminated.

**value** Low · **effort** XS

**status** NEW

**risk/constraint notes** Pure refactor, no behavior change. The `\n\n` separator is correct ACC
convention.

---

### P1-5

**pass#** 1 · **tool** code-review-quality · **lens** cross-tool duplication

**title** `gSec` (quiet section reader) duplicates `getSection` parsing logic without the warn guard

**observation** `gSec` at `char-wiz-html:906–914` is a deliberate "quiet" variant of
`getSection` (no console.warn on miss, used in grading where misses are expected). The
implementation is copy-pasted from `getSection:501–511` with the warn removed. Any change to the
parsing regex in `getSection` must also be applied to `gSec` manually.

**suggested improvement** Factor out a shared core function `_sectionBody(header, text)` that
returns the raw slice. `getSection` calls it and adds the warn; `gSec` calls it and stays silent.
A single regex change updates both.

**value** Low · **effort** XS

**status** NEW

**risk/constraint notes** Pure refactor. Grading result must stay identical.

---

### P1-6

**pass#** 1 · **tool** code-review-quality · **lens** cross-tool duplication

**title** `load()` and `restoreSnapshot()` contain near-identical field-population sequences

**observation** `load()` at `char-wiz-html:1089–1177` and `restoreSnapshot()` at
`char-wiz-html:2283–2303` both read a snapshot object and call `setVal` for the same dozen
fields, then coerce `immersion`/`advanced`/`tuning` and call
`renderExtras()` + `renderStyleMains()` + `applyBuildMode()` etc. The field-population block
(first ~90 lines of the `if(snap)` branch in `load()`) is substantially duplicated in
`restoreSnapshot()`. `load()` uniquely also registers event handlers and sets `window.learned`.

**suggested improvement** Extract `applySnapshot(snap)` that owns field population + sub-object
coercion only. Both `load()` (for the `if(snap)` branch) and `restoreSnapshot()` call
`applySnapshot()`. `load()` continues to own event-handler registration and `window.learned`.

**value** Med · **effort** M

**status** NEW

**risk/constraint notes** `restoreSnapshot` has slightly looser coercion (inline guard
`if(!immersion.voices) immersion.voices = {}`). Must preserve those guards. `load()` sets
`window.learned` from localStorage at the end — keep that in `load()` only.

---

## Pass 2 — Inline-style → class/CSS-variable extraction & design-token set

---

### P2-1

**pass#** 2 · **tool** vanilla-web · **lens** inline-style extraction

**title** 75 inline `style=` attributes; only one CSS variable (`--subcard-bg`) exists — no
design-token set

**observation** `char-wiz-html` carries 75 inline `style=` attrs (confirmed by grep count).
Clustering reveals six reuse groups:

1. **Status/hint text** — `font-size:85%; opacity:0.85` on `#status` (line 12) nearly duplicates
   the `.hint` class at line 2844 (`font-size:85%; opacity:0.8`). The 0.85 vs 0.8 difference is
   an unintentional copyist drift with no comment.
2. **Row/margin nudges** — `margin-top:0` / `margin-top:0.5rem` appear on many `.bar` / `.row`
   children as local spacing adjustments.
3. **Image-thumb widths** — `width:90px` (avatar thumbs ~1749, 1861), `width:120px` (bg thumbs
   ~1772), `width:160px` (portrait/default-bg thumbs ~1875). Three sizes, no named token.
   `width:160px` is also the `.igimg` class value — the portrait inline at ~1875 is redundant.
4. **Floaty voice-panel geometry** — `position:fixed; right:12px; bottom:12px` and `bottom:56px;
   width:300px` as inline `style.cssText` strings inside `IMMERSION_FN` (~lines 1469–1472).
5. **Numeric input widths** — `width:60px` (mem-max), `width:64px` (temperature, avatar-size),
   `width:80px` (max-tokens) on `<input type=number>` elements.
6. **Show/hide** — `el.style.display = on ? "" : "none"` is correct script-toggling (not a CSS
   concern).

The `<style>` block has only `--subcard-bg`. No `--thumb-sm/md/lg`, `--input-w-sm/md/lg`.

**suggested improvement** Add to `:root` in `<style>`:
```
--thumb-sm: 90px;
--thumb-md: 120px;
--thumb-lg: 160px;
--input-w-sm: 60px;
--input-w-md: 64px;
--input-w-lg: 80px;
```
Add `.igimg--sm { width:var(--thumb-sm); }` and `.igimg--md { width:var(--thumb-md); }` CSS
classes. Replace the per-site `style='width:Npx;'` attrs with class assignments. Remove the
redundant `width:160px` inline where `.igimg` already supplies it. For group 4 (voice panel
geometry inside serialized JS), use JS constants rather than CSS vars (see P3-2).

**value** Med · **effort** M

**status** CONFIRMS-EXISTING (ISSUES.md MEDIUM "73 inline `style=` attributes, no CSS vars or
dark mode"); this finding adds the specific cluster breakdown and concrete token names.

---

### P2-2

**pass#** 2 · **tool** vanilla-web · **lens** inline-style extraction

**title** `#status` span inline `opacity:0.85` diverges silently from the `.hint` class `opacity:0.8`

**observation** Line 12: `<span id="status" style="font-size:85%; opacity:0.85;" ...>`. The
`.hint` class at line 2844 sets `font-size:85%; opacity:0.8`. The inline overrides to `0.85` —
a 0.05 difference with no comment and no apparent design intent.

**suggested improvement** Remove the inline style from `#status` and let `.hint` apply. The
slightly higher opacity only helps contrast (audit-a11y-mobile flagged hint contrast as a concern).
If `0.85` was intentional, update `.hint` to `0.85` and add a comment.

**value** Low · **effort** XS

**status** NEW

**risk/constraint notes** Removing the inline increases opacity (lighter), which only helps
contrast — no WCAG regression.

---

### P2-3

**pass#** 2 · **tool** vanilla-web · **lens** inline-style extraction

**title** Relationship multi-select has inline style that conflicts with `.adj` class padding

**observation** Line 92: `<select id="relB" multiple size="4" style="width:100%; padding:0.4rem;">`.
The `.adj` class provides `width:100%; padding:0.5rem;`. The inline uses `0.4rem` — a
deliberate but undocumented deviation. The element also does not carry the `.adj` class.

**suggested improvement** Either add a `.multi-sel { width:100%; padding:0.4rem; }` class to
the `<style>` block and use it, or if the difference from `.adj` is unintentional, add class
`adj` and remove the inline. Add a comment if the smaller padding is intentional.

**value** Low · **effort** XS

**status** NEW

---

### P2-4

**pass#** 2 · **tool** vanilla-web · **lens** inline-style extraction

**title** No dark-mode: the one locally declared token (`--subcard-bg`) has no `prefers-color-scheme` adaptation

**observation** `--subcard-bg: rgba(127,127,127,0.12)` is declared in `:root` at line 2816.
`--box-color` is not declared locally (Perchance supplies it). On dark-host pages the fixed
`rgba(127,127,127,0.12)` subcard tint may wash out or conflict. No `@media (prefers-color-scheme:
dark)` block exists.

**suggested improvement** Add a minimal dark-mode override:
```css
@media (prefers-color-scheme: dark) {
  :root { --subcard-bg: rgba(255,255,255,0.08); }
}
```
This adapts the one locally declared surface token to dark backgrounds without touching
`--box-color` (Perchance-supplied).

**value** Low · **effort** S

**status** CONFIRMS-EXISTING (ISSUES.md MEDIUM "no dark mode" — this narrows it to a
minimal one-token fix)

---

## Pass 3 — Magic numbers → named constants

---

### P3-1

**pass#** 3 · **tool** code-review-quality · **lens** magic numbers

**title** 4-hour bucket period is a bare literal `4` in `fourHourBucket()`

**observation** `char-wiz-html:425`: `Math.floor(Date.now() / (4 * 3600 * 1000))`. The `4` is
the rotation cadence in hours. A comment above documents the intent but the literal `4` controls
the actual cadence and is the only place to change it. The `freshWords` function independently
uses the same bucket but calls `fourHourBucket()` — so changing the one literal correctly
propagates.

**suggested improvement** `var POOL_ROTATION_HOURS = 4;` at the constants block (~line 400) and
reference it: `Math.floor(Date.now() / (POOL_ROTATION_HOURS * 3600 * 1000))`.

**value** Low · **effort** XS

**status** NEW

---

### P3-2

**pass#** 3 · **tool** code-review-quality · **lens** magic numbers

**title** Voice-panel geometry is four bare string literals inside `IMMERSION_FN` with a
load-bearing dependency between `bottom:12px` (button) and `bottom:56px` (panel)

**observation** `char-wiz-html:1469–1472` inside `IMMERSION_FN`:
- `btn.style.cssText = "...right:12px;bottom:12px;z-index:99999;padding:8px 12px;..."`
- `panel.style.cssText = "...right:12px;bottom:56px;z-index:99999;width:300px;max-width:86vw;..."`

`12px` appears three times, `99999` twice. The `56px` panel offset equals the button
`bottom:12px` plus ~44px button height — this relationship is undocumented. If the button
geometry changes, the panel gap silently breaks.

**suggested improvement** At the top of `IMMERSION_FN`, before `buildPanel`, declare:
```js
var VBTN = { right: "12px", bottom: "12px", z: "99999" };
var VPNL = { bottom: "56px", w: "300px" }; // bottom = VBTN.bottom + ~44px button height
```
Reference in the `style.cssText` concatenations. Since `IMMERSION_FN` is serialized with
`.toString()`, the vars stay scoped inside the function and do not pollute the outer page.

**value** Med · **effort** S

**status** NEW

**risk/constraint notes** `IMMERSION_FN` is never called in the builder — it is serialized and
pasted into the export. Keep the vars inside the function body so they don't leak into `window`.

---

### P3-3

**pass#** 3 · **tool** code-review-quality · **lens** magic numbers

**title** `personaSummary` word-cap (80) and `sceneSummary` word-cap (30) are bare literals with no documented rationale

**observation** `char-wiz-html:2184`: `if(words.length > 80) ri = words.slice(0, 80).join(" ") + "...";`
`char-wiz-html:2194–2195`: `return (w.length > 30) ? w.slice(0, 30).join(" ") : s;`

These editorial limits have no named constant and no comment explaining their relationship to
the 500-word role-instruction budget warned at `char-wiz-html:1218`.

**suggested improvement** Define at the constants block:
```js
var SUMMARY_PERSONA_MAX_WORDS = 80;   // persona RI summary truncation for injection
var SUMMARY_SCENE_MAX_WORDS   = 30;   // scenario snippet for opening message context
var ROLE_BUDGET_WARNING_WORDS = 500;  // threshold for budget warning badge
```
Reference in the three places.

**value** Low · **effort** XS

**status** NEW

---

### P3-4

**pass#** 3 · **tool** code-review-quality · **lens** magic numbers

**title** 500ms save debounce and 50ms status debounce are bare literals with no documented relationship

**observation** `char-wiz-html:1087`: `_saveTimer = setTimeout(..., 500);`
`char-wiz-html:1229`: `updateStatus._t = setTimeout(..., 50);`

Both are correct by design but are magic numbers. Their relationship (50 << 500) is worth
documenting to prevent future edits from accidentally reversing them.

**suggested improvement** Define:
```js
var SAVE_DEBOUNCE_MS   = 500;  // debounce before writing to localStorage
var STATUS_DEBOUNCE_MS = 50;   // debounce for status/budget re-read (must be < SAVE_DEBOUNCE_MS)
```
Reference at lines 1087 and 1229.

**value** Low · **effort** XS

**status** NEW

---

### P3-5

**pass#** 3 · **tool** code-review-quality · **lens** magic numbers

**title** `updateStatus._t` attaches the timer ID to the function object — non-idiomatic pattern

**observation** `char-wiz-html:1229`: `clearTimeout(updateStatus._t); updateStatus._t = setTimeout(...)`.
This attaches a timer handle to the function as a property. A future developer may add `var
_statusTimer` thinking it does not exist, leading to two competing timers.

**suggested improvement** Rename to `var _statusTimer;` (parallel to `_saveTimer` at the same
scope) and use `clearTimeout(_statusTimer); _statusTimer = setTimeout(...)`.

**value** Low · **effort** XS

**status** NEW

---

### P3-6

**pass#** 3 · **tool** code-review-quality · **lens** magic numbers

**title** `480px` breakpoint in `<style>` is undocumented relative to the `720px` wrap width

**observation** `char-wiz-html:2823`: `@media (max-width: 480px) { ... }`. The sole responsive
breakpoint. `480px` relates meaningfully to the `.wrap { max-width:720px }` container (roughly
two-thirds), but no comment documents this. A second breakpoint at `720px` would be a second
magic number with no cross-reference.

**suggested improvement** Add a comment directly above the `@media` rule:
`/* mobile breakpoint: 480px (below ~two-thirds of the 720px wrap max-width) */`
CSS custom properties cannot be used as media-query values, so a comment is the correct form.

**value** Low · **effort** XS

**status** NEW

---

### P3-7

**pass#** 3 · **tool** code-review-quality · **lens** magic numbers

**title** `strHash` and `seededShuffle` use unexplained hash constants (31, 0x6D2B79F5) with no algorithm citation

**observation** `char-wiz-html:426–430`: `h = (Math.imul(31, h) + s.charCodeAt(i)) | 0` (DJB2-
style) and `s = (s + 0x6D2B79F5) | 0` (Mulberry32 PRNG constant). Neither function has a
comment naming the algorithm. A reader unfamiliar with these cannot verify correctness.

**suggested improvement** Add one-line citations:
- `strHash`: `// DJB2-style polynomial hash (multiplier 31; same as Java String.hashCode)`
- `seededShuffle`: `// Mulberry32 PRNG — bit-mix from the algorithm by Tommy Ettinger`

Documentation only, no code change.

**value** Low · **effort** XS

**status** NEW

**risk/constraint notes** Documentation only.

---

### P3-8

**pass#** 3 · **tool** code-review-quality · **lens** magic numbers

**title** `800ms` voice-panel mount delay in `IMMERSION_FN` is an undocumented guess

**observation** `char-wiz-html:1510`: `setTimeout(buildPanel, 800);` — a delay to let the chat
UI finish mounting before the voice panel button is injected. `800` is undocumented.

**suggested improvement** Define at the top of `IMMERSION_FN`:
`var PANEL_MOUNT_DELAY = 800; // ms after page load before injecting voice panel — increase on slow host frames`
Reference at line 1510.

**value** Low · **effort** XS

**status** NEW

---

### P3-9

**pass#** 3 · **tool** code-review-quality · **lens** magic numbers

**title** `500ms` settle delay inside `IMMERSION_FN` MessageAdded handler coincidentally matches the save debounce but is unrelated

**observation** `char-wiz-html:1618`: `await new Promise(function(r){ setTimeout(r, 500); });`
inside the `MessageAdded` handler — a deliberate post-message settle delay before the immersion
pipeline runs. It is coincidentally the same `500` as the save debounce (P3-4) but for a
completely different reason.

**suggested improvement** Define:
`var HANDLER_SETTLE_MS = 500; // wait after new AI message before running immersion pipeline`
near the top of `IMMERSION_FN`. Prevents future readers from conflating this `500` with the
save debounce.

**value** Low · **effort** XS

**status** NEW

---

## Pass 4 — Long-function decomposition

---

### P4-1

**pass#** 4 · **tool** code-review-quality · **lens** long-function decomposition

**title** `characterRow()` at 73L mixes five distinct concerns; two overlay blocks are splittable

**observation** `characterRow(c, seed, isPersona, sceneCode)` at `char-wiz-html:2039–2111` (73L)
does:

1. Seed offset + base clone from `learned` or `defaultTemplate()` — ~2L (essential)
2. Core field population: name, roleInstruction, reminderMessage, generalWritingInstructions,
   writingPreset, scene-mode flags, imagePrompt*/initialMessages/customCode/meta/customData — ~22L (essential)
3. **Tuning overlay**: temperature, maxTokens, autoGenerateMemories, fitMethod,
   maxParagraphCount, contextInfo prompts — ~15L, guarded by `if(tuning.enabled && !isPersona)` (splittable)
4. **Advanced presentation overlay**: avatar shape/size, portraits, colors,
   scene background/music, shortcutButtons — ~18L, guarded by `if(advanced.enabled)` (splittable)
5. Identity finalisation: uuid, id, creationTime, lastMessageTime, folderPath, `$types` — ~4L (essential)

**length assessment**: ~50L is essential (concerns 1, 2, 5). ~33L is splittable (concerns 3 + 4).

**suggested improvement** Extract:
```js
function applyTuningOverlay(base, tuning) { /* concern 3, ~15L */ }
function applyAdvancedOverlay(base, advanced, isPersona, c) { /* concern 4, ~18L */ }
```
`characterRow` calls both when enabled. The smoke test (`test/smoke.mjs`) can then test overlay
logic directly without a full `characterRow` invocation.

**value** Med · **effort** S

**status** NEW

**risk/constraint notes** Both overlays currently close over module-level `tuning` and `advanced`.
Pass them explicitly as parameters so the sub-functions are pure and testable. No paste-safety
concern.

---

### P4-2

**pass#** 4 · **tool** code-review-quality · **lens** long-function decomposition

**title** `IMMERSION_FN` at 217L; voice-panel and async handlers are splittable as inner named functions

**observation** `IMMERSION_FN` at `char-wiz-html:1411–1631` (217L) is serialized with
`.toString()` for export. Internal structure:

| Sub-block | Lines | Splittable? |
|---|---|---|
| CFG destructure + SS init | ~5L | No — must stay at top |
| `lc` / `clean` helpers | ~7L | No — used everywhere |
| Voice prefs: `loadPrefs/savePrefs/prefs` | ~5L | No |
| `pickVoice` / `voiceParams` / `speak` / `unlockTTS` | ~20L | Extractable as inner `buildVoiceOps()` |
| `buildPanel` (mount button + panel) | ~12L | Extractable |
| `renderPanel` (build voice-control HTML) | ~30L | Extractable |
| `emotionOf` / `setAvatarTo` / `setAvatar` | ~10L | No — short |
| `setBackground` / `setMusic` | ~15L | No — short each |
| `updateMemory` (async) | ~18L | Extractable as inner named fn |
| `sceneImage` (async) | ~30L | Extractable as inner named fn |
| Ref portrait block | ~12L | No — startup one-shot |
| `MessageAdded` unified handler | ~15L | No — orchestration |

**length assessment**: ~75L essential; ~80L splittable into inner named functions declared inside
`IMMERSION_FN`.

**suggested improvement** Declare named sub-functions inside `IMMERSION_FN`:
```js
function buildVoiceOps(cfg, SS, prefs){ /* pickVoice/voiceParams/speak/unlockTTS */ }
function buildVoicePanel(cfg, voiceOps, prefs){ /* buildPanel + renderPanel */ }
async function updateMemory(cfg){ ... }
async function sceneImage(cfg, message){ ... }
```
`IMMERSION_FN.toString()` still produces a valid self-contained function. All inner functions
remain in the outer closure and have access to `cfg`, `oc`, `prefs`.

**value** Med · **effort** M

**status** NEW

**risk/constraint notes** Critical: inner functions must use `function foo(){}` declaration
syntax (hoisted). Test `IMMERSION_FN.toString()` after refactor to confirm the serialized output
is parseable. Do not use `const`/`let` inside (Perchance's in-chat runtime may be ES5-compat).

---

### P4-3

**pass#** 4 · **tool** code-review-quality · **lens** long-function decomposition

**title** `buildWizardPrompt()` at ~77L uses a flat if/else chain for 8 section types — no
extension pattern

**observation** `window.buildWizardPrompt` at `char-wiz-html:697–773` dispatches on
`window.activeSection` via 8 sequential `if(sec === "...") { ... return p; }` blocks. Adding a
new section requires adding an `else if` at the bottom. The function is ~77L; individual blocks
are 3–20L.

**suggested improvement** Extract named builder functions at module scope:
```js
function buildRerollPrompt(info, ctx){ ... }
function buildScenarioPrompt(refine, ctx){ ... }
function buildCharPrompt(refine, sec, ctx){ ... }
function buildPersonaPrompt(refine, ctx){ ... }
function buildLorePrompt(refine, ctx){ ... }
function buildOpeningPrompt(refine){ ... }
function buildConsistencyPrompt(){ ... }
// buildStylePrompt already exists at buildStyleText(); unify naming
```
`buildWizardPrompt` becomes a ~20L pure router. Each builder is independently testable; the
grader (`test/grade-generation.mjs`) could call individual builders to verify prompt shape without
triggering a generation.

**value** Med · **effort** M

**status** NEW

**risk/constraint notes** Builders already close over `val()`, `el()`, `prepUserInput()`. If
extracted to module-level named functions inside `<script>` they remain closures over the same
scope.

---

### P4-4

**pass#** 4 · **tool** code-review-quality · **lens** long-function decomposition

**title** `renderExtras` uses an innerHTML string with escaped event-handler strings — inconsistent with `renderShortcuts` and missing aria-labels on dynamic elements

**observation** `renderExtras` at `char-wiz-html:1045–1062` uses `d.innerHTML = '...'` with
inline onclick strings using doubly-escaped quotes:
`'doReroll(\\'exOut_' + i + '\\',\\'exReroll_' + i + '\\',\\'extra' + i + '\\').'`
This approach cannot be statically syntax-checked and is inconsistent with `renderShortcuts`
(`char-wiz-html:1817–1841`) which uses `createElement` + `addEventListener`. The dynamically
created `<select id="exReroll_" + i>` has no aria-label (a11y gap).

**suggested improvement** Rewrite `renderExtras` to use `createElement` + event-listener pattern
matching `renderShortcuts`. Add `aria-label` for each dynamic `<select>` (e.g., "Section to
re-roll for character N"). Effort M because this is the main multi-character renderer and the
oninput closures must be carefully captured.

**value** Med · **effort** M

**status** FINER-GRAIN (audit-a11y-mobile flags unlabeled dynamic controls; this adds the
`innerHTML`-vs-`createElement` maintainability angle as the root cause)

---

### P4-5

**pass#** 4 · **tool** code-review-quality · **lens** long-function decomposition

**title** `console.log` left in two exported code blocks (`SCENE_SHOTS_TEMPLATE` and `IMMERSION_FN`) — shipped to readers' browsers

**observation** `char-wiz-html:1388` (inside `SCENE_SHOTS_TEMPLATE`):
`} catch (e) { console.log("scene-shot error", e); }`
`char-wiz-html:1627` (inside `IMMERSION_FN`):
`} catch(e){ console.log("immersion error", e); }`

Both are in JS code serialized into the exported character's `customCode` and run in every
reader's browser. `console.log` in production export code is noise in readers' developer consoles.

**suggested improvement** Change both to `console.warn("[acc-immersion]", e)` — semantically
correct (the feature degrades gracefully, this is a warning, not a fatal error), and the
`[acc-immersion]` prefix makes the source findable by users who do inspect their console.

**value** Low · **effort** XS

**status** NEW

**risk/constraint notes** Both calls are in serialized export code. Change is safe; no
paste-safety concern (no brackets).

---

## Appendix — Signals examined but not raised

- **Unused `SEED.verb`** (`char-wiz-html:453`): `verb` pool is defined but never used in any
  seed function. Could be removed as dead code; held back since it may be a planned future seed
  axis. One-line note: DEFECT->existing tracker if removal is intended.
- **30 `alert()` occurrences**: Fully covered by audit-a11y-mobile (WCAG 4.1.3). Not raised here.
- **`window.generate` try-finally**: Handled in Phase 2A. Not a duplication concern.
- **`STORE_KEY` / `OLD_KEYS` versioned localStorage**: Correct design; not a problematic magic number.
