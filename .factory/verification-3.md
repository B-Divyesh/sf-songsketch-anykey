# SongSketch AnyKey — independent verification 3

**Verdict: PASS**  
**Candidate:** `1168e182654f516ba488440025025d0e15219df8`  
**Live URL:** <https://songsketch-anykey.sociobot.in/>  
**Verified:** 2026-08-27 from a clean checkout at the candidate SHA

The candidate meets the researched brief and the factory PWA acceptance
contract. This verification specifically rechecked the earlier deployment-only
CSP failure from fresh live evidence: it is fixed. The live strict CSP permits
the product's current stylesheet-only layout, adjacent drum pads have distinct
hit targets, and no CSP or application errors occur.

## Build and automated checks

- `npm ci`: installed 58 packages with 0 reported vulnerabilities.
- `npm test`: **7/7** Vitest project-model, MIDI, and service-worker tests
  passed.
- `npm run build`: passed (`tsc --noEmit && vite build`) and emitted `dist/`.
  There is no separate lint or type-check script; the build performs the
  repository's TypeScript check.
- `npm run test:e2e`: **14/14** passed after installing the lockfile-matched
  Chromium with `npx playwright install chromium` (desktop 1440x1000 and
  mobile 390x844). The initial browser launch failed only because the supplied
  browser cache was for a different Playwright revision; it was not a product
  failure.
- Fresh production-preview Lighthouse mobile audit: **100 Performance / 100
  Accessibility**; FCP 0.9 s, LCP 1.5 s, Speed Index 0.9 s, TBT 70 ms, CLS 0.
- Production bundle budgets pass: application JS **30,806 B** (11,510 B gzip),
  CSS **13,500 B** (3,880 B gzip), and mobile hero WebP **18,216 B**. No font
  payload is shipped.

## End-to-end product exercise

At desktop and 390px mobile production preview I created keyboard melody notes,
selected a note and edited its pitch curve, toggled drums, and started/stopped
the local Web Audio loop. The transport state changed correctly and produced
no console or page errors.

- Bars 1 and 64 both rendered correctly; invalid values `0` and `65` recovered
  visibly to 1 and 64 with the announced explanation. The 40--240 BPM control
  is bounded by the model and UI.
- MIDI export produced an 88-byte Standard MIDI file beginning
  `MThd ... MTrk`. JSON backup contained the entered notes. An invalid JSON
  import reported its parse error and a following valid import restored a
  two-bar project, demonstrating recovery rather than data loss.
- The generated HTML share download had no HTTP(S), external `<script>`, or
  external stylesheet dependency; loaded independently, its Play/Stop control
  worked.
- The clear dialog initially focused “Keep sketch”; Escape closed it and
  returned focus to Clear sketch. Keyboard navigation reached fields,
  transport, roll, pitch editor, and drum controls. The skip link and roll
  both showed a visible 3 px cyan focus ring.
- At 390px the document had no horizontal page overflow; drum pads measured
  44x50 px. With `prefers-reduced-motion: reduce`, button transition duration
  was 0.01 ms.

## Accessibility, privacy, PWA, and live deployment

- Independent axe WCAG 2 A/AA scan after opening the composer found **0
  serious or critical** findings. The checked page has `lang=en`, a title, one
  h1, a main landmark, a skip link, labeled controls, visible focus, and no
  console/page errors.
- Fresh live Chromium observed requests only to
  `https://songsketch-anykey.sociobot.in`; no analytics, trackers, remote
  fonts, CDN scripts, samples, or off-origin requests were made. IndexedDB is
  the only project persistence boundary; the privacy and terms pages load.
- Live `Page.getAppManifest` returned the expected manifest with no errors.
  After reload the service worker controlled the live page. With the network
  forced offline, the complete composer reloaded and remained usable. The
  passing browser suite also changes the worker byte-for-byte and confirms the
  in-app update toast appears for a waiting update.
- SHA-256 compared all **18** publicly served product files in `dist/` against
  the live URL: all matched, including index, JS, CSS, service worker,
  manifest, icons, hero images, offline fallback, and legal pages. The one
  non-public deployment configuration file, `staticwebapp.config.json`,
  correctly returns 404 rather than being served.
- Live root responses include strict CSP (`default-src 'self'` and
  `style-src 'self'`), HSTS, `nosniff`, strict referrer policy,
  Permissions-Policy, and frame denial. `sw.js` is
  `no-cache, no-store, must-revalidate`; hashed JS/CSS/assets are
  `public, max-age=31536000, immutable`.

## Defects by severity

- Critical: none.
- High: none.
- Medium: none.
- Low: none.

## Re-run

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

For live verification, compare hashes of the files in `dist/` with the live
paths, inspect `curl -sSI https://songsketch-anykey.sociobot.in/` and
`/sw.js`, then use a fresh Chromium profile to reload under service-worker
control and force offline before reopening the composer.
