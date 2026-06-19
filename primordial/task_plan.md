# Task Plan — primordial (audio-reactive visual instrument)

> Working name `primordial` (rename freely). New repo, separate from the Perchance repo.
> Full build spec: see `docs/BUILD-SPEC.md` (copied from the approved plan).

## Goal

Build a **static, vanilla-ESM, audio-reactive WebGL2 visual instrument** the artist *operates*
to make visuals for electronic-musician collaborations. Each collab = an HTTPS link the musician
opens at a gig (mic/line-in → FFT → generative "grungy-future-geometric-slimy" raymarched visuals
+ neon HUD), hosted on **Namecheap Stellar Plus**. Best-practice Claude Code repo from day one.

## Locked decisions

- `.claude/` starters **tailored to this project** (not generic).
- Research corpus: **curated subset committed**, full 41.6 MB corpus gitignored/local.
- **Static-first**; PHP 8 only if a backend is ever needed. HTTPS works day-one (annual SSL re-issue caveat).
- **Rendering:** ogl (~8 KB) or raw WebGL2. Not three.js.
- **Audio:** AnalyserNode for the visual feed (+ 512×2 audio texture, Shadertoy-compatible);
  AudioWorklet only for custom DSP. realtime-bpm-analyzer + Meyda + tap-tempo.
- **Shaders: write our own** (commercial-safe). Shadertoy/twigl = reference-only; CC BY-NC-SA forbids copying.
- **Mobile budget from day one:** FBO render-scale, step cap, dynamic resolution.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 0 | Repo scaffold — docs, `.claude/` (tailored), `src/` skeleton, `research/`, `deploy/`, `.gitignore` | ✅ done |
| 1 | Stress-test rig integrated — live FPS/ms/resolution readout + SMOOTH/OK/TOO-MUCH verdict in the HUD | ✅ done |
| 2 | Hosting bring-up — go live on **primordial.video** over HTTPS (Stellar Plus; unblocks mic) | todo (user) |
| 3 | Audio core — AnalyserNode FFT + 512×2 audio texture + bands + energy-beat/tap-tempo | ✅ done (verify vs real music live) |
| 4 | Visual core — raymarched slime + HUD (own shaders), looks/preset system, mobile budget | ✅ done |
| 5 | Instrument controls — performer UI (sliders/look-switch/device-picker/tap-tempo) + visuals-only mode | ✅ done |
| 6 | First collaboration — one artist, one track, live link; iterate | todo |

## Execution method (as requested)

1. **pi-planning-with-files** (this step) — durable `task_plan.md` / `findings.md` / `progress.md`. ✅ in progress
2. **agent-orchestrator-task** — sequence phases, assign bite-sized tasks, keep shared-file edits
   (`src/gl/*`, shaders) on one worktree (no fan-out conflicts).
3. **subagent-task-execution** — execute task blocks, verify after each (stress-test FPS, `/doctor`,
   hook-fires, deploy smoke), tick `progress.md`. **Awaits explicit "go" (build-later).**

## Decisions / open items

- Repo name + GitHub target: user creates the GitHub repo and pushes (my GH access is Perchance-scoped).
- Container is ephemeral → this project is delivered as a **zip + git bundle**.

## Errors Encountered

| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |
