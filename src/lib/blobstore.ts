"use client";

// IndexedDB blob store for voice notes and photos. Stands in for Supabase
// Storage in the mock and doubles as the offline upload queue (spec 7.4).
const DB = "partsbd-media";
const STORE = "blobs";

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export const putBlob = async (id: string, blob: Blob) => {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return `idb:${id}`;
};

export const getBlob = async (id: string) => {
  const db = await open();
  return new Promise<Blob | undefined>((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as Blob | undefined);
    req.onerror = () => reject(req.error);
  });
};

const urlCache = new Map<string, string>();

// Resolves "idb:<id>" to an object URL; passes other URLs through.
export const resolveMediaUrl = async (url: string) => {
  if (!url.startsWith("idb:")) return url;
  const cached = urlCache.get(url);
  if (cached) return cached;
  try {
    const blob = await getBlob(url.slice(4));
    if (!blob) return null;
    const obj = URL.createObjectURL(blob);
    urlCache.set(url, obj);
    return obj;
  } catch {
    return null;
  }
};

// Simulated upload with retry (3 tries, backoff). Rejects only when offline
// for all attempts, so the UI can show "slow network, retrying".
export const uploadWithRetry = async (id: string, blob: Blob, onRetry?: (attempt: number) => void) => {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (typeof navigator === "undefined" || navigator.onLine) {
      await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
      return putBlob(id, blob);
    }
    onRetry?.(attempt);
    await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
  }
  // Keep it locally anyway; a real queue would retry on reconnect.
  return putBlob(id, blob);
};

export const compressImage = async (file: File, maxSide = 1600): Promise<Blob> => {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.8));
    return out ?? file;
  } catch {
    return file;
  }
};
