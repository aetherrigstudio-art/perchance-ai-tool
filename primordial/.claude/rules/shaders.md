---
paths: ["src/shaders/**", "src/gl/**"]
---

# Shader & GL rules

Scoped to the shader/renderer code. These are load-bearing — they protect
mobile performance and the commercial licensing position.

## ⚖️ WRITE-OUR-OWN — commercial licensing (read first)

This is **paid work**. Shadertoy's default license is **CC BY-NC-SA 3.0**: the
**NC** clause forbids commercial use and **SA** forces copyleft — incompatible
with a proprietary paid tool.

- **DO** learn any technique (the algorithm/math/idea is not copyrightable) and
  then **write the shader from a blank file**. This is the strongest path.
- **DO** reuse code only if it is explicitly **MIT / CC0 / CC-BY** — honor
  attribution and keep a note of the source + license.
- **DO** get a written/dual/commercial license for any specific shader you must
  reuse, and keep the proof.
- **DON'T** copy a default-licensed Shadertoy/GLSL-Sandbox shader into the
  instrument. **DON'T** ship on the Shadertoy iframe/API (server dependency +
  NC + attribution + request cap).
- Not legal advice; license texts are authoritative as written.

## Format & porting

- Plain **GLSL ES 3.00** fragment shaders. `#version 300 es` must be **byte
  one** of the file (no leading whitespace/comment).
- `.glsl` files load via `fetch()` as text — true no-build. `?raw` imports are
  Vite-only, not a browser feature; don't rely on them at runtime.
- Port recipe (when adapting your own prototype): wrap `mainImage` in a real
  `main()` writing an `out vec4`; remap `i*` uniforms → ours
  (`uResolution` / `uTime` / `uMouse` / `uAudioTex`); `texture2D` → `texture` /
  `texelFetch`; multipass Buffer A–D → **FBO ping-pong** (never bind a target as
  both read and write in one pass).

## Mobile performance budget (enforced)

Cost order on mobile: **raymarch step count dominates** → FBM domain-warp →
glow loop → SSS rays.

- Render the heavy SDF pass to a **0.5–0.75 render-scale FBO** and upscale; cap
  effective DPR ~1.5.
- **Cap raymarch steps ≤ 64.** Expose a LOW/HIGH step budget via `#define` or
  uniform.
- **Dynamic resolution:** auto-drop render-scale / step count when frame-time
  climbs; recover when it settles.
- Use **4-tap tetrahedron normals** (cheaper than 6-tap central differences).
- Keep **FBM sparse** — ≤ 2–3 octaves, evaluated sparingly. Domain warp breaks
  the SDF distance bound, so **cut the ray step to ~0.5–0.8×** when warping.
- Pause rendering on `visibilitychange`.

## The look language ("grungy-future-geometric-slimy")

Author from these techniques (iquilezles.org, GM Shaders, Book of Shaders):

- **smin metaballs** — smooth-union SDFs for the slime blobbing together.
- **Domain warp + fbm** — the wet churn (remember the step-size cut above).
- **Fresnel rim + fake SSS** — march a few steps *into* the surface for
  thickness, plus specular, for the wet read.
- **Volumetric neon glow** — `col += color / dist` accumulation + `tanh`
  tonemap.
- **Cheap grunge post** — bloom / chromatic aberration / scanlines / grain /
  feedback trails. Screen-space and nearly free; carries most of the aesthetic.

## GL plumbing

- Fullscreen "big triangle" (not a quad). FBO ping-pong in `gl/passes.js`.
- Audio-texture upload + uniform mapping live in `gl/uniforms.js` (see
  `rules/audio.md` for the 512×2 layout).
