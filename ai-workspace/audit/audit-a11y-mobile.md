# Accessibility & Mobile UX Audit — AI Character Set Builder

**Date:** 2026-06-18  
**Auditor:** Claude Code (automated, read-only)  
**Primary file audited:** `char-wiz-html` (2541 lines; lines 1–371 markup, 372–2506 JS, 2507–2541 CSS)  
**Secondary files:** `fixer-html-panel-1.txt` (148 lines), `image-style-builder-html-panel-8.txt` (192 lines)  
**Standard:** WCAG 2.2 Level AA; ARIA Authoring Practices Guide (APG) 1.2  
**Scope:** Read-only. No source files were modified.

---

## Executive Summary

The wizard UI has a solid semantic foundation (one `<h1>`, real `<button>` elements throughout, several correct `aria-label` and `role="status"` placements) but carries **4 Critical**, **10 High**, **9 Medium**, and **5 Low** issues spanning five categories:

1. **Mobile/viewport** — No `<meta name="viewport">` anywhere in the file. The tool is served inside Perchance's own page shell, which may inject one, but the source file itself has no guarantees. This is the single most impactful mobile issue.
2. **Touch targets** — Every button and form control is below the WCAG 2.5.8 (AA, 2.2) 24×24 px minimum. On Android this is the primary usability barrier.
3. **Focus styles** — No `:focus` or `:focus-visible` rules for keyboard users; only the `.tabbtn.active` outline style exists (which is an active/selected state, not a focus state).
4. **ARIA/live regions** — Streaming output and generation completion are not announced; tab buttons lack `aria-selected`; dynamic buttons lack `aria-label`.
5. **Form labels** — Multiple `<select>` and `<input>` elements have no associated label (WCAG 1.3.1 failure).

**Paste-safety note (Perchance-specific):** Perchance templates `[...]` and `{...}` expressions in HTML markup (everything before the first `<script>`). HTML-entity escaping is unreliable. No proposed fix in this report requires placing raw brackets/braces in markup — all bracket-containing strings must be set from `<script>`.

---

## Findings Table

### Critical (WCAG A failures or blocking mobile UX)

| # | Issue | Location | Recommended Fix | Paste-Safety Note |
|---|-------|----------|-----------------|-------------------|
| C1 | **No viewport meta tag** — No `<meta name="viewport">` in file; mobile browsers default to 980px desktop viewport causing horizontal scroll and tiny touch targets | Absent from entire file | Add `<meta name="viewport" content="width=device-width, initial-scale=1">` in the Perchance page shell or at top of HTML panel. Perchance's own page shell likely provides this, but the source has no guarantee. Verify in live tool via DevTools. | No brackets needed |
| C2 | **Touch targets below 24px minimum** — All buttons, selects, and inputs have padding-only sizing that results in ~30–38px total height (WCAG 2.5.8 AA requires 24px rendered hit area; 2.5.5 AAA requires 44px). `.tabbtn`: ~38px. `.row button/select`: ~36px. `.styleBtn`: ~30px. Inline `<select>` on lines 17/94/284: ~30px. Number inputs on lines 253–255 with `padding:0.3rem`: ~24px borderline. | CSS lines 2512, 2526, 2530; inline styles lines 17, 94, 284, 253–255 | Add `min-height: 44px` to all interactive controls CSS. WCAG 2.5.5 (AAA) target is 44×44px; 2.5.8 (AA) requires 24×24px rendered area. For primary actions like "generate" add explicit `min-height: 48px; padding: 0.75rem 1.25rem;`. | No brackets needed |
| C3 | **No keyboard focus styles** — No `:focus` or `:focus-visible` rule for any interactive element. Only `.tabbtn.active { outline: 2px solid currentColor; }` exists, which is the selected-state style, not keyboard focus. Keyboard users see no focus indicator (WCAG 2.4.7 Focus Visible, AA). | CSS line 2513 (only rule); missing `:focus-visible` for `button, input, select, textarea` | Add: `.tabbtn:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }` | No brackets needed |
| C4 | **Unlabeled form controls** — The following controls have no `<label for="...">`, `aria-label`, or `aria-labelledby` (WCAG 1.3.1, 4.1.2 Level A failures): `loreMode` (line 94), `lorebookUrl` (line 102), `imMusic` (line 197), `tunCtx` (line 266), `tunWriting` (line 271), `sceneMode` (line 284). Screen readers announce these as "select, blank". | Lines 94, 102, 197, 266, 271, 284 | Add `aria-label` attributes in markup OR set from script: e.g. `el("loreMode").setAttribute("aria-label","How to attach lore")`. All proposed label text is bracket-free. | Only needed if label text contains brackets — none do here |

### High (WCAG AA violations)

| # | Issue | Location | Recommended Fix | Paste-Safety Note |
|---|-------|----------|-----------------|-------------------|
| H1 | **Duplicate `id="buildMode"` on 3 identical `<select>` elements** — Lines 17, 25, 33 each declare `id="buildMode"`. Duplicate IDs are invalid HTML; only the first `<label for="buildMode">` will associate with the first select. The other two are effectively unlabeled. | Lines 17, 25, 33 | This appears to be a build bug (three copies of the same UI block). Remove the two duplicates at lines 23–29 and 31–37. | No brackets needed |
| H2 | **Implicit labels without explicit `for=` attribute** — Number inputs and selects wrapped in `<label class="hint">` are implicit labels (WCAG 4.1.2 warns these are weak; explicit `for="id"` is more reliable across AT). Affected: `imMemMax` (line 203), `tunTemp` (253), `tunMaxTokens` (254), `tunMaxParas` (255), `tunAutoMem` (262), `shareTarget` (308). | Lines 203, 253–255, 262, 308 | Add explicit `for="elementId"` to each wrapping `<label>`. Example: `<label class="hint" for="tunTemp">Temperature: <input id="tunTemp" ...>` | No brackets needed |
| H3 | **Heading hierarchy skips H2** — `<h1>` at line 1 then `<h3>` at line 40, 50, 64, 78, 85, 107, 122, etc. with no `<h2>` at any point. Screen reader users navigating by headings experience a confusing structural gap. | Lines 40, 50, 64, 78, 85, 107, 122, 130, 140, 151, 169, 247, 281, 304, 349 | Change all `<h3>` section headings to `<h2>` (they are top-level sections of the tool, not sub-headings). | No brackets needed |
| H4 | **Tab buttons lack `aria-selected` and tablist/tab roles** — `<button id="tabBtnBuilder">` and `<button id="tabBtnImage">` are plain buttons in a div. ARIA APG Tabs pattern requires: `<div role="tablist">` containing `<button role="tab" aria-selected="true/false" aria-controls="panelId">`. The `showTab()` JS (line 2340) updates `.className` but not `aria-selected`. Screen readers cannot identify which tab is active. | Lines 3–6 (markup); line 2340–2346 (JS) | In markup: add `role="tablist"` to `.tabbar` div; add `role="tab"` and initial `aria-selected` to each button. In `showTab()` JS: add `el("tabBtnBuilder").setAttribute("aria-selected", which !== "image");` etc. Also add `role="tabpanel"` and `aria-labelledby` to `#tab-builder` and `#tab-image`. | No brackets needed in markup or JS values |
| H5 | **No focus move on tab switch** — When `showTab()` runs (line 2340), focus stays on the tab button. Keyboard users must tab through all content in the previous panel before reaching the new panel's content. ARIA APG: move focus to the tab panel or its first focusable child on activation. | JS line 2340–2346 | After panel show/hide in `showTab()`, add: `var first = el(which==="image" ? "igPrompt" : "scenarioNotes"); if(first) setTimeout(function(){ first.focus(); }, 0);` | No brackets in JS values |
| H6 | **No focus return after async generation completes** — `onWizFinish()` (line 831) clears `busyHint` and processes results but returns focus to nowhere. WCAG 2.4.3 (Focus Order) and APG guidance require returning focus to a logical location after async completion. | JS line 831–851 | At end of `onWizFinish()`, add: `if(window.activeOutputEl) window.activeOutputEl.focus();` | No brackets |
| H7 | **Generation errors not announced to screen readers** — Image gen errors are stored in `window.__imgErr` (lines 616, 625, 646) silently; no announcement. The `#status` aria-live region is only updated with cast names (`updateStatus()` line 1045). Error paths via `alert()` (lines 633, 762, 777) are accessible but disrupt flow. | JS lines 616, 633, 646, 762, 777, 831 | In `onWizFinish()`, update the status region: `el("busyHint").textContent = "Generation complete.";`. For errors, route to `el("status").textContent = "Error: " + msg;` | No brackets |
| H8 | **Generate button not disabled during generation** — `window.generate()` (line 632) shows the stop button but never `disabled` the generate button or any of the per-section `genScenario`, `genChar`, etc. buttons. Multiple simultaneous generations can be triggered. No `aria-busy="true"` set on the active output area. | JS line 632–640, 747–755 | In `startGen()` (line 747), set `aria-busy` on `activeOutputEl` and disable the triggering button. Re-enable in `onWizFinish()`. | No brackets |
| H9 | **Dynamically created buttons lack `aria-label`** — Consistency fix buttons (line 823–825): `btn.textContent = "apply to " + (it.character || "character")` — ambiguous without character context. Voice select dropdowns (line 1309): no `aria-label`. Color inputs (line 1656–1660): `<input type="color">` with no `aria-label`. Remove-extra buttons (line 869 region): "remove" with no character context. | JS lines 823–825, 869, 1309, 1656–1660 | Add `aria-label` to dynamic elements: `btn.setAttribute("aria-label","Apply consistency fix to " + it.character + ": " + it.fix.slice(0,40));` | JS strings can freely contain any text including brackets |
| H10 | **Fixed-position voice panel may obscure mobile content** — The dynamically injected voice panel (line 1281) uses `position:fixed; right:12px; bottom:56px; width:300px; max-width:86vw`. On narrow phones (<360px) this consumes most of the viewport. | JS line 1278–1285 | Reduce `width` to `min(90vw, 260px)`. On screens <480px, use `right:0; bottom:0; border-radius:12px 12px 0 0` (bottom sheet) for better UX. | No brackets |

### Medium (Best-practice WCAG AA; ARIA pattern improvements)

| # | Issue | Location | Recommended Fix | Paste-Safety Note |
|---|-------|----------|-----------------|-------------------|
| M1 | **aria-live status span lacks `role="status"`** — Line 12 has `aria-live="polite" aria-atomic="true"` on a `<span>` but no `role="status"`. Adding role makes AT behavior more explicit. | Line 12 | Add `role="status"` to the span. | No brackets |
| M2 | **`igBusy` and `busyHint` lack `aria-live` redundancy check** — `busyHint` (line 325) has `role="status"`. `igBusy` (line 366) has `role="status"`. This is correct. However, neither clears on completion with a confirming message — `busyHint` is set to `""` (line 832) silently. | Lines 325, 366, 832 | Set a brief completion message before clearing: `el("busyHint").textContent = "Done."; setTimeout(function(){ el("busyHint").textContent=""; }, 2000);` | No brackets |
| M3 | **Streaming output: do NOT add aria-live to output containers** — The output textareas (`.out` class) receive chunked content via `e.value = responseEl.value` (line 609). If any aria-live were ever added to these textareas, AT would announce every streaming chunk — extremely noisy. Current state (no aria-live on output) is CORRECT. The `busyHint` region (role="status") is the right place for status. | JS line 609 | Keep as-is. Only announce start ("generating...") and end ("Done.") via `busyHint`. Do NOT add aria-live to output textareas. | N/A |
| M4 | **Dynamic show/hide uses `display:none` not `hidden` attribute** — Tab panels, immersion body, lore URL wrap, etc. use `.style.display = "none"/""`; the `hidden` HTML attribute is more semantic and better supported across AT. Low risk since both are treated as hidden by AT. | Lines 99, 173, 250, 2342–2343 | Consider replacing with `el.hidden = true/false` for clarity. Not a WCAG failure but semantic best practice. | No brackets |
| M5 | **No mobile media query** — No `@media` breakpoints exist in the style block. Layout uses `width:95%; max-width:720px` and `flex-wrap:wrap` which reflows, but no touch-target enlargement, font scaling, or gap adjustments for small screens. | CSS (none found) | Add: `@media (max-width: 480px) { button, select, input, textarea { min-height: 44px; font-size: 16px; } .tabbtn { padding: 0.75rem 0.5rem; } }` | No brackets |
| M6 | **Input font-size below 16px (iOS Safari auto-zoom)** — CSS does not set `font-size` on `input`, `select`, or `textarea`. If inherited size is below 16px, iOS Safari auto-zooms the viewport on focus — disorienting. | CSS lines 2522–2528 | Add `input, select, textarea { font-size: 16px; }` or `font-size: max(16px, 1rem);` | No brackets |
| M7 | **Consistency results not announced** — After `renderConsistency()` (line 817) populates `#consistencyList`, there is no announcement to screen readers that new content appeared. | JS line 817–829 | After rendering, update status: `el("status").textContent = consistencyIssues.length + " issue(s) found.";` | No brackets in this text |
| M8 | **Hint text uses `opacity: 0.8`** — `.hint { font-size:85%; opacity:0.8; }` (line 2521). If the page background is light gray (`var(--box-color, #f0f0f0)`), gray hint text at 80% opacity may fall below 3:1 contrast (WCAG 1.4.3 AA requires 4.5:1 for small text, 3:1 for large). Cannot verify exact ratio without computed colors but flagging as a likely failure. | CSS line 2521 | Remove opacity or use an explicit color that meets 4.5:1 against the actual background. Check with https://webaim.org/resources/contrastchecker/ | No brackets |
| M9 | **Fixed pixel font sizes in dynamically injected voice panel** — Voice button (line 1278): `font:14px sans-serif`. Voice panel (line 1281): `font:13px sans-serif`. These do not scale with user font-size preferences. | JS lines 1278, 1281 | Replace with rem: `font: 0.875rem sans-serif` (14px) and `font: 0.8125rem sans-serif` (13px), or `1rem`. | No brackets |

### Low (Minor best-practices; WCAG AAA or advisory)

| # | Issue | Location | Recommended Fix | Paste-Safety Note |
|---|-------|----------|-----------------|-------------------|
| L1 | **No landmarks** — No `<main>`, `<nav>`, `<header>` landmarks. Screen reader users who navigate by landmarks cannot jump to the main content area. | Lines 1–371 | Wrap `.wrap` div in `<main>`. Add `<nav aria-label="Tool tabs">` around the tabbar. | Landmark labels are bracket-free |
| L2 | **`loaderEl` has `aria-hidden="true"` but receives `.innerHTML`** — Line 322 + line 637. The loader span is `aria-hidden`; `pendingObj.loadingIndicatorHtml` is injected into it. If the HTML is purely visual (spinner SVG), this is correct. If it ever contains text, it will be hidden from AT. | Lines 322, 637 | Confirm `loadingIndicatorHtml` is always a visual-only SVG/animation. If it ever contains meaningful text, move that text to the `busyHint` span instead. | N/A |
| L3 | **`img` elements in image results have no `alt` text** — `igGenerate()` (line 2363) and avatar/background generation create `<img>` elements with no `alt` attribute. | JS lines 2363, 1770–1790 region | Add `img.alt = "Generated image " + (i+1);` or a more descriptive alternative based on the prompt. | No brackets |
| L4 | **Keyboard shortcut gap: no Enter-to-generate on adjustment inputs** — `.adj` inputs (e.g. `scenarioAdj`, `loreAdj`) have no `onkeydown` for Enter key. User must tab to the button. | All `.adj` inputs throughout | Add `el("scenarioAdj").addEventListener("keydown", function(e){ if(e.key==="Enter") genScenario(true); });` etc. | No brackets |
| L5 | **`fixer-html-panel-1.txt` and `image-style-builder-html-panel-8.txt` — secondary tools have no `aria-label` on main textareas** — `fixer-html-panel-1.txt` line 8: `<textarea id="brokenText" placeholder="...">` — no aria-label. `image-style-builder-html-panel-8.txt`: `<span id="status">` on line 6 lacks `aria-live`. | `fixer-html-panel-1.txt` line 8; `image-style-builder-html-panel-8.txt` line 6 | Add `aria-label="Broken character text to repair"` to fixer textarea. Add `aria-live="polite" role="status"` to image builder status span. | No brackets needed |

---

## WCAG 2.2 / ARIA APG Guidance (Research Citations)

### aria-live regions for streaming output
Per ARIA 1.2 spec and APG guidance:
- **Do NOT put `aria-live` on the streaming output container** — updating a live region on every token causes a new announcement interrupt per chunk, which is unusable. This is confirmed by APG's guidance: "only use live regions for content that needs to be announced immediately."
- **Correct pattern:** Set `aria-busy="true"` on the container before generation starts; set it `false` after completion. Announce generation state changes (start/complete/error) via a separate `role="status"` region (polite) that updates once at key transitions, not per-chunk.
- **`aria-busy` behavior:** When `aria-busy="true"`, browsers/AT defer live region announcements until the region becomes non-busy. This is ideal for streaming.
- **Source:** ARIA 1.2 §6.6.5 (aria-busy), APG live region pattern at https://www.w3.org/WAI/ARIA/apg/patterns/

### role="status" vs role="alert" vs aria-live="polite"
- `role="status"` ≡ `aria-live="polite"` + `aria-atomic="true"` (implicitly). Use for non-urgent completion messages ("Generation complete.").
- `role="alert"` ≡ `aria-live="assertive"`. Use ONLY for errors that require immediate attention and interrupt current AT speech. Using assertive for routine status is intrusive.
- **For this tool:** `busyHint` with `role="status"` (existing at line 325) is correctly placed. It should announce: "Generating..." on start, "Done." on finish, and error messages on failure. The `role="alert"` on `importStatus` (line 147) is also correct for import errors.

### Tab panel keyboard pattern (ARIA APG)
ARIA APG Tabs Pattern (https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) requires:
- `role="tablist"` on the container
- `role="tab" aria-selected="true/false" aria-controls="panelId"` on each tab button
- `role="tabpanel" aria-labelledby="tabId" id="panelId"` on each panel
- **Keyboard:** Left/Right arrows move focus between tabs (with optional automatic activation); Enter/Space activates a manually-activated tab; Home/End jump to first/last tab.
- Plain `<button>` without `role="tab"` in a non-`role="tablist"` container is NOT a WCAG failure per se (it still works), but it fails the ARIA pattern semantics that screen readers rely on to expose tabs as a tab widget.

### Focus management after async actions
- WCAG 2.4.3 (Focus Order) requires focus to be logically ordered; it does not explicitly mandate moving focus after async completion.
- WCAG 2.4.11 (Focus Not Obscured, AA, new in 2.2) requires focused components not be fully hidden.
- APG guidance: when async content updates a region, announce via live region first; optionally move focus to the result if the action replaced the user's current context.
- **For this tool:** After generation, moving focus to `window.activeOutputEl` (the output textarea) is the correct APG pattern — it places the user at the generated result for immediate review.

### Touch target size (WCAG 2.5.5 vs 2.5.8)
- **WCAG 2.5.5 (AAA):** Target size at least 44×44 CSS pixels. Applies to pointer inputs. Advisory for AA, required for AAA.
- **WCAG 2.5.8 (AA, new in WCAG 2.2):** Target size at least 24×24 CSS pixels, OR spacing around the target such that a 24px circle centered on the target does not intersect another target's 24px circle. Exceptions: inline text links, native controls (user-agent-sized), essential (legally required) size.
- **For this tool:** The WCAG 2.5.8 AA minimum (24×24px rendered area including padding) is the binding requirement. `.row button` at `padding: 0.5rem 1rem` on a default `font-size: ~16px` renders approximately 36×32px — this likely passes 2.5.8 but may fail spacing requirement if buttons are packed tightly (`.row { gap: 0.5rem }` = 8px gap — below the 24px spacing for 2.5.8 circle math). Reaching 44px for all targets is strongly recommended given the mobile-primary audience.

---

## Verified vs Assumed

### Verified from source file
- Duplicate `id="buildMode"` at lines 17, 25, 33 — confirmed by direct read
- No `:focus-visible` rule — confirmed by exhaustive CSS block read (lines 2507–2541)
- `busyHint` has `role="status"` (line 325) — confirmed
- `importStatus` has `role="alert"` (line 147) — confirmed
- `#status` span has `aria-live="polite" aria-atomic="true"` (line 12) — confirmed
- `showTab()` does not set `aria-selected` (line 2340–2346) — confirmed
- `onWizFinish()` does not move focus or announce completion (line 831–851) — confirmed
- `loaderEl` has `aria-hidden="true"` (line 322) — confirmed
- All dynamically created image `<img>` elements have no `alt` (lines 2363, 1363 region) — confirmed
- CSS has no `@media` queries — confirmed by full style block read
- `.hint { opacity: 0.8 }` — confirmed (line 2521)
- Voice panel injected with `font:13px` and `position:fixed` — confirmed (lines 1278, 1281)

### Assumed / Requires Live Verification
- **Viewport meta tag:** This file lacks `<html>/<head>` — Perchance's page shell may inject a viewport meta. ASSUMED absent in tool output; requires live DevTools inspection to confirm.
- **Exact rendered touch target sizes:** CSS padding calculations are estimates; actual rendered height depends on Perchance's base stylesheet and any injected reset CSS.
- **Color contrast ratios:** `--box-color` CSS variable default is `#f0f0f0`; `.hint` text at `opacity:0.8` may or may not fail 4.5:1 depending on actual browser rendering. Requires DevTools contrast checker on live page.
- **`loadingIndicatorHtml` content:** Assumed to be a visual-only spinner. If it contains text, `aria-hidden="true"` on `loaderEl` becomes a bug.
- **Perchance's own page wrapper a11y:** The generator runs inside Perchance.org's own page. Perchance may add its own overlays, frames, or CSS that affect focus, contrast, or touch targets. Out of scope for this audit.
- **Screen reader testing:** All findings are from static analysis. Live AT testing (NVDA/VoiceOver + Chrome on Android) required to confirm announcement behavior.

---

## Secondary Files: fixer-html-panel-1.txt, image-style-builder-html-panel-8.txt

### fixer-html-panel-1.txt (148 lines)
- Line 8: `<textarea id="brokenText" placeholder="...">` — **no aria-label** (Critical, same as C4 pattern)
- Line 18: `<button id="generateBtn" style="display:none;">` — **no aria-label or text content** (Critical — empty button)
- No `role="status"` or `aria-live` on any element (no status region at all)
- Line 27: `<input id="stylePrefixInput" placeholder="...">` — **no aria-label** (Critical)

### image-style-builder-html-panel-8.txt (192 lines)
- Line 6: `<span id="status" ...>` — **no `aria-live` or `role="status"`** (unlike wizard which has both)
- Line 33: `<textarea id="prefixOut" ...>` — **no aria-label** (placeholder only)
- Line 37: `<textarea id="suffixOut" ...>` — **no aria-label** (placeholder only)
- Line 41: `<input id="styleAdj" ...>` — **no aria-label** (placeholder only)
- Line 19: `<input id="styleNotes" ...>` — **no aria-label**
- All style buttons in `#mainBtns`/`#subBtns` are dynamically created — same dynamic labeling gap as wizard

---

## Top 5 Prioritized Fixes

1. **[C3] Add `:focus-visible` styles** — One CSS rule fixes keyboard navigation for all users. Zero risk of paste-safety issue.
2. **[C2] Increase touch target sizes** — Add `min-height: 44px` blanket rule. Directly impacts primary mobile audience.
3. **[C4 + H1] Fix unlabeled form controls and duplicate IDs** — `loreMode`, `lorebookUrl`, `imMusic`, `tunCtx`, `tunWriting`, `sceneMode` need aria-labels; duplicate `buildMode` IDs need removal.
4. **[H4 + H5] Tab ARIA semantics + focus on switch** — Add `role="tablist"`, `role="tab"`, `aria-selected` to tab elements; move focus on `showTab()`. Two-part fix, low risk.
5. **[H6 + H7] Post-generation focus and status** — Move focus to output after `onWizFinish()`; announce "Done." / errors in `busyHint`. Pure JS additions, no markup change needed.
