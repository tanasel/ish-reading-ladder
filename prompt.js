(function () {
  "use strict";

  function txt(v, fallback) {
    const t = String(v == null ? "" : v).trim();
    return t || fallback;
  }
  function clampInt(v, lo, hi, dflt) {
    const n = parseInt(v, 10);
    if (!Number.isFinite(n)) return dflt;
    return Math.max(lo, Math.min(hi, n));
  }

  // Build the levels block: one numbered brief per chosen level.
  function levelsBlock(levels) {
    return levels
      .map(function (lv, i) {
        return (
          (i + 1) +
          ". " +
          lv.phase +
          "  (CEFR " +
          lv.cefr +
          " — " +
          lv.audience +
          ")\n   " +
          lv.guidance
        );
      })
      .join("\n");
  }

  function buildPrompt(inputs) {
    inputs = inputs || {};
    const levels = Array.isArray(inputs.levels) && inputs.levels.length ? inputs.levels : [];
    const out = inputs.outputs || {};
    const wantSummary = out.summary !== false;
    const wantGloss = out.glossary !== false;
    const wantQ = out.questions !== false;
    const wantStart = out.starters !== false;

    const glossN = clampInt(inputs.glossaryCount, 3, 12, 6);
    const qN = clampInt(inputs.questionCount, 2, 8, 4);
    const startN = clampInt(inputs.starterCount, 2, 6, 3);

    const title = txt(inputs.title, "[give it a short title]");
    const topic = txt(inputs.topic, "[subject / topic]");
    const year = txt(inputs.year, "the class's year group");
    const home = txt(inputs.homeLanguage, "");
    const source = txt(inputs.sourceText, "");
    const hasSource = source.length > 0;

    // What each level object must contain, given the chosen outputs.
    const fields = [];
    if (wantSummary) fields.push('"summary":"<2-3 short sentences giving the main idea, written AT this level>"');
    fields.push('"passage":"<the text at this level, paragraphs separated by a blank line>"', '"wordCount":<integer>');
    if (wantGloss) {
      fields.push(
        '"glossary":[{ "word":"", "definition":"<simple, at this level>", "example":"<a new sentence using the word>"' +
          (home ? ', "translation":"<the word in ' + home + '>"' : "") +
          " }]"
      );
    }
    if (wantQ) fields.push('"questions":[{ "q":"", "type":"literal|inferential|evaluative", "answer":"<a model answer for the teacher>" }]');
    if (wantStart) fields.push('"starters":["<sentence stem a student can finish>"]');

    const partsList = [
      "a simplified passage" + (hasSource ? "" : " (written from scratch on the topic)"),
    ];
    if (wantSummary) partsList.push("a 2-3 sentence summary");
    if (wantGloss) partsList.push("a " + glossN + "-word glossary");
    if (wantQ) partsList.push(qN + " comprehension questions");
    if (wantStart) partsList.push(startN + " sentence starters");

    const sourceSection = hasSource
      ? "SOURCE TEXT (this is the teacher's own text — re-level THIS, do not replace its ideas):\n\"\"\"\n" +
        source +
        "\n\"\"\""
      : "NO source text was given. Write an original, factual base text on the topic above (about 180-260 words, suitable for the Original level), then level THAT text down. Use only widely-agreed facts; invent nothing and give no opinions.";

    return (
      'You are an expert EAL/ESL teacher and applied linguist at the International School of The Hague.\n' +
      'You differentiate one text into several reading levels for English-as-an-Additional-Language students,\n' +
      'keeping the meaning identical and only changing how hard the language is.\n' +
      "\n" +
      "TASK: Produce ONE JSON object (schema \"ish-eal@1\") that contains the SAME text rewritten at each level below.\n" +
      "For each level give: " + partsList.join(", ") + ".\n" +
      "\n" +
      "TITLE: " + title + "\n" +
      "TOPIC / SUBJECT: " + topic + "\n" +
      "CLASS LEVEL (the original is pitched here): " + year + "\n" +
      (home ? "HOME-LANGUAGE GLOSSARY: also translate each glossary word into " + home + ".\n" : "") +
      "\n" +
      sourceSection +
      "\n\n" +
      "LEVELS TO PRODUCE (one entry in \"levels\" per line, IN THIS ORDER):\n" +
      levelsBlock(levels) +
      "\n\n" +
      "FAITHFULNESS RULES (the most important rules)\n" +
      "- Every level must carry the SAME key facts, events and ideas as the source, in the same order.\n" +
      "- Keep all names, numbers, dates and quantities exactly. Do not add new facts or opinions.\n" +
      "- Simplify the LANGUAGE, never the truth. A lower level says less and says it more simply,\n" +
      "  but it must not contradict or distort the source.\n" +
      "- Write natural English a real teacher would accept — not word-for-word translations of long sentences.\n" +
      "\n" +
      "OUTPUT RULES\n" +
      '1. Return ONLY the JSON object. No markdown, no code fences, no commentary. First character "{", last "}".\n' +
      "2. Use the exact field names in the SCHEMA. Plain text only inside strings (no HTML, no markdown).\n" +
      "3. Produce exactly " + levels.length + " entries in \"levels\", in the order listed.\n" +
      (wantSummary ? "- Summary: 2-3 short sentences per level, written AT that level, giving the real gist (not a teaser).\n" : "") +
      (wantGloss ? "4. Glossary: " + glossN + " words per level. Choose words that actually appear in THAT level's passage and that a student at that level would find hard. Define them in language at or below that level.\n" : "") +
      (wantQ ? "5. Questions: " + qN + " per level, ordered easiest first (literal -> inferential -> evaluative). Each needs a short model \"answer\" for the teacher.\n" : "") +
      (wantStart ? "6. Sentence starters: " + startN + " per level — short stems the student finishes in writing, pitched at that level.\n" : "") +
      "7. \"wordCount\" is the number of words in that level's passage. Lower levels should be shorter.\n" +
      "8. Check the JSON parses: balanced braces/brackets, quoted keys, no trailing commas.\n" +
      "\n" +
      "SCHEMA (return JSON of exactly this shape)\n" +
      "{ \"schema\":\"ish-eal@1\",\n" +
      "  \"meta\":{ \"title\":" + JSON.stringify(title) + ", \"topic\":" + JSON.stringify(topic) + ", \"sourceWords\":<integer> },\n" +
      "  \"levels\":[\n" +
      "    { \"phase\":" + JSON.stringify(levels[0] ? levels[0].phase : "Phase 1") + ", \"cefr\":" + JSON.stringify(levels[0] ? levels[0].cefr : "A1") + ", \"audience\":" + JSON.stringify(levels[0] ? levels[0].audience : "") + ",\n" +
      "      " + fields.join(",\n      ") + " }\n" +
      "    /* one object per level, in the listed order */\n" +
      "  ] }\n" +
      "\n" +
      "Now produce the JSON for the levels above. Remember: ONLY the JSON object."
    );
  }

  window.EALPrompt = { buildPrompt };
})();
