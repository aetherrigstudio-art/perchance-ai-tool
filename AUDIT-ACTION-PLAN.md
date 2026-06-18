# Audit Action Plan: Prioritized Fixes for Wizard Tool

**Prepared: 2026-06-18** | **Audit Scope:** 10 high-impact issues across workflow, state, prompt, and discoverability.

---

## Executive Summary: The Dependency Chain

The audit identifies a classic **inversion-of-workflow problem**: users cannot validate their work (workflow), so they don't understand what export means (discoverability). Three foundational fixes unlock the rest:

1. **Test-drive harness** (end-to-end validation) — fixes workflow + discoverability simultaneously
2. **State hardening** (localStorage + undo/redo) — fixes data loss risk, enabling more complex workflows
3. **Prompt abstraction + seed safety** — fixes brittle generation that breaks the above workflows

**Estimated total lift:** 6–8 weeks; staged as three 2-week sprints.

---

## Tier 1: Foundation (Weeks 1–2) — Unblocks Everything

### Fix #1: Test-Drive Harness (CRITICAL)
**Impact:** Fixes 3 issues (no end-to-end validation, feature discoverability × 2: images/TTS)  
**Effort:** Hard (structural refactor)  
**Why first:** Users cannot see if export works → can't trust image/TTS generation → won't enable them. Fixes workflow blind spot.

**What to build:**
- Canned **"test preset"** (scenario + 3 characters + persona + lore + style) baked into the HTML. Auto-populates on "load test case".
- Button: "Generate & validate test cast" → runs full pipeline once, generates 1 image per character + exports to JSON.
- Diff panel: shows side-by-side (expected JSON fields vs. generated fields). Flags missing/malformed sections.
- **Result:** users see what "export" means before using their data; understand if images work on their device.

**Implementation path:**
1. Add canned preset as a JS object (charSeed, personaSeed, scenarioSeed, stylePreset).
2. Auto-populate form on first load if `loadTestCase=true` param added to URL.
3. Build "Validation" card with diff checker (table: field → status).
4. Test on real export: JSON → import into ACC → check shape matches char-info.

**Unblocks:**
- Image generation feature (users see it works, feel safe enabling it).
- TTS feature (same pattern: users test voices before committing).
- Section ordering workflow (users can quickly iterate section→section order impact).

**Artifact:** `wizard-html-panel-12.txt` with new validation section + test preset. No data panel change needed.

---

### Fix #2: localStorage Safety + Debounce (HIGH)
**Impact:** Fixes state corruption + I/O waste; enables undo/redo later.  
**Effort:** Medium  
**Why now:** Prevents data loss; required foundation for undo/redo.

**What to do:**
- **Validation on load:** Parse JSON; coerce/discard fields that no longer exist; log warnings.
  ```js
  var snap = JSON.parse(localStorage.getItem(STORE_KEY));
  if (snap) {
    snap.buildMode = snap.buildMode || "cast";
    snap.extras = (snap.extras || []).filter(e => e && typeof e === "object");
    // ... per-field coercion
  }
  ```
- **Debounce saves:** Keystroke events fire `saveState()` with 1-second debounce (not 10+/sec).
  ```js
  function saveState() { clearTimeout(saveTimeout); saveTimeout = setTimeout(doSave, 1000); }
  ```
- **Versioning:** increment STORE_KEY (→ V6); migrate V5 data on first load.

**Code footprint:** ~50 lines in load/save path; existing cleanup already calls `saveState()` on change.

---

## Tier 2: UX & Feature Safety (Weeks 3–4) — Quick Wins + Structural Cleanup

### Fix #3: Prompt Template System (HIGH)
**Impact:** Fixes seed brittle ness + prompt duplication; enables A/B testing.  
**Effort:** Medium  
**Why now:** Seed parser relies on newlines; if a section is ever missing, generation fails silently. Centralizing prompts enables safe refactoring.

**What to build:**
- Extract all ~8 prompt templates to a `PROMPTS` object:
  ```js
  var PROMPTS = {
    charBase: function(role, notes, ctx) { return "..."; },
    charRefine: function(label, raw, adj, ctx) { return "..."; },
    scenario: function(notes, ctx) { return "..."; },
    lore: function(notes, ctx, focus) { return "..."; },
    // ... etc
  };
  ```
- Seed composition: wrap `charSeed()` output into a **tagged payload** (not freeform string):
  ```js
  var seedObj = { tone: roll(SEED.tone), trait: roll(SEED.trait), ... };
  // Embed in prompt as: "Creative direction: " + JSON.stringify(seedObj)
  // On parse, `getSection()` extracts JSON, deserializes safely.
  ```
- Move all prompt building to HTML (already true; just centralize).

**Result:** One-line prompt definition changes; no brittle string escaping; testable seed format.

---

### Fix #4: Inline Re-Roll UI (MEDIUM)
**Impact:** Fixes "all-or-nothing re-rolls" + "no per-field randomize".  
**Effort:** Medium  
**Why now:** Quick UX win; uses test-drive harness to validate.

**What to do:**
- Current: dropdown select from fixed list, re-roll one section.
- Better: add **"roll one random subsection" button** per field (NAME, APPEARANCE, VOICE, etc.).
  ```html
  <div class="roll-controls">
    <button onclick="rerollField('main', 'appearance');">♲ appearance</button>
    <button onclick="rerollField('main', 'voice');">♲ voice</button>
  </div>
  ```
- Seed bookmarking: save current seed to localStorage on successful gen; "reroll with same seed" button.

**Implementation:** ~100 lines in `doReroll()` logic. Reuses existing section extraction.

---

## Tier 3: Feature Discoverability & Workflow (Weeks 5–8) — Structured Issues

### Fix #5: Section Order Redesign (MEDIUM)
**Impact:** Fixes "persona too early" + "opening too late" + workflow mismatch.  
**Effort:** Medium (UI reflow, no logic change).

**Rationale:** Current order (scenario → main → persona → extras → lore → consistency → opening) violates mental model:
- Persona is "who you play" — should come after "who you talk to".
- Opening is a capstone (only meaningful after the full cast exists).

**New order:**
1. Scenario (foundation)
2. Main character (central)
3. Additional characters (extends main)
4. **Persona (player character)** ← moved here
5. Lore (enriches the world)
6. Relationships (connects characters)
7. Consistency check (validates)
8. **Opening scene** ← moved here as capstone
9. Style
10. Immersion pack
11. Presentation
12. Export

**Test:** Use test-drive harness to verify all prompts still reference the right context.

---

### Fix #6: Image Generation Safety Net (MEDIUM)
**Impact:** Fixes "silent failures" + "hardcoded resolution" + "prompt doesn't inherit styleNotes".  
**Effort:** Medium

**What to do:**
1. Display `window.__imgErr` (already captured; never shown) in a banner above images.
   ```js
   if (window.__imgErr) showError("Image generation: " + window.__imgErr);
   ```
2. Style inheritance: pass `styleNotes` into image prompts as suffix:
   ```js
   var finalPrompt = prompt + " (" + val("styleNotes") + ")";
   ```
3. Resolution selector: expose `igShape` (already exists but hidden in standalone tab).
   ```html
   <label>Image size: 
     <select id="sceneImageRes">
       <option value="512x768">Portrait</option>
       <option value="512x512">Square</option>
     </select>
   </label>
   ```

**Result:** Users see why images fail; can adjust resolution; style is consistent.

---

### Fix #7: TTS + Voice Selector UI (MEDIUM)
**Impact:** Fixes "TTS disabled by default" + "no voice selector" + "1–3 voices only".  
**Effort:** Medium

**What to do:**
1. Show available voices at load time (already detected; use `imVoiceList` div):
   ```js
   window.speechSynthesis.getVoices().forEach(v => {
     var btn = document.createElement("button");
     btn.textContent = v.name + " (" + v.lang + ")";
     btn.onclick = () => setCharVoice(currentCharId, v);
     el("imVoiceList").appendChild(btn);
   });
   ```
2. Per-character voice picker (already stored in `immersion.voices[]`; just expose UI).
3. Test button: "Preview voice" + play 3-sec sample.

**Code footprint:** ~80 lines. Existing immersion.voices structure just needs UI.

---

### Fix #8: Color Picker + Defaults (LOW)
**Impact:** Fixes "CLI-level hex input" + "unreadable defaults" + "colors always off".  
**Effort:** Low

**What to do:**
1. Replace hex input with HTML `<input type="color">` in chat colors section.
2. Set palette defaults: pick 4–6 high-contrast colors (not light background-unreadable).
3. Checkbox: "Enable per-character colors" (default true if immersion pack is on).

**Result:** Users can see colors; defaults are readable; adoption increases.

---

### Fix #9: userCharacter Export Field (LOW)
**Impact:** Fixes "persona unlinked in ACC schema" + fragile text-only link.  
**Effort:** Low

**What to do:**
On persona export, set `userCharacter` field (already in ACC schema, never filled):
```js
char.userCharacter = personaId;  // UUID of the persona character
```

**No UI change needed** — just wire it at export time. One line.

---

### Fix #10: Undo/Redo Stack (LOW-MEDIUM)
**Impact:** Fixes "one mistake wipes work".  
**Effort:** Low-Medium (requires localStorage safety first).

**What to do:**
1. On `saveState()`, push snapshot to `undoStack` (max 20 items).
2. Buttons: "Undo" (pop stack, restore) / "Redo" (pop redo stack, restore).
   ```js
   function undo() {
     if (!undoStack.length) return;
     redoStack.push(getCurrentSnapshot());
     restoreSnapshot(undoStack.pop());
   }
   ```
3. Disable buttons if stacks empty.

**Constraint:** Only stacks after state hardenin g (Fix #2). Depends on debounce.

---

## Implementation Sequencing & Interdependencies

```
Week 1–2 (Tier 1):
  └─ Fix #1: Test-drive harness ◄── unlocks image/TTS confidence
  └─ Fix #2: localStorage safety + debounce ◄── required for undo/redo

Week 3–4 (Tier 2):
  ├─ Fix #3: Prompt template system (parallel with #4)
  ├─ Fix #4: Inline re-roll UI (uses test harness to validate)
  └─ Fix #5: Section order redesign (validate with test harness)

Week 5–6 (Tier 3, quick wins):
  ├─ Fix #6: Image error display + style inheritance
  ├─ Fix #7: TTS voice selector UI
  ├─ Fix #8: Color picker
  └─ Fix #9: userCharacter export (one-liner, can go anytime)

Week 7–8 (Polish):
  ├─ Fix #10: Undo/redo (builds on Fix #2)
  └─ Integration testing + edge cases

```

---

## Effort Estimates (per fix)

| Fix | Category | Effort | Impact | Blocker? |
|-----|----------|--------|--------|----------|
| 1   | Workflow | Hard   | Critical | YES (validates all others) |
| 2   | State    | Medium | High     | YES (required for undo)    |
| 3   | Prompt   | Medium | High     | NO (but improves robustness) |
| 4   | UX       | Medium | Medium   | NO (quick win)             |
| 5   | UX       | Medium | Medium   | NO (reorg only)            |
| 6   | Feature  | Medium | Medium   | NO (error visibility)      |
| 7   | Feature  | Medium | Medium   | NO (adoption lever)        |
| 8   | Feature  | Low    | Low      | NO (polish)                |
| 9   | Export   | Low    | Low      | NO (one-liner)             |
| 10  | State    | Low-M  | Medium   | NO (depends on #2)         |

---

## Key Insights & Anti-Patterns Avoided

1. **Why test-drive harness first:** Without it, you can't validate that section reordering doesn't break generation. The three Tier 1 fixes are load-bearing; everything else can be iterated safely once you can test.

2. **Why localStorage safety before undo/redo:** A redo feature on unstable state is worse than useless; it creates the illusion of safety. Fix the foundation first.

3. **Why prompt templating before A/B testing:** Current scattered string concat makes it impossible to compare prompt variants. Centralize first.

4. **Why inline re-roll before seed bookmarking:** The UI (buttons per field) is a quicker win than the data structure. Seed bookmarking (Fix #4b) adds 30% more effort; defer unless users request it.

5. **Why section reorder (not in original audit but now visible):** The audit flagged "persona placed too early" but the fix is structural, not just localized. Test harness makes this safe to iterate.

---

## Success Criteria

**After Tier 1 (2 weeks):**
- Users can load a test cast, generate it, export to JSON, and import into ACC in <5 min.
- Export JSON validated against char-info schema (all 9 tables present, no crashes on import).
- All subsequent feature work can be tested with this harness.

**After Tier 2 (4 weeks):**
- Users can safely iterate character creation without data loss (debounce + validation).
- Per-field re-rolls work; seed output is logged (not parsed as prose).
- Section reordering is verified with test harness; no generation regressions.

**After Tier 3 (8 weeks):**
- All 4 "feature discoverability" issues (colors, TTS, images, dice/roll) have visible UI and sensible defaults.
- Users can roll back mistakes (undo/redo).
- Persona is correctly exported as `userCharacter` ID in ACC schema.

---

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Test preset is too simplistic to catch edge cases | Medium | Add 2-character variant; run test harness on multiple devices. |
| localStorage debounce breaks rapid user workflow | Low | Use 500ms debounce; monitor performance. Fallback: 2s if needed. |
| Prompt templating breaks existing generations | Medium | Version templates; migrate old snapshots on load. Run test harness daily. |
| Section reorder breaks UI layout (mobile) | Low | Test on 3 screen sizes before ship. |
| Image/TTS errors appear during export (not generation) | Medium | Validate at export time; warn user if critical assets missing. |

---

## Next Steps

1. **Freeze section order** in this plan; design test-preset object.
2. **Assign Tier 1 (Fix #1)** to frontend engineer; parallel: design validation schema.
3. **Run test harness weekly** once #1 ships; use it for regression testing all subsequent changes.
4. **Backlog Tiers 2–3** in priority order; each depends on test harness passing.
