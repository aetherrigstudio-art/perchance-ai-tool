# Perchance AI Character Creation — Build Reference

A practical reference for building Perchance.org generators that create
characters for **AI Character Chat (ACC)**. Load this before writing any such
tool. It captures the syntax, the AI plugin API, the confirmed import schema,
reusable code, and — importantly — what is verified versus assumed.

---

## 1. Platform basics

A Perchance generator has **two editors**:

- **Data / generator editor** (left): indentation-based plain text. Holds the
  AI plugin import, `settings`, functions like `generate()`, and `$meta`.
- **HTML editor** (right): normal HTML + `<script>` + `<style>`. This is where
  UI and most JavaScript logic should live.

Always deliver these as **two separate blocks**. Do not merge them.

### Special characters (data editor only)
In the **data editor**, these are evaluated and must be escaped to appear
literally: `[` `]` `{` `}` → `\[ \] \{ \}`. `{|}` forces a blank line.
`<<<token>>>` is replaced by a settings/widget code.

**Key insight:** escaping only matters for literal text typed *inside data-editor
text blocks*. When a prompt string is built in HTML JavaScript and returned via
`instruction()`, **no Perchance escaping is needed** — `{{char}}`, `{{user}}`,
`{}`, `[]` all pass through literally. Build prompts in JS to avoid escaping
headaches entirely.

**Caveat — Perchance also templates HTML *markup*.** It is not only the data
editor: Perchance evaluates `[...]` and `{a|b|c}` expressions in the HTML
panel's **markup** too — placeholder text, hint copy, visible labels, attribute
values. It does **not** touch the contents of `<script>` or `<style>`. So a
literal bracket/brace you want to *display* in the UI (a placeholder like
`[trigger, trigger]`, a hint mentioning `[SYSTEM]`, a label showing `{a|b|c}`)
errors at render ("[brackets] returned nothing").

**HTML-entity escaping (`&#91;` …) is NOT reliable for this** — Perchance can
decode entities before its template pass, so the bracket reappears and still
errors. The robust rule: **keep `[ ] { }` out of HTML markup entirely.** Two
safe options: (1) reword so the character never appears ("in square brackets"
rather than "in [brackets]"); (2) when the literal bracket *is* the content (a
format example), set it from `<script>`, which Perchance never templates —
`el("loreOut").placeholder = "[trigger, trigger] …"`. JS string literals inside
`<script>` are always safe, which is also why building prompts in JS (above)
sidesteps the whole problem.

---

## 2. The AI text plugin (`ai-text-plugin`)

Import and configure in the **data editor**:

```
ai = {import:ai-text-plugin}

settings
  instruction() =>
    return (window.buildPrompt ? window.buildPrompt() : "");
  startWith = [ "" ]
  hideStartWith = [ false ]
  outputTo = [responseEl]
  onStart() =>
    generateBtn.disabled = true;
    responseEl.value = "";
  onChunk() =>
    // stream handling; see dynamic-target trick below
  onFinish() =>
    generateBtn.disabled = false;
    stopBtn.style.display = "none";
    loaderEl.innerHTML = "";
    if(window.onFinish) window.onFinish();
  render = [ null ]

async generate() =>
  let pendingObj = ai(settings);
  stopBtn.style.display = "";
  stopBtn.onclick = function() { pendingObj.stop(); stopBtn.style.display = "none"; };
  loaderEl.innerHTML = pendingObj.loadingIndicatorHtml;
  await pendingObj.onFinishPromise;
  stopBtn.style.display = "none";
```

Supported settings: `instruction` (function returning the prompt string),
`startWith`, `hideStartWith`, `stopSequences`, `outputTo` (an element),
`render`, and callbacks `onStart` / `onChunk` / `onFinish`.

**There is no `maxTokens` setting.** Control length through the prompt
("about 150 to 220 words", "write all sections in full, then stop").

`startWith` primes the model's first tokens (e.g. `"=== NAME ===\n"` to force
structured output). With `hideStartWith = false` the primed text is shown.

### Streaming to different fields (dynamic output target)
`outputTo` points at one element. To stream into whichever field the user
triggered, use a hidden buffer element as `outputTo`, then mirror it in
`onChunk`:

```
  onChunk() =>
    if(window.activeOutputEl){
      window.activeOutputEl.value = responseEl.value;
      let el = window.activeOutputEl;
      if(el.scrollTop+el.offsetHeight > el.scrollHeight-60) el.scrollTop = el.scrollHeight;
    }
  onFinish() =>
    if(window.activeOutputEl) window.activeOutputEl.value = responseEl.value;
```

Before each `generate()`, set `window.activeOutputEl = <the visible textarea>`.

Required HTML elements referenced above: `responseEl` (can be hidden),
`generateBtn` (hidden), `stopBtn`, `loaderEl`.

Reference docs: `perchance.org/ai-text-plugin-api`,
`perchance.org/ai-text-plugin-demo`, `perchance.org/ai-character-chat-docs`.

---

## 3. ACC import format — the Dexie envelope (CONFIRMED)

ACC exports/imports a **Dexie database dump** for the `chatbot-ui-v1`
IndexedDB database. The outer shape:

```json
{
  "formatName": "dexie",
  "formatVersion": 1,
  "data": {
    "databaseName": "chatbot-ui-v1",
    "databaseVersion": 90,
    "tables": [ { "name": "...", "schema": "...", "rowCount": N }, ... ],
    "data":   [ { "tableName": "...", "inbound": true, "rows": [...] }, ... ]
  }
}
```

### Critical rules (each caused a real failure)
1. **Every table declared in `tables[]` must also appear in `data[]`** with a
   `rows` array (even if empty `[]`). Declaring 9 tables but supplying a data
   block for only some throws
   `Cannot read properties of undefined (reading 'rows')` during import.
2. **Use high-entropy `id` and `uuid`** per character or you can overwrite the
   user's existing characters. Use `crypto.randomUUID()` and a
   timestamp-based numeric id.
3. `databaseVersion: 90` matters; older importers reject mismatches.
4. Uncompressed `.json` imports fine (exports may arrive gzipped, but plain
   JSON is accepted).

### The 9 tables and their exact schema strings
```
characters            ++id,modelName,fitMessagesInContextMethod,uuid,creationTime,lastMessageTime,folderPath
threads               ++id,name,characterId,creationTime,lastMessageTime,lastViewTime,folderPath
messages              ++id,threadId,characterId,creationTime,order
misc                  key
summaries             hash,threadId
memories              ++id,[summaryHash+threadId],[characterId+status],[threadId+status],[threadId+index],threadId
lore                  ++id,bookId,bookUrl
textEmbeddingCache    ++id,textHash,&[textHash+modelName]
textCompressionCache  ++id,uncompressedTextHash,&[uncompressedTextHash+modelName+tokenLimit]
```

To import characters into the library, populate only the `characters` table's
`rows`; leave the other eight as `rows: []`.

---

## 4. The character row

A character row has ~51 fields. Below is a complete, import-safe row. Fill the
fields that define a character; leave the rest at these defaults.

### Fields worth populating (they shape the character)
- `name`
- `roleInstruction` — the main definition; personality, appearance, speech,
  scenario, ending with two example lines (`{{char}}:` / `{{user}}:`).
- `reminderMessage` — short "stay in character" reminder, re-injected
  periodically. Good place for the per-message image directive (section 6).
- `generalWritingInstructions` — tone / POV / pacing / content rules.
- `imagePromptPrefix`, `imagePromptSuffix`, `imagePromptTriggers` (section 6).
- `initialMessages` — `[{ author: "ai", content: "<first message>" }]`.
- `metaTitle` (= name), `metaDescription` (a one-line tagline).
- `temperature` (0.8), `maxTokensPerMessage` (500),
  `textEmbeddingModelName` (`Xenova/bge-base-en-v1.5`),
  `fitMessagesInContextMethod` (`summarizeOld`), `modelName` (`perchance-ai`).
- `customData.isPersona` — `true` for the user's own character (section 5).

### Fields still to leave blank unless you know their purpose
`vitalWritingInstructions`, `vitalRoleInstructions`, `writingFormat`,
`petraCustomSecretInformation`. ACC leaves these empty by default and stuffing
them with restated role text tends to degrade output. (Several fields formerly
listed here — `roleplay1/2Instructions` and the `contextInfo*` family — are now
understood; see **§4a**.)

`avatar.url` cannot be set without an actual generated image; ACC shows a
default until the user generates one in-app. You *can* also set it at runtime
from `customCode` (`oc.character.avatar.url = ...`).

### 4a. Confirmed field semantics (from a real petrafied-acc export)
Inspecting a live share file resolved fields the section above previously told
you to leave blank. These are now safe to populate **deliberately** (keep them
off by default — they change behavior):

- **`roleplay1Instructions` / `roleplay2Instructions`** — named
  writing-instruction **presets**. `generalWritingInstructions` can be the
  literal string `"@roleplay1"`, which pulls in whatever `roleplay1Instructions`
  holds. So they are referenced by `@roleplayN`, not injected on their own.
- **`contextInfo` / `contextInfoPrompt` / `contextInfoToggle`** (plus the
  `detailedContextInfo*` trio) — a **running structured-context memory** channel,
  separate from RAG memories/summaries. `*Toggle` is `"yes"`/`"no"`; `*Prompt`
  is an extraction prompt ACC runs each turn to maintain a rolling state
  summary, and `contextInfo` holds the extracted text. The prompts use template
  placeholders **`{{InputInformation}}`** (the latest turn) and
  **`{{PreviousContextInformation}}`** (the prior summary) — write the prompt to
  merge them ("update the running notes: location, who is present, mood, open
  threads"). The `detailed*` variant is the heavier, per-character version.
- **`autoGenerateMemories`** — `"none"` disables; **`"v1"`** enables ACC's
  auto-memory generation.
- **`avatar.shape`** — accepts **`"portrait"`** as well as `"square"`/`"circle"`;
  **`avatar.size`** is a scale that can exceed 1 (e.g. `1.5`).
- **`messageWrapperStyle`** — **inline CSS** applied to the message bubble (e.g.
  `"backdrop-filter: blur(4px); border-radius: 5px;"`). Whitelist what you write
  here; treat it as a style-attribute value, never arbitrary markup.
- **`shortcutButtons`** — array of `{ name, message, insertionType: "replace",
  autoSend, clearAfterSend, type: "message" }`, rendered above the reply box.
  Wrapping reply text in `<...>` marks it as an editable placeholder.
- **`userCharacter`** — embeds the **persona**:
  `{ avatar, roleInstruction, reminderMessage }`. **`systemCharacter`** is
  `{ avatar, name }` (the narrator/system voice).
- **`scene.background.url` / `scene.music.url`** — confirmed in active use as
  hosted URLs (a default chat background image and an ambient music track).

### `customCode` — in-chat scripting (documented API)
The `customCode` field holds JavaScript that runs inside the chat, exposing an
`oc` object. This is documented Perchance behavior (per the community "Perchance
Code" reference), though specific properties can change over time.

- `oc.character` — read/edit the character: `name`, `roleInstruction`,
  `reminderMessage`, `initialMessages`, `customCode`, `avatar` (`url`, `size`,
  `shape`), `imagePromptPrefix`, `imagePromptSuffix`, `imagePromptTriggers`,
  `stopSequences`, and `customData` (with a `PUBLIC` sub-property shared via
  character-share URLs).
- `oc.thread` — the conversation: `name`, and `messages` (an array you can
  read/edit; each message has `content`, `author`, `expectsReply`,
  `wrapperStyle`, `id`).
- Event listener — the handler receives a destructured `{ message }`, can be
  `async`, and is awaited before the AI responds:

```javascript
oc.thread.on("MessageAdded", async ({ message }) => {
  // react to a new message; e.g. edit oc.thread.messages.at(-1).content
});
```

- AI helpers usable from custom code: `oc.getInstructCompletion({ instruction,
  startWith, stopSequences })` (the custom-code equivalent of the text plugin),
  and `oc.getMemories({ messageId })` (returns `memoriesUsed`, `loreEntriesUsed`,
  `summariesUsed`, `messagesUsed`).

If a handler triggers on message generation, debounce it (~500ms) so it doesn't
fire excessively. Leave `customCode` empty unless you specifically need scripted
behavior.

**Group-chat note (confirmed by community testing):** each character has its own
`customCode` block, but only the **main** character's block actually runs — its
`oc.thread.on("MessageAdded")` fires for messages from any character. There are
also reports that additional characters' lorebooks are not consulted. So
centralize all scripting and lore on the main character.

### Reusable builders (JavaScript, for the HTML panel)
```javascript
function uniqueId(seed){ return Date.now() + (seed*1000) + Math.floor(Math.random()*1000); }
function uniqueUuid(){
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : (Date.now() + "-" + Math.floor(Math.random()*1e9));
}

function characterRow(c, seed, isPersona){
  var now = Date.now() + seed;
  return {
    name: c.name || "Character",
    roleInstruction: c.roleInstruction || "",
    reminderMessage: isPersona ? "" : (c.reminder || ""),
    messageWrapperStyle: "", petraCustomSecretInformation: "",
    generalWritingInstructions: isPersona ? "" : (c.writing || ""),
    roleplay1Instructions: "", roleplay2Instructions: "",
    vitalWritingInstructions: "", vitalRoleInstructions: "", writingFormat: "",
    contextInfo: "", contextInfoPrompt: "", contextInfoToggle: "no",
    detailedContextInfo: "", detailedContextInfoPrompt: "", detailedContextInfoToggle: "no",
    imagePromptPrefix: c.imagePrefix || "",
    imagePromptSuffix: ", highly detailed, high quality (negativePrompt:::blurry, low quality, deformed, extra limbs, text, watermark)",
    imagePromptTriggers: c.appearance ? (c.name + ": " + c.appearance) : "",
    petraCustomLorebookUsageOptions: "default",
    fitMessagesInContextMethod: "summarizeOld",
    autoGenerateMemories: "none", maxParagraphCountPerMessage: 0,
    markForPersona: "no", userCharacterSelection: "", autoUpdatePersona: "no",
    customCode: "", messageInputPlaceholder: "",
    metaTitle: c.name || "", metaDescription: c.tagline || "", metaImage: "",
    modelName: "perchance-ai", temperature: 0.8, maxTokensPerMessage: 500,
    textEmbeddingModelName: "Xenova/bge-base-en-v1.5",
    initialMessages: isPersona ? [] : [ { author: "ai", content: c.firstMessage || "Hello." } ],
    shortcutButtons: [], loreBookUrls: [],
    avatar: { url: "", size: 1, shape: "square" },
    scene: { background: { url: "" }, music: { url: "" } },
    userCharacter: { avatar: {} },
    customData: { isPersona: !!isPersona },
    systemCharacter: { avatar: {} },
    streamingResponse: true, folderPath: "",
    uuid: uniqueUuid(), creationTime: now, lastMessageTime: now, id: uniqueId(seed)
  };
}

function buildDexie(rows){
  var t = [
    { name:"characters", schema:"++id,modelName,fitMessagesInContextMethod,uuid,creationTime,lastMessageTime,folderPath", rows: rows },
    { name:"threads", schema:"++id,name,characterId,creationTime,lastMessageTime,lastViewTime,folderPath", rows: [] },
    { name:"messages", schema:"++id,threadId,characterId,creationTime,order", rows: [] },
    { name:"misc", schema:"key", rows: [] },
    { name:"summaries", schema:"hash,threadId", rows: [] },
    { name:"memories", schema:"++id,[summaryHash+threadId],[characterId+status],[threadId+status],[threadId+index],threadId", rows: [] },
    { name:"lore", schema:"++id,bookId,bookUrl", rows: [] },
    { name:"textEmbeddingCache", schema:"++id,textHash,&[textHash+modelName]", rows: [] },
    { name:"textCompressionCache", schema:"++id,uncompressedTextHash,&[uncompressedTextHash+modelName+tokenLimit]", rows: [] }
  ];
  return JSON.stringify({
    formatName:"dexie", formatVersion:1,
    data: { databaseName:"chatbot-ui-v1", databaseVersion:90,
      tables: t.map(function(x){ return { name:x.name, schema:x.schema, rowCount:x.rows.length }; }),
      data: t.map(function(x){ return { tableName:x.name, inbound:true, rows:x.rows }; })
    }
  }, null, 1);
}

function downloadFile(name, text){
  var blob = new Blob([text], { type:"application/json" });
  var a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name.replace(/[^a-z0-9_\-]+/gi, "_") + ".json";
  document.body.appendChild(a); a.click();
  setTimeout(function(){ a.remove(); URL.revokeObjectURL(a.href); }, 100);
}
```

---

## 5. Persona (the user's own character)

Flag the user's character with `customData.isPersona: true`. A persona should
have **no** `initialMessages` (it does not greet) and generally no
`reminderMessage` / `generalWritingInstructions` (it does not generate the
AI's replies). It still benefits from `roleInstruction` and `appearance` so the
AI knows who it is talking to and can render the user in scenes.

---

## 6. Images

- `imagePromptPrefix` — prepended to every image prompt. Put the global art
  style plus the character's stable look here, e.g.
  `"anime artwork, masterpiece, red hair, green eyes, leather jacket, "`.
- `imagePromptSuffix` — appended. Quality tags plus a negative prompt in the
  form `(negativePrompt:::blurry, low quality, deformed, ...)`.
- `imagePromptTriggers` — `Name: description` lines that fire images on
  keywords.

### Full-scene image at the end of every message
This is **documented**: ACC's own docs say you can tell a character (via its
instruction or reminder) to use the image feature with the format
`<image>a description, art style, colors</image>`, and point to the built-in
"AI Artist" example character. Related documented commands: `/image` and
`/image --num=3` (and if you give no description after the command, ACC
generates one based on the current chat situation). To make the AI append a
full-scene image to each reply, put a directive in the character's
`generalWritingInstructions` **and** `reminderMessage`:

```
At the end of EVERY response, on its own final line, append exactly one image
tag describing the FULL current scene: the setting, every character present
with their established appearance, their actions and expressions, and the
lighting and mood. Format it as <image>a detailed description of the whole
scene</image>. Keep every character's look consistent with their description.
```

It still depends on the model obeying the instruction (not guaranteed every
turn); the `reminderMessage` copy is the stronger nudge. **For group chats, put
this directive on every non-persona character** (the exporter does this
automatically). A character responds with its own instruction/reminder when it
speaks, so each speaker needs the directive to emit its own scene image — do not
rely on the main character's directive covering the others. (Custom code is the
exception: only the main character's `customCode` block runs for the whole
group — confirmed by community testing — so any scripted behavior must live
there.)

### Writing good image prompts
This advice improves results regardless of the exact diffusion model and is
worth following:

- **Word order matters.** Lead with the subject, then the key action, then the
  critical style, then the context: *Subject → Action → Style → Context*.
- **Natural language beats bare keyword lists** for binding attributes to the
  right subject. Prefer "a tall woman with blue hair in a leather jacket" over
  "woman, blue hair, leather jacket".
- **Negative prompts — present but unreliable.** The `(negativePrompt:::...)`
  syntax appears in real ACC exports, but a community report (with the dev
  pinged) says current ACC may not parse it correctly. So don't rely on it to
  do work — lean on strong positive description, and treat the suffix's negative
  clause as a best-effort extra rather than a guarantee.

### Multi-character scenes — avoiding attribute bleed
Diffusion models often leak one character's attributes onto another (e.g. one
character's hair color appears on another's clothing). To reduce this:

- **Keep `imagePromptTriggers` to the body only** — physical appearance and
  clothing, no backgrounds, locations, or style words. Backgrounds belong in
  the prefix or the scene description.
- **Bind each attribute to its subject grammatically** rather than listing.
  - Weak: `Jax, Roxie, blue hair, red dress, leather jacket`
  - Strong: `Jax, who has blue hair and wears a leather jacket, stands beside
    Roxie, who has blonde hair and a red silk dress`
- **State spatial geometry** with explicit prepositions and verbs ("leaning
  against", "standing back-to-back with") so the model knows how bodies relate.
- **Globalize the background** via `imagePromptPrefix` (or the dynamic
  full-scene directive), keeping per-character triggers lightweight.

---

## 7. Lore

There are two paths, useful in different situations.

**A. Inline (simple, always works):** append world facts to the **main
character's** `roleInstruction` ("World facts:\n- ...\n- ..."). Best for a
handful of facts. They are always in context (no retrieval), at the cost of
context space.

**B. Native lorebook via URL (scalable):** ACC characters carry a
`loreBookUrls` array (confirmed in the character row). Each URL points to a
hosted plain-text lorebook that ACC retrieves from on demand. Best for large
worlds. Note: the raw `lore` *table* row shape is still unverified (section 9),
but the `loreBookUrls` URL path is the documented way to attach lore.

### How retrieval works (RAG)
ACC does not load the whole lorebook at once. It embeds recent chat messages
and the lore entries with `Xenova/bge-base-en-v1.5` (confirmed embedding
model), scores entries by semantic similarity, and injects only the
top-scoring entries that clear a relevance threshold. The exact threshold and
selection mechanics are reported, not independently confirmed — but writing for
"isolated, independently-retrievable chunks" is the right mental model
regardless.

### Structural formatting of a lorebook file
- **One idea per block** — each entry is a single self-contained paragraph.
- **Blank-line delimiter** — separate every entry with exactly one blank line;
  this is how the file is sliced into chunks.
- **Length** — keep each entry short and dense; aim under ~100 words, do not
  exceed ~150.
- **File type** — save as plain-text `.txt`.

### Writing rules for vector matching
Because entries are retrieved in isolation, normal prose-flow rules do not
apply:
- **No cross-entry pronouns.** An entry must not say "They also use fire magic"
  referring to a subject named only in another entry — the other entry may not
  be retrieved. Restate the subject.
- **Repeat the proper noun in every entry.** Three paragraphs about the "Galda
  Empire" should each contain the phrase "Galda Empire", so any one retrieved
  alone still has its subject.
- **Meaning over exact keywords.** Retrieval matches semantics, so write
  factually and densely; trim flowery filler that dilutes the core facts.
- Front-load the distinctive term a player is likely to type, to strengthen the
  match.

### Group chats
Only the **main** character's lorebook is reported to load, so place all shared
world lore and any guest-character secrets on the main character's
`loreBookUrls`.

### Hosting and refreshing (reported)
Lorebook URLs are static links to a text file, commonly hosted via
`perchance.org/upload`, Rentry.org, or Dropbox (change the link's `dl=0` to
`dl=1` for a direct file). Editing the source file does **not** update an
already-active chat automatically; the reported refresh flow is to type `/lore`
in chat, open "show character-specific lore", and click "Reload Lore URLs".
(The exact UI strings are reported, not confirmed here.)

---

## 8. Prompt patterns for generation

Build prompts in JS, output structured sections, parse with a robust parser.

- Open with a role ("You are a character designer for AI roleplay chat...").
- Provide SCENARIO and a short STORY-SO-FAR "bible" so later characters stay
  consistent.
- Request labeled sections and forbid extra text ("Output exactly these
  sections and nothing else").
- State the length target and "write all sections in full, then stop" to
  reduce truncation.

Recommended sections: `=== NAME ===`, `=== TAGLINE ===`,
`=== ROLE INSTRUCTION ===`, `=== REMINDER ===`, `=== FIRST MESSAGE ===`,
`=== APPEARANCE ===`, `=== WRITING INSTRUCTION ===`.

Robust parser (avoid greedy regex; handles missing sections):
```javascript
function getSection(label, text){
  var header = "=== " + label + " ===";
  var i = text.indexOf(header);
  if(i < 0) return "";
  var le = text.indexOf("\n", i);
  if(le < 0) return "";
  var rest = text.slice(le + 1);
  var n = rest.search(/\n===\s+[A-Z]/);
  if(n >= 0) rest = rest.slice(0, n);
  return rest.trim();
}
```

Instruction-following principles: one task per prompt; put the hard output
constraint last, stated positively and negatively ("Output ONLY the rewritten
text — no preamble, no quotes, no notes"); use primacy/recency by putting role
first and constraint last.

Keep each character's profile reasonably concise — community guidance suggests
roughly under 500 words for role instruction plus personality — so it fits
comfortably in context alongside the running conversation. This is a best
practice, not a tie to any specific (unverified) context-window figure.

---

## 9. Verified vs. unverified

**Verified** (from a real ACC export and/or Perchance's own docs): the Dexie
envelope shape; the 9 table names and schema strings; the character row fields
listed in section 4, including `loreBookUrls` (the documented way to attach a
lorebook by URL) and the embedding model `Xenova/bge-base-en-v1.5`; that all
declared tables need a `data[]` rows entry; that `customData.isPersona` exists;
the image prefix/suffix/trigger fields; `fitMessagesInContextMethod:
"summarizeOld"`, `modelName: "perchance-ai"`, `temperature 0.8`,
`maxTokensPerMessage 500`. The `customCode` `oc` API is documented:
`oc.character`, `oc.thread` (`name`, `messages`),
`oc.thread.on("MessageAdded", async ({ message }) => ...)`,
`oc.getInstructCompletion`, `oc.getMemories`, and message props (`content`,
`author`, `expectsReply`, `wrapperStyle`, `id`). Confirmed by community testing:
in a group chat only the **main** character's `customCode` block runs.

**Verified from a real petrafied-acc share export (see §4a, §13, §14):** the
`@roleplayN` preset reference via `generalWritingInstructions`; the
`contextInfo`/`detailedContextInfo` running-context channel (`*Toggle` yes/no,
`*Prompt` using `{{InputInformation}}`/`{{PreviousContextInformation}}`);
`autoGenerateMemories: "v1"`; `avatar.shape: "portrait"` and fractional
`avatar.size`; `messageWrapperStyle` as inline CSS; the `shortcutButtons` item
shape; `userCharacter` = persona `{avatar, roleInstruction, reminderMessage}`
and `systemCharacter` = `{avatar, name}`; `scene.background.url` /
`scene.music.url` as hosted URLs; the `{ addCharacter, quickAdd }` share-link
payload; and the `upload-plugin` → `user.uploads.dev` file-hosting path.

**Documented in ACC's own docs:** the inline `<image>...</image>` directive,
told to a character via its instruction or reminder (see the "AI Artist" example
character); the `/image` and `/image --num=N` commands, including
auto-description from the current chat when no text is given; the guidance to
keep a character's instruction under ~500 words and use a Lorebook beyond that;
and the reminder note's role for writing tips.

**Image negative prompts — present but unreliable:** the `(negativePrompt:::...)`
syntax appears in real exports, but a community report says current ACC may not
parse it correctly. Use positive description as the real lever.

**Unverified — confirm with a real export before relying on these:**
- `threads` guest/character array field name (for auto-building a group thread).
- `messages` row fields (`threadId`, `characterId`, `order`, content shape) as
  stored in the export (the `oc.thread.messages` runtime shape is documented; the
  exported table rows are not confirmed here).
- Exact behavior of `customData.isPersona` in-app and how a persona links to a
  thread.
- Native `lore` table row shape (the `loreBookUrls` path is documented; the raw
  table rows are not).
- Semantics of `vitalWritingInstructions` / `vitalRoleInstructions` and
  `writingFormat` (still undocumented). The `roleplay*` and `contextInfo*`
  families are now **confirmed** — see §4a.
- Per-turn reliability of the `<image>` directive (the feature is documented;
  whether the model appends one every single message is not guaranteed).
- Whether non-main characters' `generalWritingInstructions`/`reminderMessage`
  load when they speak in a group (each speaker uses its own instruction, so put
  shared directives on every character — but the auxiliary-field loading
  specifics are not confirmed).

**Reported but not independently confirmed here** (plausible, widely repeated —
use, but don't present as hard fact): the RAG relevance-threshold and
selective-injection mechanics; the `/lore` → "show character-specific lore" →
"Reload Lore URLs" refresh flow and other exact in-app UI strings; reports that
additional characters' lorebooks are not consulted in group chats.

**Community speculation, not official:** specific underlying model/context
claims (e.g. "DeepSeek-R1 on LLaMa, 8k context") and image model details
(e.g. "FLUX.1-schnell"). Do not state these as fact.

Because of the unverified items, do **not** auto-build group threads or seeded
messages. Import characters to the library and let the user assemble the group
in ACC (pencil icon above the reply box).

---

## 10. Robustness (HTML panel)

- **Persist state to `localStorage`** under a **versioned key** (e.g.
  `accWizardV3`). Multiple pasted generators at the same Perchance URL share
  storage; a stale, differently-shaped saved session can corrupt state.
- **Validate on load**: coerce types, null malformed objects, filter arrays.
- Provide a **"start over"** button that removes the key and resets.
- Never use `localStorage` inside Claude.ai artifacts; this guidance is for the
  live Perchance site only.

---

## 11. Minimal checklist for any new tool

1. Two blocks: data editor + HTML editor.
2. Build prompts in JS via `window.buildPrompt()`; no Perchance escaping.
3. Stream via hidden buffer + `onChunk` mirror to `activeOutputEl`.
4. Parse output with `getSection`.
5. Export via `characterRow` → `buildDexie([rows])` → `downloadFile`.
6. All 9 tables present; collision-proof `uuid`/`id`.
7. Persona flagged; scene directive on the main character; lore on main's role
   instruction.
8. Versioned `localStorage` + validation + reset.
9. Be honest about unverified fields; don't fabricate model details.

---

## 12. Data-editor list & logic syntax (traditional generators)

The character tools above build prompts in JavaScript, so they rarely need
Perchance's list-randomization syntax. But for generators that use the
data-editor's random-list features (or hybrids), here is the core syntax.

### Escapes (data editor)
- `\[` `\]` — literal square brackets; `\{` `\}` — literal curly braces.
- Alternatively, use HTML entities (`&#91;` and `&#93;` for `[` and `]`) to
  sidestep parsing issues.
- `\s` — forces a leading/trailing space (normally trimmed). Useful because
  list hierarchy depends on strict indentation (one tab or two spaces).
- `\t` — literal tab; `\\` — literal backslash.

### Conditional odds: `^[...]`
Append `^[expression]` to a list item to control how likely it is to be
selected. The expression can be math or a JS-style condition.

- Numeric weight: `^[age * 10]` (higher value = more likely).
- Boolean as 1/0: `^[age > 50]` → weight 1 if true, else 0.
- If/else: `^[if (race == "Elf") {0} else {1}]` makes the item impossible for
  Elves.
- Else-if chain:
  `^[if (race == "Elf") {0} else if (race == "Orc") {3} else {1}]`
- Operators inside conditions: `&&`, `||`, `==`, `!=`, `<`, `>`, e.g.
  `^[if (age > 18 && faction != "Outcast") {2} else {1}]`

Shorthand (cleaner than if/else):
- **Boolean multiply** — since true is 1 and false is 0, `^[(race == "Elf") * 8]`
  gives weight 8 when true and 0 when false. Equivalent to
  `^[if (race == "Elf") {8} else {0}]`.
- **Ternary** — `^[race == "Elf" ? 0 : 1]` for simple either/or weights.

### Unique selections (no repeats)
- `selectUnique(n)` — pick `n` distinct items from a list, then format with
  `joinItems`. Example in a text block:
  `[pronoun.selectUnique(2).joinItems("/")]` → e.g. `she/they`.
- `consumableList` — a list where each selected item is removed from the pool
  for the rest of that generation, so it can never repeat. Create with
  `myPool = animal.consumableList`, then each `[myPool.selectOne]` draws without
  replacement.

### Hierarchical lists & variable assignment
- Inline assignment: `[chosen = color.selectOne]` stores a pick in a variable
  you can reuse later in the same output with `[chosen]`.
- `.getName` returns the name of the parent branch a nested item came from.
  With a list `color` containing a branch `green` whose items include `lime`,
  `[c = color.selectOne, c.getName] [c]` can output the category and the item,
  e.g. `green lime`.

### Formatting helpers
- `joinItems("sep")` — join multiple selected items with a separator, e.g.
  `[trait.selectUnique(3).joinItems(", ")]`.
- `[this.selectAll.joinItems("")]` — dump an entire list into one string with no
  separator.
- `titleCase` — capitalize a list item's output, handy when a random word starts
  a sentence or when formatting image tags: `[listName.titleCase]`.

### Filtering out zero-odds items
`[listName.selectAll]` grabs every item regardless of its `^[...]` odds, so it
can return items whose odds are 0 under the current conditions. To build a pool
of only eligible items, use the filter-list plugin:

```
filterList = {import:filter-list-plugin}
```

then `[filterList(listName, item => item.getOdds > 0)]`, which is safe to call
`.selectUnique()` on. (The `getOdds` property name is reported, not confirmed
here — test it on a scratch generator.)

These are reported from community Perchance usage; verify exact behavior on a
test generator, since list-syntax details vary by feature version.

---

## 13. Additional Perchance plugins & browser APIs

Beyond `ai-text-plugin` and `text-to-image-plugin`, these are confirmed useful
for character tools.

### `upload-plugin` — host a file from the generator
```
uploader = {import:upload-plugin}

async uploadFile(blob) =>
  let r = await uploader(blob);     // r.url is the hosted file URL
  return (r && r.url) ? r.url : "";
```
Uploads a `Blob` to Perchance's file store and returns a
`https://user.uploads.dev/file/<uuid>` URL — no external host, no signup. Use it
to host **lorebook `.txt` files** (for `loreBookUrls`, §7) and **share files**
(§14) straight from the tool. The plugin runs in the **data editor**; call it
from HTML via a data-panel function and wrap it defensively (return `""`/an
error string on failure). A raw `POST` to the upload endpoint is rejected — go
through the plugin.

### Shared word banks — `{import:adjective|noun|verb}`
Perchance publishes reusable word-list generators you can import in the data
editor and sample from:
```
adjBank = {import:adjective}
nounBank = {import:noun}
verbBank = {import:verb}
// in a data-panel function:  adjBank.selectOne  → a random adjective
```
Useful for injecting fresh vocabulary variety into prompts (or in-chat writing
instructions). Pull a few words in HTML via a data-panel helper, and keep it
optional — wrap in try/catch and fall back to `""` so an import hiccup never
breaks generation. (Related list generator: `random-nouns-verbs-and-adjectives`.)

### `CompressionStream` — gzip in the browser (no plugin)
A standard browser API available on Perchance, used to gzip a share payload
before upload (§14):
```javascript
async function gzip(str){
  var cs = new CompressionStream("gzip");
  var stream = new Blob([str]).stream().pipeThrough(cs);
  return await new Response(stream).blob();   // gzipped Blob
}
```

### Device TTS — `speechSynthesis` (local-only)
The Web Speech API (`window.speechSynthesis`) speaks text with the **device's
own** neural voices — free, no signup, nothing sent to a server. Enumerate with
`speechSynthesis.getVoices()`; to keep it **fully local**, filter to
`voice.localService === true` (drops the cloud voices some browsers list).
Voices populate asynchronously, so also listen for the `voiceschanged` event.
This runs inside ACC from a character's `customCode` (§4), so each character can
pick its own local voice.

---

## 14. petrafied-acc & one-click share links

**petrafied-acc** (a community fork of ACC) reads the same `chatbot-ui-v1` Dexie
import format, so every export here imports into it unchanged. It also supports a
**share-link** loader of the form
`perchance.org/<generator>?data=<Name>~<uuid>.gz`.

To build such a link from a tool:

1. **Assemble the share payload** — *not* the full Dexie envelope (§3), but a
   single wrapper learned from a real share file:
   ```json
   { "addCharacter": { /* ~47 character fields */ }, "quickAdd": true }
   ```
   The inner object is the character row **minus** `$types`, `id`, and the
   timestamp fields, with `uuid` set to `null` and an added `folderName`. (The
   importing app assigns fresh identity on load — same collision-safety goal as
   §3, handled on the receiving side.)
2. **Serialize → gzip** the JSON with `CompressionStream` (§13).
3. **Upload** the gzipped `Blob` via `upload-plugin` (§13) → a
   `user.uploads.dev/file/<uuid>` URL.
4. **Assemble the link**: `perchance.org/<generator>?data=<Name>~<uuid>.gz`
   (the `<uuid>` is the uploaded file's id; default generator `petrafied-acc`).

Surface the raw uploaded-file URL too, as a fallback if the short-link format
drifts. The gzip round-trip and upload are confirmed; the final `?data=` parsing
lives in the target generator, so treat link reconstruction as **best-effort /
unverified live**.

**Hard limit — no live shared database.** A builder generator and petrafied-acc
sit on different Perchance subdomains (origins), so the browser same-origin
policy blocks writing directly into petrafied-acc's IndexedDB. File import and
share links are the connection; a seamless no-file handoff would require the
builder to live *inside* the target generator.

---

## §15 — September 2025 ACC Updates (research-sourced, not yet live-verified)

> **Source:** Deep web research 2026-06-18 against `perchance.org/ai-character-chat-docs`
> and community tools. Direct page fetch blocked by Cloudflare; findings from
> community reports and the Python `eeemoon/perchance` library source.
> **Verification status:** Unverified live — treat as "likely accurate, confirm in-app."

### New UI features (user-visible; may affect exported character behavior)

**Main Prompt Template editor**
Users can now edit the system prompt wrapper that ACC injects around character
definitions. This means `roleInstruction + reminderMessage + generalWritingInstructions`
may be interpreted in a custom wrapper rather than the default one. We have no
control over this from the builder side — just be aware that exported characters
may behave differently for users who have customized their template.

**Creativity slider**
Maps to `temperature`. Users can override the `temperature: 0.8` the wizard
exports on every character. If a user's slider is at maximum, the builder's
carefully-tuned temperature is irrelevant. No action needed on export side.

**Emdash fix**
The model no longer auto-inserts em-dashes. This is a prose quality improvement;
no change needed in the builder.

**Improved summarization**
`fitMessagesInContextMethod: "summarizeOld"` now works better. We already export
this value; the improvement is automatic.

### Expanded `customCode` capabilities

The character editor now supports custom code blocks with:
- **Internet access** (outbound HTTP from customCode)
- **3D/VR avatar** support
- **Voice** controls beyond speechSynthesis
- **JavaScript and Python execution**

This makes the immersion pack's `customCode` more powerful than described in §10.
The existing `customCode` format (serialized via `IMMERSION_FN.toString()`) still
works; the new capabilities are available if the code uses them. The browser API
calls in the current immersion block remain valid.

### API layer clarification (corrects §1 / §13 assumptions)

**The "Perchance 403s automation" claim is partially wrong:**
- The HTML/visual editor layer 403s browser automation — confirmed.
- The **API layer is publicly accessible:**
  - `/api/downloadGenerator` — returns a generator's raw data-panel source text.
    Has a backwards-compatibility guarantee. Callable via curl/Node.js/Python.
  - Image generation endpoint — independently callable (confirmed by
    `aein00/perchance-image-generator` CLI tool).
  - Python library `eeemoon/perchance` (`pip install perchance`) provides
    `TextGenerator` and `ImageGenerator` async clients.

**Practical implications for the builder:**
- CI verification of char-wiz-dat (plugin imports, syntax) is now viable without
  a browser — fetch via `/api/downloadGenerator`, run `getGeneratorsAndDependencies`.
- End-to-end generation tests are possible via `TextGenerator` in Python.
- The runtime-loader deploy path (§13) remains correct for the HTML panel.

### `stopSequences` — upgrade from Tier 3 to actionable

The `ai-text-plugin` `settings` block accepts `stopSequences: ["=== END ==="]`.
This gives deterministic output termination without relying on token-count
inference in prompt wording. Recommended for all generation calls in char-wiz-dat.
