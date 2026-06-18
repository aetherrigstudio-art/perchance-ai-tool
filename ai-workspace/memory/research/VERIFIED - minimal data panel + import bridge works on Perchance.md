---
title: VERIFIED - minimal data panel + import bridge works on Perchance
type: report
permalink: perchar/research/verified-minimal-data-panel-import-bridge-works-on-perchance
tags:
- verified
- perchance
- deploy
- data-panel
- v2
---

# VERIFIED: minimal data panel + import bridge (2026-06-18)

Live-tested on generator q83iy9tti5. Flips the earlier "unverified" item from the
data-panel runtime-loading research to VERIFIED.

## What was verified
- [verified] The loader (HTML editor) can bridge the DATA-panel plugin imports
  AND the settings object onto window: `window.ai = ai; window.settings = settings; ...`
- [verified] The loader-fetched HTML can then DEFINE the generator functions and
  call the imports from HTML scope: `window.generate = async () => window.ai(window.settings)...`
  and `genCharacterImage` via `window.imageGen`, `wordBank` via `window.adjBank/nounBank/verbBank`,
  `uploadShare` via `window.uploader`. Generation works end-to-end.
- [verified] Result: the DATA panel reduces to imports + settings + $meta (~1.2KB,
  observed via /api/downloadGenerator). No generate/genCharacterImage/wordBank/uploadShare
  in the data editor.

## Architecture now on main (v2)
- char-wiz-dat: imports + settings (hooks delegate to window) + $meta only.
- char-wiz-html: defines window.generate/genCharacterImage/wordBank/uploadShare using bridged imports.
- wizard-loader-html.txt: bridges ai/imageGen/adjBank/nounBank/verbBank/uploader/settings onto window; BRANCH="main".
- Both panels are paste-once. All ongoing changes (HTML + data-side logic) deploy via the loader from main.

## Correction to prior note
The note "Perchance data-panel runtime loading - deep research 2026-06-18" listed
"passing import objects (ai/settings) across the data<->HTML boundary" as UNVERIFIED.
It is now VERIFIED working. The only remaining immovable constraint: the six
{import:plugin} lines + the settings block must physically stay in the data editor
(load-time constructs) — but those never change, so the data panel is effectively frozen.

## Observations
- [verified] window-bridged plugin imports are callable from loader-fetched HTML
- [verified] minimal ~1.2KB data panel generates correctly
- [decision] v2 promoted to main (PR #12); loader points at main
