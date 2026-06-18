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

## Session 2026-06-18 (cont.) — Phase 3 COMPLETE (Review & refine / second pass)
- **`window.gradeCharacter(raw, {persona})`** ports the `test/grade-generation.mjs`
  rubric into the panel (12 checks; persona mode drops the 2 FIRST MESSAGE checks).
  Uses a quiet section reader `gSec` (no console warns on expected misses).
- **New `Review & refine (second pass)` card** at the top of ④ (after Opening,
  before Consistency). `gradeCast()` grades main + persona + all extras; per
  character it shows an A–F grade badge (green/amber/red) and lists each failing
  check; flagged checks that map to a section get a one-click **re-roll <section>**
  button. Re-grades automatically in `onWizFinish` whenever the review is open.
- **Refactor:** pulled `window.rerollSection(outId, label, exclude)` out of
  `doReroll` (which now delegates) so the Review buttons reuse the exact reroll
  pipeline (`replaceSection`/`getSection`).
- **Consistency** (genConsistency→applyFix) already sits in ④ REVIEW; left as-is.
- **smoke.mjs:** 4 new assertions drive `window.gradeCharacter` on GOOD/BAD/persona
  fixtures so the in-browser port stays in lock-step with the node grader.
- **Mirrored** → `wizard-html-panel-22.txt`.

| Check | Result |
|-------|--------|
| smoke.mjs (incl. 4 gradeCharacter assertions) | PASS |
| node test/grade-generation.mjs (self-test) | exit 0 |
| check-wizard.sh | exit 0 |
| functional render (gradeCast in-browser) | 0 page errors; screenshot sent |

**Resume at Phase 4** (correctness hardening: generate() try-finally + single-flight
guard, RFC-4122 UUID fallback, resetAll clears accSchemaV1/accWB_*).

## Session 2026-06-18 (cont.) — Phases 4 + 5 COMPLETE (correctness + security)
- **Phase 4 (correctness):** `generate()` now single-flight (`window._generating`)
  with try/catch/finally — failed gens no longer wedge the stop button / loader /
  busy status; the 4 entry points (startGen/rerollSection/genConsistency/genStyle)
  bail before mutating `activeOutputEl` so concurrent clicks can't misroute chunks.
  `uuidV4()` = RFC-4122 v4 from `getRandomValues` (Math.random last resort), used by
  `uniqueUuid` when `crypto.randomUUID` is absent. `resetAll()` also wipes
  `accSchemaV1` + all `accWB_*` and nulls `window.learned`.
- **Phase 5 (security):** `safeUrl()` protocol allowlist (http/https/blob/data:image)
  guards all 6 image-src sinks. `prepUserInput()` neutralizes injected `=== HEADER ===`,
  caps length, and fences notes in BEGIN/END USER INPUT (applied to char + persona
  prompts, with a "data not instructions" binding rule). QA error sink switched off
  `innerHTML` interpolation to safe DOM/textContent.
- **smoke.mjs:** +2 (uuidV4) +6 (safeUrl) +4 (prepUserInput) assertions; URL stub
  now augments Node's real `URL` constructor instead of replacing it.
- **Two commits** (Phase 4 `51356a6`, Phase 5 below). **Mirrored → `wizard-html-panel-23.txt`.**

| Check | Result |
|-------|--------|
| smoke.mjs (now ~70 assertions) | PASS |
| node test/grade-generation.mjs | exit 0 |
| check-wizard.sh | exit 0 |
| headless render | 0 page errors |

**Resume at Phase 6** (CI + loader integrity: `.github/workflows/verify.yml`;
loader sha256 check). NOTE: Phase 6 is the highest-risk remaining phase — it
touches CI + the live loader deploy path; read findings ③ + AUTOMATION.md first.

## Session 2026-06-18 (cont.) — Phase 6 COMPLETE (CI + loader integrity)
- **CI:** `.github/workflows/verify.yml` (push/PR → main): smoke + grade-generation
  self-test + wizard `node --check` + a hash-sync step. Run #1 (commit 4cf0434)
  conclusion=success. (ci-verify.sh deliberately excluded — CDN-lag flake.)
- **Loader integrity (digest + soft-fail, operator's pick):** `char-wiz-html.sha256`
  committed; `scripts/gen-hash.sh` writes it; `.githooks/pre-commit` regenerates +
  stages it on any char-wiz-html change; session-start.sh sets `core.hooksPath
  .githooks`; CI fails on drift. `wizard-loader-html.txt` now fetches the digest and
  compares `crypto.subtle.digest` of the injected bytes — on mismatch shows a
  warning banner but STILL renders (never blocks; loader is paste-once so a hard
  fail would brick the generator). Verified `sha256sum` == subtle.digest, no false
  positives. Pre-commit hook functionally tested (regenerates + stages, reverts clean).
- ⚠️ **PENDING OPERATOR ACTION:** re-paste `wizard-loader-html.txt` into the
  Perchance HTML editor ONCE to activate the banner (only manual step; everything
  else auto-deploys via the loader as usual).

| Check | Result |
|-------|--------|
| CI verify run #1 (4cf0434) | success |
| loader node --check | OK |
| hash-sync (sha256sum == .sha256) | in sync |
| smoke.mjs | PASS |

**Resume at Phase 7** (ROADMAP features: `stopSequences:["=== END ==="]` in data
panel; `shortcutButtons`; defer richer `messageWrapperStyle`). NOTE: Phase 7 touches
the DATA panel (`char-wiz-dat`) — which is paste-once into the Perchance DATA editor,
so a data-panel change ALSO needs a one-time manual re-paste. Read AUTOMATION.md +
char-info §9 verified/unverified before adding fields.

## Session 2026-06-18 (cont.) — Phase 7 COMPLETE (ROADMAP features)
- **stopSequences:** the data panel ALREADY wired `stopSequences() => window.WIZ_STOP_SEQUENCES
  || ["=== END ==="]`, so NO data-panel re-paste was needed. Activated it by appending
  a terminal `=== END ===` instruction to the char + persona multi-section prompts.
  (Conservative; live-confirm it helps termination — trivially revertable.)
- **shortcutButtons (ROADMAP #1, verified field):** "Quick reply buttons" sub-card in
  the presentation card — global list (name / message / auto-send / clear-after-send),
  DOM-built with aria-labels. `characterRow` exports it per AI character as
  `{name,message,insertionType:"replace",autoSend,clearAfterSend,type:"message"}`;
  persona gets none; empty/partial entries filtered. Stored on `advanced.shortcutButtons`
  (persists via the existing snapshot).
- **messageWrapperStyle:** left deferred (per-character #hex color only; unconfirmed in-app).
- All HTML-side → **auto-deploys via loader; no data-panel re-paste.** Mirror → `wizard-html-panel-24.txt`.

### 📌 sha256sum for future review (requested)
`char-wiz-html` digest after Phase 7:
```
e1a6369c6734e87f02c96e2ee75b9a4e0cd4bdc20205155c7832c58739772d0e
```
- Committed in `char-wiz-html.sha256` (the loader's soft integrity check compares against it).
- Verify anytime: `sha256sum char-wiz-html` (must equal `cat char-wiz-html.sha256`).
- Regenerate after any char-wiz-html edit: `bash scripts/gen-hash.sh` (the
  `.githooks/pre-commit` hook does this automatically; CI fails if it drifts).
- Prior digests this initiative: Phase 6 baseline `aa08ffb6f7f0df21899b0e0a36b95a152dd3e75fa3f637b8d6507043f64201fb`.

| Check | Result |
|-------|--------|
| smoke.mjs (+3 shortcutButtons) | PASS |
| check-wizard.sh | exit 0 |
| markup paste-safety | clean |
| functional render (shortcut UI) | 0 page errors; screenshot sent |
| hash in sync | e1a6369… |

**Resume at Phase 8** (docs/ship: update ROADMAP.md, reconcile CLAUDE/README/memory,
final verify). Most of the initiative is done — Phase 8 is documentation + wrap-up.

---
## ▶ NEXT SESSION — START HERE (resume the optimization initiative)

**Read order:** CLAUDE.md → README.md → `task_plan.md` + `findings.md` + this file.
The `/plan` skill (pi-planning-with-files) auto-loads `task_plan.md` on start.

**Where we are:** Phase 0 ✅, Phase 1 🟡 (skills 38→30, parked→name-only done;
dispatcher skills NOT built), Phase 2 ✅ (IA regroup + a11y, mirrored to -21),
Phase 3 ✅ (Review/refine second pass + window.gradeCharacter, mirrored to -22),
Phases 4 ✅ (correctness) + 5 ✅ (security) hardening, mirrored to -23,
Phase 6 ✅ (CI workflow + loader digest soft-fail integrity),
Phase 7 ✅ (stopSequences activation + shortcutButtons), mirrored to -24, all gates
green. **Resume at Phase 8** (docs/ship). ⚠️ operator must re-paste the loader once
(Phase 6 — optional, activates the integrity banner). No data-panel re-paste needed.

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
