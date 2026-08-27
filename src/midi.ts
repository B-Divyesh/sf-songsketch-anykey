import type { Project } from './project';

const PPQ = 96;
const STEP_TICKS = PPQ / 4;

interface MidiEvent { tick: number; order: number; bytes: number[] }

function variableLength(value: number): number[] {
  let buffer = value & 0x7f;
  const result: number[] = [];
  while ((value >>= 7)) {
    buffer <<= 8;
    buffer |= (value & 0x7f) | 0x80;
  }
  while (true) {
    result.push(buffer & 0xff);
    if (buffer & 0x80) buffer >>= 8;
    else break;
  }
  return result;
}

const u16 = (n: number) => [(n >> 8) & 0xff, n & 0xff];
const u32 = (n: number) => [(n >> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];

export function createMidi(project: Project): Uint8Array {
  const events: MidiEvent[] = [];
  const micros = Math.round(60_000_000 / project.tempo);
  events.push({ tick: 0, order: 0, bytes: [0xff, 0x51, 0x03, (micros >> 16) & 0xff, (micros >> 8) & 0xff, micros & 0xff] });
  events.push({ tick: 0, order: 1, bytes: [0xc0, 80] });
  for (const note of project.notes) {
    const start = note.start * STEP_TICKS;
    const end = (note.start + note.length) * STEP_TICKS;
    events.push({ tick: start, order: 4, bytes: [0x90, note.pitch, 92] });
    note.curve.forEach((bend, index) => {
      const tick = start + Math.round((index / Math.max(1, note.curve.length - 1)) * (end - start - 1));
      const value = Math.round(8192 + Math.max(-2, Math.min(2, bend)) / 2 * 8191);
      events.push({ tick, order: 3, bytes: [0xe0, value & 0x7f, (value >> 7) & 0x7f] });
    });
    events.push({ tick: end, order: 1, bytes: [0x80, note.pitch, 0] });
    events.push({ tick: end, order: 2, bytes: [0xe0, 0, 64] });
  }
  const drumPitches = [36, 38, 42, 46];
  project.drums.forEach((row, rowIndex) => row.forEach((active, step) => {
    if (!active) return;
    const tick = step * STEP_TICKS;
    const pitch = drumPitches[rowIndex] ?? 36;
    events.push({ tick, order: 4, bytes: [0x99, pitch, 100] });
    events.push({ tick: tick + Math.floor(STEP_TICKS / 2), order: 1, bytes: [0x89, pitch, 0] });
  }));
  events.sort((a, b) => a.tick - b.tick || a.order - b.order);
  const track: number[] = [];
  let previous = 0;
  for (const event of events) {
    track.push(...variableLength(event.tick - previous), ...event.bytes);
    previous = event.tick;
  }
  track.push(0, 0xff, 0x2f, 0);
  return new Uint8Array([
    0x4d, 0x54, 0x68, 0x64, ...u32(6), ...u16(0), ...u16(1), ...u16(PPQ),
    0x4d, 0x54, 0x72, 0x6b, ...u32(track.length), ...track,
  ]);
}
