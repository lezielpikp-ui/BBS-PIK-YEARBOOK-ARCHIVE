/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as pdfjsLib from 'pdfjs-dist';
// Vite native URL import for worker script
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { YearbookSamplePage } from '../types/yearbook';

// Polyfills for PDF.js compatibility across Vercel & modern browsers
if (typeof (Promise as any).withResolvers !== 'function') {
  (Promise as any).withResolvers = function () {
    let resolve: any, reject: any;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function (fn: (...args: unknown[]) => unknown, ...args: unknown[]) {
    return new Promise((resolve) => resolve(fn(...args)));
  };
}
if (!(Uint8Array.prototype as any).toHex) {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this, (byte: number) => byte.toString(16).padStart(2, '0')).join('');
  };
}

if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker || '/pdf.worker.min.mjs';
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
  }
}

export interface ExtractedPdfData {
  firstPageImageDataUrl: string;
  pageCount: number;
  suggestedTitle?: string;
  samplePages?: YearbookSamplePage[];
}

/**
 * Loads a PDFDocumentProxy from various input sources with full buffer protection and fallback
 */
export async function loadPdfDocument(
  source: Uint8Array | ArrayBuffer | Blob | string
): Promise<pdfjsLib.PDFDocumentProxy> {
  if (source instanceof Blob) {
    try {
      const arrayBuffer = await source.arrayBuffer();
      // Safe clone to prevent detachment
      const cleanCopy = new Uint8Array(arrayBuffer.slice(0));
      return await pdfjsLib.getDocument({ data: cleanCopy }).promise;
    } catch (err) {
      console.warn('Direct Blob ArrayBuffer parse notice, falling back to Blob URL:', err);
      const blobUrl = URL.createObjectURL(source);
      return await pdfjsLib.getDocument({ url: blobUrl }).promise;
    }
  }

  if (typeof source === 'string') {
    if (source.startsWith('data:')) {
      const response = await fetch(source);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const cleanCopy = new Uint8Array(arrayBuffer.slice(0));
      return await pdfjsLib.getDocument({ data: cleanCopy }).promise;
    }
    return await pdfjsLib.getDocument({ url: source }).promise;
  }

  // Uint8Array or ArrayBuffer: ALWAYS create a pristine slice
  const uint8Data = source instanceof Uint8Array
    ? source.slice(0)
    : new Uint8Array(source.slice(0));

  try {
    return await pdfjsLib.getDocument({ data: uint8Data }).promise;
  } catch (dataErr) {
    console.warn('Direct buffer load issue, attempting Blob URL wrapper:', dataErr);
    const blob = new Blob([uint8Data], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    return await pdfjsLib.getDocument({ url: blobUrl }).promise;
  }
}

/**
 * Renders a specific page of a loaded PDF document to an HTML Canvas element.
 */
export async function renderPdfPageToCanvas(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.5
): Promise<{ width: number; height: number }> {
  const safePageNumber = Math.max(1, Math.min(pageNumber, pdf.numPages));
  const page = await pdf.getPage(safePageNumber);
  const viewport = page.getViewport({ scale });

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // Clear before rendering
  context.clearRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  } as unknown as Parameters<typeof page.render>[0]).promise;

  return { width: viewport.width, height: viewport.height };
}

/**
 * Renders the first page of a PDF ArrayBuffer or Uint8Array onto a canvas
 * and returns it as a JPEG data URL, along with the PDF's total page count
 * and extracted preview pages for the reader.
 */
export async function extractFirstPageAndMetadata(
  data: ArrayBuffer | Uint8Array
): Promise<ExtractedPdfData> {
  // CRITICAL: Clone buffer so Web Worker transfer never detaches the original data
  const uint8Data = data instanceof Uint8Array ? data.slice(0) : new Uint8Array(data.slice(0));

  let pdf: pdfjsLib.PDFDocumentProxy;
  try {
    const loadingTask = pdfjsLib.getDocument({ data: uint8Data });
    pdf = await loadingTask.promise;
  } catch (err) {
    console.warn('Direct data extraction notice, attempting Blob fallback:', err);
    const blob = new Blob([uint8Data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const loadingTask = pdfjsLib.getDocument({ url });
    pdf = await loadingTask.promise;
  }
  const pageCount = pdf.numPages || 1;

  // Retrieve page 1 for cover
  const page1 = await pdf.getPage(1);
  const viewport1 = page1.getViewport({ scale: 1.5 });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  canvas.width = Math.floor(viewport1.width);
  canvas.height = Math.floor(viewport1.height);

  await page1.render({
    canvasContext: context,
    viewport: viewport1,
    canvas: canvas,
  } as unknown as Parameters<typeof page1.render>[0]).promise;

  const firstPageImageDataUrl = canvas.toDataURL('image/jpeg', 0.88);

  // Try text extraction on Page 1 for title
  let suggestedTitle: string | undefined;
  try {
    const textContent = await page1.getTextContent();
    const strings = textContent.items
      .map((item) => ('str' in item ? (item.str as string) : ''))
      .filter((s) => s.trim().length > 0);

    if (strings.length > 0) {
      const candidate = strings.find(
        (s) => s.length > 3 && !/^\d+$/.test(s) && !/copyright/i.test(s)
      );
      if (candidate) {
        suggestedTitle = candidate.slice(0, 60);
      }
    }
  } catch {
    // Ignore text extraction error
  }

  // Extract preview sample pages for initial reader display (up to 8 pages)
  const samplePages: YearbookSamplePage[] = [];
  try {
    const pagesToExtract = Math.min(pageCount, 8);
    for (let p = 1; p <= pagesToExtract; p++) {
      const pageItem = await pdf.getPage(p);
      const vp = pageItem.getViewport({ scale: 1.0 });
      const pCanvas = document.createElement('canvas');
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        pCanvas.width = Math.floor(vp.width);
        pCanvas.height = Math.floor(vp.height);
        await pageItem.render({
          canvasContext: pCtx,
          viewport: vp,
          canvas: pCanvas,
        } as unknown as Parameters<typeof pageItem.render>[0]).promise;

        const photoUrl = pCanvas.toDataURL('image/jpeg', 0.82);

        // Try extracting text summary for page
        let pageExcerpt = '';
        try {
          const txt = await pageItem.getTextContent();
          pageExcerpt = txt.items
            .map((item) => ('str' in item ? (item.str as string) : ''))
            .filter((s) => s.trim().length > 0)
            .join(' ')
            .slice(0, 200);
        } catch {
          // Ignore
        }

        samplePages.push({
          pageNumber: p,
          section: p === 1 ? 'Cover & Prologue' : `Uploaded Document - Page ${p}`,
          title: p === 1 ? (suggestedTitle || 'Cover Page') : `Document Section ${p}`,
          content: pageExcerpt || `Uploaded archival document page ${p} of ${pageCount}.`,
          photoUrl: photoUrl,
        });
      }
    }
  } catch (err) {
    console.warn('Sample page extraction notice:', err);
  }

  return {
    firstPageImageDataUrl,
    pageCount,
    suggestedTitle,
    samplePages: samplePages.length > 0 ? samplePages : undefined,
  };
}
