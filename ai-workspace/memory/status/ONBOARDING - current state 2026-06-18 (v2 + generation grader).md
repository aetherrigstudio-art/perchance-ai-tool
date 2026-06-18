---
title: ONBOARDING - current state 2026-06-18 (v2 + generation grader)
type: guide
permalink: perchar/status/onboarding-current-state-2026-06-18-v2-generation-grader
tags:
- onboarding
- status
- v2
- grader
- deploy
---

# ONBOARDING — current state (2026-06-18)

Read this first, then CLAUDE.md and char-info.

## Architecture: v2 (both panels paste-once) — VERIFIED LIVE
- **char-wiz-dat** = minimal stub: `{import:...}` plugin lines + `settings` (hooks
  delegate to window.*) + `$meta`. ~38 lines. NO generate/genCharacterImage/
  wordBank/uploadShare here anymore.
- **char-wiz-html** = ALL logic, including `window.generate`, `window.genCharacterImage`,
  `window.wordBank`, `window.uploadShare` (they use plugin imports bridged onto window).
- **wizard-loader-html.txt** = pasted once into Perchance HTML editor; bridges
  `ai/imageGen/adjBank/nounBank/verbBank/uploader/settings` onto window, then fetches
  char-wiz-html from GitHub `main` and injects it. BRANCH="main".
- Verified live: calling bridged plugin imports from HTML scope works (generation succeeds).
- Canonical pair == wizard-html-panel-19.txt / wizard-data-panel-14.txt.
- Deploy: edit repo -> land on main -> loader fetches it. Data panel basically never re-pasted.

## Current task: generation quality grader
- **test/grade-generation.mjs** — grades the CONTENT of a real generation (smoke.mjs
  only checks export SHAPE). Feed it a character's `=== SECTION ===` output:
  `node test/grade-generation.mjs out.txt` or `... -` for stdin; no args = self-tests
  (good/bad fixtures). Rubric: sections present, name-like NAME, role <=500w &
  >=25w, in-character FIRST MESSAGE (dialogue/*action*), visual APPEARANCE, image
  triggers reference name, no leaked prompt text, no `[ ]`/`{ }` placeholders. Letter grade A-F.
- STATUS: written this session; self-tests were NOT yet run/confirmed (user redirected).
  Next step: `node test/grade-generation.mjs` to confirm self-tests pass, then iterate
  the rubric (maybe wire a "Grade" button into the in-tool QA/Test-Drive panel so it
  grades live output in the browser on Perchance).

## Verification commands
- `node test/smoke.mjs` — export shape (all checks pass).
- `node test/grade-generation.mjs` — generation content grader self-tests.
- `bash .claude/hooks/check-wizard.sh` (pipe JSON) — node --check the wizard script.
- `bash scripts/ci-verify.sh both` — sync vs GitHub main + live Perchance data panel.

## Workflow notes
- User is on Android/mobile; deliver pasteable files via SendUserFile or raw GitHub
  links / codeblocks. Big-file paste is buggy on mobile — that's why the loader exists.
- USER PREFERENCE: do NOT push/PR frequently — the PR create/merge cycle floods the
  session with github-webhook-activity messages that waste their context. Batch work,
  commit, push sparingly.
- No write API on Perchance; loader (Perchance pulls from GitHub) is the only deploy path.

## Observations
- [verified] v2 minimal data panel + window-bridged imports works live
- [task] generation grader built (test/grade-generation.mjs), self-tests pending confirmation
- [preference] minimize pushes/PRs to save user context
