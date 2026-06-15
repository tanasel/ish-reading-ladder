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
    const packMeta = (opts && opts.meta) || {};

    const emailBtn = el("button", "btn btn--ghost btn--sm", "✉ Email");
    emailBtn.type = "button";
    emailBtn.title = "Open a pre-filled email to a student (no answer key). Nothing is sent until you press Send.";
    emailBtn.setAttribute("aria-label", "Open a pre-filled student email for " + level.phase + ", without the answer key");
    emailBtn.addEventListener("click", () => emailLevel(level, packMeta, emailBtn));
    tools.appendChild(emailBtn);

    const mbBtn = el("button", "btn btn--ghost btn--sm", "ManageBac");
    mbBtn.type = "button";
    mbBtn.title = "Copy the task as clean plain text to paste into ManageBac (no answer key).";
    mbBtn.setAttribute("aria-label", "Copy " + level.phase + " for ManageBac, without the answer key");
    mbBtn.addEventListener("click", () => copyText(levelToPlainText(level, { includeAnswers: false }), mbBtn));
    tools.appendChild(mbBtn);

    const copyBtn = el("button", "btn btn--ghost btn--sm", "Copy");
    copyBtn.type = "button";
    copyBtn.title = "Copy the full worksheet, including the answer key (for you).";
    copyBtn.setAttribute("aria-label", "Copy the full " + level.phase + " worksheet including answers");
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

    // Optional full home-language version (collapsed; English stays primary). dir=auto handles RTL.
    if (level.translation) {
      const det = el("details", "translation");
      det.appendChild(el("summary", "translation__sum", "Home-language version"));
      const tdiv = el("div", "translation__body");
      tdiv.setAttribute("dir", "auto");
      paragraphs(level.translation).forEach((p) => tdiv.appendChild(el("p", null, p)));
      det.appendChild(tdiv);
      card.appendChild(det);
    }

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
        if (q.options && q.options.length) {
          const ul = el("ul", "options");
          q.options.forEach((opt, oi) => {
            const oli = el("li", "option");
            oli.appendChild(el("span", "option__ltr", String.fromCharCode(65 + oi) + ")"));
            oli.appendChild(document.createTextNode(" " + opt));
            if (q.answer && opt.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
              oli.appendChild(el("span", "option__correct answer-key", " ✓")); // marker hides with answer keys
            }
            ul.appendChild(oli);
          });
          li.appendChild(ul);
        }
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

  function levelToPlainText(level, opts) {
    const answers = !opts || opts.includeAnswers !== false; // default: include (teacher copy)
    const out = [];
    out.push(level.phase + (level.cefr ? "  (CEFR " + level.cefr + ")" : "") + "  — " + level.wordCount + " words");
    out.push("");
    if (level.summary) { out.push("IN SHORT: " + level.summary); out.push(""); }
    out.push(level.passage || "");
    if (level.translation) { out.push(""); out.push("HOME-LANGUAGE VERSION:"); out.push(level.translation); }
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
        out.push((i + 1) + ". " + q.q);
        if (q.options && q.options.length) {
          q.options.forEach((opt, oi) => out.push("   " + String.fromCharCode(65 + oi) + ") " + opt));
        }
        if (answers && q.answer) out.push("   [Answer: " + q.answer + "]");
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
      pack.levels.map(function (l) { return levelToPlainText(l); }).join("\n\n" + "—".repeat(40) + "\n\n");
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

  // Student-facing text: passage + summary + glossary + questions + starters,
  // with NO answer key, plus a short friendly opener for the email.
  function studentEmailBody(level) {
    const opener = "Hi,\n\nHere is your reading for " + (level.phase || "this level") +
      ". Read it, try the questions, and use the sentence starters to help you write full answers.\n\n";
    return opener + levelToPlainText(level, { includeAnswers: false });
  }

  // Open the teacher's OWN mail client with a pre-filled draft. mailto never
  // auto-sends (RFC 6068) and nothing is uploaded. Over ~2000 chars it silently
  // does nothing on Windows, so fall back to copy for long worksheets.
  function emailLevel(level, meta, btn) {
    const title = (meta && meta.title) ? meta.title : "Reading";
    const subject = "Reading: " + title + " — " + (level.phase || "");
    const body = studentEmailBody(level);
    const href = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body.replace(/\n/g, "\r\n"));
    if (href.length > 1900) {
      copyText(body, btn);
      S.toast("This level is long, so it may not open as an email on every device — I've copied it. Paste it into a new email to your student.");
      return;
    }
    window.location.href = href; // opens the pre-filled compose window; teacher reviews + sends
    if (btn) { const old = btn.textContent; btn.textContent = "Opening…"; setTimeout(() => { btn.textContent = old; }, 1600); }
  }

  function render(pack, mount) {
    mount.textContent = "";
    const wrap = el("div", "levels");
    pack.levels.forEach((lv, i) => wrap.appendChild(levelCard(lv, i, { meta: pack.meta })));
    mount.appendChild(wrap);
    return wrap;
  }

  window.EALRender = { render, levelToPlainText, packToPlainText, copyText, paragraphs };
})();
