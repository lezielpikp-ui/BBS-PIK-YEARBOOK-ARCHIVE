/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'bbs_pik_yearbook_documents_db';
const STORE_NAME = 'pdf_documents';
const DB_VERSION = 1;

// In-memory cache for ultra-fast access during the current session
const memoryCache = new Map<string, Blob | string>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
}

/**
 * Stores an uploaded yearbook PDF Blob or ArrayBuffer into IndexedDB.
 */
export async function storeYearbookPdf(
  yearbookId: string,
  data: Blob | ArrayBuffer | Uint8Array | string
): Promise<void> {
  try {
    // Also save in memory cache for immediate access
    let blobToStore: Blob;
    if (data instanceof Blob) {
      blobToStore = data;
    } else if (typeof data === 'string' && data.startsWith('data:application/pdf')) {
      // Convert data URL to Blob
      const response = await fetch(data);
      blobToStore = await response.blob();
    } else if (typeof data === 'string') {
      blobToStore = new Blob([data], { type: 'application/pdf' });
    } else {
      blobToStore = new Blob([data as ArrayBuffer], { type: 'application/pdf' });
    }

    memoryCache.set(yearbookId, blobToStore);

    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record = {
        id: yearbookId,
        pdfBlob: blobToStore,
        updatedAt: Date.now(),
      };

      const putRequest = store.put(record);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    });
  } catch (err) {
    console.warn('IndexedDB write warning:', err);
    // Keep in memory cache even if IndexedDB fails
    if (typeof data === 'string' || data instanceof Blob) {
      memoryCache.set(yearbookId, data);
    }
  }
}

/**
 * Retrieves the stored PDF for a yearbook by ID.
 * Returns Blob, Data URL string, or null if not stored.
 */
export async function getYearbookPdf(yearbookId: string): Promise<Blob | string | null> {
  // Check memory cache first
  if (memoryCache.has(yearbookId)) {
    return memoryCache.get(yearbookId) || null;
  }

  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(yearbookId);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.pdfBlob) {
          memoryCache.set(yearbookId, result.pdfBlob);
          resolve(result.pdfBlob);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

/**
 * Deletes stored PDF from IndexedDB when a yearbook is deleted.
 */
export async function deleteYearbookPdf(yearbookId: string): Promise<void> {
  memoryCache.delete(yearbookId);
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(yearbookId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch {
    // Ignore error
  }
}
