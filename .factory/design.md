# SongSketch AnyKey — visual thesis

## Direction: pocket demoscene workstation

SongSketch should feel like a tiny instrument booting on a beloved 1990s home
computer, not a reduced desktop DAW. The interface uses a crisp pixel/demoscene
language: squared corners, stepped shadows, one-pixel grid lines, bitmap-style
display type, tiny status lamps, and a star-map illustration made from the same
notes a learner draws. Decoration only appears where it teaches the product:
the hero image turns notes, a pitch curve, and drum hits into a small musical
world.

This is intentionally a single dark treatment. A dark “night workstation”
keeps the piano roll legible for long sessions and gives active notes enough
contrast to be recognized immediately. Every color state also has a shape,
icon, label, or position cue.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `ink-0` | `#090B16` | page and empty roll |
| `ink-1` | `#11162A` | raised surfaces |
| `ink-2` | `#1B2440` | controls and lanes |
| `paper` | `#F5F2DA` | primary text |
| `muted` | `#B7BDD3` | secondary text (7:1+ on ink) |
| `lime` | `#C8F85B` | melody, primary action |
| `cyan` | `#65E7F1` | pitch curve, focus, playhead |
| `coral` | `#FF746C` | drums and destructive warnings |
| `gold` | `#FFD166` | selection and attention |
| `success` | `#75E6A4` | saved/offline-ready status |

The palette comes from tracker software and oscilloscope phosphors, warmed by
paper-colored text so the product feels friendly to a learner rather than
clinical.

## Type and rhythm

- Display/UI: the device's `ui-monospace`/Consolas stack, set in compact caps
  with tracked spacing so labels read like a tracker display without requiring
  a font download.
- Reading and inputs: the device's `ui-sans-serif` system stack for excellent
  legibility and zero network or font payload. This system/mono pairing is
  intentionally self-contained rather than remotely hosted.
- Type scale: 12 / 14 / 16 / 20 / 28 / clamp(36–64) px. Body never drops below
  16 px; 12–14 px is reserved for short labels and coordinates.
- Spacing uses a 4 px base with 8, 12, 16, 24, 32, 48, and 64 px steps.
- Corners are 0–4 px. Main controls use a 3 px stepped shadow, not blur.

## Interaction grammar

- Draw notes by dragging across the piano roll; drag an existing note to move
  it and use its right handle to resize. Clicking a note selects it for the
  editable pitch lane.
- Drum pads toggle with a physical one-pixel inset. Playback advances a cyan
  one-cell playhead. Active notes glow only while sounding.
- A persistent transport carries the one primary action: Play. Export actions
  are grouped after creation, never promoted above making sound.
- Keyboard paths mirror the spatial model: arrows move the roll cursor,
  Enter/Space toggles a note or drum hit, Delete removes a selected note, and
  Space from outside editors toggles transport.
- Feedback is immediate and plain: “Saved on this device”, “MIDI downloaded”,
  and actionable error messages appear in a polite live region.

## Responsive intent

Desktop presents transport, melody, pitch, and drums as one vertical signal
path. At 390 px the transport wraps, inspector labels shorten, and editors
become horizontally scrollable with frozen row labels. Nothing essential is
dropped; advanced project import/export moves into a compact “Project” group.
Touch cells are at least 44 px in the drum grid and melody drawing supports
direct manipulation.

## Motion policy

State changes use 160 ms opacity/transform transitions. The playhead moves in
discrete musical steps rather than continuous animation. Button presses move
one pixel as if a key were depressed; notifications rise by 8 px. There are no
decorative loops or flashing effects. Under `prefers-reduced-motion: reduce`,
transitions are removed and the playhead updates instantly.

## Asset plan and provenance

- `assets/src/constellation-console.png` and optimized derivatives: generated
  specifically for this product as an abstract pixel-art musical constellation
  used in the hero. It must contain no people, brands, legible text, watermark,
  or representation of features the app does not have.
- Prompt sheet: “Wide pixel-art/demoscene illustration for a browser music
  sketchpad. A tiny midnight workstation floating in a star field; luminous
  lime note blocks form a rising melody constellation, coral square drum hits
  form a rhythm orbit, and one cyan pitch ribbon bends between them. Chunky
  16-bit pixels, limited near-black/navy/cream/lime/cyan/coral palette, strong
  silhouette, dark negative space on the left for interface copy, subtle CRT
  dither, no gradients, no people, no instruments with brand markings, no
  text, no watermark, no logos.”
- Generator: factory Azure image deployment via
  `/opt/fleet/lib/gen-image.sh`; generated 2026-08-27. Original asset license:
  project-owned generated artwork, released with the product under MIT.
- Icons and PWA marks are original inline/hand-authored SVG geometry derived
  from the app’s note-block and pitch-ribbon motif.

## Why it fits

Tracker aesthetics historically made deep musical control available on modest
hardware. Recasting that language as a welcoming, labeled sketch surface tells
returning and young writers that the tool is capable without implying the
complexity of a full DAW. The unrestricted horizontal grid is the hero; the
chrome behaves like a compact instrument around it.
