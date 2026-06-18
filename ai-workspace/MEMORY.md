# MEMORY.md — perchance-ai-tool
_Updated: 2026-06-18_

## Branch Map
- `claude/init-9i0np9` — performance/bug fixes + 30 skills, PR #1 open → main
  - Phase 2A: scheduleSave debounce (500ms), updateStatus debounce (300ms), uniqueId monotonic counter
  - Phase 2B: getSection warn, parseChar NAME flag, parseLore warn, downloadFile try/finally
  - Phase 2C: {{char}}: regex fix in exampleLines() (indexOf → /regex/)
  - 30 skills in skills-lock.json; .gitignore excludes .agents/ .claude/skills/ .claude/worktrees/
- `claude/refinement` — prose quality rewrites + ISSUES.md (30-pass audit), wizard-html-panel-12.txt snapshot
  - char-wiz-html is ~2295 lines (FULLER version with scene mode, immersion, wardrobe, etc.)
  - Has VOCAB cliché suppression, charSeed/scenarioSeed prose fixes, refineWrap directive rewrite
  - Has AUDIT-ACTION-PLAN.md, ISSUES.md (30-pass), wizard-html-panel-12.txt

## Critical: Branch Divergence
The two branches have INCOMPATIBLE versions of char-wiz-html:
- `init-9i0np9`: 1253-line older version with Phase 2A/B/C bug fixes
- `refinement`: ~2295-line newer version (more features) WITHOUT the Phase 2 fixes
**Resolution needed**: cherry-pick Phase 2A/B/C fixes onto refinement's version of char-wiz-html,
then merge both into a single consolidated branch.

## Perchance / ACC Technical Facts
- perchance.org HTML pages 403 all automated fetches; only `/api/downloadGenerator` is accessible
- ACC Dexie export: databaseName="chatbot-ui-v1", databaseVersion=90, formatVersion=1, 9 tables required
- petrafied-acc (perchance.org/petrafied-acc, /new-petrafied-acc): exports as charname~uuid.gz (gzip JSON)
- No petrafied-acc databaseVersion found publicly; safe to keep databaseVersion:90
- buildDexie() already preserves learned template's databaseVersion if user imports their own DB

## smoke test pre-existing failure
`node test/smoke.mjs` fails at `globalThis.__I = immersion` — immersion var not in Node scope.
This is pre-existing; check-wizard hook (bash) still valid for markup-level bracket guard.

## Skills (30 installed on claude/init-9i0np9)
All skills are markdown instruction sets — work on Android and all platforms.
Installed: accessibility-engineer, agent-orchestrator-task, aria-live-regions, browser-tools,
code-review-quality, code-security-audit, configure-web-session, debugger, deep-research-agent,
error-analysis, find-skills, literature-search-arxiv, llm-prompt-optimizer, mobile-responsiveness,
openless-voice-input, parallel-agents, performance-profiler, product-capability,
run-perchance-ai-tool, security-best-practices, self-reflecting-chain, session-start-hook,
smoke-test, subagent-task-execution, thought-based-reasoning, token-efficiency, vanilla-web,
web-search, websearch-deep, reflect

## Outstanding Work (from ISSUES.md 30-pass audit)
XS (quick wins remaining): VOCAB cliché suppression, onWizFinish skip-if-unchanged (on refinement branch)
Phase 3: aria-live, aria-label, showError() accessibility
Phase 4: 73 inline styles → CSS custom properties (--accent, --bg, --surface)
Phase 5: Test Drive harness (qaRunAll pipeline, qaExportDebug, DJ preset)
