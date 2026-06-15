(function () {
  "use strict";

  const S = window.EALSchema;
  const $ = S.$;
  const el = S.el;
  const store = window.EALStore;
  const root = document.documentElement;

  let currentPack = null;

  // ---------------------------------------------------------------
  // Accessibility toolbar (theme / font / size / contrast)
  // ---------------------------------------------------------------
  function applyPrefs() {
    const theme = store.get("theme", "light");
    root.setAttribute("data-theme", theme);
    syncTheme(theme);
    const style = store.get("style", "calm"); // EAL tool → calm by default
    root.setAttribute("data-style", style);
    syncStyle(style);
    setToggle("fontBtn", "data-font", "dyslexic", store.get("font", false));
    setToggle("sizeBtn", "data-size", "big", store.get("size", false));
    setToggle("contrastBtn", "data-contrast", "high", store.get("contrast", false));
  }
  function syncStyle(style) {
    const b = $("#styleBtn");
    if (!b) return;
    const calm = style === "calm";
    b.textContent = calm ? "✦ Bold" : "✦ Calm";       // shows the style you'd switch TO
    b.setAttribute("aria-label", calm ? "Switch to the bold look" : "Switch to the calm, EAL-friendly look");
  }
  function syncTheme(theme) {
    const b = $("#themeBtn");
    if (!b) return;
    const dark = theme === "dark";
    b.textContent = dark ? "☀ Light" : "🌙 Dark";
    b.setAttribute("aria-pressed", dark ? "true" : "false");
    b.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }

  function focusReveal(sel) {
    const n = $(sel);
    if (!n) return;
    n.scrollIntoView({ behavior: "smooth", block: "start" });
    try { n.focus({ preventScroll: true }); } catch (e) { try { n.focus(); } catch (e2) { /* not focusable */ } }
  }
  function unlockHandoff(locked) {
    ["step4", "step5"].forEach((id) => $("#" + id).classList.toggle("step--locked", !!locked));
    ["lock4", "lock5"].forEach((id) => { const n = $("#" + id); if (n) n.hidden = !locked; });
    ["body4", "body5"].forEach((id) => { const n = $("#" + id); if (n) n.hidden = !!locked; });
  }
  function setToggle(btnId, attr, on, active) {
    const b = $("#" + btnId);
    if (active) root.setAttribute(attr, on);
    else root.removeAttribute(attr);
    if (b) b.setAttribute("aria-pressed", active ? "true" : "false");
  }
  function wireToolbar() {
    $("#themeBtn").addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store.set("theme", next);
      syncTheme(next);
    });
    $("#styleBtn").addEventListener("click", () => {
      const next = root.getAttribute("data-style") === "calm" ? "bold" : "calm";
      root.setAttribute("data-style", next);
      store.set("style", next);
      syncStyle(next);
    });
    const toggles = [["fontBtn", "data-font", "dyslexic", "font"], ["sizeBtn", "data-size", "big", "size"], ["contrastBtn", "data-contrast", "high", "contrast"]];
    toggles.forEach(([id, attr, on, key]) => {
      $("#" + id).addEventListener("click", () => {
        const active = store.get(key, false) !== true;
        store.set(key, active);
        setToggle(id, attr, on, active);
      });
    });
  }

  // ---------------------------------------------------------------
  // Step 2 — level list
  // ---------------------------------------------------------------
  function buildLevelList() {
    const list = $("#levelList");
    const all = window.EALLevels.DEFAULTS.concat([window.EALLevels.ORIGINAL]);
    const rawSel = store.get("levelSel", ["p1", "p2", "p3"]);
    const savedSel = Array.isArray(rawSel) ? rawSel : ["p1", "p2", "p3"];
    const savedNames = store.get("levelNames", {}) || {};
    all.forEach((lv) => {
      const row = el("div", "lvl");
      row.dataset.id = lv.id;
      const cb = el("input");
      cb.type = "checkbox";
      cb.className = "lvl__cb";
      cb.id = "cb-" + lv.id;
      cb.checked = savedSel.indexOf(lv.id) >= 0;
      cb.setAttribute("aria-label", "Include " + lv.phase + " — CEFR " + lv.cefr + ", " + lv.audience);
      cb.addEventListener("change", saveLevelSel);
      row.appendChild(cb);

      const main = el("div", "lvl__main");
      const name = el("input");
      name.type = "text";
      name.className = "lvl__name";
      name.value = savedNames[lv.id] || lv.phase;
      name.setAttribute("aria-label", "Rename level: " + lv.phase);
      name.addEventListener("input", saveLevelNames);
      main.appendChild(name);

      const tags = el("div", "lvl__tags");
      tags.appendChild(el("span", "badge badge--cefr", "CEFR " + lv.cefr));
      tags.appendChild(el("span", "lvl__aud", lv.audience));
      main.appendChild(tags);
      main.appendChild(el("p", "lvl__blurb", lv.blurb));
      row.appendChild(main);
      list.appendChild(row);
    });
  }
  function saveLevelSel() {
    const sel = S.$$("#levelList .lvl__cb").filter((c) => c.checked).map((c) => c.id.replace(/^cb-/, ""));
    store.set("levelSel", sel);
  }
  function saveLevelNames() {
    const names = {};
    S.$$("#levelList .lvl").forEach((row) => {
      const id = row.dataset.id;
      const v = $(".lvl__name", row).value.trim();
      if (v) names[id] = v;
    });
    store.set("levelNames", names);
  }
  function selectedLevels() {
    const out = [];
    S.$$("#levelList .lvl").forEach((row) => {
      const cb = $(".lvl__cb", row);
      if (!cb.checked) return;
      const base = window.EALLevels.byId(row.dataset.id);
      if (!base) return;
      const name = $(".lvl__name", row).value.trim();
      out.push({ phase: name || base.phase, cefr: base.cefr, audience: base.audience, guidance: base.guidance });
    });
    return out;
  }

  // ---------------------------------------------------------------
  // Step 3 — output toggles
  // ---------------------------------------------------------------
  function wireOutputToggles() {
    ["optSummary", "optGlossary", "optQuestions", "optStarters"].forEach((id) => {
      const b = $("#" + id);
      const saved = store.get(id, true);
      b.setAttribute("aria-pressed", saved ? "true" : "false");
      b.addEventListener("click", () => {
        const on = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", on ? "true" : "false");
        store.set(id, on);
      });
    });
  }
  function pressed(id) { return $("#" + id).getAttribute("aria-pressed") === "true"; }

  // ---------------------------------------------------------------
  // Draft persistence (don't lose the teacher's text)
  // ---------------------------------------------------------------
  const DRAFT_FIELDS = ["title", "topic", "year", "sourceText", "homeLang", "glossN", "qN", "startN"];
  function restoreDraft() {
    const d = store.get("draft", {}) || {};
    DRAFT_FIELDS.forEach((id) => { if (d[id] != null && $("#" + id)) $("#" + id).value = d[id]; });
    updateCount();
  }
  function saveDraft() {
    const d = {};
    DRAFT_FIELDS.forEach((id) => { if ($("#" + id)) d[id] = $("#" + id).value; });
    store.set("draft", d);
  }
  let draftTimer = null;
  function saveDraftSoon() { if (draftTimer) clearTimeout(draftTimer); draftTimer = setTimeout(saveDraft, 400); }
  function updateCount() {
    $("#srcCount").textContent = S.wordCount($("#sourceText").value);
  }

  // ---------------------------------------------------------------
  // Build prompt
  // ---------------------------------------------------------------
  function buildPrompt() {
    const levels = selectedLevels();
    if (!levels.length) { S.toast("Tick at least one level in step 2."); $("#s2").scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    const inputs = {
      title: $("#title").value,
      topic: $("#topic").value,
      year: $("#year").value,
      sourceText: $("#sourceText").value,
      homeLanguage: $("#homeLang").value,
      levels,
      outputs: { summary: pressed("optSummary"), glossary: pressed("optGlossary"), questions: pressed("optQuestions"), starters: pressed("optStarters") },
      glossaryCount: $("#glossN").value,
      questionCount: $("#qN").value,
      starterCount: $("#startN").value,
    };
    const prompt = window.EALPrompt.buildPrompt(inputs);
    $("#promptOut").value = prompt;
    unlockHandoff(false);
    saveDraft();
    focusReveal("#s4");
  }

  // ---------------------------------------------------------------
  // Render worksheets from pasted reply
  // ---------------------------------------------------------------
  function buildWorksheets() {
    const raw = $("#replyIn").value;
    const res = S.validatePackText(raw);
    const notes = $("#notes");
    const alertBox = $("#alert");
    notes.textContent = "";
    alertBox.textContent = "";

    if (!res.ok && (!res.pack || !res.pack.levels.length)) {
      alertBox.appendChild(el("p", "notes__err", "⚠ " + (res.error || "Could not read the reply.")));
      const tip = el("p", "notes__note");
      tip.appendChild(document.createTextNode("Tip: go back to the AI and send this — "));
      tip.appendChild(el("strong", null, '"Reply with ONLY the data block, starting with { and ending with }, nothing else."'));
      tip.appendChild(document.createTextNode(" Then copy the new answer and paste it here."));
      alertBox.appendChild(tip);
      res.notes.forEach((n) => notes.appendChild(el("p", "notes__note", n)));
      S.toast("That reply couldn't be read — see the red note for a quick fix.");
      return;
    }
    showPack(res.pack);
    if (res.unusable.length) notes.appendChild(el("p", "notes__err", "⚠ " + res.unusable.length + " level(s) had no passage — paste a fresh reply to fix them."));
    if (res.notes.length) res.notes.forEach((n) => notes.appendChild(el("p", "notes__note", n)));
    if (!res.unusable.length && !res.notes.length) notes.appendChild(el("p", "notes__ok", "✓ Built " + res.pack.levels.length + " level(s)."));
  }

  function showPack(pack) {
    currentPack = pack;
    window.EALRender.render(pack, $("#worksheets"));
    $("#resultsTitle").textContent = pack.meta.title + (pack.meta.topic ? " — " + pack.meta.topic : "");
    $("#results").hidden = false;
    focusReveal("#s6");
  }

  // ---------------------------------------------------------------
  // Results tools
  // ---------------------------------------------------------------
  function wireResultsTools() {
    const sheets = $("#worksheets");
    const ans = $("#answersBtn");
    ans.addEventListener("click", () => {
      const showing = ans.getAttribute("aria-pressed") === "true";
      ans.setAttribute("aria-pressed", showing ? "false" : "true");
      ans.textContent = showing ? "Show answer keys" : "Hide answer keys";
      sheets.classList.toggle("hide-answers", showing);
    });
    const cmp = $("#compareBtn");
    cmp.addEventListener("click", () => {
      const on = cmp.getAttribute("aria-pressed") !== "true";
      cmp.setAttribute("aria-pressed", on ? "true" : "false");
      sheets.classList.toggle("compare", on);
      const lv = sheets.querySelector(".levels");
      if (lv) {
        if (on) {
          lv.setAttribute("role", "region");
          lv.setAttribute("tabindex", "0");
          lv.setAttribute("aria-label", "Levels side by side — scroll horizontally to compare");
        } else {
          lv.removeAttribute("role");
          lv.removeAttribute("tabindex");
          lv.removeAttribute("aria-label");
        }
      }
    });
    $("#copyAllBtn").addEventListener("click", () => {
      if (currentPack) window.EALRender.copyText(window.EALRender.packToPlainText(currentPack), $("#copyAllBtn"));
    });
    $("#printBtn").addEventListener("click", () => window.print());
  }

  // ---------------------------------------------------------------
  // Demo
  // ---------------------------------------------------------------
  function loadDemo() {
    if (!window.EAL_SAMPLE) { S.toast("Demo not available."); return; }
    const sample = window.EAL_SAMPLE;
    $("#title").value = sample.pack.meta.title || "";
    $("#topic").value = sample.pack.meta.topic || "";
    $("#year").value = "Year 8 / MYP 3";
    $("#sourceText").value = sample.source || "";
    updateCount();
    // make sure the sample's three levels are ticked so buildPrompt can't bail
    ["p1", "p2", "p3"].forEach((id) => { const cb = $("#cb-" + id); if (cb) cb.checked = true; });
    saveLevelSel();
    // Walk the real loop: build the prompt (unlocks + fills step 4)...
    buildPrompt();
    // ...then pre-fill step 5 the way a chatty AI really replies (also shows the auto-repair)...
    $("#replyIn").value = "Sure! Here are your levelled versions:\n\n" + JSON.stringify(sample.pack, null, 2);
    // ...and show the finished worksheets.
    const res = S.validatePackText($("#replyIn").value);
    if (res.pack && res.pack.levels.length) showPack(res.pack);
    $("#resetDemo").hidden = false;
    saveDraft();
    S.toast("Example loaded — we filled steps 1, 4 and 5 so you can see the whole loop. Scroll up to follow it, or press 'Clear example' to start your own.");
  }

  function resetDemo() {
    ["title", "topic", "year", "sourceText", "homeLang", "replyIn"].forEach((id) => { const n = $("#" + id); if (n) n.value = ""; });
    $("#promptOut").value = "";
    updateCount();
    unlockHandoff(true);
    $("#notes").textContent = "";
    $("#alert").textContent = "";
    $("#results").hidden = true;
    $("#resetDemo").hidden = true;
    currentPack = null;
    saveDraft();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------------------------------------------------------------
  function init() {
    applyPrefs();
    wireToolbar();
    buildLevelList();
    wireOutputToggles();
    wireResultsTools();
    restoreDraft();

    $("#sourceText").addEventListener("input", () => { updateCount(); saveDraftSoon(); });
    DRAFT_FIELDS.forEach((id) => {
      const n = $("#" + id);
      if (!n) return;
      n.addEventListener("change", saveDraft);
      if (id !== "sourceText") n.addEventListener("input", saveDraftSoon); // don't lose typing if the tab closes before blur
    });

    $("#buildBtn").addEventListener("click", buildPrompt);
    $("#copyPrompt").addEventListener("click", () => window.EALRender.copyText($("#promptOut").value, $("#copyPrompt")));
    $("#renderBtn").addEventListener("click", buildWorksheets);
    $("#demoBtn").addEventListener("click", loadDemo);
    $("#resetDemo").addEventListener("click", resetDemo);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
