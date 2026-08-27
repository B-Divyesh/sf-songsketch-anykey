import { totalSteps, type Note, type Project } from './project';

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer = 0;
  private nextStep = 0;
  private nextTime = 0;
  private activeNodes = new Set<AudioScheduledSourceNode>();
  playing = false;
  onStep: (step: number) => void = () => undefined;

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.55;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  private track<T extends AudioScheduledSourceNode>(node: T): T {
    this.activeNodes.add(node);
    node.addEventListener('ended', () => this.activeNodes.delete(node), { once: true });
    return node;
  }

  preview(pitch: number, wave: OscillatorType): void {
    const context = this.ensureContext();
    this.playNote({ id: '', start: 0, length: 1, pitch, curve: [0, 0] }, wave, context.currentTime, 0.16);
  }

  play(project: Project): void {
    if (this.playing) return;
    const context = this.ensureContext();
    this.playing = true;
    this.nextStep = 0;
    this.nextTime = context.currentTime + 0.05;
    this.timer = window.setInterval(() => this.schedule(project), 25);
    this.schedule(project);
  }

  stop(): void {
    this.playing = false;
    window.clearInterval(this.timer);
    for (const node of this.activeNodes) {
      try { node.stop(); } catch { /* already ended */ }
    }
    this.activeNodes.clear();
    this.onStep(-1);
  }

  private schedule(project: Project): void {
    const context = this.context;
    if (!context || !this.playing) return;
    const stepDuration = 60 / project.tempo / 4;
    while (this.nextTime < context.currentTime + 0.12) {
      const step = this.nextStep;
      const time = this.nextTime;
      const visualDelay = Math.max(0, (time - context.currentTime) * 1000);
      window.setTimeout(() => { if (this.playing) this.onStep(step); }, visualDelay);
      project.notes.filter((note) => note.start === step).forEach((note) => {
        this.playNote(note, project.wave, time, note.length * stepDuration * 0.98);
      });
      project.drums.forEach((row, index) => { if (row[step]) this.playDrum(index, time); });
      this.nextTime += stepDuration;
      this.nextStep = (step + 1) % totalSteps(project);
    }
  }

  private playNote(note: Note, wave: OscillatorType, time: number, duration: number): void {
    const context = this.context!;
    const oscillator = this.track(context.createOscillator());
    const gain = context.createGain();
    const baseFrequency = 440 * Math.pow(2, (note.pitch - 69) / 12);
    const frequencies = new Float32Array(note.curve.map((semitones) => baseFrequency * Math.pow(2, semitones / 12)));
    oscillator.type = wave;
    if (frequencies.length > 1) oscillator.frequency.setValueCurveAtTime(frequencies, time, duration);
    else oscillator.frequency.setValueAtTime(baseFrequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.18, time + Math.min(0.018, duration / 3));
    gain.gain.setValueAtTime(0.18, Math.max(time + 0.02, time + duration - 0.04));
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(this.master!);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }

  private playDrum(index: number, time: number): void {
    const context = this.context!;
    if (index === 0) {
      const osc = this.track(context.createOscillator());
      const gain = context.createGain();
      osc.frequency.setValueAtTime(135, time);
      osc.frequency.exponentialRampToValueAtTime(45, time + 0.14);
      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
      osc.connect(gain).connect(this.master!); osc.start(time); osc.stop(time + 0.21);
      return;
    }
    const duration = index === 3 ? 0.28 : 0.09;
    const length = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, index === 1 ? 2 : 0.7);
    const noise = this.track(context.createBufferSource());
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    noise.buffer = buffer;
    filter.type = index === 1 ? 'bandpass' : 'highpass';
    filter.frequency.value = index === 1 ? 1600 : 6500;
    gain.gain.setValueAtTime(index === 1 ? 0.38 : 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    noise.connect(filter).connect(gain).connect(this.master!);
    noise.start(time); noise.stop(time + duration);
    if (index === 1) {
      const osc = this.track(context.createOscillator());
      const toneGain = context.createGain();
      osc.type = 'triangle'; osc.frequency.value = 185;
      toneGain.gain.setValueAtTime(0.22, time);
      toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.connect(toneGain).connect(this.master!); osc.start(time); osc.stop(time + 0.09);
    }
  }
}
