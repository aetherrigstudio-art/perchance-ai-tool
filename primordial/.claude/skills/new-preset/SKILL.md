---
name: new-preset
description: Scaffold a new visual "look" for primordial — a JSON preset in src/looks/ plus a matching GLSL shader stub in src/shaders/, wired into the look registry. Use when asked to add, create, scaffold, or start a new look / preset / visual / shader variation.
---

# new-preset — scaffold a visual "look"

A "look" is **data**: a JSON preset (which shader + default params) plus a GLSL
shader file. This skill creates both, wires them into the registry, and leaves
a commercial-safe, ready-to-edit stub.

## Inputs to gather

1. **Slug** — kebab-case id, e.g. `wet-chrome`, `acid-fog`. Used for filenames
   and the registry key.
2. **Display name** — human label shown in the UI (e.g. "Wet Chrome").
3. (optional) **Base technique** — which look-language elements to seed the
   shader stub with (smin metaballs / domain-warp / fresnel+SSS / glow / grunge
   post). Default: smin metaballs + fresnel rim.

## Steps

1. **Create the shader stub** at `src/shaders/<slug>.frag`:
   - `#version 300 es` on **byte one**.
   - `precision highp float;` and an `out vec4 fragColor;`.
   - Declare the standard uniforms: `uResolution`, `uTime`, `uAudioTex`, plus
     the band scalars (`uBass`, `uMid`, `uTreble`, `uLevel`, `uFlux`).
   - A `main()` that raymarches a placeholder SDF and writes `fragColor`.
   - Keep the raymarch **step cap ≤ 64** and leave a `// TODO: look` marker.
   - Header comment: `// Authored from scratch for primordial (MIT). Do NOT
     paste CC BY-NC-SA shader code here — see .claude/rules/shaders.md`.

2. **Create the preset** at `src/looks/<slug>.json`:

   ```json
   {
     "id": "<slug>",
     "name": "<Display Name>",
     "shader": "shaders/<slug>.frag",
     "params": {
       "speed": 1.0,
       "warp": 0.3,
       "glow": 0.5,
       "grunge": 0.4,
       "audioReactivity": 1.0
     }
   }
   ```

3. **Register it** in `src/looks/registry.js` — import/list the new preset so
   the UI look-switcher picks it up. Keep entries alphabetical by slug.

4. **Remind the author** of the rules that apply (don't enforce — the hook/rules
   do that):
   - Write the shader from a blank file; never copy NC/SA-licensed code.
   - Respect the mobile budget (render-scale FBO, step cap ≤ 64, sparse FBM).
   - Params here are just defaults; the live values come from the param store.

## Output

Report the three touched paths (`src/shaders/<slug>.frag`,
`src/looks/<slug>.json`, `src/looks/registry.js`) and the one-line edit needed
to verify it loads (switch to the new look in the UI). Do not run a build —
there is none.
