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
- Added `public/_headers` for Standard static deployment: Vite hashed assets
  receive `Cache-Control: public, max-age=31536000, immutable`; HTML and
  `sw.js` receive `no-cache` so updates remain discoverable.

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

Three fresh production-preview mobile Lighthouse runs (simulated throttling)
all passed the requested floor:

| Run | Performance | Accessibility | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 100 | 100 | 1.3 s | 10 ms | 0 |
| 2 | 100 | 100 | 1.6 s | 50 ms | 0 |
| 3 | 100 | 100 | 1.2 s | 30 ms | 0 |

The production JS is 31.46 KB (11.77 KB gzip), well inside the 200 KB budget.
`dist/_headers` was confirmed present in the static artifact.

## Deployment

Deploy `dist/` as **Standard static**, preserving `dist/_headers`. `sw.js`
must remain root-served and non-immutable. No infrastructure, DNS, or billing
settings were changed in this repository.

## Known gaps

None. Lighthouse’s static preview server does not itself interpret `_headers`;
the deployed Standard static host must apply that emitted header manifest.
