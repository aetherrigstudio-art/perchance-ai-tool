# progress.md — session log

## Session 2026-06-18 — optimization research + plan
- **Done:** 3 parallel deep-research agents (frontend code quality / skill-tooling architecture / deploy+roadmap) → synthesized to `findings.md`.
- **Key finding:** `user-invocable-only` does NOT free skill-listing budget (only `name-only`/`off` do) — corrects our current 24-parked-skills strategy.
- **Created:** `task_plan.md` (8 phases), `findings.md`, this file.
- **Repo state at plan time:** `main` @ HEAD (consolidated single line); 38 skills (14 on / 24 parked); no CI; loader has no integrity check; active task = 4-phase IA regroup + Part-2 review phase.
- **Awaiting:** operator approval of phase order before executing Phase 1+. Phases 2 (regroup+a11y) and 1 (skill consolidation) are the highest value / lowest risk start points.

### Test results
| Check | Result |
|-------|--------|
| (baseline) smoke.mjs | passing (pre-existing) |
| (baseline) render 0 page errors | confirmed earlier this session |

### Next action
Update ROADMAP.md (Phase 8 preview) + CLAUDE.md skill-note correction (Phase 1), commit the plan, then execute phases on approval.

## Session 2026-06-18 (cont.) — Phase 1 partial
- Pruned 8 dead skills (caveman, performance-profiler, changelog-writer, product-capability, error-analysis, llm-prompt-optimizer, browser-tools, smoke-test): 38→30. `npx skills remove` left lock entries → fixed skills-lock.json + skillOverrides by hand; `check-skills` back in sync.
- Switched 18 parked `user-invocable-only` → `name-only` (frees listing budget per research; keeps `/name` + model-by-name).
- **Deliberately KEPT** skills the brief wanted cut but the operator actively uses: agent-orchestrator-task, subagent-task-execution, deep-research-agent, web-search, websearch-deep, roadmap-planning, ui-ux-pro-max, usability-testing, thought-based-reasoning, parallel-agents, track-management.
- Verified: check-skills in sync (30); settings.json valid; `node test/smoke.mjs` PASS.
- **Remaining Phase 1:** build the 4 dispatcher skills (+bundled refs), `disable-model-invocation` on `/audit`. Then Phase 2 (regroup+a11y).

| Check | Result |
|-------|--------|
| check-skills (30 skills) | in sync |
| smoke.mjs | PASS |
| settings.json | valid JSON |

## Session 2026-06-18 (cont.) — Phase 2 COMPLETE (IA regroup + a11y)
- **Reorder:** `char-wiz-html` `.wrap` cards regrouped into the 4-phase spine via a
  block-extraction script (zero retyping): ① Start (build mode · import · scenario)
  · ② Build (main · persona · additional · relationships · lore) · ③ Polish
  (collapsed `<details class="phase-polish">` — image · immersion · presentation ·
  tuning) · ④ Review & export (opening → consistency → export → share). Plumbing +
  Test Drive at bottom. `<h2 class="phase">` headers for ①②④; ▸/▾ summary for ③.
- **Opening** lives ONLY at ④ REVIEW top now; dropped the stale `·opening` from the
  BUILD line in task_plan.md. No dup `buildMode` to delete (already fixed in -20).
- **a11y:** blanket `:focus-visible`; `min-height:44px` on controls + `<480px` media
  query; 6 unlabeled controls get `aria-label` from `<script>` (a11yInit IIFE); tab
  bar → full ARIA tabs (tablist/tab/tabpanel, aria-selected, roving tabindex,
  Arrow/Home/End); streaming uses a `setBusy()` helper (single role=status announce
  + `aria-busy` on #tab-builder); `onWizFinish` focuses the visible output.
- **Tooling fixes:** `test/smoke.mjs` fake DOM extended (getAttribute/setAttribute/
  addEventListener/focus + `document.querySelector`) so a11yInit runs headless;
  `validate-generator.py` now skips test harnesses (was a false-positive buildDexie
  9-table failure on `smoke.mjs`).
- **Mirrored** → `wizard-html-panel-21.txt`.
- **Markup paste-safety:** verified no raw/entity `[ ] { }` before the first
  `<script>`.

| Check | Result |
|-------|--------|
| smoke.mjs | PASS (all checks) |
| check-wizard.sh | exit 0 |
| validate-generator.py (smoke.mjs / char-wiz-html) | exit 0 / exit 0 |
| headless render 384px + 820px | 0 page errors; screenshots sent |

**Resume at Phase 3** (Part-2 in-browser review/refine: `window.gradeCharacter` +
generalize `genConsistency`/`applyFix`/`doReroll` into ④ REVIEW).

---
## ▶ NEXT SESSION — START HERE (resume the optimization initiative)

**Read order:** CLAUDE.md → README.md → `task_plan.md` + `findings.md` + this file.
The `/plan` skill (pi-planning-with-files) auto-loads `task_plan.md` on start.

**Where we are:** Phase 0 ✅, Phase 1 🟡 (skills 38→30, parked→name-only done;
dispatcher skills NOT built), Phase 2 ✅ (IA regroup + a11y, mirrored to -21,
all gates green). **Resume at Phase 3.**

**Phase 2 = the original task: 4-phase IA regroup + a11y fixes** (`task_plan.md`).
Workflow to execute it:
1. It's a coupled `char-wiz-html` markup reorg — do it **inline or in ONE git
   worktree**, NEVER fan out across agents (CLAUDE.md). JS is all getElementById
   so reordering `<div class="card">` is safe.
2. Skills ready & ON: `accessibility-engineer`, `aria-live-regions`,
   `mobile-responsiveness`, `vanilla-web` (a11y/UI guidance); `run-perchance-ai-tool`
   (render+screenshot); `plan-mode`/`pi-planning-with-files` (the `/plan` chain).
3. **Paste-safety (load-bearing):** no `[ ] { }` in markup (everything before the
   first `<script>`); set any literal-bracket UI string from `<script>`.
4. **Verify every change:** `node test/smoke.mjs` · pipe JSON to
   `.claude/hooks/check-wizard.sh` · headless render 0 page errors + send operator
   a screenshot (384px + 820px; render `char-wiz-html` directly — see README §4).
5. **Mirror** the finished `char-wiz-html` → new `wizard-html-panel-21.txt`.
6. Commit at the green gate; `git push origin main`; tick Phase 2 in `task_plan.md`
   and log here.

Then Phases 3–8 in `task_plan.md` (Part-2 review phase, correctness, security,
CI+loader integrity, ROADMAP features, ship). Each has its own verification gate.

**Open judgment call for the operator:** I kept ~11 skills the research brief
wanted cut because they're actively used (orchestrator/subagent/research/UX/
reasoning) — now `name-only`. Confirm or adjust before the dispatcher-skill build.
