/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  BookOpen,
  FileText,
  Download,
  Layers,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { Yearbook } from '../types/yearbook';
import { loadPdfDocument, renderPdfPageToCanvas } from '../utils/pdfExtractor';
import { getYearbookPdf } from '../services/pdfStorage';
import { generateYearbookPdfBlob, downloadYearbookFile } from '../utils/pdfHelper';

interface PdfPageReaderProps {
  yearbook: Yearbook;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  isFullscreen: boolean;
  setIsFullscreen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const PdfPageReader: React.FC<PdfPageReaderProps> = ({
  yearbook,
  zoomLevel,
  setZoomLevel,
  isFullscreen,
  setIsFullscreen,
}) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState<number>(yearbook.pageCount || 1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'spread' | 'single'>('spread');
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(true);
  const [isRenderingPage, setIsRenderingPage] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [thumbnailUrls, setThumbnailUrls] = useState<Map<number, string>>(new Map());

  // Canvases for rendering
  const singleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const leftCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingPdf(true);
    setLoadError(null);
    setPdfDoc(null);
    setCurrentPage(1);

    async function initPdf() {
      try {
        let pdfSource: Blob | string | null = null;

        // 1. Check in-memory / direct fileUrl
        if (yearbook.fileUrl && (yearbook.fileUrl.startsWith('data:') || yearbook.fileUrl.startsWith('blob:'))) {
          pdfSource = yearbook.fileUrl;
        }

        // 2. Check IndexedDB storage if not found in fileUrl
        if (!pdfSource) {
          const storedPdf = await getYearbookPdf(yearbook.id);
          if (storedPdf) {
            pdfSource = storedPdf;
          }
        }

        // 3. If still no uploaded binary, fallback to generated valid PDF
        if (!pdfSource) {
          pdfSource = generateYearbookPdfBlob(yearbook);
        }

        const loadedDoc = await loadPdfDocument(pdfSource);
        if (!isCancelled) {
          setPdfDoc(loadedDoc);
          setTotalPages(loadedDoc.numPages || yearbook.pageCount || 1);
          setIsLoadingPdf(false);
        }
      } catch (err) {
        console.warn('Could not load PDF document for reader:', err);
        if (!isCancelled) {
          setLoadError('Interactive PDF document stream unavailable. Displaying archival page views.');
          setIsLoadingPdf(false);
        }
      }
    }

    initPdf();

    return () => {
      isCancelled = true;
    };
  }, [yearbook.id, yearbook.fileUrl, yearbook.pageCount]);

  // Render active pages on canvas whenever currentPage, viewMode, zoomLevel or pdfDoc changes
  const renderCurrentPages = useCallback(async () => {
    if (!pdfDoc) return;
    setIsRenderingPage(true);

    const scale = (zoomLevel / 100) * 1.6;

    try {
      if (viewMode === 'single') {
        if (singleCanvasRef.current) {
          await renderPdfPageToCanvas(pdfDoc, currentPage, singleCanvasRef.current, scale);
        }
      } else {
        // Spread view (Two-page open book)
        // If currentPage is 1 (Cover), render left as cover or blank spine, right as cover
        if (currentPage === 1) {
          if (rightCanvasRef.current) {
            await renderPdfPageToCanvas(pdfDoc, 1, rightCanvasRef.current, scale);
          }
        } else {
          // Normal interior spread: Left is even page, right is odd page
          const leftPageNum = currentPage % 2 === 0 ? currentPage : currentPage - 1;
          const rightPageNum = leftPageNum + 1;

          if (leftCanvasRef.current && leftPageNum <= pdfDoc.numPages) {
            await renderPdfPageToCanvas(pdfDoc, leftPageNum, leftCanvasRef.current, scale);
          }
          if (rightCanvasRef.current && rightPageNum <= pdfDoc.numPages) {
            await renderPdfPageToCanvas(pdfDoc, rightPageNum, rightCanvasRef.current, scale);
          }
        }
      }
    } catch (err) {
      console.warn('PDF canvas rendering error:', err);
    } finally {
      setIsRenderingPage(false);
    }
  }, [pdfDoc, currentPage, viewMode, zoomLevel]);

  useEffect(() => {
    renderCurrentPages();
  }, [renderCurrentPages]);

  // Generate lightweight thumbnails for quick navigation filmstrip
  useEffect(() => {
    if (!pdfDoc || !showThumbnails) return;

    let isMounted = true;
    async function generateThumbs() {
      const thumbs = new Map<number, string>();
      const count = Math.min(pdfDoc?.numPages || 1, 30); // Up to 30 pages
      for (let p = 1; p <= count; p++) {
        if (!isMounted) break;
        try {
          const page = await pdfDoc!.getPage(p);
          const vp = page.getViewport({ scale: 0.25 });
          const c = document.createElement('canvas');
          c.width = vp.width;
          c.height = vp.height;
          const ctx = c.getContext('2d');
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport: vp, canvas: c } as unknown as Parameters<typeof page.render>[0]).promise;
            thumbs.set(p, c.toDataURL('image/jpeg', 0.6));
          }
        } catch {
          // Ignore
        }
      }
      if (isMounted) {
        setThumbnailUrls(thumbs);
      }
    }

    generateThumbs();
    return () => {
      isMounted = false;
    };
  }, [pdfDoc, showThumbnails]);

  // Page Navigation Handlers
  const handlePrevPage = () => {
    if (viewMode === 'spread') {
      if (currentPage <= 2) {
        setCurrentPage(1);
      } else {
        setCurrentPage((prev) => Math.max(1, prev - 2));
      }
    } else {
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  };

  const handleNextPage = () => {
    if (viewMode === 'spread') {
      if (currentPage === 1) {
        setCurrentPage(2);
      } else {
        setCurrentPage((prev) => Math.min(totalPages, prev + 2));
      }
    } else {
      setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    }
  };

  const handleGoToPage = (target: number) => {
    const clamped = Math.max(1, Math.min(totalPages, target));
    setCurrentPage(clamped);
  };

  // Compute displayed page numbers in spread view
  const leftPageNumber = currentPage === 1 ? null : (currentPage % 2 === 0 ? currentPage : currentPage - 1);
  const rightPageNumber = currentPage === 1 ? 1 : (leftPageNumber ? leftPageNumber + 1 : currentPage);

  return (
    <div className="flex-1 w-full flex flex-col items-center justify-between overflow-hidden relative select-none">
      {/* Top Status & Controls Ribbon */}
      <div className="w-full flex items-center justify-between px-3 py-1.5 bg-[#040e20]/90 border-b border-cyan-900/60 text-xs text-cyan-200">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-yellow-300 font-semibold font-mono text-[11px]">
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Uploaded Document Page Reader</span>
          </span>
          <span className="text-[11px] text-cyan-300/80 truncate hidden sm:inline">
            {yearbook.fileName || `${yearbook.title}.pdf`} ({totalPages} certified pages)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Spread vs Single Toggle */}
          <div className="flex items-center bg-[#030d1d] p-0.5 rounded-lg border border-cyan-800 text-[11px] font-medium">
            <button
              onClick={() => setViewMode('spread')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                viewMode === 'spread' ? 'bg-cyan-600 text-white font-bold' : 'text-cyan-300 hover:text-white'
              }`}
              title="Two-Page Book Spread"
            >
              Spread View
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                viewMode === 'single' ? 'bg-cyan-600 text-white font-bold' : 'text-cyan-300 hover:text-white'
              }`}
              title="Single Page Reader"
            >
              Single Page
            </button>
          </div>

          {/* Toggle Thumbnails */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`px-2 py-0.5 rounded-md border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors ${
              showThumbnails
                ? 'bg-yellow-400 text-[#071630] border-yellow-400 font-bold'
                : 'bg-[#030d1d] text-cyan-200 border-cyan-800 hover:border-cyan-400'
            }`}
            title="Browse Page Thumbnails Filmstrip"
          >
            <Layers className="w-3 h-3" />
            <span className="hidden md:inline">Thumbnails</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Page Viewer Area */}
      <div className="flex-1 w-full flex items-center justify-center p-2 sm:p-4 overflow-auto relative">
        {isLoadingPdf && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl bg-[#040e20] border border-cyan-800 shadow-2xl">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-spin" />
            <p className="text-sm font-bold text-white">Rendering Uploaded Document Pages...</p>
            <p className="text-xs text-cyan-300/80">Reading high-resolution archival vector pages</p>
          </div>
        )}

        {loadError && !isLoadingPdf && (
          <div className="max-w-md p-6 rounded-2xl bg-[#040e20] border border-amber-500/50 text-center space-y-3">
            <FileText className="w-10 h-10 text-yellow-400 mx-auto" />
            <h4 className="text-white font-bold text-sm">Archival Reader</h4>
            <p className="text-xs text-cyan-200/90 leading-relaxed">{loadError}</p>
            <button
              onClick={() => downloadYearbookFile(yearbook)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 text-[#071630] font-bold text-xs rounded-xl shadow cursor-pointer hover:bg-yellow-300"
            >
              <Download className="w-3.5 h-3.5" />
              Download Complete Document ({yearbook.fileSize})
            </button>
          </div>
        )}

        {/* Real PDF Canvas Container */}
        {!isLoadingPdf && !loadError && (
          <div
            className="flex items-center justify-center transition-transform duration-150"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
            }}
          >
            {viewMode === 'single' ? (
              /* Single Page Mode */
              <div className="relative bg-white rounded-lg shadow-2xl border-4 border-cyan-950 overflow-hidden flex flex-col items-center max-h-[72vh]">
                <canvas ref={singleCanvasRef} className="max-h-[68vh] w-auto h-auto object-contain block" />
                <div className="w-full bg-[#040e20] text-cyan-300 px-3 py-1 text-[10px] font-mono flex items-center justify-between border-t border-cyan-900">
                  <span>Page {currentPage} of {totalPages}</span>
                  <span className="text-yellow-400 font-bold uppercase tracking-wider">BBS PIK Official Document</span>
                </div>
              </div>
            ) : (
              /* Spread Mode (Two-Page Open Book) */
              <div className="relative bg-[#020b18] rounded-xl shadow-2xl border-4 border-cyan-900/80 p-1 flex items-center justify-center gap-1 max-h-[72vh] overflow-hidden">
                {currentPage === 1 ? (
                  /* Front Cover View */
                  <div className="flex flex-col md:flex-row items-center gap-2 max-h-[68vh]">
                    {/* Left side: Archival Embossment Spine */}
                    <div className="hidden md:flex flex-col items-center justify-between w-64 h-[520px] bg-gradient-to-r from-[#030d1d] via-[#071936] to-[#041024] border-r-2 border-yellow-400/30 p-6 text-center rounded-l-lg shadow-inner">
                      <div className="w-12 h-12 rounded-full border border-yellow-400/50 flex items-center justify-center bg-yellow-400/10">
                        <BookOpen className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div className="space-y-2">
                        <span className="text-yellow-400 font-serif font-extrabold text-sm block">
                          BINA BANGSA SCHOOL
                        </span>
                        <span className="text-cyan-200 text-xs tracking-widest uppercase block font-mono">
                          Pantai Indah Kapuk
                        </span>
                        <span className="text-cyan-400 text-xs italic block">
                          "Gloria Dei Vivens Homo"
                        </span>
                        <div className="pt-3 border-t border-cyan-800/80 text-[11px] text-cyan-300">
                          {yearbook.year} Official Archival Edition
                        </div>
                      </div>
                      <div className="text-[10px] text-cyan-400/80 font-mono">
                        Page 1 of {totalPages}
                      </div>
                    </div>

                    {/* Right side: Rendered Cover Page 1 from Uploaded PDF */}
                    <div className="bg-white rounded-r-lg shadow-2xl overflow-hidden flex flex-col items-center">
                      <canvas ref={rightCanvasRef} className="max-h-[66vh] w-auto h-auto object-contain block" />
                      <div className="w-full bg-[#040e20] text-cyan-300 px-3 py-1 text-[10px] font-mono flex items-center justify-between border-t border-cyan-900">
                        <span className="text-yellow-400 font-bold">Document Front Cover (Page 1)</span>
                        <span>{yearbook.fileName || 'Yearbook.pdf'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Interior Two-Page Spread */
                  <div className="flex flex-col md:flex-row items-center gap-1.5 max-h-[68vh]">
                    {/* Left Page */}
                    {leftPageNumber && leftPageNumber <= totalPages && (
                      <div className="bg-white rounded-l-lg shadow-2xl overflow-hidden flex flex-col items-center border-r border-slate-200">
                        <canvas ref={leftCanvasRef} className="max-h-[66vh] w-auto h-auto object-contain block" />
                        <div className="w-full bg-[#040e20] text-cyan-300 px-3 py-1 text-[10px] font-mono flex items-center justify-between border-t border-cyan-900">
                          <span>Page {leftPageNumber}</span>
                          <span className="text-cyan-400/80">BBS PIK Archive</span>
                        </div>
                      </div>
                    )}

                    {/* Right Page */}
                    {rightPageNumber && rightPageNumber <= totalPages && (
                      <div className="bg-white rounded-r-lg shadow-2xl overflow-hidden flex flex-col items-center">
                        <canvas ref={rightCanvasRef} className="max-h-[66vh] w-auto h-auto object-contain block" />
                        <div className="w-full bg-[#040e20] text-cyan-300 px-3 py-1 text-[10px] font-mono flex items-center justify-between border-t border-cyan-900">
                          <span className="text-cyan-400/80">BBS PIK Archive</span>
                          <span>Page {rightPageNumber} of {totalPages}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Rendering Overlay */}
        {isRenderingPage && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-[#071630]/90 border border-yellow-400/60 text-yellow-300 text-[10px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
            <span>Rendering Page...</span>
          </div>
        )}
      </div>

      {/* Thumbnails Filmstrip Drawer */}
      {showThumbnails && !isLoadingPdf && (
        <div className="w-full max-h-28 bg-[#020914] border-t border-cyan-900/80 p-2 overflow-x-auto flex items-center gap-2">
          {Array.from({ length: totalPages }).map((_, idx) => {
            const pageNum = idx + 1;
            const thumbUrl = thumbnailUrls.get(pageNum);
            const isSelected = viewMode === 'spread'
              ? (currentPage === 1 ? pageNum === 1 : (pageNum === leftPageNumber || pageNum === rightPageNumber))
              : currentPage === pageNum;

            return (
              <button
                key={pageNum}
                onClick={() => handleGoToPage(pageNum)}
                className={`flex flex-col items-center gap-0.5 shrink-0 p-1 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-yellow-400 bg-yellow-400/20 scale-105'
                    : 'border-cyan-900 bg-[#071630] hover:border-cyan-400 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="w-12 h-16 bg-white rounded overflow-hidden flex items-center justify-center border border-slate-300">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={`Thumbnail Page ${pageNum}`} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-600 font-mono font-bold">{pageNum}</span>
                  )}
                </div>
                <span className={`text-[10px] font-mono ${isSelected ? 'text-yellow-300 font-bold' : 'text-cyan-300'}`}>
                  p. {pageNum}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Bottom Navigation & Zoom Toolbar */}
      <div className="w-full max-w-3xl my-2 px-4 py-2 bg-[#071630] border border-cyan-800 rounded-xl flex items-center justify-between gap-2 sm:gap-4 text-xs text-cyan-200 shadow-xl">
        {/* Previous Button */}
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1 || isLoadingPdf}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0b244d] hover:bg-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-colors cursor-pointer"
          title="Previous Page (ArrowLeft)"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden xs:inline">Prev</span>
        </button>

        {/* Page Indicator & Direct Jump Slider */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs whitespace-nowrap">
            {viewMode === 'spread' && currentPage > 1 ? (
              <>
                Pages <strong className="text-yellow-400">{leftPageNumber}–{Math.min(totalPages, Number(rightPageNumber))}</strong> of {totalPages}
              </>
            ) : (
              <>
                Page <strong className="text-yellow-400">{currentPage}</strong> of {totalPages}
              </>
            )}
          </span>

          <input
            type="range"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => handleGoToPage(parseInt(e.target.value, 10))}
            className="w-20 sm:w-32 accent-yellow-400 cursor-pointer hidden sm:block"
          />
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 text-cyan-300">
          <button
            onClick={() => setZoomLevel((z) => Math.max(z - 10, 60))}
            className="p-1 hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] w-9 text-center text-white">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(z + 10, 160))}
            className="p-1 hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1 hover:text-white cursor-pointer text-[10px] font-mono text-cyan-400"
            title="Reset Zoom to 100%"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages || isLoadingPdf}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0b244d] hover:bg-cyan-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold transition-colors cursor-pointer"
          title="Next Page (ArrowRight)"
        >
          <span className="hidden xs:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
