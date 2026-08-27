import { normalizeProject, type Project } from './project';

const DB_NAME = 'songsketch-anykey';
const STORE = 'projects';
const KEY = 'current';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local storage could not be opened.'));
  });
}

export async function loadProject(): Promise<Project | null> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => {
      try { resolve(request.result ? normalizeProject(request.result) : null); }
      catch (error) { reject(error); }
      finally { db.close(); }
    };
    request.onerror = () => { reject(request.error); db.close(); };
  });
}

export async function saveProject(project: Project): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put({ ...project, updatedAt: Date.now() }, KEY);
    transaction.oncomplete = () => { resolve(); db.close(); };
    transaction.onerror = () => { reject(transaction.error); db.close(); };
  });
}
