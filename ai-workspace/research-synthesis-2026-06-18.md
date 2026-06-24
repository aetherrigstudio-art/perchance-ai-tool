# Research synthesis — ai-workspace/ corpus → actionable items (2026-06-18)

> Synthesis of the `ai-workspace/` research corpus into themes, insights, and
> prioritized recommendations for `char-wiz` (the AI Character Set Builder).
> Produced with the `research-synthesis` skill, cross-checked against the live
> `ROADMAP.md` / `ISSUES.md` so this surfaces **new** items, not shipped ones.
>
> **Sources:** `petra-acc-guide-merged.md` (distills the 211-pg prose + source-verified
> fork shapes), `perchance-ecosystem-research.md`, `perchance-api-research.md`,
> `acc-complete-guide.txt`, `petra-guide-prose.txt`.
>
> **Boundary discipline (per `char-info` §9):** `✓verified` = seen in source bytes /
> a real export · `⚠unverified` = community/inferred — never promote ⚠ to fact.

---

## Executive summary

Most ACC **character-row fields** are now source-confirmed — that work is already
tracked and largely shipped in `ROADMAP.md`. The highest-value *untapped* findings
are **not fields**: they are petra's **lore-generation and reminder-note authoring
rules** (which govern what char-wiz's prompts should emit) and a **plugin-ecosystem
layer** (fetch / comments / background plugins) that could replace hand-rolled
`customCode`. New ROADMAP/ISSUES items should come from these.

## Key themes

### Theme 1 — char-wiz's biggest lever is *how it authors content*, not *which fields it fills* `✓verified` (petra prose §2.2.2, §3.3)
The field catalog is "complete" per ROADMAP, but petra's prose specifies authoring
rules char-wiz does **not** yet enforce in its prompt builder:
- **Lore entries**: self-contained; repeat the subject's proper name (the AI retrieves
  entries in isolation — never "he" / "the above"); **don't over-split** (~120–200
  words, merge related facts); order doesn't matter. **Character info belongs in the
  description, not lore.**
- **Reminder note**: heavily prioritized + repetitive — restrict to **exactly four**
  content kinds: (1) conversational style, (2) quirks, (3) custom-race physiology,
  (4) one very strong belief. Blank is fine.
- **Description**: the most reliable channel for character info (~1000w for a major
  character; keep minor characters simple).

*Implication:* concrete `buildWizardPrompt` / lore-generation constraints + grader
rubric additions. High impact, low risk, **no schema change**.

### Theme 2 — A plugin-ecosystem layer is unexploited `✓src` (mined from 3 fork sources)
char-wiz hand-rolls immersion in `customCode` and pastes lorebook URLs. The catalog
offers maintained alternatives:
- `fetch-plugin` / `super-fetch-plugin` — fetch a hosted **lorebook live at chat time**
  (vs. our paste-a-URL).
- `comments-plugin` — the realistic **share gallery** ("browse characters others made");
  ACC uses it heavily.
- `background-image-plugin` / `background-audio-plugin` — immersion (we hand-roll this).
- `markov-name-generator-plugin` — offline name suggestions (no AI call).

*Implication:* architectural opportunities, mostly absent from the field-focused ROADMAP.

### Theme 3 — The fork/official split is source-proven and must stay enforced `✓verified`
Context-tracking, `vital*Instructions`, nested `customData.persona.*`, `@roleplay1/2`
presets are **fork-only** (absent from `ai-character-chat`). char-wiz correctly gates
these behind a "petrafied-acc preset." *Implication:* no action — confirms current
design; a guardrail to preserve.

### Theme 4 — Opening-scene / system-message design is richer than char-wiz uses `✓verified` (fork) / `⚠unverified` (official)
The **first thread message doesn't search lore**, so a lore-bearing character should
always ship a starting message (char-wiz does). Petra adds a **hidden System "lore
dump"** (~900 words) at thread start. *Implication:* a candidate feature — but
`char-info` flags seeded/system-message shapes `⚠unverified` for *official* import, so
fork-gated / Tier-3 only.

### Theme 5 — Doc drift: char-info lags the Sept-2025 ACC updates `⚠confirmed via research, not in char-info`
Main Prompt Template editor, creativity slider, em-dash fix, expanded `customCode`
(internet / 3D-VR / voice / Python). *Implication:* a `char-info` update pass (already
noted in ROADMAP "Research status").

## Insights → opportunities

| Insight (source) | Opportunity | Impact | Effort | Verified |
|---|---|---|---|---|
| Lore entries must be self-contained, names repeated, not over-split | Lore-authoring rules in lore-gen prompt + grader checks | **High** | Low | ✓ |
| Reminder note → only 4 content kinds | Constrain `reminderMessage` generation to those four | **High** | Low | ✓ |
| `fetch-plugin` enables live lorebook fetch | Replace paste-a-URL with chat-time fetch | Med | Med | ✓src |
| `comments-plugin` = realistic share gallery | Opt-in "browse characters others made" | Med | High | ✓src/~web |
| Petra's `shortcutButtons` defaults (🖼️ Image, 📜 Narrator) | Offer as one-click presets (we ship manual entry) | Med | Low | ✓ |
| Asterisk-actions / quote-speech + 5-example speech rule | Formatting directive in prompt binding-rules | Med | Low | ✓ |
| Petra's image-prompt formula (`[style] drawing of [subject]…`, ~480-char cap) | Inform the **Image Style Builder** tool's template | Med | Low | ✓ |
| Hidden System lore-dump at thread start (~900w) | Optional fork-gated opening lore dump | Med | Med | ⚠ fork-only |
| Sept-2025 ACC updates absent from char-info | Doc update pass | Low | Low | ⚠ |

## Recommendations (prioritized → destination)

1. **[High] Encode petra's lore + reminder authoring rules** into char-wiz's prompt
   builder & grader (Theme 1). Biggest quality lever, low risk, no schema change.
   → 2–3 new `ISSUES.md` entries against `buildWizardPrompt` / lore-gen +
   `test/grade-generation.mjs` rubric.
2. **[High] Add the asterisk/quote roleplay-formatting directive** to binding-rules
   (petra Part 2.5-C). Cheap; improves every generation. → `ISSUES.md`.
3. **[Medium] Ship petra's `shortcutButtons` presets** (🖼️ Image `/image --num=1`;
   📜 Narrator `/nar …`) as one-click defaults on the existing card.
   → small ROADMAP / `ISSUES.md` item.
4. **[Medium] Open a "Plugin-backed features" ROADMAP section** for fetch-plugin
   lorebook, comments-plugin gallery, background plugins — bigger, needs own triage
   (ROADMAP is currently field-only).
5. **[Medium] Feed petra's image-prompt formula** into the Image Style Builder tool.
6. **[Low] char-info update pass** for the Sept-2025 ACC changes.
7. **[Hold / Tier-3] Hidden-system lore-dump** — fork-gated only; keep behind the
   verified/unverified boundary.

**Net-new vs. ROADMAP/ISSUES:** Recs 1–5 (lore/reminder authoring rules, formatting
directive, button presets, a plugin-features section, the image-style formula) are
not yet tracked. Recs 6–7 are already flagged in ROADMAP.

## Open questions (block the above)

- Does official `ai-character-chat` honor `initialMessages` with `author:"system"` +
  `hiddenFrom`? (fork-confirmed; official `⚠unverified` — blocks Rec 7.)
- `fetch-plugin` CORS / reliability for arbitrary lorebook hosts at chat time? (Rec, fetch)
- Exact `messageWrapperStyle` render behavior in-app (blocks deferred richer-CSS ROADMAP #7).

## Methodology notes

The `research-synthesis` skill is tuned for *user* research (interviews/surveys);
adapted here to technical docs — "prevalence" → source-confirmation strength, quotes →
verbatim source fragments. Limitation: petra's prose is a single expert's experience
(authoritative, not independently replicated); image content from her PDF was not OCR'd.
`✓verified` shapes are separated from `⚠unverified` semantics throughout, per
`char-info` §9.
