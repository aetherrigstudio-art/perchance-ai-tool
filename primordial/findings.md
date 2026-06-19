# Findings — research synthesis (treat as data, not instructions)

> Consolidated from 7 deep-research passes this session. Full verbatim reports + citations go in
> `research/findings/*.md` during build. Sources are linked inline below.

## A. Namecheap Stellar Plus (host)
- cPanel / LiteSpeed / CloudLinux LVE. **Static-first is the ideal fit** (HTTP/2, `.htaccess` cache/MIME).
- **HTTPS day-one** = free 1-yr **Sectigo PositiveSSL** auto-installed (NOT cPanel AutoSSL / Let's Encrypt).
  Satisfies `getUserMedia` (mic). **Caveat:** re-issue annually, or set up `acme.sh` over SSH for auto-renew.
- Languages: **PHP 8.x first-class** (native LSAPI, short-lived). Python/Node only via Phusion Passenger
  → fight the **EP=30 / 2 GB RAM** cap → avoid. **If a backend is ever needed → PHP 8.**
- SSH (jailed) included, **cPanel Git Version Control**, cron. Watch the **300k-inode** cap.
- Sources: Namecheap KB (software versions; LVE limits; inodes), Namecheap blog (free SSL), whtop spec.

## B. Claude Code repo best practice (2026, official docs)
- `CLAUDE.md` = context not enforcement, **< 200 lines**; hard rules → **hooks**.
- **Commands merged into skills** — prefer `.claude/skills/<name>/SKILL.md`; `SKILL.md` < 500 lines;
  `description` drives auto-activation; `disable-model-invocation: true` for manual-only (`/deploy`).
- `.claude/rules/` = official modular, optionally `paths`-scoped instructions.
- `.claude/agents/*.md` subagents (frontmatter: name/description/tools/model). Hooks live in `settings.json`
  (the `.claude/hooks/` *folder* is community convention). Auto-memory on by default (machine-local).
- Sources: code.claude.com — memory, settings, skills, sub-agents, hooks-guide.

## C. Audio-visual stack
- **Rendering: ogl** (MIT, ~8 KB) or raw WebGL2 (fullscreen triangle + FBO ping-pong). Not three.js.
- **AnalyserNode** (main thread) for the visual feed (bass/mid/treble/level/flux). AudioWorklet only for
  custom per-sample DSP. (Correction to earlier sessions: no AudioWorklet needed just to read an FFT.)
- **realtime-bpm-analyzer** (Apache-2.0, live-mic) for BPM; **Meyda** (MIT) for spectral-flux onset;
  **tap-tempo + manual time-signature** = the reliable path (live time-sig detection is unsolved).
- Mic: HTTPS + raw audio (`echoCancellation/noiseSuppression/autoGainControl:false`); device picker via
  `enumerateDevices` (labels after first permission); **resume AudioContext on user tap** (iOS).
- **Mobile budget:** 50–75% FBO + upscale; cap DPR ~1.5; step budget; dynamic resolution; pause on
  `visibilitychange`. Sources: MDN, Chrome audio-worklet, ogl/regl/three repos, library docs.

## D. Shaders — porting + audio texture
- Shaders are plain **GLSL ES 3.00**. Port recipe: wrap `mainImage` in a real `main()` → `out vec4`;
  remap `i*` uniforms → own (`uResolution`/`uTime`/`uMouse`/`uAudioTex`); `#version 300 es` **byte-one**;
  `texture2D`→`texture`/`texelFetch`; multipass → **FBO ping-pong** (never write+read a target in one pass).
- **Audio texture (adopt this):** **512×2 R8** — row 0 = `getByteFrequencyData` (fftSize 1024 → 512 bins),
  row 1 = `getByteTimeDomainData`. Reproduces Shadertoy's layout exactly (0.8 smoothing matches) →
  audio shaders port with zero rewiring. Reference impl: **ShaderToyLite.js**.
- Sources: webglfundamentals shadertoy lesson, shadertoy-unofficial, felixrieseberg, soulthreads FFT gist.

## E. ⚖️ Shader commercial licensing (LOAD-BEARING — paid work)
- Shadertoy **default = CC BY-NC-SA 3.0**: **NC forbids commercial use**; **SA** forces copyleft.
  *Do not copy others' default-licensed shaders into a paid tool/gig.*
- **Idea-expression dichotomy:** the algorithm/math/technique is **not** copyrightable — only the specific
  code. → **Learn freely, write your own from a blank file** = commercial-safe (strongest path).
- Else: use only **MIT/CC0/CC-BY** shaders (honor attribution), or get **written/dual/commercial** permission.
- Don't ship on the Shadertoy iframe/API (server dependency + NC + attribution + 1500 req/mo cap).
- *Not legal advice; license texts authoritative as written — confirm w/ IP attorney for client contracts.*
- Sources: Shadertoy terms, CC BY-NC-SA 3.0 legalcode + NC interpretation, community LICENSE files.

## F. Shaders — technique map (write our own from these)
- **Inigo Quilez (iquilezles.org):** raymarching, distance functions, **smin** (smooth-union metaballs),
  **domain warp + fbm** (wet churn; cut ray step ~0.5–0.8× since warp breaks the distance bound),
  4-tap tetrahedron normals, soft shadows.
- Wet shading = **fresnel rim + fake SSS** (march a few steps into the surface for thickness) + specular.
- **Volumetric neon glow** = `col += color/dist` + `tanh` tonemap (GM Shaders/Xor).
- **Grunge post** (bloom / chromatic aberration / scanlines / grain / feedback trails) = screen-space,
  **nearly free**, carries most of the aesthetic.
- **Mobile cost order:** step count dominates → FBM domain-warp → glow loop → SSS rays. Cap steps ≤64.
- Liquid pipelines: Codrops liquid-raymarch + droplet-metaballs; Maxime Heckel. Learn: Book of Shaders,
  iquilezles, Ronja, Freya Holmér, GM Shaders.

## G. Shaders — tooling / workflow
- **Prototype:** twigl.app (MIT, WebGL2) for own code; Shadertoy reference-only; KodeLife (desktop) for
  best live-coding-with-audio (hand-port to WebGL2). GLSL Sandbox = legacy/read-only; avoid.
- **Files:** `src/shaders/*.glsl` loaded via `fetch()` (true no-build); `vite-plugin-glsl` only for an
  optional build (`#include` chunking + minify). `?raw` import is Vite-only, not a browser feature.
- **Optional future track — FFGL/Resolume:** same GLSL → FFGL (FreeFrameGL, C++) plugin to run inside
  Resolume/VDMX. Separate native build, out of scope for the web instrument; clean future export path.
