# BUILD.md — how to build "Website in 5 minutes"

This is the brief for the coding agent in Cursor. Work through the milestones **in order**. Each one ends with checks; don't move on until they pass. Paste a milestone into Cursor chat as a prompt, or say "Do milestone 3 from BUILD.md".

**Sources of truth**
- `data/game-data.json`: clients, wishlists, deal-breakers, scoring, voice lines, site copy, programs. Code reads this file; don't hard-code game content.
- `data/sound-cues.json`: sound cue IDs, mix levels, prompts.
- `design/tokens.css`: every colour, font, radius, shadow and motion token, with the same names as in Figma.
- `design/DESIGN.md`: the look, the components and the screen list.
- Figma: https://www.figma.com/design/6NPkrb0UeMPWLPTQtNXFcc/Game---Website-In-5-min. Use the Figma MCP to inspect any frame; node IDs are in `data/assets-manifest.json`.

---

## 0 · Ground rules (also in `.cursor/rules`)
- **Stack:** plain HTML, CSS and JavaScript ES modules. No framework, no bundler. The site is served as static files from GitHub Pages, so every path is relative.
- **Secrets:** no API keys in the browser, ever. ElevenLabs and Figma keys live only in `.env` and are used only by the scripts in `/scripts`.
- **Accessibility (WCAG 2.1 AA):**
  - Keep every colour pair from `tokens.css`; they are already checked.
  - Keyboard works everywhere. Focus is visible: a 3px outline in `--color-brand-highlight-on-light` with a 3px offset.
  - Touch targets are at least 44px.
  - Every sound has a visual twin, and the game is fully playable muted.
  - `prefers-reduced-motion` turns movement into fades.
- **Copy:** use the copy from `game-data.json` and the Figma screens. Sentence case everywhere, except the verdict stamps (APPROVED / REVISIONS / MELTDOWN).
- **Breakpoints (builder):**
  - 1024px and up: three columns (sections, website, options). 1024–1199px uses narrower side columns and icon tabs.
  - Below 1024px, and phones held sideways: website plus one options panel on the right; Sections is the first tab.
  - Phones held upright (below 744px): website first, options in a bottom panel that rests small, half or full height. Drag or tap its handle.
  - Other screens keep phone below 768px, tablet 768–1199px, desktop 1200px and up. Designs exist for 390, 834 and 1440.
- **Website preview** follows the width of its preview window (container query at 620px), not the player's screen. "Whole page" lays it out at 1200px and shrinks it to fit.
- **Touch:** press and hold a section in the preview, then drag to move it. The page can be added to the home screen and opens full screen (`manifest.webmanifest`).

## 1 · Project skeleton
Create:
```
index.html          one page, all screens are <section data-screen="...">
css/game.css        game UI (imports ../design/tokens.css)
css/site.css        the client-website kit (sections, styles, patterns, decor)
js/main.js          boot, router (state machine), idle timer
js/state.js         single game state object + subscribe()
js/scoring.js       pure functions: score(state, client) -> {points, rows, outcome, dealBreakers, rulesBroken}
js/audio.js         sound cue player (Web Audio), mute, ducking
js/stats.js         anonymous events -> Apps Script (no-op if STATS_URL is empty)
js/screens/*.js     one module per screen
js/site/*.js        renders the client's website from state (one function per section type)
config.js           public config: STATS_URL, INFO_SESSION urls (no secrets)
```
**Checks:** `npm run dev` serves the page, and the console is clean.

## 2 · Game state + scoring (no UI yet)
- **State:** `{ screen, client, sections:[{type, layout, columns}], palette, heading, body, style, picture, heroDecor, pattern, timeLeft, startedAt, played:[] }`.
- **Scoring:** implement `scoring.js` exactly as in `game-data.json > scoring`.
  - Perfect / also-works points.
  - Body font +1 if readable.
  - Decoration +1 only if the hero decor AND the pattern are on the client's lists.
  - Must-have +1.
  - The everyone's-rules penalties, never going below 0.
  - Any deal-breaker on the page = Meltdown.
- Write `tests/scoring.test.html` (or a Node test) that reproduces the three verdicts in Figma:
  - Gerald 11/12 Happy (Office handshake = also-works picture).
  - Rosa 6/12 Meh.
  - Kaia 5/12 with two deal-breakers = Meltdown.

**Checks:** the three cases pass.

## 3 · Screens, desktop first
Build each screen to match Figma (desktop 1440 frames, see DESIGN.md):
- **00 Attract loop:** clients speak in turn, with a "Tap anywhere to play" pill.
- **01 Start.**
- **01b How to play:** a modal with focus trap; Esc closes it.
- **02 Pick a client:** trading cards. ← → move the selection, Enter picks, "Surprise me" picks a random unplayed client.
- **03 Brief:** the client speaks the brief (bubble + voice); "Start building" starts the timer.
- **04 Builder:** header (progress, mood meter, timer, Send, mute), sections panel, browser preview, style panel with tabs Colour / Type / Style / Images / Decor.
- **04f Time's up:** at 0:00, auto-send.
- **05 Verdict:** report card out of 12, the stamp, the lesson, and the actions Next client / Share result / Learn the theory.
- **06 Learn more:** three program cards with Explore and Book an info session, plus the QR code.

**Checks:** you can play a whole round with the mouse and with the keyboard only.

## 4 · The builder
- **Sections:**
  - Add with +, drag, or keyboard.
  - Remove with ✕.
  - Reorder by drag or with ↑ ↓.
  - Set layout and columns from the selected section's toolbar.
- **Options:** every chip updates the preview live.
- **History:** undo, redo and start over (a history stack of states).
- **Mood meter:** the score updates on every change.
- **Live comments:**
  - The client peeks up from the bottom of the canvas with a bubble and their voice line, then ducks away after 3s.
  - At most one comment every 4s.
  - Triggers are in `clients[].lines.triggers` and `scoring.everyonesRules`.
- **Timer states:**
  - Calm while more than 60s are left.
  - Hurry at 60s or less: orange, with a tick each second.
  - Panic at 15s or less: magenta, with a wobble and a heartbeat.
  - At 30s the client says their `hurry` line.

**Checks:** each section type renders with each style, palette and font; there are no layout overflows at 1440, 834 or 390.

## 5 · The client's website (preview)
Render real HTML sections from `clients[].site` using the kit tokens:
- **Root element:** `<div class="site" data-palette data-heading data-body data-style>`.
- **Sections:** 15 section types with their layouts and columns, per `kit.sections`.
- **Columns on phones:** the preview collapses to 1 column (2 for gallery and team).
- **Patterns:** CSS gradients from `kit.sectionPatterns`; waves uses the SVG.
- **Hero decor and pictures:** SVGs in `assets/svg`. Photo pictures stay placeholders until real photos are chosen.

**Checks:** Gerald's perfect site looks like the "Perfect website" frame on the Figma Rules page.

## 6 · Motion and sound
Follow the Figma page **Motion & Sound**; its table is the spec.
- **Motion:**
  - Use the motion tokens.
  - One big moment per screen.
  - Verdict sequence: client rises (400ms), card slides (400ms), bubble pops, stamp slams (420ms `--ease-stamp`) with a 6px shake, score counts up.
- **Sound:**
  - `js/audio.js` loads `assets/audio/manifest.json`.
  - `play('ui.click')`, `say('voice.gerald.happy-1')`.
  - Music ducks 8 dB under voice, only one voice plays at a time, and audio unlocks on the first tap.
  - If an audio file is missing, fail silently (the bubbles still show).
- **Mute** is remembered for the session and resets at the attract loop.
- **Reduced motion:** no shake, wobble, confetti or bounce; fades only.

**Checks:** play muted with reduced motion on, and nothing is lost.

## 7 · Responsive
- **Phone (390):**
  - Header with numbered progress.
  - Pick is a swipe carousel.
  - The builder shows the phone layout of the site, with options in a bottom sheet (Sections / Colour / Type / Style / Images / Decor).
  - Verdict and Learn more scroll.
- **Tablet (834):**
  - Pick is a 3+2 grid.
  - The builder has a sections strip on top and a docked style panel at the bottom.

**Checks:** Chrome device toolbar at 390×844 and 834×1194 matches the Figma Responsive page.

## 8 · Share card, stats, idle
- **Share:** draw the 1080×1080 card on a `<canvas>` (see the 05d/05e frames). "Share result" uses the Web Share API with the PNG file if it's available, and otherwise downloads the PNG.
- **Stats:** `js/stats.js` posts `{event, …}` as `text/plain` to `config.STATS_URL`. It sends no personal data and is skipped if the URL is empty. Deploy `apps-script/Code.gs`.
- **Idle:** after 60s without input on any screen, fade back to the attract loop and reset the game.

## 9 · Audio and assets
- `npm run assets` pulls all SVGs and screen PNGs from Figma (needs FIGMA_TOKEN).
- `npm run audio:check` lists every voice line and sound (173 files).
- `npm run audio` generates them with ElevenLabs into `assets/audio` (needs ELEVENLABS_API_KEY and one voice ID per character). Commit the MP3s, never `.env`.

## 10 · Accessibility and QA pass
- **Lighthouse:** Accessibility at least 95, Performance at least 85 on desktop.
- **Keyboard-only:** play a full round.
- **Screen reader:** VoiceOver reads the client's lines (bubbles use `aria-live="polite"`) and the score breakdown.
- **Contrast:** check any new colour pair you introduce.
- **Overflow:** no horizontal scroll at 320px wide.

## 11 · Deploy to GitHub Pages
- **Repo:** create a public repo `website-in-5-minutes`, then push. Never push `.env`; it's in `.gitignore`.
- **Pages:** Settings > Pages > Deploy from branch `main`, folder `/` (root).
- **Share card:** put the live URL in `config.js` (`GAME_URL`).
