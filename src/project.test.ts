import { describe, expect, it } from 'vitest';
import { createProject, normalizeBars, normalizeProject, pitchName, resizeProject, totalSteps } from './project';
import { createMidi } from './midi';

describe('project model', () => {
  it('starts as a useful 16-bar empty sketch', () => {
    const project = createProject();
    expect(project.bars).toBe(16);
    expect(totalSteps(project)).toBe(256);
    expect(project.drums).toHaveLength(4);
    expect(project.drums[0]).toHaveLength(256);
  });

  it('resizes and clips content safely', () => {
    const project = createProject();
    project.notes.push({ id: 'a', start: 15, length: 8, pitch: 60, curve: [0, 0] });
    const resized = resizeProject(project, 1);
    expect(resized.notes[0]?.length).toBe(1);
    expect(resized.drums[0]).toHaveLength(16);
  });

  it('sanitizes imported projects', () => {
    const project = normalizeProject({ bars: 999, tempo: 5, notes: [{ start: -4, length: 0, pitch: 200 }] });
    expect(project.bars).toBe(64);
    expect(project.tempo).toBe(40);
    expect(project.notes[0]).toMatchObject({ start: 0, length: 1, pitch: 83 });
    expect(pitchName(60)).toBe('C4');
  });

  it('normalizes bar counts and pitch curves to the advertised editor limits', () => {
    expect(normalizeBars(0)).toBe(1);
    expect(normalizeBars(65)).toBe(64);
    expect(normalizeBars('not a number')).toBe(16);
    const low = normalizeProject({ bars: 0, notes: [{ start: 0, length: 1, pitch: 60, curve: [-12, 12] }] });
    const high = normalizeProject({ bars: 65, notes: [{ start: 0, length: 1, pitch: 60, curve: [-12, 12] }] });
    expect(low.bars).toBe(1);
    expect(high.bars).toBe(64);
    expect(low.notes[0]?.curve).toEqual([-2, 2]);
  });
});

describe('MIDI export', () => {
  it('writes a valid single-track MIDI file with notes and drums', () => {
    const project = createProject();
    project.notes.push({ id: 'a', start: 0, length: 4, pitch: 60, curve: [0, 1, 0] });
    project.drums[0]![0] = true;
    const midi = createMidi(project);
    expect(new TextDecoder().decode(midi.slice(0, 4))).toBe('MThd');
    expect(new TextDecoder().decode(midi.slice(14, 18))).toBe('MTrk');
    expect(midi.length).toBeGreaterThan(50);
  });
});
