export const STEPS_PER_BAR = 16;
export const MIN_PITCH = 48;
export const MAX_PITCH = 83;
export const DRUM_NAMES = ['Kick', 'Snare', 'Closed hat', 'Open hat'] as const;
export type DrumName = (typeof DRUM_NAMES)[number];
export type Wave = OscillatorType;

export interface Note {
  id: string;
  start: number;
  length: number;
  pitch: number;
  curve: number[];
}

export interface Project {
  version: 1;
  title: string;
  tempo: number;
  bars: number;
  wave: Wave;
  notes: Note[];
  drums: boolean[][];
  updatedAt: number;
}

export const totalSteps = (project: Project) => project.bars * STEPS_PER_BAR;
export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function makeId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createProject(): Project {
  const bars = 16;
  return {
    version: 1,
    title: 'Untitled signal',
    tempo: 112,
    bars,
    wave: 'triangle',
    notes: [],
    drums: DRUM_NAMES.map(() => Array(bars * STEPS_PER_BAR).fill(false) as boolean[]),
    updatedAt: Date.now(),
  };
}

export function normalizeProject(input: unknown): Project {
  if (!input || typeof input !== 'object') throw new Error('That file does not contain a SongSketch project.');
  const source = input as Partial<Project>;
  const bars = clamp(Math.round(Number(source.bars) || 16), 1, 64);
  const steps = bars * STEPS_PER_BAR;
  const allowedWaves: Wave[] = ['sine', 'square', 'sawtooth', 'triangle'];
  const notes = Array.isArray(source.notes) ? source.notes.flatMap((entry): Note[] => {
    if (!entry || typeof entry !== 'object') return [];
    const note = entry as Partial<Note>;
    const start = clamp(Math.round(Number(note.start) || 0), 0, steps - 1);
    const length = clamp(Math.round(Number(note.length) || 1), 1, steps - start);
    const pitch = clamp(Math.round(Number(note.pitch) || 60), MIN_PITCH, MAX_PITCH);
    const curve = Array.isArray(note.curve)
      ? note.curve.slice(0, 8).map((v) => clamp(Number(v) || 0, -12, 12))
      : [0, 0, 0, 0];
    return [{ id: typeof note.id === 'string' ? note.id : makeId(), start, length, pitch, curve: curve.length > 1 ? curve : [0, 0, 0, 0] }];
  }) : [];
  const drums = DRUM_NAMES.map((_, row) => Array.from({ length: steps }, (__, step) => Boolean(source.drums?.[row]?.[step])));
  return {
    version: 1,
    title: String(source.title || 'Untitled signal').slice(0, 80),
    tempo: clamp(Math.round(Number(source.tempo) || 112), 40, 240),
    bars,
    wave: allowedWaves.includes(source.wave as Wave) ? source.wave as Wave : 'triangle',
    notes,
    drums,
    updatedAt: Number(source.updatedAt) || Date.now(),
  };
}

export function resizeProject(project: Project, bars: number): Project {
  const nextBars = clamp(Math.round(bars), 1, 64);
  const steps = nextBars * STEPS_PER_BAR;
  return {
    ...project,
    bars: nextBars,
    notes: project.notes
      .filter((note) => note.start < steps)
      .map((note) => ({ ...note, length: Math.min(note.length, steps - note.start) })),
    drums: project.drums.map((row) => Array.from({ length: steps }, (_, step) => Boolean(row[step]))),
    updatedAt: Date.now(),
  };
}

const PITCH_CLASS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export function pitchName(midi: number): string {
  return `${PITCH_CLASS[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

export function noteAt(project: Project, step: number, pitch: number): Note | undefined {
  return project.notes.find((note) => note.pitch === pitch && step >= note.start && step < note.start + note.length);
}
