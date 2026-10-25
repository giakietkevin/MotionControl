// Metadata in localStorage, video blobs in IndexedDB (too large for localStorage).

export type Item = {
  id: string;
  userId: string;
  createdAt: number;
  prompt: string;
  resolution: string;
  fps: number;
  duration: number;
  seed: number | null;
  thumb: string; // data URL of the character image
};

const META = "mc.library";
const DB = "mc-videos";
const STORE = "blobs";

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((res, rej) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

function readAll(): Item[] {
  try {
    return JSON.parse(localStorage.getItem(META) || "[]");
  } catch {
    return [];
  }
}

export function listItems(userId: string): Item[] {
  return readAll()
    .filter((i) => i.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function addItem(item: Item, blob: Blob) {
  await tx("readwrite", (s) => s.put(blob, item.id));
  localStorage.setItem(META, JSON.stringify([...readAll(), item]));
}

export async function getBlob(id: string): Promise<Blob | undefined> {
  return tx<Blob | undefined>("readonly", (s) => s.get(id));
}

export async function removeItem(id: string) {
  await tx("readwrite", (s) => s.delete(id));
  localStorage.setItem(META, JSON.stringify(readAll().filter((i) => i.id !== id)));
}

export function fileToThumb(file: File, size = 240): Promise<string> {
  return new Promise((res) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, size / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      res("");
    };
    img.src = url;
  });
}
