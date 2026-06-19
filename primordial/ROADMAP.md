# Roadmap

Phased plan for primordial — the audio-reactive WebGL2 visual instrument.
Each phase is a gate: finish and verify it before starting the next.

## Phase 1 — Scaffold

Stand up the repo best-practice from the ground up: docs (`README`, `ROADMAP`,
`TODO`, `LICENSE`), the Claude Code layout (`CLAUDE.md` + `.claude/` skills,
agents, rules, hooks), `deploy/` assets, and an empty `src/` skeleton matching
the architecture map. No app logic yet — just a runnable, correct shell.

## Phase 2 — Port the stress-test rig

Bring the already-built FPS stress-test rig into `src/` as the first runnable
page. It renders a representative GL load and reports a SMOOTH / OK / TOO-MUCH
verdict — this becomes the tool we use to set the mobile performance budget for
everything after it.

## Phase 3 — Hosting bring-up

Get a "hello world" page live on the Stellar Plus domain over **HTTPS**. This
unblocks the mic (`getUserMedia` needs a secure context) and proves the deploy
path end to end: upload to `public_html`, `.htaccess` in place, SSL valid,
caching/MIME headers correct.

## Phase 4 — Audio core

Build the audio analysis path: `getUserMedia` (raw audio — AGC/NS/echo off) +
device picker, an `AnalyserNode` feeding band energies (bass / mid / treble /
level / flux), the 512×2 audio texture, and beat/BPM (realtime-bpm-analyzer +
tap-tempo fallback). Verify against real music.

## Phase 5 — Visual core

The raymarched "slime" renderer + HUD: fullscreen-triangle WebGL2, FBO
ping-pong post chain, the preset/"looks" system (JSON data), and the mobile
budget enforced from day one (FBO render-scale, step cap, dynamic resolution).

## Phase 6 — Instrument controls

The performer UI — the knobs the artist actually drives during a set: look
switching, reactivity tuning, sliders, device picker, plus an autonomous mode
for hands-off stretches. Versioned localStorage for saved states.

## Phase 7 — First collaboration

One artist, one track, one live link. Run it at (or rehearsing for) a real gig,
gather what breaks under real audio and a real venue, and iterate.
