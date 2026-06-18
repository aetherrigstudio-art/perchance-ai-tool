# task_plan.md — Repo Optimization Initiative

**Goal:** Truly optimize this repo across 3 axes from the research (`findings.md`):
frontend code quality, agent/skill tooling, and deploy/verification/roadmap —
without breaking paste-safety, export-safety, or the single-`main` workflow.

**Verification gates (run per phase):** `node test/smoke.mjs` · `bash .claude/hooks/check-wizard.sh` (pipe JSON) · headless render 0 page errors · `node test/grade-generation.mjs` (phases touching prompts) · `bash .claude/hooks/check-skills.sh` (skill phases).

**Workflow:** work on `main`; commit per phase at a green gate; push `main`; update `progress.md` after each phase. Mirror any `char-wiz-html` change to `wizard-html-panel-21.txt`.

---
## Phase 0 — Research + plan ✅ complete
- [x] 3 parallel deep-research briefs → `findings.md`
- [x] This plan + `progress.md`

## Phase 1 — Skill/tooling consolidation  (config; low-risk, high-value)  🟡 in progress
- [x] Switch parked `user-invocable-only` → `name-only` (18 entries; reclaims listing budget; keeps `/name`)
- [x] Prune CONSERVATIVE set (8): caveman, performance-profiler, changelog-writer, product-capability, error-analysis, llm-prompt-optimizer, browser-tools, smoke-test → 38→30 skills, `check-skills` green. (NOT the brief's full ~20 — kept the orchestration/research/UX skills the operator actively uses.)
- [ ] Build dispatcher skills with bundled `reference/*.md` (audits become refs): `building-vanilla-ui`, `ensuring-accessibility`, `reviewing-code`, `researching-web` (+ keep `run-perchance-ai-tool`, `/plan` chain)
- [ ] `disable-model-invocation: true` on side-effect commands (`/audit`)
- [x] Reword CLAUDE.md skill-discipline note (budget mechanics, ≤~8 `on`)
- **Gate:** `check-skills.sh` in sync ✅ ; `/doctor` shows no description drops (pending)

## Phase 2 — IA regroup + a11y fixes  (the original active task)  ✅ complete
- [x] Reorder `<div class="card">` into 4 phases w/ `<h2>` spine: ① START (build mode·import·scenario) ② BUILD (main·persona·additional·relationships·lore) ③ POLISH ▸ collapsed `<details>` (image·immersion·presentation·tuning) ④ REVIEW&EXPORT (opening→top·consistency·export·share); Test Drive→bottom. (Opening lives ONLY at REVIEW top — the old `·opening` in BUILD was a stale dup, dropped. Part-2 placeholder omitted on purpose; Phase 3 inserts the real review card.)
- [x] ~~Delete the 2 duplicate `id="buildMode"` blocks~~ — already deduped in `-20`/main; nothing to delete.
- [x] Add blanket `:focus-visible` rule; `min-height:44px` + mobile media query (≥24px targets)
- [x] Label the 6 controls via `<script>` aria-label (loreMode/lorebookUrl/imMusic/tunCtx/tunWriting/sceneMode)
- [x] Streaming `aria-busy` toggle (setBusy helper) + single status announce; focus visible output on finish
- [x] Tab ARIA: role=tablist/tab/tabpanel + aria-selected + roving tabindex + arrow/Home/End keys (wired from `<script>`)
- [x] Mirror → `wizard-html-panel-21.txt`
- **Gate:** ✅ smoke PASS · check-wizard exit 0 · render 0 page errors · screenshots (384/820px) sent to operator
- **Side fix:** `test/smoke.mjs` fake DOM gained getAttribute/setAttribute/addEventListener/focus + `document.querySelector` so a11yInit runs headless; `validate-generator.py` now skips test harnesses (false-positive buildDexie table check on `smoke.mjs`).

## Phase 3 — Part-2 review/refine phase (post-generation)  ✅ complete
- [x] Port `test/grade-generation.mjs` rubric → in-browser `window.gradeCharacter(raw, {persona})` (12 checks; persona mode drops the 2 FIRST MESSAGE checks → 10)
- [x] New `Review & refine (second pass)` card at top of ④ (after Opening): `gradeCast()` grades main+persona+extras, shows A–F badge + per-character flagged sections, each with a one-click section re-roll (`rerollSection(outId,label,exclude)` — refactored out of `doReroll`); re-grades automatically on `onWizFinish`
- [x] ~~Generalize `genConsistency`→`applyFix`~~ — already lives in ④ REVIEW (consistency card sits right after the new review card); left intact
- **Gate:** ✅ smoke PASS (4 new gradeCharacter assertions track the node grader) · node grade-generation self-test exit 0 · check-wizard exit 0 · functional render (grade the cast) 0 page errors, screenshot sent
- Mirror → `wizard-html-panel-22.txt`

## Phase 4 — Correctness hardening  ⬜
- [ ] `window.generate()` try-finally + `_generating` single-flight guard (~:632)
- [ ] RFC-4122 UUID-v4 `getRandomValues` fallback
- [ ] `resetAll()` clears `accSchemaV1` + `accWB_*`, nulls `window.learned`
- **Gate:** smoke (export shape) + check-wizard

## Phase 5 — Security hardening  ⬜
- [ ] `safeUrl()` protocol allowlist (http/https/blob) before image `src` at all 4 sinks
- [ ] `prepUserInput()` strip injected `=== HEADER ===` + length cap + BEGIN/END wrap, rules after
- [ ] error sink `innerHTML`→`textContent` (~:2425)
- **Gate:** smoke + check-wizard + render

## Phase 6 — CI + loader integrity  ⬜
- [ ] `.github/workflows/verify.yml`: setup-node → smoke + `node --check` wizard + `ci-verify.sh html`
- [ ] CI publishes `char-wiz-html.sha256`; loader fetches + `crypto.subtle.digest` verifies (keeps auto-deploy)
- **Gate:** Action green on a test push

## Phase 7 — ROADMAP features (ranked)  ⬜
- [ ] `stopSequences: ["=== END ==="]` in data-panel `settings`; remove length-hack prompt scaffolding
- [ ] `shortcutButtons` UI (advanced) → export `{name,message,autoSend,insertionType,clearAfterSend}`
- [ ] (defer) richer `messageWrapperStyle` until in-app confirmed
- **Gate:** smoke + grader + render

## Phase 8 — Docs / roadmap / memory + ship  ⬜
- [ ] Update ROADMAP.md (build order, loader-integrity, CI items)
- [ ] Reconcile CLAUDE.md / README / WORKSPACE STANDARD note (single home per fact)
- [ ] `write_note` final state; push `main`
- **Gate:** all prior gates green; repo clean

---
**Decisions log**
- Flattened the 2-teammate research nest → 3 direct parallel agents (orchestrator anti-pattern: coordination overhead).
- `user-invocable-only` doesn't free budget → use `name-only`/prune instead.

**Errors Encountered**
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |
