// Orchestrates the two-pass render pipeline (slime -> post) for a frame.
// Kept thin: the heavy lifting lives in renderer.js (GL state) and uniforms.js
// (uniform mapping). This module just sequences a frame given the per-frame
// context, and owns the reusable audio-texture scratch buffer.
//
// The pipeline is half-res friendly: the slime FBO is sized at
// floor(canvas * renderScale), the post pass upscales to the full canvas.

import {
  buildAudioTextureData,
  setSlimeUniforms,
  setPostUniforms,
} from './uniforms.js';

export class Pipeline {
  constructor(renderer) {
    this.renderer = renderer;
    this.audioScratch = new Uint8Array(1024); // 512x2 R8
  }

  // Render one frame.
  // frame = {
  //   time, canvasW, canvasH, renderScale, steps,
  //   features:{bass,mid,treble,level,beat},
  //   slimeParams, postParams,
  //   fft, wave            // Uint8Array(512) each or null
  // }
  render(frame) {
    const r = this.renderer;

    // 1. Build + upload the audio texture.
    buildAudioTextureData(frame.fft, frame.wave, this.audioScratch);
    r.uploadAudioTexture(this.audioScratch);

    // 2. Size the offscreen buffer to the render-scale.
    const rw = Math.max(1, Math.floor(frame.canvasW * frame.renderScale));
    const rh = Math.max(1, Math.floor(frame.canvasH * frame.renderScale));
    r.resizeFbo(rw, rh);

    // 3. Slime pass into the FBO.
    r.renderSlime((gl, U) => {
      setSlimeUniforms(gl, U, {
        time: frame.time,
        resW: rw,
        resH: rh,
        features: frame.features,
        params: frame.slimeParams,
        steps: frame.steps,
      });
    });

    // 4. Post pass to the canvas, upscaling the FBO.
    r.renderPost((gl, U) => {
      setPostUniforms(gl, U, {
        time: frame.time,
        canvasW: frame.canvasW,
        canvasH: frame.canvasH,
        features: frame.features,
        params: frame.postParams,
      });
    }, frame.canvasW, frame.canvasH);
  }
}
