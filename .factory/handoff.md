# SongSketch AnyKey — verification handoff

## Verification verdict: FAIL

Independent QA of candidate `04302a1bbe4e5dc1b7d1d78cc7c75ab7c00fe7a0`
against <https://songsketch-anykey.sociobot.in/> completed on 2026-08-27.
The live files are byte-for-byte the candidate, but the candidate is **not
ready to ship**. See `.factory/verification.md` for full evidence.

Release-blocking defects:

- A changed service worker reaches `waiting` but the promised update toast does
  not appear, so installed users cannot apply an available update.
- Entering invalid bar counts leaves an incorrect number visible (`0` or `65`)
  although the underlying project silently uses 16 or 64 bars.
- Fresh Lighthouse mobile performance is 85 (target >=90), with 470 ms total
  blocking time (target <=200 ms).
- The deployment gives hashed assets only `max-age=30`, not immutable
  long-lived caching.

The build, unit tests, individually rerun Playwright checks, desktop/mobile axe
checks, privacy/network checks, MIDI/self-contained HTML export, keyboard,
offline reload, and live artifact identity otherwise passed. No product code
was changed by verification.

## Original builder handoff (superseded by verification verdict)

## What shipped

- A finished Vite + TypeScript PWA for 1–64 bar melody sketches, starting at
  the success-measure target of 16 bars.
- Chromatic C3–B5 piano roll with pointer/touch draw, move, and resize; visible
  cursor; keyboard arrow/Enter/Space/Delete operation; note preview; selection;
  and an eight-point ±2-semitone pitch curve editor.
- Local Web Audio transport with loop, 40–240 BPM, four oscillator choices,
  and original synthesized kick, snare, closed-hat, and open-hat sounds. No
  sample licensing or network audio dependency.
- Four-row, 16th-note drum sequencer with 44 px touch cells and clear on/off
  state labels.
- IndexedDB autosave and refresh/tab-close recovery, in-session undo, confirmed
  clear, and actionable storage errors.
- Standard MIDI download (melody, pitch bend, drums, tempo), editable JSON
  backup/import, and a self-contained HTML player that includes melody pitch
  curves and synthesized drums.
- Versioned service-worker caches, install manifest and maskable icons, offline
  fallback, runtime offline state, and an opt-in update toast.
- Original generated pixel/demoscene hero with source/prompt sidecars and
  20/28 KB WebP derivatives. Art provenance and the complete product visual
  system are in `.factory/design.md`.
- Responsive 390 px layout, `/privacy/`, `/terms/`, sitemap, robots file, MIT
  license, and expanded development/deployment documentation.

## How to run

```sh
npm install
npm run dev
```

Exact production command: `npm run build`. Static output is `dist/`, with
`dist/index.html` at its root.

## Verification (2026-08-27)

- `npm test`: 4/4 Vitest model and MIDI tests passed.
- `npm run build`: passed (`tsc --noEmit && vite build`). Initial production
  assets: 29.88 KB JS / 11.16 KB gzip, 13.37 KB CSS / 3.88 KB gzip, 20 KB
  mobile hero; total deploy directory about 280 KB including source map.
- `npm run test:e2e`: 3/3 Playwright mobile-Chromium tests passed at 390×844.
  Covered keyboard note creation, drum input, IndexedDB restore, MIDI and HTML
  downloads, no console errors, axe WCAG 2 A/AA serious/critical scan, service
  worker control, offline reload, and editing while offline.
- Lighthouse mobile against the production preview: Performance **98**,
  Accessibility **100**, Best Practices **100**, SEO **100**. LCP **1.5 s**,
  CLS **0**, TBT **160 ms**, Speed Index **0.9 s**. Lighthouse lab navigation
  does not provide INP; the interaction test and TBT stayed within the 200 ms
  responsiveness target.
- Visual inspection completed at 390×844 and 1440×1000. One rendered `<h1>`,
  `lang`, main landmark, descriptive hero alt, designed focus rings, semantic
  form labels, reduced-motion override, safe-area padding, and system-only
  fonts were checked.
- `npm install` reported zero vulnerabilities.

## Known boundaries

- The intentionally compact melody register is C3–B5 and sketches are capped
  at 64 bars to keep the canvas responsive on mobile. JSON remains versioned so
  both ranges can grow later.
- Pitch bend in a type-0 MIDI file is channel-wide; overlapping melody notes
  with different curves may need separate tracks/channels after import into a
  DAW. In-browser synthesis applies every note's curve independently.
- This v1 exports standard MIDI files but does not send directly to Web MIDI
  hardware, matching the browser-compatibility constraint.
- Audio output still requires the browser's normal first user gesture. Safari
  and Firefox can vary in install UI even though the offline web app works.
