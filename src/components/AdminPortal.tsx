/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  Download,
  RotateCcw,
  Search,
  BookOpen,
  HardDrive,
  FileText,
  AlertCircle,
  HelpCircle,
  Layers,
  Home,
  ArrowLeft,
} from 'lucide-react';
import { AdminUser, Yearbook } from '../types/yearbook';
import {
  authenticateAdmin,
} from '../services/authService';
import { AdminYearbookModal } from './AdminYearbookModal';
import { AdminDeleteConfirmModal } from './AdminDeleteConfirmModal';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { BBSLogo } from './BBSLogo';
import { generateCoverSvgDataUrl } from '../utils/coverGenerator';
import {
  DriveFileItem,
  signInWithGoogle,
  signOutGoogle,
  getCurrentGoogleUser,
  subscribeToGoogleAuth,
} from '../services/googleDriveService';
import { extractFirstPageAndMetadata } from '../utils/pdfExtractor';
import { savePdfFile } from '../services/pdfStore';
import { parseYearRange } from '../services/yearbookStorage';

interface AdminPortalProps {
  adminUser: AdminUser | null;
  setAdminUser: (user: AdminUser | null) => void;
  yearbooks: Yearbook[];
  onSaveYearbook: (yearbook: Yearbook) => void;
  onDeleteYearbook: (id: string) => void;
  onResetYearbooks: () => void;
  onPreviewYearbook: (yearbook: Yearbook) => void;
  onOpenSetupGuide: () => void;
  onReturnToGallery: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  adminUser,
  setAdminUser,
  yearbooks,
  onSaveYearbook,
  onDeleteYearbook,
  onResetYearbooks,
  onPreviewYearbook,
  onOpenSetupGuide,
  onReturnToGallery,
}) => {
  // Login Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Admin Dashboard State
  const [tableSearch, setTableSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yearbookToEdit, setYearbookToEdit] = useState<Yearbook | null>(null);
  const [yearbookToDelete, setYearbookToDelete] = useState<Yearbook | null>(null);

  // Google Drive Integration State
  const [googleUser, setGoogleUser] = useState(() => getCurrentGoogleUser());
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveNotice, setDriveNotice] = useState<string | null>(null);
  const [domainNoticeActive, setDomainNoticeActive] = useState(false);

  React.useEffect(() => {
    const unsub = subscribeToGoogleAuth((user, token) => {
      setGoogleUser(user);
      setGoogleToken(token);
    });
    return () => unsub();
  }, []);

  const handleGoogleDriveSignIn = async () => {
    setIsConnectingDrive(true);
    setDriveNotice(null);
    try {
      const res = await signInWithGoogle();
      setGoogleUser(res.user);
      setGoogleToken(res.accessToken);
      setDriveNotice(`Connected to Google Drive as ${res.user.email}`);
    } catch (err: any) {
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setDomainNoticeActive(true);
        setIsDrivePickerOpen(true);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setDriveNotice(`Google Sign-In notice: ${err.message}`);
      }
    } finally {
      setIsConnectingDrive(false);
    }
  };

  const handleDirectDriveSelect = async (file: DriveFileItem, arrayBuffer: ArrayBuffer) => {
    try {
      const recordId = `yb-bbs-${Date.now()}`;
      let coverImageDataUrl = '';
      let detectedPageCount = 180;
      let computedTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');

      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        await savePdfFile(recordId, arrayBuffer.slice(0), file.name);
        try {
          const extracted = await extractFirstPageAndMetadata(arrayBuffer.slice(0));
          if (extracted.firstPageImageDataUrl) {
            coverImageDataUrl = extracted.firstPageImageDataUrl;
          }
          if (extracted.pageCount) {
            detectedPageCount = extracted.pageCount;
          }
          if (extracted.suggestedTitle) {
            computedTitle = extracted.suggestedTitle;
          }
        } catch (e) {
          console.warn('PDF extraction notice for Google Drive file:', e);
        }
      }

      const yearMatch = file.name.match(/20\d{2}[–\-_]20\d{2}|20\d{2}/);
      const currentYear = new Date().getFullYear();
      const detectedYear = yearMatch ? yearMatch[0].replace(/[-_]/, '–') : `${currentYear - 1}–${currentYear}`;
      const { startYear, endYear } = parseYearRange(detectedYear);

      if (!coverImageDataUrl) {
        coverImageDataUrl = generateCoverSvgDataUrl(detectedYear, computedTitle, 'darkBlue');
      }

      const sizeInMb = arrayBuffer && arrayBuffer.byteLength > 0
        ? (arrayBuffer.byteLength / (1024 * 1024)).toFixed(1)
        : (file.size ? file.size.replace(/[^0-9.]/g, '') || '45.0' : '45.0');

      const newYearbook: Yearbook = {
        id: recordId,
        year: detectedYear,
        startYear,
        endYear,
        title: computedTitle,
        description: `Official digital yearbook archive imported directly from Google Drive. Volume ${detectedYear}. Bina Bangsa School Pantai Indah Kapuk.`,
        coverImageUrl: coverImageDataUrl,
        fileUrl: '',
        fileName: file.name,
        fileSize: file.size || `${sizeInMb} MB`,
        fileSizeBytes: arrayBuffer?.byteLength || 47185920,
        pageCount: detectedPageCount,
        dateUploaded: new Date().toISOString(),
        tags: ['Google Drive', 'Cambridge A-Levels', 'Graduation', 'BBS PIK'],
        sourceType: 'google_drive',
        driveFileId: file.id,
        driveWebViewLink: file.webViewLink,
        driveWebContentLink: file.webContentLink,
        driveThumbnailLink: file.thumbnailLink,
      };

      onSaveYearbook(newYearbook);
      setDriveNotice(`Successfully imported "${file.name}" from Google Drive into BBS PIK gallery!`);
    } catch (err: any) {
      console.error('Failed to import drive file:', err);
      setDriveNotice(`Failed to import file: ${err.message}`);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      const user = await authenticateAdmin(email, password);
      setAdminUser(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLoginError(err.message);
      } else {
        setLoginError('Authentication failed. Check credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(yearbooks, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `BBS_PIK_Yearbook_Archive_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered list for admin management table
  const filteredList = yearbooks.filter((y) => {
    const q = tableSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      y.year.toLowerCase().includes(q) ||
      y.title.toLowerCase().includes(q) ||
      y.fileName.toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const totalPages = yearbooks.reduce((acc, y) => acc + (y.pageCount || 0), 0);
  const totalStorageBytes = yearbooks.reduce((acc, y) => acc + (y.fileSizeBytes || 38000000), 0);
  const totalStorageMb = (totalStorageBytes / (1024 * 1024)).toFixed(1);

  // =========================================================================
  // VIEW 1: ADMIN LOGIN SCREEN (If not logged in)
  // =========================================================================
  if (!adminUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-[#071630] border border-cyan-500/40 rounded-3xl shadow-2xl relative">
        {/* Top Quick Return Button */}
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-cyan-900/60">
          <button
            onClick={onReturnToGallery}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#071630] bg-yellow-400 hover:bg-yellow-300 rounded-xl shadow-sm transition-all cursor-pointer"
            title="Return to Main Page"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Main Page</span>
          </button>
          <span className="text-[11px] text-cyan-300 font-mono font-semibold">BBS PIK Archive</span>
        </div>

        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto p-1.5 rounded-2xl bg-white border-2 border-cyan-400/60 flex items-center justify-center mb-4 shadow-xl shadow-cyan-950/40">
            <BBSLogo size={52} />
          </div>
          <h2 className="font-serif text-2xl font-bold text-white tracking-tight">
            Administrator Access Portal
          </h2>
          <p className="text-xs text-cyan-200/80 mt-1.5 font-sans leading-relaxed">
            Bina Bangsa School-Pantai Indah Kapuk. Restricted to authorized school archivists and staff. Public registration is disabled.
          </p>
        </div>

        {/* Secure Archival Login Notice */}
        <div className="mb-6 p-3 rounded-xl bg-[#030d1d] border border-cyan-900/80 text-xs text-cyan-200/80 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Please enter your authorized administrative credentials to access archive management tools.</span>
        </div>

        {/* Error notification */}
        {loginError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-cyan-100 mb-1">
              Admin Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@binabangsaschool.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-100 mb-1">
              Secret Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-white cursor-pointer p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-[#071630] font-extrabold text-sm rounded-xl shadow-lg shadow-yellow-400/20 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <span className="animate-pulse">Authenticating Session...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In to BBS PIK Admin Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t border-cyan-950 text-center flex items-center justify-between text-xs text-cyan-200/80">
          <button
            onClick={onReturnToGallery}
            className="inline-flex items-center gap-1.5 font-bold text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Main Page</span>
          </button>
          <button
            onClick={onOpenSetupGuide}
            className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-yellow-400" />
            <span>Setup Guide</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner / Admin Identity */}
      <div className="bg-[#071630] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 font-extrabold text-xs uppercase tracking-wider">
              {adminUser.role === 'super_admin' ? 'BBS PIK Super Admin' : 'Archivist Admin'}
            </span>
            <span className="text-xs text-cyan-300 font-mono">
              Bina Bangsa School-Pantai Indah Kapuk
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            Yearbook Records & Archive Management
          </h1>
          <p className="text-xs sm:text-sm text-cyan-100/90 mt-1 font-sans">
            Logged in as <strong className="text-white">{adminUser.fullName}</strong> ({adminUser.email})
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => setIsDrivePickerOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0b244d] hover:bg-cyan-800 text-white font-extrabold text-xs sm:text-sm rounded-xl border border-cyan-400/50 shadow-md transition-all cursor-pointer"
            title="Browse and select yearbook from Google Drive"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 87.3 78">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
            <span>Import from Google Drive</span>
          </button>

          <button
            onClick={() => {
              setYearbookToEdit(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-yellow-400/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload New Yearbook</span>
          </button>

          <button
            onClick={onReturnToGallery}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-[#071630] text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-yellow-400/20 border border-yellow-300 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            title="Return to Main Page"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>Return to Main Page</span>
          </button>
        </div>
      </div>

      {/* Analytics & Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-[#071630] border border-cyan-800">
          <div className="flex items-center justify-between text-cyan-300 mb-2">
            <span className="text-xs font-bold">Total Volumes</span>
            <Layers className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-white">
            {yearbooks.length}
          </div>
          <span className="text-[11px] text-cyan-300 font-semibold">Published in PIK gallery</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#071630] border border-cyan-800">
          <div className="flex items-center justify-between text-cyan-300 mb-2">
            <span className="text-xs font-bold">Archived Pages</span>
            <FileText className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-white">
            {totalPages.toLocaleString()}
          </div>
          <span className="text-[11px] text-cyan-200/80">Digitally certified</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#071630] border border-cyan-800">
          <div className="flex items-center justify-between text-cyan-300 mb-2">
            <span className="text-xs font-bold">Archive Size</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-white">
            {totalStorageMb} MB
          </div>
          <span className="text-[11px] text-cyan-200/80">PDF repository payload</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-[#071630] border border-cyan-800">
          <div className="flex items-center justify-between text-cyan-300 mb-2">
            <span className="text-xs font-bold">System Status</span>
            <ShieldCheck className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="font-serif text-lg sm:text-xl font-bold text-cyan-300 mt-1">
            Protected
          </div>
          <span className="text-[11px] text-cyan-200/80">Read-only public protection</span>
        </div>
      </div>

      {/* Google Drive Integration Banner */}
      <div className="bg-[#071630] border border-cyan-500/40 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center shrink-0">
            <svg className="w-7 h-7" viewBox="0 0 87.3 78">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-white text-base sm:text-lg">
                Google Drive Yearbook Integration
              </h3>
              {googleToken ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Connected
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-400/20 text-yellow-300 border border-yellow-400/40">
                  Ready to Connect
                </span>
              )}
            </div>
            <p className="text-xs text-cyan-200/80 mt-0.5 max-w-xl">
              {googleUser ? (
                <span>
                  Connected as <strong className="text-white">{googleUser.displayName || googleUser.email}</strong> ({googleUser.email}). Yearbook files selected from Google Drive are automatically synced and viewable across mobile, tablet, and laptop.
                </span>
              ) : (
                'Make Google Drive the source of yearbook files. Files uploaded from Google Drive are immediately available for reading and download.'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
          {googleToken ? (
            <>
              <button
                type="button"
                onClick={() => setIsDrivePickerOpen(true)}
                className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                <HardDrive className="w-4 h-4" />
                <span>Browse Drive Files</span>
              </button>
              <button
                type="button"
                onClick={signOutGoogle}
                className="px-3 py-2.5 text-xs text-cyan-300 hover:text-rose-300 border border-cyan-800 hover:border-rose-500/40 rounded-xl transition-colors cursor-pointer"
                title="Disconnect Google Drive"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleGoogleDriveSignIn}
              disabled={isConnectingDrive}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
              <span>{isConnectingDrive ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {driveNotice && (
        <div className="p-3.5 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs flex items-center justify-between gap-3">
          <span>{driveNotice}</span>
          <button onClick={() => setDriveNotice(null)} className="text-cyan-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Management Toolbar & Search */}
      <div className="bg-[#071630] border border-cyan-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search uploaded yearbooks by year or title..."
              className="w-full pl-9 pr-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-xs sm:text-sm text-white placeholder-cyan-200/50 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Backup and Utility Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportBackup}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0b244d] hover:bg-cyan-700 text-white border border-cyan-600/40 text-xs font-bold transition-colors cursor-pointer"
              title="Download full JSON archive metadata backup"
            >
              <Download className="w-3.5 h-3.5 text-yellow-400" />
              <span>Export Backup (.JSON)</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Reset all yearbook records to initial BBS PIK sample collection?')) {
                  onResetYearbooks();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0b244d] hover:bg-cyan-700 text-cyan-200 hover:text-white border border-cyan-600/40 text-xs font-bold transition-colors cursor-pointer"
              title="Reset records to default BBS PIK sample collection"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Responsive Mobile & Tablet Card View (guarantees uploaded files and updates are instantly visible) */}
        <div className="md:hidden space-y-4">
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#040e20] border border-cyan-800 shadow-lg space-y-3"
            >
              {/* Top row: Year & Milestone & Date */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-yellow-400 text-sm">
                    {item.year}
                  </span>
                  {item.featured && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-sans border border-yellow-400/40 font-bold">
                      Milestone
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-cyan-300">
                  {new Date(item.dateUploaded).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Middle row: Thumbnail + Title & Overview */}
              <div className="flex items-start gap-3">
                <div
                  onClick={() => onPreviewYearbook(item)}
                  className="w-16 h-22 rounded-lg overflow-hidden shadow-md border border-cyan-700/80 cursor-pointer bg-[#020b18] shrink-0"
                >
                  <img
                    src={
                      item.coverImageUrl?.includes('utf8,')
                        ? generateCoverSvgDataUrl(item.year, item.title, 'darkBlue')
                        : (item.coverImageUrl || generateCoverSvgDataUrl(item.year, item.title, 'darkBlue'))
                    }
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = generateCoverSvgDataUrl(item.year, item.title, 'darkBlue');
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    onClick={() => onPreviewYearbook(item)}
                    className="font-bold text-white text-sm hover:text-yellow-400 transition-colors cursor-pointer line-clamp-1"
                  >
                    {item.title}
                  </h4>
                  <p className="text-cyan-200/80 text-xs line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Document Specifications Box (Directly displays uploaded file name, size, pages, and updates) */}
              <div className="p-3 rounded-xl bg-[#071630] border border-cyan-900/80 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="flex items-center gap-1.5 text-yellow-300 font-bold truncate">
                    <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate" title={item.fileName}>{item.fileName}</span>
                  </span>
                  <span className="text-cyan-300 font-bold shrink-0 ml-1">
                    {item.fileSize}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-cyan-200/80 pt-1 border-t border-cyan-950">
                  <span>{item.pageCount} certified pages</span>
                  {item.driveFileId ? (
                    <span className="text-cyan-300 font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" viewBox="0 0 87.3 78">
                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                      </svg>
                      Google Drive
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Uploaded Document
                    </span>
                  )}
                </div>
              </div>

              {/* Mobile Action Buttons with proper touch targets */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => onPreviewYearbook(item)}
                  className="min-h-[42px] px-3 py-2 bg-[#0b244d] hover:bg-cyan-700 text-cyan-200 hover:text-white font-bold text-xs rounded-xl border border-cyan-700/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink className="w-4 h-4 text-cyan-300" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={() => {
                    setYearbookToEdit(item);
                    setIsModalOpen(true);
                  }}
                  className="min-h-[42px] px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </button>

                <button
                  onClick={() => setYearbookToDelete(item)}
                  className="min-h-[42px] px-3 py-2 bg-[#0b244d] hover:bg-rose-950 text-rose-300 hover:text-rose-200 font-bold text-xs rounded-xl border border-rose-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}

          {filteredList.length === 0 && (
            <div className="p-8 text-center text-cyan-300 bg-[#040e20] rounded-2xl border border-cyan-900">
              No yearbook volumes found matching your query.
            </div>
          )}
        </div>

        {/* Desktop Yearbooks Table (hidden on mobile/tablet) */}
        <div className="hidden md:block overflow-x-auto border border-cyan-900 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#030d1d] text-cyan-300 uppercase font-mono tracking-wider border-b border-cyan-900">
              <tr>
                <th className="px-4 py-3">Cover</th>
                <th className="px-4 py-3">Academic Year</th>
                <th className="px-4 py-3">Title & Overview</th>
                <th className="px-4 py-3">Document Info</th>
                <th className="px-4 py-3">Upload Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-950">
              {filteredList.map((item) => (
                <tr key={item.id} className="hover:bg-[#0b244d]/40 transition-colors">
                  {/* Cover Thumbnail */}
                  <td className="px-4 py-3">
                    <div
                      onClick={() => onPreviewYearbook(item)}
                      className="w-10 h-14 rounded overflow-hidden shadow border border-cyan-700 cursor-pointer bg-[#030d1d] hover:scale-105 transition-transform"
                    >
                      <img
                        src={
                          item.coverImageUrl?.includes('utf8,')
                            ? generateCoverSvgDataUrl(item.year, item.title, 'darkBlue')
                            : (item.coverImageUrl || generateCoverSvgDataUrl(item.year, item.title, 'darkBlue'))
                        }
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = generateCoverSvgDataUrl(item.year, item.title, 'darkBlue');
                        }}
                      />
                    </div>
                  </td>

                  {/* Year */}
                  <td className="px-4 py-3 font-serif font-bold text-yellow-400 whitespace-nowrap text-sm">
                    {item.year}
                    {item.featured && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-300 font-sans border border-yellow-400/40">
                        Milestone
                      </span>
                    )}
                  </td>

                  {/* Title & Description */}
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-bold text-white truncate text-sm">
                      {item.title}
                    </div>
                    <div className="text-cyan-200/75 line-clamp-1 text-[11px] mt-0.5">
                      {item.description}
                    </div>
                  </td>

                  {/* Document Info */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-mono text-cyan-200">{item.fileName}</div>
                    <div className="text-[11px] text-cyan-400/80 mt-0.5 flex items-center gap-2">
                      <span>{item.pageCount} pages • {item.fileSize}</span>
                      {item.driveFileId && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold flex items-center gap-1">
                          <svg className="w-2.5 h-2.5" viewBox="0 0 87.3 78">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                          </svg>
                          Drive
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 whitespace-nowrap text-cyan-300 font-mono text-[11px]">
                    {new Date(item.dateUploaded).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.driveWebViewLink && (
                        <a
                          href={item.driveWebViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-[#0b244d] transition-colors cursor-pointer"
                          title="Open Google Drive link"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 87.3 78">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                          </svg>
                        </a>
                      )}

                      <button
                        onClick={() => onPreviewYearbook(item)}
                        className="p-1.5 rounded-lg text-cyan-300 hover:text-white hover:bg-[#0b244d] transition-colors cursor-pointer"
                        title="Preview In Browser"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          setYearbookToEdit(item);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-cyan-300 hover:text-yellow-400 hover:bg-[#0b244d] transition-colors cursor-pointer"
                        title="Edit Yearbook Details"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setYearbookToDelete(item)}
                        className="p-1.5 rounded-lg text-cyan-300 hover:text-rose-400 hover:bg-[#0b244d] transition-colors cursor-pointer"
                        title="Delete Yearbook"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-cyan-300">
                    No yearbook volumes found matching your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Upload Modal */}
      <AdminYearbookModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setYearbookToEdit(null);
        }}
        onSave={(data) => {
          onSaveYearbook(data);
          setIsModalOpen(false);
          setYearbookToEdit(null);
        }}
        yearbookToEdit={yearbookToEdit}
        adminUser={adminUser}
      />

      {/* Delete Confirmation Modal */}
      <AdminDeleteConfirmModal
        isOpen={!!yearbookToDelete}
        yearbook={yearbookToDelete}
        onClose={() => setYearbookToDelete(null)}
        onConfirm={(id) => {
          onDeleteYearbook(id);
          setYearbookToDelete(null);
        }}
      />

      {/* Direct Google Drive File Picker Modal */}
      <GoogleDrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => {
          setIsDrivePickerOpen(false);
          setDomainNoticeActive(false);
        }}
        onSelectDriveFile={handleDirectDriveSelect}
        initialDomainNotice={domainNoticeActive}
      />
    </div>
  );
};
