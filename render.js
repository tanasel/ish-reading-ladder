(function () {
  "use strict";

  const S = window.EALSchema;
  const el = S.el;

  function paragraphs(text) {
    return String(text || "")
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
      .filter(Boolean);
  }

  const TYPE_LABEL = { literal: "Find it", inferential: "Think about it", evaluative: "Your view" };

  function levelCard(level, idx, opts) {
    const card = el("article", "level");
    card.dataset.level = idx;

    // Header
    const head = el("header", "level__head");
    const titles = el("div", "level__titles");
    const h3 = el("h3", "level__phase", level.phase);
    h3.id = "lvl-h-" + idx;
    card.setAttribute("aria-labelledby", h3.id);
    titles.appendChild(h3);
    const meta = el("p", "level__meta");
    if (level.cefr) meta.appendChild(el("span", "badge badge--cefr", "CEFR " + level.cefr));
    if (level.audience) meta.appendChild(el("span", "badge", level.audience));
    meta.appendChild(el("span", "badge badge--count", level.wordCount + " words"));
    titles.appendChild(meta);
    head.appendChild(titles);

    const tools = el("div", "level__tools");
    const copyBtn = el("button", "btn btn--ghost btn--sm", "Copy");
    copyBtn.type = "button";
    copyBtn.setAttribute("aria-label", "Copy the " + level.phase + " worksheet as text");
    copyBtn.addEventListener("click", () => copyLevel(level, copyBtn));
    tools.appendChild(copyBtn);
    head.appendChild(tools);
    card.appendChild(head);

    // Summary (Diffit-style "what this is about", at this level)
    if (level.summary) {
      const sum = el("div", "level__summary");
      sum.appendChild(el("span", "level__summary-tag", "In short"));
      sum.appendChild(document.createTextNode(level.summary));
      card.appendChild(sum);
    }

    // Passage
    const body = el("div", "level__passage");
    paragraphs(level.passage).forEach((p) => body.appendChild(el("p", null, p)));
    if (!body.childNodes.length) body.appendChild(el("p", "muted", "(no passage)"));
    card.appendChild(body);

    // Glossary
    if (level.glossary && level.glossary.length) {
      const sec = el("section", "level__sec");
      sec.appendChild(el("h4", "level__h", "Key words"));
      const dl = el("dl", "glossary");
      level.glossary.forEach((g) => {
        const dt = el("dt", "glossary__word");
        dt.appendChild(el("span", "glossary__term", g.word));
        if (g.translation) dt.appendChild(el("span", "glossary__tr", g.translation));
        dl.appendChild(dt);
        const dd = el("dd", "glossary__def");
        dd.appendChild(document.createTextNode(g.definition || ""));
        if (g.example) {
          const ex = el("span", "glossary__eg");
          ex.appendChild(el("em", null, g.example));
          dd.appendChild(ex);
        }
        dl.appendChild(dd);
      });
      sec.appendChild(dl);
      card.appendChild(sec);
    }

    // Questions
    if (level.questions && level.questions.length) {
      const sec = el("section", "level__sec");
      sec.appendChild(el("h4", "level__h", "Comprehension"));
      const ol = el("ol", "questions");
      level.questions.forEach((q) => {
        const li = el("li", "question");
        const row = el("div", "question__row");
        row.appendChild(el("span", "question__q", q.q));
        row.appendChild(el("span", "qtype qtype--" + q.type, TYPE_LABEL[q.type] || q.type));
        li.appendChild(row);
        if (q.answer) {
          const ans = el("p", "question__a answer-key");
          ans.appendChild(el("strong", null, "Answer: "));
          ans.appendChild(document.createTextNode(q.answer));
          li.appendChild(ans);
        }
        ol.appendChild(li);
      });
      sec.appendChild(ol);
      card.appendChild(sec);
    }

    // Sentence starters
    if (level.starters && level.starters.length) {
      const sec = el("section", "level__sec");
      sec.appendChild(el("h4", "level__h", "Sentence starters"));
      const ul = el("ul", "starters");
      level.starters.forEach((s) => {
        const li = el("li", "starter");
        li.appendChild(document.createTextNode(s));
        li.appendChild(el("span", "starter__line", ""));
        ul.appendChild(li);
      });
      sec.appendChild(ul);
      card.appendChild(sec);
    }

    return card;
  }

  function levelToPlainText(level) {
    const out = [];
    out.push(level.phase + (level.cefr ? "  (CEFR " + level.cefr + ")" : "") + "  — " + level.wordCount + " words");
    out.push("");
    if (level.summary) { out.push("IN SHORT: " + level.summary); out.push(""); }
    out.push(level.passage || "");
    if (level.glossary && level.glossary.length) {
      out.push("");
      out.push("KEY WORDS");
      level.glossary.forEach((g) => {
        out.push("- " + g.word + (g.translation ? " (" + g.translation + ")" : "") + ": " + (g.definition || "") + (g.example ? "  e.g. " + g.example : ""));
      });
    }
    if (level.questions && level.questions.length) {
      out.push("");
      out.push("COMPREHENSION");
      level.questions.forEach((q, i) => {
        out.push((i + 1) + ". " + q.q + (q.answer ? "   [Answer: " + q.answer + "]" : ""));
      });
    }
    if (level.starters && level.starters.length) {
      out.push("");
      out.push("SENTENCE STARTERS");
      level.starters.forEach((s) => out.push("- " + s + " ______________________"));
    }
    return out.join("\n");
  }

  function packToPlainText(pack) {
    const head = pack.meta.title + (pack.meta.topic ? "  —  " + pack.meta.topic : "");
    return head + "\n" + "=".repeat(Math.min(head.length, 60)) + "\n\n" +
      pack.levels.map(levelToPlainText).join("\n\n" + "—".repeat(40) + "\n\n");
  }

  function copyText(text, btn) {
    const done = () => { if (btn) { const old = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(() => { btn.textContent = old; }, 1400); } };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, done));
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); done(); } catch { S.toast("Could not copy — select the text manually."); }
    document.body.removeChild(ta);
  }
  function copyLevel(level, btn) { copyText(levelToPlainText(level), btn); }

  function render(pack, mount) {
    mount.textContent = "";
    const wrap = el("div", "levels");
    pack.levels.forEach((lv, i) => wrap.appendChild(levelCard(lv, i, {})));
    mount.appendChild(wrap);
    return wrap;
  }

  window.EALRender = { render, levelToPlainText, packToPlainText, copyText, paragraphs };
})();
