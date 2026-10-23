/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  RotateCcw,
  Sparkles,
  Calendar,
  Tag,
  Link as LinkIcon,
  Hash,
  HardDrive,
  BookOpen,
  Check,
} from 'lucide-react';
import { Yearbook, AdminUser } from '../types/yearbook';
import { parseYearRange } from '../services/yearbookStorage';
import { generateCoverSvgDataUrl } from '../utils/coverGenerator';
import { extractFirstPageAndMetadata } from '../utils/pdfExtractor';
import { getActiveAdminSession } from '../services/authService';
import { savePdfFile } from '../services/pdfStore';
import { GoogleDrivePickerModal } from './GoogleDrivePickerModal';
import { DriveFileItem } from '../services/googleDriveService';
import {
  extractGoogleDriveFileId,
  getGoogleDriveViewUrl,
  getGoogleDriveDownloadUrl,
} from '../utils/googleDriveUrl';

interface AdminYearbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (yearbook: Yearbook) => void;
  yearbookToEdit: Yearbook | null;
  adminUser?: AdminUser | null;
}

type CoverSourceMode = 'firstPage' | 'upload' | 'generate' | 'url';

export const AdminYearbookModal: React.FC<AdminYearbookModalProps> = ({
  isOpen,
  onClose,
  onSave,
  yearbookToEdit,
  adminUser,
}) => {
  const isEditing = !!yearbookToEdit;
  const activeAdmin = adminUser || getActiveAdminSession();
  const [currentRecordId, setCurrentRecordId] = useState<string>(
    () => yearbookToEdit?.id || `yb-bbs-${Date.now()}`
  );

  // 1. Academic Year
  const [year, setYear] = useState('');

  // 2. Title
  const [title, setTitle] = useState('');

  // 3. Overview / Description
  const [description, setDescription] = useState('');

  // 4. Cover Editing & Sources
  const [coverSource, setCoverSource] = useState<CoverSourceMode>('generate');
  const [firstPageCoverUrl, setFirstPageCoverUrl] = useState<string>('');
  const [customCoverUrl, setCustomCoverUrl] = useState('');
  const [coverUrlInput, setCoverUrlInput] = useState('');
  const [themeColor, setThemeColor] = useState<
    'darkBlue' | 'turquoise' | 'navyYellow' | 'midnight' | 'whiteGold' | 'royal'
  >('darkBlue');

  // 5. Document Info (File name, size, page count, theme, tags, dates, external link)
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState<number>(0);
  const [fileUrl, setFileUrl] = useState('');
  const [pageCount, setPageCount] = useState<number>(180);
  const [theme, setTheme] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [dateUploaded, setDateUploaded] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);

  // Google Drive Source State
  const [driveFileId, setDriveFileId] = useState('');
  const [driveLinkInput, setDriveLinkInput] = useState('');
  const [driveWebViewLink, setDriveWebViewLink] = useState('');
  const [driveWebContentLink, setDriveWebContentLink] = useState('');
  const [driveThumbnailLink, setDriveThumbnailLink] = useState('');
  const [sourceType, setSourceType] = useState<'google_drive' | 'uploaded' | 'curated'>('uploaded');
  const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);

  // Status & Feedback
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Populate state on open or when editing target changes
  useEffect(() => {
    if (yearbookToEdit) {
      setYear(yearbookToEdit.year);
      setTitle(yearbookToEdit.title);
      setDescription(yearbookToEdit.description);
      setTheme(yearbookToEdit.theme || '');
      setCustomCoverUrl(yearbookToEdit.coverImageUrl);
      setCoverUrlInput(
        yearbookToEdit.coverImageUrl.startsWith('data:') ? '' : yearbookToEdit.coverImageUrl
      );
      setCoverSource('upload');
      setFirstPageCoverUrl(yearbookToEdit.coverImageUrl.startsWith('data:image') ? yearbookToEdit.coverImageUrl : '');
      setFileName(yearbookToEdit.fileName || '');
      setFileSize(yearbookToEdit.fileSize || '45.0 MB');
      setFileSizeBytes(yearbookToEdit.fileSizeBytes || 47185920);
      setFileUrl(yearbookToEdit.fileUrl || '');
      setPageCount(yearbookToEdit.pageCount || 180);
      setTagsInput(yearbookToEdit.tags ? yearbookToEdit.tags.join(', ') : '');
      setDateUploaded(yearbookToEdit.dateUploaded ? yearbookToEdit.dateUploaded.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setIsFeatured(!!yearbookToEdit.featured);
      setCurrentRecordId(yearbookToEdit.id);
      setDriveFileId(yearbookToEdit.driveFileId || '');
      setDriveLinkInput(yearbookToEdit.driveWebViewLink || yearbookToEdit.driveFileId || '');
      setDriveWebViewLink(yearbookToEdit.driveWebViewLink || '');
      setDriveWebContentLink(yearbookToEdit.driveWebContentLink || '');
      setDriveThumbnailLink(yearbookToEdit.driveThumbnailLink || '');
      setSourceType(yearbookToEdit.sourceType || (yearbookToEdit.driveFileId ? 'google_drive' : 'uploaded'));
    } else {
      // Default New Entry
      const currentYear = new Date().getFullYear();
      setYear(`${currentYear - 1}–${currentYear}`);
      setTitle('');
      setDescription('');
      setTheme('Gloria Dei Vivens Homo & Global Leadership');
      setCoverSource('generate');
      setThemeColor('darkBlue');
      setCustomCoverUrl('');
      setFirstPageCoverUrl('');
      setCoverUrlInput('');
      setFileName('');
      setFileSize('45.0 MB');
      setFileSizeBytes(47185920);
      setFileUrl('');
      setPageCount(200);
      setTagsInput('Cambridge A-Levels, Graduation, Sports, Chapel');
      setDateUploaded(new Date().toISOString().slice(0, 10));
      setIsFeatured(false);
      setCurrentRecordId(`yb-bbs-${Date.now()}`);
      setDriveFileId('');
      setDriveLinkInput('');
      setDriveWebViewLink('');
      setDriveWebContentLink('');
      setDriveThumbnailLink('');
      setSourceType('uploaded');
    }
    setError(null);
    setSuccessNotice(null);
  }, [yearbookToEdit, isOpen]);

  // Handle direct Google Drive link input
  const handleDriveLinkChange = (inputVal: string) => {
    setDriveLinkInput(inputVal);
    const extractedId = extractGoogleDriveFileId(inputVal);
    if (extractedId) {
      setDriveFileId(extractedId);
      setDriveWebViewLink(getGoogleDriveViewUrl(extractedId));
      setDriveWebContentLink(getGoogleDriveDownloadUrl(extractedId));
      setSourceType('google_drive');
      if (!fileName) {
        setFileName(`BBS_PIK_Yearbook_Drive_${extractedId.slice(0, 8)}.pdf`);
      }
      setSuccessNotice(`Google Drive file linked (ID: ${extractedId}). File will be viewable in the app.`);
    } else if (!inputVal.trim()) {
      setDriveFileId('');
      setDriveWebViewLink('');
      setDriveWebContentLink('');
    }
  };

  // CRITICAL REQUIREMENT: "the editable version should only be viewed when in admin log in mode."
  if (!isOpen || !activeAdmin) return null;

  // Active cover computation
  let activeCoverUrl = '';
  if (coverSource === 'firstPage' && firstPageCoverUrl) {
    activeCoverUrl = firstPageCoverUrl;
  } else if (coverSource === 'url' && coverUrlInput.trim()) {
    activeCoverUrl = coverUrlInput.trim();
  } else if (coverSource === 'upload' && customCoverUrl) {
    activeCoverUrl = customCoverUrl;
  } else if (coverSource === 'generate') {
    activeCoverUrl = generateCoverSvgDataUrl(year || '2025', title || 'BBS PIK Yearbook', themeColor);
  } else {
    activeCoverUrl = firstPageCoverUrl || customCoverUrl || generateCoverSvgDataUrl(year || '2025', title || 'BBS PIK Yearbook', themeColor);
  }

  // Handle Main Document Upload (PDF) with Automatic Cover Synchronization
  // CRITICAL REQUIREMENTS:
  // 1. "the default cover will be the first page of the uploaded document."
  // 2. "Once files are uploaded automatically sync the files with the cover."
  const processPdfFile = async (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Yearbook document must be a PDF file (.pdf).');
      return;
    }

    // Safety limit 300MB
    const maxBytes = 300 * 1024 * 1024;
    if (file.size > maxBytes) {
      setError('File exceeds maximum allowed limit of 300 MB. Please compress the PDF before uploading.');
      return;
    }

    setIsProcessingFile(true);
    setError(null);
    setSuccessNotice(null);

    // Auto-populate Document Info
    const computedFileName = file.name;
    setFileName(computedFileName);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const computedFileSize = `${sizeInMb} MB`;
    setFileSize(computedFileSize);
    setFileSizeBytes(file.size);

    // Try to auto-detect academic year from filename if empty or default
    const yearMatch = file.name.match(/20\d{2}[–\-_]20\d{2}|20\d{2}/);
    if (yearMatch && (!year || year === '2024–2025')) {
      const detectedYear = yearMatch[0].replace(/[-_]/, '–');
      setYear(detectedYear);
    }

    try {
      // Read file buffer for PDF rendering
      const arrayBuffer = await file.arrayBuffer();

      // Persist full uploaded PDF to IndexedDB store with buffer detachment protection
      await savePdfFile(currentRecordId, arrayBuffer.slice(0), file.name);

      // Extract first page as high-res cover image and detect real page count using safe copy
      const extracted = await extractFirstPageAndMetadata(arrayBuffer.slice(0));

      if (extracted.firstPageImageDataUrl) {
        // Automatically sync cover with Page 1 of the uploaded document!
        setFirstPageCoverUrl(extracted.firstPageImageDataUrl);
        setCustomCoverUrl(extracted.firstPageImageDataUrl);
        setCoverSource('firstPage');

        // Automatically set certified page count
        if (extracted.pageCount && extracted.pageCount > 0) {
          setPageCount(extracted.pageCount);
        }

        // Suggest title if available and currently blank
        if (extracted.suggestedTitle && !title) {
          setTitle(extracted.suggestedTitle);
        }

        setSuccessNotice(
          `Document uploaded successfully. Cover has been automatically synced with Page 1 of "${file.name}" (${extracted.pageCount} pages detected).`
        );
      } else {
        // Fallback procedural sync with document details
        const fallbackCover = generateCoverSvgDataUrl(year || '2024–2025', title || file.name.replace(/\.[^/.]+$/, ''), themeColor);
        setFirstPageCoverUrl(fallbackCover);
        setCustomCoverUrl(fallbackCover);
        setCoverSource('firstPage');
        setSuccessNotice(`Document "${file.name}" uploaded (${computedFileSize}). Cover automatically synced with uploaded document.`);
      }

      // If under 15MB, also store data URL in fileUrl for direct in-browser reading
      if (file.size <= 15 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = () => {
          setFileUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFileUrl('');
      }
    } catch (err) {
      console.warn('PDF first-page extraction notice:', err);
      // Fallback: file is archived, automatically generate and sync cover
      const fallbackCover = generateCoverSvgDataUrl(year || '2024–2025', title || file.name.replace(/\.[^/.]+$/, ''), themeColor);
      setFirstPageCoverUrl(fallbackCover);
      setCustomCoverUrl(fallbackCover);
      setCoverSource('firstPage');
      setSuccessNotice(`Document "${file.name}" uploaded (${computedFileSize}). Cover automatically synced with document.`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Handle Yearbook selection directly from Google Drive
  const handleSelectDriveFile = async (file: DriveFileItem, arrayBuffer: ArrayBuffer) => {
    setIsProcessingFile(true);
    setError(null);
    setSuccessNotice(null);

    const computedFileName = file.name;
    setFileName(computedFileName);
    const sizeInMb = (arrayBuffer.byteLength / (1024 * 1024)).toFixed(1);
    const computedFileSize = `${sizeInMb} MB`;
    setFileSize(computedFileSize);
    setFileSizeBytes(arrayBuffer.byteLength);

    setDriveFileId(file.id);
    setDriveWebViewLink(file.webViewLink || '');
    setDriveWebContentLink(file.webContentLink || '');
    setDriveThumbnailLink(file.thumbnailLink || '');
    setSourceType('google_drive');

    // Auto-detect academic year from filename if empty or default
    const yearMatch = file.name.match(/20\d{2}[–\-_]20\d{2}|20\d{2}/);
    if (yearMatch && (!year || year === '2024–2025')) {
      const detectedYear = yearMatch[0].replace(/[-_]/, '–');
      setYear(detectedYear);
    }

    try {
      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        // Save full downloaded PDF to IndexedDB store with buffer detachment protection
        await savePdfFile(currentRecordId, arrayBuffer.slice(0), file.name);

        // Extract first page as high-res cover image and detect real page count
        const extracted = await extractFirstPageAndMetadata(arrayBuffer.slice(0));

        if (extracted.firstPageImageDataUrl) {
          setFirstPageCoverUrl(extracted.firstPageImageDataUrl);
          setCustomCoverUrl(extracted.firstPageImageDataUrl);
          setCoverSource('firstPage');

          if (extracted.pageCount && extracted.pageCount > 0) {
            setPageCount(extracted.pageCount);
          }

          if (extracted.suggestedTitle && !title) {
            setTitle(extracted.suggestedTitle);
          }

          setSuccessNotice(
            `Yearbook imported from Google Drive! Cover automatically synced with Page 1 of "${file.name}" (${extracted.pageCount} pages detected).`
          );
        } else {
          const fallbackCover = generateCoverSvgDataUrl(year || '2024–2025', title || file.name.replace(/\.[^/.]+$/, ''), themeColor);
          setFirstPageCoverUrl(fallbackCover);
          setCustomCoverUrl(fallbackCover);
          setCoverSource('firstPage');
          setSuccessNotice(`Yearbook "${file.name}" imported from Google Drive (${computedFileSize}). Cover synced.`);
        }

        if (arrayBuffer.byteLength <= 15 * 1024 * 1024) {
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          const reader = new FileReader();
          reader.onload = () => {
            setFileUrl(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } else {
          setFileUrl('');
        }
      } else {
        // Direct link / file ID mode (file is streamed via Google Drive embedded viewer)
        const fallbackCover = generateCoverSvgDataUrl(year || '2024–2025', title || file.name.replace(/\.[^/.]+$/, ''), themeColor);
        setFirstPageCoverUrl(fallbackCover);
        setCustomCoverUrl(fallbackCover);
        setCoverSource('firstPage');
        setSuccessNotice(`Google Drive yearbook linked: "${file.name}". Ready to view in app.`);
      }
    } catch (err) {
      console.warn('Google Drive PDF extraction notice:', err);
      const fallbackCover = generateCoverSvgDataUrl(year || '2024–2025', title || file.name.replace(/\.[^/.]+$/, ''), themeColor);
      setFirstPageCoverUrl(fallbackCover);
      setCustomCoverUrl(fallbackCover);
      setCoverSource('firstPage');
      setSuccessNotice(`Yearbook "${file.name}" imported from Google Drive. Cover synced.`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleMainFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processPdfFile(file);
    }
  };

  // Handle Custom Cover Image Upload (JPG, PNG, WebP)
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WebP) for the cover.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('Cover image file exceeds 8 MB. Please use a compressed image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCustomCoverUrl(dataUrl);
      setCoverSource('upload');
      setError(null);
      setSuccessNotice('Custom cover image loaded.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validations
    if (!year.trim()) {
      setError('Academic Year is required (e.g. 2024–2025 or 2025).');
      return;
    }
    if (!title.trim()) {
      setError('Yearbook title / edition name is required.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide an overview or summary for the yearbook.');
      return;
    }

    const { startYear, endYear } = parseYearRange(year);

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const yearbookData: Yearbook = {
      id: currentRecordId,
      year: year.trim(),
      startYear,
      endYear,
      title: title.trim(),
      description: description.trim(),
      theme: theme.trim() || undefined,
      coverImageUrl: activeCoverUrl,
      fileUrl: fileUrl,
      fileName: fileName.trim() || `BBS_PIK_Yearbook_${year.replace(/[^\w-]/g, '_')}.pdf`,
      fileSize: fileSize.trim() || '45.0 MB',
      fileSizeBytes: fileSizeBytes || 47185920,
      pageCount: Number(pageCount) || 180,
      dateUploaded: dateUploaded ? `${dateUploaded}T10:00:00Z` : yearbookToEdit ? yearbookToEdit.dateUploaded : new Date().toISOString(),
      tags: tags.length > 0 ? tags : ['Cambridge A-Levels', 'Graduation', 'Sports', 'Chapel'],
      featured: isFeatured,
      // Google Drive Fields
      sourceType: driveFileId ? 'google_drive' : sourceType,
      driveFileId: driveFileId || undefined,
      driveWebViewLink: driveWebViewLink || undefined,
      driveWebContentLink: driveWebContentLink || undefined,
      driveThumbnailLink: driveThumbnailLink || undefined,
      samplePages: yearbookToEdit?.samplePages || [
        {
          pageNumber: 1,
          section: 'Cover & Archival Title',
          title: title.trim(),
          content: `${year.trim()} Official Volume. Bina Bangsa School-Pantai Indah Kapuk. ${description.trim()}`,
        },
        {
          pageNumber: 4,
          section: 'Pastoral & Principal Message',
          title: 'Walking in Wisdom and Grace',
          content: 'Gloria Dei Vivens Homo: Men live to glorify God. Celebrating academic excellence, Christian fellowship, and vibrant community.',
        },
        {
          pageNumber: 36,
          section: 'Senior Cohort',
          title: 'Graduating Class Directory',
          content: 'Portraits, Cambridge qualifications, university destinations, and farewell quotes.',
        },
        {
          pageNumber: 92,
          section: 'Campus Achievements',
          title: 'Arts, Athletics & Student Life',
          content: 'Orchestral concerts, varsity championships, science innovation fairs, and house festivals.',
        },
      ],
    };

    try {
      onSave(yearbookData);
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to save yearbook entry.');
      }
    }
  };

  const presetYears = ['2025–2026', '2024–2025', '2023–2024', '2022–2023', '2021–2022', '2020–2021'];
  const commonTags = ['Cambridge A-Levels', 'Valedictorian', 'Graduation', 'Faith & Chapel', 'Athletics', 'Robotics', 'Arts & Orchestra', 'Junior College 2', 'Secondary 4'];

  const addTag = (tag: string) => {
    const currentTags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (!currentTags.includes(tag)) {
      currentTags.push(tag);
      setTagsInput(currentTags.join(', '));
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isEditing ? 'Edit Yearbook' : 'Upload New Yearbook'}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#030d1d]/85 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-5xl bg-[#071630] border border-cyan-500/40 rounded-3xl shadow-2xl overflow-hidden my-4 sm:my-6 max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-950 bg-[#040e20] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white flex items-center gap-2">
                <span>{isEditing ? 'Edit Yearbook Entry' : 'Archive New Yearbook'}</span>
                {year && (
                  <span className="px-2 py-0.5 rounded-md bg-yellow-400/20 text-yellow-300 border border-yellow-400/40 text-xs font-mono">
                    {year}
                  </span>
                )}
              </h2>
              <p className="text-xs text-cyan-200/80 font-sans">
                Bina Bangsa School-Pantai Indah Kapuk • Archival Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
            title="Close editor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-300 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {successNotice && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-start gap-2.5 text-xs text-emerald-300 shrink-0">
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (Inputs) */}
            <div className="lg:col-span-7 space-y-6">
              {/* SECTION A: Primary Identification (Academic Year & Title) */}
              <div className="p-4 rounded-2xl bg-[#040e20] border border-cyan-900/80 space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Academic Year & Title
                  </span>
                  <span className="text-[10px] text-cyan-300/80 font-mono">Editable Fields</span>
                </div>

                {/* Academic Year Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-cyan-100">
                      Academic Year <span className="text-yellow-400">*</span>
                    </label>
                    <span className="text-[10px] text-cyan-300/80">e.g. 2024–2025</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="e.g. 2024–2025 or 2025"
                    className="w-full px-3.5 py-2.5 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400 font-medium"
                  />
                  {/* Preset Year Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-cyan-300/70 mr-1">Quick Select:</span>
                    {presetYears.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setYear(y)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                          year === y
                            ? 'bg-yellow-400 text-[#071630]'
                            : 'bg-[#071630] text-cyan-200 border border-cyan-800 hover:text-white hover:border-cyan-400'
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title / Edition Name Field */}
                <div>
                  <label className="block text-xs font-bold text-cyan-100 mb-1">
                    Yearbook Title / Edition Name <span className="text-yellow-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. To Build The Nation"
                    className="w-full px-3.5 py-2.5 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400 font-medium"
                  />
                </div>

                {/* Overview / Description Field */}
                <div>
                  <label className="block text-xs font-bold text-cyan-100 mb-1">
                    Overview & Archival Summary <span className="text-yellow-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Summarize this graduating cohort, Cambridge A-Levels achievements, varsity championships, and campus life at BBS Pantai Indah Kapuk..."
                    className="w-full px-3.5 py-2.5 bg-[#030d1d] border border-cyan-800 rounded-xl text-sm text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400 resize-none leading-relaxed"
                  />
                  <span className="text-[10px] text-cyan-300/70 mt-1 block">
                    Publicly displayed in gallery cards and reader details.
                  </span>
                </div>
              </div>

              {/* SECTION B: Document Info & Upload (Editable Specifications) */}
              <div className="p-4 rounded-2xl bg-[#040e20] border border-cyan-900/80 space-y-4">
                <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Document Info & Specifications
                  </span>
                  <span className="text-[10px] text-cyan-300/80 font-mono">Editable Specifications</span>
                </div>

                {/* Document Source Selection: Google Drive vs Local Upload */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-cyan-100 flex items-center gap-1.5">
                      <span>Document Source (PDF)</span>
                      <span className="text-yellow-400">*</span>
                    </label>
                    <span className="text-[10px] text-cyan-300/80 font-mono">
                      {driveFileId ? 'Google Drive Source' : 'Local Archive'}
                    </span>
                  </div>

                  {/* Primary Option: Google Drive Selection Card with Direct Link Input */}
                  <div className="p-4 rounded-xl bg-[#030d1d] border border-cyan-800/80 space-y-3 shadow-inner">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0">
                          <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
                            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                          </svg>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>Google Drive Source</span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-yellow-400 text-[#071630] font-extrabold">
                              Cloud Source
                            </span>
                          </div>
                          <span className="text-[11px] text-cyan-200/80">
                            Paste any shared Google Drive yearbook link or file ID.
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsDrivePickerOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0b244d] hover:bg-cyan-700 text-yellow-300 hover:text-white font-bold text-xs border border-cyan-700/60 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Drive Browser</span>
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={driveLinkInput}
                        onChange={(e) => handleDriveLinkChange(e.target.value)}
                        placeholder="https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs.../view"
                        className="w-full px-3.5 py-2.5 bg-[#040e20] border border-cyan-800 rounded-xl text-xs text-white placeholder-cyan-500/50 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                      <span className="text-[10px] text-cyan-400/80 mt-1 block">
                        Example: Copy link from Google Drive (Share &gt; Copy link) and paste here.
                      </span>
                    </div>

                    {driveFileId && (
                      <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 truncate">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">
                            Google Drive Connected (File ID: <strong className="font-mono text-white">{driveFileId}</strong>)
                          </span>
                        </div>
                        <a
                          href={`https://drive.google.com/file/d/${driveFileId}/view?usp=sharing`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-yellow-300 hover:text-yellow-200 underline font-bold shrink-0 self-end sm:self-auto"
                        >
                          Verify in Google Drive ↗
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Secondary Option: Or Upload Local PDF */}
                  <div className="relative">
                    <div className="flex items-center gap-2 my-2">
                      <div className="h-px bg-cyan-900/80 flex-1"></div>
                      <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                        Or Upload / Replace via Local File
                      </span>
                      <div className="h-px bg-cyan-900/80 flex-1"></div>
                    </div>

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const droppedFile = e.dataTransfer.files?.[0];
                        if (droppedFile) {
                          processPdfFile(droppedFile);
                        }
                      }}
                      className={`relative border-2 border-dashed rounded-xl p-4 text-center transition-all bg-[#030d1d] cursor-pointer ${
                        isDragOver
                          ? 'border-yellow-400 bg-yellow-400/10 scale-[1.01]'
                          : 'border-cyan-700/80 hover:border-yellow-400'
                      }`}
                    >
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleMainFileUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center pointer-events-none">
                        <Upload className={`w-6 h-6 mb-1 transition-transform ${isDragOver ? 'text-white animate-bounce' : 'text-yellow-400'}`} />
                        <span className="text-xs font-bold text-white">
                          {fileName ? fileName : 'Browse Local PDF Document'}
                        </span>
                        <span className="text-[11px] text-cyan-300 mt-0.5">
                          {fileName
                            ? `${fileSize} • Uploaded (First page automatically synced with cover)`
                            : 'Upload local digital yearbook PDF file (up to 300MB)'}
                        </span>
                        {firstPageCoverUrl && (
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold">
                            <Check className="w-3.5 h-3.5 text-yellow-400" />
                            <span>Cover automatically synced with Page 1</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {isProcessingFile && (
                    <p className="text-[11px] text-yellow-400 animate-pulse font-medium mt-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Processing PDF document and detecting metadata...
                    </p>
                  )}
                </div>

                {/* Editable Document Specifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* File Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-200 mb-1 flex items-center gap-1">
                      <FileText className="w-3 h-3 text-cyan-400" />
                      Archival File Name
                    </label>
                    <input
                      type="text"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder="e.g. BBS_PIK_Yearbook_2024-2025.pdf"
                      className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-xs text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>

                  {/* File Size */}
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-200 mb-1 flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-cyan-400" />
                      Document File Size
                    </label>
                    <input
                      type="text"
                      value={fileSize}
                      onChange={(e) => setFileSize(e.target.value)}
                      placeholder="e.g. 48.5 MB"
                      className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-xs text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>

                  {/* Certified Page Count */}
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-200 mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-cyan-400" />
                      Certified Page Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1500}
                      value={pageCount}
                      onChange={(e) => setPageCount(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>

                  {/* Archival Date */}
                  <div>
                    <label className="block text-[11px] font-bold text-cyan-200 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      Publication / Archival Date
                    </label>
                    <input
                      type="date"
                      value={dateUploaded}
                      onChange={(e) => setDateUploaded(e.target.value)}
                      className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                    />
                  </div>
                </div>

                {/* Theme / Archival Motto */}
                <div>
                  <label className="block text-[11px] font-bold text-cyan-200 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" />
                    Document Theme / Motto
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g. Gloria Dei Vivens Homo & Global Leadership"
                    className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-xs text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Tags & Categories */}
                <div>
                  <label className="block text-[11px] font-bold text-cyan-200 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-cyan-400" />
                    Tags & Cohort Categories (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Cambridge A-Levels, Graduation, Sports, Chapel"
                    className="w-full px-3 py-2 bg-[#030d1d] border border-cyan-800 rounded-xl text-xs text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {commonTags.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addTag(t)}
                        className="px-2 py-0.5 rounded text-[10px] bg-[#071630] hover:bg-cyan-900/60 border border-cyan-800 text-cyan-200 cursor-pointer"
                      >
                        + {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Milestone Toggle */}
                <div className="flex items-center gap-2 pt-2 border-t border-cyan-950">
                  <input
                    type="checkbox"
                    id="featured-toggle"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded border-cyan-800 text-yellow-400 focus:ring-yellow-400 w-4 h-4 cursor-pointer accent-yellow-400"
                  />
                  <label htmlFor="featured-toggle" className="text-xs text-cyan-100 cursor-pointer font-medium">
                    Mark as Milestone / Special Anniversary Edition
                  </label>
                </div>
              </div>

              {/* SECTION C: Cover Artwork Customization (Editable) */}
              <div className="p-4 rounded-2xl bg-[#040e20] border border-cyan-900/80 space-y-3">
                <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Cover Artwork Customization
                  </span>
                  <span className="text-[10px] text-cyan-300 font-mono">
                    {coverSource === 'firstPage'
                      ? 'Page 1 (Default)'
                      : coverSource === 'upload'
                      ? 'Custom Upload'
                      : coverSource === 'generate'
                      ? 'BBS Hardcover'
                      : 'Image Link'}
                  </span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-[#030d1d] p-1 rounded-xl border border-cyan-900 text-xs">
                  <button
                    type="button"
                    onClick={() => setCoverSource('firstPage')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-center truncate ${
                      coverSource === 'firstPage'
                        ? 'bg-yellow-400 text-[#071630] shadow'
                        : 'text-cyan-200 hover:text-white'
                    }`}
                  >
                    Document Page 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverSource('upload')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-center truncate ${
                      coverSource === 'upload'
                        ? 'bg-yellow-400 text-[#071630] shadow'
                        : 'text-cyan-200 hover:text-white'
                    }`}
                  >
                    Upload Cover Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverSource('generate')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-center truncate ${
                      coverSource === 'generate'
                        ? 'bg-yellow-400 text-[#071630] shadow'
                        : 'text-cyan-200 hover:text-white'
                    }`}
                  >
                    BBS Hardcover
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverSource('url')}
                    className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer text-center truncate ${
                      coverSource === 'url'
                        ? 'bg-yellow-400 text-[#071630] shadow'
                        : 'text-cyan-200 hover:text-white'
                    }`}
                  >
                    Image Link
                  </button>
                </div>

                {/* Mode 1: Document Page 1 (Default) */}
                {coverSource === 'firstPage' && (
                  <div className="p-3 bg-[#030d1d] rounded-xl border border-cyan-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-yellow-400" />
                        Default Cover: First Page of Document
                      </span>
                      {firstPageCoverUrl && (
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Active</span>
                      )}
                    </div>
                    {firstPageCoverUrl ? (
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3">
                          <img
                            src={firstPageCoverUrl}
                            alt="First page thumbnail"
                            className="w-12 h-16 object-cover rounded border border-cyan-500 shadow"
                          />
                          <div className="text-xs text-cyan-200 space-y-1">
                            <p>
                              Page 1 extracted from <strong className="text-white">{fileName || 'uploaded document'}</strong>.
                            </p>
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Automatically synced with uploaded file
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCoverSource('firstPage');
                            setSuccessNotice('Cover re-synced with document Page 1.');
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-[#0b244d] hover:bg-yellow-400 hover:text-[#071630] text-yellow-300 text-[11px] font-bold border border-yellow-400/40 transition-all shrink-0 cursor-pointer shadow"
                        >
                          Re-sync Page 1
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-cyan-300/80 space-y-1">
                        <p>No document uploaded yet. Upload a PDF above to extract Page 1 automatically.</p>
                        <p className="text-[11px] text-yellow-300">
                          (In the meantime, the BBS PIK Hardcover design will be used as a fallback).
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Mode 2: Custom Image Upload */}
                {coverSource === 'upload' && (
                  <div className="p-3 bg-[#030d1d] rounded-xl border border-cyan-800/80 space-y-2">
                    <label className="block text-xs font-bold text-cyan-100">
                      Upload Custom Cover Artwork (JPG, PNG, WebP)
                    </label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleCoverUpload}
                      className="block w-full text-xs text-cyan-200 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-yellow-400 file:text-[#071630] hover:file:bg-yellow-300 cursor-pointer"
                    />
                    {firstPageCoverUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCoverSource('firstPage');
                          setSuccessNotice('Reverted to document first page cover.');
                        }}
                        className="text-[11px] text-yellow-400 hover:text-yellow-300 underline font-semibold flex items-center gap-1 cursor-pointer pt-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Revert to First Page of Document
                      </button>
                    )}
                  </div>
                )}

                {/* Mode 3: Generated BBS PIK Hardcover */}
                {coverSource === 'generate' && (
                  <div className="p-3 bg-[#030d1d] rounded-xl border border-cyan-800/80 space-y-2">
                    <span className="text-[11px] text-cyan-200 block font-medium">
                      Select BBS PIK Hardcover Palette (Dark Blue, Yellow, White & Turquoise):
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {(
                        [
                          { key: 'darkBlue', label: 'Dark Blue' },
                          { key: 'turquoise', label: 'Turquoise' },
                          { key: 'navyYellow', label: 'Navy & Gold' },
                          { key: 'midnight', label: 'Midnight' },
                          { key: 'whiteGold', label: 'White & Gold' },
                          { key: 'royal', label: 'Royal Blue' },
                        ] as const
                      ).map((c) => (
                        <button
                          key={c.key}
                          type="button"
                          onClick={() => setThemeColor(c.key)}
                          className={`px-2 py-1.5 rounded-lg text-xs capitalize text-center font-bold border cursor-pointer transition-all ${
                            themeColor === c.key
                              ? 'border-yellow-400 bg-yellow-400/20 text-yellow-300'
                              : 'border-cyan-900 bg-[#071630] text-cyan-300 hover:text-white'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode 4: Image URL */}
                {coverSource === 'url' && (
                  <div className="p-3 bg-[#030d1d] rounded-xl border border-cyan-800/80 space-y-2">
                    <label className="block text-xs font-bold text-cyan-100">
                      Direct Cover Image Web / Cloud URL
                    </label>
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={coverUrlInput}
                        onChange={(e) => setCoverUrlInput(e.target.value)}
                        placeholder="https://example.com/yearbook-cover.jpg"
                        className="w-full pl-9 pr-3 py-2 bg-[#071630] border border-cyan-800 rounded-xl text-xs text-white placeholder-cyan-200/40 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Live Cover Preview & Summary) */}
            <div className="lg:col-span-5 flex flex-col items-center justify-start bg-[#040e20] border border-cyan-900 rounded-2xl p-5 self-start">
              <div className="w-full flex items-center justify-between text-xs text-cyan-300 mb-4 border-b border-cyan-900 pb-2">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <Eye className="w-4 h-4 text-yellow-400" />
                  Live Cover Preview
                </span>
                <span className="text-[10px] text-yellow-400 uppercase font-mono font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/30">
                  {coverSource === 'firstPage'
                    ? 'Page 1'
                    : coverSource === 'upload'
                    ? 'Custom Upload'
                    : coverSource === 'generate'
                    ? 'BBS Crest'
                    : 'External URL'}
                </span>
              </div>

              {/* Cover Graphic Container */}
              <div className="relative w-52 sm:w-60 aspect-[3/4] rounded-xl shadow-2xl overflow-hidden border-2 border-cyan-500/60 ring-4 ring-cyan-950 group">
                <img
                  src={activeCoverUrl}
                  alt="Live Cover Preview"
                  className="w-full h-full object-cover"
                />

                {/* Spine Effect on Left Edge */}
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/80 via-black/20 to-transparent pointer-events-none"></div>

                {/* Academic Year Badge */}
                <div className="absolute top-3 right-3 bg-[#071630]/95 backdrop-blur-md border border-yellow-400/60 text-yellow-300 text-xs font-serif font-extrabold px-2 py-0.5 rounded shadow-lg">
                  {year || '2025'}
                </div>

                {/* Featured Badge */}
                {isFeatured && (
                  <div className="absolute top-3 left-3 bg-yellow-400 text-[#071630] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shadow">
                    Milestone
                  </div>
                )}
              </div>

              {/* Metadata Preview Summary */}
              <div className="mt-5 text-center w-full max-w-sm border-t border-cyan-900/80 pt-4 space-y-2">
                <h4 className="font-serif font-bold text-base text-white truncate">
                  {title || 'Yearbook Title Preview'}
                </h4>
                <p className="text-xs text-cyan-200/80 line-clamp-3 leading-relaxed">
                  {description || 'Summary overview will appear here.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-cyan-300 bg-[#030d1d] p-2.5 rounded-xl border border-cyan-900/80 mt-3">
                  <div className="text-left">
                    <span className="text-[10px] text-cyan-400 block font-sans">Pages:</span>
                    <strong className="text-white">{pageCount} Certified</strong>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-cyan-400 block font-sans">File Size:</span>
                    <strong className="text-white">{fileSize || '45.0 MB'}</strong>
                  </div>
                  <div className="text-left col-span-2 truncate">
                    <span className="text-[10px] text-cyan-400 block font-sans">Filename:</span>
                    <span className="text-white truncate block">{fileName || 'Auto-generated PDF'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-cyan-950 shrink-0">
            <div className="text-xs text-cyan-300/80 hidden sm:block">
              {isEditing ? `Modifying record ID: ${yearbookToEdit?.id}` : 'Creating new archival record'}
            </div>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-cyan-300 hover:text-white hover:bg-[#0b244d] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs sm:text-sm shadow-lg shadow-yellow-400/20 transition-all cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isEditing ? 'Save Changes' : 'Publish to Archive'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Google Drive File Picker Modal */}
      <GoogleDrivePickerModal
        isOpen={isDrivePickerOpen}
        onClose={() => setIsDrivePickerOpen(false)}
        onSelectDriveFile={handleSelectDriveFile}
      />
    </div>
  );
};
