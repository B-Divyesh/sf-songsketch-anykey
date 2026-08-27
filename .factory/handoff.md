# SongSketch AnyKey — verification handoff

## Verdict: FAIL

Independent verification of candidate
`abd394a6f5cbf0bdda11cad6a6c375e8595cdf77` against
<https://songsketch-anykey.sociobot.in/> on 2026-08-27 found a High-severity
release blocker. The live deployment is byte-for-byte the candidate build, but
its `style-src 'self'` CSP blocks runtime inline styles used by the composer.
Opening the live composer generated 264 CSP console errors and left adjacent
drum pads stacked at the same screen coordinate, making the core drum grid not
reliably clickable. This violates the no-console-error quality gate and the
brief's drum-grid requirement.

The candidate must not be accepted until the CSP/style implementation is
compatible and a fresh live browser check confirms separately positioned,
clickable drum controls with no CSP console errors. Full evidence, including
passing local checks and live byte/header identity, is in
`.factory/verification-2.md`.

## Earlier builder repair notes

- Fixed service-worker update detection by retaining the newly installing
  worker through its state change. A waiting worker now displays the in-app
  **Update now** toast and activates via `SKIP_WAITING`.
- Normalized Bars consistently to 1–64 in both the UI and import model. Invalid
  typed values are visibly marked while editing, then reset to the applied
  value on blur/change with an announced explanation. Imported pitch curves are
  also constrained to the advertised ±2-semitone range.
- Made mobile startup repeatably fast: the canvas/grid composer initializes
  when the writer starts a sketch or scrolls into it; drum controls are
  windowed to the horizontal viewport instead of rebuilding all bars; and the
  piano-roll grid uses batched canvas paths. The full composer remains local,
  keyboard/touch operable, exportable, and offline-capable after initialization.
- Added versioned hero asset names plus Standard-static cache and security
  configuration. `assets/*` receives `Cache-Control: public, max-age=31536000,
  immutable`; HTML and `sw.js` are revalidated, and the emitted configuration
  supplies CSP, Permissions-Policy, nosniff, and frame protections.

## Regression coverage

- Unit tests cover an already-waiting and a newly-waiting service worker,
  0/65 imported bar counts, and imported pitch-curve clipping.
- Mobile Playwright covers the actual changed-worker update-toast path, invalid
  Bars UI/model agreement, local persistence, MIDI/HTML export, accessibility,
  and a controlled-page offline edit after service-worker installation.

## Earlier local verification

Executed in a clean `npm ci` checkout:

```sh
npm test          # 7 passed
npm run build     # passed; dist/ emitted
npm run test:e2e  # 5 passed (mobile Chromium)
```

Two fresh production-preview mobile Lighthouse runs (simulated throttling)
both passed the requested floor:

| Run | Performance | Accessibility | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 99 | 100 | 2.05 s | 0 ms | 0 |
| 2 | 99 | 100 | 2.04 s | 0 ms | 0 |

The production JS is 31.46 KB (11.77 KB gzip), well inside the 200 KB budget.
`dist/_headers` and `dist/staticwebapp.config.json` were confirmed present;
the latter was checked for immutable assets and non-cacheable `sw.js`.

## Deployment guidance from the builder

Deploy `dist/` as **Standard static**, preserving both header manifests.
`sw.js` must remain root-served and non-immutable. No infrastructure, DNS, or
billing settings were changed in this repository.

## Current known gap / next step

The deployment has since completed and does serve the candidate (including
long-lived immutable assets, `no-store` worker, and security headers). The
active failure is the CSP conflict described in the verdict. Re-run after a
repair:

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Then exercise the live composer with console capture, inspect adjacent
`.drum-step` bounding boxes, and repeat offline reload plus update-toast checks
before recording PASS.
