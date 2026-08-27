# SongSketch AnyKey — independent verification

**Verdict: FAIL**  
**Candidate:** `04302a1bbe4e5dc1b7d1d78cc7c75ab7c00fe7a0`  
**Live URL:** <https://songsketch-anykey.sociobot.in/>  
**Verified:** 2026-08-27 (fresh clean checkout)

The deployment does correspond to the candidate, but the candidate does not
meet the PWA update, invalid-input recovery, or mobile performance acceptance
requirements.

## Build and automated checks

- Started from a clean `main` at the candidate SHA; `npm ci` installed 58
  packages with **0 vulnerabilities**.
- `npm test`: **4/4** Vitest model/MIDI tests passed.
- `npm run build`: passed (`tsc --noEmit && vite build`) and produced `dist/`.
  No separate lint script exists. The production initial JS is 29,875 bytes
  (11,160 gzip), CSS 13,374 bytes (3,880 gzip), and mobile hero 18,216 bytes:
  all are below the stated static asset budgets.
- Builder Playwright checks were rerun individually after installing the
  documented Chromium dependency: keyboard/persistence/export, mobile axe,
  and installed offline reload all passed. (The combined three-test invocation
  exceeds this environment's 30-second command capture window; the same three
  tests passed separately.)
- Independent axe WCAG 2 A/AA scan at 1440 px: **0 violations**, including
  **0 serious/critical**. The checked-in mobile axe test also passed.
- Fresh Lighthouse mobile run against the production preview: **Performance
  85**, **Accessibility 100**; LCP **2.4 s**, CLS **0**, TBT **470 ms**. This
  misses the factory performance threshold (>=90) and the 200 ms
  responsiveness target.

## Product exercise

The production build was independently exercised at 1440x1000 and 390x844:

- Created melody notes by keyboard, reached both C3 and B5 boundaries, added a
  drum hit, started/stopped local Web Audio playback, and verified no horizontal
  page overflow at either viewport.
- Verified 40/240 BPM and 1/64-bar boundary values; exported MIDI and a
  self-contained HTML player. The share file had no external script, stylesheet,
  or HTTP(S) reference and contained the authored song data.
- Invalid JSON import displayed an error and retained the preceding project;
  a valid import then recovered into the editor. Clear-cancel also preserved the
  project.
- Keyboard focus on the roll is visibly a 3 px cyan (`rgb(101,231,241)`) ring.
  Under reduced motion, control transitions are `0.01ms` and document scrolling
  is `auto`.
- On clean local and live pages there were no console errors, page errors, or
  automatic third-party requests. Storage is IndexedDB-only; there are no
  remote fonts, analytics, samples, or runtime CDN dependencies.

## PWA and deployment evidence

- Local and live service workers controlled the page after reload. With the
  browser offline, the complete composer reloaded and a new keyboard note could
  be created. The live test had no console errors or external requests.
- The service-worker **update path fails**: a QA-only static server served the
  exact `dist/` files, then changed only a comment in `sw.js`. After
  `registration.update()`, the new worker was `waiting: true`, the old worker
  remained active and controlled the page, but `#update-toast` remained hidden.
  Therefore a user receives no required “update available” action.
- SHA-256 comparison confirms live byte-for-byte identity with candidate `dist/`
  for `index.html`, `sw.js`, manifest, JS, CSS, both hero WebPs, privacy page,
  and terms page. Example application bundle hash:
  `3fe1aeccc5ef1da86e1c92f8abcaadb4ce649a90642305908606c8dbf74cb52b`.
- Live responses have HSTS, `nosniff`, and a strict referrer policy. They do
  not send CSP, Permissions-Policy, or frame-ancestors protection. More
  importantly, every checked hashed asset is served as
  `cache-control: public, must-revalidate, max-age=30`, not long-lived
  immutable caching as required for static hashed assets.

## Defects

### High

1. **PWA updates are not surfaced to the user.** Reproduced as above: a changed
   worker becomes waiting but no update toast appears, so “Update now” cannot be
   used. This fails the PWA update requirement and leaves installed users on an
   old worker until browser-specific lifecycle behavior intervenes.
2. **Out-of-range Bars input displays a false project state.** Typing `0` then
   leaving the field leaves its visible value at `0` while the rendered grid has
   1,024 drum cells (the internal project silently used 16 bars). Typing `65`
   leaves `65` visible while the grid has 4,096 cells (internal project is 64
   bars). A composer cannot tell the actual loop length, and invalid input is
   not recovered visibly.
3. **Fresh mobile performance is below the acceptance floor.** Lighthouse
   performance is 85 rather than >=90, with 470 ms TBT rather than the stated
   <=200 ms responsiveness target.

### Medium

1. **Deployment cache policy defeats hashed-asset caching.** The live JS, CSS,
   and assets are revalidated after only 30 seconds instead of using immutable,
   long-lived caching. This misses the supplied PWA/performance cache policy.
2. **Imported pitch curves can exceed the advertised ±2 semitone range.** A
   JSON import with `[12, 12]` is accepted and re-exported unchanged, although
   the editor and design contract specify ±2. In-browser/share playback uses
   the 12-semitone values while MIDI clips them to ±2, producing inconsistent
   exports.

### Hardening observation

The live response policy lacks CSP, Permissions-Policy, and frame embedding
protection. This was not needed to establish the FAIL verdict, but should be
addressed with the deployment cache policy.

## Re-run

```sh
npm ci
npm test
npm run build
npx playwright install chromium
npx playwright test --grep 'creates, saves'
npx playwright test --grep 'serious accessibility'
npx playwright test --grep 'offline after installation'
```

Then run Lighthouse against `npm run preview`; compare live artifact hashes and
headers with `curl -sSI https://songsketch-anykey.sociobot.in/` and the hashed
assets referenced by the response.
