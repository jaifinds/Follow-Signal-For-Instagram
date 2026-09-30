import { Snapshot, SocialProfile, RelationshipEvent, ImportJob } from '../types';

const DB_NAME = 'chronograph_db';
const DB_VERSION = 1;

const STORES = {
  SNAPSHOTS: 'snapshots',
  PROFILES: 'profiles',
  EVENTS: 'events',
  IMPORTS: 'imports',
  SETTINGS: 'settings',
};

function isIndexedDBAvailable(): boolean {
  try {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  } catch {
    return false;
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB not supported or blocked in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
        db.createObjectStore(STORES.SNAPSHOTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.PROFILES)) {
        db.createObjectStore(STORES.PROFILES, { keyPath: 'username' });
      }
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.IMPORTS)) {
        db.createObjectStore(STORES.IMPORTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// -------------------------------------------------------------
// Snapshots Operations
// -------------------------------------------------------------

export async function dbSaveSnapshot(snapshot: Snapshot): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SNAPSHOTS], 'readwrite');
      const store = tx.objectStore(STORES.SNAPSHOTS);
      const req = store.put(snapshot);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Fallback to localStorage
    const raw = localStorage.getItem('chronograph_user_snapshots');
    const list: Snapshot[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(s => s.id !== snapshot.id);
    filtered.push(snapshot);
    localStorage.setItem('chronograph_user_snapshots', JSON.stringify(filtered));
  }
}

export async function dbGetAllSnapshots(): Promise<Snapshot[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.SNAPSHOTS], 'readonly');
      const store = tx.objectStore(STORES.SNAPSHOTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem('chronograph_user_snapshots');
    return raw ? JSON.parse(raw) : [];
  }
}

// -------------------------------------------------------------
// Events Operations
// -------------------------------------------------------------

export async function dbSaveEvents(events: RelationshipEvent[]): Promise<void> {
  if (events.length === 0) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.EVENTS], 'readwrite');
      const store = tx.objectStore(STORES.EVENTS);
      events.forEach(e => store.put(e));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const raw = localStorage.getItem('chronograph_user_events');
    const existing: RelationshipEvent[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem('chronograph_user_events', JSON.stringify([...events, ...existing]));
  }
}

export async function dbGetAllEvents(): Promise<RelationshipEvent[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.EVENTS], 'readonly');
      const store = tx.objectStore(STORES.EVENTS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem('chronograph_user_events');
    return raw ? JSON.parse(raw) : [];
  }
}

// -------------------------------------------------------------
// Profiles Operations
// -------------------------------------------------------------

export async function dbSaveProfiles(profiles: Record<string, SocialProfile>): Promise<void> {
  const list = Object.values(profiles);
  if (list.length === 0) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.PROFILES], 'readwrite');
      const store = tx.objectStore(STORES.PROFILES);
      list.forEach(p => store.put(p));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const raw = localStorage.getItem('chronograph_user_profiles');
    const existing: Record<string, SocialProfile> = raw ? JSON.parse(raw) : {};
    localStorage.setItem('chronograph_user_profiles', JSON.stringify({ ...existing, ...profiles }));
  }
}

export async function dbGetAllProfiles(): Promise<Record<string, SocialProfile>> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.PROFILES], 'readonly');
      const store = tx.objectStore(STORES.PROFILES);
      const req = store.getAll();
      req.onsuccess = () => {
        const result: Record<string, SocialProfile> = {};
        (req.result || []).forEach((p: SocialProfile) => {
          result[p.username.toLowerCase()] = p;
        });
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    const raw = localStorage.getItem('chronograph_user_profiles');
    return raw ? JSON.parse(raw) : {};
  }
}

// -------------------------------------------------------------
// Purge Operations (Section 23: Complete Irreversible Wipe)
// -------------------------------------------------------------

export async function dbClearAllData(): Promise<void> {
  // Clear localStorage
  try {
    localStorage.removeItem('chronograph_user_snapshots');
    localStorage.removeItem('chronograph_user_events');
    localStorage.removeItem('chronograph_user_profiles');
    localStorage.removeItem('chronograph_audit_logs');
    localStorage.removeItem('chronograph_account_username');
  } catch {
    // Ignore
  }

  // Clear IndexedDB stores
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        [STORES.SNAPSHOTS, STORES.PROFILES, STORES.EVENTS, STORES.IMPORTS, STORES.SETTINGS],
        'readwrite'
      );
      tx.objectStore(STORES.SNAPSHOTS).clear();
      tx.objectStore(STORES.PROFILES).clear();
      tx.objectStore(STORES.EVENTS).clear();
      tx.objectStore(STORES.IMPORTS).clear();
      tx.objectStore(STORES.SETTINGS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignored if IndexedDB not present
  }
}
