# SongSketch AnyKey — repair handoff

## What changed

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

## Verification

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

## Deployment

Deploy `dist/` as **Standard static**, preserving both header manifests.
`sw.js` must remain root-served and non-immutable. No infrastructure, DNS, or
billing settings were changed in this repository.

## Known gaps

The repaired commit `6b5f183` is pushed to `main` for Standard-static release.
At the final live check (2026-08-27 21:49 UTC), the public endpoint was still
serving the prior worker (`max-age=30`) and did not yet expose the new versioned
hero asset. The repository artifact is complete and buildable; the external
static release needs to finish before live header/artifact verification can be
repeated. Lighthouse’s local preview does not itself interpret `_headers`.
