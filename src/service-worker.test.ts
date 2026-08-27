import { describe, expect, it } from 'vitest';
import { watchForServiceWorkerUpdate, type WaitingWorker, type WorkerRegistration } from './service-worker';

function worker(state = 'installing'): WaitingWorker & { emit(): void } {
  let listener = () => {};
  return {
    state,
    addEventListener: (_type, next) => { listener = next; },
    postMessage: () => {},
    emit: () => listener(),
  };
}

describe('watchForServiceWorkerUpdate', () => {
  it('surfaces a worker that becomes waiting after updatefound', () => {
    const installing = worker();
    let updateFound = () => {};
    const registration: WorkerRegistration = {
      waiting: null,
      installing,
      addEventListener: (_type, listener) => { updateFound = listener; },
    };
    const waiting: WaitingWorker[] = [];

    watchForServiceWorkerUpdate(registration, () => true, (entry) => waiting.push(entry));
    updateFound();
    registration.waiting = installing;
    installing.state = 'installed';
    installing.emit();

    expect(waiting).toEqual([installing]);
  });

  it('surfaces a worker that was already waiting at registration time', () => {
    const existing = worker('installed');
    const registration: WorkerRegistration = {
      waiting: existing,
      installing: null,
      addEventListener: () => {},
    };
    const waiting: WaitingWorker[] = [];
    watchForServiceWorkerUpdate(registration, () => true, (entry) => waiting.push(entry));
    expect(waiting).toEqual([existing]);
  });
});
