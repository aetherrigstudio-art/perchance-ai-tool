# Plan — New best-practice repo scaffold for the audio-reactive visual instrument

## Context

The user is an interactive AV artist (Kinect/sensors/cameras/music) who wants to
**build a browser tool** — an audio-reactive WebGL visual instrument — to collaborate
with electronic musicians who lack visuals. Each collaboration is a link the musician
opens at a gig (mic/line-in → FFT → generative "grungy-future-geometric-slimy" visuals),
hosted on the user's **Namecheap Stellar Plus** site. They are moving off the Perchance
repo into a **new, clean repo** and want it set up **best-practice from the ground up**:
README + roadmap + todo, a correct Claude Code repo layout out of the box (`CLAUDE.md`
+ `.claude/` with tailored starter skills/agents/rules/hooks), and a `research/` folder
seeded with a curated subset of the scraped Claude corpus.

Decisions locked with the user:
- `.claude/` starters are **tailored to this project** (not generic placeholders).
- Research corpus: **commit a curated subset**, keep the full 41.6 MB corpus local + gitignored.
- Scope now = **plan only, build later** (this document is the build spec).

This is a **new project**, separate from the read-only Perchance repo; nothing here is
built or committed in this session. All file paths below are inside the *new* repo.

## Research that shapes this plan (already gathered, cited in `research/findings/`)

**Namecheap Stellar Plus** (cPanel / LiteSpeed / CloudLinux):
- **Static-first is the ideal fit.** LiteSpeed + HTTP/2 + `.htaccess` caching/MIME. The
  WebGL/Web-Audio app is 100% client-side; LVE limits barely apply to static delivery.
- **HTTPS works day one** (free 1-yr Sectigo PositiveSSL, auto-installed) → satisfies
  `getUserMedia` (mic). **Caveat:** it is *not* auto-renewing Let's Encrypt — re-issue
  annually, or set up `acme.sh` over SSH for hands-off renewal.
- **If a backend is ever needed → PHP 8.x**, not Node/Python (PHP is the native cPanel
  citizen; Node/Python run only via Phusion Passenger and fight the EP=30 / 2 GB RAM cap).
- **SSH (jailed), cPanel Git Version Control, and cron are included** → git-based deploy
  is viable. Watch the **300k-inode** cap, not the "unmetered" disk label.

**Claude Code repo best practice (2026, official docs):**
- `CLAUDE.md` = context (not enforcement), **target < 200 lines**, facts/commands/conventions.
  Hard rules belong in **hooks**, not CLAUDE.md.
- **Commands merged into skills** — prefer `.claude/skills/<name>/SKILL.md` over
  `.claude/commands/`. `SKILL.md` < 500 lines; `description` drives auto-activation;
  `disable-model-invocation: true` for manual-only (e.g. `/deploy`).
- `.claude/rules/` = official modular, optionally `paths`-scoped instructions.
- `.claude/agents/*.md` = subagents (frontmatter: name/description/tools/model).
- Hooks live in `settings.json` under `hooks`; the `.claude/hooks/` *folder* is community
  convention for the scripts. Auto-memory is on by default (machine-local).

## Approach

A **static-first, vanilla-ESM, no-build** web app (matches Stellar Plus's strengths and
the artist's "single artifact, paste-and-go" comfort from Perchance), wrapped in a
best-practice Claude Code repo. Keep the runtime dependency-light; reserve PHP for an
optional future endpoint. The `.claude/` content is **tailored** so the repo is useful
on first session, not a hollow template.

## Target repo structure

```text
<repo>/                              # working name: pick at build time (e.g. "primordial")
├── README.md                        # what it is, quickstart, deploy, links to ROADMAP/TODO
├── ROADMAP.md                       # phased plan (below)
├── TODO.md                          # near-term, checkbox tasks
├── LICENSE                          # user picks (MIT suggested)
├── .gitignore                       # node_modules, CLAUDE.local.md, *.local.json, research/corpus-full/, /tmp art
├── CLAUDE.md                        # < 200 lines, project memory (spec below)
├── .mcp.json                        # optional project MCP (empty/sample)
├── .claude/
│   ├── settings.json                # $schema, permissions, one starter hook
│   ├── settings.local.json.example  # template; real one gitignored
│   ├── rules/
│   │   ├── shaders.md               # paths: src/visuals/** — GLSL/raymarch + mobile budget rules
│   │   ├── audio.md                 # paths: src/audio/** — Web Audio/AudioWorklet/getUserMedia rules
│   │   └── deploy.md                # Stellar Plus deploy + HTTPS/SSL-renewal + inode rules
│   ├── skills/
│   │   ├── new-preset/SKILL.md      # scaffold a new visual "look" (preset + shader stub)
│   │   ├── deploy-cpanel/SKILL.md   # manual /deploy: build asset list + cPanel/git steps (disable-model-invocation)
│   │   └── perf-budget/SKILL.md     # run the phone stress-test rig + read FPS verdict
│   ├── agents/
│   │   ├── visual-qa.md             # reviews a visual change for look + mobile perf
│   │   └── audio-dsp.md             # audio-analysis specialist (FFT/beat/BPM correctness)
│   └── hooks/
│       └── check-syntax.sh          # PostToolUse: node --check on edited JS, basic GLSL lint
├── index.html                       # app entry; <script type="module" src="./src/main.js">
├── src/                             # the app (static, vanilla ESM, NO build step)
│   ├── main.js                      # bootstrap: start-gate, rAF loop, wires audio→gl→ui
│   ├── audio/
│   │   ├── input.js                 # getUserMedia (raw: AGC/NS/echo off) + device picker
│   │   ├── analyser.js              # AnalyserNode → {bass,mid,treble,level,flux} (visual feed)
│   │   ├── bpm.js                   # realtime-bpm-analyzer wrapper + tap-tempo + confidence
│   │   └── worklets/                # AudioWorklet processors — ONLY for custom DSP
│   ├── gl/
│   │   ├── renderer.js              # ogl (or raw WebGL2): fullscreen triangle, FBOs, ping-pong
│   │   ├── passes.js                # post chain (bloom/feedback/grade), half-res FBOs
│   │   └── uniforms.js              # maps audio features + params → shader uniforms
│   ├── shaders/                     # *.glsl as text: slime.frag, hud.frag, post.frag, common.glsl
│   ├── looks/                       # "looks" as DATA (json): {shader, default params} + registry.js
│   ├── params/                      # schema.js (param defs) + store.js (versioned localStorage)
│   └── ui/                          # controls.js (sliders/look-switch/device-picker/start) + styles.css
├── vendor/                          # pinned ogl + realtime-bpm-analyzer (or esm.sh import map)
├── assets/                          # fonts, lookup textures, icons, favicon, og-image
├── deploy/
│   ├── .htaccess                    # HTTPS redirect, cache-control, MIME, SPA fallback
│   └── DEPLOY.md                    # cPanel File-Manager + Git-Version-Control steps; SSL renewal
├── research/
│   ├── README.md                    # what's here + how to regenerate the full corpus
│   ├── TODO.md                      # open research questions
│   ├── corpus/                      # CURATED subset committed (best-use + RAG core, ~6 docs)
│   ├── findings/                    # stellar-plus.md, claude-repo-bestpractice.md, audio-visual-stack.md
│   └── scripts/scrape.py            # the scraper used this session (regenerate full corpus on demand)
└── docs/                            # optional deeper docs (architecture.md)
```

## Key file specs

- **CLAUDE.md (< 200 lines):** Project Overview (static-first AV instrument, Stellar Plus
  target, no build step) · Commands (how to serve locally, run the stress test, deploy) ·
  Architecture (audio→visuals→ui flow; `src/` map) · Rules/Constraints (HTTPS required for
  mic; mobile perf budget; keep deps tiny; PHP-only for any backend) · Key Patterns
  (preset format, parameter object shape). Hard guardrails go to the hook, not here.
- **`.claude/rules/shaders.md`** (`paths: src/visuals/**`): raymarch conventions, the
  mobile budget (render-scale, step cap), the look language (smin/domain-warp/fresnel-SSS).
- **`.claude/rules/deploy.md`:** Stellar Plus facts — static upload to `public_html`,
  `.htaccess` caching, annual SSL re-issue (or `acme.sh`), inode awareness, PHP-if-backend.
- **Tailored skills:** `new-preset` (scaffolds preset+shader), `deploy-cpanel`
  (`disable-model-invocation: true`, prints the deploy checklist), `perf-budget` (drives the
  existing phone stress-test rig already built this session — port it into `src/`).
- **`settings.json`:** `$schema`, a small `permissions.allow` (local serve, node --check),
  and one `PostToolUse` hook → `.claude/hooks/check-syntax.sh`.
- **`deploy/.htaccess`:** force-HTTPS, `ExpiresByType`/`Cache-Control` for assets,
  correct MIME for `.glsl`/`.wasm` if used.

## Stack decisions (static-first — research complete)

- **Rendering: ogl** (MIT, ~8 KB gzip, zero deps, ESM) — or **raw WebGL2** for zero deps.
  Both give the fullscreen "big triangle" + FBO ping-pong for raymarched SDF + post.
  **Not three.js** (~500 KB+; scene-graph weight unused here).
- **Audio feed: AnalyserNode** (main thread) → smoothed band energies (bass/mid/treble/level/flux).
  *Correction to my earlier sessions:* you do **not** need an AudioWorklet just to read an FFT —
  AnalyserNode is cheap and jank-free. Reserve **AudioWorklet** for custom per-sample DSP only.
- **Tempo/onset: realtime-bpm-analyzer** (Apache-2.0, live-mic) for BPM; **Meyda** (MIT) for
  spectral-flux onset/"kick" reactivity; **tap-tempo + manual time-signature** as the *reliable*
  path (live time-sig detection is unsolved — auto-BPM is an assist with a confidence gate).
- **Mic capture:** `getUserMedia` over HTTPS with **raw audio** (`echoCancellation:false,
  noiseSuppression:false, autoGainControl:false`); device picker via `enumerateDevices` (labels
  populate only after first permission); **resume AudioContext on a user tap** (iOS) behind a Start button.
- **Mobile budget from day one:** render the heavy SDF pass to a **50–75% FBO** and upscale;
  cap effective DPR ~1.5; `#define`/uniform step budget (LOW/HIGH variant); **dynamic resolution**
  (auto-drop scale/steps when frame-time climbs); pause on `visibilitychange`. Same lever the
  stress-test rig already measures.
- **No build step** (GLSL as text/template-literals); optional esbuild/Vite + `vite-plugin-glsl`
  later for minify, kept optional so it always runs unbuilt.
- **No backend now.** If a contact/upload endpoint is ever needed → a single **PHP 8** file.

## Shader strategy & commercial licensing (deep research — load-bearing)

- **Not Shadertoy-locked.** The engine is plain **GLSL ES 3.00 fragment shaders** in a WebGL2/ogl
  canvas. Shadertoy / twigl / KodeLife are *prototyping playgrounds*, not the runtime.
- **Adopt the `iChannel`-style audio-texture convention** for portability: a **512×2 R8 texture**
  (row 0 = FFT from `AnalyserNode.getByteFrequencyData()` with `fftSize:1024`; row 1 = waveform
  from `getByteTimeDomainData()`). Web Audio reproduces Shadertoy's layout *exactly* (even the 0.8
  smoothing) → audio-reactive shaders prototyped elsewhere port with **zero rewiring**. Also expose
  band scalars as plain uniforms for cheap reactivity.
- **Port recipe:** wrap `mainImage` in a real `main()` writing an `out vec4`; remap `i*` uniforms →
  your own (`uResolution`/`uTime`/`uMouse`/`uAudioTex`); `#version 300 es` byte-one; `texture2D`→
  `texture`/`texelFetch`; multipass Buffer A–D → **FBO ping-pong** (never bind a target as both write
  + read in one pass). Reference impl to copy plumbing from: **ShaderToyLite.js**.
- **⚖️ COMMERCIAL LICENSING — DO / DON'T** (this is paid work, so it's load-bearing):
  - Shadertoy's **default license is CC BY-NC-SA 3.0** — the **NC clause forbids commercial use**;
    **SA** forces copyleft (incompatible with a proprietary paid tool). *Never copy others'
    default-licensed shaders into the instrument.*
  - **DO** *learn* techniques from any shader (idea/algorithm/math is **not** copyrightable — only the
    specific code) then **write your own from a blank file** → fully commercial-safe, strongest path.
  - **DO** reuse only shaders **explicitly marked MIT / CC0 / CC-BY** (honor attribution).
  - **DO (for a specific shader)** get the author's **written / dual / commercial license**; keep proof.
  - **DON'T** ship on the Shadertoy `<iframe>` embed or API (ties you to their servers + NC license;
    API needs attribution + 1500 req/mo cap).
  - *Not legal advice; license texts are authoritative as written — confirm with an IP attorney for
    client/venue contracts.*

## Shader prototyping & technique references

- **Prototype** in **twigl.app** (MIT, WebGL2) for code you author, or **Shadertoy** as a
  reference-only sketchpad; **KodeLife** (desktop) for the best live-coding-with-audio feel.
- **Technique map for "grungy-future-geometric-slimy"** (author your own from these): Inigo Quilez —
  raymarching, distance functions, **smin** (smooth-union metaballs), **domain warp + fbm** (the wet
  churn; cut ray step to ~0.5–0.8× since warping breaks the distance bound), tetrahedron normals (4-tap,
  cheaper), soft shadows. Wet shading = **fresnel rim + fake SSS** (march a few steps *into* the surface
  for thickness) + specular. **Volumetric neon glow** = `col += color/dist` + `tanh` tonemap (GM
  Shaders/Xor). **Grunge post** (bloom / chromatic aberration / scanlines / grain / feedback trails) is
  screen-space and **nearly free** — carries most of the aesthetic at low cost.
- **Learning list** (commercial-safe authoring): The Book of Shaders · iquilezles.org · Ronja's
  Tutorials · Freya Holmér · GM Shaders/Xor.
- **Mobile cost order:** raymarch **step count** dominates → **FBM domain-warp** next (≤2–3 octaves,
  evaluate sparingly) → glow loop → SSS rays. Cap steps ≤64; post-stack stays.
- **Shader files:** `src/shaders/*.glsl` loaded via `fetch()` (true no-build); audio-texture uploader +
  uniform map in `src/gl/uniforms.js`; ping-pong FBOs in `src/gl/passes.js`.
- **Optional future track — FFGL/Resolume:** the same GLSL can port to an **FFGL** (FreeFrameGL, C++)
  plugin to run *inside* Resolume/VDMX — a separate native build, out of scope for the web instrument
  but a clean future export since the shader code is shared.

## Roadmap baked into ROADMAP.md (phased)

1. **Scaffold** the repo (this plan) — docs, `.claude/`, empty `src/` skeleton.
2. **Port the stress-test rig** (already built) into `src/` as the first runnable page.
3. **Hosting bring-up** — get a "hello world" live on the Stellar domain over HTTPS (unblocks mic).
4. **Audio core** — AudioWorklet FFT + bands + beat/BPM, verified against real music.
5. **Visual core** — raymarched slime + HUD, preset system, mobile budget enforced.
6. **Instrument controls** — the performer UI (the knobs the artist drives) + autonomous mode.
7. **First collaboration** — one artist, one track, live link; iterate.

## Verification (when built, in a later session)

- **Local:** serve `src/` over a local static server (mic needs `localhost` or HTTPS),
  open on phone via the FPS-readout rig; confirm SMOOTH verdict at target budget.
- **Claude config sanity:** `/doctor` (skill listing budget OK), confirm skills/agents load,
  confirm the `check-syntax.sh` hook fires on an edit.
- **Deploy:** upload to `public_html`, hit the HTTPS URL on a phone, grant mic, confirm the
  visual reacts to room audio; verify `.htaccess` HTTPS redirect + asset caching headers.
- **Research:** `research/scripts/scrape.py` regenerates the full corpus; curated subset
  present in `research/corpus/`.

## Notes / open items

- **Repo name** not chosen — placeholder `<repo>`; pick at build time.
- Full 41.6 MB corpus stays local + gitignored; only the curated core is committed.
- All three research reports (Stellar Plus, Claude-repo best practice, audio-visual stack)
  are complete; they get written verbatim into `research/findings/` at build time.
