# Website in 5 minutes

A five-minute design game for Langara College, Department of Design Formation. Pick a picky cartoon client, read their brief, build their one-page website before the clock runs out, and find out if they're happy. At the end, explore Design Formation, Digital Media & Design and AI Application Design & Development.

- **Design:** the [Figma file](https://www.figma.com/design/6NPkrb0UeMPWLPTQtNXFcc/Game---Website-In-5-min)
- **Hosting:** GitHub Pages, public link
- **Built in:** Cursor

## What's in this folder

| Path | What it is |
|---|---|
| `BUILD.md` | Step-by-step build plan for the coding agent (start here) |
| `.cursor/rules/` | Rules Cursor applies automatically to every chat |
| `data/game-data.json` | Everything the game needs: clients, briefs, wishlists, deal-breakers, scoring, every voice line, site copy, programs |
| `data/sound-cues.json` | Every sound cue ID, mix level and generation prompt |
| `data/assets-manifest.json` | Figma node IDs for all artwork and screens |
| `design/tokens.css` | Colours, fonts, radii, shadows and motion as CSS variables (same names as Figma) |
| `design/DESIGN.md` | Visual direction, components, screen list, accessibility notes |
| `scripts/export-figma-assets.mjs` | Downloads all SVG artwork and screen PNGs from Figma |
| `scripts/generate-audio.mjs` | Creates all voice lines and sound effects with ElevenLabs |
| `apps-script/Code.gs` | Google Sheet receiver for anonymous stats |
| `.env` | Your private keys (ElevenLabs, Figma). Never shared, never pushed |
| `assets/` | Filled by the two scripts: `svg/` and `audio/` |

## Getting started

1. **Open the folder in Cursor.** Use File > Open Folder > `website-in-5-minutes`.
2. **Add your keys to `.env`:**
   - `ELEVENLABS_API_KEY`: from ElevenLabs > Developers > API keys.
   - One voice ID per character: `ELEVENLABS_VOICE_GERALD`, `ELEVENLABS_VOICE_KAIA`, `ELEVENLABS_VOICE_ROSA`, `ELEVENLABS_VOICE_DAMIEN`, `ELEVENLABS_VOICE_BRENDA` and `ELEVENLABS_VOICE_DEADLINE`. In ElevenLabs, go to Voices, open a voice and copy its ID. The comments in `.env` describe each character's voice.
   - `FIGMA_TOKEN`: from Figma > Settings > Security > Personal access tokens (read-only).
3. **Pull the artwork:** in Cursor's terminal, run `npm run assets`.
4. **Generate the audio:** run `npm run audio:check` to see the list of 173 files, then `npm run audio`. This uses ElevenLabs credits once. The MP3s are saved in `assets/audio` and the key never reaches the browser.
5. **Build:** in Cursor chat, say *"Read BUILD.md and do milestone 1."* Continue milestone by milestone.
6. **Preview:** run `npm run dev` and open http://localhost:5173.

You need Node 20.12 or newer (`node -v`).

## Still to decide
- **Info sessions:** the registration links for DF, DGMD and AIAP. Fill in `infoSessionUrl` in `data/game-data.json`.
- **Stats:** a Google Sheet. Deploy `apps-script/Code.gs`, then put the URL in `config.js`.
- **Pictures:** real stock photos for the "photo" pictures, or illustrations only.
