---
title: Perchance data-panel runtime loading - deep research 2026-06-18
type: report
permalink: perchar/research/perchance-data-panel-runtime-loading-deep-research-2026-06-18
tags:
- research
- perchance
- api
- deploy
- verified
---

# Perchance data-panel runtime loading — deep research (2026-06-18)

Corrects an earlier overstatement that a runtime-driven data panel is "impossible."
5-angle deep research (WebSearch + WebFetch, adversarially cross-checked).

## Verdict
A runtime-driven data panel IS achievable. The verified, no-eval path is total
`window.*` delegation to the loader-fetched HTML — already prototyped (PR #10).

## Verified facts
- [verified] Data editor is full JavaScript; `async`/`await`/`fetch` valid — perchance.org/advanced-tutorial, /learn-perchance-advanced-functions-plugins
- [verified] Data editor + HTML classic `<script>` share one `window` global scope; HTML `<script>`s run BEFORE data-editor functions, so data code can call `window.*` from the loaded HTML. NOT `<script type=module>` (isolated). — perchance.org/advanced-tutorial + char-info
- [verified] Function-valued `settings` props (instruction, startWith, stopSequences) re-evaluate per generation → a settings value can read live HTML state, e.g. `stopSequences() => window.WIZ_STOP_SEQUENCES || [...]` — perchance.org/ai-text-plugin
- [verified] No write/save/publish API; source save is browser-only — perchance.org/tutorial, /api-tutorial
- [verified] `{import:...}` is load-time + perchance-host only (resolves a NAME, never an external URL) — perchance.org/learn-perchance-syntax-importing-exporting
- [verified] `dynamic-import-plugin` loads another generator's lists AND functions at runtime, by computed name (uses /api/downloadGenerator) — perchance.org/dynamic-import-plugin
- [verified] `super-fetch-plugin` proxies arbitrary URLs around CORS but returns text, not an executable list-tree — perchance.org/super-fetch-plugin

## Unverified
- [unverified] `eval`/`new Function` of a fetched code-string in the data editor (inferred from "any JS is valid"; no doc, no community example; some pages 403 automation)
- [unverified] Passing import objects (ai/settings/adjBank) across the data↔HTML boundary to delegate generate()/wordBank()

## Decision
- Path A (window.* delegation): VERIFIED, chosen. Immovable = 6 `{import:plugin}` lines + bare settings/function declarations; every BODY delegates to window.* in char-wiz-html (loader-deployed). Data panel only re-pasted on import/structure change.
- Path B (fetch+eval from GitHub): rejected — unverified AND zero marginal benefit (imports can't be eval'd, so a stub remains either way).
- Did NOT delegate generate/wordBank/uploadShare (stable glue + cross-boundary uncertainty).
- Applied: stopSequences -> function delegating to window.WIZ_STOP_SEQUENCES (the change that motivated this is now HTML-controllable).
- Corrected AUTOMATION.md "Why the data panel can't be auto-deployed" section.

## Observations
- [correction] Earlier "data panel runtime load impossible" was wrong; delegation makes it logic-deployable via the loader
- [decision] Path B (eval loader) rejected as no-benefit + unverified
- [verified] stopSequences can be a function re-read per generation
