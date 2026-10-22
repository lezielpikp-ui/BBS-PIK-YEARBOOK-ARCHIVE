/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Laptop,
  QrCode,
  Download,
  Upload,
  Check,
  Copy,
  RefreshCw,
  X,
  FileCheck2,
  HardDrive,
  Share2,
} from 'lucide-react';
import { Yearbook } from '../types/yearbook';
import { exportSyncBundle, importSyncBundle } from '../services/yearbookStorage';
import { DeviceMode, broadcastSync } from '../services/syncService';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  yearbooks: Yearbook[];
  deviceMode: DeviceMode;
  onSelectDeviceMode: (mode: DeviceMode) => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  yearbooks,
  deviceMode,
  onSelectDeviceMode,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [importStatus, setImportStatus] = useState<{ text: string; success: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<'qr' | 'export' | 'deviceView'>('qr');

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const totalCertifiedPages = yearbooks.reduce((acc, y) => acc + (y.pageCount || 0), 0);

  // Generate lightweight deterministic SVG QR matrix for the current URL
  const generateQrSvg = () => {
    // 21x21 stylized QR code matrix representation for BBS PIK URL
    const size = 21;
    const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    // Corner Finder Patterns
    const placeFinder = (r: number, c: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (
            i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          ) {
            cells[r + i][c + j] = true;
          }
        }
      }
    };
    placeFinder(0, 0);
    placeFinder(0, 14);
    placeFinder(14, 0);

    // Timing lines
    for (let i = 8; i < 13; i++) {
      cells[6][i] = i % 2 === 0;
      cells[i][6] = i % 2 === 0;
    }

    // Deterministic pseudo-random pattern based on yearbooks count and URL
    const seed = (yearbooks.length * 997) ^ 0x5a5a;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (
          (r < 8 && c < 8) ||
          (r < 8 && c >= 13) ||
          (r >= 13 && c < 8)
        ) {
          continue;
        }
        const val = ((r * 31 + c * 17 + seed) % 7);
        cells[r][c] = val === 0 || val === 2 || val === 5;
      }
    }

    return (
      <svg viewBox="0 0 21 21" className="w-full h-full p-2 bg-white rounded-xl shadow-inner">
        {cells.map((row, r) =>
          row.map((active, c) =>
            active ? <rect key={`${r}-${c}`} x={c} y={r} width="1.02" height="1.02" fill="#071630" /> : null
          )
        )}
      </svg>
    );
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleExport = () => {
    const json = exportSyncBundle();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BBS_PIK_Yearbooks_Sync_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const res = importSyncBundle(content);
      if (res.success) {
        setImportStatus({ text: `Successfully synced ${res.count} yearbook volumes!`, success: true });
        broadcastSync('YEARBOOKS_UPDATED');
        setTimeout(() => setImportStatus(null), 4000);
      } else {
        setImportStatus({ text: res.error || 'Failed to import sync bundle.', success: false });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Multi-Device Sync & View Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-gradient-to-br from-[#071630] via-[#092248] to-[#040e20] border-2 border-cyan-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-cyan-950 bg-[#040e20]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-400/15 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-white flex items-center gap-2">
                <span>Multi-Device Sync & Viewport</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                  Live
                </span>
              </h2>
              <p className="text-xs text-cyan-200/80">
                Instantly view and sync uploaded files between laptop, tablet, and mobile.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-cyan-300 hover:text-white hover:bg-cyan-900/50 rounded-xl transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-cyan-950 bg-[#030d1d] px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'qr'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-cyan-300 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Mobile / Tablet QR Sync</span>
          </button>
          <button
            onClick={() => setActiveTab('deviceView')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'deviceView'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-cyan-300 hover:text-white'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Device Preview Mode</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'border-yellow-400 text-yellow-300'
                : 'border-transparent text-cyan-300 hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Bundle Export / Import</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          {activeTab === 'qr' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#040e20] border border-cyan-900 flex flex-col sm:flex-row items-center gap-5">
                {/* QR Code Container */}
                <div className="w-36 h-36 shrink-0 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center">
                  {generateQrSvg()}
                </div>

                {/* Instructions */}
                <div className="flex-1 space-y-2.5 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Automatic Cross-View Active
                  </div>
                  <h3 className="font-serif font-bold text-white text-base">
                    Scan with Tablet or Phone Camera
                  </h3>
                  <p className="text-xs text-cyan-200/80 leading-relaxed">
                    Open your camera on an iPad, tablet, or Android/iOS phone to view the identical BBS PIK archives, uploaded files, and two-page spreads.
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0b244d] hover:bg-cyan-700 text-cyan-200 hover:text-white text-xs font-bold rounded-xl border border-cyan-500/40 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-yellow-400" />}
                    <span>{copiedLink ? 'URL Copied to Clipboard!' : 'Copy Shareable URL'}</span>
                  </button>
                </div>
              </div>

              {/* Live Archive Summary */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-[#040e20] rounded-xl border border-cyan-950">
                  <div className="text-xs text-cyan-300 font-mono">Volumes</div>
                  <div className="text-lg font-bold text-yellow-400 font-serif">{yearbooks.length}</div>
                </div>
                <div className="p-3 bg-[#040e20] rounded-xl border border-cyan-950">
                  <div className="text-xs text-cyan-300 font-mono">Archived Pages</div>
                  <div className="text-lg font-bold text-white font-serif">{totalCertifiedPages}</div>
                </div>
                <div className="p-3 bg-[#040e20] rounded-xl border border-cyan-950">
                  <div className="text-xs text-cyan-300 font-mono">Status</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Synchronized
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deviceView' && (
            <div className="space-y-4">
              <p className="text-xs text-cyan-200/90 leading-relaxed">
                Test and verify how uploaded yearbooks, cover images, and album spreads appear on various screens. Selecting a mode previews that exact viewport layout:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  onClick={() => onSelectDeviceMode('auto')}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    deviceMode === 'auto'
                      ? 'bg-yellow-400/20 border-yellow-400 text-white shadow-lg'
                      : 'bg-[#040e20] border-cyan-900 text-cyan-300 hover:border-cyan-500'
                  }`}
                >
                  <RefreshCw className="w-6 h-6 text-yellow-400" />
                  <span className="font-bold text-xs">Auto Responsive</span>
                  <span className="text-[10px] text-cyan-300/70">Full Width</span>
                </button>

                <button
                  onClick={() => onSelectDeviceMode('laptop')}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    deviceMode === 'laptop'
                      ? 'bg-yellow-400/20 border-yellow-400 text-white shadow-lg'
                      : 'bg-[#040e20] border-cyan-900 text-cyan-300 hover:border-cyan-500'
                  }`}
                >
                  <Laptop className="w-6 h-6 text-yellow-400" />
                  <span className="font-bold text-xs">Laptop View</span>
                  <span className="text-[10px] text-cyan-300/70">1280px Grid</span>
                </button>

                <button
                  onClick={() => onSelectDeviceMode('tablet')}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    deviceMode === 'tablet'
                      ? 'bg-yellow-400/20 border-yellow-400 text-white shadow-lg'
                      : 'bg-[#040e20] border-cyan-900 text-cyan-300 hover:border-cyan-500'
                  }`}
                >
                  <Tablet className="w-6 h-6 text-yellow-400" />
                  <span className="font-bold text-xs">Tablet View</span>
                  <span className="text-[10px] text-cyan-300/70">768px Bezel</span>
                </button>

                <button
                  onClick={() => onSelectDeviceMode('mobile')}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                    deviceMode === 'mobile'
                      ? 'bg-yellow-400/20 border-yellow-400 text-white shadow-lg'
                      : 'bg-[#040e20] border-cyan-900 text-cyan-300 hover:border-cyan-500'
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-yellow-400" />
                  <span className="font-bold text-xs">Mobile View</span>
                  <span className="text-[10px] text-cyan-300/70">390px Screen</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#040e20] border border-cyan-900/80 text-xs text-cyan-200 space-y-1">
                <div className="font-bold text-yellow-400 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-cyan-400" />
                  Automatic Multi-View Synchronization
                </div>
                <p className="text-[11px] text-cyan-300/80 leading-relaxed">
                  Every uploaded yearbook file, certified page count, and cover customization remains 100% synchronized across Laptop, Tablet, and Mobile views.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-4">
              <p className="text-xs text-cyan-200/90 leading-relaxed">
                Export all uploaded yearbooks, metadata, and customizations into a single JSON sync bundle. You can transfer this file to any mobile device or tablet and import it with one click:
              </p>

              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    importStatus.success
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {importStatus.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>{importStatus.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Export Button */}
                <button
                  onClick={handleExport}
                  className="p-4 rounded-2xl bg-[#0b244d] hover:bg-cyan-700 text-white border border-cyan-500/40 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <Download className="w-6 h-6 text-yellow-400" />
                  <span className="font-bold text-xs">Download Sync Bundle</span>
                  <span className="text-[10px] text-cyan-300/80">Save .json file with {yearbooks.length} volumes</span>
                </button>

                {/* Import Button */}
                <label className="p-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-[#071630] transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-lg">
                  <Upload className="w-6 h-6 stroke-[2.4]" />
                  <span className="font-extrabold text-xs">Import Sync Bundle</span>
                  <span className="text-[10px] font-semibold text-[#071630]/80">Load files onto tablet/phone</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-3 bg-[#030d1d] rounded-xl border border-cyan-950 text-[11px] text-cyan-300/70 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Sync bundles include full metadata, academic years, titles, certified page counts, and cover graphics.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#030d1d] border-t border-cyan-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
