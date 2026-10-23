/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  HardDrive,
  FileText,
  Loader2,
  ExternalLink,
  Check,
  RefreshCw,
  AlertCircle,
  LogOut,
  FolderOpen,
} from 'lucide-react';
import {
  DriveFileItem,
  listDrivePdfFiles,
  fetchDriveFileContent,
  signInWithGoogle,
  signOutGoogle,
  getCurrentGoogleUser,
  getGoogleAccessToken,
  subscribeToGoogleAuth,
} from '../services/googleDriveService';

interface GoogleDrivePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDriveFile: (file: DriveFileItem, arrayBuffer: ArrayBuffer) => Promise<void> | void;
}

export const GoogleDrivePickerModal: React.FC<GoogleDrivePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectDriveFile,
}) => {
  const [user, setUser] = useState(() => getCurrentGoogleUser());
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgressText, setDownloadProgressText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Subscribe to auth state changes
  useEffect(() => {
    const unsubscribe = subscribeToGoogleAuth((currentUser, currentToken) => {
      setUser(currentUser);
      setToken(currentToken);
    });
    return () => unsubscribe();
  }, []);

  // Fetch drive files whenever user is signed in or search changes
  useEffect(() => {
    if (!isOpen) return;

    if (token) {
      loadFiles(searchQuery);
    } else {
      setFiles([]);
    }
  }, [isOpen, token]);

  const loadFiles = async (query = '') => {
    setIsLoadingFiles(true);
    setError(null);
    try {
      const res = await listDrivePdfFiles(query);
      setFiles(res.files);
    } catch (err: any) {
      console.error('Failed to list files:', err);
      setError(err.message || 'Failed to retrieve files from Google Drive.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      setUser(result.user);
      setToken(result.accessToken);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogle();
      setUser(null);
      setToken(null);
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect Google Drive.');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      loadFiles(searchQuery);
    }
  };

  const handleSelect = async (file: DriveFileItem) => {
    setSelectedFileId(file.id);
    setIsDownloading(true);
    setDownloadProgressText(`Fetching "${file.name}" from Google Drive...`);
    setError(null);

    try {
      const arrayBuffer = await fetchDriveFileContent(file.id);
      setDownloadProgressText('Synchronizing cover and extracting pages...');
      await onSelectDriveFile(file, arrayBuffer);
      onClose();
    } catch (err: any) {
      console.error('Failed to import file:', err);
      setError(err.message || 'Failed to download and process file from Google Drive.');
    } finally {
      setIsDownloading(false);
      setSelectedFileId(null);
      setDownloadProgressText('');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#030d1d]/85 backdrop-blur-md overflow-hidden"
    >
      <div className="relative w-full max-w-2xl bg-[#071630] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900 bg-[#040e20]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center">
              {/* Google Drive Logo Colors */}
              <svg className="w-6 h-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
              </svg>
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <span>Select from Google Drive</span>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                  Yearbook Source
                </span>
              </h3>
              <p className="text-xs text-cyan-200/80">
                Pick a yearbook PDF from your Google Drive archive to view in the BBS PIK gallery.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* VIEW A: NOT SIGNED IN WITH GOOGLE */}
          {!token && (
            <div className="text-center py-8 px-4 bg-[#040e20] border border-cyan-900 rounded-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-4">
                <HardDrive className="w-8 h-8 text-yellow-400" />
              </div>
              <h4 className="text-base font-serif font-bold text-white mb-2">
                Connect School Google Drive
              </h4>
              <p className="text-xs text-cyan-200/80 max-w-md mx-auto mb-6 leading-relaxed">
                Sign in with your Bina Bangsa School Google account (or Google Drive holding yearbook PDFs) with permission to select and view yearbook archives.
              </p>

              {/* Official Google Sign-In Material Button Specification */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="inline-flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-300 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
                >
                  {isAuthenticating ? (
                    <Loader2 className="w-5 h-5 animate-spin text-cyan-600" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      <path fill="none" d="M0 0h48v48H0z" />
                    </svg>
                  )}
                  <span>{isAuthenticating ? 'Connecting Google Drive...' : 'Sign in with Google'}</span>
                </button>
              </div>

              <p className="text-[11px] text-cyan-400/70 mt-4">
                Access tokens are stored strictly in-memory during your active session.
              </p>
            </div>
          )}

          {/* VIEW B: SIGNED IN WITH GOOGLE */}
          {token && (
            <div className="space-y-4">
              {/* Account Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#040e20] border border-cyan-900">
                <div className="flex items-center gap-3">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Google User'}
                      className="w-8 h-8 rounded-full border border-cyan-400"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-cyan-700 text-white font-bold flex items-center justify-center text-xs">
                      {user?.displayName ? user.displayName[0] : 'G'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{user?.displayName || 'Google Account'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Connected
                      </span>
                    </div>
                    <div className="text-[11px] text-cyan-300 font-mono">
                      {user?.email || 'Authenticated'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadFiles(searchQuery)}
                    disabled={isLoadingFiles}
                    className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
                    title="Refresh Google Drive files"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-500/15 rounded-lg border border-rose-500/30 transition-colors cursor-pointer"
                    title="Disconnect Google Drive"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Disconnect</span>
                  </button>
                </div>
              </div>

              {/* Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search PDF files in Google Drive (e.g., 2024, Yearbook, BBS)..."
                    className="w-full pl-9 pr-3 py-2 bg-[#040e20] border border-cyan-800 rounded-xl text-white text-xs placeholder-cyan-500/60 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoadingFiles}
                  className="px-3.5 py-2 bg-[#0b244d] hover:bg-cyan-700 text-white font-bold text-xs rounded-xl border border-cyan-500/40 transition-colors cursor-pointer shrink-0"
                >
                  Search
                </button>
              </form>

              {/* Downloading Progress Indicator */}
              {isDownloading && (
                <div className="p-4 rounded-xl bg-cyan-950/80 border border-cyan-400 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-yellow-400 mx-auto" />
                  <div className="text-sm font-bold text-white">{downloadProgressText}</div>
                  <div className="text-xs text-cyan-200/80">
                    Downloading high-resolution yearbook PDF and generating synchronized cover...
                  </div>
                </div>
              )}

              {/* File List */}
              <div className="space-y-2 max-h-[46vh] overflow-y-auto pr-1">
                {isLoadingFiles ? (
                  <div className="py-12 text-center text-cyan-300 space-y-2">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-yellow-400" />
                    <p className="text-xs">Scanning Google Drive for PDF yearbook files...</p>
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-12 text-center bg-[#040e20] border border-cyan-950 rounded-xl space-y-2">
                    <FolderOpen className="w-8 h-8 text-cyan-600 mx-auto" />
                    <p className="text-sm font-bold text-white">No PDF files found</p>
                    <p className="text-xs text-cyan-200/70 max-w-xs mx-auto">
                      {searchQuery
                        ? `No PDF files matched "${searchQuery}". Try a different keyword.`
                        : 'Upload your yearbook PDF to your Google Drive, then click Refresh above.'}
                    </p>
                  </div>
                ) : (
                  files.map((file) => {
                    const isSelected = selectedFileId === file.id;
                    const formattedSize = file.sizeBytes
                      ? `${(file.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                      : 'PDF Document';
                    const modifiedDate = file.modifiedTime
                      ? new Date(file.modifiedTime).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '';

                    return (
                      <div
                        key={file.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-yellow-400/15 border-yellow-400 shadow-md'
                            : 'bg-[#040e20] border-cyan-900/70 hover:border-cyan-500/50 hover:bg-[#071630]'
                        }`}
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-9 h-9 rounded-lg bg-[#071630] border border-cyan-800 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-yellow-400" />
                          </div>
                          <div className="truncate">
                            <h5 className="text-xs sm:text-sm font-bold text-white truncate" title={file.name}>
                              {file.name}
                            </h5>
                            <p className="text-[11px] text-cyan-200/70 flex items-center gap-2">
                              <span className="font-semibold text-yellow-300">{formattedSize}</span>
                              {modifiedDate && <span>• Modified {modifiedDate}</span>}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-cyan-400 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
                              title="Open preview in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            disabled={isDownloading}
                            onClick={() => handleSelect(file)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isSelected ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Importing...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Select & Sync</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-cyan-900 bg-[#040e20] flex items-center justify-between text-xs text-cyan-300">
          <span className="text-[11px] text-cyan-400/80">
            Source: Google Drive • Bina Bangsa School Pantai Indah Kapuk
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-[#0b244d] hover:bg-cyan-700 text-white font-bold rounded-lg border border-cyan-500/40 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
