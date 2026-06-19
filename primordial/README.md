# primordial

An **audio-reactive WebGL2 visual instrument** for live electronic-music gigs.

A musician opens a single HTTPS link, grants mic/line-in access, and the page
turns room audio (mic or line-in → FFT) into generative
"grungy-future-geometric-slimy" visuals in real time. The artist operates the
instrument — driving the knobs, switching looks, and tuning reactivity — while
the musician plays.

It is **static-first and no-build**: plain HTML + vanilla ES modules + raw
WebGL2 + the Web Audio `AnalyserNode`. Nothing to compile, no server, no
runtime dependencies to install. The whole app is a folder of files you upload
to a host. Built to live on **Namecheap Stellar Plus** (cPanel / LiteSpeed),
served over HTTPS so `getUserMedia` (the mic) is allowed.

## What it is

- **Static client-side app.** WebGL2 fullscreen-triangle renderer with FBO
  ping-pong post-processing; audio analysis on the main thread via
  `AnalyserNode`. No framework, no bundler required.
- **Audio → GL → UI.** Mic input → band energies + a 512×2 audio texture →
  shader uniforms → screen. A control UI lets the artist perform.
- **Looks as data.** Each visual "look" is a JSON preset (shader + default
  params); switching looks is data, not code.
- **Commercial-safe shaders.** We **write our own** GLSL from technique
  references — never copy CC BY-NC-SA Shadertoy code (this is paid work).

## Quickstart (local)

The mic requires a secure context, so serve over `localhost` (treated as
secure) or HTTPS — opening `index.html` via `file://` will not grant mic.

```bash
# from the repo root
python3 -m http.server 8000
# then open http://localhost:8000/  (localhost is a secure context → mic works)
```

Click **Start** (a user gesture is required to resume the `AudioContext` on
iOS/Safari), pick an input device, and grant mic permission.

## Deploy (Namecheap Stellar Plus / cPanel)

Static upload, no build:

1. Upload `index.html`, `src/`, and `assets/` into **`public_html`** (cPanel
   File Manager, or cPanel **Git Version Control**).
2. Place `deploy/.htaccess` at the `public_html` root (force-HTTPS, caching,
   correct MIME for `.glsl`/`.wasm`).
3. Confirm HTTPS is live (free 1-yr Sectigo PositiveSSL ships day one). It is
   **not** auto-renewing — re-issue annually, or set up `acme.sh` over SSH.
4. Open the HTTPS URL on a phone, grant mic, confirm the visual reacts.

Full step-by-step: [`deploy/DEPLOY.md`](deploy/DEPLOY.md).

## Docs & planning

- [`ROADMAP.md`](ROADMAP.md) — the 7 phased milestones.
- [`TODO.md`](TODO.md) — near-term checkbox tasks for the current phase.
- [`docs/BUILD-SPEC.md`](docs/BUILD-SPEC.md) — the full build specification.
- [`CLAUDE.md`](CLAUDE.md) — agent/contributor working notes.

## License

MIT — see [`LICENSE`](LICENSE).
