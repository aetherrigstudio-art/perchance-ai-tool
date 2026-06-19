// Parameter schema for a "look": defines every tunable, its type, range, and
// default. store.js validates/coerces against this on load (multiple tools may
// share localStorage at the same origin, so never trust persisted data).

// Each entry: { key, label, type, min, max, step, default }
// type 'range' = single float slider; type 'color' = [r,g,b] 0..1.
export const PARAM_SCHEMA = [
  // Palette
  { key: 'colA', label: 'Core Color', type: 'color', default: [0.05, 0.9, 0.35] },
  { key: 'colB', label: 'Rim / Glow', type: 'color', default: [0.2, 1.0, 0.5] },

  // SDF / slime
  { key: 'blobCount', label: 'Blob Count', type: 'range', min: 1, max: 7, step: 1, default: 5 },
  { key: 'sminK', label: 'Weld (smin k)', type: 'range', min: 0.05, max: 1.2, step: 0.01, default: 0.55 },
  { key: 'warpAmt', label: 'Wet Churn', type: 'range', min: 0.0, max: 1.5, step: 0.01, default: 0.5 },
  { key: 'glow', label: 'Volumetric Glow', type: 'range', min: 0.0, max: 3.0, step: 0.01, default: 1.0 },
  { key: 'sss', label: 'Subsurface', type: 'range', min: 0.0, max: 4.0, step: 0.01, default: 1.5 },

  // Post / grunge
  { key: 'bloom', label: 'Bloom', type: 'range', min: 0.0, max: 3.0, step: 0.01, default: 1.0 },
  { key: 'grain', label: 'Grain', type: 'range', min: 0.0, max: 0.5, step: 0.01, default: 0.12 },
  { key: 'scanline', label: 'Scanlines', type: 'range', min: 0.0, max: 0.8, step: 0.01, default: 0.18 },
  { key: 'chroma', label: 'Chromatic Ab.', type: 'range', min: 0.0, max: 0.03, step: 0.001, default: 0.006 },
  { key: 'vignette', label: 'Vignette', type: 'range', min: 0.0, max: 1.0, step: 0.01, default: 0.7 },
];

// Performance knobs (not part of a look; persisted separately).
export const PERF_SCHEMA = [
  { key: 'renderScale', label: 'Render Scale', type: 'range', min: 0.3, max: 1.0, step: 0.05, default: 0.7 },
  { key: 'steps', label: 'Ray Steps', type: 'range', min: 24, max: 96, step: 4, default: 64 },
];

export const DEFAULTS = (() => {
  const o = {};
  for (const p of PARAM_SCHEMA) o[p.key] = clone(p.default);
  return o;
})();

export const PERF_DEFAULTS = (() => {
  const o = {};
  for (const p of PERF_SCHEMA) o[p.key] = p.default;
  return o;
})();

function clone(v) {
  return Array.isArray(v) ? v.slice() : v;
}

// Coerce one value against its schema entry. Returns a safe value.
export function coerceValue(entry, value) {
  if (entry.type === 'color') {
    if (!Array.isArray(value) || value.length !== 3) return clone(entry.default);
    return value.map((c) => {
      const n = Number(c);
      return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
    });
  }
  // range
  let n = Number(value);
  if (!Number.isFinite(n)) n = entry.default;
  n = Math.min(entry.max, Math.max(entry.min, n));
  return n;
}

// Validate/coerce a whole params object against a schema, filling missing keys.
export function coerceParams(schema, obj) {
  const out = {};
  const src = obj && typeof obj === 'object' ? obj : {};
  for (const entry of schema) {
    out[entry.key] = coerceValue(entry, src[entry.key]);
  }
  return out;
}
