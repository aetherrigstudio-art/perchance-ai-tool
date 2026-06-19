---
paths: ["src/audio/**"]
---

# Audio rules

Scoped to the audio capture + analysis code.

## AnalyserNode is the visual feed

Use a main-thread **`AnalyserNode`** for everything the visuals consume — band
energies and the audio texture. It is cheap and jank-free. **Do not** reach for
an `AudioWorklet` just to read an FFT; reserve AudioWorklet for custom
per-sample DSP only.

Produce smoothed scalar features for cheap reactivity:
`{ bass, mid, treble, level, flux }`. Expose them as plain uniforms in addition
to the audio texture.

## 512×2 audio texture (the portability convention)

Build a **512×2, R8** texture each frame so audio shaders prototyped against
Shadertoy's `iChannel` layout port with zero rewiring:

- **Row 0** = `analyser.getByteFrequencyData()` with **`fftSize: 1024`**
  → **512 frequency bins**.
- **Row 1** = `analyser.getByteTimeDomainData()` → waveform.
- Keep `smoothingTimeConstant` at **0.8** to match Shadertoy's behavior.
- Upload as `R8` / `UNSIGNED_BYTE`; `NEAREST` filtering; no mipmaps.

The upload + uniform binding lives in `src/gl/uniforms.js`.

## Mic capture (getUserMedia)

- **Secure context required.** Mic only works on HTTPS or `localhost`.
- Request **raw audio** — turn off processing that would fight a line-in feed:

  ```js
  navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    },
  });
  ```

- **Resume the `AudioContext` on a user tap** (behind the Start button). iOS /
  Safari start the context `suspended`; without a gesture there is no audio.

## Device picker

- Enumerate inputs with `navigator.mediaDevices.enumerateDevices()`.
- **Device labels populate only after the first permission grant** — request
  mic once, then re-enumerate to show real names.
- Let the artist pick the input (mic vs. line-in/interface) and rebuild the
  graph on change. Listen for `devicechange` to refresh the list.

## BPM / tempo

- Auto-BPM is an **assist with a confidence gate**, not ground truth.
- Use **realtime-bpm-analyzer** (Apache-2.0, live-mic) for BPM estimation;
  **tap-tempo + manual time-signature** is the reliable fallback (live
  time-signature detection is unsolved).
