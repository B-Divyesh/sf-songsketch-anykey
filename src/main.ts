import './style.css';
import { AudioEngine } from './audio';
import { createMidi } from './midi';
import {
  DRUM_NAMES, MAX_PITCH, MIN_PITCH, STEPS_PER_BAR, clamp, createProject, makeId,
  normalizeProject, noteAt, pitchName, resizeProject, totalSteps, type Note, type Project,
} from './project';
import { createShareHtml, download, safeFilename } from './share';
import { loadProject, saveProject } from './storage';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="SongSketch AnyKey home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>SONGSKETCH <b>ANYKEY</b></span></a>
    <div class="header-status"><span class="signal-lamp" aria-hidden="true"></span><span id="connection-status">Checking offline kit…</span></div>
  </header>
  <main id="main">
    <section class="hero" aria-labelledby="page-title">
      <div class="hero-copy">
        <p class="eyebrow">NO SCALE LOCK · NO INSTALL · YOUR FILES</p>
        <h1 id="page-title">Catch the tune<br><em>before it gets away.</em></h1>
        <p>Draw any note. Bend its pitch. Tap in drums. SongSketch is a small, private music notebook that keeps playing when the internet disappears.</p>
        <a class="button primary" href="#composer">Start a 16-bar sketch <span aria-hidden="true">↓</span></a>
      </div>
      <picture>
        <source media="(max-width: 700px)" srcset="/assets/constellation-console-720.webp" />
        <img src="/assets/constellation-console.webp" width="960" height="640" alt="Pixel-art workstation with lime melody blocks, coral drum hits, and a cyan pitch ribbon orbiting through space" fetchpriority="high" />
      </picture>
    </section>

    <section class="composer" id="composer" aria-labelledby="composer-title">
      <div class="section-heading">
        <div><p class="eyebrow">LOCAL PROJECT / AUTO-SAVED</p><h2 id="composer-title">Your sketch</h2></div>
        <p class="save-state" id="save-state" role="status">Loading this device…</p>
      </div>

      <div class="project-strip">
        <label class="field grow"><span>Sketch name</span><input id="project-title" maxlength="80" value="Untitled signal" /></label>
        <label class="field"><span>Tempo</span><span class="input-suffix"><input id="tempo" type="number" min="40" max="240" inputmode="numeric" value="112" /><small>BPM</small></span></label>
        <label class="field"><span>Bars</span><input id="bars" type="number" min="1" max="64" inputmode="numeric" value="16" /></label>
        <label class="field"><span>Sound</span><select id="wave"><option value="triangle">Soft chip</option><option value="sine">Pure</option><option value="square">Bright chip</option><option value="sawtooth">Buzz</option></select></label>
      </div>

      <div class="transport" aria-label="Transport controls">
        <button class="button primary play-button" id="play"><span aria-hidden="true">▶</span> Play loop</button>
        <button class="button" id="stop" disabled><span aria-hidden="true">■</span> Stop</button>
        <span class="counter" id="position" aria-live="off">BAR 01 · STEP 01</span>
        <span class="transport-spacer"></span>
        <button class="button quiet" id="undo" disabled>↶ Undo</button>
        <button class="button quiet danger" id="clear">Clear sketch</button>
      </div>

      <div class="empty-callout" id="empty-callout">
        <span class="empty-icon" aria-hidden="true">♪</span>
        <div><strong>Your grid is wide open.</strong><p>Drag across the melody grid to draw a note, or tap a drum square. Press Play whenever you like.</p></div>
      </div>

      <section class="editor-section" aria-labelledby="melody-heading">
        <div class="editor-heading">
          <div><span class="track-number">01</span><h2 id="melody-heading">Melody</h2><span class="track-tag melody-tag">FREE PITCH</span></div>
          <p id="roll-help">Drag to draw. Drag a note to move it; drag its right edge to resize. Keyboard: arrows move, Enter adds, Delete removes.</p>
        </div>
        <div class="roll-shell">
          <div class="roll-corner" aria-hidden="true">NOTE</div>
          <div class="ruler-wrap"><canvas id="ruler" aria-hidden="true"></canvas></div>
          <div class="keys" id="keys" aria-hidden="true"></div>
          <div class="roll-scroll" id="roll-scroll" tabindex="-1">
            <canvas id="roll" tabindex="0" role="application" aria-label="Free-pitch piano roll, empty" aria-describedby="roll-help"></canvas>
          </div>
        </div>
      </section>

      <section class="editor-section pitch-section" aria-labelledby="pitch-heading">
        <div class="editor-heading">
          <div><span class="track-number">↳</span><h2 id="pitch-heading">Pitch shape</h2><span class="track-tag pitch-tag">±2 SEMITONES</span></div>
          <p id="pitch-help">Select a melody note, then drag here to bend it.</p>
        </div>
        <div class="pitch-wrap" id="pitch-wrap">
          <canvas id="pitch" tabindex="0" aria-label="Pitch curve editor. Select a note first." aria-describedby="pitch-help"></canvas>
          <p class="pitch-empty" id="pitch-empty">SELECT A NOTE ABOVE TO SHAPE ITS PITCH</p>
        </div>
        <button class="text-button" id="reset-pitch" disabled>Reset pitch shape</button>
      </section>

      <section class="editor-section" aria-labelledby="drums-heading">
        <div class="editor-heading">
          <div><span class="track-number">02</span><h2 id="drums-heading">Drums</h2><span class="track-tag drum-tag">SYNTH KIT</span></div>
          <p>Tap squares to build a beat. Sounds are synthesized here—no samples or downloads.</p>
        </div>
        <div class="drum-scroll"><div class="drum-grid" id="drum-grid" role="group" aria-label="Drum sequencer"></div></div>
      </section>

      <section class="export-section" aria-labelledby="export-heading">
        <div><p class="eyebrow">TAKE IT WITH YOU</p><h2 id="export-heading">Your song is not trapped here.</h2><p>MIDI opens in most music apps. The share file plays by itself. Project JSON is your editable backup.</p></div>
        <div class="export-actions">
          <button class="button primary" id="export-midi">Export MIDI</button>
          <button class="button" id="export-html">Share as HTML</button>
          <button class="button" id="export-json">Back up project</button>
          <label class="button file-button">Import project<input id="import-json" type="file" accept="application/json,.json" /></label>
        </div>
      </section>
    </section>

    <section class="principles" aria-label="Product principles">
      <div><span>01</span><h2>Every note means every note.</h2><p>Chromatic from C3 to B5. No hidden key, no wrong squares.</p></div>
      <div><span>02</span><h2>Private by construction.</h2><p>Your sketch is stored in this browser. Nothing is sent to us.</p></div>
      <div><span>03</span><h2>Small enough to keep.</h2><p>Install it or save the page. The full instrument works offline.</p></div>
    </section>
  </main>
  <footer><p>SongSketch AnyKey · a tiny local instrument</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-songsketch-anykey">Source</a></nav><p class="art-note">Original generated pixel artwork · no tracking</p></footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <dialog id="clear-dialog"><form method="dialog"><p class="eyebrow">CLEAR PROJECT?</p><h2>Erase this sketch?</h2><p>This removes every note and drum hit. You can undo it until you close the page.</p><div class="dialog-actions"><button class="button" value="cancel">Keep sketch</button><button class="button danger-solid" value="confirm">Erase sketch</button></div></form></dialog>
  <div class="update-toast" id="update-toast" role="status"><span>A fresh offline version is ready.</span><button class="button" id="update-app">Update now</button></div>
`;

const CELL_W = 28;
const ROW_H = 24;
const ROWS = MAX_PITCH - MIN_PITCH + 1;
const engine = new AudioEngine();
let project = createProject();
let selectedId: string | null = null;
let cursorStep = 0;
let cursorPitch = 60;
let playhead = -1;
let undoState: Project | null = null;
let saveTimer = 0;
let pointerAction: { type: 'draw' | 'move' | 'resize'; note: Note; originStep: number; originPitch: number; original: Note } | null = null;

const $ = <T extends HTMLElement>(selector: string) => document.querySelector<T>(selector)!;
const roll = $('#roll') as HTMLCanvasElement;
const ruler = $('#ruler') as HTMLCanvasElement;
const pitchCanvas = $('#pitch') as HTMLCanvasElement;
const rollScroll = $('#roll-scroll');
const titleInput = $('#project-title') as HTMLInputElement;
const tempoInput = $('#tempo') as HTMLInputElement;
const barsInput = $('#bars') as HTMLInputElement;
const waveSelect = $('#wave') as HTMLSelectElement;

function cloneProject(value: Project): Project { return structuredClone(value); }

function announce(message: string): void {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(Number(toast.dataset.timer));
  toast.dataset.timer = String(window.setTimeout(() => toast.classList.remove('visible'), 2600));
}

function remember(): void {
  undoState = cloneProject(project);
  ($('#undo') as HTMLButtonElement).disabled = false;
}

function changed(message = 'Saved on this device'): void {
  project.updatedAt = Date.now();
  renderAll();
  $('#save-state').textContent = 'Saving locally…';
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(async () => {
    try { await saveProject(project); $('#save-state').textContent = message; }
    catch { $('#save-state').textContent = 'Could not save here — export a backup'; announce('Local save failed. Back up the project to keep your work.'); }
  }, 220);
}

function updateFields(): void {
  titleInput.value = project.title;
  tempoInput.value = String(project.tempo);
  barsInput.value = String(project.bars);
  waveSelect.value = project.wave;
}

function resizeCanvases(): void {
  const width = totalSteps(project) * CELL_W;
  roll.width = width; roll.height = ROWS * ROW_H;
  roll.style.width = `${width}px`; roll.style.height = `${ROWS * ROW_H}px`;
  ruler.width = width; ruler.height = 32; ruler.style.width = `${width}px`;
  pitchCanvas.width = Math.max(640, Math.min(width, 4096)); pitchCanvas.height = 140;
  const keys = $('#keys');
  keys.innerHTML = Array.from({ length: ROWS }, (_, row) => {
    const midi = MAX_PITCH - row;
    return `<span class="${[1,3,6,8,10].includes(midi % 12) ? 'black' : ''}">${pitchName(midi)}</span>`;
  }).join('');
  renderDrums();
}

function drawRuler(): void {
  const context = ruler.getContext('2d')!;
  context.clearRect(0, 0, ruler.width, ruler.height);
  context.font = '700 11px ui-monospace, monospace'; context.textBaseline = 'middle';
  for (let step = 0; step < totalSteps(project); step += 1) {
    const x = step * CELL_W;
    if (step % STEPS_PER_BAR === 0) {
      context.fillStyle = '#65e7f1'; context.fillRect(x, 27, 1, 5);
      context.fillStyle = '#b7bdd3'; context.fillText(`BAR ${step / STEPS_PER_BAR + 1}`, x + 6, 14);
    } else if (step % 4 === 0) {
      context.fillStyle = '#526080'; context.fillRect(x, 28, 1, 4);
    }
    if (step === playhead) { context.fillStyle = '#65e7f1'; context.fillRect(x, 0, 2, 32); }
  }
}

function drawRoll(): void {
  const context = roll.getContext('2d')!;
  context.clearRect(0, 0, roll.width, roll.height);
  for (let row = 0; row < ROWS; row += 1) {
    const midi = MAX_PITCH - row;
    context.fillStyle = [1, 3, 6, 8, 10].includes(midi % 12) ? '#0d1121' : '#11162a';
    context.fillRect(0, row * ROW_H, roll.width, ROW_H);
  }
  context.strokeStyle = '#222c49'; context.lineWidth = 1;
  for (let step = 0; step <= totalSteps(project); step += 1) {
    context.strokeStyle = step % STEPS_PER_BAR === 0 ? '#526080' : step % 4 === 0 ? '#303b5b' : '#1b2440';
    context.beginPath(); context.moveTo(step * CELL_W + 0.5, 0); context.lineTo(step * CELL_W + 0.5, roll.height); context.stroke();
  }
  for (let row = 0; row <= ROWS; row += 1) {
    context.strokeStyle = '#1b2440'; context.beginPath(); context.moveTo(0, row * ROW_H + 0.5); context.lineTo(roll.width, row * ROW_H + 0.5); context.stroke();
  }
  if (playhead >= 0) {
    context.fillStyle = 'rgba(101,231,241,.14)'; context.fillRect(playhead * CELL_W, 0, CELL_W, roll.height);
    context.fillStyle = '#65e7f1'; context.fillRect(playhead * CELL_W, 0, 2, roll.height);
  }
  for (const note of project.notes) {
    const x = note.start * CELL_W + 2; const y = (MAX_PITCH - note.pitch) * ROW_H + 3;
    const width = note.length * CELL_W - 4; const selected = note.id === selectedId;
    context.fillStyle = selected ? '#ffd166' : '#c8f85b'; context.fillRect(x, y, width, ROW_H - 6);
    context.fillStyle = selected ? '#090b16' : '#162010'; context.fillRect(x, y + ROW_H - 9, width, 3);
    if (selected) { context.fillStyle = '#090b16'; context.fillRect(x + width - 5, y + 2, 3, ROW_H - 10); }
  }
  const cursorX = cursorStep * CELL_W + 1; const cursorY = (MAX_PITCH - cursorPitch) * ROW_H + 1;
  context.strokeStyle = '#65e7f1'; context.lineWidth = 2; context.strokeRect(cursorX, cursorY, CELL_W - 2, ROW_H - 2);
  roll.setAttribute('aria-label', `Free-pitch piano roll, ${project.notes.length} ${project.notes.length === 1 ? 'note' : 'notes'}. Cursor ${pitchName(cursorPitch)}, bar ${Math.floor(cursorStep / 16) + 1}, step ${cursorStep % 16 + 1}.`);
}

function drawPitch(): void {
  const context = pitchCanvas.getContext('2d')!;
  context.fillStyle = '#0d1121'; context.fillRect(0, 0, pitchCanvas.width, pitchCanvas.height);
  context.strokeStyle = '#263352'; context.lineWidth = 1;
  [0.25, 0.5, 0.75].forEach((fraction) => { context.beginPath(); context.moveTo(0, pitchCanvas.height * fraction + .5); context.lineTo(pitchCanvas.width, pitchCanvas.height * fraction + .5); context.stroke(); });
  const note = project.notes.find((entry) => entry.id === selectedId);
  const empty = $('#pitch-empty'); const reset = $('#reset-pitch') as HTMLButtonElement;
  if (!note) { empty.hidden = false; reset.disabled = true; return; }
  empty.hidden = true; reset.disabled = false;
  context.strokeStyle = '#65e7f1'; context.lineWidth = 3; context.beginPath();
  note.curve.forEach((value, index) => {
    const x = index / (note.curve.length - 1) * pitchCanvas.width;
    const y = pitchCanvas.height / 2 - value / 2 * (pitchCanvas.height / 2 - 12);
    if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
  });
  context.stroke();
  context.fillStyle = '#ffd166';
  note.curve.forEach((value, index) => {
    const x = index / (note.curve.length - 1) * pitchCanvas.width;
    const y = pitchCanvas.height / 2 - value / 2 * (pitchCanvas.height / 2 - 12);
    context.fillRect(x - 3, y - 3, 7, 7);
  });
  pitchCanvas.setAttribute('aria-label', `Pitch curve editor for ${pitchName(note.pitch)}, ${note.curve.length} points, range plus or minus 2 semitones.`);
}

function renderDrums(): void {
  const container = $('#drum-grid');
  container.style.setProperty('--steps', String(totalSteps(project)));
  const labels = project.drums.map((row, rowIndex) => `<div class="drum-row"><span class="drum-label"><b>${DRUM_NAMES[rowIndex]}</b><small>${rowIndex === 0 ? 'LOW' : rowIndex === 1 ? 'SNAP' : rowIndex === 2 ? 'TICK' : 'AIR'}</small></span><div class="drum-steps">${row.map((active, step) => `<button class="drum-step${active ? ' active' : ''}${step === playhead ? ' playing' : ''}" data-row="${rowIndex}" data-step="${step}" aria-label="${DRUM_NAMES[rowIndex]}, bar ${Math.floor(step / 16) + 1}, step ${step % 16 + 1}${active ? ', on' : ', off'}" aria-pressed="${active}"><span aria-hidden="true"></span></button>`).join('')}</div></div>`).join('');
  container.innerHTML = `<div class="drum-ruler"><span></span><div>${Array.from({ length: project.bars }, (_, index) => `<span>BAR ${index + 1}</span>`).join('')}</div></div>${labels}`;
}

function renderAll(): void {
  drawRuler(); drawRoll(); drawPitch(); renderDrums();
  $('#empty-callout').hidden = project.notes.length > 0 || project.drums.some((row) => row.some(Boolean));
}

function pointerGrid(event: PointerEvent): { step: number; pitch: number; x: number } {
  const rect = roll.getBoundingClientRect();
  const scaleX = roll.width / rect.width; const scaleY = roll.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  return { x, step: clamp(Math.floor(x / CELL_W), 0, totalSteps(project) - 1), pitch: clamp(MAX_PITCH - Math.floor((event.clientY - rect.top) * scaleY / ROW_H), MIN_PITCH, MAX_PITCH) };
}

roll.addEventListener('pointerdown', (event) => {
  event.preventDefault(); roll.setPointerCapture(event.pointerId); remember();
  const point = pointerGrid(event); cursorStep = point.step; cursorPitch = point.pitch;
  const existing = noteAt(project, point.step, point.pitch);
  if (existing) {
    selectedId = existing.id;
    const nearEnd = (existing.start + existing.length) * CELL_W - point.x < 9;
    pointerAction = { type: nearEnd ? 'resize' : 'move', note: existing, originStep: point.step, originPitch: point.pitch, original: { ...existing, curve: [...existing.curve] } };
  } else {
    const note: Note = { id: makeId(), start: point.step, length: 1, pitch: point.pitch, curve: Array(8).fill(0) as number[] };
    project.notes.push(note); selectedId = note.id;
    pointerAction = { type: 'draw', note, originStep: point.step, originPitch: point.pitch, original: { ...note, curve: [...note.curve] } };
    engine.preview(point.pitch, project.wave);
  }
  drawRoll(); drawPitch();
});

roll.addEventListener('pointermove', (event) => {
  if (!pointerAction || !roll.hasPointerCapture(event.pointerId)) return;
  const point = pointerGrid(event); const { note, original } = pointerAction;
  if (pointerAction.type === 'draw') {
    note.start = Math.min(pointerAction.originStep, point.step);
    note.length = Math.abs(point.step - pointerAction.originStep) + 1;
    note.pitch = point.pitch;
  } else if (pointerAction.type === 'move') {
    note.start = clamp(original.start + point.step - pointerAction.originStep, 0, totalSteps(project) - original.length);
    note.pitch = clamp(original.pitch + point.pitch - pointerAction.originPitch, MIN_PITCH, MAX_PITCH);
  } else note.length = clamp(point.step - original.start + 1, 1, totalSteps(project) - original.start);
  cursorStep = point.step; cursorPitch = point.pitch; drawRoll(); drawPitch();
});

function endPointer(): void {
  if (!pointerAction) return;
  pointerAction = null; changed();
}
roll.addEventListener('pointerup', endPointer);
roll.addEventListener('pointercancel', endPointer);

roll.addEventListener('keydown', (event) => {
  const handled = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter', ' ', 'Delete', 'Backspace'].includes(event.key);
  if (!handled) return; event.preventDefault();
  if (event.key === 'ArrowLeft') cursorStep = Math.max(0, cursorStep - 1);
  if (event.key === 'ArrowRight') cursorStep = Math.min(totalSteps(project) - 1, cursorStep + 1);
  if (event.key === 'ArrowUp') cursorPitch = Math.min(MAX_PITCH, cursorPitch + 1);
  if (event.key === 'ArrowDown') cursorPitch = Math.max(MIN_PITCH, cursorPitch - 1);
  if (event.key === 'Enter' || event.key === ' ') {
    remember(); const existing = noteAt(project, cursorStep, cursorPitch);
    if (existing) { selectedId = existing.id; }
    else { const note = { id: makeId(), start: cursorStep, length: 1, pitch: cursorPitch, curve: Array(8).fill(0) as number[] }; project.notes.push(note); selectedId = note.id; engine.preview(cursorPitch, project.wave); changed(); }
  }
  if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId) {
    remember(); project.notes = project.notes.filter((note) => note.id !== selectedId); selectedId = null; changed();
  }
  drawRoll(); drawPitch();
  const x = cursorStep * CELL_W; const y = (MAX_PITCH - cursorPitch) * ROW_H;
  rollScroll.scrollTo({ left: Math.max(0, x - rollScroll.clientWidth / 2), top: Math.max(0, y - rollScroll.clientHeight / 2), behavior: 'smooth' });
});

function setPitchPoint(event: PointerEvent): void {
  const note = project.notes.find((entry) => entry.id === selectedId); if (!note) return;
  const rect = pitchCanvas.getBoundingClientRect();
  const index = clamp(Math.round((event.clientX - rect.left) / rect.width * (note.curve.length - 1)), 0, note.curve.length - 1);
  note.curve[index] = Math.round(clamp((rect.height / 2 - (event.clientY - rect.top)) / (rect.height / 2 - 12) * 2, -2, 2) * 10) / 10;
  drawPitch();
}
pitchCanvas.addEventListener('pointerdown', (event) => { if (!selectedId) return; remember(); pitchCanvas.setPointerCapture(event.pointerId); setPitchPoint(event); });
pitchCanvas.addEventListener('pointermove', (event) => { if (pitchCanvas.hasPointerCapture(event.pointerId)) setPitchPoint(event); });
pitchCanvas.addEventListener('pointerup', () => changed());
pitchCanvas.addEventListener('keydown', (event) => {
  const note = project.notes.find((entry) => entry.id === selectedId); if (!note || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault(); remember(); const delta = event.key === 'ArrowUp' ? .1 : -.1; note.curve = note.curve.map((value) => clamp(Math.round((value + delta) * 10) / 10, -2, 2)); changed();
});

$('#drum-grid').addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.drum-step'); if (!button) return;
  remember(); const row = Number(button.dataset.row); const step = Number(button.dataset.step);
  project.drums[row]![step] = !project.drums[row]![step]; changed();
});

engine.onStep = (step) => {
  const previous = playhead;
  playhead = step; drawRuler(); drawRoll();
  if (previous >= 0) document.querySelectorAll(`.drum-step[data-step="${previous}"]`).forEach((cell) => cell.classList.remove('playing'));
  if (step >= 0) document.querySelectorAll(`.drum-step[data-step="${step}"]`).forEach((cell) => cell.classList.add('playing'));
  if (step >= 0) $('#position').textContent = `BAR ${String(Math.floor(step / 16) + 1).padStart(2, '0')} · STEP ${String(step % 16 + 1).padStart(2, '0')}`;
  else $('#position').textContent = 'BAR 01 · STEP 01';
};

$('#play').addEventListener('click', () => {
  engine.play(project); ($('#play') as HTMLButtonElement).disabled = true; ($('#stop') as HTMLButtonElement).disabled = false;
});
$('#stop').addEventListener('click', stopPlayback);
function stopPlayback(): void { engine.stop(); ($('#play') as HTMLButtonElement).disabled = false; ($('#stop') as HTMLButtonElement).disabled = true; }

document.addEventListener('keydown', (event) => {
  if (event.key !== ' ' || event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLButtonElement || event.target === roll) return;
  event.preventDefault(); if (engine.playing) stopPlayback(); else ($('#play') as HTMLButtonElement).click();
});

titleInput.addEventListener('input', () => { project.title = titleInput.value || 'Untitled signal'; changed(); });
tempoInput.addEventListener('change', () => { project.tempo = clamp(Number(tempoInput.value) || 112, 40, 240); tempoInput.value = String(project.tempo); changed(); });
waveSelect.addEventListener('change', () => { project.wave = waveSelect.value as OscillatorType; changed(); });
barsInput.addEventListener('change', () => {
  const next = clamp(Number(barsInput.value) || 16, 1, 64);
  if (next < project.bars && project.notes.some((note) => note.start >= next * 16) && !confirm(`Shorten to ${next} bars? Notes after bar ${next} will be removed.`)) { barsInput.value = String(project.bars); return; }
  remember(); project = resizeProject(project, next); selectedId = null; resizeCanvases(); changed();
});

$('#reset-pitch').addEventListener('click', () => { const note = project.notes.find((entry) => entry.id === selectedId); if (!note) return; remember(); note.curve = note.curve.map(() => 0); changed(); });
$('#undo').addEventListener('click', () => { if (!undoState) return; const current = cloneProject(project); project = undoState; undoState = current; selectedId = null; updateFields(); resizeCanvases(); changed('Undo saved on this device'); announce('Last change undone.'); });

const clearDialog = $('#clear-dialog') as HTMLDialogElement;
$('#clear').addEventListener('click', () => clearDialog.showModal());
clearDialog.addEventListener('close', () => {
  if (clearDialog.returnValue !== 'confirm') return;
  remember(); const fresh = createProject(); fresh.title = project.title; fresh.tempo = project.tempo; fresh.bars = project.bars; fresh.wave = project.wave; project = fresh; selectedId = null; resizeCanvases(); changed(); announce('Sketch cleared. Undo is available.');
});

$('#export-midi').addEventListener('click', () => { const midi = createMidi(project); download(midi.buffer as ArrayBuffer, `${safeFilename(project.title)}.mid`, 'audio/midi'); announce('MIDI downloaded.'); });
$('#export-json').addEventListener('click', () => { download(JSON.stringify(project, null, 2), `${safeFilename(project.title)}.songsketch.json`, 'application/json'); announce('Editable project backup downloaded.'); });
$('#export-html').addEventListener('click', () => { download(createShareHtml(project), `${safeFilename(project.title)}-player.html`, 'text/html'); announce('Self-contained player downloaded.'); });
($('#import-json') as HTMLInputElement).addEventListener('change', async (event) => {
  const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
  try { remember(); project = normalizeProject(JSON.parse(await file.text())); selectedId = null; stopPlayback(); updateFields(); resizeCanvases(); changed(); announce(`Imported “${project.title}”.`); }
  catch (error) { announce(error instanceof Error ? error.message : 'That project could not be imported.'); }
  finally { input.value = ''; }
});

function updateConnection(): void {
  const status = $('#connection-status');
  status.textContent = navigator.onLine ? 'Local save · offline ready' : 'Offline · every tool still works';
  document.body.classList.toggle('offline', !navigator.onLine);
}
window.addEventListener('online', updateConnection); window.addEventListener('offline', updateConnection); updateConnection();

async function initialize(): Promise<void> {
  try {
    const saved = await loadProject();
    if (saved) { project = saved; $('#save-state').textContent = 'Restored from this device'; }
    else $('#save-state').textContent = 'New sketch · saved on this device';
  } catch { $('#save-state').textContent = 'Local save unavailable — export a backup'; }
  updateFields(); resizeCanvases(); renderAll();
  rollScroll.scrollTop = (MAX_PITCH - 71) * ROW_H;
}
void initialize();

if ('serviceWorker' in navigator) {
  let updateRequested = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (updateRequested) location.reload(); });
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      const showUpdate = (worker: ServiceWorker) => {
        $('#update-toast').classList.add('visible');
        $('#update-app').onclick = () => { updateRequested = true; worker.postMessage({ type: 'SKIP_WAITING' }); };
      };
      if (registration.waiting) showUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', () => {
        if (registration.installing?.state === 'installed' && navigator.serviceWorker.controller) showUpdate(registration.installing);
      }));
    } catch { $('#connection-status').textContent = 'Local save · offline install unavailable'; }
  });
}
