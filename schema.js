(function () {
  "use strict";

  // ---- small shared helpers (same conventions as the other ISH tools) ----
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  };
  const toText = (value) => (value == null ? "" : String(value)).trim();
  const clamp = (value, max) => {
    const t = toText(value).replace(/[ \t]+\n/g, "\n");
    if (t.length <= max) return t;
    let s = t.slice(0, max);
    if (/[\uD800-\uDBFF]$/.test(s)) s = s.slice(0, -1); // don't end on a lone surrogate half
    return s.trim();
  };
  const listFrom = (value, max) => {
    let arr = [];
    if (Array.isArray(value)) arr = value;
    else if (typeof value === "string" && value) arr = value.split("\n");
    return arr.map((x) => clamp(x, 1200)).filter(Boolean).slice(0, max || 30);
  };
  const wordCount = (s) => {
    const t = toText(s);
    if (!t) return 0;
    return t.split(/\s+/).filter(Boolean).length;
  };
  const QTYPES = new Set(["literal", "inferential", "evaluative"]);

  function toast(msg, action) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = "";
    t.appendChild(el("span", "toast__msg", msg));
    if (action && action.label && typeof action.fn === "function") {
      const b = el("button", "toast__action", action.label);
      b.type = "button";
      b.addEventListener("click", () => { hideToast(); action.fn(); });
      t.appendChild(b);
    }
    const close = el("button", "toast__close", "Dismiss");
    close.type = "button";
    close.addEventListener("click", hideToast);
    t.appendChild(close);
    t.hidden = false;
    t.classList.add("show");
  }
  function hideToast() {
    const t = $("#toast");
    if (!t) return;
    t.classList.remove("show");
    t.hidden = true;
  }

  // ---- JSON auto-repair pipeline (ported from Quest Forge) ----
  function stripCodeFences(text, notes) {
    let t = text.trim();
    if (/^```/.test(t)) {
      // strip the opening fence and everything from the closing fence onward
      t = t.replace(/^```(?:json)?\s*/i, "").replace(/```[\s\S]*$/i, "").trim();
      notes.push("Removed the code fences around the JSON.");
    }
    return t;
  }

  // Collect every top-level balanced {...} block. A chatty model can wrap the
  // answer in prose, or even paste a "this is the format I'll use" example
  // BEFORE the real reply — so we don't just take the biggest block.
  function balancedObjects(text) {
    const blocks = [];
    let inString = false, escape = false, depth = 0, start = -1;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text.charAt(i);
      if (inString) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; continue; }
      if (ch === "{") { if (depth === 0) start = i; depth += 1; }
      else if (ch === "}") {
        if (depth > 0) depth -= 1;
        if (depth === 0 && start >= 0) { blocks.push(text.slice(start, i + 1)); start = -1; }
      }
    }
    return blocks;
  }

  // Candidate objects, most-likely-the-answer first: schema-like blocks (last
  // one first, since the real reply usually comes after any format example),
  // then the last block, then the whole text. We score them after parsing, so a
  // short "format example" can't beat the real multi-level answer either way.
  function candidateObjects(text) {
    const blocks = balancedObjects(text);
    const schemaLike = blocks.filter((b) => /"schema"/.test(b) && /"levels"/.test(b));
    const out = [];
    for (let i = schemaLike.length - 1; i >= 0; i -= 1) out.push(schemaLike[i]);
    if (blocks.length) out.push(blocks[blocks.length - 1]);
    out.push(text);
    const seen = new Set();
    return out.filter((c) => { const k = (c || "").trim(); if (!k || seen.has(k)) return false; seen.add(k); return true; });
  }

  function stripComments(text) {
    let out = "", inString = false, escape = false;
    for (let i = 0; i < text.length; i += 1) {
      const ch = text.charAt(i), next = text.charAt(i + 1);
      if (inString) {
        out += ch;
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') { inString = true; out += ch; }
      else if (ch === "/" && next === "/") { while (i < text.length && text.charAt(i) !== "\n") i += 1; out += "\n"; }
      else if (ch === "/" && next === "*") { i += 2; while (i < text.length && !(text.charAt(i) === "*" && text.charAt(i + 1) === "/")) i += 1; i += 1; }
      else out += ch;
    }
    return out;
  }

  // Parse, repairing progressively. Stage 1 (comments + trailing commas) is safe
  // for text inside strings; smart-quote rewriting only happens as a last resort
  // because it can corrupt curly quotes that live inside a valid string value.
  function tryParseStaged(t) {
    try { return { ok: true, value: JSON.parse(t) }; }
    catch (e1) {
      const s1 = stripComments(t).replace(/,\s*([}\]])/g, "$1");
      try { return { ok: true, value: JSON.parse(s1), note: "Removed comments or trailing commas." }; }
      catch (e2) {
        const s2 = s1.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        try { return { ok: true, value: JSON.parse(s2), note: "Cleaned smart quotes, comments and trailing commas." }; }
        catch (e3) { return { ok: false, err: (e3 && e3.message) || (e2 && e2.message) || (e1 && e1.message) }; }
      }
    }
  }

  // ---- EAL pack normalisation ----
  function normalizeLevel(raw, i, notes) {
    const src = raw && typeof raw === "object" ? raw : {};
    const passage = clamp(src.passage, 8000);
    const lvl = {
      phase: clamp(src.phase, 60) || "Level " + (i + 1),
      cefr: clamp(src.cefr, 30),
      audience: clamp(src.audience, 80),
      summary: clamp(src.summary, 600),
      passage,
      wordCount: wordCount(passage), // always authoritative — never trust the AI's number
      glossary: [],
      questions: [],
      starters: listFrom(src.starters, 8),
    };

    const gloss = Array.isArray(src.glossary) ? src.glossary : [];
    gloss.slice(0, 14).forEach((g) => {
      if (!g || typeof g !== "object") return;
      const word = clamp(g.word, 80);
      if (!word) return;
      lvl.glossary.push({
        word,
        definition: clamp(g.definition, 400),
        example: clamp(g.example, 400),
        translation: clamp(g.translation, 200),
      });
    });

    const qs = Array.isArray(src.questions) ? src.questions : [];
    qs.slice(0, 10).forEach((q) => {
      if (!q || typeof q !== "object") return;
      const text = clamp(q.q || q.question, 500);
      if (!text) return;
      const type = QTYPES.has(toText(q.type).toLowerCase()) ? toText(q.type).toLowerCase() : "literal";
      lvl.questions.push({ q: text, type, answer: clamp(q.answer, 600) });
    });

    if (!passage) { lvl.__unusable = true; lvl.__reason = "no passage text"; }
    return lvl;
  }

  function normalizePack(raw) {
    const notes = [];
    const unusable = [];
    const src = raw && typeof raw === "object" ? raw : {};
    const schema = toText(src.schema);
    if (!schema || !schema.startsWith("ish-eal@1")) notes.push("Schema label was missing — assuming ish-eal@1.");

    const metaSrc = src.meta && typeof src.meta === "object" ? src.meta : {};
    const pack = {
      schema: "ish-eal@1",
      meta: {
        title: clamp(metaSrc.title, 160) || "Levelled text",
        topic: clamp(metaSrc.topic, 200),
        sourceWords: Number.isFinite(Number(metaSrc.sourceWords)) ? Math.round(Number(metaSrc.sourceWords)) : 0,
      },
      levels: [],
    };

    let rawLevels = Array.isArray(src.levels) ? src.levels : [];
    if (!rawLevels.length && src.levels && typeof src.levels === "object") {
      rawLevels = [src.levels];
      notes.push("Levels was a single object — wrapped it in a list.");
    }
    if (rawLevels.length > 16) { rawLevels = rawLevels.slice(0, 16); notes.push("Kept the first 16 levels."); }
    rawLevels.forEach((lv, i) => {
      if (!lv || typeof lv !== "object" || Array.isArray(lv)) { notes.push("Level " + (i + 1) + " was not an object — skipped it."); return; }
      const level = normalizeLevel(lv, pack.levels.length, notes);
      pack.levels.push(level);
    });

    pack.levels.forEach((lv, i) => { if (lv.__unusable) unusable.push({ index: i, phase: lv.phase, reason: lv.__reason }); });
    if (!pack.levels.length) notes.push("No levels were found in the reply.");

    return { pack, notes, unusable };
  }

  const MAX_REPLY_CHARS = 200000;

  function validatePackText(rawText) {
    const notes = [];
    let text = String(rawText == null ? "" : rawText).trim();
    if (!text) return { ok: false, notes, unusable: [], error: "Paste the AI's reply first." };
    if (text.length > MAX_REPLY_CHARS) {
      return { ok: false, notes, unusable: [], error: "That reply is very large — paste just the AI's data block (from the first { to the last })." };
    }
    text = stripCodeFences(text, notes);

    // Try each candidate object; score by usable levels so the real answer beats
    // any short "format example", whether it appears before or after the answer.
    let best = null;     // highest-scoring parseable candidate
    let lastErr = "";
    candidateObjects(text).forEach((cand) => {
      const parsed = tryParseStaged(cand);
      if (!parsed.ok) { lastErr = parsed.err || lastErr; return; }
      const outp = normalizePack(parsed.value);
      const usable = outp.pack.levels.filter((l) => !l.__unusable).length;
      const localNotes = [];
      if (cand !== text) localNotes.push("Removed the text the AI added around the JSON.");
      if (parsed.note) localNotes.push(parsed.note);
      const score = (outp.unusable.length === 0 ? 1000 : 0) + usable; // clean packs rank above partial; more usable levels = better
      if (!best || score > best.score) best = { outp, usable, score, localNotes };
    });

    if (best && best.usable > 0) {
      const { outp, localNotes } = best;
      return {
        ok: outp.unusable.length === 0,
        pack: outp.pack,
        notes: notes.concat(localNotes, outp.notes),
        unusable: outp.unusable,
        error: outp.unusable.length ? "Some levels have no passage and need a fresh paste." : "",
      };
    }
    if (best) { // parsed, but no usable levels
      return { ok: false, pack: best.outp.pack, notes: notes.concat(best.localNotes, best.outp.notes), unusable: best.outp.unusable, error: "No usable levels were found." };
    }
    return { ok: false, notes, unusable: [], error: "That doesn't look like the AI's reply yet — paste the whole answer, including the part that starts with {." };
  }

  window.EALSchema = {
    $, $$, el, toText, clamp, listFrom, wordCount,
    normalizePack, validatePackText, toast, hideToast,
  };
})();
