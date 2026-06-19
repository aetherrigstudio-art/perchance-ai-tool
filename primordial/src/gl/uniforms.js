// Maps audio features + current look params -> shader uniforms, and builds the
// 512x2 audio texture byte array each frame. Keeps all the "what goes where"
// knowledge in one place so renderer.js stays generic.

// Build the 1024-byte Uint8Array for the 512x2 R8 audio texture.
// row 0 (bytes 0..511)   = FFT magnitudes  (getByteFrequencyData)
// row 1 (bytes 512..1023)= waveform        (getByteTimeDomainData)
export function buildAudioTextureData(fft, wave, out) {
  // out is reused across frames to avoid GC churn.
  if (fft) out.set(fft.subarray(0, 512), 0);
  else out.fill(0, 0, 512);
  if (wave) out.set(wave.subarray(0, 512), 512);
  else out.fill(128, 512, 1024); // 128 = silence midpoint
  return out;
}

// Apply the slime-pass uniforms. `f` = audio features, `p` = resolved params.
export function setSlimeUniforms(gl, U, ctx) {
  const { time, resW, resH, features, params, steps } = ctx;
  gl.uniform2f(U.loc('uResolution'), resW, resH);
  gl.uniform1f(U.loc('uTime'), time);

  gl.uniform1f(U.loc('uBass'), features.bass);
  gl.uniform1f(U.loc('uMid'), features.mid);
  gl.uniform1f(U.loc('uTreble'), features.treble);
  gl.uniform1f(U.loc('uLevel'), features.level);
  gl.uniform1f(U.loc('uBeat'), features.beat);

  gl.uniform3f(U.loc('uColA'), params.colA[0], params.colA[1], params.colA[2]);
  gl.uniform3f(U.loc('uColB'), params.colB[0], params.colB[1], params.colB[2]);
  gl.uniform1f(U.loc('uBlobCount'), params.blobCount);
  gl.uniform1f(U.loc('uSminK'), params.sminK);
  gl.uniform1f(U.loc('uWarpAmt'), params.warpAmt);
  gl.uniform1f(U.loc('uGlow'), params.glow);
  gl.uniform1f(U.loc('uSSS'), params.sss);
  gl.uniform1i(U.loc('uSteps'), steps);
}

// Apply the post-pass uniforms.
export function setPostUniforms(gl, U, ctx) {
  const { time, canvasW, canvasH, features, params } = ctx;
  gl.uniform2f(U.loc('uResolution'), canvasW, canvasH);
  gl.uniform1f(U.loc('uTime'), time);

  gl.uniform1f(U.loc('uGrain'), params.grain);
  gl.uniform1f(U.loc('uScanline'), params.scanline);
  gl.uniform1f(U.loc('uChroma'), params.chroma);
  gl.uniform1f(U.loc('uVignette'), params.vignette);
  gl.uniform1f(U.loc('uBloom'), params.bloom);
  gl.uniform1f(U.loc('uBeat'), features.beat);
}
