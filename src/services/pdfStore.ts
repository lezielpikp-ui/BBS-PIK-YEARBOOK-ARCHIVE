/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'bbs_pik_pdf_store_v1';
const STORE_NAME = 'pdfs';
const DB_VERSION = 1;

// Fast in-memory cache for currently active session
const memoryCache = new Map<string, ArrayBuffer>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a PDF file (ArrayBuffer) to IndexedDB and memory cache.
 */
export async function savePdfFile(
  id: string,
  data: ArrayBuffer | Uint8Array | Blob,
  fileName: string
): Promise<void> {
  let arrayBuffer: ArrayBuffer;
  if (data instanceof Blob) {
    arrayBuffer = await data.arrayBuffer();
  } else if (data instanceof Uint8Array) {
    arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  } else {
    arrayBuffer = data;
  }

  // Update in-memory cache with safe clone
  const cacheCopy = arrayBuffer.slice(0);
  memoryCache.set(id, cacheCopy);

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      const record = {
        id,
        fileName,
        data: arrayBuffer.slice(0),
        size: arrayBuffer.byteLength,
        savedAt: new Date().toISOString(),
      };

      const putRequest = store.put(record);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.warn('Failed to persist PDF to IndexedDB, stored in memory cache:', err);
  }
}

/**
 * Retrieves a PDF file (ArrayBuffer) by yearbook ID.
 */
export async function getPdfFile(id: string): Promise<ArrayBuffer | null> {
  // Check in-memory cache first for instant retrieval
  if (memoryCache.has(id)) {
    const buf = memoryCache.get(id)!;
    return buf.slice(0);
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result && request.result.data) {
          const buffer = request.result.data as ArrayBuffer;
          memoryCache.set(id, buffer.slice(0));
          resolve(buffer.slice(0));
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error fetching PDF from IndexedDB:', err);
    return null;
  }
}

/**
 * Checks if a PDF file exists in storage for a yearbook ID.
 */
export async function hasPdfFile(id: string): Promise<boolean> {
  if (memoryCache.has(id)) return true;
  try {
    const file = await getPdfFile(id);
    return file !== null;
  } catch {
    return false;
  }
}

/**
 * Deletes a stored PDF file from IndexedDB.
 */
export async function deletePdfFile(id: string): Promise<void> {
  memoryCache.delete(id);
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Error deleting PDF from IndexedDB:', err);
  }
}
