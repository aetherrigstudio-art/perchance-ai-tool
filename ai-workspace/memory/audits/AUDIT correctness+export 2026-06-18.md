---
title: AUDIT correctness+export 2026-06-18
type: note
permalink: perchar/audits/audit-correctness-export-2026-06-18
tags:
- audit
- correctness
- export-safety
- '2026-06-18'
---

# AUDIT: correctness + export-safety — 2026-06-18

## Verifier results
- `node test/smoke.mjs`: **PASS** — all 46 assertions pass, 0 failures
- `node --check` on wizard script block: **PASS** — no syntax errors

## Import-safety verdict: NO BLOCKERS
Dexie envelope correct, all 9 tables present with correct schemas and `rows` entries, identity generation collision-safe, constants pinned, persona flags correct.

## Top findings

| # | Issue | Severity | File:Line |
|---|-------|----------|-----------|
| 1 | `window.generate()` missing try-finally: network error mid-stream → unhandled rejection → UI hangs permanently (spinner + stop button stuck) | HIGH | char-wiz-html:632–640 |
| 2 | THREE identical `<select id="buildMode">` in markup (lines 17, 25, 33) — duplicate IDs, 2 of 3 are unreachable dead markup | HIGH | char-wiz-html:17,25,33 |
| 3 | No double-generation guard: two rapid generate clicks → concurrent streams, `activeOutputEl` clobbered mid-stream | MEDIUM | char-wiz-html:632,750 |
| 4 | `resetAll()` does not clear `accSchemaV1` (learned schema) — post-reset exports use stale schema from a prior `learnSchema()` call | MEDIUM | char-wiz-html:1007 |
| 5 | `maxTokensPerMessage` default is 800 in export (line 1815) but 500 in char-info §4 — undocumented divergence | LOW | char-wiz-html:1789,1815 |
| 6 | `resetAll()` leaves `accWB_*` word-bank cache keys | LOW | char-wiz-html:1007 |

## Confirmed passing invariants
- All 9 Dexie tables: characters, threads, messages, misc, summaries, memories, lore, textEmbeddingCache, textCompressionCache
- databaseVersion 90, modelName "perchance-ai", textEmbeddingModelName "Xenova/bge-base-en-v1.5", fitMessagesInContextMethod "summarizeOld" — all pinned
- crypto.randomUUID() fresh per characterRow() call; _idSeq prevents same-ms collision
- isPersona=true, initialMessages=[], reminderMessage="" on persona — correct
- getSection() non-greedy, handles EOF label
- activeOutputEl set before every generate() call
- No maxTokens passed to generate()
- STORE_KEY="accWizardV5" versioned; migration from V4 present
- $types arrayNonindexKeys set correctly
- No [..] or {a|b} in HTML markup

## Mobile/cross-browser note
crypto.randomUUID() available on Perchance (HTTPS) for Android Chrome 92+/iOS Safari 15.4+. Fallback for older browsers is not RFC 4122 UUID format — low practical risk for current users but worth noting.

## Full report
`/home/user/perchance-ai-tool/ai-workspace/audit/audit-correctness.md`
