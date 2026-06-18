// Diagnostic: does clicking the scenario/character buttons throw?
// Runs the real char-wiz-html <script> against a fake DOM, runs load(), then
// invokes the click handlers and the data-panel contract (buildWizardPrompt).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "char-wiz-html"), "utf8");
let script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1]).sort((a, b) => b.length - a.length)[0];

// fake DOM that auto-vivifies any element id (so missing-node throws can't hide)
const store = {};
const elements = {};
function fakeEl(id) {
  const e = {
    _id: id, style: {}, checked: false, options: [], selectedOptions: [],
    innerHTML: "", textContent: "", className: "", placeholder: "", disabled: false,
    children: [], dataset: {},
    get value() { return store[id] != null ? store[id] : ""; },
    set value(v) { store[id] = v; },
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    removeChild() {}, replaceChild() {}, remove() {},
    setAttribute() {}, getAttribute() { return null; }, addEventListener() {},
    querySelector() { return null; }, querySelectorAll() { return []; },
    closest() { return null; }, focus() {}, select() {}, click() {},
    getBoundingClientRect() { return { top: 0, bottom: 0, height: 0 }; },
  };
  return e;
}
globalThis.window = {};
globalThis.document = {
  getElementById(id) { return (elements[id] ||= fakeEl(id)); },
  querySelector() { return null; }, querySelectorAll() { return []; },
  createElement() { return fakeEl("_new"); },
  createElementNS() { return fakeEl("_ns"); },
  body: fakeEl("body"), head: fakeEl("head"),
  addEventListener() {},
};
globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
globalThis.alert = (m) => { console.log("   [alert]", m); };
globalThis.URL = { createObjectURL: () => "blob:x", revokeObjectURL() {} };
globalThis.Blob = function () {};
try { Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText() {} } }, configurable: true }); } catch (e) {}
globalThis.setTimeout = (f) => { try { f(); } catch (e) {} return 0; };
globalThis.setInterval = () => 0;

// stub the data-panel function the HTML calls
let generateCalls = 0;
globalThis.generate = function () { generateCalls++; };
globalThis.genCharacterImage = async () => "";
globalThis.wordBank = () => "";
globalThis.uploadShare = async () => "";

function run(label, fn) {
  try { fn(); console.log(`PASS  ${label}`); }
  catch (e) { console.log(`THROW ${label}\n      -> ${e && e.stack ? e.stack.split("\n").slice(0,3).join("\n      ") : e}`); }
}

// 1) evaluate the whole script (this also runs setSafeHints() + load() at the end)
run("evaluate script + setSafeHints() + load()", () => {
  vm.runInThisContext(script, { filename: "char-wiz-html#script" });
});

// 2) the data-panel contract: buildWizardPrompt() for each section
const sections = ["scenario", "main", "extra", "persona", "lore", "opening", "consistency"];
for (const sec of sections) {
  run(`buildWizardPrompt() activeSection=${sec}`, () => {
    window.activeSection = sec; window.refineMode = false; window.rerollInfo = null;
    window.activeExtraIndex = 0;
    const p = window.buildWizardPrompt();
    if (typeof p !== "string") throw new Error("returned " + typeof p);
  });
}

// 3) actually click the buttons
run("click genScenario(false)", () => { const b = generateCalls; window.genScenario(false); if (generateCalls === b) throw new Error("generate() was NOT called"); });
run("click genChar('main', false)", () => { const b = generateCalls; window.genChar("main", false); if (generateCalls === b) throw new Error("generate() was NOT called"); });
run("click genChar('persona', false)", () => { const b = generateCalls; window.genChar("persona", false); if (generateCalls === b) throw new Error("generate() was NOT called"); });

console.log(`\ngenerate() total calls: ${generateCalls}`);
