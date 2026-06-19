// Post pass: tonemap the HDR slime buffer + screen-space grunge.
// - tanh tonemap (keeps neon highlights from clipping ugly)
// - cheap bloom-ish glow via a few-tap blur of the bright parts
// - chromatic aberration (subtle RGB split toward edges)
// - scanlines + film grain + vignette
// 100% original. WebGL2 / GLSL ES 3.00.
import { COMMON_GLSL } from './common.glsl.js';

export const POST_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D uScene;     // the slime HDR buffer
uniform vec2  uResolution;    // canvas (output) resolution
uniform float uTime;

uniform float uGrain;         // grain intensity
uniform float uScanline;      // scanline intensity
uniform float uChroma;        // chromatic aberration amount
uniform float uVignette;      // vignette strength
uniform float uBloom;         // bloom gain
uniform float uBeat;          // beat pulse (brightens bloom on hits)

${COMMON_GLSL}

vec3 tonemap(vec3 c) {
  // tanh tonemap: smooth roll-off, preserves saturated neon.
  return tanh(c);
}

// Cheap bright-pass blur: sample a small ring and keep the bright energy.
vec3 bloomSample(vec2 uv, vec2 px) {
  vec3 sum = vec3(0.0);
  float wsum = 0.0;
  for (int i = 0; i < 8; i++) {
    float a = float(i) / 8.0 * 6.2831853;
    for (int r = 1; r <= 2; r++) {
      vec2 off = vec2(cos(a), sin(a)) * px * float(r) * 3.0;
      vec3 s = texture(uScene, uv + off).rgb;
      // Keep only the bright part.
      vec3 b = max(s - 0.6, 0.0);
      float w = 1.0 / float(r);
      sum += b * w;
      wsum += w;
    }
  }
  return sum / max(wsum, 0.0001);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 px = 1.0 / uResolution.xy;

  // Chromatic aberration: shift channels radially from center.
  vec2 dir = uv - 0.5;
  float ca = uChroma * (0.4 + dot(dir, dir) * 2.0);
  vec3 scene;
  scene.r = texture(uScene, uv + dir * ca).r;
  scene.g = texture(uScene, uv).g;
  scene.b = texture(uScene, uv - dir * ca).b;

  // Bloom.
  vec3 bloom = bloomSample(uv, px) * uBloom * (1.0 + 0.6 * uBeat);

  vec3 col = scene + bloom;
  col = tonemap(col);

  // Scanlines (horizontal, animated drift).
  float scan = 0.5 + 0.5 * sin((gl_FragCoord.y + uTime * 30.0) * 3.14159);
  col *= 1.0 - uScanline * (1.0 - scan);

  // Film grain (animated hash).
  float g = hash11(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime * 60.0);
  col += (g - 0.5) * uGrain;

  // Vignette.
  float vig = smoothstep(1.2, 0.3, length(dir) * 2.0);
  col *= mix(1.0, vig, uVignette);

  // Final clamp + slight gamma for the monitor.
  col = max(col, 0.0);
  col = pow(col, vec3(0.9));

  fragColor = vec4(col, 1.0);
}
`;
