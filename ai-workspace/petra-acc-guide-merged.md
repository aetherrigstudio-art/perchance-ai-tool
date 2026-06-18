# ACC + Petrafied — merged guide (2026-06-18)

> Merge of the two reachable guides + the verified fork-feature analysis.
> **Source status:** petra's named doc ("Petra's Perchance AI Character Chat
> Resources", Scribd) is **CAPTCHA-walled** to automation (WebFetch → JS wall,
> Playwright → bot challenge) and the petrafied fork source carries **no prose
> guide** (it's external), so petra's *own words* aren't transcribed here yet —
> drop the Scribd PDF/screenshots and I'll OCR them in. What IS here:
> - **Official ACC usage** ← `acc-complete-guide.txt` (the "Complete Guide")
> - **Petrafied additions** ← VERIFIED by cross-referencing 3 fork sources
>   (official `ai-character-chat` vs `petrafied-acc`/`new-petrafied-acc`)
> - **Build reference** ← `perchance-generator-tutorial.txt` (the templating engine)

---
## Part 1 — Using AI Character Chat (official, portable)
Condensed from the Complete Guide; this is the baseline every fork shares.

1. **What it is** — create AI characters with distinct personality/background/
   behavior; chat powered by the ai-text plugin; save/share; build interconnected casts.
2. **Create a character** — Name · Short Description · Personality · Background;
   then Appearance/Speaking-style/Voice; then Skills/Knowledge/Limitations.
3. **Customize behavior** — behavior guidelines ("always speaks in riddles…"),
   response templates (greeting/confused/excited), memory & adaptability settings.
4. **Chat** — Start Chat → character self-introduces → type → Send. Controls:
   Regenerate, Save, Clear, Adjust settings.
5. **Advanced** — AI settings (temperature, response length, consistency, knowledge
   cutoff); character **relationships**; **scenarios**; **Import/Export** as JSON.
6. **Best practices** — be specific, include flaws, test & refine, give speaking-style
   examples. Troubleshooting: inconsistent → more detail + consistency; generic →
   unique traits + speech examples; breaks character → explicit "never do/say" rules.

→ char-wiz already automates most of this (scenario → cast → persona → lore →
opening → review → export). The guide's "be specific / include flaws / speaking-style
examples" maps to our prompt binding-rules + the second-pass grader.

## Part 2 — What **Petrafied** (petra's fork) ADDS on top of official
**Verified by source cross-reference — these are FORK-ONLY. Do NOT emit them for
official `ai-character-chat` import** (official has none of them). Shapes are real
(seen in `petrafied-acc` source), absent from `ai-character-chat`:

| Petra feature | Real shape (source-verified) | What it does |
|---|---|---|
| **Context tracking** | `customData.contextInfo.basic.{info,prompt,enabled}` + `…detailed.{…}` (toggle enum `yes\|no`) | running state-memory (location/time/who's present; detailed = +per-char state) |
| **Vital instructions** | `customData.vitalWritingInstructions`, `customData.vitalRoleInstructions` (the latter also copied to `customData.userCharacter.vitalRoleInstructions`) | always-on writing/role instructions ("nap" addition) |
| **Persona system** | `customData.persona.{isPersona, personaId, autoUpdatePersona}` | nested persona picker + auto-update |
| **Writing presets** | UI fields `roleplay1/2Instructions`, shown only when `generalWritingInstructionsPreset === "@roleplay1\|@roleplay2"` → feed the standard `generalWritingInstructions` | curated richer-prose presets |
| **Browse gallery** | (community) built on `comments-plugin` | pre-made character gallery — the closest "browse others' cards" surface |

**Portability rule (verified):** official persona = `customData.isPersona: true`.
The fork's nested `customData.persona.*` is NOT portable — char-wiz keeps emitting
`customData.isPersona` (matches `char-info` §9). char-wiz already exposes the
petrafied-only bits behind explicit "petrafied-acc preset" gates (tuning card:
`@roleplay1/2`, context tracking) — exactly right per this comparison.

## Part 3 — Building generators (the engine behind all of this)
From `perchance-generator-tutorial.txt` — the Perchance templating primitives the
whole platform runs on (relevant when editing char-wiz-dat or any data panel):
Probability · Shorthand & Hierarchical Lists · Properties · Storing Text · Unique
Selections · the `or` operator · the `=` (equals) assignment · `evaluateItem` ·
Dynamic Odds · Import/Export. (Full text in that file; `char-info` §1 is our
paste-safety layer on top of it.)

## Open item
- **Petra's Scribd doc** still un-transcribed (CAPTCHA). Link:
  https://www.scribd.com/document/846120997/Petra-s-Perchance-AI-Character-Chat-Resources
  → provide the PDF/screenshots and I'll OCR → fold petra's own words into Part 2.

## Sources
`acc-complete-guide.txt` (perchance.org/6b6c5aeogh), `perchance-generator-tutorial.txt`
(perchance.org/tutorial), 3 fork sources via downloadGenerator API, and the ACC
schema-verification cross-reference (this session).
