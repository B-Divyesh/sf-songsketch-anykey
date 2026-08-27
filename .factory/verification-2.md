# SongSketch AnyKey — independent verification 2

**Verdict: FAIL**  
**Candidate:** `abd394a6f5cbf0bdda11cad6a6c375e8595cdf77`  
**Live URL:** <https://songsketch-anykey.sociobot.in/>  
**Verified:** 2026-08-27, from a new clean checkout

The live deployment is byte-for-byte the candidate build, including the
security configuration. It fails the product contract because the live
Content-Security-Policy blocks the app's own required runtime `style`
assignments. This creates console errors and makes the drum sequencer's cells
overlap, so the core drum-grid job cannot be used normally.

## Build and repository checks

- Cloned the candidate into a new temporary checkout, confirmed the exact SHA,
  then ran `npm ci`: 58 packages installed, **0 vulnerabilities**.
- `npm test`: **7/7** Vitest model, MIDI, and service-worker tests passed.
- `npm run build`: passed (`tsc --noEmit && vite build`) and emitted `dist/`.
  There is no separate lint script in `package.json`.
- After installing the declared Playwright Chromium dependency, `npm run
  test:e2e` passed: **5/5** mobile Chromium tests, including persistence,
  MIDI/HTML export, invalid bars recovery, changed-worker update toast, axe,
  and installed offline editing.
- Production output is within the stated static budgets: JS **31,498 B**
  (**11,790 B gzip**), CSS **13,460 B** (**3,880 B gzip**), and mobile hero
  **18,216 B**. A fresh Lighthouse 12.8.2 mobile audit of the production
  preview scored **100 Performance / 100 Accessibility**, LCP **1.3 s**, TBT
  **20 ms**, CLS **0**.

## Product exercise

In the production build at desktop 1440x1000 and mobile 390x844, I used the
keyboard to enter melody notes, toggled a drum control, started/stopped Web
Audio playback, and verified both viewports have no document horizontal
overflow. The 40 and 240 BPM boundaries worked. Bars 1 and 64 worked; `0` and
`65` visibly recovered to 1 and 64 with the announced explanation.

MIDI, self-contained HTML, and editable JSON project exports downloaded. The
HTML player had no external script, stylesheet, or HTTP(S) dependency. Invalid
JSON import announced its parse error; a following valid import recovered to a
project titled `Recovered`. Imported pitch data is constrained to the
advertised +/-2 semitone range by the model tests and implementation.

The roll has a visible 3 px focus outline. Keyboard-only note creation and
drum-button activation work in the local production preview. Under reduced
motion the computed transition duration is `0.01ms` and scrolling is `auto`.

## Live deployment, privacy, and PWA evidence

- SHA-256 comparisons matched all 14 checked deployment files with candidate
  `dist/`: index, worker, manifest, offline page, both legal pages, app JS/CSS,
  both hero images, and all four icons. The app bundle hash is
  `a960c0df844ae56307ac84cae5ad8ac2f885b65d2bedca1e1831a8acc4e1ab30`.
- Live headers have HSTS, `nosniff`, strict referrer policy, CSP,
  Permissions-Policy, and frame denial. `sw.js` is `no-cache, no-store,
  must-revalidate`; hashed app assets are correctly
  `public, max-age=31536000, immutable`.
- In fresh desktop and 390px live contexts, the service worker controlled the
  page after reload. With the browser offline, the complete composer reopened
  and a keyboard note was created. The local changed-worker regression test
  also passed, showing the required update toast.
- Desktop and mobile axe WCAG 2 A/AA runs found **0 serious or critical**
  violations. No automatic request left the SongSketch origin; inspection also
  confirms no analytics, remote font, remote sample, or runtime CDN path.

## Defects

### High — live CSP breaks core drum sequencing and emits console errors

The live response header uses `style-src 'self'`, while the application
creates and updates inline styles at runtime (for example, each drum pad gets
`style="left:...px"`). Chromium blocks these writes. Opening the composer on
the live site produced **264 console errors**, all:

```
Applying inline style violates the following Content Security Policy directive
'style-src 'self''.
```

The visible consequence is not cosmetic: the first three intended drum cells
all measured at the same x coordinate (**146 px**) despite their style
attributes declaring `left: 0px`, `left: 44px`, and `left: 88px`. The four
rows' pads are correspondingly stacked, and a normal click on `Kick, bar 1,
step 1` timed out because the overlapped controls were not stable. This breaks
the brief's drum grid and violates the mandatory zero-console-error gate.

This is deployment-specific: the preview server does not apply the emitted
`staticwebapp.config.json`, so the local browser suite passes. The live header
does apply that exact configuration, and all deployed product bytes match the
candidate.

## Re-run

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Then test the live composer in Chromium with console capture and inspect two
adjacent `.drum-step` bounding boxes. They must have distinct x coordinates
and the console must contain no CSP violation. Also compare live SHA-256s and
headers with `curl -sSI` before accepting a release.
