// Look registry. Looks are DATA: each is a parameter set (palette, blob count,
// smin k, warp, glow, post intensities) matching params/schema.js.
//
// The canonical source for each look is its .json file under src/looks/. To
// stay robust on file:// (where fetch() is blocked in most browsers) the look
// data is also embedded inline here, mirroring the JSON byte-for-byte. The
// `loadLooks()` helper prefers fetch() (so editing the JSON is live on a real
// server) and transparently falls back to the inline copies offline.

// --- Inline mirror of the JSON look files (file:// fallback) ----------------
const INLINE_LOOKS = [
  {
    id: 'slime-green',
    name: 'Slime Green',
    description: 'Wet metaball goo, neon green-on-black, heavy churn and glow.',
    params: {
      colA: [0.04, 0.85, 0.32],
      colB: [0.25, 1.0, 0.5],
      blobCount: 5,
      sminK: 0.6,
      warpAmt: 0.6,
      glow: 1.2,
      sss: 1.8,
      bloom: 1.1,
      grain: 0.12,
      scanline: 0.18,
      chroma: 0.006,
      vignette: 0.72,
    },
  },
  {
    id: 'hud-amber',
    name: 'HUD Amber',
    description: 'Tighter, drier blobs in an amber technical-HUD palette, crisp scanlines.',
    params: {
      colA: [0.9, 0.55, 0.08],
      colB: [1.0, 0.78, 0.25],
      blobCount: 4,
      sminK: 0.4,
      warpAmt: 0.35,
      glow: 0.8,
      sss: 1.0,
      bloom: 0.8,
      grain: 0.08,
      scanline: 0.3,
      chroma: 0.004,
      vignette: 0.6,
    },
  },
];

// Filenames to attempt fetching, in registry order. Resolved relative to THIS
// module (src/looks/), not the document, so it works regardless of page path.
const LOOK_FILES = ['slime-green.json', 'hud-amber.json'].map(
  (f) => new URL('./' + f, import.meta.url),
);

// Load all looks. Tries fetch() first; on any failure returns the inline set.
export async function loadLooks() {
  // file:// has protocol 'file:' -> skip fetch entirely (it always fails CORS).
  const onFile = typeof location !== 'undefined' && location.protocol === 'file:';
  if (onFile) return INLINE_LOOKS.slice();

  try {
    const out = [];
    for (const f of LOOK_FILES) {
      const res = await fetch(f);
      if (!res.ok) throw new Error('fetch ' + f + ' -> ' + res.status);
      out.push(await res.json());
    }
    return out.length ? out : INLINE_LOOKS.slice();
  } catch (_) {
    return INLINE_LOOKS.slice();
  }
}

export function findLook(looks, id) {
  return looks.find((l) => l.id === id) || null;
}
