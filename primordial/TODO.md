# TODO

Near-term, checkbox tasks. Current phase: **Phase 1 — Scaffold**
(see [`ROADMAP.md`](ROADMAP.md)).

## Phase 1 — Scaffold (current)

- [x] Write `README.md`, `ROADMAP.md`, `TODO.md`, `LICENSE`
- [x] Write `CLAUDE.md` (< 200 lines)
- [x] `.claude/settings.json` + `check-syntax.sh` PostToolUse hook
- [x] `.claude/rules/` — `shaders.md`, `audio.md`, `deploy.md`
- [x] `.claude/skills/` — `new-preset`, `deploy-cpanel`, `perf-budget`
- [x] `.claude/agents/` — `visual-qa`, `audio-dsp`
- [x] `deploy/.htaccess` + `deploy/DEPLOY.md`
- [ ] Create `index.html` entry (`<script type="module" src="./src/main.js">`)
- [ ] Stub `src/` skeleton (audio/, gl/, shaders/, looks/, params/, ui/, main.js)
- [ ] `.gitignore` (node_modules, `*.local.json`, `CLAUDE.local.md`, research corpus)
- [ ] Verify the `check-syntax.sh` hook fires on a JS edit
- [ ] Run `/doctor` — confirm skills/agents load and listing budget is OK

## Next up — Phase 2 (port the stress-test rig)

- [ ] Drop the FPS stress-test rig into `src/` as the first runnable page
- [ ] Wire it to the `perf-budget` skill's SMOOTH / OK / TOO-MUCH readout
- [ ] Capture a baseline budget (FBO scale + step cap) on a real phone

## Backlog (parking lot)

- [ ] Decide renderer: raw WebGL2 (zero deps) vs. ogl (~8 KB) — default raw
- [ ] Pin `realtime-bpm-analyzer` into `vendor/` or an import map
- [ ] First "look" preset authored from scratch (commercial-safe GLSL)
