#!/usr/bin/env node
// grade-generation.mjs — score the ACTUAL text a character generation produced.
//
// smoke.mjs proves the export *shape* is import-safe; this grades the *content*
// the AI wrote. Generation only runs inside Perchance, so feed this the
// `=== SECTION ===` block a character produced (copy it out of the output field,
// or out of an exported .json's roleInstruction-bearing text).
//
// Usage:
//   node test/grade-generation.mjs <file.txt>     grade one character file
//   cat out.txt | node test/grade-generation.mjs -  grade from stdin
//   node test/grade-generation.mjs                 run the grader's self-tests
//
// Exit code: 0 if grade is C or better (or self-tests pass), 1 otherwise.

import { readFileSync } from "node:fs";

// --- section parsing (matches the wizard's `=== LABEL ===` convention) --------
const LABELS = [
  "NAME", "TAGLINE", "ROLE INSTRUCTION", "REMINDER", "FIRST MESSAGE",
  "APPEARANCE", "DEFAULT OUTFIT", "WARDROBE", "IMAGE TRIGGERS", "WRITING INSTRUCTION",
];

function getSection(label, text) {
  // Non-greedy: capture from this header up to the next `=== ` header or EOF.
  const re = new RegExp(
    "===\\s*" + label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
    "\\s*===\\s*([\\s\\S]*?)(?=\\n===\\s|$)", "i"
  );
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// --- the rubric ---------------------------------------------------------------
// Each check returns { pass, detail }. Weighted equally; score = passed/total.
const RUBRIC = [
  ["name present", (c) => ({ pass: !!c.name, detail: c.name || "(missing)" })],
  ["name is name-like (<=5 words, no sentence punctuation)", (c) => {
    const ok = !!c.name && words(c.name) <= 5 && !/[.!?]/.test(c.name) && !/===/.test(c.name);
    return { pass: ok, detail: c.name ? `"${c.name}"` : "(missing)" };
  }],
  ["role instruction present", (c) => ({ pass: !!c.roleInstruction, detail: c.roleInstruction ? words(c.roleInstruction) + "w" : "(missing)" })],
  ["role instruction substantial (>=25w)", (c) => {
    const n = words(c.roleInstruction);
    return { pass: n >= 25, detail: n + "w" };
  }],
  ["role instruction within budget (<=500w)", (c) => {
    const n = words(c.roleInstruction);
    return { pass: n > 0 && n <= 500, detail: n + "w" + (n > 500 ? " (over budget)" : "") };
  }],
  ["first message present", (c) => ({ pass: !!c.firstMessage, detail: c.firstMessage ? words(c.firstMessage) + "w" : "(missing)" })],
  ["first message is in-character (dialogue or action)", (c) => {
    const ok = /["“”]/.test(c.firstMessage) || /\*[^*]+\*/.test(c.firstMessage);
    return { pass: ok, detail: ok ? "has quote/action" : "flat prose, no dialogue/*action*" };
  }],
  ["appearance present", (c) => ({ pass: !!c.appearance, detail: c.appearance ? "ok" : "(missing)" })],
  ["appearance has visual descriptors", (c) => {
    const commas = (c.appearance.match(/,/g) || []).length;
    const kw = /\b(hair|eyes?|skin|build|tall|short|scar|beard|freckl|complexion|jaw|frame|slender|muscular|lean)\b/i.test(c.appearance);
    const ok = !!c.appearance && (commas >= 1 || kw);
    return { pass: ok, detail: ok ? `${commas} descriptors${kw ? " + keywords" : ""}` : "no visual traits" };
  }],
  ["image triggers reference the character's name", (c) => {
    if (!c.imageTriggers || !c.name) return { pass: false, detail: "(missing triggers or name)" };
    const first = c.name.split(/\s+/)[0];
    const ok = new RegExp("\\b" + first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i").test(c.imageTriggers);
    return { pass: ok, detail: ok ? `mentions ${first}` : `triggers don't mention ${first}` };
  }],
  ["no leaked prompt/instruction text", (c) => {
    const leaks = [
      /===\s*END\s*===/i, /follow the USER/i, /USER'?S NOTES/i, /creative direction/i,
      /do not repeat/i, /begin each section/i, /add no preamble/i, /=== LABEL ===/i,
    ];
    const hit = leaks.find((re) => re.test(c.raw));
    return { pass: !hit, detail: hit ? "leaked: " + hit.source : "clean" };
  }],
  ["no unfilled placeholders", (c) => {
    // Strip valid ACC macros first — {{char}}, {{user}}, {{InputInformation}}
    // are legitimate double-brace tokens the AI is *supposed* to emit
    // (char-info §§ on persona/first-message), not unfilled scaffolding.
    const cleaned = c.raw.replace(/\{\{[^}]*\}\}/g, "");
    const ph = [/\[[^\]]*\]/, /\{[^}]*\}/, /\bTODO\b/i, /lorem ipsum/i, /<name>/i, /your character/i, /\bplaceholder\b/i];
    const hit = ph.find((re) => re.test(cleaned));
    return { pass: !hit, detail: hit ? "placeholder: " + (cleaned.match(hit) || [""])[0].slice(0, 30) : "none" };
  }],
];

export function parseCharacter(raw) {
  const c = { raw: raw || "" };
  for (const label of LABELS) {
    const key = label.toLowerCase().replace(/ (.)/g, (_, x) => x.toUpperCase());
    c[key] = getSection(label, raw);
  }
  // normalize the two-word keys our rubric uses
  c.roleInstruction = getSection("ROLE INSTRUCTION", raw);
  c.firstMessage = getSection("FIRST MESSAGE", raw);
  c.imageTriggers = getSection("IMAGE TRIGGERS", raw);
  return c;
}

export function gradeCharacter(raw) {
  const c = parseCharacter(raw);
  const checks = RUBRIC.map(([name, fn]) => {
    let r;
    try { r = fn(c); } catch (e) { r = { pass: false, detail: "check error: " + e.message }; }
    return { name, pass: !!r.pass, detail: r.detail };
  });
  const passed = checks.filter((x) => x.pass).length;
  const score = passed / checks.length;
  const grade = score >= 0.9 ? "A" : score >= 0.8 ? "B" : score >= 0.7 ? "C" : score >= 0.6 ? "D" : "F";
  return { score, grade, passed, total: checks.length, checks, name: c.name };
}

function report(raw, label) {
  const g = gradeCharacter(raw);
  const line = (x) => `  ${x.pass ? "PASS" : "FAIL"}  ${x.name}${x.detail ? "  —  " + x.detail : ""}`;
  console.log(`\n=== ${label || g.name || "character"} ===`);
  for (const x of g.checks) console.log(line(x));
  console.log(`  ----`);
  console.log(`  GRADE ${g.grade}  (${g.passed}/${g.total}, ${(g.score * 100).toFixed(0)}%)`);
  return g;
}

// --- self-tests (run when no input is given) ----------------------------------
const GOOD = `=== NAME ===
Mira Vance
=== TAGLINE ===
A weary smuggler with a soft spot for strays.
=== ROLE INSTRUCTION ===
Mira runs cargo through the outer rings and trusts no one on the first meeting. She is dry, quick-witted, and fiercely loyal once you earn it. {{char}} speaks in clipped sentences and deflects with humor when cornered. She is haunted by a job that went wrong and never talks about it directly. Keep her competent, guarded, and warm underneath. She notices small details and remembers slights. {{user}} is a new contact she is sizing up.
=== REMINDER ===
Stay guarded but fair; never break character or mention being an AI.
=== FIRST MESSAGE ===
*She leans against the airlock, arms crossed, and looks you over.* "You're late. Cargo doesn't wait, and neither do I. So — are we doing this, or did you just come to admire the view?"
=== APPEARANCE ===
short black hair, brown eyes, lean build, a thin scar across her left eyebrow, weathered flight jacket
=== DEFAULT OUTFIT ===
worn flight jacket, dark fitted trousers, scuffed boots
=== WARDROBE ===
flight jacket, fitted trousers, boots
formal jacket, clean shirt for station meetings
=== IMAGE TRIGGERS ===
Mira: short black hair, brown eyes, lean build, scar over left eyebrow
=== WRITING INSTRUCTION ===
Second person, terse and atmospheric. Two short paragraphs per reply.`;

const BAD = `=== NAME ===
This is a character who is brave and bold.
=== ROLE INSTRUCTION ===
He is cool.
=== FIRST MESSAGE ===
He stands there.
=== APPEARANCE ===
[describe appearance here]
=== WRITING INSTRUCTION ===
follow the USER'S NOTES above exactly and begin each section with its exact === LABEL ===
=== END ===`;

function selfTest() {
  console.log("Running grader self-tests (no input file given)...");
  const good = report(GOOD, "GOOD fixture");
  const bad = report(BAD, "BAD fixture");
  let fails = 0;
  const assert = (cond, msg) => { console.log(`\n  ${cond ? "PASS" : "FAIL"} - ${msg}`); if (!cond) fails++; };
  assert(good.grade === "A" || good.score >= 0.9, `good fixture scores A/>=90% (got ${good.grade} ${(good.score * 100).toFixed(0)}%)`);
  assert(bad.score <= 0.5, `bad fixture scores <=50% (got ${(bad.score * 100).toFixed(0)}%)`);
  assert(good.score - bad.score >= 0.4, "grader separates good from bad by >=40 points");
  console.log(fails ? `\n${fails} self-test failure(s)` : "\nall self-tests passed");
  return fails === 0;
}

// --- entry point --------------------------------------------------------------
const arg = process.argv[2];
let raw = null;
if (arg === "-") {
  raw = readFileSync(0, "utf8");
} else if (arg) {
  raw = readFileSync(arg, "utf8");
}

if (raw != null) {
  const g = report(raw, arg === "-" ? "stdin" : arg);
  process.exit(g.score >= 0.7 ? 0 : 1);
} else {
  process.exit(selfTest() ? 0 : 1);
}
