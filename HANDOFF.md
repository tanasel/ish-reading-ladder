# Reading Ladder — Handoff

**For:** ISH English & EAL department · **Updated:** 2026-06-15
**Repository / live site:** _not deployed yet_ — see "Deploy" below (suggested repo: `ish-reading-ladder`).

Reading Ladder is a **GDPR-safe text simplifier for EAL** — a free alternative to Diffit. A teacher pastes their
own text; the tool writes a prompt; the teacher runs it through ISH's approved AI and pastes the reply back; the
tool turns it into a ladder of reading levels (passage + glossary + questions + sentence starters) for every EAL
phase. No accounts, no uploads, no cost.

---

## For the EAL team (no technical knowledge needed)

1. Open the tool and click **See a worked example** to watch the whole loop with sample text filled in.
2. Then: paste your own text → tick the levels → press **Write the AI instructions** → copy them into
   Gemini/ChatGPT/Claude → paste the reply back → press **Build the worksheets**.
3. The **How it works** button (top of the page) has a full visual guide and explains why this is GDPR-safe.

**The point for the department:** this does the one job the EAL team wanted from Diffit (simplifying texts to
several levels) without sending student text to a third-party vendor — so there is nothing extra to clear under
GDPR / the EU AI Act, and no €4,000 licence.

---

## For whoever maintains it

**Run locally**

```sh
node dev-server.cjs        # http://localhost:4185/
```

**Test**

```sh
node --test tests/eal.test.cjs   # should be 11 passing
```

**Where things live**

- Pages: `index.html` (the tool), `how-to.html` (teacher guide + `#privacy`).
- Logic: `prompt.js` (the AI prompt), `schema.js` (validate/repair the reply), `render.js` (worksheets + export),
  `levels.js` (the editable EAL-phase ↔ CEFR table + per-level rules), `app.js` (wiring), `store.js` (prefs/draft).
- Content: `data.js` (the worked example). Branding: `assets/`.
- Full map in [`README.md`](README.md).

**Change the default levels or labels**

Edit `DEFAULTS` (and `ORIGINAL`) in `levels.js`. Each entry has a `phase` label, a `cefr` anchor (display), and a
`guidance` string — the concrete language rules the AI is told to follow for that level. Teachers can also rename
labels live in the UI; defaults just set the starting point.

**Change what's selected by default**

The first three phases are pre-ticked. Change the default in `app.js` (`store.get("levelSel", ["p1","p2","p3"])`).

---

## Deploy (when ready)

Same method as the sibling tools, from this folder:

```sh
git init && git add . && git commit -m "Reading Ladder — ISH EAL text simplifier"
gh repo create ish-reading-ladder --public --source=. --push
# then enable Pages: Settings → Pages → Deploy from a branch → main / root (or via API)
```

- Hosted on **GitHub Pages**; every push to `main` republishes (static files, no build step).
- `.nojekyll` is present so Pages serves the files as-is.
- ⚠️ As with Quest Forge, the current `gh` token may lack the `workflow` scope — use branch-deploy, not an
  Actions workflow. (`gh auth refresh -s workflow` first if you want Actions.)

The app name and repo name can be changed if the department prefers.

---

## Good to know

- **No student data** is stored or sent by the tool. The text draft and accessibility prefs stay in the
  teacher's own browser (`localStorage`).
- **Pasted replies are untrusted by design**: every screen is built with `textContent`, never `innerHTML`.
- The JSON auto-repair handles the usual AI quirks (code fences, an apology before the JSON, smart quotes,
  trailing commas). If a reply still won't build, tell the AI "reply with only the JSON object" and retry.

## Possible next steps

- A **one-click "to Google Doc"** export (currently: Copy all → paste).
- A small **shared phrase bank** of ISH's preferred phase labels, pre-filled per teacher.
- Optional **read-aloud** of each level for the lowest phases.
