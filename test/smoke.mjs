// Smoke test for the AI Character Set Builder (char-wiz-html).
//
// This repo has no package manager: the wizard is a Perchance HTML panel whose
// logic only fully runs on perchance.org. But the export pipeline (the layer
// every change touches) is plain JS and can be exercised headlessly by
// extracting the panel's <script>, evaluating it against a minimal fake DOM,
// and driving the real export functions. This asserts the load-bearing
// contract: exports are import-safe ACC Dexie JSON, and the baked immersion
// customCode is valid JavaScript with a valid embedded CFG.
//
// Run: node test/smoke.mjs   (exit 0 = pass, non-zero = fail)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "char-wiz-html"), "utf8");

// Largest <script> block is the wizard logic.
let script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .sort((a, b) => b.length - a.length)[0];
if (!script) {
  console.error("FAIL - could not find wizard <script> block");
  process.exit(1);
}
// Drop the bottom-of-file load() call so we control evaluation.
script = script.replace(/\n\s*load\(\);\s*$/, "\n");

// ---- minimal fake DOM / globals the export path touches ----
const store = {};
const elements = {};
function fakeEl(id) {
  const attrs = {};
  return {
    get value() { return store[id] != null ? store[id] : ""; },
    set value(v) { store[id] = v; },
    style: {}, checked: false, options: [], selectedOptions: [],
    innerHTML: "", textContent: "", tabIndex: 0, offsetParent: null,
    appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
    getAttribute(k) { return attrs[k] != null ? attrs[k] : null; },
    setAttribute(k, v) { attrs[k] = String(v); },
    removeAttribute(k) { delete attrs[k]; },
    addEventListener() {}, removeEventListener() {}, focus() {},
  };
}
globalThis.window = {};
globalThis.document = {
  getElementById(id) { return (elements[id] ||= fakeEl(id)); },
  createElement() { return { style: {} }; },
  querySelector() { return null; }, querySelectorAll() { return []; },
  body: { appendChild() {} },
};
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
// Node 18+ provides a read-only global `crypto` with randomUUID(); the wizard uses it directly.
globalThis.alert = () => {};
globalThis.URL = { createObjectURL: () => "blob:x", revokeObjectURL() {} };
globalThis.Blob = function () {};

// Expose the real export pipeline (mirrors exportCombined) + config builders.
script += `
;globalThis.__I = immersion;
;globalThis.__cfg = function(){ return immersionConfig(castList()); };
;globalThis.__export = function(){
  var cast = castList();
  var immersionOn = immersion.enabled;
  var code = immersionOn ? buildImmersionCode(immersionConfig(cast)) : buildSceneCode(wardrobeMap(cast));
  var rows = cast.map(function(o,i){
    var r = withRels(withLore(characterRow(o.c, i+1, o.p, code), i===0));
    if(immersionOn && !o.p) r.customCode = code;
    r = o.p ? r : withPersona(r);
    return withOpeningScene(r, i===0 && !o.p, cast);
  });
  return buildDexie(rows);
};
;globalThis.__setBuildMode = function(m){ buildMode = m; };
;globalThis.__addExtra = function(out){ var i = extras.length; extras.push({ notes: "", out: out }); document.getElementById("exOut_" + i).value = out; };
;globalThis.__clearExtras = function(){ extras.length = 0; };
;globalThis.__validateCast = function(){ return validateCast(); };
;globalThis.__adv = advanced;
;globalThis.__charSeed = function(){ return charSeed(); };
;globalThis.__scenarioSeed = function(){ return scenarioSeed(); };
;globalThis.__rotatePool = function(p, b){ return rotatePool(p, b); };
;globalThis.__seedTone = SEED.tone;
;globalThis.__inspirationLine = function(){ return inspirationLine(); };
;globalThis.__buildShareJSON = function(){ return buildShareJSON(); };
;globalThis.__shareLink = function(u,n,g){ return shareLink(u,n,g); };
;globalThis.__tuning = tuning;
;globalThis.__uuidV4 = uuidV4;
`;
vm.runInThisContext(script, { filename: "char-wiz-html#script" });

// ---- assertions ----
let failures = 0;
function check(label, cond) {
  console.log((cond ? "PASS" : "FAIL") + " - " + label);
  if (!cond) failures++;
}
const charsOf = (json) => JSON.parse(json).data.data.find((t) => t.tableName === "characters").rows;

// A small cast: main + persona.
store.scenarioOut = "A cozy seaside town in summer.";
store.mainOut =
  "=== NAME ===\nNina\n=== TAGLINE ===\nThe cheerful cafe owner.\n" +
  "=== ROLE INSTRUCTION ===\nNina runs the seaside cafe.\n{{char}}: Welcome!\n{{user}}: Thanks.\n" +
  "=== REMINDER ===\nStay warm.\n=== FIRST MESSAGE ===\n*waves* Morning!\n" +
  "=== APPEARANCE ===\nbrown hair, freckles, brown eyes\n=== WARDROBE ===\nmustard cardigan, jeans\n" +
  "=== IMAGE TRIGGERS ===\nNina: brown hair, freckles\n=== WRITING INSTRUCTION ===\nWarm, second person.";
store.personaOut = "=== NAME ===\nAlex\n=== ROLE INSTRUCTION ===\nAlex is a visitor.\n=== APPEARANCE ===\nblack hair";
store.loreOut = "[Nina, cafe] Nina owns the Driftwood Cafe.\n[Festival] The Driftwood lantern festival is each summer.";

// 1) Plain export (immersion off): import-safe Dexie envelope.
globalThis.__I.enabled = false;
store.sceneMode = "both"; store.loreMode = "inline";
let j = JSON.parse(globalThis.__export());
check("valid dexie envelope", j.formatName === "dexie" && j.data.databaseName === "chatbot-ui-v1");
check("all 9 tables present in data[]", j.data.data.length === 9);
check("only characters table populated", j.data.data.every((t) => t.tableName === "characters" || t.rows.length === 0));
let chars = j.data.data.find((t) => t.tableName === "characters").rows;
check("2 character rows (main + persona)", chars.length === 2);
check("main has high-entropy uuid + numeric id", typeof chars[0].uuid === "string" && chars[0].uuid.length > 0 && typeof chars[0].id === "number");
check("persona flagged isPersona, no greeting", chars[1].customData.isPersona === true && chars[1].initialMessages.length === 0);
check("main carries scene customCode, persona none", /MessageAdded/.test(chars[0].customCode) && chars[1].customCode === "");
check("inline lore on main roleInstruction", /World facts:/.test(chars[0].roleInstruction) && /Driftwood Cafe/.test(chars[0].roleInstruction));
check("main loreBookUrls empty in inline mode", Array.isArray(chars[0].loreBookUrls) && chars[0].loreBookUrls.length === 0);

// 2) Lorebook-URL mode: loreBookUrls set, inline omitted.
store.loreMode = "url"; store.lorebookUrl = "https://example.org/driftwood-lorebook.txt";
let mUrl = charsOf(globalThis.__export())[0];
check("url mode sets loreBookUrls on main", mUrl.loreBookUrls.length === 1 && mUrl.loreBookUrls[0].includes("driftwood"));
check("url mode omits inline World facts", !/World facts:/.test(mUrl.roleInstruction));
store.loreMode = "inline";

// 3) Immersion export: baked customCode is valid JS with a valid CFG.
const I = globalThis.__I;
I.enabled = true; I.tts = true; I.avatars = true; I.backgrounds = true; I.memory = true;
I.avatarSet = { neutral: "https://x/n.png", happy: "https://x/h.png" };
I.bgSet = { cafe: "https://x/cafe.png" };
I.voices = { nina: { voiceURI: "urn:nina", voice: "Samantha", lang: "en-US" }, alex: { voiceURI: "urn:alex", voice: "Daniel", lang: "en-GB" } };
const cfg = globalThis.__cfg();
check("cfg.main is the main character", cfg.main === "nina");
check("cfg.features carries permanent features (no clothing)", cfg.features.nina === "brown hair, freckles, brown eyes" && !cfg.features.alex);
check("cfg.avatars.ref is the neutral reference portrait", cfg.avatars.ref === "https://x/n.png");
check("cfg.tts.voiceMap is per-character", !!cfg.tts.voiceMap.nina);
const im = charsOf(globalThis.__export());
check("immersion customCode only on non-persona", /var CFG =/.test(im[0].customCode) && im[1].customCode === "");
let parsed = false;
try { new vm.Script(im[0].customCode); parsed = true; } catch { parsed = false; }
check("baked immersion customCode parses as JavaScript", parsed);
let cfgJsonValid = false;
try {
  const embedded = im[0].customCode.match(/^var CFG = ([\s\S]*?);\n\(function/);
  const obj = JSON.parse(embedded[1]);
  cfgJsonValid = obj.main === "nina" && obj.tts.voiceMap.alex.lang === "en-GB";
} catch { cfgJsonValid = false; }
check("embedded CFG is valid JSON", cfgJsonValid);

// ---- regression cases for code-review findings #1-#5 ----

// #1: directive/off modes must still produce clothed images — the scene
// directive baked into reminderMessage must mention clothing. (generalWritingInstructions
// no longer duplicates it — SCENE_DIRECTIVE lives in reminderMessage only.)
globalThis.__I.enabled = false;
store.sceneMode = "directive";
let dir = charsOf(globalThis.__export())[0];
check("#1 scene directive requires clothing (no nudity in directive mode)",
  /clothing|wearing/i.test(dir.reminderMessage));
store.sceneMode = "both";

// #2: single build mode exports only the main (+ persona), not hidden extras.
globalThis.__clearExtras();
globalThis.__addExtra("=== NAME ===\nJax\n=== ROLE INSTRUCTION ===\nJax is a regular.\n=== FIRST MESSAGE ===\nHey.\n=== APPEARANCE ===\nblond hair");
globalThis.__setBuildMode("cast");
check("#2 cast mode exports the side character", charsOf(globalThis.__export()).some((r) => r.name === "Jax"));
globalThis.__setBuildMode("single");
let single = charsOf(globalThis.__export());
check("#2 single mode drops hidden side characters", !single.some((r) => r.name === "Jax"));
check("#2 single mode still exports main + persona", single.some((r) => r.name === "Nina") && single.some((r) => r.customData.isPersona));
globalThis.__setBuildMode("cast"); globalThis.__clearExtras();

// #3: appearance-lock matches names on word boundaries (no substring over-fire).
globalThis.__I.enabled = true;
check("#3 appearance-lock uses word-boundary name matching",
  charsOf(globalThis.__export())[0].customCode.includes("new RegExp("));
globalThis.__I.enabled = false;

// #4: duplicate-name check is among AI characters only; persona may share a name.
store.personaOut = "=== NAME ===\nNina\n=== ROLE INSTRUCTION ===\nThe player, also called Nina.";
check("#4 persona sharing the main's name does NOT block export", globalThis.__validateCast().every((s) => !/Duplicate/.test(s)));
globalThis.__addExtra("=== NAME ===\nNina\n=== ROLE INSTRUCTION ===\nA second Nina.\n=== FIRST MESSAGE ===\nHi.");
check("#4 two AI characters sharing a name IS flagged", globalThis.__validateCast().some((s) => /Duplicate/.test(s)));
globalThis.__clearExtras();
store.personaOut = "=== NAME ===\nAlex\n=== ROLE INSTRUCTION ===\nAlex is a visitor.\n=== APPEARANCE ===\nblack hair";

// #5: image-generation failures are reported, not masked as "done."
globalThis.window.genCharacterImage = async () => ""; // simulate unavailable plugin
globalThis.genCharacterImage = globalThis.window.genCharacterImage;
await globalThis.window.genExpressionAvatars();
check("#5 failed avatar generation reports an error, not 'done.'",
  /No images generated/i.test(elements["imAvatarBusy"].textContent));

// ---- Batch A: Character presentation (avatar shape/size, portrait, bg/music) ----
globalThis.__I.enabled = false;
// default: presentation off -> avatar stays default, scene empty.
let aOff = charsOf(globalThis.__export())[0];
check("Batch A off: avatar shape default square", aOff.avatar.shape === "square" && aOff.avatar.size === 1);
check("Batch A off: no static avatar url / scene background", !aOff.avatar.url && !aOff.scene.background.url);
// on: globals applied to every character.
const A = globalThis.__adv;
A.enabled = true; A.avatarShape = "circle"; A.avatarSize = 1.5;
A.portraits = { nina: "https://x/nina-portrait.png" };
A.bgUrl = "https://x/cafe-bg.png"; A.musicUrl = "https://x/ambient.mp3";
let aOn = charsOf(globalThis.__export());
check("Batch A on: avatar shape/size applied to all", aOn.every((r) => r.avatar.shape === "circle" && r.avatar.size === 1.5));
check("Batch A on: portrait set as the named character's avatar.url", aOn.find((r) => r.name === "Nina").avatar.url === "https://x/nina-portrait.png");
check("Batch A on: default background + music applied", aOn[0].scene.background.url === "https://x/cafe-bg.png" && aOn[0].scene.music.url === "https://x/ambient.mp3");
check("Batch A on: character without a portrait keeps empty avatar.url", aOn.find((r) => r.customData.isPersona).avatar.url === "");

// custom static per-character chat colors -> messageWrapperStyle
A.colors = { nina: "#ffd1dc" };
let col = charsOf(globalThis.__export());
check("chat color sets messageWrapperStyle on the matching character", /#ffd1dc/i.test(col.find((r) => r.name === "Nina").messageWrapperStyle));
check("chat color leaves uncolored characters' messageWrapperStyle empty", col.find((r) => r.customData.isPersona).messageWrapperStyle === "");
check("invalid color value is ignored (no CSS injection)", (() => { A.colors = { nina: "red; }evil{" }; return charsOf(globalThis.__export()).find((r) => r.name === "Nina").messageWrapperStyle === ""; })());
A.colors = {}; A.enabled = false;

// context-driven expressions: immersion runtime classifies emotion from the scene call.
globalThis.__I.enabled = true; globalThis.__I.avatars = true;
globalThis.__I.avatarSet = { neutral: "https://x/n.png", happy: "https://x/h.png" };
let imc = charsOf(globalThis.__export())[0].customCode;
check("expression: runtime parses a bracketed emotion from the scene call", /neutral\|happy\|sad\|angry\|surprised\|shy/.test(imc) && /setAvatarTo/.test(imc));
globalThis.__I.enabled = false;

// vocabulary/variety: {a|b|c} seeds expand to one choice (no literal braces leak to the model).
const seedSamples = Array.from({ length: 20 }, () => globalThis.__charSeed() + globalThis.__scenarioSeed());
check("variety seeds expand fully (no leftover { | } reach the prompt)", seedSamples.every((s) => !/[{}|]/.test(s)));
check("variety seeds actually vary across runs", new Set(seedSamples).size > 1);
check("variety seeds carry the prose-quality directive", globalThis.__charSeed().includes("vivid active verbs"));
// exported character carries the vocabulary directive (improves in-chat prose).
let voc = charsOf(globalThis.__export())[0];
check("exported character's writing instructions use grounded prose directive",
  /vivid active verbs/.test(voc.generalWritingInstructions) && /specific nouns/.test(voc.generalWritingInstructions));

// 4-hour rotation: a large pool keeps a rotating ~60% active subset that swaps per window.
const fullTone = globalThis.__seedTone.replace(/[{}]/g, "").split("|");
const win1 = globalThis.__rotatePool(globalThis.__seedTone, 1000).replace(/[{}]/g, "").split("|");
const win2 = globalThis.__rotatePool(globalThis.__seedTone, 1001).replace(/[{}]/g, "").split("|");
check("rotation keeps a strict subset of a large pool", win1.length < fullTone.length && win1.length >= 4);
check("rotation active subset differs between 4h windows", win1.join("|") !== win2.join("|"));
check("rotation is deterministic for the same window", globalThis.__rotatePool(globalThis.__seedTone, 1000).replace(/[{}]/g, "") === win1.join("|"));
check("rotated subset uses only real pool members (no invented words)", win1.every((w) => fullTone.includes(w)));
check("small pools (<=4 options) are left fully active", globalThis.__rotatePool("{a|b|c}", 5) === "{a|b|c}");

// Perchance word-bank integration: optional + cached per 4h window.
check("word-bank line is empty when the data-panel bank is unavailable (graceful)", globalThis.__inspirationLine() === "");
let _ls = {};
globalThis.localStorage = { getItem: (k) => (k in _ls ? _ls[k] : null), setItem: (k, v) => { _ls[k] = String(v); }, removeItem: (k) => { delete _ls[k]; } };
let _calls = 0;
globalThis.wordBank = (type, count) => Array.from({ length: count || 3 }, () => type + "_" + (_calls++)).join("|");
let insp1 = globalThis.__inspirationLine();
let insp2 = globalThis.__inspirationLine();
check("word-bank words appear as optional flavor when available", /fresh words/i.test(insp1) && /adjective_/.test(insp1));
check("word-bank words are cached per 4h window (stable within the window)", insp1 === insp2);

// One-click share: build the petrafied-acc share JSON + assemble the link.
let share = JSON.parse(globalThis.__buildShareJSON());
check("share JSON is { addCharacter, quickAdd:true }", share.quickAdd === true && share.addCharacter && share.addCharacter.name === "Nina");
check("share addCharacter drops export-only fields ($types/id/timestamps)", !("$types" in share.addCharacter) && !("id" in share.addCharacter) && !("creationTime" in share.addCharacter));
check("share addCharacter sets uuid:null + folderName (matches real export shape)", share.addCharacter.uuid === null && share.addCharacter.folderName === "");
check("share addCharacter keeps real character content", /Nina/.test(share.addCharacter.roleInstruction) && typeof share.addCharacter.roleInstruction === "string");
check("share link matches petrafied-acc ?data=Name~uuid.gz format",
  globalThis.__shareLink("https://user.uploads.dev/file/abc123def.gz", "Zhila Yanna", "petrafied-acc") === "https://perchance.org/petrafied-acc?data=Zhila_Yanna~abc123def.gz");
check("share link target generator is configurable", /\/ai-character-chat\?data=/.test(globalThis.__shareLink("https://user.uploads.dev/file/x.gz", "Bob", "ai-character-chat")));

// Batch B: model & memory tuning.
const T = globalThis.__tuning;
// off by default -> export unchanged (temp 0.8, 800 tok for AI char, autoMemory none, no context prompts).
T.enabled = false;
let tOff = charsOf(globalThis.__export())[0];
check("tuning off: defaults unchanged (temp 0.8, 800 tok, autoMemory none)", tOff.temperature === 0.8 && tOff.maxTokensPerMessage === 800 && tOff.autoGenerateMemories === "none");
check("tuning off: no context-tracking prompt", tOff.contextInfoToggle !== "yes");
check("tuning off: built-in writing instructions (not @roleplay)", !/^@roleplay/.test(tOff.generalWritingInstructions));
// on -> knobs applied to AI characters; persona untouched.
T.enabled = true; T.temperature = 1.1; T.maxTokens = 600; T.maxParas = 4; T.autoMemory = "v1"; T.contextTracking = "detailed"; T.writingPreset = "roleplay1";
let rows = charsOf(globalThis.__export());
let main = rows.find((r) => !r.customData.isPersona), persona = rows.find((r) => r.customData.isPersona);
check("tuning on: temperature/maxTokens/maxParas applied to AI character", main.temperature === 1.1 && main.maxTokensPerMessage === 600 && main.maxParagraphCountPerMessage === 4);
check("tuning on: autoGenerateMemories v1", main.autoGenerateMemories === "v1");
check("tuning on: context tracking sets contextInfoPrompt + toggles", main.contextInfoToggle === "yes" && /Location:/.test(main.contextInfoPrompt) && main.detailedContextInfoToggle === "yes" && /per-character/.test(main.detailedContextInfoPrompt));
check("tuning on: @roleplay1 writing preset used", /^@roleplay1/.test(main.generalWritingInstructions));
check("tuning never alters the persona", persona.temperature === 0.8 && persona.contextInfoToggle !== "yes" && !/^@roleplay/.test(persona.generalWritingInstructions||""));
T.enabled = false; T.writingPreset = "builtin"; T.contextTracking = "off";

// Perchance evaluates [..] / {..|..} template expressions in HTML *markup*
// (placeholders, hint text, attributes) — but not inside <script>/<style>.
// HTML-entity escaping (&#91; …) is NOT reliably honored, so the rule for this
// tool is: keep ALL square brackets and braces out of the markup entirely —
// reword the copy, or set bracket-containing placeholders from <script> (which
// Perchance never templates). Guard the markup region (everything before the
// first <script>) against any bracket/brace, raw or entity-escaped.
const markup = html.slice(0, html.indexOf("<script>"));
const badBracket = markup.match(/\[[^\]\n]+\]/g) || [];
const badBrace = markup.match(/\{[^}\n]*\|[^}\n]*\}/g) || [];
const badEntity = markup.match(/&#(91|93|123|125|124);/g) || [];
check("no unescaped [..] template expressions in HTML markup", badBracket.length === 0);
check("no unescaped {a|b|c} template expressions in HTML markup", badBrace.length === 0);
check("no entity-escaped brackets/braces in HTML markup (use <script> instead)", badEntity.length === 0);

// 9) Review pass: the in-browser window.gradeCharacter port must track the node
// grader (test/grade-generation.mjs) — strong on a good character, weak on a bad
// one, and persona-aware (no first-message penalty).
const GOOD_CHAR =
  "=== NAME ===\nMira Vance\n=== TAGLINE ===\nA weary smuggler.\n" +
  "=== ROLE INSTRUCTION ===\nMira runs cargo through the outer rings and trusts no one on the first meeting. She is dry, quick-witted, and fiercely loyal once you earn it. {{char}} speaks in clipped sentences and deflects with humor when cornered. She is haunted by a job that went wrong. Keep her competent, guarded, and warm underneath. {{user}} is a new contact she is sizing up.\n" +
  "=== REMINDER ===\nStay guarded but fair.\n=== FIRST MESSAGE ===\n*She leans against the airlock.* \"You're late. Cargo doesn't wait.\"\n" +
  "=== APPEARANCE ===\nshort black hair, brown eyes, lean build, a thin scar across her left eyebrow\n" +
  "=== DEFAULT OUTFIT ===\nworn flight jacket, dark trousers\n=== WARDROBE ===\nflight jacket, trousers, boots\n" +
  "=== IMAGE TRIGGERS ===\nMira: short black hair, brown eyes, lean build\n=== WRITING INSTRUCTION ===\nSecond person, terse.";
const BAD_CHAR =
  "=== NAME ===\nThis is a character who is brave and bold.\n=== ROLE INSTRUCTION ===\nHe is cool.\n" +
  "=== FIRST MESSAGE ===\nHe stands there.\n=== APPEARANCE ===\n[describe appearance here]\n" +
  "=== WRITING INSTRUCTION ===\nfollow the USER'S NOTES above and begin each section with its === LABEL ===\n=== END ===";
const gGood = globalThis.window.gradeCharacter(GOOD_CHAR, {});
const gBad = globalThis.window.gradeCharacter(BAD_CHAR, {});
check("gradeCharacter scores a strong character A/B (>=80%)", gGood.score >= 0.8 && /[AB]/.test(gGood.grade));
check("gradeCharacter scores a weak character low (<=50%)", gBad.score <= 0.5);
check("gradeCharacter separates good from bad by >=40 points", gGood.score - gBad.score >= 0.4);
const gPersona = globalThis.window.gradeCharacter(store.personaOut, { persona: true });
check("gradeCharacter persona mode drops the first-message checks", gPersona.checks.every((x) => x.section !== "FIRST MESSAGE"));

// 10) UUID fallback: the getRandomValues path must emit a conformant RFC-4122 v4
// (the old "timestamp-random" fallback was not, and Dexie can reject it).
const v4re = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const u1 = globalThis.__uuidV4(), u2 = globalThis.__uuidV4();
check("uuidV4 fallback is RFC-4122 v4 shaped", v4re.test(u1) && v4re.test(u2));
check("uuidV4 fallback is unique across calls", u1 !== u2);

console.log("\n" + (failures ? failures + " FAILURE(S)" : "all checks passed"));
process.exit(failures ? 1 : 0);
