# Correctness + Export-Safety Audit — char-wiz-html
**Date:** 2026-06-18  
**Auditor:** Claude Sonnet 4.6 (automated, read-only)  
**Target:** `/home/user/perchance-ai-tool/char-wiz-html` (2541 lines, canonical wizard HTML panel)  
**Reference:** `char-info` §§3–11, CLAUDE.md invariants

---

## Executive Summary

**All automated verifiers pass. No import-breaking blockers found.** The Dexie envelope is correct, all 9 tables are present with the right schemas, identity generation is collision-safe, required constants are pinned, persona handling is correct, and the streaming/parse pipeline is sound.

Three issues warrant attention before the next release:

1. **HIGH — `window.generate()` missing try-finally**: an unhandled promise rejection (network drop mid-stream) leaves the UI permanently stuck — spinner stays, stop button stays visible, user cannot generate again without a page reload.
2. **HIGH — Duplicate `<select id="buildMode">` elements** (×3, lines 17/25/33): `getElementById()` always returns the first; the other two are dead markup. This does not break export but means the Build Mode selector UI is redundant dead weight, and if the JavaScript ever targets index 1 or 2 it will silently fail.
3. **MEDIUM — `resetAll()` leaves orphaned localStorage keys**: `accSchemaV1` (learned schema) and `accWB_*` (word-bank cache) survive a "start over", so post-reset exports may use a stale learned schema that was imported from a different ACC version.

No issues were found in the confirmed-schema invariants (Dexie 9-table envelope, identity uniqueness, constant pinning, persona flags, section parsing).

---

## Verifier Results

### `node test/smoke.mjs`
**Result: PASS — all checks passed (0 failures)**

All 46 assertions pass, including:
- Valid Dexie envelope (`dexie` / `chatbot-ui-v1`)
- All 9 tables present in `data[]`
- Only `characters` table populated
- Main + persona rows correct
- High-entropy uuid + numeric id
- `isPersona: true`, no greeting on persona
- `customCode` on main only
- Inline/URL lore modes
- Immersion `customCode` parses as JS, embedded CFG valid JSON
- Regression cases #1–#5 (clothing directive, single/cast mode, word-boundary name matching, persona name dedup, avatar error reporting)
- Batch A (avatar shape/size/portrait, background, music, colors)
- Variety seeds, rotation, word-bank caching
- Share JSON / share link format
- Batch B (tuning knobs, preset, persona untouched)
- Markup bracket/brace guard (no `[..]` or `{a|b}` in HTML markup)

Note: the test emits `[wizard] getSection: label not found: DEFAULT OUTFIT` etc. repeatedly — these are expected `console.warn` calls because the smoke test fixture does not include those sections in its minimal output string. They are not failures.

### `node --check /tmp/_wizcheck.js` (largest `<script>` block)
**Result: PASS — SYNTAX OK**

No JavaScript syntax errors in the extracted script block.

---

## Findings Table

| # | Issue | Severity | File:Line | Invariant / Contract |
|---|-------|----------|-----------|----------------------|
| 1 | `window.generate()` has no `try-finally`: if `pendingObj.onFinishPromise` rejects (network error, timeout), `stopBtn` stays visible and `loaderEl` keeps spinning — UI hangs permanently until page reload | HIGH | char-wiz-html:632–640 | UI cleanup must be guaranteed on all code paths |
| 2 | Three identical `<select id="buildMode">` divs in markup (lines 17, 25, 33) — duplicate IDs violate HTML spec; `getElementById` always returns the first; the other two are unreachable dead markup | HIGH | char-wiz-html:17, 25, 33 | DOM IDs must be unique |
| 3 | `resetAll()` removes `STORE_KEY` and `OLD_KEYS` but leaves `accSchemaV1` (learned schema from a prior `learnSchema()` call) — post-reset exports silently use the stale learned table list and `databaseVersion`, which may have come from a different ACC version | MEDIUM | char-wiz-html:1007 | State reset must clear all persistent state |
| 4 | `resetAll()` also leaves `accWB_*` (word-bank cache, keys `accWB_adjective`, `accWB_noun`, `accWB_verb`) — stale word-bank words from a previous session survive a "start over" | LOW | char-wiz-html:1007 | State reset must clear all persistent state |
| 5 | `defaultTemplate()` sets `maxTokensPerMessage: 500` (line 1789), but `characterRow()` immediately overrides it to `800` for non-personas (line 1815). `char-info §4` cites `500` as the canonical default. The effective export value is `800` — divergence from the reference, which may affect ACC's per-message token budget | LOW | char-wiz-html:1789, 1815 | `maxTokensPerMessage` default should match char-info §4 |
| 6 | `busyHint.textContent` at line 754 is accessed without a null check (`el("busyHint")` could be null). The element exists on line 325, but the pattern is fragile if any layout change removes it — would throw a TypeError that swallows the error silently in some paths | LOW | char-wiz-html:754 | Defensive null-check before DOM write |
| 7 | `learnSchema()` (line 2095) writes `accSchemaV1` to localStorage; the `"learned"` path in `buildDexie()` (line 1862) propagates the real ACC schema into all exports. If the user learns a schema from a future ACC version with different table count/names, exports become incompatible with the current ACC version. This is by-design but has no guard against a clearly wrong schema (e.g. `tables.length === 0`) | INFO | char-wiz-html:1862–1869 | Learned schema override can produce mismatched exports |
| 8 | `window.generate()` does not guard against double-invocation: if the user clicks two generate buttons in rapid succession before the first `await` resolves, two streams run concurrently and `window.activeOutputEl` / `window.settings` will be overwritten mid-stream, sending the first stream's chunks to the wrong textarea | MEDIUM | char-wiz-html:632–640, 750 | Only one stream should be live at a time |

---

## Passing Invariants (explicitly confirmed)

| Invariant | Status | Evidence |
|-----------|--------|----------|
| All 9 Dexie tables declared and in `data[]` with `rows` entry | PASS | char-wiz-html:1871–1888; tables: characters, threads, messages, misc, summaries, memories, lore, textEmbeddingCache, textCompressionCache — match char-info §3 exactly |
| `databaseVersion: 90` pinned | PASS | char-wiz-html:1884 (hardcoded); learned override at 1865 uses `(L.databaseVersion \|\| 90)` |
| `modelName: "perchance-ai"` pinned | PASS | char-wiz-html:1789 |
| `textEmbeddingModelName: "Xenova/bge-base-en-v1.5"` pinned | PASS | char-wiz-html:1789 |
| `fitMessagesInContextMethod: "summarizeOld"` pinned | PASS | char-wiz-html:1786 |
| `crypto.randomUUID()` used for uuid, fresh per `characterRow()` call | PASS | char-wiz-html:1780, 1854 — called inside the function body, not cached |
| `uniqueId()` is collision-safe | PASS | char-wiz-html:1779 — `Date.now() * 10000 + (++_idSeq % 10000)` allows 10 000 IDs per ms |
| `customData.isPersona = true` on persona rows | PASS | char-wiz-html:1823 |
| Persona has `initialMessages: []` | PASS | char-wiz-html:1819 |
| Persona has `reminderMessage: ""` | PASS | char-wiz-html:1801 |
| Persona does not get `generalWritingInstructions` from tuning | PASS | char-wiz-html:1803, 1825 — tuning branch gated by `!isPersona` |
| `outputTo` → hidden `responseEl`; mirrored to `window.activeOutputEl` in `onWizChunk` | PASS | char-wiz-html:606–611 |
| `window.activeOutputEl` set before every `generate()` call | PASS | char-wiz-html:750 (startGen), 770 (doReroll), 780 (genConsistency), ~1758 (genStyle) |
| `getSection()` is non-greedy, handles label-at-EOF | PASS | char-wiz-html:490–500 — uses `rest.search(/\n===\s+[A-Z]/)` (first match); `n < 0` path uses full rest |
| No `maxTokens` passed to `generate()` | PASS | char-wiz-html:634 — calls `window.ai(window.settings)` with no maxTokens field |
| `=== SECTION ===` output parsing | PASS | char-wiz-html:490–500 |
| `STORE_KEY = "accWizardV5"` is versioned | PASS | char-wiz-html:373 |
| Migration from `"accWizardV4"` | PASS | char-wiz-html:374, 912–915 |
| Load validation/coercion: nested objects type-checked, defaults on mismatch | PASS | char-wiz-html:917–966 |
| In-memory state fully reset (`extras`, `rels`, `styleMain`, `styleSubs`, `immersion`, `advanced`, `tuning`) | PASS | char-wiz-html:1008–1011 |
| No `[..]` or `{a\|b}` template expressions in HTML markup (Perchance would evaluate them) | PASS | smoke.mjs lines 296–302; markup region before first `<script>` is clean |
| $types field set correctly on character rows | PASS | char-wiz-html:1857 — `arrayNonindexKeys` on `initialMessages`, `shortcutButtons`, `loreBookUrls` |
| `inbound: true` on all table data entries | PASS | char-wiz-html:1886 |

---

## Section: CONFIRMED-schema vs UNVERIFIED (char-info §9 boundary)

### Issues touching CONFIRMED schema fields only
All findings above (#1–#8) concern JavaScript runtime behavior, localStorage state management, or UI correctness — they do not depend on unverified table shapes. The Dexie envelope, character row fields populated by the wizard, and 9-table structure are all from the confirmed §3/§4 schema.

### Items NOT audited (touch §9 UNVERIFIED fields)
The following were out of scope because char-info §9 marks them unverified:
- **`threads` table guest/character array field shape** — the wizard exports `rows: []` for threads (correct), but auto-building a group thread is unverified and the wizard does not attempt it.
- **`messages` table row shape** (threadId, characterId, order, content) — only the schema string is used; no rows are written.
- **`lore` table row shape** — the wizard uses `loreBookUrls` (the confirmed URL path), not raw lore table rows.
- **`memories` / `summaries` table row shapes** — not written by the wizard.

No assertions were made about these unverified shapes, and the wizard correctly leaves those tables as `rows: []`.

---

## Deep Research: Dexie Import Pitfalls + crypto.randomUUID on Mobile

### Dexie/IndexedDB import failure pitfalls
Based on known Dexie v3/v4 behavior and ACC's import path:

1. **Missing table in `data[]`**: Dexie's import silently ignores tables in `tables[]` that have no matching `tableName` in `data[]`. ACC's import code likely iterates `data[]` to restore rows, not `tables[]` — but if a version mismatch causes a table schema change, Dexie may throw `IDBVersionChangeError`. **The wizard's approach of writing all 9 tables to both `tables[]` and `data[]` is the safe pattern.**

2. **`rowCount` mismatch**: If `rowCount` in `tables[]` does not match `rows.length` in `data[]`, older Dexie import implementations may warn or fail. The wizard computes `rowCount: x.rows.length` dynamically (line 1885), so they always match.

3. **`$types: arrayNonindexKeys` missing**: Dexie requires this marker on arrays stored as object-keyed (non-indexed) arrays. Missing it on `initialMessages`, `shortcutButtons`, or `loreBookUrls` would cause import to store them as plain objects instead of arrays, breaking ACC's message rendering. **The wizard sets this correctly on line 1857.**

4. **`inbound: true` missing**: Without `inbound: true`, Dexie skips the table during import. **Set correctly on line 1886.**

5. **`databaseVersion` higher than ACC's current version**: If the exported version number exceeds the ACC app's live Dexie version, Dexie throws a version upgrade error. The wizard uses `90` (confirmed against a live ACC export). The `learnSchema()` path propagates the real version from a live export — this is the safe path. **Risk: a user who never runs `learnSchema()` on a future ACC version gets version 90 forever, which should still be backward-compatible.**

### `crypto.randomUUID()` availability on mobile browsers
- **Android Chrome 92+** and **iOS Safari 15.4+**: `crypto.randomUUID()` is available natively in secure contexts (HTTPS). Perchance.org serves HTTPS, so this is safe.
- **Android Chrome < 92 / older Android WebView**: `crypto.randomUUID()` is not available. The wizard's fallback (`Date.now() + "-" + Math.floor(Math.random()*1e9)`) produces a non-UUID-format string. ACC stores this as the `uuid` field. Risk: if ACC validates UUID format (RFC 4122), the fallback format (`1718700000000-123456789`) would fail validation and the import might reject or silently lose the row.
- **Mitigation**: The fallback should use a proper UUID v4 polyfill. However, since Perchance targets modern browsers and the HTTPS requirement means secure context is guaranteed, the practical risk is low for current users.

---

## Recommendations (by priority)

1. **[HIGH] Fix `window.generate()` — add `try-finally`** (char-wiz-html:632–640): wrap `await pendingObj.onFinishPromise` in try-finally so `stopBtn`/`loaderEl` are always cleaned up even on rejection.

2. **[HIGH] Remove duplicate `<select id="buildMode">` elements** (char-wiz-html:23–37): keep only the first one (lines 15–21), delete the second and third identical divs.

3. **[MEDIUM] Add double-generation guard** (char-wiz-html:632): check a `window._generating` flag before starting a new stream; set it on entry, clear in finally.

4. **[MEDIUM] Extend `resetAll()` to clear `accSchemaV1`** (char-wiz-html:1007): add `localStorage.removeItem("accSchemaV1"); window.learned = null;` to the reset so post-reset exports always use the built-in pinned schema.

5. **[LOW] Clear `accWB_*` keys in `resetAll()`** (char-wiz-html:1007): add `["adjective","noun","verb"].forEach(function(t){ localStorage.removeItem("accWB_"+t); });`.

6. **[LOW] Reconcile `maxTokensPerMessage` default**: either change `char-info §4` reference to `800` (if 800 is the intentional export value for ACC character chats), or change line 1815 to `500` to match. Document which value ACC uses in practice.

7. **[LOW] Null-check `el("busyHint")`** (char-wiz-html:754): `var bh = el("busyHint"); if(bh) bh.textContent = ...`.
