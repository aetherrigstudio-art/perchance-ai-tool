// WebGL2 renderer: context creation, shader/program compilation, fullscreen
// triangle draw, and the offscreen FBO used for the heavy SDF pass (rendered
// at a render-scale, then upscaled by the post pass to the canvas).
//
// No dependencies. Raw WebGL2 only.

import { FULLSCREEN_VERT } from '../shaders/fullscreen.vert.js';
import { SLIME_FRAG } from '../shaders/slime.frag.js';
import { POST_FRAG } from '../shaders/post.frag.js';

function compileShader(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('Shader compile error:\n' + log + '\n--- source ---\n' + src);
  }
  return sh;
}

function linkProgram(gl, vertSrc, fragSrc) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(prog);
    throw new Error('Program link error:\n' + log);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return prog;
}

// Cache uniform locations lazily by name.
function makeUniformSetter(gl, prog) {
  const cache = new Map();
  function loc(name) {
    if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
    return cache.get(name);
  }
  return { loc };
}

export class Renderer {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 not supported on this device/browser.');

    this.canvas = canvas;
    this.gl = gl;

    // Float render target for the HDR slime buffer if available.
    this.colorBufferFloat = !!gl.getExtension('EXT_color_buffer_float');
    this.colorBufferHalfFloat = !!gl.getExtension('EXT_color_buffer_half_float');

    // Empty VAO so a bound VAO exists for the attribute-less draw.
    this.vao = gl.createVertexArray();

    this.slimeProg = linkProgram(gl, FULLSCREEN_VERT, SLIME_FRAG);
    this.postProg = linkProgram(gl, FULLSCREEN_VERT, POST_FRAG);
    this.slimeU = makeUniformSetter(gl, this.slimeProg);
    this.postU = makeUniformSetter(gl, this.postProg);

    // Offscreen FBO for the slime pass.
    this.fbo = gl.createFramebuffer();
    this.fboTex = gl.createTexture();
    this.fboW = 0;
    this.fboH = 0;

    // Audio texture (512x2). Lazily uploaded each frame by uniforms.js.
    this.audioTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.audioTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // Allocate 512x2 R8.
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 512, 2, 0, gl.RED, gl.UNSIGNED_BYTE, null);
  }

  // (Re)allocate the offscreen FBO color texture at the given pixel size.
  resizeFbo(w, h) {
    const gl = this.gl;
    w = Math.max(1, Math.floor(w));
    h = Math.max(1, Math.floor(h));
    if (w === this.fboW && h === this.fboH) return;
    this.fboW = w;
    this.fboH = h;

    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Prefer a half-float HDR target; fall back to RGBA8 if unsupported.
    let internal = gl.RGBA8;
    let type = gl.UNSIGNED_BYTE;
    if (this.colorBufferHalfFloat || this.colorBufferFloat) {
      internal = gl.RGBA16F;
      type = gl.HALF_FLOAT;
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, gl.RGBA, type, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // Upload the 512x2 audio data (Uint8Array length 1024: row0=fft, row1=wave).
  uploadAudioTexture(data) {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.audioTex);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 512, 2, gl.RED, gl.UNSIGNED_BYTE, data);
  }

  // Render the slime pass into the offscreen FBO.
  // setUniforms(gl, U) receives the cached-uniform setter for the slime program.
  renderSlime(setUniforms) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.viewport(0, 0, this.fboW, this.fboH);
    gl.useProgram(this.slimeProg);
    gl.bindVertexArray(this.vao);

    // Bind audio texture to unit 0 for the slime program.
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.audioTex);
    gl.uniform1i(this.slimeU.loc('uAudioTex'), 0);

    setUniforms(gl, this.slimeU);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // Render the post pass to the canvas, sampling the slime FBO texture.
  renderPost(setUniforms, cw, ch) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, cw, ch);
    gl.useProgram(this.postProg);
    gl.bindVertexArray(this.vao);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.uniform1i(this.postU.loc('uScene'), 0);

    setUniforms(gl, this.postU);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
