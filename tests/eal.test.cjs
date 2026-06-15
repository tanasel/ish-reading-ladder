"use strict";
// Self-contained tests — no browser, no deps. Loads the IIFE modules into a
// fake `window` and exercises the prompt builder, JSON auto-repair and export.
//   node --test tests/eal.test.cjs
const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..");
const win = {};
const doc = { querySelector: () => null, createElement: () => ({ appendChild() {}, setAttribute() {}, addEventListener() {} }) };

function load(file) {
  const code = fs.readFileSync(path.join(DIR, file), "utf8");
  // eslint-disable-next-line no-new-func
  new Function("window", "document", "navigator", code)(win, doc, {});
}
["levels.js", "prompt.js", "schema.js", "render.js", "data.js"].forEach(load);

const Levels = win.EALLevels;
const Prompt = win.EALPrompt;
const Schema = win.EALSchema;
const Render = win.EALRender;
const Sample = win.EAL_SAMPLE;

const threeLevels = Levels.DEFAULTS.slice(0, 3).map((l) => ({ phase: l.phase, cefr: l.cefr, audience: l.audience, guidance: l.guidance }));

test("levels: defaults + original have required fields", () => {
  Levels.DEFAULTS.concat([Levels.ORIGINAL]).forEach((l) => {
    assert.ok(l.id && l.phase && l.cefr && l.audience && l.guidance, "level missing a field: " + JSON.stringify(l));
  });
  assert.equal(Levels.byId("orig").phase, "Original");
  assert.equal(Levels.byId("nope"), null);
});

test("prompt: embeds source text, level names and exact count", () => {
  const p = Prompt.buildPrompt({
    title: "Photosynthesis", topic: "Science", year: "Year 8",
    sourceText: "Plants make food using sunlight in a UNIQUEMARKER process.",
    levels: threeLevels,
    outputs: { glossary: true, questions: true, starters: true },
  });
  assert.ok(p.includes("UNIQUEMARKER"), "source text not embedded");
  assert.ok(p.includes("ish-eal@1"), "schema label missing");
  assert.ok(p.includes(threeLevels[0].phase) && p.includes(threeLevels[2].phase), "level labels missing");
  assert.ok(p.includes("exactly 3 entries"), "level count not stated");
  assert.ok(p.trim().endsWith("ONLY the JSON object."), "prompt should end with the JSON instruction");
});

test("prompt: respects output toggles and home language", () => {
  const off = Prompt.buildPrompt({ levels: threeLevels, outputs: { glossary: false, questions: false, starters: false } });
  assert.ok(!/Glossary: \d+ words per level/.test(off), "glossary rule leaked when off");
  assert.ok(!/Questions: \d+ per level/.test(off), "questions rule leaked when off");
  const on = Prompt.buildPrompt({ levels: threeLevels, outputs: { glossary: true, questions: true, starters: true }, homeLanguage: "Ukrainian" });
  assert.ok(on.includes("Ukrainian"), "home language not included");
  assert.ok(on.includes("translation"), "translation field missing when home language set");
});

test("schema: clean JSON validates and counts levels", () => {
  const res = Schema.validatePackText(JSON.stringify(Sample.pack));
  assert.equal(res.ok, true, "sample should validate; error=" + res.error);
  assert.equal(res.pack.levels.length, 3);
  assert.equal(res.unusable.length, 0);
});

test("schema: computes wordCount when missing/zero", () => {
  const res = Schema.validatePackText(JSON.stringify(Sample.pack));
  res.pack.levels.forEach((l) => assert.ok(l.wordCount > 0, l.phase + " wordCount not computed"));
  // lower levels should be shorter than the most advanced one
  assert.ok(res.pack.levels[0].wordCount < res.pack.levels[2].wordCount, "Phase 1 should be shorter than Phase 3");
});

test("schema: strips code fences and surrounding prose", () => {
  const wrapped = "Sure! Here is your JSON:\n```json\n" + JSON.stringify(Sample.pack) + "\n```\nHope that helps!";
  const res = Schema.validatePackText(wrapped);
  assert.equal(res.ok, true, "should recover from fenced + prose reply");
  assert.equal(res.pack.levels.length, 3);
});

test("schema: fixes smart quotes and trailing commas", () => {
  const dirty = '{ “schema”:“ish-eal@1”, “meta”:{ “title”:“T”, }, “levels”:[ { “phase”:“P1”, “passage”:“Hi there.”, }, ] }';
  const res = Schema.validatePackText(dirty);
  assert.equal(res.ok, true, "should repair smart quotes + trailing commas; error=" + res.error);
  assert.equal(res.pack.levels[0].passage, "Hi there.");
});

test("schema: flags a level with no passage as unusable", () => {
  const bad = { schema: "ish-eal@1", meta: { title: "x" }, levels: [{ phase: "P1", passage: "ok text" }, { phase: "P2", passage: "" }] };
  const res = Schema.validatePackText(JSON.stringify(bad));
  assert.equal(res.unusable.length, 1);
  assert.equal(res.unusable[0].index, 1);
});

test("schema: clamps invalid question type to literal", () => {
  const pk = { schema: "ish-eal@1", meta: { title: "x" }, levels: [{ phase: "P1", passage: "t", questions: [{ q: "Q?", type: "weird", answer: "A" }] }] };
  const res = Schema.validatePackText(JSON.stringify(pk));
  assert.equal(res.pack.levels[0].questions[0].type, "literal");
});

test("schema: malformed input fails gracefully", () => {
  const res = Schema.validatePackText("this is not json at all");
  assert.equal(res.ok, false);
  assert.ok(res.error, "should report an error");
});

test("render: plain-text export contains passage, glossary, questions, starters", () => {
  const res = Schema.validatePackText(JSON.stringify(Sample.pack));
  const txt = Render.packToPlainText(res.pack);
  assert.ok(txt.includes("The Water Cycle"), "title missing");
  assert.ok(txt.includes("KEY WORDS"), "glossary heading missing");
  assert.ok(txt.includes("COMPREHENSION"), "questions heading missing");
  assert.ok(txt.includes("SENTENCE STARTERS"), "starters heading missing");
  const one = Render.levelToPlainText(res.pack.levels[0]);
  assert.ok(one.includes("Phase 1"), "level label missing in single export");
});

test("prompt: summary instruction present by default and omitted when off", () => {
  const def = Prompt.buildPrompt({ levels: threeLevels, outputs: { glossary: true, questions: true, starters: true } });
  assert.ok(/Summary: 2-3 short sentences/.test(def), "summary rule missing by default");
  assert.ok(def.includes('"summary"'), "summary schema field missing by default");
  const off = Prompt.buildPrompt({ levels: threeLevels, outputs: { summary: false, glossary: true, questions: true, starters: true } });
  assert.ok(!/Summary: 2-3 short sentences/.test(off), "summary rule leaked when off");
});

test("schema: ignores the AI's wordCount and recomputes from the passage", () => {
  const pk = { schema: "ish-eal@1", meta: { title: "x" }, levels: [{ phase: "P1", passage: "one two three", wordCount: 999 }] };
  const res = Schema.validatePackText(JSON.stringify(pk));
  assert.equal(res.pack.levels[0].wordCount, 3, "should recompute, not trust 999");
});

test("schema: normalises and exports a per-level summary", () => {
  const res = Schema.validatePackText(JSON.stringify(Sample.pack));
  assert.ok(res.pack.levels[0].summary && res.pack.levels[0].summary.length > 0, "summary not kept");
  const txt = Render.packToPlainText(res.pack);
  assert.ok(txt.includes("IN SHORT:"), "summary not in export");
});

test("schema: prefers the real answer over a format-example object that comes first", () => {
  const fmt = '{ "schema":"ish-eal@1", "levels":[ {"phase":"FORMAT EXAMPLE","passage":"this is just the shape I will use"} ] }';
  const reply = "First, here is the format I'll follow:\n" + fmt + "\nNow here is your result:\n" + JSON.stringify(Sample.pack);
  const res = Schema.validatePackText(reply);
  assert.equal(res.pack.levels.length, 3, "should pick the real 3-level answer, not the example");
  assert.equal(res.pack.levels[0].phase, "Phase 1", "picked the format example instead of the answer");
});

test("schema: trailing prose after a closing code fence does not break parsing", () => {
  const reply = "```json\n" + JSON.stringify(Sample.pack) + "\n```\nLet me know if you'd like any changes!";
  const res = Schema.validatePackText(reply);
  assert.equal(res.ok, true, "should parse fenced JSON with trailing prose; error=" + res.error);
  assert.equal(res.pack.levels.length, 3);
});

test("schema: rejects an oversized reply instead of freezing", () => {
  const huge = '{"schema":"ish-eal@1","levels":[{"phase":"P","passage":"' + "x".repeat(220000) + '"}]}';
  const res = Schema.validatePackText(huge);
  assert.equal(res.ok, false);
  assert.match(res.error, /large/i);
});

test("schema: picks the real answer even when a format example comes AFTER it", () => {
  const fmt = '{ "schema":"ish-eal@1", "levels":[ {"phase":"FORMAT EXAMPLE","passage":"shape only"} ] }';
  const reply = "Here is your result:\n" + JSON.stringify(Sample.pack) + "\n(For reference, the format was:\n" + fmt + ")";
  const res = Schema.validatePackText(reply);
  assert.equal(res.pack.levels.length, 3, "scoring should beat a 1-level example regardless of position");
  assert.equal(res.pack.levels[0].phase, "Phase 1");
});

test("schema: a trailing comma is fixed without mangling curly quotes inside a string", () => {
  const dirty = '{ "schema":"ish-eal@1", "meta":{"title":"T"}, "levels":[ { "phase":"P1", "passage":"She said “hello” today.", } ] }';
  const res = Schema.validatePackText(dirty);
  assert.equal(res.ok, true, "should repair the trailing comma; error=" + res.error);
  assert.ok(res.pack.levels[0].passage.indexOf("“hello”") >= 0, "in-string curly quotes must be preserved");
});

test("render: levelToPlainText omits the answer key for student-facing exports", () => {
  const res = Schema.validatePackText(JSON.stringify(Sample.pack));
  const lvl = res.pack.levels[0];
  const teacher = Render.levelToPlainText(lvl);
  const student = Render.levelToPlainText(lvl, { includeAnswers: false });
  assert.ok(teacher.includes("[Answer:"), "teacher copy should include the answer key");
  assert.ok(!student.includes("[Answer:"), "student/ManageBac copy must NOT include answers");
  assert.ok(student.includes("COMPREHENSION"), "student copy still keeps the questions themselves");
});

test("prompt: JSON-escapes special characters in the schema example", () => {
  const p = Prompt.buildPrompt({ title: 'The "Best" Topic', topic: "A\\B", levels: threeLevels, outputs: {} });
  assert.ok(p.includes(JSON.stringify('The "Best" Topic')), "title should be JSON-escaped in the example");
});
