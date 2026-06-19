---
name: perf-budget
description: Run the in-app FPS stress-test readout for primordial and read its SMOOTH / OK / TOO-MUCH verdict to set the mobile performance budget (FBO render-scale, raymarch step cap, dynamic resolution). Use when tuning performance, checking mobile frame rate, deciding render-scale or step count, or diagnosing jank/dropped frames.
---

# perf-budget — read the FPS verdict, set the budget

The repo ships a **stress-test rig** (the first runnable `src/` page, from
Phase 2) that drives a representative GL load and reports a frame-time verdict.
Use it to pick the mobile budget — on the **actual target phone**, not a
desktop.

## Run it

1. Serve locally over a secure context:
   `python3 -m http.server 8000` → open the stress-test page.
2. For a real reading, open it on the **target phone** over the deployed HTTPS
   URL (desktop GPUs lie about mobile performance).
3. Let it settle for a few seconds; read the FPS readout and verdict.

## Read the verdict

The rig prints one of three verdicts from sustained frame time:

- **SMOOTH** — comfortably at target (≈ 60 fps, frame time well under budget).
  You have headroom: you may raise render-scale or step count.
- **OK** — holding target but with little margin. Leave the budget as is; don't
  add cost.
- **TOO-MUCH** — dropping frames / over the frame-time budget. **Cut cost now.**

## Set the budget from the verdict

Adjust in this cost order (biggest lever first — see `.claude/rules/shaders.md`):

1. **Raymarch step count** (dominates). Cap **≤ 64**; drop toward 32–48 on
   TOO-MUCH.
2. **FBO render-scale** — keep the heavy SDF pass at **0.5–0.75** and upscale.
   Lower scale before lowering visual ambition.
3. **FBM octaves** — keep sparse (≤ 2–3); trim on TOO-MUCH.
4. **Glow loop / SSS rays** — reduce iterations last.

Then enable **dynamic resolution** so the app auto-drops scale/steps when frame
time climbs at runtime and recovers when it settles — the budget you set here is
the *ceiling*, not a fixed value.

## Output

Record the chosen budget (step cap + render-scale + FBM octaves) and the device
it was measured on. That tuple is the baseline every new look must stay under.
