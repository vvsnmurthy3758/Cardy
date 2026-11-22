import { AppSettings, DEFAULT_SETTINGS, ProductCard, ProductGroup } from '../types';
import { SAMPLE_CARDS, SAMPLE_GROUPS } from '../data/sampleData';

const DB_NAME = 'keepcard_local_db';
const DB_VERSION = 1;
const STORE_CARDS = 'cards';
const STORE_GROUPS = 'groups';
const STORE_META = 'meta';

const LS_FALLBACK_KEY = 'keepcard_fallback_store_v1';

interface FallbackPayload {
  seeded: boolean;
  cards: ProductCard[];
  groups: ProductGroup[];
  settings: AppSettings;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_CARDS)) {
            db.createObjectStore(STORE_CARDS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_GROUPS)) {
            db.createObjectStore(STORE_GROUPS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORE_META)) {
            db.createObjectStore(STORE_META, { keyPath: 'key' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }
  return dbPromise;
}

function readFallback(): FallbackPayload {
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FallbackPayload>;
      return {
        seeded: Boolean(parsed.seeded),
        cards: Array.isArray(parsed.cards) ? parsed.cards : [],
        groups: Array.isArray(parsed.groups) ? parsed.groups : [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      };
    }
  } catch {
    // ignore storage errors
  }
  return {
    seeded: false,
    cards: [],
    groups: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function writeFallback(data: FallbackPayload): void {
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function reqPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export interface DatabaseSnapshot {
  cards: ProductCard[];
  groups: ProductGroup[];
  settings: AppSettings;
  storageEngine: 'indexeddb' | 'localstorage';
}

export async function initDatabase(): Promise<DatabaseSnapshot> {
  const db = await openDB();

  if (!db) {
    const fb = readFallback();
    if (!fb.seeded) {
      const seeded: FallbackPayload = {
        seeded: true,
        cards: SAMPLE_CARDS,
        groups: SAMPLE_GROUPS,
        settings: { ...DEFAULT_SETTINGS },
      };
      writeFallback(seeded);
      return {
        cards: seeded.cards,
        groups: seeded.groups,
        settings: seeded.settings,
        storageEngine: 'localstorage',
      };
    }
    return {
      cards: fb.cards,
      groups: fb.groups,
      settings: fb.settings,
      storageEngine: 'localstorage',
    };
  }

  const readTx = db.transaction([STORE_CARDS, STORE_GROUPS, STORE_META], 'readonly');
  const seededRecord = await reqPromise(
    readTx.objectStore(STORE_META).get('seeded')
  );
  const settingsRecord = await reqPromise(
    readTx.objectStore(STORE_META).get('settings')
  );

  if (!seededRecord?.value) {
    const writeTx = db.transaction([STORE_CARDS, STORE_GROUPS, STORE_META], 'readwrite');
    const cardStore = writeTx.objectStore(STORE_CARDS);
    const groupStore = writeTx.objectStore(STORE_GROUPS);
    const metaStore = writeTx.objectStore(STORE_META);

    for (const group of SAMPLE_GROUPS) {
      groupStore.put(group);
    }
    for (const card of SAMPLE_CARDS) {
      cardStore.put(card);
    }
    metaStore.put({ key: 'seeded', value: true });
    metaStore.put({ key: 'settings', value: { ...DEFAULT_SETTINGS } });
    await txDone(writeTx);

    return {
      cards: SAMPLE_CARDS,
      groups: SAMPLE_GROUPS,
      settings: { ...DEFAULT_SETTINGS },
      storageEngine: 'indexeddb',
    };
  }

  const cards = (await reqPromise(
    readTx.objectStore(STORE_CARDS).getAll()
  )) as ProductCard[];
  const groups = (await reqPromise(
    readTx.objectStore(STORE_GROUPS).getAll()
  )) as ProductGroup[];
  const settings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(settingsRecord?.value ?? {}),
  };

  return {
    cards: cards.sort((a, b) => b.updatedAt - a.updatedAt),
    groups: groups.sort((a, b) => a.createdAt - b.createdAt),
    settings,
    storageEngine: 'indexeddb',
  };
}

export async function saveCardToDB(card: ProductCard): Promise<void> {
  const db = await openDB();
  if (!db) {
    const fb = readFallback();
    const idx = fb.cards.findIndex((c) => c.id === card.id);
    if (idx >= 0) fb.cards[idx] = card;
    else fb.cards.unshift(card);
    writeFallback(fb);
    return;
  }
  const tx = db.transaction(STORE_CARDS, 'readwrite');
  tx.objectStore(STORE_CARDS).put(card);
  await txDone(tx);
}

export async function saveCardsBulkToDB(cards: ProductCard[]): Promise<void> {
  const db = await openDB();
  if (!db) {
    const fb = readFallback();
    const map = new Map(fb.cards.map((c) => [c.id, c]));
    for (const card of cards) map.set(card.id, card);
    fb.cards = Array.from(map.values());
    writeFallback(fb);
    return;
  }
  const tx = db.transaction(STORE_CARDS, 'readwrite');
  const store = tx.objectStore(STORE_CARDS);
  for (const card of cards) store.put(card);
  await txDone(tx);
}

export async function deleteCardFromDB(cardId: string): Promise<void> {
  const db = await openDB();
  if (!db) {
    const fb = readFallback();
    fb.cards = fb.cards.filter((c) => c.id !== cardId);
    writeFallback(fb);
    return;
  }
  const tx = db.transaction(STORE_CARDS, 'readwrite');
  tx.objectStore(STORE_CARDS).delete(cardId);
  await txDone(tx);
}

export async function saveGroupToDB(group: ProductGroup): Promise<void> {
  const db = await openDB();
  if (!db) {
    const fb = readFallback();
    const idx = fb.groups.findIndex((g) => g.id === group.id);
    if (idx >= 0) fb.groups[idx] = group;
    else fb.groups.push(group);
    writeFallback(fb);
    return;
  }
  const tx = db.transaction(STORE_GROUPS, 'readwrite');
  tx.objectStore(STORE_GROUPS).put(group);
  await txDone(tx);
}

export async function saveGroupsBulkToDB(groups: ProductGroup[]): Promise<void> {
  const db = await openDB();
  if (!db) {
    const fb = readFallback();
    const map = new Map(fb.groups.map((g) => [g.id, g]));
    for (const group of groups) map.set(group.id, group);
    fb.groups = Array.from(map.values());
    writeFallback(fb);
    return;
  }
  const tx = db.transaction(STORE_GROUPS, 'readwrite');
  const store = tx.objectStore(STORE_GROUPS);
  for (const group of groups) store.put(group);
  await txDone(tx);
}

export async function deleteGroupFromDB(groupId: string): Promise<void> {
  const db = await openDB();
  if (!db) {
    const fb = readFallback();
    fb.groups = fb.groups.filter((g) => g.id !== groupId);
    writeFallback(fb);
    return;
  }
  const tx = db.transaction(STORE_GROUPS, 'readwrite');
  tx.objectStore(STORE_GROUPS).delete(groupId);
  await txDone(tx);
}

export async function saveSettingsToDB(settings: AppSettings): Promise<void> {
  const db = await openDB();
  if (!db) {
    const fb = readFallback();
    fb.settings = settings;
    writeFallback(fb);
    return;
  }
  const tx = db.transaction(STORE_META, 'readwrite');
  tx.objectStore(STORE_META).put({ key: 'settings', value: settings });
  await txDone(tx);
}

export async function replaceCatalogInDB(
  cards: ProductCard[],
  groups: ProductGroup[]
): Promise<void> {
  const db = await openDB();
  if (!db) {
    const fb = readFallback();
    fb.seeded = true;
    fb.cards = cards;
    fb.groups = groups;
    writeFallback(fb);
    return;
  }
  const tx = db.transaction([STORE_CARDS, STORE_GROUPS, STORE_META], 'readwrite');
  const cardStore = tx.objectStore(STORE_CARDS);
  const groupStore = tx.objectStore(STORE_GROUPS);
  cardStore.clear();
  groupStore.clear();
  for (const group of groups) groupStore.put(group);
  for (const card of cards) cardStore.put(card);
  tx.objectStore(STORE_META).put({ key: 'seeded', value: true });
  await txDone(tx);
}

export async function resetToSampleCatalog(): Promise<{
  cards: ProductCard[];
  groups: ProductGroup[];
}> {
  await replaceCatalogInDB(SAMPLE_CARDS, SAMPLE_GROUPS);
  return { cards: SAMPLE_CARDS, groups: SAMPLE_GROUPS };
}
