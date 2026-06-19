# Progress Log — primordial

## Session 1 — 2026-06-19 (planning + research)

**Did:**
- Scoped the project: static-first audio-reactive WebGL2 visual instrument for electronic-musician
  collabs, hosted on Namecheap Stellar Plus. Artist operates the tool (instrument, not art-for-them).
- Ran 7 deep-research passes (Stellar Plus, Claude-repo best practice, audio-visual stack, + 4 shader
  passes: porting/audio-texture, licensing, technique, tooling). Synthesis → `findings.md`.
- Wrote approved build spec (plan) and copied to `docs/BUILD-SPEC.md`.
- Created durable planning files (`task_plan.md`, `findings.md`, `progress.md`) via pi-planning-with-files.
- Built artifacts available from this session: phone **stress-test rig** (raymarched slime + FPS readout,
  to be ported in Phase 1), curated Claude corpus subset (→ `research/corpus/`), scraper (→ `research/scripts/`).

**State:** Phase 0 (scaffold) in progress. Build of the app (Phases 1–6) **awaits explicit "go"**
(user chose build-later; execution = agent-orchestrator-task + subagent-task-execution).

**Next:** finish scaffold files (docs, tailored `.claude/`, `src/` skeleton, `deploy/.htaccess`,
`.gitignore`, README/ROADMAP/TODO/LICENSE), then on "go" run the orchestrated build from Phase 1.

**Notes:** container is ephemeral + Perchance repo is read-only → this project is delivered as a
zip + git bundle for the user to push to a fresh GitHub repo.

## Session 2 — 2026-06-19 (orchestrated build)

**Did:**
- Ran agent-orchestrator-task + subagent-task-execution: 2 parallel subagents (disjoint file sets) →
  full docs + tailored `.claude/` + `deploy/` (agent 1) and the complete runnable app `index.html`+`src/` (agent 2).
- Synthesis pass: applied **Primordial** branding (LICENSE → Primordial Studio LLC; HUD wordmark → PRIMORDIAL;
  title/README/CLAUDE.md → Primordial Studio; domain → **primordial.video** in deploy), renamed dir → `primordial`.
- Verified: `node --check` on all 15 JS (pass); **headless Chromium render** confirmed shaders compile + app
  boots + slime renders at ~36 fps on software GL with live HUD/FPS readout.
- **Fixed a real bug:** `src/looks/registry.js` fetched `/looks/*.json` (resolved vs page) → 404; now resolves
  vs the module via `import.meta.url` → loads `/src/looks/*.json` 200. Re-render: zero console errors, zero 404s.

**State:** App runs end-to-end (Phases 1,3,4,5 done). Remaining: Phase 2 = user hosts on primordial.video
(HTTPS unblocks mic); Phase 3 = verify audio reactivity vs real music live; Phase 6 = first collab.

## Test results
| Phase | Test | Result |
|-------|------|--------|
| 0–5 | `node --check` × 15 JS files | ✅ pass |
| 4 | Headless WebGL2 render — shaders compile + slime renders | ✅ pass (~36fps software GL) |
| 4 | HUD/FPS readout + PRIMORDIAL wordmark | ✅ visible |
| 4 | Looks load (slime-green, hud-amber) | ✅ 200 after registry fix |
| — | Console errors / 404s | ✅ none |
