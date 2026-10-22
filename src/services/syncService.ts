/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DeviceMode = 'auto' | 'laptop' | 'tablet' | 'mobile';

export interface SyncEventPayload {
  type: 'YEARBOOKS_UPDATED' | 'PAGE_CHANGED' | 'DEVICE_MODE_CHANGED' | 'AUTH_CHANGED';
  yearbookId?: string;
  page?: number;
  total?: number;
  deviceMode?: DeviceMode;
  timestamp: number;
  senderId: string;
}

// Generate unique client ID for this window/tab session
const SESSION_CLIENT_ID = typeof crypto !== 'undefined' && crypto.randomUUID
  ? crypto.randomUUID()
  : `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

const CHANNEL_NAME = 'bbs_pik_cross_device_sync_v1';
const STORAGE_SYNC_KEY = 'bbs_pik_last_sync_event';

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
  }
}

type SyncCallback = (payload: SyncEventPayload) => void;
const listeners = new Set<SyncCallback>();

// Dispatch to local listeners
function notifyListeners(payload: SyncEventPayload) {
  listeners.forEach((callback) => {
    try {
      callback(payload);
    } catch (err) {
      console.warn('Sync listener error:', err);
    }
  });
}

// Listen for broadcast messages from other tabs/windows
if (channel) {
  channel.onmessage = (event: MessageEvent<SyncEventPayload>) => {
    if (event.data && event.data.senderId !== SESSION_CLIENT_ID) {
      notifyListeners(event.data);
    }
  };
}

// Fallback for environments where BroadcastChannel is blocked
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_SYNC_KEY && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue) as SyncEventPayload;
        if (payload.senderId !== SESSION_CLIENT_ID) {
          notifyListeners(payload);
        }
      } catch {
        // Ignored
      }
    }
  });
}

/**
 * Broadcasts an event to all open tabs, windows, and device views.
 */
export function broadcastSync(
  type: SyncEventPayload['type'],
  data: Partial<Omit<SyncEventPayload, 'type' | 'timestamp' | 'senderId'>> = {}
) {
  const payload: SyncEventPayload = {
    type,
    ...data,
    timestamp: Date.now(),
    senderId: SESSION_CLIENT_ID,
  };

  // 1. Notify local subscribers in current window
  notifyListeners(payload);

  // 2. Broadcast via BroadcastChannel
  if (channel) {
    try {
      channel.postMessage(payload);
    } catch {
      // Ignored
    }
  }

  // 3. Fallback via localStorage storage event
  try {
    localStorage.setItem(STORAGE_SYNC_KEY, JSON.stringify(payload));
  } catch {
    // Ignored
  }
}

/**
 * Subscribes to real-time synchronization events.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToSync(callback: SyncCallback): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Helper to get reading progress for a yearbook across devices.
 */
export function getSavedReadingPage(yearbookId: string): number | null {
  try {
    const saved = localStorage.getItem(`bbs_pik_reading_page_${yearbookId}`);
    if (saved) {
      const num = parseInt(saved, 10);
      return !isNaN(num) && num > 0 ? num : null;
    }
  } catch {
    // Storage unavailable
  }
  return null;
}

/**
 * Helper to save reading progress for a yearbook.
 */
export function saveReadingPage(yearbookId: string, page: number) {
  try {
    localStorage.setItem(`bbs_pik_reading_page_${yearbookId}`, String(page));
  } catch {
    // Storage unavailable
  }
}
