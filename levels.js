(function () {
  "use strict";

  // EAL phases with CEFR anchors. Labels are editable by the teacher; the
  // GUIDANCE is what the AI is actually told to do for that band, so the
  // levels behave predictably no matter what they are renamed to.
  //
  // The phase model is the practical one international schools use (Emergent
  // -> Bridging). CEFR is shown beside each so EAL specialists can place a
  // student either way. "Original" is the teacher's own text, untouched.

  const DEFAULTS = [
    {
      id: "p1",
      phase: "Phase 1",
      cefr: "Pre-A1 / A1",
      audience: "New to English",
      blurb: "Brand-new English learners. Picture-supported, survival vocabulary.",
      guidance:
        "VERY SIMPLE. Sentences of 3-8 words, one idea each. Present simple tense almost always. Use only the most common ~500-1000 English words. No idioms, no figurative language, no clauses joined by 'which/although/however'. Repeat key nouns instead of using pronouns when it could confuse. Keep names, numbers and dates, but explain anything unusual. The passage should be short.",
    },
    {
      id: "p2",
      phase: "Phase 2",
      cefr: "A1 / A2",
      audience: "Beginning",
      blurb: "Can handle short, familiar texts with strong support.",
      guidance:
        "SIMPLE. Sentences of up to 12 words. Mostly present and simple past. Common connectors only (and, but, so, because, then). Use everyday high-frequency vocabulary (~1000-2000 word families); gloss anything rarer. One main idea per sentence. Avoid the passive voice and avoid idioms.",
    },
    {
      id: "p3",
      phase: "Phase 3",
      cefr: "A2 / B1",
      audience: "Developing",
      blurb: "Growing independence; copes with clear, everyday texts.",
      guidance:
        "CLEAR. Sentences up to about 16 words, occasionally with one subordinate clause. A normal range of tenses is fine. Vocabulary roughly the most common 2500 words; gloss subject-specific or low-frequency terms. Simple idioms are allowed if they are explained in the glossary. Keep paragraphs short.",
    },
    {
      id: "p4",
      phase: "Phase 4",
      cefr: "B1 / B2",
      audience: "Expanding",
      blurb: "Approaching grade level; handles abstract ideas with some scaffolding.",
      guidance:
        "MODERATE. Varied sentence length up to ~20 words, including subordinate clauses and some abstract ideas. The passive voice is fine where natural. Lower-frequency and academic vocabulary is allowed, but gloss the hardest 5-8 words. Preserve nuance and cohesion.",
    },
    {
      id: "p5",
      phase: "Phase 5",
      cefr: "B2 / C1",
      audience: "Bridging",
      blurb: "Near grade level; needs little simplification, mostly vocabulary support.",
      guidance:
        "LIGHT TOUCH. Keep the text close to its original sophistication and complexity. Only break up the very longest sentences and only replace genuinely rare or specialist words (glossing the ones you keep). Preserve tone, register and detail.",
    },
  ];

  // The teacher's untouched text, offered as a "Phase 6 / C2" comparison column.
  const ORIGINAL = {
    id: "orig",
    phase: "Original",
    cefr: "C1 / C2",
    audience: "At grade level",
    blurb: "The teacher's own text, unchanged — for comparison or for the strongest readers.",
    guidance:
      "DO NOT SIMPLIFY. Reproduce the source text essentially as written (you may fix obvious typos only). Still provide a glossary of the hardest words, comprehension questions and sentence starters.",
  };

  function byId(id) {
    if (id === "orig") return Object.assign({}, ORIGINAL);
    const found = DEFAULTS.find((d) => d.id === id);
    return found ? Object.assign({}, found) : null;
  }

  window.EALLevels = { DEFAULTS, ORIGINAL, byId };
})();
