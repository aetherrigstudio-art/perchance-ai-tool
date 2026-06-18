# Perchance ecosystem research — generators, plugins, tools, libraries

> UNCOMMITTED research log (2026-06-18). Method: `/api/downloadGenerator` works via
> plain GET (no browser) and returns a generator's source — used to mine real
> `{import:...}` lines and the plugin catalog. perchance.org **HTML pages 403** to
> automation (Cloudflare), so use the API + web (fandom wiki, GitHub) for prose.
> Grounded claims are tagged ✓src (seen in fetched bytes); web-only are tagged ~web.

## 1. Plugins — the `{import:...}` ecosystem

**How it works:** data panel: `name = {import:plugin-name}` → exposes `name(...)` /
a `window.*` you call from HTML. The full searchable catalog is itself a generator:
**`perchance.org/plugin-list`** (~120+ plugins; fetch via the API). ✓src

**What char-wiz imports today** (`char-wiz-dat`): `ai-text-plugin`,
`text-to-image-plugin`, `adjective`/`noun`/`verb` (word libraries), `upload-plugin`. ✓src

**What ACC itself leans on** (mined from the 3 fork sources): `comments-plugin`
(464 hits — sharing/galleries/comments), `image-plugin` + `text-plugin` (the AI
plugins), `fetch-plugin` (outbound HTTP), `button`, `emojis`, `secret` (API-key
storage), `report`, `framework`, `compromise` (the **compromise.js NLP** lib),
`tabs`, `prompt2`. ✓src

**Plugins worth adopting in char-wiz** (from the catalog + ACC usage):

| Plugin | What it does | Potential use for char-wiz |
|---|---|---|
| `fetch-plugin` / `super-fetch-plugin` | outbound HTTP **from inside a generator** | pull a hosted **lorebook** live at chat-time (we currently host+paste a URL); fetch remote data | 
| `comments-plugin` | comment box + shared user submissions/gallery | a **character-share gallery** (the closest thing to "browse others' cards"); ACC uses it heavily ~web/✓src |
| `background-image-plugin` / `background-audio-plugin` | set chat background / ambient audio | our **immersion pack** (dynamic backgrounds + mood music) currently hand-rolls this in customCode — could lean on plugins |
| `markov-name-generator-plugin` | generate plausible names | name suggestions for cast/persona |
| `flat-avatar-plugin` | composable flat avatars | fallback avatars without an image-gen call |
| `google-sheets-plugin` | read a Google Sheet as a list | crowd-sourced lorebook / word-pool data |
| `dynamic-import-plugin` | import generators/plugins **at runtime** | sibling of our loader pattern; could modularize char-wiz |
| `color-palette-plugin` | palette generation | image-style builder (prefix/suffix palettes) |
| `download-button-plugin` / `fullscreen-button-plugin` / `markdown-plugin` | UI helpers | export buttons, fullscreen builder, rendered hints |
| `secret-plugin` / `locker-plugin` | store secrets / gate content | hold an API key or hosting token if ever needed |
| `tts` (NOT a plugin) | — | TTS in ACC is the browser **SpeechSynthesis** API (device-local), matching our immersion-pack note — `tts-plugin` 404s ✓src |

## 2. Generators / forks (character + roleplay space)

- **`ai-character-chat`** = official ACC (canonical schema reference). ✓src (2.7 MB source)
- **`petrafied-acc` / `new-petrafied-acc`** = popular forks; the two are near-identical
  to each other. Add the **"nap" feature set**: `contextInfo`/`detailedContextInfo`
  (running-state memory), `vital*Instructions`, a nested **persona system**
  (`customData.persona.{isPersona,personaId,autoUpdatePersona}`), and the
  `@roleplay1/2` writing presets. **All fork-only — NOT portable to official ACC.** ✓src
- Schema cross-reference (separate note this session) verified `shortcutButtons`,
  `messageWrapperStyle`, `avatar.*` (shape enum now `square|circle|portrait`),
  `scene.background/music`, memory/context fields against OFFICIAL source; and
  confirmed `stopSequences`/`temperature` are **generate()/plugin options, not row
  fields**. (See the ACC-schema-verification findings.)

## 3. Libraries, data & automation surface

- **Shared data libraries:** `{import:adjective|noun|verb}` etc. are importable list
  generators — Perchance's word-bank libraries (we already use them for SEED/VOCAB). ✓src
  Other list libraries exist in the catalog (e.g. conjugate, plural, numerals-to-words).
- **API endpoints** (verified in `ai-workspace/perchance-api-research.md`):
  `/api/downloadGenerator` (stable, backwards-compatible; returns source) and
  `getGeneratorsAndDependencies` (generator + all plugin deps). The 403 is HTML-only.
- **Programmatic clients** (prior note): `eeemoon/perchance` (PyPI, async text+image),
  `aein00/perchance-image-generator` (CLI), `ouoertheo/sd-webui-perchance` (local
  proxy `GET /generate?name=`), `danoan/perchance-tools` (word-list/CLI helper),
  a Raycast extension.
- **fetch-plugin / super-fetch-plugin** = the generator-side outbound-HTTP capability
  that makes live remote data (lorebooks, sheets) possible.

## 4. Concrete opportunities for char-wiz (research → backlog candidates)
1. **Lorebook via `fetch-plugin`** instead of paste-a-URL — generator fetches the
   hosted lorebook itself at chat time. (Pairs with the loader-integrity work.)
2. **Share gallery via `comments-plugin`** — the realistic "see characters others
   made" surface; opt-in publish of a built character.
3. **Immersion pack on `background-image/audio-plugin`** — replace hand-rolled
   customCode where a maintained plugin already does it.
4. **`markov-name-generator-plugin`** for offline name suggestions (no AI call).
5. **`stopSequences` correction** (from schema note): pass to the ai-text plugin
   `generate()` call, NOT the data-panel `settings` block — fixes ROADMAP #15.

## Sources
- API: `https://perchance.org/api/downloadGenerator?generatorName=…` (downloadGenerator, verified GET)
- Plugin catalog: https://perchance.org/plugin-list · https://perchance.org/plugins
- Wiki: https://perchance.fandom.com/wiki/Plugins · /wiki/Comments-plugin
- Docs: https://perchance.org/learn-perchance-advanced-functions-plugins · https://perchance.org/super-fetch-plugin · https://perchance.org/comments-plugin
- Prior repo note: `ai-workspace/perchance-api-research.md`
- Mined sources: `/tmp/acc-*.html` (3 ACC forks), `/tmp/plugin-list.txt`, `/tmp/plg-*.txt`
