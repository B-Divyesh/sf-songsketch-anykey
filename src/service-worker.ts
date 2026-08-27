export interface WaitingWorker {
  state: string;
  addEventListener(type: 'statechange', listener: () => void): void;
  postMessage(message: unknown): void;
}

export interface WorkerRegistration {
  waiting: WaitingWorker | null;
  installing: WaitingWorker | null;
  addEventListener(type: 'updatefound', listener: () => void): void;
}

/**
 * Report both a worker that was already waiting and one that becomes waiting.
 * Keep the worker captured at updatefound: registration.installing is commonly
 * null by the time its statechange handler runs.
 */
export function watchForServiceWorkerUpdate(
  registration: WorkerRegistration,
  hasController: () => boolean,
  onWaiting: (worker: WaitingWorker) => void,
): void {
  if (registration.waiting) onWaiting(registration.waiting);

  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    if (!installing) return;
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed' && hasController()) onWaiting(registration.waiting ?? installing);
    });
  });
}
