# Findings — review-agent-3 (passes 9–13)

> Lens: alert() blocking patterns · first-run onboarding · information architecture · microcopy · error & empty states
> Reviewed: char-wiz-html (2811L), fixer-html-panel-1.txt (148L), image-style-builder-html-panel-8.txt (192L)
> Date: 2026-06-19

---

## Pass 9 — Blocking alert() / confirm() sites

### 9-1
**tool:** char-wiz-html
**lens:** Blocking alert() — precondition guards
**title:** 15 precondition alert() calls block the browser and break mobile UX
**observation:** Lines 800, 809, 823, 966, 1325, 1328, 1730, 1756, 1846, 1867, 1985, 2164, 2334, 2350, 2569 all call `alert()` for precondition failures (e.g. "Generate the cast first.", "Pick a character and at least one related character."). These freeze the tab on iOS, are unstylable, and fire before the user can see the reason in-context.
**suggested improvement:** Replace each with an inline pattern that writes to `#busyHint` (which already has `role="status"`) and returns. Where the guard relates to a specific section, write into a small sibling `<span role="alert">` placed immediately below the triggering button, auto-cleared on next interaction. For preconditions in image functions (`genPortraits`, `genBackgrounds`, `genExpressionAvatars`, `genDefaultBg`), write into the co-located `*Busy` span that already exists adjacent to each button — no new DOM needed.
**value:** H
**effort:** S
**status:** CONFIRMS-EXISTING (ISSUES.md MEDIUM — "alert() used for all validation (15+ sites)") + FINER-GRAIN: the `*Busy` span pattern already present adjacent to each image button means no new DOM is needed — just redirect to existing spans. More surgical than the ISSUES.md "inline banner" suggestion.
**risk/constraint notes:** None. Message strings are already set from script so no bracket/brace paste-safety issue.

---

### 9-2
**tool:** char-wiz-html
**lens:** Blocking alert() — validation errors on export
**title:** Export validation dumps a multiline alert() list and blocks export even for soft warnings
**observation:** Lines 2474–2475, 2496–2497, 2512–2513, 2570–2571: all three export paths and the share path do `alert("Fix before exporting:\n\n" + problems.join("\n"))` and abort. On mobile the alert is a tiny undismissable modal; on desktop the list is a monospaced line-dump with no actions.
**suggested improvement:** Render the validation problem list into `#exportPreview` (already rendered below the export buttons) using a styled list with a warning border, and let the export proceed with a second click for soft warnings. Hard blocks (no characters at all) can keep a brief status message. The "grade the cast" Review panel already shows per-character issues inline — the same pattern applies here.
**value:** H
**effort:** S
**status:** CONFIRMS-EXISTING (ISSUES.md MEDIUM — "alert() used for all validation (15+ sites)") + FINER-GRAIN: distinguishes "hard block" (no characters) from "soft warning" (validation issues) — the existing tracker does not make this distinction. Hard blocks should still prevent export; soft warnings should be inline and non-blocking with a force-export option.
**risk/constraint notes:** Must remain visually prominent so users don't miss soft warnings. A force-export path must not strip the warning — keep it visible until the download starts.

---

### 9-3
**tool:** char-wiz-html
**lens:** Blocking confirm() — "start over"
**title:** Single confirm() on resetAll() — propose a two-step undo pattern instead
**observation:** Line 1188: `if(!confirm("Start over and erase the scenario, cast, and lore?")) return;` freezes the tab and provides no undo. Accidental clicks on "start over" (small button in the top bar) destroy all work irreversibly.
**suggested improvement:** Replace the `confirm()` with a 10-second in-page undo: snapshot current state to a temporary variable, immediately execute the reset, then show "Starting over — undo within 10 seconds" as a dismissible notice in `#busyHint` with an "undo" button that restores the snapshot. The `_snap` variable (line 1086) already holds a full state snapshot before each debounced save — making 10-second undo feasible with minimal code.
**value:** H
**effort:** S
**status:** CONFIRMS-EXISTING (ISSUES.md MEDIUM — "alert() used for all validation (15+ sites)") + FINER-GRAIN: the `_snap` variable already exists and makes undo nearly free — the ISSUES.md fix suggestion does not mention this.
**risk/constraint notes:** The undo snapshot must be captured synchronously at click time (before clearing). The 10-second window prevents undo from appearing to persist forever. Must not write to localStorage during the undo window.

---

### 9-4
**tool:** fixer-html-panel-1.txt
**lens:** Blocking alert() — export guard
**title:** Single alert() on export guard blocks the Fixer's only action
**observation:** Line 137: `alert("No character detected yet - fix or paste the sections first.")`. The Fixer has only one export button so this alert is the only error feedback path. No status region, no loader, no inline hint exists.
**suggested improvement:** Add `<p id="fixStatus" style="font-size:85%; color:#c0392b; margin-top:0.5rem;" role="alert"></p>` below the fixBtns div in card 3 (Export). Write error messages there instead of alert(). Clear it on next input or re-click.
**value:** M
**effort:** XS
**status:** NEW — the ISSUES.md and audit files do not flag this specific Fixer export alert path.
**risk/constraint notes:** The `role="alert"` span must exist in markup before any error fires (not created dynamically). Its text content is set from script. No bracket/brace safety concern.

---

### 9-5
**tool:** image-style-builder-html-panel-8.txt
**lens:** Blocking alert() — two alerts and one confirm with no inline feedback path
**title:** Image Style Builder uses alert() / confirm() with no inline feedback path at all
**observation:** Line 138: `alert("Pick a base style first.")` fires on "build style" without a prior selection. Line 164: `confirm("Clear the selected style and result?")` blocks for reset. The `#busyHint` span (line 29) already exists but is only written during generation — never for errors.
**suggested improvement:** For the "pick a style" guard: write "Pick a base style above first" into `el("busyHint")` and auto-clear after 3 seconds. For the reset confirm: two-step inline pattern — first click changes button text/state and starts a 5-second cancel window, second click (or timer expiry) confirms reset. No blocking modal needed.
**value:** M
**effort:** XS
**status:** NEW — this specific tool's alert/confirm pattern is not flagged in ISSUES.md or the audits.
**risk/constraint notes:** None; all fixes in script. The `#status` and `#busyHint` spans already exist in the markup.

---

### 9-6
**tool:** char-wiz-html
**lens:** Blocking alert() — generation failure
**title:** Generation failure alert() surfaces raw JS Error object to users
**observation:** Line 662: `alert("Generation failed: " + (e && e.message ? e.message : e))`. Raw `.message` from Perchance plugin errors often contains internal paths or stack prefixes. Fires mid-generation on mobile in the worst possible scroll position.
**suggested improvement:** Replace with `setBusy("Generation failed — try again. (" + (e&&e.message?e.message:"unknown error").slice(0,100) + ")")`. The `#busyHint` span is `role="status"` so screen readers announce it once; sighted users see it in context. The "try again" framing signals transience, not a user mistake.
**value:** M
**effort:** XS
**status:** CONFIRMS-EXISTING (ISSUES.md MEDIUM — "alert() used for all validation (15+ sites)") + FINER-GRAIN: the generation-failure case is distinct from precondition guards and deserves a transience-signaling message template rather than a generic error alert.
**risk/constraint notes:** Tone matters: "try again" implies transience; do not use "error:" as the prefix for what may be a server hiccup. Truncate to 100 chars to prevent UI overflow.

---

### 9-7
**tool:** char-wiz-html
**lens:** Blocking alert() — consistency fix mismatch fall-through
**title:** Consistency "apply fix" falls back to alert() with fix text that cannot be copied on iOS
**observation:** Line 880: `alert("Couldn't match \"" + it.character + "\" to a current character. You can edit that character manually using this fix:\n\n" + it.fix)`. The fix text in an alert cannot be copied on iOS. The user cannot act on it without transcribing it manually.
**suggested improvement:** Render the unmatched fix inline in `#consistencyList` as a read-only card with a "copy fix text" button (same `copyField()` pattern used in the Image Style Builder at line 154). Style it amber/warning. The card already exists in `renderConsistency()` — the unmatched case just needs a "copy" button instead of dismissing to an alert.
**value:** M
**effort:** S
**status:** NEW — this specific fall-through case for unmatched character names is not tracked in ISSUES.md.
**risk/constraint notes:** Fix text may contain quotes or newlines; use `escHtml()` (line 832) when rendering. Copy button uses the existing `navigator.clipboard` pattern.

---

## Pass 10 — First-run / onboarding & guided quickstart

### 10-1
**tool:** char-wiz-html
**lens:** First-run onboarding
**title:** No first-run state: new users see a blank form with no direction
**observation:** On first load, every textarea is empty, the status bar reads "no characters yet", and the phase headings give no flow explanation. The Import card appears first (before Scenario) so a new user might paste their JSON there first, confused about purpose. The Polish section is hidden behind a details element with no teaser.
**suggested improvement:** Add a collapsible "first-time? start here" banner that appears only when `localStorage.getItem(STORE_KEY)` is null. Render it from `<script>` after `load()` runs (so it reacts to actual localStorage state). Content: (a) one-sentence description; (b) recommended flow in three steps; (c) "got it" button that sets a first-visit flag. The banner should live between the h1 and the tab bar. Explicitly clarify "import is for round-trips, not for starting fresh."
**value:** H
**effort:** S
**status:** CONFIRMS-EXISTING (ISSUES.md CRITICAL — "No onboarding / guided first-load flow") + FINER-GRAIN: rendering from script after `load()` means the banner reacts to actual localStorage state (not just page load), avoids any bracket/brace markup issue, and costs zero markup lines. Also clarifies the Import card's confusing position.
**risk/constraint notes:** Must not appear after a page refresh of an existing session. Check `!snap` (null for genuinely new sessions at line 1091). Must be set from script to avoid bracket/brace template issues.

---

### 10-2
**tool:** char-wiz-html
**lens:** First-run / quickstart preset
**title:** No example seed / quickstart preset to show the tool working immediately
**observation:** A first-time user must type a scenario from scratch before any generation is possible. The "Test Drive" harness (line 2690+) uses QA_PRESET to populate a full scenario + character but is hidden and labelled "Developer tool only." This preset could also serve as a user-facing quickstart demo.
**suggested improvement:** Expose a "try with a sample world" button in the first-run banner (or on the Scenario card) that populates `#scenarioNotes` with one of 3–4 sample prompts (fantasy tavern, sci-fi detective, slice-of-life cafe) without running the AI. These presets are safe strings set from script; no AI credits needed just to fill the input. After clicking, the user immediately sees the scenario field populated and can click "generate scenario."
**value:** M
**effort:** S
**status:** NEW — ISSUES.md tracks "Onboarding / Start here banner" but does not propose a quickstart preset or example-seeded scenario. Distinct and complementary.
**risk/constraint notes:** Preset strings must be set from script (not markup). Preset population should warn if `#scenarioNotes` is non-empty (check before overwriting).

---

### 10-3
**tool:** fixer-html-panel-1.txt
**lens:** First-run onboarding
**title:** Fixer has no explanation of what "broken" means or what output format to expect
**observation:** Card 1 says "Garbled, truncated, mixed-format, or badly formatted text. The AI rebuilds it." (line 7). No example of what broken input looks like, no explanation of the output format, no hint that result must be verified before export. A user pasting a truncated ACC character export doesn't know whether to paste raw JSON or text blocks.
**suggested improvement:** Add a paragraph in card 1: "Paste the raw character text (not JSON) — role instruction, first message, and appearance as plain text. Works on truncated, garbled, or scrambled outputs." Add a collapsed details element with a short example of broken input vs. output sections. In card 2, replace the generic placeholder with a concrete example of what the output looks like — set from script to avoid bracket issues.
**value:** M
**effort:** S
**status:** NEW — the Fixer's onboarding gap is not individually tracked. The ISSUES.md / audits treat sister tools as "secondary." The Fixer is the simplest tool but its input format is the least obvious.
**risk/constraint notes:** Section header examples (=== NAME ===) in a details element are safe in markup since === is not a Perchance template pattern. For extra safety, set them from script.

---

### 10-4
**tool:** image-style-builder-html-panel-8.txt
**lens:** First-run onboarding
**title:** Style builder gives no guidance on where prefix/suffix go after building
**observation:** After generating, the user sees `prefixOut` and `suffixOut` filled. No text explains what to do next: paste into ACC's image settings? Use in the wizard? The relationship to the wizard's own Image Style card is invisible.
**suggested improvement:** Add a hint at the bottom of card 3: "Paste the prefix into ACC's Image Prompt Prefix setting, and the suffix into Image Prompt Suffix. Or use these in the AI Character Set Builder's Image style card."
**value:** M
**effort:** XS
**status:** NEW — no existing tracker or audit item covers post-generation guidance for the style builder.
**risk/constraint notes:** The hint text contains no brackets or braces; safe for Perchance markup.

---

## Pass 11 — Information architecture: section ordering & progressive disclosure

### 11-1
**tool:** char-wiz-html
**lens:** Information architecture — section ordering
**title:** "Opening scene" should follow Review and Consistency, not precede them
**observation:** Within the ④ Review & export phase the order is: Opening scene → Review & refine → Consistency check → Export. Opening logically depends on a finalized cast. Generating an opening, then re-rolling a character after Review, forces the user to remember to regenerate the opening. The natural flow is: Review → Consistency → Opening → Export.
**suggested improvement:** Reorder within ④ to: Review & refine → Consistency check → Opening scene → Export. This change is purely DOM section ordering — no logic changes needed. `applyBuildMode()` uses element ids to hide `cardOpening` in single mode; this continues to work regardless of DOM order.
**value:** M
**effort:** S
**status:** CONFIRMS-EXISTING (ISSUES.md HIGH — "Section order buries Opening after 6 sections") + FINER-GRAIN: argues Opening should come AFTER Review/Consistency (not before them as ISSUES.md's proposed reorder suggests). The logic is that Opening depends on a finalized cast and should follow Review, not precede it.
**risk/constraint notes:** Pure markup reorder; low risk. All element ids remain unchanged.

---

### 11-2
**tool:** char-wiz-html
**lens:** Information architecture — Import card position
**title:** Import & portability card leads the page, wrong default position for most users
**observation:** The Import card (lines 27–35) is the first element after the Build mode selector. For new users it's confusing ("should I paste something here?"). For returning users it's unnecessary friction. The card is useful for round-trip edits but that's not the primary path.
**suggested improvement:** Move the Import card below the Scenario card (end of ① Start), or collapse it into a details element by default. If it stays in place, add a hint above it: "Returning with an exported file? Paste it here to edit it again. First time here? Skip this and start with Scenario."
**value:** M
**effort:** S
**status:** NEW — ISSUES.md and the audits do not flag the Import card's position.
**risk/constraint notes:** Moving the Import card in DOM order does not affect any JS (referenced by id only). The `importStatus` div must stay adjacent to its textarea.

---

### 11-3
**tool:** char-wiz-html
**lens:** Information architecture — Polish section progressive disclosure
**title:** Polish section summary text is too dense; advanced features are not discoverable
**observation:** Line 122: the details summary "③ Polish — optional extras (image style, immersion, presentation, tuning)" names four features without hinting at their power. Opening it dumps 4 dense cards without a "start with this one" nudge.
**suggested improvement:** Change summary text to: "③ Polish — voices, scene images, avatars, and more (optional)". Add a two-line teaser inside the details before the first card: "Most users start with Image style. Immersion adds voices and dynamic avatars. Presentation and Tuning are advanced." Set from script if brackets become an issue (they don't here — no brackets in this text).
**value:** M
**effort:** XS
**status:** NEW — no existing finding covers the summary/teaser copy inside the Polish section.
**risk/constraint notes:** Summary element text is rendered as HTML markup; subject to Perchance template parsing. Current and proposed text has no brackets/braces — safe.

---

### 11-4
**tool:** char-wiz-html
**lens:** Information architecture — Relationships card empty state
**title:** Relationships card shows empty dropdowns until characters are generated, purpose is opaque
**observation:** Lines 84–97: the Relationships card renders with empty selects and a multi-select with no options until characters are generated. New users encounter a card with two empty selects making the purpose opaque. The hint explains the feature, but the UI does not reflect that it requires characters first.
**suggested improvement:** When `castNames().length === 0`, replace the card body with a single hint: "Generate your main character first — relationship controls appear here once the cast has names." Show this check on every `updateStatus()` call (which already runs `refreshRelSelects()`). The card header and intro hint remain visible.
**value:** L
**effort:** S
**status:** NEW — the Relationships card's empty state is not tracked individually in ISSUES.md.
**risk/constraint notes:** The conditional show/hide must recheck on every `updateStatus()` and `renderExtras()` call. Hint text has no brackets/braces.

---

### 11-5
**tool:** char-wiz-html
**lens:** Information architecture — Review panel auto-grade lifecycle
**title:** Review & refine panel does not auto-grade on first open; grade is stale on re-roll before first manual grade
**observation:** Lines 960–998: `gradeCast()` is entirely manual. After a re-roll from the Review panel itself, `renderReview()` is called from `onWizFinish()` (line 1030) ONLY if `reviewCast.length && el("reviewList").children.length` — so auto-refresh after re-roll works only if the user has already clicked "grade the cast" once. On first open of the Review card, no grade is shown.
**suggested improvement:** At the end of any `onWizFinish()` call, if `reviewCast.length === 0` but characters exist, auto-call `gradeCast()`. This costs ~3 lines and makes the Review panel always current after any generation. Also add a "Grade not run yet — click to grade" placeholder inside `#reviewList` for first visit.
**value:** M
**effort:** S
**status:** FINER-GRAIN (ISSUES.md HIGH — "Re-roll UX opaque"): the auto-refresh after re-roll is partially implemented but has a first-visit edge case. The existing tracker focuses on per-field dice UX, not the auto-grade lifecycle.
**risk/constraint notes:** Auto-invoking `gradeCast()` on `onWizFinish()` when `reviewCast.length === 0` is safe — it only grades if characters exist (the guard inside `gradeCast()` at line 966 handles the empty-cast case).

---

### 11-6
**tool:** image-style-builder-html-panel-8.txt
**lens:** Information architecture — step numbering vs. content
**title:** Card 3 "Result" is permanently visible with empty textareas, misrepresenting progress state
**observation:** Card 3 (lines 22–48) is always visible with empty textareas when no generation has been run. The page looks like a 3-step form where "step 3" is somehow already started. The Adjustment input in card 3 functions as a 4th step but is not labelled as such.
**suggested improvement:** Hide card 3 until a result exists (`state.prefix || state.suffix` is non-empty after load). When empty, show a placeholder inside card 3: "Build your style from steps 1 and 2 above — the result appears here." This aligns visual state with actual progress. Add this check to `renderMains()`, `renderSubs()`, and the restore path at line 172.
**value:** L
**effort:** XS
**status:** NEW — no existing tracker item covers the image-style-builder's card 3 empty-state IA.
**risk/constraint notes:** Placeholder text must avoid brackets/braces. Card 3 visibility toggle must also be applied on `load()` / state restore.

---

## Pass 12 — Microcopy quality: labels, placeholders, hints, button text

### 12-1
**tool:** all three tools
**lens:** Microcopy — button verb consistency
**title:** "re-roll section" is RPG jargon; generate/build/apply verbs are inconsistent across tools
**observation:** Wizard uses "generate X", "apply adjustment", "re-roll section", "build style". Image Style Builder uses "build style" and "apply adjustment". Fixer uses "fix character." The word "re-roll" is tabletop RPG vocabulary — users unfamiliar with this may not know what it means. "Apply adjustment" is clear but verbose.
**suggested improvement:** Change "re-roll section" to "rewrite this section" (less jargon, more literal). Standardize "apply adjustment" to "adjust" across all cards. Keep "generate" and "build" as-is since they are distinct enough. These are markup changes on button textContent attributes.
**value:** M
**effort:** XS
**status:** NEW — no existing tracker item covers verb consistency. ISSUES.md "Re-roll UX opaque" (HIGH) addresses dice-button UX, not the button label vocabulary.
**risk/constraint notes:** Button text is set from markup. No brackets/braces; paste-safe.

---

### 12-2
**tool:** char-wiz-html
**lens:** Microcopy — hint text verbosity and register
**title:** Several hint paragraphs are too long and shift register mid-sentence
**observation:** Selected examples:
- Lore card hint (line 101): 56 words across 4 sentences for a concept that needs 1–2.
- Appearance lock hint (line 159): 66 words with a bold label and a code tag — reads as documentation, not UI hint.
- Opening scene postscript (line 273): 28-word explanation that belongs in the card's main hint, not as a postscript after the generate button.
- Immersion "Appearance lock" explanation inside Avatars subcard: compound technical paragraph better broken into 2 short bullets.
**suggested improvement:** Apply rule: under 25 words for inline hints; one sentence per concept; present tense active voice. Lore hint condensed: "Builds a triggered lorebook — entries appear in chat when their keyword matches. Covers places, people, history, and hooks. Attached to the main character." (30 words for a card header hint — acceptable). Appearance lock: break into 2 bold bullets from script for safety.
**value:** M
**effort:** S
**status:** NEW — no existing tracker item covers hint text verbosity.
**risk/constraint notes:** Hint text in markup must not contain literal brackets or braces. Current hints use prose ("square brackets") not literal characters — safe. Any revised copy must follow the same rule.

---

### 12-3
**tool:** char-wiz-html
**lens:** Microcopy — placeholder text adequacy
**title:** Extra character notes placeholder is too generic; does not show how to describe a relation
**observation:** Line 1053 (rendered from script in `renderExtras()`): placeholder is "Name, role, how they relate to the others." — generic. Does not give an example of HOW to describe a relation, which is the non-obvious part (e.g., that the relation affects the generated role instruction).
**suggested improvement:** Update the extra character notes placeholder (in `renderExtras()` script) to: "e.g. Rival shopkeeper, wary of the main character but secretly respects them." This is set from script so bracket/brace safety is automatic. Costs one string change in `renderExtras()`.
**value:** L
**effort:** XS
**status:** FINER-GRAIN (ISSUES.md LOW — "`setSafeHints()` covers only 2 of ~30 placeholder fields"): the extra character notes is the highest-priority unfilled placeholder since it is the least-obvious input in the form.
**risk/constraint notes:** Placeholder is set in `d.innerHTML` string inside `renderExtras()` (line 1053) — safe to update as a script string.

---

### 12-4
**tool:** fixer-html-panel-1.txt
**lens:** Microcopy — card 2 title misrepresents loading/result duality
**title:** Card 2 title "Reconstructed character" implies completion; the card also hosts the loading state
**observation:** Card 2 is titled "2 - Reconstructed character (edit if you like)" and contains the loader, stop button, AND result textarea. During generation the title reads as if the result is already there. "Reconstructed" is also jargon — technical vocabulary not every user will recognize.
**suggested improvement:** Change title to "2 - Result (edit if you like)". Add a dynamic status update inside the card during loading: a brief "Building your character..." text written to a sibling span using a JS toggle.
**value:** L
**effort:** XS
**status:** NEW — no existing tracker item covers the Fixer card-2 loading/result state labeling.
**risk/constraint notes:** The `#loaderEl` span and `#generateBtn` / `#stopBtn` are wired by the data panel hooks — card structure is HTML-side only, safe to adjust. Card title changes are markup edits.

---

### 12-5
**tool:** all three tools
**lens:** Microcopy — cross-tool copy divergence
**title:** Card numbering styles, "start over" presence, and storage-loss warning are inconsistent across tools
**observation:**
- Wizard: h3 headers without numbers. Image Style Builder: "1 - / 2 - / 3 -" with dashes. Fixer: "1 / 2 / 3" with spaces.
- Fixer has no "start over" button — users must manually clear both textareas.
- The storage-loss warning ("export regularly — Perchance can drop old data", wizard line 311) appears only in the wizard.
**suggested improvement:** (a) Add a minimal "clear and start over" link to the Fixer's top area. (b) Standardize card numbering to one style across all three tools (numbered is more progressive-disclosure-friendly; unnumbered is cleaner — pick one). (c) Add the storage-loss tip as a short hint to the Fixer's Export card and the Image Style Builder's result card.
**value:** L
**effort:** XS
**status:** NEW — cross-tool copy consistency is not tracked in ISSUES.md or the audits.
**risk/constraint notes:** Card title changes are markup; must avoid brackets/braces. Storage-loss tip text is safe as-is.

---

## Pass 13 — Error & empty states

### 13-1
**tool:** char-wiz-html
**lens:** Error states — image generation failures silently swallowed
**title:** All six image generation loops silently skip failures; window.__imgErr is already populated but never surfaced
**observation:**
- `genExpressionAvatars()` (line 1735–1742): `try { url = await genCharacterImage(...); } catch(e){ url = ""; }` — failure sets url="" and skips silently. The busy span shows "done - X/6 generated" where X may be 0.
- `genBackgrounds()` (line 1762–1765): same; busy span shows "No images generated" only if ALL fail.
- `genPortraits()` (line 1851–1854): same.
- `genDefaultBg()` (line 1869–1871): same; shows "No image generated" if no result.
- `igGenerate()` (line 2624–2630): the ONLY image path with a meaningful per-failure message.
- `exportTavern()` (line 2484): `catch(e){ url = ""; }` — silent; falls back to name-placeholder PNG without telling the user.
- Critically: `window.__imgErr` (line 629–638) is already populated by `parseImageResult()` on every failure but is never surfaced in any of the loop-based functions.
**suggested improvement:** After each failed image call in loop functions, append the error to the busy span: "cafe: failed (window.__imgErr value)". For single-image functions (`genDefaultBg`, `genExpressionAvatars`), show `window.__imgErr` in the busy span. For `exportTavern`, log to console and set busyHint: "portrait failed for [name] — using placeholder."
**value:** H
**effort:** S
**status:** CONFIRMS-EXISTING (ISSUES.md HIGH — "Image errors silently swallowed") + FINER-GRAIN: identifies `window.__imgErr` as an ALREADY-PRESENT per-error signal (line 638) that could be surfaced for free. The ISSUES.md fix suggestion uses `e.message`, but `e` is often empty in browser image failures; `window.__imgErr` is more reliable.
**risk/constraint notes:** `window.__imgErr` is cleared at the start of each `genCharacterImage()` call (line 670) so must be captured immediately after each call. Multi-loop functions should save it per-iteration.

---

### 13-2
**tool:** char-wiz-html
**lens:** Empty states — output textareas have non-directive placeholders
**title:** Primary .out textareas describe what will appear rather than directing the user to generate
**observation:** `#mainOut` (line 54) placeholder: "Generated character (editable)" — describes what the textarea WILL contain, not what the user SHOULD DO. Same pattern for `#personaOut`, `#loreOut`, `#openingOut`, all extra character outputs. The `updateStatus()` bar shows "no characters yet" but is far from the user's focus area.
**suggested improvement:** For primary output textareas, set more actionable placeholders from `setSafeHints()` (safe from script): e.g. `mainOut.placeholder = "Click 'generate' above — the character appears here."` For `#openingOut`: "Generate your cast first, then click 'generate opening scene' above." This extends the existing `setSafeHints()` at line 2638 to cover more fields.
**value:** M
**effort:** XS
**status:** FINER-GRAIN (ISSUES.md LOW — "`setSafeHints()` covers only 2 of ~30 placeholder fields"): proposes actionable / directive placeholder text ("click generate above") rather than descriptive text. The directive pattern is more useful for first-run users.
**risk/constraint notes:** Placeholders are set from script inside `setSafeHints()` which already handles bracket/brace safety. Extending it is straightforward.

---

### 13-3
**tool:** char-wiz-html
**lens:** Empty states — Immersion and Advanced panel messages too generic
**title:** "Generate characters first" empty messages in Voices and Chat colors panels lack feature context
**observation:** `renderVoiceList()` (line 1699): "Generate characters first." when no cast exists. `renderColorList()` (line 1880): "Generate characters first." Same message, no context for WHY characters are required or what the feature does.
**suggested improvement:** Change Voices placeholder to: "Voices are assigned per character — generate your cast first, then assign a voice to each one here." Change Chat colors placeholder to: "Colors are per character — generate your cast first, then pick a chat bubble color for each one."
**value:** L
**effort:** XS
**status:** NEW — no existing tracker item covers empty-state messaging inside Immersion / Advanced panels.
**risk/constraint notes:** Message text has no brackets/braces; safe in script-generated innerHTML strings.

---

### 13-4
**tool:** char-wiz-html
**lens:** Empty states — budget and export preview silent on first load
**title:** Budget and export preview show nothing for the entire first-run session; no progressive orientation
**observation:** `updateBudget()` (line 1213): returns silently if no characters. `updateExportPreview()` (line 1242): sets `textContent = ""` if no cast. The only "nothing here yet" signal is the `#status` bar. Users can configure Build Mode, Lore Mode, Scene Mode, and Polish options without any confirmation that settings are registering.
**suggested improvement:** When no characters exist, show in `#exportPreview`: "Build your cast above to see the export summary here." When a scenario exists but no characters: "Scenario set — generate characters to continue." This gives continuous orientation even during setup. The change is one additional `textContent` assignment in `updateExportPreview()`.
**value:** M
**effort:** XS
**status:** NEW — no existing tracker item covers the `#exportPreview` / `#budget` empty state as distinct from the status bar "no characters yet" message.
**risk/constraint notes:** Hint text has no brackets/braces. Safe for markup strings. `updateExportPreview()` already checks `!cast.length` (line 1245); the change is trivial.

---

### 13-5
**tool:** fixer-html-panel-1.txt
**lens:** Empty states — empty-input guard missing on Fixer's only generation button
**title:** Clicking "fix character" with empty input sends an almost-empty prompt to the AI
**observation:** `buildFixerPrompt()` (line 44) appends `document.getElementById("brokenText").value` without checking if it is empty. An empty paste sends a nearly-empty prompt to the AI, which returns garbage output and wastes an API call. There is no guard or validation before the generation fires.
**suggested improvement:** Add an empty-input guard before `generate()` is called: wrap the button onclick in a named function `window.fixCharacter = function(){ if(!document.getElementById("brokenText").value.trim()){ /* write to fixStatus */; return; } document.getElementById("responseEl").value=""; generate(); }` and update the button markup to `onclick="fixCharacter();"`. Write the error to the `#fixStatus` span from finding 9-4.
**value:** M
**effort:** XS
**status:** NEW — the Fixer's empty-prompt guard is not tracked in ISSUES.md or the audits.
**risk/constraint notes:** The guard belongs before the API call (in the button's onclick wrapper), not inside `buildFixerPrompt()` which only returns a string and does not control flow. Markup change needed: button onclick attribute must change from inline `onclick="responseEl.value=''; generate();"` to `onclick="fixCharacter();"`.

---

### 13-6
**tool:** image-style-builder-html-panel-8.txt
**lens:** Empty states — #status "pick a base style" is misplaced and redundant
**title:** Initial "pick a base style" message in #status bar duplicates card title at low visibility
**observation:** `updateStatus()` (line 116–120): immediately on load, `el("status").textContent = "pick a base style"`. This reads as an instruction but is rendered in a small, low-opacity span next to the "start over" button — far from where the user is focused. The card 1 title "1 - Pick a base style" already conveys the same instruction.
**suggested improvement:** Remove the initial "pick a base style" text from `#status` on load (show it only after an incorrect action attempt). On first load, `#status` could be empty or show a welcome tip. Add a brief CTA inside card 1 above the button grid: "Click a style to start:" This removes the instruction-in-wrong-place pattern.
**value:** L
**effort:** XS
**status:** NEW — the Image Style Builder's initial `#status` state is not tracked.
**risk/constraint notes:** CTA text in markup must avoid brackets/braces. "Click a style to start:" is safe.

---

*End of agent-3 findings. 23 findings across passes 9–13.*
