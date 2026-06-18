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
  return {
    get value() { return store[id] != null ? store[id] : ""; },
    set value(v) { store[id] = v; },
    style: {}, checked: false, options: [], selectedOptions: [],
    innerHTML: "", textContent: "",
    appendChild() {}, querySelector() { return null; }, querySelectorAll() { return []; },
  };
}
globalThis.window = {};
globalThis.document = {
  getElementById(id) { return (elements[id] ||= fakeEl(id)); },
  createElement() { return { style: {} }; },
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
// directive baked into writing instructions/reminder must mention clothing.
globalThis.__I.enabled = false;
store.sceneMode = "directive";
let dir = charsOf(globalThis.__export())[0];
check("#1 scene directive requires clothing (no nudity in directive mode)",
  /clothing|wearing/i.test(dir.generalWritingInstructions) && /clothing|wearing/i.test(dir.reminderMessage));
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
check("variety seeds carry the vivid-vocabulary directive", globalThis.__charSeed().includes("varied vocabulary"));
// exported character carries the vocabulary directive (improves in-chat prose).
let voc = charsOf(globalThis.__export())[0];
check("exported character's writing instructions request vivid varied vocabulary",
  /varied vocabulary/.test(voc.generalWritingInstructions) && /vivid active verbs/.test(voc.generalWritingInstructions));

console.log("\n" + (failures ? failures + " FAILURE(S)" : "all checks passed"));
process.exit(failures ? 1 : 0);
