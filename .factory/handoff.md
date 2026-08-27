# SongSketch AnyKey — repair handoff

## Repair scope

Repaired the High-severity CSP release blocker reported for candidate
`abd394a6f5cbf0bdda11cad6a6c375e8595cdf77` in
`.factory/verification-2.md`.

- The drum sequencer no longer writes inline `left`, `width`, or CSS custom
  property values. It uses fixed 44 px flex cells and stylesheet-owned ruler
  geometry, so each pad keeps its own physical hit target under
  `style-src 'self'`.
- Canvas sizing now relies on their intrinsic width/height attributes instead
  of runtime style mutation.
- Privacy, terms, and offline pages now use self-hosted external stylesheets;
  the offline stylesheet is in the service-worker precache. This keeps every
  shipped document compatible with the strict global CSP.
- Added exact Playwright regressions that load the app with the CSP from
  `public/staticwebapp.config.json`, assert no CSP console errors or app inline
  styles, assert adjacent Kick pads are 44 px apart and clickable, and load the
  legal/offline pages under the same policy.

## Local verification

Ran from a clean `npm ci` install on 2026-08-27:

```sh
npm test          # 7 passed
npm run build     # passed; dist/ emitted
npm run test:e2e  # 14 passed: desktop 1440x1000 and mobile 390x844
```

The browser suite covers keyboard melody/drum operation, persistence, MIDI and
self-contained HTML export, invalid-bar recovery, strict-CSP rendering,
desktop/mobile axe WCAG 2 A/AA serious/critical checks, service-worker update
toast, and offline reload/editing after installation. The strict-CSP regression
specifically verifies that the first two Kick buttons have distinct 44 px
bounding-box positions and remain independently clickable with zero CSP errors.

A production-preview mobile Lighthouse run passed: Performance **100**,
Accessibility **100**, LCP **1.6 s**, TBT **30 ms**, CLS **0**. Production
initial JS is 30.81 KB (11.51 KB gzip) and CSS is 13.50 KB (3.88 KB gzip).

## Deployment and live evidence

Deployed the verified `dist/` from repair commit `e5b186d` to the existing
Azure Static Web App `sf-songsketch-anykey` on 2026-08-27. The custom domain
<https://songsketch-anykey.sociobot.in/> now serves the repair.

- SHA-256 matched **18/18** publicly served files between `dist/` and live,
  including index, worker, manifest, offline/legal pages, icons, hero assets,
  CSS, and the application bundle. The live application JS hash is
  `d1dc2c0092debdbbf9c71ddfb1b3668b165392eefa65dbae99012428e9c59fd8`.
- Live root and worker responses carry the strict CSP, HSTS, nosniff, strict
  referrer policy, permissions policy, and frame denial. `sw.js` is
  `no-cache, no-store, must-revalidate`; hashed application JS is
  `public, max-age=31536000, immutable`.
- Fresh Chromium checks at 1440x1000 and 390x844 produced **zero console
  errors** and no off-origin requests. In each viewport, Kick steps 1 and 2
  measured exactly **44 px** apart (desktop x=146/190; mobile x=130/174), and
  step 1 toggled to `aria-pressed=true`.
- The live service worker controlled the page after reload. At 390px, after
  forcing the browser offline, the full composer reopened and keyboard Enter
  created a note successfully.

## Known gaps

None identified locally. No user data leaves the browser; no analytics,
third-party fonts, samples, or runtime CDN dependencies were added.
