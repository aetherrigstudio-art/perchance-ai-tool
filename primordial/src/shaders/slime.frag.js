// Slime raymarch pass. Renders animated metaball blobs welded with smin,
// domain-warped for wet churn, shaded with fresnel rim + fake SSS, and
// accumulates a volumetric neon glow along the ray. Audio-reactive via band
// scalar uniforms and the Shadertoy-style 512x2 audio texture.
//
// 100% original. Output is linear-ish HDR color in vec4; the post pass does
// tonemapping + grunge. WebGL2 / GLSL ES 3.00.
import { COMMON_GLSL } from './common.glsl.js';

export const SLIME_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;
uniform sampler2D uAudioTex;   // 512x2: row0 = FFT, row1 = waveform

// Audio band scalars (smoothed, 0..1-ish)
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uLevel;
uniform float uBeat;           // 0..1 decaying pulse on each detected beat

// Look parameters (driven from JSON looks + sliders)
uniform vec3  uColA;           // core color
uniform vec3  uColB;           // rim / accent color
uniform float uBlobCount;      // 3..7 active blobs
uniform float uSminK;          // metaball weld radius
uniform float uWarpAmt;        // domain-warp strength
uniform float uGlow;           // volumetric glow gain
uniform float uSSS;            // subsurface scattering gain
uniform int   uSteps;          // raymarch step budget (dynamic-res controlled)

${COMMON_GLSL}

// Sample the FFT row of the audio texture. x in 0..1 over 512 bins.
float fftAt(float x) {
  return texture(uAudioTex, vec2(clamp(x, 0.0, 1.0), 0.25)).r;
}

// The scene SDF: a cluster of orbiting blobs welded together, with the whole
// sample point domain-warped for the churn. Returns signed distance.
float mapScene(vec3 p) {
  // Warp the space. Audio (bass) pumps the warp; beat adds a kick.
  float warp = uWarpAmt * (0.6 + 0.8 * uBass + 0.5 * uBeat);
  vec3 wp = domainWarp(p * 0.9, uTime, warp, 2);

  float t = uTime;
  int n = int(clamp(uBlobCount, 1.0, 7.0));

  // Seed the first blob, then smin-weld the rest in.
  float d = 1e9;
  for (int i = 0; i < 7; i++) {
    if (i >= n) break;
    float fi = float(i);
    float phase = fi * 2.39996; // golden-angle spread
    // Each blob orbits on its own little path; audio nudges the radius/orbit.
    float orbit = 0.85 + 0.25 * sin(t * 0.5 + phase);
    vec3 c = vec3(
      cos(t * 0.31 + phase) * orbit,
      sin(t * 0.27 + phase * 1.3) * orbit * 0.8,
      sin(t * 0.23 + phase * 0.7) * orbit
    );
    // Per-blob audio: map a chunk of the spectrum onto its radius.
    float aud = fftAt(0.05 + fi * 0.12);
    float r = 0.42 + 0.10 * aud + 0.06 * sin(t + phase) + 0.10 * uLevel;
    float ds = sdSphere(wp - c, r);
    d = (i == 0) ? ds : smin(d, ds, uSminK);
  }

  // A gentle wobble on the merged surface for extra slime detail.
  d += 0.04 * fbm(wp * 2.5 + t * 0.2, 2);
  return d;
}

// 4-tap tetrahedron normal (cheaper than the 6-tap central difference).
vec3 calcNormal(vec3 p) {
  const vec2 e = vec2(1.0, -1.0) * 0.0012;
  return normalize(
    e.xyy * mapScene(p + e.xyy) +
    e.yyx * mapScene(p + e.yyx) +
    e.yxy * mapScene(p + e.yxy) +
    e.xxx * mapScene(p + e.xxx)
  );
}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;

  // Camera: slowly drifting, pulled back enough to frame the cluster.
  float ct = uTime * 0.08;
  vec3 ro = vec3(sin(ct) * 0.4, 0.15, -3.0);
  vec3 ta = vec3(0.0, 0.0, 0.0);
  vec3 fwd = normalize(ta - ro);
  vec3 rgt = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up  = cross(fwd, rgt);
  vec3 rd  = normalize(uv.x * rgt + uv.y * up + 1.5 * fwd);

  // Raymarch. Step factor < 1 because the domain warp breaks the strict
  // distance bound -> overshooting would punch through the surface.
  float t = 0.0;
  float glow = 0.0;
  bool hit = false;
  vec3 pos = ro;
  int steps = uSteps;

  for (int i = 0; i < 96; i++) {
    if (i >= steps) break;
    pos = ro + rd * t;
    float d = mapScene(pos);

    // Volumetric neon glow: accumulate inverse distance to the surface.
    glow += 1.0 / (1.0 + d * d * 28.0);

    if (d < 0.0015) { hit = true; break; }
    t += d * 0.6;
    if (t > 9.0) break;
  }

  vec3 col = vec3(0.0);

  if (hit) {
    vec3 nor = calcNormal(pos);
    vec3 viewDir = -rd;

    // Key light orbiting with the music.
    vec3 lpos = vec3(2.0 * cos(uTime * 0.3), 1.6, -1.5);
    vec3 ldir = normalize(lpos - pos);
    float diff = clamp(dot(nor, ldir), 0.0, 1.0);

    // Fresnel rim -> wet edge highlight.
    float fres = pow(1.0 - clamp(dot(nor, viewDir), 0.0, 1.0), 3.0);

    // Fake subsurface scattering: march a couple short steps INTO the surface
    // and read how much "material" is between this point and the light. Thin
    // areas glow translucently.
    float thickness = 0.0;
    for (int s = 1; s <= 4; s++) {
      float sd = mapScene(pos - nor * (0.04 * float(s)));
      thickness += clamp(-sd, 0.0, 0.12);
    }
    float sss = uSSS * thickness * (0.5 + 0.5 * diff);

    // Specular for the wet sheen.
    vec3 h = normalize(ldir + viewDir);
    float spec = pow(clamp(dot(nor, h), 0.0, 1.0), 48.0);

    vec3 base = mix(uColA, uColB, fres);
    col  = base * (0.18 + 0.9 * diff);
    col += uColB * fres * (0.8 + 0.6 * uTreble);
    col += uColB * sss;
    col += vec3(1.0) * spec * (0.6 + 0.8 * uBeat);

    // Treble shimmer riding the surface.
    col += uColB * 0.15 * uTreble * (0.5 + 0.5 * sin(pos.y * 30.0 + uTime * 5.0));
  }

  // Add the accumulated volumetric glow regardless of hit, tinted neon.
  col += uColB * glow * uGlow * (0.02 + 0.05 * uMid);

  // Soft background gradient so the void isn't pure black.
  float bgv = 0.02 + 0.03 * (1.0 - length(uv) * 0.5);
  col += uColA * bgv * 0.25;

  fragColor = vec4(max(col, 0.0), 1.0);
}
`;
