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

## Phase 2 — IA regroup + a11y fixes  (the original active task)  ⬜
- [ ] Reorder `<div class="card">` into 4 phases w/ `<h2>` spine: ① START (build mode·import·scenario) ② BUILD (main·persona·additional·relationships·lore·opening) ③ POLISH ▸ collapsed `<details>` (image·immersion·presentation·tuning) ④ REVIEW&EXPORT (opening→top·[Part2]·consistency·export·share); Test Drive→bottom
- [ ] Delete the 2 duplicate `id="buildMode"` blocks
- [ ] Add blanket `:focus-visible` rule; `min-height:44px` + mobile media query (≥24px targets)
- [ ] Label the 6 controls via `<script>` aria-label (loreMode/lorebookUrl/imMusic/tunCtx/tunWriting/sceneMode)
- [ ] Streaming `aria-busy` toggle + single status announce; focus output on finish
- [ ] Tab ARIA: role=tablist/tab/tabpanel + aria-selected + arrow keys
- [ ] Mirror → `wizard-html-panel-21.txt`
- **Gate:** smoke + check-wizard + render(0 err) + screenshot to operator

## Phase 3 — Part-2 review/refine phase (post-generation)  ⬜
- [ ] Port `test/grade-generation.mjs` rubric → in-browser `window.gradeCharacter`
- [ ] Grade each generated character; flag weak sections; one-click "re-roll this section" (reuse `doReroll`/`replaceSection`/`getSection`)
- [ ] Generalize `genConsistency`→`applyFix` into the REVIEW phase
- **Gate:** smoke + grader self-test + render

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
