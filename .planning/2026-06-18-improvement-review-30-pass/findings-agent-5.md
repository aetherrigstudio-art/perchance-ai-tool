# Findings — review-agent-5 (Passes 20–23)

**Agent:** review-agent-5  
**Date:** 2026-06-19  
**Scope:** char-wiz-html, fixer-html-panel-1.txt, image-style-builder-html-panel-8.txt (read-only)  
**Passes:** 20 (Touch-target sizing), 21 (Responsive/breakpoint depth), 22 (Visual a11y), 23 (Semantic structure)  
**Skills applied:** mobile-responsiveness, accessibility-engineer  
**Deduplicated against:** audit-a11y-mobile.md, ISSUES.md, root findings.md, pre-seed A/B/C

---

## Pass 20 — Touch-target sizing (WCAG 2.5.8 24px / mobile 44px)

---

### 20-A · mobile-responsiveness · touch-target · Wizard: immersion floaty "Voice" button misses 44px target

**Observation (`char-wiz-html:1469`):** The injected in-chat voice toggle button `#accVoiceBtn` uses hardcoded `padding:8px 12px` with `font:14px sans-serif`. Rendered height = 14px line-height + 16px padding = approx 30px. This falls below the de-facto mobile standard of 44px and is well short of AAA 2.5.5. The button sits 12px from the bottom viewport edge — on many phones the OS gesture swipe zone (20–44px on Android/iOS) can partially overlap it, reducing the effective target further.

**Suggested improvement:** In the `IMMERSION_FN` body at line 1469, change the padding from `8px 12px` to `12px 16px` and add `min-height:44px; min-width:44px` to the `cssText` string. This code is inside `<script>`, so all literal values are safe from Perchance templating. Example inline: `btn.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:99999;padding:12px 16px;min-height:44px;border-radius:18px;border:none;background:#5b6bff;color:#fff;cursor:pointer;font:0.875rem sans-serif;box-shadow:0 2px 8px rgba(0,0,0,0.3);";`

**Value:** M · **Effort:** XS · **Status:** CONFIRMS audit-a11y-mobile H10 + FINER — prior audit flagged only the panel width obscuring content; this notes the button's own height is sub-44px, which was not called out.  
**Risk/constraints:** This button is emitted as part of exported `customCode` (IMMERSION_FN serialized via `.toString()`), so the change affects the runtime injected into the user's ACC character, not the builder page itself. Safe to change — no Perchance escaping concern inside `<script>`.

---

### 20-B · mobile-responsiveness · touch-target · Image Style Builder: style-picker buttons sub-44px, no min-height rule anywhere

**Observation (`image-style-builder-html-panel-8.txt:185`):** `.styleBtn { padding:0.4rem 0.8rem; }` — at default 16px font-size this gives approx 6.4px + 16px + 6.4px = 29px height. The image-style builder has NO `min-height` rule anywhere in its `<style>` block (lines 178–192). Contrast with the wizard which added `button, select, summary, .tabbtn, .styleBtn { min-height:44px; }` at `char-wiz-html:2821`. The sister tool is entirely missing this fix. Also missing: `:focus-visible` rule.

**Suggested improvement:** Add to the `<style>` block of `image-style-builder-html-panel-8.txt`: `button, select, input:not([type=checkbox]):not([type=radio]) { min-height:44px; }` and update `.styleBtn` to also carry `min-height:44px`. Also add `:focus-visible { outline:2px solid currentColor; outline-offset:2px; border-radius:4px; }`. These are pure CSS additions with no bracket content.

**Value:** H · **Effort:** XS · **Status:** NEW — audit-a11y-mobile.md L5 flagged label gaps in the image-style builder but not the missing `min-height` rule; pre-seed noted `.styleBtn @185 ~24–30px` without a formal improvement entry.  
**Risk/constraints:** CSS-only, no markup change, no bracket risk.

---

### 20-C · mobile-responsiveness · touch-target · Fixer: only CSS rule is `.fixBtns button`, no min-height

**Observation (`fixer-html-panel-1.txt:147`):** `.fixBtns button { font-size:95%; padding:0.5rem 1rem; }` gives approx 8px + 16px + 8px = 32px rendered height. No `min-height`, no `:focus-visible` rule exists anywhere in the fixer `<style>` block (lines 143–148). The `<input id="stylePrefixInput">` at line 27 uses only `padding:0.5rem` — same approx 32px height.

**Suggested improvement:** Add to fixer `<style>`: `button, input { min-height:44px; } :focus-visible { outline:2px solid currentColor; outline-offset:2px; border-radius:4px; }` Also update `.fixBtns button` to include `min-height:44px`.

**Value:** M · **Effort:** XS · **Status:** NEW — audit-a11y-mobile flagged the fixer as secondary with label gaps but did not quantify the button height or call out the missing touch-target rule.  
**Risk/constraints:** Pure CSS, no markup change, no bracket risk.

---

### 20-D · mobile-responsiveness · touch-target · Wizard: inline padding overrides on `<select>` may fight min-height

**Observation (`char-wiz-html:109,193,247,252`):** The CSS rule `button, select, summary, .tabbtn, .styleBtn { min-height:44px; }` at line 2821 covers `<select>` elements. However, `loreMode` (line 109), `advAvatarShape` (line 193), `tunCtx` (line 247), and `tunWriting` (line 252) each carry inline `style="padding:0.3rem"` or `style="padding:0.4rem"` that may cause UA-inconsistent rendering. While `min-height` should win in the cascade, browser handling of `min-height` on `<select>` is inconsistent — some UA-styled selects ignore it on WebKit.

**Suggested improvement:** Add `min-height:44px` directly to each of these selects' inline styles, or move them to named classes that already carry the `min-height` rule. Belt-and-suspenders hardening.

**Value:** L · **Effort:** XS · **Status:** FINER than audit-a11y-mobile C2 (that flagged the original missing rule; a later phase added the rule, but this notes the inline-override tension that was not caught post-fix).  
**Risk/constraints:** Inline style fighting `min-height` via padding is browser-dependent. Verify on a live Perchance page.

---

## Pass 21 — Responsive / breakpoint depth

---

### 21-A · mobile-responsiveness · breakpoint · Wizard: single 480px breakpoint, phone-landscape gap at 481–640px

**Observation (`char-wiz-html:2823`):** The wizard has one `@media (max-width:480px)` rule that adjusts `.row` gap and sets buttons/selects to `flex:1 1 auto`. At viewport widths 481–640px (common phone-landscape: iPhone SE landscape = 568px, Android landscape = 600–640px), no responsive rule fires. Three or four buttons in a `.row` at 95% font-size each get roughly 150–200px wide, which can overflow or wrap poorly in this range.

**Suggested improvement:** Extend the breakpoint to `640px` or add a companion rule: `@media (max-width:640px) { .row { gap:0.6rem; } .row button, .row select { flex:1 1 auto; } }`. Pure CSS change inside existing `<style>` block. No bracket content.

**Value:** M · **Effort:** XS · **Status:** FINER than audit-a11y-mobile M5 — the prior audit noted "no @media breakpoints" for the pre-fix state; the 480px rule was added in a later phase; this notes the phone-landscape coverage gap that the single-breakpoint fix leaves.  
**Risk/constraints:** Purely additive CSS. Test at 568px (iPhone SE landscape) and 640px.

---

### 21-B · mobile-responsiveness · breakpoint · Image Style Builder: zero responsive rules

**Observation (`image-style-builder-html-panel-8.txt:178–192`):** The `<style>` block has zero `@media` queries. Layout uses `width:95%; max-width:720px; margin:0 auto` and `.row { display:flex; flex-wrap:wrap; gap:0.5rem; }`. On narrow phones: no font-size enforcement (iOS auto-zoom risk on inputs), no button `min-height`, no gap/padding adjustment.

**Suggested improvement:** Add at minimum: `@media (max-width:480px) { button, select, input { min-height:44px; font-size:16px; } .row button, .row select { flex:1 1 auto; } }` in the style block. Also add `:focus-visible { outline:2px solid currentColor; outline-offset:2px; border-radius:4px; }` as a global rule.

**Value:** M · **Effort:** XS · **Status:** NEW — image-style builder treated as secondary in prior audit; no breakpoint analysis was performed.  
**Risk/constraints:** Pure CSS. No bracket risk. `flex-wrap` already handles overflow; this tightens the behavior.

---

### 21-C · mobile-responsiveness · breakpoint · Fixer: zero responsive rules, fixed textarea heights consume viewport

**Observation (`fixer-html-panel-1.txt:8,21`):** The fixer's two main textareas use fixed heights: `height:200px` (brokenText) and `height:300px` (responseEl). On a 375px-wide phone, these fill the majority of the viewport, requiring vertical scrolling to reach the export section. No `@media` queries in the fixer `<style>` block (lines 143–148). The outer wrapper is an inline-styled `<div>` at line 3, not a class, which complicates media-query targeting.

**Suggested improvement:** Add to fixer `<style>`: `@media (max-width:480px) { #brokenText { height:140px; } #responseEl { height:200px; } button, input { min-height:44px; font-size:16px; } }`. ID selectors override class selectors so this will work despite the inline wrapper. The inline `style="width:95%..."` on the outer div does not need changing.

**Value:** M · **Effort:** S · **Status:** NEW — fixer not analyzed for responsive behavior in prior audit.  
**Risk/constraints:** The outer `<div>` at line 3 uses inline `style="width:95%;..."` so a CSS class rule cannot target it for width adjustments, but ID-selector height overrides on the textareas will work correctly.

---

### 21-D · mobile-responsiveness · fluid-units · Wizard: `.out` textarea `min-height:220px` not adjusted for mobile

**Observation (`char-wiz-html:2846`):** `.out { ... min-height:220px; height:auto; }` — on a 375px-wide phone, 220px consumes 59% of the viewport height per textarea. The builder has many `.out` textareas (mainOut, personaOut, loreOut, openingOut, etc.), forcing users to scroll through many phone-heights per card.

**Suggested improvement:** Add to the existing `@media (max-width:480px)` rule at line 2823: `.out { min-height:140px; } .notes { min-height:60px; }`. The `height:auto` already allows growth beyond the minimum; this only shrinks the minimum for narrow screens.

**Value:** M · **Effort:** XS · **Status:** FINER — the prior audit recommended adding a media query (M5); a rule was added for buttons only. This notes that the textarea min-heights were not adjusted as part of that fix.  
**Risk/constraints:** Pure CSS addition to existing `@media` block. No bracket risk.

---

### 21-E · mobile-responsiveness · fluid-units · All tools: no explicit `box-sizing:border-box` — potential input overflow

**Observation (all three tools, `<style>` blocks):** All three tools apply `width:100%` to inputs and textareas (via `.adj`, `.out`, inline `width:100%`). If Perchance's page shell does not inject `box-sizing:border-box`, inputs with padding overflow their container. No tool declares `box-sizing` in its own `<style>` block.

**Suggested improvement:** Add `*, *::before, *::after { box-sizing:border-box; }` or at minimum `input, textarea, select { box-sizing:border-box; }` to each tool's `<style>` block. Defensive and zero visual impact if the shell already provides it.

**Value:** L · **Effort:** XS · **Status:** NEW — not covered in any prior audit.  
**Risk/constraints:** Low risk. No bracket content.

---

## Pass 22 — Visual a11y (contrast, iOS font size, color-only signaling)

---

### 22-A · accessibility-engineer · contrast · Sister tools: `.hint` at opacity 0.8/0.85 on small text — likely WCAG 1.4.3 failure

**Observation (`image-style-builder-html-panel-8.txt:183,6`, `fixer-html-panel-1.txt:7,26`):**

- Image-style builder: `.hint { font-size:85%; opacity:0.8; }` at line 183 — identical pattern to wizard, which was flagged as M8 ("likely failure") in prior audit.
- Image-style builder: `<span id="status" style="font-size:85%; opacity:0.85;">` at line 6 — status span uses inline opacity 0.85, still suspect for small (85% = ~13.6px) text.
- Fixer: `<p style="font-size:85%;">` at lines 7 and 26 — no opacity set but small text on `var(--box-color, #f0f0f0)` background may approach the limit.

WCAG 1.4.3 (Contrast, AA) requires 4.5:1 for text smaller than 18pt/14pt bold. Text at 85% of base may sit at 13–14px; opacity 0.8 reduces effective contrast further.

**Suggested improvement:** In image-style builder `<style>`, change `.hint { font-size:85%; opacity:0.8; }` to `.hint { font-size:85%; color:#595959; }` — this color achieves approx 4.55:1 on `#f0f0f0` without collapsing opacity. Similarly, remove `opacity:0.85` from the inline status span style and set an explicit color. For the fixer, either add a `.hint` class with explicit color or remove the `font-size:85%` reduction from the inline paragraphs.

**Value:** M · **Effort:** XS · **Status:** CONFIRMS audit-a11y-mobile M8 for wizard; NEW for sister tools (the audit mentioned sister tools only in L5 for label gaps, not contrast).  
**Risk/constraints:** Using explicit `color:` instead of `opacity:` on hint text is safer across themes. No bracket content.

---

### 22-B · accessibility-engineer · ios-zoom · Sister tools: no font-size:16px on inputs — iOS Safari auto-zoom risk

**Observation (`image-style-builder-html-panel-8.txt:189`, `fixer-html-panel-1.txt:27`):**

- Image-style builder: `.adj { width:100%; padding:0.5rem; }` — no `font-size`. Inputs render at the page default which may be below 16px, triggering iOS Safari viewport auto-zoom on focus.
- Fixer: `<input id="stylePrefixInput" style="width:100%; padding:0.5rem;">` — no `font-size`. Both `<textarea>` elements also lack `font-size`.

Neither sister tool sets `font-size:16px` on inputs, textareas, or selects — the same gap as audit M6 for the wizard, unresolved in the sister tools.

**Suggested improvement:** Add to each sister tool `<style>`: `input, textarea, select { font-size:16px; }` (or `font-size:max(16px, 1rem)`). Pure CSS, no markup change, no bracket risk.

**Value:** H · **Effort:** XS · **Status:** CONFIRMS audit-a11y-mobile M6 for wizard; NEW for sister tools.  
**Risk/constraints:** Setting explicit `font-size:16px` may visually override page defaults — `max(16px, 1rem)` is safer. Verify appearance on a live generator.

---

### 22-C · accessibility-engineer · color-only · Image Style Builder: style-picker buttons have no `aria-pressed` — selected state invisible to AT

**Observation (`image-style-builder-html-panel-8.txt:92,105`):** `renderMains()` and `renderSubs()` create `<button>` elements with `b.className = "styleBtn" + (state.main === name ? " active" : "")`. The visual active state is `outline:2px solid currentColor; font-weight:bold` — `font-weight:bold` is a non-color indicator so WCAG 1.4.1 is technically met. However, no `aria-pressed` is set. Keyboard and screen-reader users cannot determine which style is currently selected without visually inspecting the button — the AT announces these as plain buttons with no state.

**Suggested improvement:** In `renderMains()` (line 91), add: `b.setAttribute("aria-pressed", state.main === name ? "true" : "false");`. In `renderSubs()` (line 102), add: `b.setAttribute("aria-pressed", sel.indexOf(sub) >= 0 ? "true" : "false");`. All code inside `<script>`, so no paste-safety concern. The same gap exists in the wizard's style-picker buttons at `char-wiz-html` lines 128–132 (same pattern, same fix needed).

**Value:** H · **Effort:** XS · **Status:** NEW — not covered in any prior audit or ISSUES.md entry. Applies to both the image-style builder and the equivalent style-picker section inside the wizard.  
**Risk/constraints:** `aria-pressed` is the correct ARIA pattern for toggle buttons. No visual change. No Perchance escaping concern since this is in `<script>`.

---

### 22-D · accessibility-engineer · mobile-scroll · Wizard and Image Style Builder: `.out2` at fixed `height:54px` traps touch-scroll

**Observation (`char-wiz-html:2847`, `image-style-builder-html-panel-8.txt:188`):** `.out2 { width:100%; height:54px; padding:0.5rem; font-family:monospace; }` — prefix/suffix output textareas use a fixed 54px height that shows approx 2 lines of monospace text. On mobile, users must touch-scroll inside the textarea to see the full content; iOS can trap this scroll, making it hard to continue scrolling the page after interacting with the field.

**Suggested improvement:** Change `.out2 { height:54px; }` to `.out2 { min-height:54px; height:auto; max-height:160px; overflow-y:auto; }`. Or in the `@media (max-width:480px)` block, add `.out2 { min-height:80px; }`. This is a pure CSS change.

**Value:** L · **Effort:** XS · **Status:** NEW — not covered in prior audit.  
**Risk/constraints:** No bracket risk. Pure CSS. No impact on Perchance templating.

---

### 22-E · accessibility-engineer · color-only · Wizard: Test Drive panel uses color-only pass/fail coding

**Observation (`char-wiz-html:2861–2863`):** `.qa-pass td:last-child { color:#2a9d4a; }` and `.qa-fail { background:rgba(200,0,0,0.06); } .qa-fail td:last-child { color:#c0392b; }` — the Test Drive panel shows pass/fail status with green/red color alone. WCAG 1.4.1 (Use of Color, AA) requires a non-color means of conveying information. A user with red-green color deficiency cannot distinguish these states. The `rgba(200,0,0,0.06)` background is especially subtle.

**Suggested improvement:** Prefix the status cell text in the JS that populates the table (inside `<script>`) to include a text indicator, e.g. "PASS" or "FAIL" as a prefix or replace the color entirely with text. Alternatively, add in `<style>`: `.qa-pass td:last-child::before { content:"PASS - "; }` and `.qa-fail td:last-child::before { content:"FAIL - "; }`. The `content:""` approach inside `<style>` is safe from Perchance templating (Perchance does not template CSS). However, using JS inside `<script>` to prepend text is equally safe and more explicit.

**Value:** L · **Effort:** XS · **Status:** NEW — Test Drive panel was not in scope for the prior a11y audit.  
**Risk/constraints:** Developer-tool section; WCAG priority lower than main builder UI. CSS `content:` is safe inside `<style>`. The `rgba(200,0,0,0.06)` background alone almost certainly fails contrast even for users without color deficiency.

---

## Pass 23 — Semantic structure

---

### 23-A · accessibility-engineer · landmarks · All three tools: no `<main>` or landmark elements

**Observation (all three files):**

- `char-wiz-html`: No `<main>`, `<nav>`, `<header>`, `<section>`, or `<aside>` anywhere in markup (lines 1–382).
- `fixer-html-panel-1.txt`: No landmark elements (lines 1–33).
- `image-style-builder-html-panel-8.txt`: No landmark elements (lines 1–51).

WCAG 2.4.1 (Bypass Blocks, AA) requires a mechanism to skip navigation. Landmarks are the standard mechanism in single-page tools. Screen reader users cannot jump to tool content.

**Suggested improvement:**
- Wizard: Wrap `#tab-builder` and `#tab-image` (or their shared `.wrap` parent) in `<main>`. The tabbar already has `role="tablist"` added via JS; wrapping it in `<nav aria-label="Tool tabs">` in markup is optional since the tablist role communicates navigation semantics.
- Fixer and Image-style builder: Add `<main>` as a wrapper around the outer `<div>` in each tool. One-line markup change per tool. Bracket-free text.

**Value:** M · **Effort:** XS · **Status:** CONFIRMS audit-a11y-mobile L1 for wizard; NEW for sister tools (L1 mentioned "secondary" tools without enumerating the landmark gap).  
**Risk/constraints:** If Perchance's own page shell wraps generator output in `<main>`, adding another `<main>` creates nested mains (invalid HTML5, though tolerated). Verify on a live generator. If nested, use `<section aria-label="Character Fixer">` instead.

---

### 23-B · accessibility-engineer · heading-hierarchy · Sister tools: H1 then H3 — missing H2 level

**Observation (`fixer-html-panel-1.txt:1,6,15,25`, `image-style-builder-html-panel-8.txt:1,10,15,24`):**

- Fixer: `<h1>AI Character Fixer</h1>` at line 1, then immediately `<h3>1 - Paste the broken character</h3>` at line 6. Skips H2.
- Image-style builder: `<h1>AI Image Style Builder</h1>` at line 1, then immediately `<h3>1 - Pick a base style</h3>` at line 10. Skips H2.

WCAG Technique H42 and APG guidance strongly discourage skipping heading levels. Screen reader users navigating by heading level (H2 shortcut) will find no H2 in either tool and may miss all section headings.

**Suggested improvement:** Change all three `<h3>` section headings in the fixer (lines 6, 15, 25) and all three in the image-style builder (lines 10, 15, 24) to `<h2>`. In the fixer, also update the CSS rule `.fixCard h3 { margin-top:0; margin-bottom:0.25rem; }` to `.fixCard h2 { margin-top:0; margin-bottom:0.25rem; }`.

**Value:** M · **Effort:** XS · **Status:** CONFIRMS audit-a11y-mobile H3 for wizard; NEW for sister tools (the H3 finding in the audit targeted only the wizard; sister tools not examined for heading structure).  
**Risk/constraints:** Changing `<h3>` to `<h2>` is safe. Must also update the `.fixCard h3` CSS selector in fixer. No bracket risk.

---

### 23-C · accessibility-engineer · heading-hierarchy · Wizard: Phase ③ `<summary>` is not in the heading tree — creates a structural gap

**Observation (`char-wiz-html:122`):** The four wizard phases use these headings: `<h2 class="phase">① Start</h2>` (line 16), `<h2 class="phase">② Build</h2>` (line 47), `<details><summary>③ Polish — optional extras...</summary>` (line 121–122), `<h2 class="phase">④ Review &amp; export</h2>` (line 264). Phase ③ is a `<summary>` inside `<details>`, not a heading. Screen reader users navigating by heading see ①, ②, and ④ in the heading list but ③ is absent.

**Suggested improvement:** Wrap the `<summary>` text in a heading inside the element: `<summary><h2 class="phase" style="display:inline; border:none; margin:0; padding:0;">③ Polish — optional extras (image style, immersion, presentation, tuning)</h2></summary>`. An `<h2>` inside `<summary>` is valid HTML5. The inline style overrides `.phase`'s `border-bottom` and `margin` to avoid visual disruption. The summary text contains no `[`, `]`, `{`, or `}` characters — paste-safe.

**Value:** M · **Effort:** XS · **Status:** NEW — the prior audit flagged the heading hierarchy (H3 finding) and noted wizard has H2 phase headings for ①, ②, ④. The ③ gap via `<summary>` was not explicitly called out.  
**Risk/constraints:** Perchance templates `<summary>` content (it is in the markup region). The proposed text is bracket-free and paste-safe. Verify in a live generator that `<h2>` inside `<summary>` renders without layout issues. The `details.phase-polish > summary` CSS rule at line 2829 should not conflict.

---

### 23-D · accessibility-engineer · tab-semantics · Wizard: Image tab section heading `<h3>Image generator</h3>` should be `<h2>`

**Observation (`char-wiz-html:360`):** `<h3>Image generator</h3>` is the only heading inside `#tab-image` (line 360). This tab panel is at the same structural level as the builder tab under the `<h1>`, so its section heading should be `<h2>`, not `<h3>`. The builder tab's card-level headings are `<h3>` (correctly subordinate to the `<h2>` phase headings), but the image tab has no `<h2>` parent — jumping from `<h1>` directly to `<h3>`.

**Suggested improvement:** Change `<h3>Image generator</h3>` at line 360 to `<h2>Image generator</h2>`. Add `.card h2 { margin:0 0 0.25rem 0; }` to the CSS alongside the existing `.card h3` rule, or change the existing rule to `.card h2, .card h3 { margin:0 0 0.25rem 0; }`.

**Value:** M · **Effort:** XS · **Status:** NEW — the H3 finding in the prior audit focused on card-level headings under the Builder tab and noted the wizard has H2 phase headings. The Image tab's `<h3>` as a missing-H2 for its own tab panel was not separately flagged.  
**Risk/constraints:** Safe markup change. CSS companion update is required (one selector addition). No bracket risk.

---

### 23-E · accessibility-engineer · landmarks · Fixer: three-step sequential workflow has no structural role

**Observation (`fixer-html-panel-1.txt:3–33`):** The fixer presents three `.fixCard` sections as sequential workflow steps (numbered 1, 2, 3). They are not tabs. No ARIA or HTML5 element communicates to AT that these form a workflow. The outer container is a plain `<div>` with no `role`.

**Suggested improvement (optional):** Add `role="list"` to the outer `<div>` at line 3 and `role="listitem"` to each `.fixCard`. This communicates sequential structure to AT. Alternatively, consider wrapping in `<ol>` with `<li>` children — but that changes element types and would break CSS. The `role` approach carries no visual change.

**Value:** L · **Effort:** XS · **Status:** NEW.  
**Risk/constraints:** `role="list"` on a `<div>` with `role="listitem"` children is valid ARIA. No visual change. No bracket risk.

---

### 23-F · accessibility-engineer · landmarks · Wizard: `<details id="qa-panel">` developer tool has no landmark label

**Observation (`char-wiz-html:343`):** `<details id="qa-panel"><summary>Test Drive</summary>` — positioned after all export cards. The `<summary>` text "Test Drive" appears in the document outline without context indicating it is a developer tool. No heading inside, no `role="region"`, no `aria-label`.

**Suggested improvement:** Add `role="region" aria-label="Test Drive developer tool"` to the `<details>` element. This makes it discoverable in the landmark list with a clear label. The text "Test Drive developer tool" contains no brackets — paste-safe. Alternatively, if this section is developer-only, add `aria-hidden="true"` to hide it from AT entirely — but that would also hide the buttons.

**Value:** L · **Effort:** XS · **Status:** NEW — prior audit did not examine the QA panel for landmark or heading semantics.  
**Risk/constraints:** `role="region"` on `<details>` is valid but some screen readers may prefer `<section>` instead. The `aria-label` text is bracket-free. Verify AT behavior in Chrome + NVDA.

---

## Summary

**3-line summary for orchestrator:**

Pass 20 confirms two prior audit items and adds three NEW XS-effort findings: both sister tools entirely lack touch-target `min-height` rules (20-B, 20-C HIGH/MEDIUM) and the wizard's immersion button is sub-44px (20-A, MEDIUM, export-side).

Pass 21 identifies zero responsive rules in both sister tools (21-B, 21-C NEW MEDIUM) and fills two FINER gaps in the wizard: phone-landscape breakpoint coverage at 480–640px (21-A) and textarea min-height not adjusted for mobile (21-D).

Pass 22–23 surface the highest-value NEW findings: `aria-pressed` missing on style-picker toggle buttons in both tools (22-C HIGH, XS), iOS auto-zoom font-size gap in sister tools (22-B HIGH, XS), sister tool H1-to-H3 heading skip (23-B MEDIUM, XS), Phase ③ `<summary>` absent from the wizard's heading tree (23-C MEDIUM, XS), and Image tab `<h3>` should be `<h2>` (23-D MEDIUM, XS).
