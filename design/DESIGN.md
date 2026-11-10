# Design reference

**Figma:** https://www.figma.com/design/6NPkrb0UeMPWLPTQtNXFcc/Game---Website-In-5-min

| Figma page | What's there |
|---|---|
| Cover | Title card |
| Foundations | Colour, type, spacing, logos, and the Website Kit styles samples |
| Characters | 5 clients × 4 moods, The Deadline, profile cards (brief, wishlist, deal-breakers, lines, lesson) |
| Rules | Scoring, everyone's rules, happiness bar, client wishlists, flow rules, stats, all voice lines, and a "perfect website" per client |
| Website Blocks | The 15 section components with their layouts and columns, pattern, decor and picture components |
| Screens | Desktop flow (00 → 06) and the Game UI components |
| Motion & Sound | Micro-interaction table, motion tokens, sound map, mixing rules and animated demos |
| Responsive | Mobile (390×844) and tablet (834×1194) screens |

## Visual direction
- **Clients:** they are the stars. Each client's screens take the client's colour: Gerald sky, Kaia lime, Rosa apricot, Damien plum, Brenda blush.
- **Pick:** clients are collectible trading cards. The selected card tilts 2° and gets a "Your client" sticker.
- **Builder:** the website sits in a browser window on a grey desk, and the client peeks up from the bottom to comment.
- **Verdict:**
  - The client reacts big.
  - The report card is scored out of 12, with a short design lesson.
  - A rubber stamp slams on.
- **Chrome:** the UI stays calm.
  - Sentence case.
  - Roboto Condensed headings, Roboto body.
  - Caveat only for the client's voice.
  - Buttons are tactile: a 2px black outline, 12px radius, and a 5px hard shadow that collapses on press.

## Components (Figma "Game UI components")
- **Game Button:** Primary / Secondary / On Dark × Default / Hover / Pressed.
- **Game Header:** Step 1–4, plus a mobile version.
- **Client Card:** the trading card. Variants: Default and Selected.
- **Speech Bubble:** tail down or up. Text in Caveat 34px (min 24) on white, with a 2px black outline.
- **Timer:** Calm (black) / Hurry ≤60s (orange, black text) / Panic ≤15s (magenta, white text).
- **Happiness Meter:** Happy (teal) / Meh (orange) / Meltdown (magenta) / Deal-breaker.
- **Builder controls:** Style Tabs, Palette / Font / Option / Picture / Style chips, Section Tile.
- **Small parts:** Keycap, Sound Toggle.
- **Logos:** one per program, in Dark-background and Light-background versions. Players never choose them.

## Screens
- **Desktop 1440×900:**
  - 00 Attract loop
  - 01 Start
  - 01b How to play
  - 02 Pick a client
  - 03 Brief
  - 04a–e Builder (one per tab)
  - 04f Time's up
  - 05a–c Verdict (happy / meh / meltdown)
  - 05d–e Share cards (1080×1080)
  - 06 Learn more
- **Mobile 390×844:** Start, How to play (bottom sheet), Pick (carousel), Brief, Builder (bottom sheet), Time's up, Verdict (scrolls), Learn more (scrolls).
- **Tablet 834×1194:** Start, Pick (3+2 grid), Brief, Builder (sections strip + docked panel), Verdict.

Run `npm run assets` to save PNGs of all of these into `design/screens/`.

## Accessibility notes
- **Text contrast:** every text layer in the Figma screens passes WCAG AA (checked automatically, 839 layers).
- **Website Kit palettes:** all text pairs pass AA. Use `--kit-on-accent` on accent, `--kit-on-accent-2` on accent-2, and `--kit-accent-text` for accent-coloured text.
- **Stamp and score-icon colours:** #007A7A, #B35F00 and #D72885 all pass on white.
- **Non-text colour:** the meter fill colours are decorative; the level is always written as text too.
