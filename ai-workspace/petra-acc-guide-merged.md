# ACC + Petrafied — merged guide (2026-06-18)

> Merge of the two reachable guides + the verified fork-feature analysis.
> **Source status:** all three petra sources are now in hand —
> - **Official ACC usage** ← `acc-complete-guide.txt` (the "Complete Guide")
> - **Petrafied additions** ← VERIFIED by cross-referencing 3 fork sources
>   (official `ai-character-chat` vs `petrafied-acc`/`new-petrafied-acc`)
> - **Source-verified field shapes + petra's actual prompts** ← Part 2.5, pulled
>   live via `python3 scripts/perchance_api.py download petrafied-acc`
> - **Petra's own prose guide** ← Part 2.6 + full extract in
>   `ai-workspace/petra-guide-prose.txt` (her complete 211-page notebook PDF, provided
>   by the repo owner — the Scribd doc that was CAPTCHA-walled to automation)
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

## Part 2.5 — Source-verified from petra's fork (downloadGenerator API, 2026-06-18)
Transcribed from `petrafied-acc` source (data + 1.25 MB HTML panel). These are
**real shapes with real example values** — the closest thing to petra's guide we
can reach legally and programmatically. Reconcile against `char-info` §9.

**A. Character-row fields — confirmed with example values** (from her starter
characters "Chloe" + "Emry"; these fields are core ACC, present in official too
unless flagged fork-only):
- `_charUrlId` — slug for `urlNamedCharacters` (pretty per-character URLs).
- `tagline` — text shown in the starter-character panel.
- `roleInstruction`, `reminderMessage` — reminder uses an inline format:
  `[SYSTEM]: (Instructions: …) (Responses should include insights into {{char}}'s
  thoughts, descriptions of …)`. `{{char}}`/`{{user}}` tokens throughout.
- `loreBookUrls: [ "<url>", … ]` — **array** of raw text URLs (she uses Dropbox
  `?dl=1` links). Multiple lorebooks per character.
- `autoGenerateMemories: "v1"` — opt-in memory generation (string version tag).
- `fitMessagesInContextMethod: "summarizeOld"` (matches our default) or `dropOld`.
- `initialMessages: [ {author:"system"|"ai"|"user", content:`…`, hiddenFrom?:[…]} ]`
  — system seed messages ARE used here (note: `char-info` still flags seeded/group
  shapes unverified for *official* import — this confirms the fork shape only).
- `avatar: { url, shape:"portrait", size:1.5 }` — **`shape` enum includes
  "portrait"**; **`size` is a number** (1.5). Confirms ROADMAP avatar notes.
- `customCode` — JS string; her pattern is **background-keyword → image-list-URL**
  swapping (`const backgroundKeywords = { "forest": "<list-url>", … }`).
- `maxParagraphCountPerMessage` — length control (she sets `undefined`); this is
  the paragraph-count lever (distinct from the `maxTokensPerMessage`/null one).
- `messageWrapperStyle` — **full CSS string**, real example:
  `backdrop-filter: blur(4px); border-radius:5px; background-color: rgb(20 60 50 /
  0.75); color: rgb(243 182 110); font-family:"papyrus",sans-serif; …`. Confirms
  the deferred ROADMAP `messageWrapperStyle` item with a working value.
- `scene: { background: { url } }` — per-character scene background image.
- `imagePromptPrefix` / `imagePromptSuffix` / `imagePromptTriggers` — her suffix
  bundles a `(negativePrompt:::(worst quality,…))` block; triggers are
  `"Name: The Name has <trait>."` sentences.
- `userCharacter: { name, roleInstruction, reminderMessage, avatar }` — the persona
  side mirrors the character shape (she gives the user-char its own reminder +
  avatar `shape:"portrait"`).
- `shortcutButtons: [ {name, message, insertionType:"replace", autoSend:bool,
  clearAfterSend:bool, type:"message"} ]` — **exact shape our `-24` build added.**
  Her defaults: `🖼️ Image → "/image --num=1"` (autoSend); `📜 Narrator → "/nar
  ==Prompt:== (<>), (Context: ), (Mood: ), (Instructions: Continue on from the last
  scene naturally. Narrate the characters' next actions sequentially. Stay
  focused.)"` (no autoSend — user fills the blanks first).

**B. Fork-only global config** (`db.misc` keys — petrafied engine, NOT in official;
do not emit for `ai-character-chat`): `napMaxMessages` (default **100**),
`generalRoleGenerationPrompt`, `isInReadingMode` (`"no"`), `shortcutButtonsEnabled`
(`"yes"`), `petraColorTheme`, plus the two memory-RAG prompts in C.

**C. Petra's actual prompt engineering** (verbatim fragments — useful for our
prompt-builder + grader, NOT for emission into a character):
- **Memory/lore retrieval (RAG query-gen):** *">>> TASK: respond with 3 smart
  search query ideas to search a database of memories to help guess what's going
  to happen next… Use lots of proper nouns (names of characters…)."*
- **Retrieved-context guard:** *"Below are some random things/facts/…memories that
  may or may not be relevant… You must COMPLETELY IGNORE this stuff if it's not
  relevant… Do NOT shoehorn them into the story."*
- **User-instruction precedence:** *"You *must* adjust the character to follow the
  underlying intent of the EXTRA_USER_INSTRUCTIONS… the extra user instructions
  takes precedence over everything else."*
- **Speech-example generation** (mirrors our binding-rule philosophy): *"A numbered
  list of 5 separate and diverse examples of character speech/behavior, each
  starting with an asterisk or double-quote, … as if you've extracted random &
  diverse moments from a story … Each example should perfectly capture one aspect
  of who they are."*
- **Formatting rule:** *"You must use asterisks around actions and quotes around
  speech in typical roleplay style."*

**D. What char-wiz should take from this:**
1. The `shortcutButtons`/`messageWrapperStyle`/`avatar.{shape,size}` work is now
   **source-confirmed** — safe to present as verified, not speculative.
2. `loreBookUrls` is an **array** + `autoGenerateMemories:"v1"` — if/when we surface
   lorebook export, match these shapes.
3. The speech-example + asterisk/quote formatting rules align with our prompt
   binding-rules; the "ignore irrelevant retrieved context" guard is a good pattern
   if we ever add RAG.
4. Keep the fork/official split intact: **B is fork-only**; A is core ACC.

## Part 2.6 — Petra's own words (her full 211-page prose guide)
The Scribd doc came through as a PDF (provided by the repo owner) — the **complete
211-page** notebook. Full text-layer extract: `ai-workspace/petra-guide-prose.txt`
(pp.1-100 Basics, 101-150 threads/prompting/lore/initial-messages, 151-211 memories/
summary/CSS/multi-character/injection/hidden-system/hosting). The bits that matter
for **char-wiz**, in her framing:

**Her assessment of what the ACC AI is GOOD at** (use to justify our prompt design):
- Takes **simple, direct personality instructions** and acts them out (actions,
  personality, conversation style, themes).
- Dialog + narration, including the character's physical features *if described*.
- Excels at **narrating stories**; extensive vocabulary; solid knowledge of popular
  series (Star Wars, Fallout, Mass Effect, Marvel, DC…); can play original or
  existing characters in those worlds.

**…and what it's BAD at** (these are our guardrails — char-wiz already leans this way):
- Interprets instructions **loosely/ambiguously** — good for creativity, bad for
  rigid tasks.
- **Rigid, inflexible rules often aren't followed**: turn-based RPG calculation/
  mechanics, or "follow this exact formatting" instructions "tend not to work well."
- **Limited context** — it can't remember everything; expect mistakes even on its
  strengths. → validates our "control length via prompt wording, not hard mechanics"
  stance and the second-pass grader.

**Character-field philosophy** (matches char-info, in her words):
- **Description is "perhaps the most important" field** — it's the explanation to the
  AI of *what the character is, what it does, and how it acts*; be detailed, state the
  general rules. (char-wiz's role/persona prompts already target this.)
- **Character reminder note** = "very important information the AI will always check
  before typing a message." Keep it **short**; not always needed; good for
  **reinforcing conversational style**. (= ACC `reminderMessage`; confirms our usage.)
- Avatar image URL is optional.

**Image-prompt formula** (her DALL-E/landscape style — informs the Image Style tool):
`[style] drawing of [subject]. [build/expression]. [hair/features]. [clothing/
jewelry]. [eyes]. [background], [time of day], [weather].` Landscapes in this same
shape "work well as AI Character Chat backgrounds." Bing/DALL-E caps prompts at
**~480 chars**; ~100–150 gens/account/day.

**Avatar + CSS conventions** (reconcile with Part 2.5's `messageWrapperStyle`):
- Avatar **size 8 (desktop) / 2 (mobile)**; **shape `square` desktop, `portrait`
  mobile** — i.e. `avatar.shape:"portrait"` is her mobile default (matches Part 2.5).
- Her chat-box CSS uses `backdrop-filter: blur(3px)`, `border-radius`, `box-shadow`,
  `background-color: rgb(.. / 0.8)`, a Google font via `font-family:'…'` — same
  shape as the source-verified `messageWrapperStyle` string in Part 2.5.
- **Lorebook sync**: host the `.txt` on Dropbox and use a **`?dl=1`** direct link so
  edits sync without re-upload (matches the `loreBookUrls[]` Dropbox links in 2.5).

**Lore good-practices (§2.2.2 — the single most char-wiz-actionable section).** When
char-wiz generates lore entries it should follow petra's rules verbatim:
- **Each entry self-contained.** The AI reads entries *in isolation* and retrieves
  them individually, so **never cross-reference** ("He"/"the above") — repeat the
  subject's proper name in every entry that's about it. Order does **not** matter.
- **Don't over-split.** The AI often doesn't retrieve all entries on a subject, so a
  subject fragmented across many entries yields incomplete info. **Merge related
  facts** into one entry; ~120-200 words each is her sweet spot.
- **Direct, clear, factual** prose — the AI adds flavor itself; repeat names rather
  than be ambiguous.
- **What belongs in lore:** world/geography/nations, trivia, artifacts/objects,
  custom-race physiology, cultures, important events. **What does NOT:** *character*
  details (use the character **description** — far more reliable than lore retrieval),
  future/not-yet-known info, and far-away/irrelevant info (the AI may pull it in at
  the wrong time). → char-wiz already routes character info to the role/persona, not
  lore; this confirms that split.

**Character description & reminder (§3.3).** Directly governs what char-wiz emits:
- **Description** is the most reliable channel for character info; ~**1000 words** for
  a major character works well in her experience; keep minor characters simple. Don't
  overload it.
- **Reminder note** is *heavily* prioritised and can get repetitive — so restrict it
  to **only these four** kinds of content: (1) **conversational style**, (2) **quirks**
  (always-followed habits), (3) **custom-race physical description**, (4) a **very
  strong belief** the character should keep referencing. Blank is fine. → char-wiz's
  `reminderMessage` generation should be constrained to these four; anything else
  belongs in the description.

**Initial / System messages (§2.3) — opening-scene design.** char-wiz's opening
scene maps onto this:
- The **first message of a thread does not search lore**, so a character with lore
  should *always* have a starting message.
- **System messages get higher priority** in ACC's code (the `/nar` Narrator is
  System). Format: `[SYSTEM]:` / `[AI]:`; hide with `[SYSTEM; hiddenFrom=user]:`
  (or `hiddenFrom=ai`, or both).
- Her pattern: a **hidden System "lore dump"** (~5k chars / ~900 words) of the *core*
  setting facts at thread start, kept out of the user's view — reliable setup without
  depending on retrieval. Redundancy with the lorebook is fine.

**Advanced techniques worth knowing (won't change char-wiz output, but context):**
- **Multi-character threads:** `/ai @CharacterName#ID instruction`; **only the Main
  AI character's lorebooks are used**; characters can read each other's *descriptions*
  (another reason character info lives in the description, not lore).
- **Hub character:** a custom narrator holding all lorebooks/shortcuts/JS/CSS so the
  real characters stay minimal (name, avatar, description, +optional reminder/CSS).
- **Character injection / hidden-system-message tricks:** post a hidden message *as*
  a character (hidden from both) to inject their profile without them being in-scene
  (lasts ~20 messages); inject a hidden System message mid-thread to refocus the AI
  or surface a lore entry that isn't being retrieved.
- **Memories vs Summary:** both auto-generated, thread-scoped, retrieved by the same
  "3 questions"; memories = fact list, summary = plot-point blocks (overwritten over
  time). Map to ACC `autoGenerateMemories` + `fitMessagesInContextMethod:"summarizeOld"`.

## Part 3 — Building generators (the engine behind all of this)
From `perchance-generator-tutorial.txt` — the Perchance templating primitives the
whole platform runs on (relevant when editing char-wiz-dat or any data panel):
Probability · Shorthand & Hierarchical Lists · Properties · Storing Text · Unique
Selections · the `or` operator · the `=` (equals) assignment · `evaluateItem` ·
Dynamic Odds · Import/Export. (Full text in that file; `char-info` §1 is our
paste-safety layer on top of it.)

## Open item
- **CLOSED** — petra's prose guide is now transcribed (Part 2.6 +
  `petra-guide-prose.txt`). The only thing not captured is the *image* content
  (DALL-E result screenshots, font/CSS preview images, interface screenshots) — the
  PDF's text layer keeps the captions but not the pictures. If a specific screenshot
  matters, say which and I'll OCR that page. Source doc:
  https://www.scribd.com/document/846120997/Petra-s-Perchance-AI-Character-Chat-Resources

## Sources
`acc-complete-guide.txt` (perchance.org/6b6c5aeogh), `perchance-generator-tutorial.txt`
(perchance.org/tutorial), **`petrafied-acc` fork source via `downloadGenerator` API
(Part 2.5, fetched 2026-06-18)**, the 3-fork schema-verification cross-reference,
and `new-petrafied-acc` (byte-near `petrafied-acc`).
