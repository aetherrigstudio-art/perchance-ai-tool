---
title: SESSION STATE 2026-06-18 — UX regroup + second-pass + tooling (handoff)
type: status
permalink: perchar/status/session-state-2026-06-18-ux-regroup-second-pass-tooling-handoff
tags:
- handoff
- status
- ux
- regroup
- second-pass
- grader
- context7
- audit
---

# SESSION STATE — handoff 2026-06-18

Read this + the older "ONBOARDING - current state 2026-06-18" note, then CLAUDE.md + char-info §1/§11.

## Branch / PR
- Branch `claude/spawn-3-teammates-r8od9u`, **draft PR #13** open vs `main` (subscribed for CI/review).
- All work below is COMMITTED + PUSHED (6 commits). A fresh clone will have it.
- Canonical files: `char-wiz-html` (== `wizard-html-panel-20.txt` now), `char-wiz-dat`.

## DONE this session (committed + pushed)
1. **Fixed triplicated `<select id="buildMode">`** — three stacked "Build mode" dropdowns at top of builder (copy-paste bug; dup IDs so only first worked → also meant 2 of 3 did nothing). Removed dups, kept one, added `for="buildMode"`. Mirrored to `wizard-html-panel-20.txt`. Verified: check-wizard + smoke + headless render. (commit 7f19e18)
2. **Grader hardening** `test/grade-generation.mjs` — fixed 2 false positives: (a) valid ACC macros `{{char}}`/`{{user}}`/`{{InputInformation}}` were flagged as unfilled placeholders → strip `{{...}}` before placeholder scan; (b) honorific names like "Dr. Elara Voss" failed name-like check (period) and trigger-name check (first token = "Dr.") → added `stripAbbrevDots`, `HONORIFICS` set, `nameTokens()` matching ANY meaningful token. Self-tests pass; A/D/F discrimination confirmed on realistic samples I generated. (commits e9f206a, 309824e)
3. **3 audit reports** in `ai-workspace/audit/` (+ basic-memory notes) from parallel teammates. (commit e4f728b)
4. **Context7 MCP** added to `.mcp.json` + enabled in `.claude/settings.json` `enabledMcpjsonServers`. Loads on next session start. (commits 7e858f0, f29be94)

## Screenshot capability (IMPORTANT — skill doc is WRONG)
- run-perchance-ai-tool SKILL.md claims the container blocks the Chromium download. FALSE in this env — it downloads fine.
- How: `PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright npx -y playwright@1.56.1 install chromium` (~924M, ~2min), then a temp `/tmp/render` project with `npm i playwright@1.56.1`, `setContent(char-wiz-html)`, screenshot at 384px (Android) + 820px. Send via SendUserFile.
- Loader render fails with `ERR_CERT_AUTHORITY_INVALID` — that's a sandbox TLS-proxy quirk (headless Chromium doesn't trust the MITM CA that curl/git do), NOT a real bug. Render `char-wiz-html` directly instead.

## Tooling installed (global, may not survive cold container)
- UX skills: `ui-ux-pro-max` (223K) and `usability-testing` — invoke via Skill. ui-ux-pro-max has a CLI: `python3 ~/.claude/skills/ui-ux-pro-max/scripts/search.py "<q>" --domain ux`.
- Context7 MCP (see above).

## ACTIVE TASK (not started — design approved, awaiting build)
User: the builder is a 17-card WALL, bad for first-time patrons. Two parts:

**Part 1 — 4-phase IA regroup (markup-only; ALL JS is getElementById so DOM order is FREE).**
```
① START   Build mode · Import (load existing) · Scenario
② BUILD    Main · Persona · Additional · Relationships · Lore
③ POLISH ▸ (one collapsed <details>) Image style · Immersion · Presentation · Tuning
④ REVIEW & EXPORT   [second pass] · Consistency · Export · Share
```
Add phase `<h2>` headers (progress spine), move Test Drive to bottom. ALSO fix while reordering (from audit): `:focus-visible` styles (none exist, char-wiz-html:2513), touch targets <24px (mobile-critical), 6 unlabeled controls. User APPROVED "full 4-phase regroup".

**Part 2 — NEW post-generation "second pass / review & refine" phase.** User explicitly asked. KEY: 70% of engine EXISTS — `genConsistency`→`parseConsistency`→`renderConsistency`→`applyFix` (char-wiz-html ~760-813) already reviews cast + one-click applies fixes via refine-mode regen; `doReroll`+`replaceSection`+`getSection` regenerate a single `=== SECTION ===`. RECOMMENDED scope (user was mid-answering when session ended): generalize that into the REVIEW phase AND wire in the content grader — port `test/grade-generation.mjs` rubric to in-browser `window.gradeCharacter`, grade each char, flag weak sections, one-click "re-roll this section". CONFIRM scope with user before building (options were: full review+grade+reroll / grade-summary-only / just-relocate-consistency).

## Audit findings worth fixing (from ai-workspace/audit/)
- Correctness: `window.generate()` lacks try-finally → UI hangs (stop btn/spinner stuck) on failed generation (char-wiz-html:632); no double-gen guard; resetAll() leaves accSchemaV1; maxTokensPerMessage 800 vs char-info's 500.
- A11y (28 findings, 4 critical): no :focus-visible; touch targets <24px (WCAG 2.5.8); 6 unlabeled controls (loreMode/lorebookUrl/imMusic/tunCtx/tunWriting/sceneMode); tab bar lacks role=tab/aria-selected. Streaming live-region pattern is already CORRECT — don't change.
- Security (paste-safety clean): loader supply-chain has no integrity check (innerHTML remote HTML from main); javascript: URLs not blocked in image src (escAttr insufficient, use new URL() allowlist, char-wiz-html:1558); user notes injected raw into prompts. Grader rubric gaps: no TAGLINE/REMINDER/WRITING-INSTRUCTION presence checks, no FIRST MESSAGE word cap, more leak patterns.

## User preferences (HARD)
- Android/mobile — deliver pasteable as codeblocks or raw GitHub links, never huge inline pastes.
- Do NOT push/PR frequently — webhook noise floods their context. Batch, commit local, push only when told / clean stopping point. (Pushed today because session was ending + needed config to survive re-clone.)
- The recurring "Unverified / GPG signature N" git nag is HARMLESS (no signing key in env) — ignore it.
- Verify: `node test/smoke.mjs` | `node test/grade-generation.mjs` | check-wizard.sh.

## Observations
- [done] dropdown fix, grader hardening, audit, context7 — committed + pushed, PR #13
- [task] 4-phase IA regroup + second-pass review phase — designed, approved, NOT built
- [decision-pending] second-pass scope (recommend review+grade+reroll)
- [fact] screenshots WORK here despite skill doc saying otherwise
