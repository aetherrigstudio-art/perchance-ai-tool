# Improvement Review — 30-Pass Catalog (2026-06-18)

> **Scope:** `char-wiz-html`, `char-wiz-dat`, `fixer-html-panel-1.txt`, `fixer-data-panel-1.txt`,
> `image-style-builder-html-panel-8.txt`, `image-style-builder-data-panel-8.txt`.
> **Nature:** catalog of **non-defect improvements** ("works, but could be better"). **Nothing
> was applied** — this is a triage list. Each future code change re-plans per workspace rule 7.
> **Method:** 6 parallel read-only agents, 30 lenses, deduped against `ISSUES.md`, root
> `findings.md`, and `ai-workspace/audit/{a11y-mobile,correctness,security-content}.md`.
> **Full per-finding detail** (observation + suggested fix + risk) lives in the source files:
> `.planning/2026-06-18-improvement-review-30-pass/findings-agent-{1..6}.md`.

## Executive summary
158 improvement findings across 30 passes. The codebase is healthy — almost everything found is
polish, consistency, or refinement, not breakage. Three themes dominate:

1. **The sister tools (fixer, image-style) lag the wizard.** Prior audits covered the wizard
   thoroughly but treated the sister tools as "secondary." ~40 findings close that gap: missing
   `aria-label`/`aria-live`/`:focus-visible`/`min-height`/`font-size:16px`, no status regions, no
   onboarding, weaker error handling, and divergent defaults (`maxTokensPerMessage` 500 vs 800,
   non-RFC-4122 UUID fallback, no `prepUserInput`).
2. **Prose/prompt quality has verified, high-value tightening available.** petra's `✓verified`
   rules contradict current specs in two concrete places — lore entry length ("1–2 sentences" vs
   her 80–200 words) and the unconstrained REMINDER spec — plus the RP asterisk/quote formatting
   directive is missing from the exported `generalWritingInstructions`.
3. **Maintainability traps from triplication.** `getSection`/`buildDexie`/`characterRow`-style
   logic is copied across tools with no "keep in sync" markers; `builderSnapshot()` duplicates
   `save()`'s state assembly (add-a-field-in-two-places trap).

**Value distribution:** High ≈ 30 · Med ≈ 68 · Low ≈ 60. **Effort:** the large majority are XS/S
(CSS additions, ARIA attributes, prompt-string edits). **Status vs prior reviews:** ~95 NEW,
~35 FINER-GRAIN (sharper detail/line refs on known items), ~28 CONFIRMS-EXISTING.

## How to use this catalog
Start with the **Top 20** below (highest value-to-effort). Most are XS. The sister-tool a11y/UX
items cluster naturally into one "bring fixer + image-style up to wizard parity" work batch; the
prose items cluster into one "prompt-spec tightening" batch. Both batches touch `char-wiz-html`
and sister tools → each must re-plan via `/plan` (workspace rule 7) and re-run `node test/smoke.mjs`.

---

## Top 20 — highest value-to-effort (start here)

| # | id (agent) | tool | improvement | value | effort |
|---|---|---|---|---|---|
| 1 | 27-A (6) | wizard | Fix lore entry length: spec says "1–2 sentences" but petra's `✓verified` sweet spot is **80–200 words**; reduce count 12–18→8–14. Current spec actively underperforms ACC retrieval. | H | XS |
| 2 | 27-B (6) | wizard | Add lore CONTENT RULE: **no character psychology/backstory in lore** (belongs in description; petra `✓verified`). | H | XS |
| 3 | 24-C (6) | wizard | Constrain REMINDER spec to petra's **four categories** (style, quirks, physiology, one strong belief); forbid backstory/plot. | H | XS |
| 4 | 25-B + 29-D (6) | wizard | Add the **RP asterisk-action/quote-speech** formatting directive to binding rules + exported `generalWritingInstructions` (petra Part 2.5-C). | H | XS |
| 5 | F17-10 + P8-6 (4,2) | image-style | Add `aria-live="polite"`/`role="status"` to `#status` + `#busyHint` (generation is silent to AT). | H | XS |
| 6 | F18-01 + F16-02 (4) | fixer | Add a status region (`#fixStatus` `role=status aria-live`) — the fixer has **zero** live regions today. | H | XS |
| 7 | F19-01 + F19-02 (4) | fixer, image-style | Add the wizard's `:focus-visible` outline rule (absent in both sister `<style>` blocks). | H | XS |
| 8 | 20-B + 20-C / F16-03/04 (5,4) | fixer, image-style | Add `button,input{min-height:44px}` (+ `.styleBtn`) — sister tools have no touch-target rule. | H | XS |
| 9 | 22-B (5) | fixer, image-style | Add `input,textarea,select{font-size:16px}` to stop iOS Safari auto-zoom. | H | XS |
| 10 | 22-C (5) | image-style, wizard | Add `aria-pressed` to style-picker toggle buttons (selected state invisible to AT). | H | XS |
| 11 | P7-1 (2,1) | all three | Add "keep in sync" comments on the 3 `getSection` copies (+ `buildDexie`); cheapest drift-guard. | H | XS |
| 12 | 13-1 (3) | wizard | Surface image-gen failures using the **already-populated** `window.__imgErr` in the co-located busy spans (6 silent catches). | H | S |
| 13 | F15-03 + P8-4 (4,2) | image-style | Disable action buttons + show loading state during generation (and add the `_generating` guard). | H | XS |
| 14 | P8-2 (2) | fixer, image-style data panels | Wrap `await onFinishPromise` in `try/finally` so the spinner/stop button clears on error. | H | S |
| 15 | P8-3 (2) | fixer, image-style | Add `prepUserInput` (full for image-style; header-preserving variant for fixer) — sister tools inject raw user input. | H | S |
| 16 | 9-1 + 9-2 + 9-3 (3) | wizard | Replace the ~23 blocking `alert()`/`confirm()` with inline status (`#busyHint`) + a `_snap`-based 10-second undo for "start over". | H | S |
| 17 | 10-1 (3) | wizard | First-run "start here" banner, rendered from `<script>` when `localStorage` is null (clarifies the mis-placed Import card too). | H | S |
| 18 | F14-01 (4) | wizard | Make per-field re-roll discoverable (disclosure hint); the capability is invisible in a buried select today. | H | S |
| 19 | 30-A + 30-B (6) | image-style | Add petra's image **subject formula** (set from `<script>` to keep `[ ]` out of markup) + a ~480-char budget counter. | H | S |
| 20 | P6-5 (2) | wizard | Unify `builderSnapshot()` and `save()` state assembly (one source of truth; closes add-a-field-in-two-places trap). | H | S |

Honorable mentions (H value, slightly larger or narrower): P8-5 fixer RFC-4122 UUID fallback; P8-1 wizard dynamic `startWith` priming; F15-01 fixer busy feedback; 28-A unified reminder remediation.

---

## Full catalog by pass (condensed)
Value (H/M/L) · Effort (XS/S/M/L) · Status (N=NEW, C=CONFIRMS, F=FINER). Detail in `findings-agent-N.md`.

### Lens A — Code quality & maintainability (agent 1: passes 1–4; agent 2: passes 5–8)

**Pass 1 — duplication**
| id | item | V | E | S |
|---|---|---|---|---|
| P1-1 | `getSection` copied in all 3 tools (CI drift-check) | M | S | N |
| P1-2 | char-card markup pattern ×3 → `buildCharCard()` factory | M | M | F |
| P1-3 | image-gen call+silent-catch ×3 → `genImage()` wrapper | M | S | F |
| P1-4 | narrative-injection ×3 → `appendBlock(row,text)` helper | L | XS | N |
| P1-5 | `gSec` duplicates `getSection` core → shared `_sectionBody` | L | XS | N |
| P1-6 | `load()` & `restoreSnapshot()` field-population dup → `applySnapshot()` | M | M | N |

**Pass 2 — inline styles / tokens**
| id | item | V | E | S |
|---|---|---|---|---|
| P2-1 | 75 inline styles; add `--thumb-*`/`--input-w-*` tokens + classes | M | M | C |
| P2-2 | `#status` opacity 0.85 drifts from `.hint` 0.8 | L | XS | N |
| P2-3 | `relB` multi-select inline padding vs `.adj` | L | XS | N |
| P2-4 | minimal `prefers-color-scheme` dark override for `--subcard-bg` | L | S | C |

**Pass 3 — magic numbers** (all XS): P3-1 `POOL_ROTATION_HOURS`; P3-2 voice-panel geometry consts; P3-3 summary word-caps (80/30/500); P3-4 save/status debounce consts; P3-5 `_statusTimer` vs `updateStatus._t`; P3-6 480px breakpoint comment; P3-7 hash-algo citations; P3-8 `PANEL_MOUNT_DELAY`; P3-9 `HANDLER_SETTLE_MS`. (mostly L)

**Pass 4 — long functions**
| id | item | V | E | S |
|---|---|---|---|---|
| P4-1 | split `characterRow()` tuning+advanced overlays (testable) | M | S | N |
| P4-2 | `IMMERSION_FN` inner named fns (keep `.toString()` valid) | M | M | N |
| P4-3 | `buildWizardPrompt` flat if-chain → builder router | M | M | N |
| P4-4 | `renderExtras` innerHTML→createElement (+aria-label) | M | M | F |
| P4-5 | `console.log`→`console.warn` in exported code | L | XS | N |

**Pass 5 — naming:** P5-1 single-letter formals (`c/o/e/r`) M/M/N; P5-2 `imSync`→`syncImmersion` family M/S/N; P5-3 dual `genStyle` disambiguation comment L/XS/N; P5-4 `gSec` opaque name M/XS/N; P5-5 fixer `parseChar` subset comment L/XS/N; P5-6 `gWords`/`wc` duplicate L/XS/N.

**Pass 6 — dead code:** P6-1 unused `SEED.verb` M/XS/C; P6-2/P6-3 `console.log` in exported code M/XS/C; P6-4 `loreLines()` single-use L/XS/N; **P6-5 `builderSnapshot()`/`save()` dup H/S/N**; P6-6 fixer redundant `window.*` re-export L/XS/N; P6-7 image-style `styleAdj` not persisted M/XS/N.

**Pass 7 — comments:** **P7-1 `getSection` keep-in-sync H/XS/N**; P7-2 `IMMERSION_FN` minification warning M/XS/C; P7-3 `crc32` Perchance-constraint note L/XS/C; P7-4 `focusSafe` reuse comment M/XS/N; P7-5 `rotatePool` contract example L/XS/N; P7-6 fixer sanitizer-omission note M/XS/F; P7-7 `char-wiz-dat` `startWith` TODO M/XS/F.

**Pass 8 — cross-tool consistency:** **P8-1 wizard dynamic `startWith` priming H/S/C**; **P8-2 sister try/finally H/S/C**; **P8-3 sister `prepUserInput` H/S/C**; P8-4 image-style `genStyle` guard M/S/N; **P8-5 fixer RFC-4122 UUID H/S/F**; P8-6 image-style status aria-live M/XS/C; P8-7 fixer `maxTokensPerMessage` 800 M/XS/F; P8-8 `buildDexie` sync note L/XS/N.

### Lens B — UX / usability / IA (agent 3: passes 9–13; agent 4: passes 14–16)

**Pass 9 — alert/confirm:** **9-1 precondition alerts→inline H/S/C**; **9-2 export validation inline+force H/S/C**; **9-3 confirm→`_snap` undo H/S/C**; 9-4 fixer export alert→`#fixStatus` M/XS/N; 9-5 image-style alert/confirm→inline M/XS/N; 9-6 gen-failure message tone M/XS/C; 9-7 consistency unmatched-fix copy card M/S/N.

**Pass 10 — onboarding:** **10-1 first-run banner H/S/C**; 10-2 sample-world quickstart preset (reuse QA_PRESET) M/S/N; 10-3 fixer input/format explanation M/S/N; 10-4 image-style "where do prefix/suffix go" M/XS/N.

**Pass 11 — IA:** 11-1 Opening after Review/Consistency M/S/C; 11-2 Import card position M/S/N; 11-3 Polish summary teaser M/XS/N; 11-4 Relationships empty-state L/S/N; 11-5 Review auto-grade first-open M/S/F.

**Pass 12 — microcopy:** 12-1 "re-roll"→"rewrite this section" (jargon) M/XS/N; 12-2 hint verbosity (<25w rule) M/S/N; 12-3 extra-char notes placeholder L/XS/F; 12-4 fixer card-2 title M/XS... L/XS/N; 12-5 cross-tool copy divergence L/XS/N.

**Pass 13 — error/empty states:** **13-1 surface `window.__imgErr` H/S/C**; 13-2 directive output placeholders M/XS/F; 13-3 immersion/colors empty messages L/XS/N; 13-4 budget/export-preview first-run orientation M/XS/N; 13-5 fixer empty-input guard M/XS/N; 13-6 image-style misplaced `#status` L/XS/N.

**Pass 14 — discoverability:** **F14-01 per-field re-roll H/S/C**; F14-02 color-picker hint M/XS/C; F14-03 portraits↔immersion cross-ref M/XS/N; F14-04 image-style "show raw" context L/XS/N; F14-05 fixer section-format hint M/XS/N.

**Pass 15 — in-progress feedback:** **F15-01 fixer busy feedback co-located H/S/N**; F15-02 image-style completion message M/XS/F; **F15-03 image-style disable buttons H/XS/N**; F15-04 fixer section-detection summary M/S/N; F15-05 wizard `[aria-busy]` visual lock M/XS/N.

**Pass 16 — cross-tool parity:** F16-01 fixer "start over" M/XS/N; **F16-02 fixer status span H/XS/N**; F16-03 fixer min-height M/XS/C; F16-04 image-style `.styleBtn` min-height M/XS/C; F16-05 fixer download confirmation L/XS/N; F16-06 image-style workflow hint M/XS/N; F16-07 fixer `.fixCard`→`.card` naming L/XS/N; F16-08 fixer `maxTokensPerMessage` 800 M/XS/C.

### Lens C — A11y & mobile, sister tools + finer (agent 4: passes 17–19; agent 5: passes 20–23)

**Pass 17 — unlabeled controls:** F17-01 fixer `#brokenText` M/XS/C; F17-02 fixer `#generateBtn` M/XS/N; F17-03 fixer `#stylePrefixInput` M/XS/C; F17-04 fixer download aria-label L/XS/N; F17-05 image-style `#styleNotes` M/XS/C; F17-06 `#prefixOut` M/XS/C; F17-07 `#suffixOut` M/XS/C; F17-08 `#styleAdj` M/XS/C; F17-09 `#styleRaw` L/XS/N; **F17-10 image-style `#status` aria-live H/XS/C**.

**Pass 18 — live regions:** **F18-01 fixer has zero live regions H/XS/N**; **F18-02 image-style `#busyHint` role/aria-live H/XS/C**; F18-03 image-style copy-confirm `#cp1/#cp2` aria-live M/XS/N; F18-04 wizard image-tab `aria-busy` M/XS/F; F18-05 wizard consistency completion announce M/XS/F; F18-06 fixer export alert→inline M/XS/C.

**Pass 19 — focus/keyboard:** **F19-01 fixer `:focus-visible` H/XS/C**; **F19-02 image-style `:focus-visible` H/XS/C**; **F19-03 fixer focus-to-result H/S/F**; F19-04 image-style focus-to-result M/XS/F; F19-05 fixer Enter-to-download M/XS/C; F19-06 image-style Enter-on-adjust M/XS/C; F19-07 image-style Enter-on-notes L/XS/C; F19-08 wizard `showTab` focus move M/XS/C; F19-09 fixer `#responseEl` tabindex L/XS/N.

**Pass 20 — touch targets:** 20-A wizard immersion floaty button sub-44px M/XS/C+F; **20-B image-style min-height H/XS/N**; 20-C fixer min-height M/XS/N; 20-D wizard select inline-padding vs min-height L/XS/F.

**Pass 21 — responsive:** 21-A wizard 481–640px phone-landscape gap M/XS/F; 21-B image-style zero `@media` M/XS/N; 21-C fixer zero `@media`, fixed textarea heights M/S/N; 21-D wizard `.out` min-height not mobile-reduced M/XS/F; 21-E all-tools `box-sizing:border-box` defensive L/XS/N.

**Pass 22 — visual a11y:** 22-A sister `.hint` contrast → explicit color M/XS/C+N; **22-B sister `font-size:16px` H/XS/C+N**; **22-C `aria-pressed` on style toggles H/XS/N**; 22-D `.out2` fixed-height touch-scroll trap L/XS/N; 22-E Test-Drive color-only pass/fail L/XS/N.

**Pass 23 — semantic structure:** 23-A all-tools no `<main>`/landmarks M/XS/C+N; 23-B sister H1→H3 skip M/XS/N; 23-C wizard Phase ③ `<summary>` outside heading tree M/XS/N; 23-D wizard Image tab `<h3>`→`<h2>` M/XS/N; 23-E fixer workflow `role=list` L/XS/N; 23-F wizard QA panel landmark label L/XS/N.

### Lens D — Prose & generation quality (agent 6: passes 24–30)

**Pass 24 — binding rules:** 24-A "no echo-leak" rule M/XS/N; 24-B re-anchor injection guard in `sectionTail` M/XS/N; **24-C REMINDER four-category constraint H/XS/C**; 24-D remove format directive from reminder append M/S/N.

**Pass 25 — VOCAB/RP:** 25-A extend cliché list (orbs/cascading/crimson) M/XS/F; **25-B RP asterisk/quote rule H/XS/C**; 25-C separate `VOCAB_EXPORT` for in-chat M/S/N.

**Pass 26 — seed pools:** **26-A unused `SEED.verb` (remove/repurpose) M/XS/C**; 26-B `SEED.tone` melancholy skew L/XS/N; 26-C `SEED.trait` persona-restriction comment L/XS/N; 26-D `loreFocus` fantasy-heavy → add general entries L/XS/N.

**Pass 27 — lore prose:** **27-A entry length 1–2 sentences → 80–200 words H/XS/C**; **27-B no character-info in lore H/XS/C**; 27-C explicit pronoun prohibition M/XS/F; 27-D comment why `loreSeed` excluded from refine L/XS/N.

**Pass 28 — reminder/description:** **28-A unified reminder remediation (24-C+24-D) H/S/F**; 28-B raise ROLE INSTRUCTION budget for main char M/S/N; 28-C plain-prose-only reminder format L/XS/N.

**Pass 29 — output spec / export:** 29-A replace "Nina" IMAGE TRIGGERS example M/XS/N; 29-B WRITING INSTRUCTION 80-word cap M/XS/F; 29-C remove duplicate paragraph directive M/XS/C; **29-D RP format in exported `generalWritingInstructions` H/XS/C**; 29-E TAGLINE 20-word cap M/XS/N; 29-F WARDROBE minimum richness M/XS/N.

**Pass 30 — image prompt:** **30-A petra subject formula in UI H/S/C**; **30-B 480-char cap guidance + live counter H/S/F**; 30-C strengthen negativePrompt guard M/XS/N; 30-D adopt `refineWrap` decisive mandate M/XS/N.

---

## Notes & guardrails
- **Catalog only** — no tool file was modified producing this. Verified by `git status` (only this
  doc + `ISSUES.md` change) and `node test/smoke.mjs` passing unchanged.
- **Paste-safety** preserved: every markup-touching suggestion keeps `[ ] { }` out of the markup
  region (set from `<script>` where a literal bracket is the content — e.g. 30-A, 10-2).
- **§9 boundary** honored: no finding proposes emitting unverified ACC fields; petra rules cited
  are her `✓verified` prose-authoring guidance, applied to prompt wording (not schema).
- **Defects found in passing** (out of scope, routed to existing trackers): image-style `genStyle`
  concurrency (P8-4/F15-03 defect angle), fixer empty-prompt send (13-5), fixer non-RFC-4122 UUID
  (P8-5) — all already in `ISSUES.md`/audit scope.
