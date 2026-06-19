// Shared GLSL helpers: hashing, value noise, fbm, domain warp, smin,
// SDF primitives, tetrahedron normals. 100% original code written from a
// blank file (techniques learned from iquilezles.org / Book of Shaders, but
// the expression here is ours -> commercial-safe). No #version line here;
// this string is concatenated AFTER the "#version 300 es" header of each
// fragment shader that includes it.
export const COMMON_GLSL = /* glsl */ `
// ---------------------------------------------------------------------------
// Hashing & noise
// ---------------------------------------------------------------------------

float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash31(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.x + p.y) * p.z);
}

// Gradient-ish value noise in 3D with smooth interpolation.
float vnoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = hash31(i + vec3(0.0, 0.0, 0.0));
  float n100 = hash31(i + vec3(1.0, 0.0, 0.0));
  float n010 = hash31(i + vec3(0.0, 1.0, 0.0));
  float n110 = hash31(i + vec3(1.0, 1.0, 0.0));
  float n001 = hash31(i + vec3(0.0, 0.0, 1.0));
  float n101 = hash31(i + vec3(1.0, 0.0, 1.0));
  float n011 = hash31(i + vec3(0.0, 1.0, 1.0));
  float n111 = hash31(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);

  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);

  return mix(nxy0, nxy1, u.z) * 2.0 - 1.0; // -> [-1, 1]
}

// Fractal sum. Octaves kept low for the mobile budget (2-3 is plenty).
float fbm(vec3 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    sum += amp * vnoise(p * freq);
    freq *= 2.02;
    amp *= 0.5;
  }
  return sum;
}

// Domain warp: displace the sample point by an fbm field to get the wet,
// churning, organic flow. warpAmt scales how violently the field deforms.
vec3 domainWarp(vec3 p, float t, float warpAmt, int octaves) {
  vec3 q = vec3(
    fbm(p + vec3(0.0, 1.7, 9.2) + t * 0.15, octaves),
    fbm(p + vec3(5.2, 1.3, 2.8) - t * 0.13, octaves),
    fbm(p + vec3(3.1, 8.4, 2.1) + t * 0.11, octaves)
  );
  return p + q * warpAmt;
}

// ---------------------------------------------------------------------------
// SDF combinators
// ---------------------------------------------------------------------------

// Polynomial smooth-min (smooth union). k controls the blend radius -> bigger
// k = gooier metaball welding. Returns blended distance.
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}
`;
