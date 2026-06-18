---
title: Project State 2026-06-18
type: note
permalink: perchar/status/project-state-2026-06-18
tags:
- coordination
- current-truth
---

# Project State — current truth (supersedes the stale ai-workspace/MEMORY.md)

## Observations
- [reconciliation] DONE. char-wiz-html is the full 2302-line build (immersion, scene mode, wardrobe, tuning, prose quality) WITH Phase 2A/B/C fixes applied. The old "cherry-pick Phase 2 onto refinement" task is complete. #wizard
- [smoke] `node test/smoke.mjs` PASSES (assertions updated for the grounded prose directive). #testing
- [skills] 34 skills, COMMITTED to the repo (.agents/skills + .claude/skills symlinks); lock-synced via .claude/hooks/check-skills.sh. Pruned 5 off-target. #skills
- [branches] Live work on claude/phase3-a11y-api (PR #6). init-9i0np9 = PR #1. refinement = closed. #branches
- [collision] WARNING: claude/init-oystyg rebuilds CLAUDE.md, .claude/settings.json, session-start.sh from an ancient base; collides with phase3-a11y-api. Human is brokering. #coordination
- [perchance-api] /api/downloadGenerator is callable without a browser (only the HTML page 403s). Next: CI verification + stopSequences. #perchance

## Relations
- relates_to [[Shared Memory Setup]]
