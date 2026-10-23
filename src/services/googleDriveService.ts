/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Defined Google Workspace scopes for Google Drive integration
export const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
];

// Initialize Firebase App singleton safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
// Prompt user to select account (helpful for switching school accounts)
provider.setCustomParameters({
  prompt: 'select_account',
});

// In-memory token management (MANDATORY: NEVER stored in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;
let currentGoogleUser: User | null = null;

// Auth state listeners
type AuthCallback = (user: User | null, token: string | null) => void;
const authListeners = new Set<AuthCallback>();

export function subscribeToGoogleAuth(cb: AuthCallback): () => void {
  authListeners.add(cb);
  cb(currentGoogleUser, cachedAccessToken);
  return () => {
    authListeners.delete(cb);
  };
}

function notifyListeners() {
  authListeners.forEach((cb) => {
    try {
      cb(currentGoogleUser, cachedAccessToken);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

// Initialize onAuthStateChanged listener
onAuthStateChanged(auth, async (user: User | null) => {
  currentGoogleUser = user;
  if (!user) {
    cachedAccessToken = null;
  }
  notifyListeners();
});

/**
 * Signs in with Google Popup and caches the access token in memory.
 */
export async function signInWithGoogle(): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No access token returned from Google authentication.');
    }

    cachedAccessToken = credential.accessToken;
    currentGoogleUser = result.user;
    notifyListeners();

    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Gets cached access token.
 */
export async function getGoogleAccessToken(): Promise<string | null> {
  return cachedAccessToken;
}

/**
 * Returns current signed-in Google user.
 */
export function getCurrentGoogleUser(): User | null {
  return currentGoogleUser || auth.currentUser;
}

/**
 * Sign out Google user and clears in-memory token.
 */
export async function signOutGoogle(): Promise<void> {
  await signOut(auth);
  cachedAccessToken = null;
  currentGoogleUser = null;
  notifyListeners();
}

/**
 * Interface representing a Google Drive file item.
 */
export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string; // string representation of bytes from drive
  sizeBytes?: number;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  modifiedTime?: string;
  createdTime?: string;
  owners?: Array<{ displayName: string; emailAddress: string; photoLink?: string }>;
}

/**
 * Lists PDF files from user's Google Drive.
 */
export async function listDrivePdfFiles(searchTerm?: string, pageToken?: string): Promise<{
  files: DriveFileItem[];
  nextPageToken?: string;
}> {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Drive access is not authenticated. Please sign in with Google first.');
  }

  // Build query: PDF files only and not trashed
  let q = "mimeType = 'application/pdf' and trashed = false";
  if (searchTerm && searchTerm.trim()) {
    const cleanSearch = searchTerm.trim().replace(/'/g, "\\'");
    q += ` and name contains '${cleanSearch}'`;
  }

  const fields = 'nextPageToken, files(id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, iconLink, modifiedTime, createdTime, owners)';
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', fields);
  url.searchParams.set('pageSize', '25');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  if (pageToken) {
    url.searchParams.set('pageToken', pageToken);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      notifyListeners();
      throw new Error('Your Google Drive session has expired. Please sign in again.');
    }
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error?.message || `Failed to list files from Google Drive (${res.status})`);
  }

  const data = await res.json();
  const rawFiles: any[] = data.files || [];

  const files: DriveFileItem[] = rawFiles.map((f) => {
    const bytes = f.size ? parseInt(f.size, 10) : undefined;
    return {
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      size: f.size,
      sizeBytes: bytes,
      webViewLink: f.webViewLink,
      webContentLink: f.webContentLink,
      thumbnailLink: f.thumbnailLink,
      iconLink: f.iconLink,
      modifiedTime: f.modifiedTime,
      createdTime: f.createdTime,
      owners: f.owners,
    };
  });

  return {
    files,
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Downloads a file's binary content from Google Drive using alt=media.
 */
export async function fetchDriveFileContent(fileId: string): Promise<ArrayBuffer> {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Drive access is not authenticated. Please sign in with Google first.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedAccessToken = null;
      notifyListeners();
      throw new Error('Your Google Drive session has expired. Please sign in again.');
    }
    throw new Error(`Failed to download file from Google Drive (${res.status} ${res.statusText})`);
  }

  return await res.arrayBuffer();
}

/**
 * Fetches single file metadata from Google Drive.
 */
export async function getDriveFileMetadata(fileId: string): Promise<DriveFileItem> {
  const token = await getGoogleAccessToken();
  if (!token) {
    throw new Error('Google Drive access is not authenticated. Please sign in with Google first.');
  }

  const fields = 'id, name, mimeType, size, webViewLink, webContentLink, thumbnailLink, iconLink, modifiedTime, createdTime, owners';
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=${fields}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to get Google Drive file details (${res.status})`);
  }

  return await res.json();
}
