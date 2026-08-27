# SongSketch AnyKey

SongSketch AnyKey is a free, local-first browser instrument for young and
returning songwriters. It puts a chromatic piano roll, drawable pitch bends,
and a small synthesized drum kit in one approachable sketch surface—without a
scale lock, account, sample download, or desktop DAW.

Live: <https://songsketch-anykey.sociobot.in>

## What it does

- Draw, move, resize, and delete melody notes across C3–B5.
- Grow a sketch from 1 to 64 bars (16 bars by default) and loop it at 40–240 BPM.
- Shape the selected note with an editable ±2-semitone pitch curve.
- Program kick, snare, closed-hat, and open-hat parts made entirely with Web
  Audio synthesis; no copyrighted samples ship with the app.
- Export standard MIDI, an editable SongSketch JSON backup, or a single
  self-contained HTML player with the melody, bends, and drums inside.
- Restore the latest project from IndexedDB and run offline after the first
  successful load.
- Compose by touch, pointer, or keyboard. In the piano roll, use arrow keys to
  move the cursor, Enter/Space to add or select, and Delete to remove.

The app has no server-side music storage, accounts, analytics, runtime CDN
scripts, or remote fonts. See [Privacy](https://songsketch-anykey.sociobot.in/privacy/)
and [Terms](https://songsketch-anykey.sociobot.in/terms/).

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm install
npm run dev
npm test
npm run build
```

The exact production build command is `npm run build`. It writes the static
site to `dist/`, with `dist/index.html` at the deploy root.

For real-browser mobile, accessibility, export, persistence, and offline tests:

```sh
npx playwright install chromium
npm run test:e2e
```

Preview the production output with `npm run preview`. Audio playback requires a
user gesture, as expected by modern browsers. Web Audio works in current Chrome,
Edge, Firefox, and Safari; downloaded MIDI files are for importing into another
music app rather than direct Web MIDI device output.

## Project structure

- `src/audio.ts` — local Web Audio melody and original drum synthesis
- `src/project.ts` — validated, serializable project model
- `src/midi.ts` — dependency-free Standard MIDI File writer
- `src/storage.ts` — IndexedDB persistence
- `public/sw.js` — versioned application-shell and asset cache
- `.factory/design.md` — product-specific visual system and artwork provenance

## Deployment

Deploy the contents of `dist/` as a **Standard static** site. Serve `sw.js`
from the root and do not apply a long immutable cache to it. Preserve both
emitted header manifests (`_headers` and `staticwebapp.config.json`): they
cache versioned `assets/` for one year with `immutable`, revalidate the shell
and worker, and apply the documented response protections. HTTPS is required
for service workers outside localhost.

## License

MIT. See [LICENSE](./LICENSE).
