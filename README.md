# Reading Ladder

A static, no-build web app for the **English & EAL department of the International School of The Hague (ISH)** —
a GDPR-safe alternative to Diffit for **simplifying texts into multiple reading levels**.

## What it is

A teacher pastes **their own text**. Reading Ladder writes a careful AI prompt, the teacher pastes that prompt
into the school's AI — at ISH that's **Gemini in Google Workspace** (sign in with the ISH account) — and pastes
the reply back. The app validates the reply and turns it into a **ladder of reading levels** — the same text
re-written at each chosen EAL phase, each with a summary, key-word glossary, comprehension questions and sentence
starters, ready to read, copy or print.

There is **no API key, no server, no account, and no cost**. The whole app is plain HTML, CSS and vanilla
JavaScript that runs from static files and deploys to GitHub Pages.

## Why it exists (and why no built-in AI)

The EAL team wanted Diffit purely to *simplify texts*, but sending student-facing text to a third-party vendor's
servers is hard to clear under **GDPR and the EU AI Act**. (MagicSchool, which ISH also has, doesn't reliably
re-level one text into several matched EAL phases — so it doesn't cover this need.) Reading Ladder side-steps the
compliance problem:

- The tool **uploads nothing** — it only builds text in the browser.
- The teacher runs the AI step in **Gemini signed into their ISH Google account**, so the text stays inside the
  school's existing **Google Workspace** agreement — no new third-party processor to assess.
- The teacher pastes **their own or public-domain text**, so no one else's copyright is sent anywhere.

This is the same copy-paste "AI bridge" pattern as the department's *Quest Forge* tool.

## Levels

Levels are **EAL phases with CEFR anchors**, and the labels are **editable** so they match how the team places
students. Defaults:

| Level | CEFR | Audience |
|-------|------|----------|
| Phase 1 | Pre-A1 / A1 | New to English |
| Phase 2 | A1 / A2 | Beginning |
| Phase 3 | A2 / B1 | Developing |
| Phase 4 | B1 / B2 | Expanding |
| Phase 5 | B2 / C1 | Bridging |
| Original | C1 / C2 | At grade level (the teacher's own text, unchanged) |

Each phase carries concrete language rules (sentence length, vocabulary band, grammar) that the AI is told to
follow, so the levels behave predictably regardless of the label.

## Per-level output

- **Simplified passage** (always) — the same meaning, simpler language, with a live (always-recomputed) word count.
- **Short summary** — a 2–3 sentence "in short" written *at that level* (Diffit's Three-Sentence Summary), good
  for EAL pre-reading.
- **Key-word glossary** — hard words with a simple definition, an example sentence, and an optional
  **home-language translation**.
- **Comprehension questions** — tagged *literal → inferential → evaluative*, each with a model answer for the
  teacher (hide-able before printing).
- **Sentence starters** — stems for written responses, with a write-on line.

Each output is a toggle in step 3; all are on by default.

## How it compares to Diffit

Diffit takes a topic / pasted text / URL / YouTube video, picks a US **grade level**, and returns a leveled
passage + summary + vocabulary + questions — but it **processes the text on its own servers** (an undisclosed AI
sub-processor, no published GDPR DPA), which is why ISH can't clear it. Reading Ladder covers the same *teaching*
output for the EAL use case — and adds **CEFR-anchored levels**, **home-language glossary** and **sentence
starters** Diffit doesn't surface — while sending nothing itself. The trade-off: the teacher runs the one AI step
by hand (which the UI now teaches explicitly), and URL/video ingestion is intentionally omitted because it would
require a server. See [`how-to.html#privacy`](how-to.html).

## How a teacher uses it

1. **Your text** — title, subject, and the passage (or leave empty to generate from the topic).
2. **Levels** — tick the phases; rename labels if needed.
3. **What to include** — toggle glossary / questions / starters; optional home language.
4. **Copy the prompt** into the school AI.
5. **Paste the reply** — the app cleans it up and builds the worksheets.

Results can be **printed / saved as PDF** (each level on its own page; hide answer keys first for clean student
copies), **copied as plain text** for Google Docs / Classroom, or viewed **side-by-side** for comparison.

**Sharing a level** — each level card has three buttons: **✉ Email** opens the teacher's *own* mail client with a
pre-filled draft (subject + worksheet, **answer key stripped**); nothing is sent until the teacher presses send,
and over the ~2000-char `mailto` ceiling it falls back to copy-to-clipboard (Windows silently no-ops otherwise).
**ManageBac** copies the task as clean plain text (no answers) to paste into a task/message — there is no
auto-post (that would need a server + login, which the design avoids); the **Print / Save PDF** also attaches to a
ManageBac task. **Copy** gives the teacher the full worksheet *including* answers.

A built-in visual guide lives at **`how-to.html`** (linked from the header), including the privacy rationale.

## Accessibility

Dark mode, a dyslexia-friendly font (Atkinson Hyperlegible), bigger-text and high-contrast toggles, full keyboard
use, ARIA live regions, reduced-motion honoured. Preferences persist across pages in `localStorage`.

## Run locally

```sh
node dev-server.cjs        # serves http://localhost:4185/
```

No build step, nothing to install. The dev server just serves the static files.

## Tests

```sh
node --test tests/eal.test.cjs   # 20 tests: prompt builder, JSON auto-repair, candidate selection, normaliser, summary, export
```

## File structure

**Pages**

- `index.html` — the tool (the five-step workflow + results).
- `how-to.html` — illustrated teacher guide, with the GDPR / AI-Act rationale (`#privacy`).

**JavaScript** (each an IIFE exposing one global)

- `config.js` — `window.EAL_CONFIG`.
- `levels.js` — `EALLevels`: the editable EAL-phase ↔ CEFR table and per-level language rules.
- `prompt.js` — `EALPrompt.buildPrompt(inputs)`: builds the full AI prompt (embeds the teacher's text).
- `schema.js` — `EALSchema`: DOM helpers + the JSON auto-repair pipeline + `normalizePack` / `validatePackText`.
- `render.js` — `EALRender`: builds the level worksheets (XSS-safe via `textContent`) + plain-text export + copy.
- `store.js` — `EALStore`: prefs and the text draft in versioned `localStorage` (in-memory fallback).
- `app.js` — `EALApp`: wires the workflow, the level list, toggles and the results tools.
- `data.js` — `window.EAL_SAMPLE`: a worked example (the water cycle) for the "See an example" button.

**Assets & misc**

- `styles.css` — the "Reading room" theme (light + dark) and the print layout.
- `assets/ish-logo.png`, `assets/favicon.svg` — ISH branding.
- `dev-server.cjs` — tiny static server (not deployed).
- `tests/eal.test.cjs` — Node test suite.

## Output schema (`ish-eal@1`)

```jsonc
{ "schema": "ish-eal@1",
  "meta": { "title": "", "topic": "", "sourceWords": 0 },
  "levels": [
    { "phase": "Phase 1", "cefr": "A1", "audience": "",
      "summary": "", "passage": "", "wordCount": 0,
      "glossary": [ { "word": "", "definition": "", "example": "", "translation": "" } ],
      "questions": [ { "q": "", "type": "literal|inferential|evaluative", "answer": "" } ],
      "starters": [ "" ] }
  ] }
```

Every pasted reply runs through `validatePackText` → `normalizePack`, which strips code fences and stray prose,
fixes smart quotes and trailing commas, clamps fields, recomputes word counts, and flags any level with no
passage — so a messy AI reply is repaired and made safe before it renders.

## Privacy

- **No backend, no database, no logins.** Everything runs in the browser.
- **No uploads from the tool.** The teacher controls what goes to the school AI.
- The text draft and accessibility prefs live in **`localStorage` only**, on the teacher's own device.
- Pasted replies are treated as untrusted: the app builds every screen with `textContent`, never `innerHTML`.

## Deploy

Static files → **GitHub Pages** (`main` / root). `.nojekyll` is present so files serve as-is. Sibling repos:
`ish-english-quests`, `ish-bodies-of-work`.
