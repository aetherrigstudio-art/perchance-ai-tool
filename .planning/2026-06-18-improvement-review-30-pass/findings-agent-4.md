# Findings — Agent 4 (Passes 14–19)

> Review date: 2026-06-19  
> Agent: review-agent-4  
> In-scope files (read-only): `char-wiz-html`, `fixer-html-panel-1.txt`, `image-style-builder-html-panel-8.txt`  
> Lenses: discoverability (14), in-progress feedback (15), cross-tool UX parity (16),
> unlabeled controls on sister tools (17), live-region/aria-busy parity (18), focus management (19)  
> Schema: pass# · tool · lens · title · observation (file:line) · suggested improvement · value · effort · status · risk/constraint notes

---

## Pass 14 — Discoverability of Power Features

---

### F14-01

**pass:** 14  
**tool:** WIZARD  
**lens:** Discoverability  
**title:** Per-field re-roll is hidden inside a dropdown — the capability is invisible until explored

**observation** (`char-wiz-html:57–60`): The re-roll feature exists as a `<select>` + "re-roll section" button row inside each character card. Because the trigger is a button + select combo buried after the generated output, most users never discover it. The select is pre-populated with section names, but users who have not read the docs have no signal that individual sections can be independently regenerated.

**suggested improvement:** Surface a disclosure hint above the select row, set from `<script>` so the label text never touches Perchance markup: e.g. a `<details>` above the select with summary text "Re-roll individual sections of this character." The existing `doReroll` / `rerollSection` functions accept an explicit label argument, so wiring a per-section trigger is an XS JS addition. ISSUES.md "Re-roll UX opaque" High item explicitly tracks this; the improvement here adds specific framing of a disclosure hint as the minimum viable discoverability fix.

**value:** H  
**effort:** S  
**status:** CONFIRMS (ISSUES.md HIGH line 86 — "Re-roll UX opaque — dropdown only, no per-field dice")  
**risk/constraint:** Button/hint label text must be set via `<script>` if it contains brackets. A text label ("re-roll this section") is bracket-free and safe in markup.

---

### F14-02

**pass:** 14  
**tool:** WIZARD  
**lens:** Discoverability  
**title:** Color picker is doubly gated — no external signal that per-character chat colors exist

**observation** (`char-wiz-html:184–218`): The chat-bubble color picker lives inside `#cardAdvanced > #advBody > .subcard`. It is hidden behind two gates: (1) checking "Enable presentation defaults", (2) scrolling to the "Chat colors" subcard. The feature is entirely invisible on page load. The existing hint text at line 186 lists "avatar shape/size, a static portrait, and a default chat background/music" but omits "per-character chat-bubble colors."

**suggested improvement:** Extend the existing `<p class="hint">` at `char-wiz-html:186` to add "and per-character chat-bubble colors" — bracket-free, one-sentence addition in markup. Alternatively set from `<script>` for belt-and-suspenders safety.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (ISSUES.md HIGH line 83 — "Color picker hidden behind double gate")  
**risk/constraint:** The hint text is bracket-free. No markup template risk.

---

### F14-03

**pass:** 14  
**tool:** WIZARD  
**lens:** Discoverability  
**title:** Image-to-avatar flow is only documented in a second-level hidden subcard — cross-reference to static portraits is missing

**observation** (`char-wiz-html:155–161`): The "Dynamic expression avatars" subcard explains in small `.hint` text that the neutral portrait "is also kept as the character's persistent reference image." A user who skips the immersion pack entirely misses that generating expression avatars is one route to a stable reference image. The "Static portraits" subcard (`char-wiz-html:200–204`) does not mention the immersion-pack alternative.

**suggested improvement:** In the "Static portraits" subcard, add a hint (set from `<script>` for bracket safety): "For mood-reactive avatars that swap expressions per reply, see the Immersion pack above." Bracket-free.

**value:** M  
**effort:** XS  
**status:** NEW  
**risk/constraint:** Hint text is bracket-free. Low-effort cross-reference.

---

### F14-04

**pass:** 14  
**tool:** IMAGE-STYLE  
**lens:** Discoverability  
**title:** "Show raw AI output" details element has no context — users do not know when to use it

**observation** (`image-style-builder-html-panel-8.txt:44–47`): A `<details>` with `<summary class="hint">show raw AI output</summary>` sits at the bottom of the Result card. It uses `.hint` styling (85% size, 80% opacity) making it visually recessive, and provides no explanation of why a user would open it.

**suggested improvement:** Expand the summary text to: "show raw AI output (useful if prefix or suffix look wrong)". Bracket-free. XS copy change to the `<summary>` element.

**value:** L  
**effort:** XS  
**status:** NEW  
**risk/constraint:** No brackets. Paste-safe markup change.

---

### F14-05

**pass:** 14  
**tool:** FIXER  
**lens:** Discoverability  
**title:** Fixer's three-step flow gives no hint that the labeled section format can be edited before export

**observation** (`fixer-html-panel-1.txt:14–22`): Step 2's heading is "2 - Reconstructed character (edit if you like)" which does hint editability, but there is no explanation of the labeled section format users will see. Users who encounter "=== NAME ===" for the first time may not understand the structure or that individual sections can be targeted.

**suggested improvement:** Add a hint paragraph in Step 2's card: "The AI outputs labeled sections — NAME, ROLE INSTRUCTION, FIRST MESSAGE, APPEARANCE. Edit any section before downloading." Bracket-free; goes in markup safely.

**value:** M  
**effort:** XS  
**status:** NEW  
**risk/constraint:** Hint text contains no brackets. Paste-safe.

---

## Pass 15 — In-Progress Feedback and Perceived Performance

---

### F15-01

**pass:** 15  
**tool:** FIXER  
**lens:** In-progress feedback  
**title:** "Fix character" button gives no visual busy signal — loaderEl is in Step 2 while the button is in Step 1

**observation** (`fixer-html-panel-1.txt:9–11, 17`): The primary action button (`onclick="responseEl.value=''; generate();"`) never becomes disabled, never changes label, and the only platform-provided feedback (`<span id="loaderEl">`) is inside Step 2's card — not co-located with the button that was clicked in Step 1. The user must scroll down to see any activity signal.

**suggested improvement:** (1) Move the `loaderEl` / stop button `<div>` (lines 16–20) to Step 1's card alongside "fix character" so feedback is co-located with the action. (2) Define a `window.onFixStart` and `window.onFixFinish` pair in the HTML panel that disable/re-enable the "fix character" button and update label text ("fixing..." / "fix character"). The `loaderEl` must remain present in the DOM; only its parent card position changes.

**value:** H  
**effort:** S  
**status:** NEW  
**risk/constraint:** No brackets needed. `loaderEl` is required by the Perchance platform; it must remain present in the DOM but can be repositioned.

---

### F15-02

**pass:** 15  
**tool:** IMAGE-STYLE  
**lens:** In-progress feedback  
**title:** `busyHint` is cleared to empty on finish — no completion confirmation to sighted or AT users

**observation** (`image-style-builder-html-panel-8.txt:142, 146`): `genStyle()` sets `el("busyHint").textContent = "building style..."` then `onStyleFinish` clears it to `""`. Silent completion means users who were not watching miss the transition.

**suggested improvement:** Replace the empty-string clear with a brief completion message: `el("busyHint").textContent = "done — edit the prefix or suffix, then copy.";` followed by `setTimeout(function(){ el("busyHint").textContent = ""; }, 3000)`. This is the same pattern recommended for the wizard in audit-a11y-mobile.md M2.

**value:** M  
**effort:** XS  
**status:** FINER (audit-a11y-mobile.md M2 — "complete with confirming message" on wizard busyHint; this finding extends the pattern to the image-style tool)  
**risk/constraint:** Text is bracket-free.

---

### F15-03

**pass:** 15  
**tool:** IMAGE-STYLE  
**lens:** In-progress feedback  
**title:** "Build style" and "apply adjustment" buttons are not disabled during generation — double-fire risk and no loading state

**observation** (`image-style-builder-html-panel-8.txt:20, 42`): Both action buttons call `genStyle()` directly. `genStyle` (line 137) does not guard with `window._generating` — unlike the wizard's `genStyle` at `char-wiz-html:1983` which guards `if(window._generating) return`. Double-clicking fires two concurrent generations. Additionally, neither button shows a loading state.

**suggested improvement:** Add `if(window._generating) return;` as the first line of `window.genStyle` in the image-style tool (UX improvement aspect; the concurrency bug is a separate defect). Disable both action buttons when generation starts; re-enable in `onStyleFinish`. Set button text to "building..." during generation. Mirrors the wizard's exact pattern.

**value:** H  
**effort:** XS  
**status:** NEW (the defect angle is out of scope; the UX improvement — visible disabled/loading state — is in scope)  
**risk/constraint:** No brackets. The JS guard is trivial.

---

### F15-04

**pass:** 15  
**tool:** FIXER  
**lens:** In-progress feedback  
**title:** No section-detection summary after generation — user must read raw output to know if it succeeded

**observation** (`fixer-html-panel-1.txt:58–64`): After generation completes into `responseEl`, there is no feedback on whether all four expected sections (NAME, ROLE INSTRUCTION, FIRST MESSAGE, APPEARANCE) were produced. The user discovers missing sections only by scrolling the raw output or attempting a download.

**suggested improvement:** In a `window.onFixFinish` handler, call the existing `parseChar()` on `responseEl.value` and display a hint: "Detected: NAME, ROLE INSTRUCTION, FIRST MESSAGE — APPEARANCE missing." in a `<div id="fixStatus">` element. All label text is bracket-free.

**value:** M  
**effort:** S  
**status:** NEW  
**risk/constraint:** Requires hooking `onFinishPromise` from the data panel side, OR using a `MutationObserver` on `responseEl` in the HTML panel (self-contained). No brackets in any text.

---

### F15-05

**pass:** 15  
**tool:** WIZARD  
**lens:** In-progress feedback  
**title:** `aria-busy` on `#tab-builder` is not reflected visually — sighted users have no "locked" indicator on action buttons during generation

**observation** (`char-wiz-html:779–781`): `setBusy(msg)` sets `aria-busy="true"` on `#tab-builder` for screen readers but no CSS rule targets `[aria-busy="true"]` to visually communicate the locked state to sighted users. The `busyHint` text (85% size, 80% opacity) in a bottom card may not be visible without scrolling.

**suggested improvement:** Add a CSS rule to the wizard `<style>` block:
```
#tab-builder[aria-busy="true"] button:not(#stopBtn),
#tab-builder[aria-busy="true"] select { opacity: 0.5; cursor: wait; pointer-events: none; }
```
Zero additional JS; pairs with the existing `aria-busy` toggle.

**value:** M  
**effort:** XS  
**status:** NEW  
**risk/constraint:** The `:not(#stopBtn)` exclusion is critical — the stop button must remain clickable during generation.

---

## Pass 16 — Cross-Tool UX Parity

---

### F16-01

**pass:** 16  
**tool:** FIXER  
**lens:** Cross-tool UX parity  
**title:** No "start over" / clear-all button — the wizard and image-style both have one; the fixer does not

**observation** (`fixer-html-panel-1.txt:36–41`): The fixer persists all three fields to `localStorage` with bare unversioned keys (`fixBroken`, `fixResponse`, `fixStyle`). No reset control exists. The wizard (`char-wiz-html:11`) and image-style tool (`image-style-builder-html-panel-8.txt:5`) both have a prominent "start over" button at the top.

**suggested improvement:** Add a `<div class="bar">` at the top of the fixer with a "start over" button. Handler: confirm, then clear the three localStorage keys and reset all three fields to empty. Match the image-style pattern exactly.

**value:** M  
**effort:** XS  
**status:** NEW  
**risk/constraint:** No brackets. localStorage key versioning is a separate (DX) concern.

---

### F16-02

**pass:** 16  
**tool:** FIXER  
**lens:** Cross-tool UX parity  
**title:** No status span showing current operation — the fixer has no equivalent of wizard's `#status` or image-style's `#busyHint`

**observation** (`fixer-html-panel-1.txt:1–148`): The wizard has `<span id="status" aria-live="polite">` and `<span id="busyHint" role="status">`. The image-style tool has `<span id="status">` and `<span id="busyHint">`. The fixer has neither; the only feedback is the hidden-then-visible `loaderEl` spinner in Step 2.

**suggested improvement:** Add a `<span id="fixStatus" role="status" aria-live="polite" aria-atomic="true" style="font-size:85%; opacity:0.85;"></span>` alongside the "start over" button (F16-01). Wire: "fixing..." on start, "done — review the sections below" on finish.

**value:** H  
**effort:** XS  
**status:** NEW  
**risk/constraint:** Text is bracket-free. Can stand alone even without F16-01's bar div.

---

### F16-03

**pass:** 16  
**tool:** FIXER  
**lens:** Cross-tool UX parity  
**title:** Fixer `<style>` has no `min-height` on buttons — inconsistent with wizard/image-style touch targets

**observation** (`fixer-html-panel-1.txt:147`): `.fixBtns button { padding:0.5rem 1rem; }` — no `min-height`. The wizard has `button { min-height:44px; }` (`char-wiz-html:2821`). Fixer buttons are approximately 36–38px tall.

**suggested improvement:** Add to fixer `<style>`:
```
button, input { min-height: 44px; }
:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 4px; }
```

**value:** M  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md C2/L5 — touch targets; this finding applies specifically to the fixer CSS)  
**risk/constraint:** No brackets. CSS-only addition.

---

### F16-04

**pass:** 16  
**tool:** IMAGE-STYLE  
**lens:** Cross-tool UX parity  
**title:** `.styleBtn` has no `min-height` — style picker buttons are sub-44px

**observation** (`image-style-builder-html-panel-8.txt:185`): `.styleBtn { padding:0.4rem 0.8rem; }` — no `min-height`. At ~28–30px rendered height. The wizard's `<style>` explicitly targets `.styleBtn { min-height:44px; }` (`char-wiz-html:2821`); this rule is absent from the image-style CSS block.

**suggested improvement:** Add to image-style `<style>`:
```
button, input, .styleBtn { min-height: 44px; }
:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 4px; }
```

**value:** M  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md C2, L5 — secondary files flagged; this finding is specific to image-style CSS)  
**risk/constraint:** No brackets. CSS-only.

---

### F16-05

**pass:** 16  
**tool:** FIXER  
**lens:** Cross-tool UX parity  
**title:** Silent download success — no feedback that `character.json` was created

**observation** (`fixer-html-panel-1.txt:135–139`): `buildAndDownload()` triggers a file download silently on success. Mobile browser download notifications vary; users may be unsure whether the action succeeded.

**suggested improvement:** After `downloadFile(...)` in `buildAndDownload()`, set the status span (from F16-02): "Downloaded character.json — import it into AI Character Chat." Clear after 4 seconds. Bracket-free.

**value:** L  
**effort:** XS  
**status:** NEW  
**risk/constraint:** No brackets.

---

### F16-06

**pass:** 16  
**tool:** IMAGE-STYLE  
**lens:** Cross-tool UX parity  
**title:** No workflow context for prefix/suffix — users do not know where to paste the results

**observation** (`image-style-builder-html-panel-8.txt:32–38`): The output labels explain what prefix/suffix are but not how to use them in ACC. The wizard bakes them into export automatically; standalone image-style tool users must copy manually, but no instruction says so.

**suggested improvement:** Add a hint paragraph in the Result card below the copy buttons: "Paste the prefix into imagePromptPrefix and the suffix into imagePromptSuffix in your ACC character settings, or use the AI Character Set Builder to apply them automatically on export." Bracket-free.

**value:** M  
**effort:** XS  
**status:** NEW  
**risk/constraint:** No brackets.

---

### F16-07

**pass:** 16  
**tool:** FIXER  
**lens:** Cross-tool UX parity  
**title:** Fixer uses `.fixCard` / `.fixBtns` class names — diverges from shared `.card` / `.row` vocabulary

**observation** (`fixer-html-panel-1.txt:143–147`): `.fixCard` and `.fixBtns` duplicate the wizard's `.card` and `.row` patterns verbatim but under different names. This is purely a maintainability/DX gap.

**suggested improvement:** Rename `.fixCard` to `.card` and `.fixBtns` to `.row` in fixer source. No visual change; aligns with the shared vocabulary across all three tools.

**value:** L  
**effort:** XS  
**status:** NEW  
**risk/constraint:** No functional change. Rename is purely cosmetic/DX.

---

### F16-08

**pass:** 16  
**tool:** FIXER  
**lens:** Cross-tool UX parity  
**title:** Fixer exports `maxTokensPerMessage: 500`; wizard default is 800

**observation** (`fixer-html-panel-1.txt:91`): `maxTokensPerMessage: 500` is hardcoded. The wizard exports 800 (post-correctness-audit fix). Characters exported via the fixer will have shorter AI replies by default.

**suggested improvement:** Update to `maxTokensPerMessage: 800` to match the wizard's verified default. One-line change.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (audit-correctness.md — `maxTokensPerMessage` 500-vs-800 parity noted; the improvement framing — applying it to the fixer — is new here)  
**risk/constraint:** Purely a numeric default change. No export schema risk.

---

## Pass 17 — Unlabeled Controls on Sister Tools

---

### F17-01

**pass:** 17  
**tool:** FIXER  
**lens:** Unlabeled controls  
**title:** `#brokenText` textarea has no `aria-label`

**observation** (`fixer-html-panel-1.txt:8`): `<textarea id="brokenText" placeholder="Paste the messed-up character here." ...>` — no `aria-label` or `<label for="brokenText">`. Screen readers rely on the placeholder text as the accessible name, which disappears once content is entered.

**suggested improvement:** Add `aria-label="Broken character text to repair"` to the textarea in markup. Bracket-free.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md L5 — "fixer line 8, no aria-label on main textarea")  
**risk/constraint:** No brackets. Direct markup attribute.

---

### F17-02

**pass:** 17  
**tool:** FIXER  
**lens:** Unlabeled controls  
**title:** `#generateBtn` is hidden but has no `aria-label` — when shown it would announce as "button"

**observation** (`fixer-html-panel-1.txt:18`): `<button id="generateBtn" style="display:none;"></button>` — empty text, no `aria-label`. The wizard sets `aria-label="Generate"` on its equivalent (`char-wiz-html:334`).

**suggested improvement:** Add `aria-label="Generate"` to match the wizard's pattern.

**value:** M  
**effort:** XS  
**status:** NEW (audit-a11y-mobile.md L5 flags fixer line 8 only; the generateBtn gap is a distinct new finding)  
**risk/constraint:** No brackets. No functional change.

---

### F17-03

**pass:** 17  
**tool:** FIXER  
**lens:** Unlabeled controls  
**title:** `#stylePrefixInput` has no label — preceding `<p>` is not programmatically associated

**observation** (`fixer-html-panel-1.txt:26–27`): The `<p style="font-size:85%;">Image style prefix (optional):</p>` at line 26 is prose, not a `<label>`. The `<input id="stylePrefixInput">` at line 27 has no `aria-label` or `aria-labelledby`.

**suggested improvement:** Add `aria-label="Image style prefix (optional)"` to the input, matching the intent of the adjacent prose label. Bracket-free.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (pre-seed B — "stylePrefixInput@27" listed as unlabeled; this adds the specific fix)  
**risk/constraint:** No brackets.

---

### F17-04

**pass:** 17  
**tool:** FIXER  
**lens:** Unlabeled controls  
**title:** "Download character.json" button has no extended description of what it downloads

**observation** (`fixer-html-panel-1.txt:29`): The button text "download character.json" is functional but tells AT users nothing about where to use the file. The wizard's export buttons are similarly terse.

**suggested improvement:** Add `aria-label="Download character as JSON file for import into AI Character Chat"` to the download button. The visible label stays unchanged.

**value:** L  
**effort:** XS  
**status:** NEW  
**risk/constraint:** No brackets.

---

### F17-05

**pass:** 17  
**tool:** IMAGE-STYLE  
**lens:** Unlabeled controls  
**title:** `#styleNotes` input has no `aria-label` — preceding `<p>` is not programmatically associated

**observation** (`image-style-builder-html-panel-8.txt:18–19`): `<p class="hint">Optional extra notes (mood, palette, era):</p>` is not linked via `for=` or `aria-labelledby`. `<input id="styleNotes" placeholder="e.g. muted teal palette, foggy, melancholic">` has no `aria-label`. The wizard's equivalent (`char-wiz-html:133`) has `aria-label="Image style extra notes (optional)"`.

**suggested improvement:** Add `aria-label="Optional extra notes for style (mood, palette, era)"` to match the wizard's pattern.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (pre-seed B — "styleNotes@19 placeholder-only (no aria-label)")  
**risk/constraint:** No brackets.

---

### F17-06

**pass:** 17  
**tool:** IMAGE-STYLE  
**lens:** Unlabeled controls  
**title:** `#prefixOut` textarea has no `aria-label`

**observation** (`image-style-builder-html-panel-8.txt:33`): `<textarea id="prefixOut" class="out2" placeholder="The style prefix appears here (editable)">` — no `aria-label`. Wizard equivalent at `char-wiz-html:136` has `aria-label="Generated image prompt prefix (editable)"`.

**suggested improvement:** Add `aria-label="Generated image prompt prefix (editable)"`.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (pre-seed B — "prefixOut@33 placeholder-only")  
**risk/constraint:** No brackets.

---

### F17-07

**pass:** 17  
**tool:** IMAGE-STYLE  
**lens:** Unlabeled controls  
**title:** `#suffixOut` textarea has no `aria-label`

**observation** (`image-style-builder-html-panel-8.txt:37`): `<textarea id="suffixOut" class="out2" placeholder="The quality suffix appears here (editable)">` — no `aria-label`. Wizard equivalent at `char-wiz-html:138` has `aria-label="Generated image prompt suffix (editable)"`.

**suggested improvement:** Add `aria-label="Generated image prompt suffix (editable)"`.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (pre-seed B — "suffixOut@37 placeholder-only")  
**risk/constraint:** No brackets.

---

### F17-08

**pass:** 17  
**tool:** IMAGE-STYLE  
**lens:** Unlabeled controls  
**title:** `#styleAdj` input has no `aria-label`

**observation** (`image-style-builder-html-panel-8.txt:41`): `<input id="styleAdj" class="adj" placeholder="e.g. warmer, less saturated, more painterly">` — no `aria-label`. Wizard equivalent at `char-wiz-html:139` has `aria-label="Image style adjustment"`.

**suggested improvement:** Add `aria-label="Style adjustment request"`.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (pre-seed B — "styleAdj@41 placeholder-only")  
**risk/constraint:** No brackets.

---

### F17-09

**pass:** 17  
**tool:** IMAGE-STYLE  
**lens:** Unlabeled controls  
**title:** `#styleRaw` textarea inside `<details>` has no `aria-label`

**observation** (`image-style-builder-html-panel-8.txt:46`): `<textarea id="styleRaw" class="out" placeholder="Raw labeled output">` — no `aria-label`. Screen reader users who open the `<details>` element encounter an unlabeled textarea.

**suggested improvement:** Add `aria-label="Raw AI output (for debugging)"`.

**value:** L  
**effort:** XS  
**status:** NEW (pre-seed B does not specifically call out styleRaw; this is a finer finding beyond the pre-seeded list)  
**risk/constraint:** No brackets.

---

### F17-10

**pass:** 17  
**tool:** IMAGE-STYLE  
**lens:** Unlabeled controls  
**title:** `#status` span has no `aria-live` or `role` — updated on every style selection but invisible to AT

**observation** (`image-style-builder-html-panel-8.txt:6`): `<span id="status" style="font-size:85%; opacity:0.85;">` — no `aria-live`, no `role`. Updated by `updateStatus()` (lines 116–120) whenever the user picks a style. The wizard's equivalent at `char-wiz-html:13` has `aria-live="polite" aria-atomic="true"`.

**suggested improvement:** Add `aria-live="polite" aria-atomic="true" role="status"` to match the wizard.

**value:** H  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md L5 — "image-style-builder-html-panel-8.txt: span id=status on line 6 lacks aria-live")  
**risk/constraint:** No brackets.

---

## Pass 18 — Live-Region / Status Announcements Parity

---

### F18-01

**pass:** 18  
**tool:** FIXER  
**lens:** Live-region/status parity  
**title:** No `aria-live` region anywhere in the fixer — generation state is invisible to AT

**observation** (`fixer-html-panel-1.txt:1–148`): Zero ARIA live regions in the file. No `aria-live`, no `role="status"`, no `role="alert"`. Contrast: wizard has `#status` (`aria-live="polite"`) and `#busyHint` (`role="status"`); image-style has `#busyHint` at line 29.

**suggested improvement:** Add `<span id="fixStatus" role="status" aria-live="polite" aria-atomic="true" style="font-size:85%; opacity:0.85;"></span>` to the fixer (in a header bar area). Wire from JS: "Fixing character..." on start, "Done — check sections below, then download." on finish, "No character detected in output." on validation failure. All text is bracket-free.

**value:** H  
**effort:** XS  
**status:** NEW  
**risk/constraint:** No brackets. The status span is purely additive.

---

### F18-02

**pass:** 18  
**tool:** IMAGE-STYLE  
**lens:** Live-region/status parity  
**title:** `#busyHint` has no `aria-live` or `role` attribute — visual-only busy indicator

**observation** (`image-style-builder-html-panel-8.txt:29`): `<span class="hint" id="busyHint"></span>` — no `aria-live`, no `role="status"`. Updated to "building style..." (line 142) and cleared (line 146). The wizard's `busyHint` at `char-wiz-html:336` has `role="status"` with the comment at line 776–778 explaining the rationale.

**suggested improvement:** Add `role="status" aria-live="polite" aria-atomic="true"` to `#busyHint` in image-style markup. Direct parity with the wizard.

**value:** H  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md L5 for the `#status` span; `busyHint` gap is a distinct new finding under pass 18)  
**risk/constraint:** No brackets.

---

### F18-03

**pass:** 18  
**tool:** IMAGE-STYLE  
**lens:** Live-region/status parity  
**title:** Copy-to-clipboard confirmation spans `#cp1` / `#cp2` have no `aria-live` — keyboard users miss the "copied" feedback

**observation** (`image-style-builder-html-panel-8.txt:34, 38`): `<span class="hint" id="cp1"></span>` and `<span class="hint" id="cp2"></span>` — no `aria-live`. `copyField()` at line 157 sets `el(noteId).textContent = "copied"` then clears after 1.5s. AT users who triggered the copy action keyboard-only receive no confirmation.

**suggested improvement:** Add `aria-live="polite" aria-atomic="true"` to both `#cp1` and `#cp2` spans in markup. The "copied" and "select + copy" strings set by JS are bracket-free.

**value:** M  
**effort:** XS  
**status:** NEW  
**risk/constraint:** No brackets.

---

### F18-04

**pass:** 18  
**tool:** WIZARD  
**lens:** Live-region/status parity  
**title:** `aria-busy` is set on `#tab-builder` but `#tab-image` has no `aria-busy` during image generation

**observation** (`char-wiz-html:779–781, 377, 2617–2632`): `setBusy(msg)` sets `aria-busy` on `el("tab-builder")`. Image generation runs from `#tab-image` and updates `#igBusy` (which correctly has `role="status"` at line 377). But `#tab-image` never gets `aria-busy="true"` during the image generation loop even though the results grid fills progressively.

**suggested improvement:** In `igGenerate()`, add `var ip = el("tab-image"); if(ip) ip.setAttribute("aria-busy","true");` before the loop, and `if(ip) ip.setAttribute("aria-busy","false");` in the finally block.

**value:** M  
**effort:** XS  
**status:** FINER (audit-a11y-mobile.md H8 notes aria-busy gap for generate buttons; this extends it to the image tab panel specifically)  
**risk/constraint:** No brackets. JS-only addition.

---

### F18-05

**pass:** 18  
**tool:** WIZARD  
**lens:** Live-region/status parity  
**title:** Consistency check completion is not announced — `busyHint` clears silently with no issue count

**observation** (`char-wiz-html:1024–1044`): After consistency check, `onWizFinish` calls `setBusy("")` (clears busyHint to empty) then renders results. AT users receive no "X issues found" announcement.

**suggested improvement:** After rendering consistency results, set: `el("busyHint").textContent = "Consistency check complete — " + n + " issue(s) found.";` then clear after 3 seconds. This extends audit-a11y-mobile.md M7 to route through `busyHint` (the correct live region) rather than `#status`.

**value:** M  
**effort:** XS  
**status:** FINER (audit-a11y-mobile.md M7 — consistency results not announced; this finding clarifies the correct live region and provides the exact message text)  
**risk/constraint:** No brackets.

---

### F18-06

**pass:** 18  
**tool:** FIXER  
**lens:** Live-region/status parity  
**title:** Export validation error uses `alert()` — intrusive modal instead of inline announcement

**observation** (`fixer-html-panel-1.txt:137`): `alert("No character detected yet - fix or paste the sections first.");` — same `alert()` pattern that ISSUES.md flags as a medium item for the wizard. In the fixer this is the only validation message path.

**suggested improvement:** Replace `alert(msg)` with inline display via the `#fixStatus` span (F18-01). Toggle `role="alert"` (assertive) for error messages and `role="status"` (polite) for informational messages, matching the wizard's `#importStatus` pattern at `char-wiz-html:34`.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (ISSUES.md MED — "alert() used for all validation"; this applies that recommendation to the fixer's single alert call)  
**risk/constraint:** No brackets in message text.

---

## Pass 19 — Focus Management and Keyboard Navigation

---

### F19-01

**pass:** 19  
**tool:** FIXER  
**lens:** Focus management / keyboard nav  
**title:** No `:focus-visible` CSS rule — keyboard users have no focus indicator

**observation** (`fixer-html-panel-1.txt:143–148`): The fixer `<style>` block has no `:focus-visible` or `:focus` rule. The wizard defines `:focus-visible { outline:2px solid currentColor; outline-offset:2px; border-radius:4px; }` at `char-wiz-html:2819`. Browser default focus rings are inconsistent across Perchance's host stylesheet.

**suggested improvement:** Add the identical rule to fixer `<style>`:
```
:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 4px; }
```

**value:** H  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md C3 — no keyboard focus styles; this finding applies specifically to the fixer which was secondary in that audit)  
**risk/constraint:** No brackets. CSS-only.

---

### F19-02

**pass:** 19  
**tool:** IMAGE-STYLE  
**lens:** Focus management / keyboard nav  
**title:** No `:focus-visible` CSS rule — keyboard users have no focus indicator

**observation** (`image-style-builder-html-panel-8.txt:178–192`): Same gap as F19-01. No `:focus-visible` in the image-style `<style>` block.

**suggested improvement:** Add:
```
:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; border-radius: 4px; }
```

**value:** H  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md C3 — sister tools secondary)  
**risk/constraint:** No brackets. CSS-only.

---

### F19-03

**pass:** 19  
**tool:** FIXER  
**lens:** Focus management / keyboard nav  
**title:** No focus-to-result after generation — keyboard users remain focused on the "fix character" button

**observation** (`fixer-html-panel-1.txt:9–11`): After `generate()` resolves, no code moves focus. The wizard's `onWizFinish` at `char-wiz-html:1001–1010` explicitly moves focus to the active output textarea. The fixer has no equivalent completion hook exposed to the HTML panel.

**suggested improvement:** Add `window.onFixFinish = function(){ var r = document.getElementById("responseEl"); if(r && r.offsetParent !== null) r.focus({ preventScroll: false }); }` to the fixer `<script>`. Call from data panel's completion hook, or use a `MutationObserver` on `responseEl` changes in the HTML panel (fully self-contained). No brackets.

**value:** H  
**effort:** S  
**status:** FINER (audit-a11y-mobile.md H6 — "no focus return after async generation" on wizard; this applies the pattern to the fixer where it is entirely absent)  
**risk/constraint:** No brackets. MutationObserver approach avoids data-panel coordination.

---

### F19-04

**pass:** 19  
**tool:** IMAGE-STYLE  
**lens:** Focus management / keyboard nav  
**title:** No focus-to-result after style generation — keyboard users remain on "build style" button

**observation** (`image-style-builder-html-panel-8.txt:145–152`): `onStyleFinish` calls `save()` and sets prefix/suffix values but does not move focus. The `prefixOut` textarea would be the logical focus destination.

**suggested improvement:** Add `var p = el("prefixOut"); if(p && p.offsetParent !== null) p.focus({ preventScroll: false });` at the end of `onStyleFinish`. Bracket-free JS.

**value:** M  
**effort:** XS  
**status:** FINER (audit-a11y-mobile.md H6 — applied to the image-style tool specifically)  
**risk/constraint:** No brackets.

---

### F19-05

**pass:** 19  
**tool:** FIXER  
**lens:** Focus management / keyboard nav  
**title:** `#stylePrefixInput` Enter key does not trigger download — requires Tab to reach the button

**observation** (`fixer-html-panel-1.txt:27`): `#stylePrefixInput` is the last form control before the "download character.json" button. No `keydown` handler is wired. The single-field-then-action pattern makes Enter-to-download especially intuitive here.

**suggested improvement:** Add:
```js
document.getElementById("stylePrefixInput").addEventListener("keydown", function(e){ if(e.key === "Enter") buildAndDownload(); });
```
Bracket-free JS.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md L4 — "no Enter-to-generate on adjustment inputs"; this is a finer application to the fixer's export input)  
**risk/constraint:** No brackets.

---

### F19-06

**pass:** 19  
**tool:** IMAGE-STYLE  
**lens:** Focus management / keyboard nav  
**title:** `#styleAdj` has no Enter-key handler — requires Tab to reach "apply adjustment"

**observation** (`image-style-builder-html-panel-8.txt:41`): The adjustment input leads to the "apply adjustment" button. No `keydown` handler. Identical gap to ISSUES.md LOW "style adj inputs lose focus on mobile Safari keyboard dismiss."

**suggested improvement:** Add after DOM ready:
```js
el("styleAdj").addEventListener("keydown", function(e){ if(e.key === "Enter") genStyle(true); });
```
Bracket-free.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md L4; ISSUES.md LOW — style adj inputs; this is a finer application to the image-style tool)  
**risk/constraint:** No brackets.

---

### F19-07

**pass:** 19  
**tool:** IMAGE-STYLE  
**lens:** Focus management / keyboard nav  
**title:** `#styleNotes` Enter key does not trigger "build style"

**observation** (`image-style-builder-html-panel-8.txt:19–20`): `#styleNotes` is followed by the "build style" button with no Enter handler.

**suggested improvement:** Add:
```js
el("styleNotes").addEventListener("keydown", function(e){ if(e.key === "Enter") genStyle(false); });
```

**value:** L  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md L4)  
**risk/constraint:** No brackets.

---

### F19-08

**pass:** 19  
**tool:** WIZARD  
**lens:** Focus management / keyboard nav  
**title:** `showTab()` does not move focus to first focusable element in the new panel — audit H5 confirmed open

**observation** (`char-wiz-html:2644–2685`): The `a11yInit` block wires Arrow-key navigation between tabs correctly but `showTab()` itself does not move focus into the revealed panel. Audit-a11y-mobile.md H5 recommended this; confirmed still open.

**suggested improvement:** In `showTab(which)`, after revealing the panel add:
```js
var first = el(which === "image" ? "igPrompt" : "scenarioNotes");
if(first) setTimeout(function(){ first.focus(); }, 0);
```
Matches the audit's verbatim recommendation.

**value:** M  
**effort:** XS  
**status:** CONFIRMS (audit-a11y-mobile.md H5 — focus move on tab switch)  
**risk/constraint:** `setTimeout(0)` ensures paint cycle completes before focus moves. No brackets.

---

### F19-09

**pass:** 19  
**tool:** FIXER  
**lens:** Focus management / keyboard nav  
**title:** `#responseEl` is in natural tab order but is a monospace output textarea users should reach only via programmatic focus

**observation** (`fixer-html-panel-1.txt:21`): Effective tab order is: `brokenText` → fix button → `responseEl` (300px monospace textarea) → `stylePrefixInput` → download button. A keyboard user tabbing through Step 3 must pass through the output textarea, which accepts Tab as focus and requires Escape or another Tab to leave.

**suggested improvement:** Add `tabindex="-1"` to `#responseEl`. Rely on `onFixFinish` focus management (F19-03) to bring keyboard users there after generation programmatically. Users who want to edit the response can still click into it; only the Tab-stop is removed.

**value:** L  
**effort:** XS  
**status:** NEW  
**risk/constraint:** Users who prefer keyboard-only editing of output would need to click or use the virtual cursor. Document in the Step 2 hint (F14-05) that the output is reachable by clicking.

---

*End of agent-4 findings (passes 14–19). Total findings: 37.*
