// Dependency-free tempo + beat utilities:
//  1. Energy-based beat detector: compare instantaneous bass energy against a
//     rolling average; a strong spike past a variance-scaled threshold => beat.
//  2. Tap-tempo: tap a key/button; average the recent intervals => BPM.
//  3. Manual BPM override.
//
// The detector emits a decaying `pulse` (1 -> 0) used as the `uBeat` uniform so
// the visuals kick on hits. `beatNow` is a one-frame boolean on the detection.
//
// NOTE: for production-grade live BPM, realtime-bpm-analyzer (Apache-2.0) is
// the recommended later upgrade; this energy approach is intentionally simple
// and zero-dependency for the first build.

export class BeatTempo {
  constructor() {
    // Rolling history of bass energy (about 1s at 60fps).
    this._hist = new Float32Array(60);
    this._histLen = this._hist.length;
    this._histIdx = 0;
    this._histCount = 0;

    this.pulse = 0;          // decaying beat envelope (0..1) -> uBeat
    this.beatNow = false;    // true the frame a beat is detected
    this._cooldown = 0;      // frames to wait before next beat (debounce)

    // Tap-tempo state.
    this._taps = [];         // recent tap timestamps (ms)
    this.tapBpm = null;      // BPM from taps
    this.manualBpm = null;   // explicit override

    // Auto-BPM estimate from detected beat intervals.
    this._lastBeatMs = 0;
    this._beatIntervals = [];
    this.autoBpm = null;
  }

  _pushHist(v) {
    this._hist[this._histIdx] = v;
    this._histIdx = (this._histIdx + 1) % this._histLen;
    if (this._histCount < this._histLen) this._histCount++;
  }

  _mean() {
    let s = 0;
    const n = this._histCount || 1;
    for (let i = 0; i < n; i++) s += this._hist[i];
    return s / n;
  }

  _variance(mean) {
    let s = 0;
    const n = this._histCount || 1;
    for (let i = 0; i < n; i++) {
      const d = this._hist[i] - mean;
      s += d * d;
    }
    return s / n;
  }

  // Call once per frame with the unsmoothed bass energy (0..1) and dt seconds.
  update(bassEnergy, dt) {
    this.beatNow = false;

    const mean = this._mean();
    const variance = this._variance(mean);
    // Sensitivity curve: high variance => require a bigger spike. Constants
    // tuned empirically; the +0.02 keeps it from firing on near-silence.
    const threshold = mean * (1.4 + 12.0 * variance) + 0.02;

    if (this._cooldown > 0) this._cooldown--;

    if (this._histCount > 10 && bassEnergy > threshold && this._cooldown === 0) {
      this.beatNow = true;
      this.pulse = 1.0;
      this._cooldown = 6; // ~100ms @60fps debounce -> max ~600 BPM cap
      this._registerBeatInterval();
    }

    this._pushHist(bassEnergy);

    // Decay the pulse envelope.
    const decay = Math.exp(-dt * 6.0);
    this.pulse *= decay;
    if (this.pulse < 0.0001) this.pulse = 0;
  }

  _registerBeatInterval() {
    const now = performance.now();
    if (this._lastBeatMs > 0) {
      const iv = now - this._lastBeatMs;
      if (iv > 250 && iv < 2000) { // 30..240 BPM plausible band
        this._beatIntervals.push(iv);
        if (this._beatIntervals.length > 8) this._beatIntervals.shift();
        const avg = this._beatIntervals.reduce((a, b) => a + b, 0) /
          this._beatIntervals.length;
        this.autoBpm = Math.round(60000 / avg);
      }
    }
    this._lastBeatMs = now;
  }

  // --- Tap tempo ---------------------------------------------------------
  tap() {
    const now = performance.now();
    // Reset the run if the gap is too long (new tempo).
    if (this._taps.length && now - this._taps[this._taps.length - 1] > 2000) {
      this._taps = [];
    }
    this._taps.push(now);
    if (this._taps.length > 6) this._taps.shift();
    if (this._taps.length >= 2) {
      let sum = 0;
      for (let i = 1; i < this._taps.length; i++) {
        sum += this._taps[i] - this._taps[i - 1];
      }
      const avg = sum / (this._taps.length - 1);
      this.tapBpm = Math.round(60000 / avg);
    }
    return this.tapBpm;
  }

  setManualBpm(bpm) {
    this.manualBpm = bpm ? Math.round(bpm) : null;
  }

  // Resolved BPM: manual override wins, then tap, then auto-detect.
  get bpm() {
    return this.manualBpm || this.tapBpm || this.autoBpm || null;
  }
}
