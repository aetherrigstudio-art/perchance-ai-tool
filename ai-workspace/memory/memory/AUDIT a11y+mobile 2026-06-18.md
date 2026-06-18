---
title: AUDIT a11y+mobile 2026-06-18
type: note
permalink: perchar/memory/audit-a11y-mobile-2026-06-18
tags:
- audit
- a11y
- mobile
- wcag
- aria
---

# AUDIT: Accessibility + Mobile UX — 2026-06-18

Read-only audit of `char-wiz-html` (2541 lines) against WCAG 2.2 AA + ARIA APG 1.2.
Full report: `ai-workspace/audit/audit-a11y-mobile.md`

## Counts by severity
- Critical: 4
- High: 10
- Medium: 9
- Low: 5

## Top 5 issues (file:line)

1. **[Critical] No focus styles** — `char-wiz-html:2513` — Only `.tabbtn.active` outline exists; no `:focus-visible` for any interactive element. WCAG 2.4.7 failure. Fix: add `:focus-visible` CSS rule.

2. **[Critical] Touch targets below WCAG 2.5.8 minimum** — `char-wiz-html:2512,2526,2530` (CSS) + inline styles throughout markup — All buttons/inputs render ~30–38px height; WCAG 2.5.8 (AA, 2.2) requires 24px rendered area; 2.5.5 (AAA) requires 44px. Fix: `min-height: 44px` blanket rule.

3. **[Critical] Unlabeled form controls** — `char-wiz-html:94,102,197,266,271,284` — `loreMode`, `lorebookUrl`, `imMusic`, `tunCtx`, `tunWriting`, `sceneMode` have no aria-label. WCAG 1.3.1/4.1.2 Level A failures. Fix: add `aria-label` via script or in markup.

4. **[High] Duplicate id="buildMode"** — `char-wiz-html:17,25,33` — Three identical `<select id="buildMode">` blocks; appears to be a copy/paste bug. Fix: remove lines 23–37.

5. **[High] No ARIA tab semantics + no focus move on tab switch** — `char-wiz-html:3-6` (markup), `2340-2346` (JS) — Tab buttons lack `role="tab"`, `aria-selected`, `aria-controls`. `showTab()` does not move focus. Fix: add ARIA tab attributes + `first.focus()` in showTab.

## Other notable findings
- `onWizFinish()` (line 831): no focus return to output, no "Done." announcement
- Dynamic buttons (consistency fixes, voice selects, color inputs): no aria-labels
- Streaming output: correct pattern already in place (no aria-live on output textareas); `busyHint role="status"` is correct placement
- `.hint { opacity:0.8 }` (line 2521): probable contrast failure for small text
- No `@media` mobile breakpoints anywhere
- Voice panel (`position:fixed`, line 1281): may overlay content on narrow phones
- Secondary tools (fixer, image-style-builder): similar labeling gaps

## Paste-safety (Perchance bracket rule)
All proposed fixes are paste-safe. No fix requires putting `[` or `]` in HTML markup. Bracket-containing aria-labels (e.g. lore trigger format strings) must be set from `<script>` per existing project convention.

## Verified vs assumed
- No viewport meta tag in file — verified (file starts with `<h1>`); Perchance shell may inject one (assumed, not confirmed)
- Exact contrast ratios require live DevTools; opacity:0.8 on .hint is flagged as probable failure
- loadingIndicatorHtml assumed to be visual-only spinner
