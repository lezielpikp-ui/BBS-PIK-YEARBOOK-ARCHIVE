/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Calendar,
  FileText,
  Tag,
  BookOpen,
  Share2,
  Check,
  Home,
  Edit3,
} from 'lucide-react';
import { Yearbook, AdminUser } from '../types/yearbook';
import { downloadYearbookFile } from '../utils/pdfHelper';
import { BBSLogo } from './BBSLogo';
import { PdfPageViewer } from './PdfPageViewer';

interface YearbookViewerModalProps {
  yearbook: Yearbook | null;
  onClose: () => void;
  onEdit?: (yearbook: Yearbook) => void;
  adminUser?: AdminUser | null;
}

export const YearbookViewerModal: React.FC<YearbookViewerModalProps> = ({
  yearbook,
  onClose,
  onEdit,
  adminUser,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState<'reader' | 'pdf'>('reader');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Keyboard navigation for closing modal
  useEffect(() => {
    if (!yearbook) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [yearbook, onClose]);

  if (!yearbook) return null;

  const pages = yearbook.samplePages && yearbook.samplePages.length > 0
    ? yearbook.samplePages
    : [
        {
          pageNumber: 1,
          section: 'Cover & Title',
          title: yearbook.title,
          content: `${yearbook.year} Official Yearbook Archive. Bina Bangsa School-Pantai Indah Kapuk. ${yearbook.description}`,
        },
        {
          pageNumber: 2,
          section: 'Archival Summary',
          title: 'Preserved Historical Edition',
          content: `This yearbook contains ${yearbook.pageCount} pages of student profiles, Cambridge examination honors, athletics, musical performances, and PIK campus milestones.`,
        },
        {
          pageNumber: 3,
          section: 'Table of Contents',
          title: 'Sections & Highlights',
          content: 'Section 1: Leadership & Pastoral Address\nSection 2: Senior Class Directory\nSection 3: Cambridge & Academic Honors\nSection 4: Athletics & Cultural Shows\nSection 5: Autographs & Graduation',
        },
      ];

  const totalPagesCount = pages.length;
  const currentPage = pages[currentPageIndex] || pages[0];

  const handleNextPage = () => {
    if (currentPageIndex < totalPagesCount - 1) {
      setCurrentPageIndex((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Yearbook: ${yearbook.title}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#030d1d]/85 backdrop-blur-md overflow-hidden"
    >
      <div
        className={`relative w-full max-w-[98vw] xl:max-w-[96vw] bg-[#071630] border border-cyan-500/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'fixed inset-0 max-w-none rounded-none z-50' : 'h-[92vh] max-h-[95vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-cyan-950 bg-[#040e20]">
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
            <div className="w-9 h-9 p-0.5 rounded-lg bg-white border border-cyan-400/50 flex items-center justify-center shrink-0 shadow-sm">
              <BBSLogo size={28} />
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-yellow-400/15 border border-yellow-400/50 text-yellow-300 font-serif font-extrabold text-xs sm:text-sm whitespace-nowrap">
              {yearbook.year}
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                <span>{yearbook.title}</span>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/50 hidden md:inline-block">
                  Landscape Album
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-cyan-200/80 truncate">
                <span className="hidden sm:inline">BBS PIK • </span>
                <span className="text-yellow-300 font-semibold">{yearbook.fileSize}</span>
                <span> • {yearbook.pageCount} Pages</span>
                {yearbook.fileName && (
                  <span className="hidden md:inline text-cyan-400 font-mono"> • {yearbook.fileName}</span>
                )}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Mode Toggle: Interactive Reader vs Embedded PDF */}
            <div className="hidden sm:flex bg-[#030d1d] p-0.5 rounded-lg border border-cyan-900 text-xs">
              <button
                onClick={() => setActiveTab('reader')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'reader'
                    ? 'bg-yellow-400 text-[#071630]'
                    : 'text-cyan-200 hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Album Reader</span>
              </button>
              <button
                onClick={() => setActiveTab('pdf')}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                  activeTab === 'pdf'
                    ? 'bg-cyan-400 text-[#071630]'
                    : 'text-cyan-200 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Raw PDF</span>
              </button>
            </div>

            {/* Toggle Album Details Sidebar */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                showSidebar
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400'
                  : 'bg-[#0b244d] text-cyan-300 border-cyan-700 hover:text-white'
              }`}
              title="Toggle Album Details & Chapters Sidebar"
            >
              <Tag className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden md:inline">Details</span>
            </button>

            {/* Download Button */}
            <button
              onClick={() => downloadYearbookFile(yearbook)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs sm:text-sm rounded-lg shadow-sm shadow-yellow-400/20 transition-all cursor-pointer"
              title="Download original yearbook PDF file"
            >
              <Download className="w-4 h-4 stroke-[2.4]" />
              <span className="hidden xs:inline">PDF</span>
              <span className="text-[10px] opacity-80 font-normal">({yearbook.fileSize})</span>
            </button>

            {/* Share Link */}
            <button
              onClick={handleShare}
              className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
              title="Copy share link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer hidden sm:block"
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Edit Details Button - ONLY available in Admin Log In Mode */}
            {adminUser && onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(yearbook);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0b244d] hover:bg-yellow-400 hover:text-[#071630] text-yellow-300 font-bold text-xs rounded-lg border border-yellow-400/50 transition-colors cursor-pointer"
                title="Edit cover, academic year, title, overview and document info (Admin Mode)"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Details</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}

            {/* Return to Main Page Button */}
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0b244d] hover:bg-cyan-700 text-white font-bold text-xs rounded-lg border border-cyan-500/40 hover:border-yellow-400 transition-colors cursor-pointer ml-1"
              title="Return to Main Page (Esc)"
            >
              <Home className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden sm:inline">Return to Main Page</span>
              <span className="sm:hidden">Main Page</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-cyan-300 hover:text-rose-400 hover:bg-[#0b244d] rounded-lg transition-colors cursor-pointer"
              title="Close Viewer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Main Viewer Canvas: Renders all pages of uploaded PDF or generated document */}
          <div className="flex-1 bg-[#030d1d] flex flex-col overflow-hidden relative">
            {activeTab === 'reader' ? (
              <PdfPageViewer
                yearbook={yearbook}
                initialPage={currentPageIndex + 1}
                onPageChange={(page) => setCurrentPageIndex(page - 1)}
              />
            ) : (
              /* Raw PDF / Embedded View Mode */
              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                {yearbook.fileUrl && yearbook.fileUrl.startsWith('data:application/pdf') ? (
                  <iframe
                    src={yearbook.fileUrl}
                    title={yearbook.title}
                    className="w-full h-full rounded-lg border border-cyan-900"
                  />
                ) : (
                  <div className="max-w-md text-center p-8 bg-[#071630] border border-cyan-800 rounded-2xl shadow-xl">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-white mb-2">
                      Full Historical Volume ({yearbook.pageCount} Pages)
                    </h3>
                    <p className="text-xs text-cyan-200/80 mb-6 leading-relaxed">
                      Official Bina Bangsa School-Pantai Indah Kapuk archival publication: <strong className="text-white">{yearbook.fileName}</strong> ({yearbook.fileSize}).
                    </p>
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={() => setActiveTab('reader')}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#0b244d] hover:bg-cyan-700 text-white font-bold rounded-xl border border-cyan-500/40 transition-all cursor-pointer"
                      >
                        <BookOpen className="w-4 h-4 text-yellow-400" />
                        <span>Open in Page Reader</span>
                      </button>
                      <button
                        onClick={() => downloadYearbookFile(yearbook)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold rounded-xl shadow-lg shadow-yellow-400/20 transition-all cursor-pointer"
                      >
                        <Download className="w-5 h-5" />
                        <span>Download Certified PDF ({yearbook.fileSize})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar: Metadata and Chapter Browser (Toggleable) */}
          {showSidebar && (
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-cyan-950 bg-[#071630] p-5 overflow-y-auto space-y-5 shrink-0 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                    BBS PIK Archival Record
                  </span>
                  <h3 className="font-serif text-lg font-bold text-white mt-0.5">
                    {yearbook.title}
                  </h3>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="text-cyan-400 hover:text-white text-xs cursor-pointer md:hidden"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-cyan-100/80 leading-relaxed">
                {yearbook.description}
              </p>

              {/* Quick Spec List */}
              <div className="space-y-2 text-xs border-y border-cyan-950 py-3">
                <div className="flex items-center justify-between text-cyan-200">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-yellow-400" />
                    Academic Year
                  </span>
                  <span className="text-white font-bold">{yearbook.year}</span>
                </div>
                <div className="flex items-center justify-between text-cyan-200">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                    Page Count
                  </span>
                  <span className="text-white font-bold">{yearbook.pageCount} Pages</span>
                </div>
                <div className="flex items-center justify-between text-cyan-200">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    File Size
                  </span>
                  <span className="text-white font-bold">{yearbook.fileSize}</span>
                </div>
                <div className="flex items-center justify-between text-cyan-200">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-yellow-400" />
                    Format
                  </span>
                  <span className="text-yellow-400 font-mono font-bold">Landscape Album</span>
                </div>
              </div>

              {/* Section Index / Jump List */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block mb-2">
                  Table of Contents & Highlights
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {pages.map((p, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentPageIndex(index);
                        setActiveTab('reader');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        currentPageIndex === index && activeTab === 'reader'
                          ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/50 font-bold'
                          : 'text-cyan-200 hover:text-white hover:bg-[#0b244d]'
                      }`}
                    >
                      <span className="truncate pr-2">{p.title}</span>
                      <span className="text-[10px] opacity-80 font-mono shrink-0">p.{p.pageNumber || index + 1}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom download reminder */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={() => downloadYearbookFile(yearbook)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#0b244d] hover:bg-cyan-700 text-white border border-cyan-500/40 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-yellow-400" />
                  <span>Save Offline Copy (.PDF)</span>
                </button>

                {/* Edit Shortcut - ONLY visible in Admin Log In Mode */}
                {adminUser && onEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(yearbook);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-yellow-400/15 hover:bg-yellow-400 text-yellow-300 hover:text-[#071630] border border-yellow-400/40 text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Record, Cover & Document</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
