/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowUpDown,
  RotateCcw,
  Layers,
  FileCheck,
  FileText,
  Edit3,
  Shield,
  Smartphone,
  Tablet,
  Laptop,
  Share2,
} from 'lucide-react';
import { Yearbook, SortOption, AdminUser } from '../types/yearbook';
import { downloadYearbookFile } from '../utils/pdfHelper';
import { BBSLogo } from './BBSLogo';
import { generateCoverSvgDataUrl } from '../utils/coverGenerator';
import { DeviceMode } from '../services/syncService';

interface PublicGalleryProps {
  yearbooks: Yearbook[];
  onSelectYearbook: (yearbook: Yearbook) => void;
  onEditYearbook?: (yearbook: Yearbook) => void;
  adminUser?: AdminUser | null;
  deviceMode?: DeviceMode;
  onSelectDeviceMode?: (mode: DeviceMode) => void;
  onOpenSyncModal?: () => void;
}

export const PublicGallery: React.FC<PublicGalleryProps> = ({
  yearbooks,
  onSelectYearbook,
  onEditYearbook,
  adminUser,
  deviceMode = 'auto',
  onSelectDeviceMode,
  onOpenSyncModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('year-desc');

  // Filter and sort computation
  const filteredYearbooks = useMemo(() => {
    let result = [...yearbooks];

    // Search query filter (year, title, description, tags, theme)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        return (
          item.year.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.theme && item.theme.toLowerCase().includes(q)) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    // Decade filter
    if (selectedDecade !== 'all') {
      result = result.filter((item) => {
        const yr = item.startYear;
        if (selectedDecade === '2020s') return yr >= 2020 && yr <= 2029;
        if (selectedDecade === '2010s') return yr >= 2010 && yr <= 2019;
        if (selectedDecade === '2000s') return yr >= 2000 && yr <= 2009;
        if (selectedDecade === 'older') return yr < 2000;
        return true;
      });
    }

    // Sorting (Newest first default)
    result.sort((a, b) => {
      if (sortBy === 'year-desc') {
        return b.startYear - a.startYear;
      }
      if (sortBy === 'year-asc') {
        return a.startYear - b.startYear;
      }
      if (sortBy === 'title-asc') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'pages-desc') {
        return b.pageCount - a.pageCount;
      }
      return 0;
    });

    return result;
  }, [yearbooks, searchQuery, selectedDecade, sortBy]);

  const totalPagesSum = useMemo(() => {
    return yearbooks.reduce((acc, y) => acc + (y.pageCount || 0), 0);
  }, [yearbooks]);

  return (
    <div className="space-y-10 pb-16">
      {/* Admin Logged-In Mode Banner (Confirms editable version is exclusive to admin) */}
      {adminUser && (
        <div className="rounded-2xl bg-gradient-to-r from-[#071630] via-[#092248] to-[#071630] border border-yellow-400/60 p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  Administrator Mode Active
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Direct Editing Enabled
                </span>
              </div>
              <p className="text-xs text-cyan-200/80 mt-0.5">
                Logged in as <strong className="text-white">{adminUser.email}</strong>. You can click <strong>Edit</strong> on any yearbook card or inside the reader to update cover, academic year, title, overview, and document files.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-cyan-300 bg-[#040e20] px-3 py-1.5 rounded-lg border border-cyan-800">
            Editable version is restricted to admin session
          </div>
        </div>
      )}

      {/* Hero Presentation Header with BBS PIK Palette: Dark Blue, Yellow, White & Turquoise */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1e3f] via-[#071630] to-[#040e20] border border-cyan-500/30 p-6 sm:p-10 lg:p-12 shadow-2xl">
        {/* Subtle Decorative Turquoise & Yellow Glow Backdrops */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none translate-y-1/3"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="max-w-3xl flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d2a54] border border-cyan-400/40 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Pantai Indah Kapuk Campus Archives</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Bina Bangsa School <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-cyan-300">
                Pantai Indah Kapuk
              </span>
              <span className="block text-xl sm:text-2xl font-sans font-semibold text-cyan-100 mt-2">
                Digital Yearbook Collection & Historical Records
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-cyan-100/90 leading-relaxed font-sans max-w-2xl">
              Welcome to the official public archive for Bina Bangsa School-Pantai Indah Kapuk. Explore, view in-browser, and download commemorative yearbooks honoring the scholars, leaders, artists, and athletes walking in our motto <span className="font-serif italic font-bold text-yellow-300">"Gloria Dei Vivens Homo"</span>.
            </p>

            {/* Key Stats Bar in Dark Blue, Yellow, and Turquoise */}
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-cyan-200 border-t border-cyan-900/60 pt-5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-yellow-400" />
                <span>
                  <strong className="text-white font-bold">{yearbooks.length}</strong> Volumes Preserved
                </span>
              </div>
              <div className="h-3 w-px bg-cyan-800/80 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-300" />
                <span>
                  <strong className="text-white font-bold">{totalPagesSum.toLocaleString()}</strong> Archived Pages
                </span>
              </div>
              <div className="h-3 w-px bg-cyan-800/80 hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-yellow-400" />
                <span>100% Free Public Viewing & Download</span>
              </div>
            </div>
          </div>

          {/* Large BBS Pictogram Shield Crest */}
          <div className="hidden lg:flex flex-col items-center justify-center p-4 bg-white/95 rounded-3xl shadow-2xl border-4 border-cyan-400/50 shadow-cyan-950/60 shrink-0">
            <BBSLogo size={135} />
            <span className="text-[10px] font-bold tracking-widest text-[#071630] uppercase mt-2">
              EST. 2001
            </span>
          </div>
        </div>
      </section>

      {/* Search, Filter, and Sorting Controls */}
      <section className="bg-[#071936]/90 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Live Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-cyan-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by year (e.g. 2025), edition title, or keywords (e.g. Cambridge, sports)..."
              className="w-full pl-10 pr-10 py-2.5 bg-[#030d1d] border border-cyan-800/80 rounded-xl text-sm text-white placeholder-cyan-200/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-300 hover:text-white text-xs font-semibold p-1 cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Decade Filters & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Decade Quick Pills */}
            <div className="flex items-center bg-[#030d1d] p-1 rounded-xl border border-cyan-900 text-xs">
              <span className="px-2 text-cyan-300/80 text-[11px] font-semibold hidden sm:inline flex items-center gap-1">
                <Filter className="w-3 h-3 text-yellow-400" /> Era:
              </span>
              {(['all', '2020s', '2010s'] as const).map((decade) => (
                <button
                  key={decade}
                  onClick={() => setSelectedDecade(decade)}
                  className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                    selectedDecade === decade
                      ? 'bg-yellow-400 text-[#071630] font-extrabold shadow-sm shadow-yellow-400/30'
                      : 'text-cyan-200 hover:text-white hover:bg-[#0b244d]'
                  }`}
                >
                  {decade === 'all' ? 'All Years' : decade}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex items-center bg-[#030d1d] rounded-xl border border-cyan-900 px-3 py-2 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-yellow-400 mr-2 shrink-0" />
              <label htmlFor="sort-yearbooks" className="sr-only">Sort yearbooks</label>
              <select
                id="sort-yearbooks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-cyan-100 text-xs font-semibold focus:outline-none cursor-pointer pr-4"
              >
                <option value="year-desc" className="bg-[#071630] text-white">Newest First (Default)</option>
                <option value="year-asc" className="bg-[#071630] text-white">Oldest First</option>
                <option value="title-asc" className="bg-[#071630] text-white">Title (A to Z)</option>
                <option value="pages-desc" className="bg-[#071630] text-white">Most Pages</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Summary Bar */}
        {(searchQuery || selectedDecade !== 'all') && (
          <div className="flex items-center justify-between text-xs text-cyan-200/90 border-t border-cyan-900/60 pt-3">
            <span>
              Showing <strong className="text-yellow-400">{filteredYearbooks.length}</strong> matching edition{filteredYearbooks.length === 1 ? '' : 's'}
              {searchQuery && <> for query "<span className="text-white font-semibold">{searchQuery}</span>"</>}
              {selectedDecade !== 'all' && <> in era <span className="text-white capitalize font-semibold">{selectedDecade}</span></>}
            </span>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedDecade('all');
              }}
              className="inline-flex items-center gap-1 text-yellow-400 hover:text-yellow-300 font-bold cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* Device Viewport Selector & Cross-Device Sync Status Bar */}
      <section className="bg-[#071936]/70 border border-cyan-500/25 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Device Mode & Sync:
          </span>
          <div className="flex items-center bg-[#030d1d] p-0.5 rounded-xl border border-cyan-900 text-xs">
            <button
              onClick={() => onSelectDeviceMode && onSelectDeviceMode('auto')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                deviceMode === 'auto'
                  ? 'bg-yellow-400 text-[#071630] font-extrabold shadow'
                  : 'text-cyan-200 hover:text-white'
              }`}
              title="Responsive layout adapting to browser width"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Auto</span>
            </button>
            <button
              onClick={() => onSelectDeviceMode && onSelectDeviceMode('laptop')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                deviceMode === 'laptop'
                  ? 'bg-yellow-400 text-[#071630] font-extrabold shadow'
                  : 'text-cyan-200 hover:text-white'
              }`}
              title="Wide Desktop / Laptop layout"
            >
              <Laptop className="w-3 h-3" />
              <span>Laptop</span>
            </button>
            <button
              onClick={() => onSelectDeviceMode && onSelectDeviceMode('tablet')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                deviceMode === 'tablet'
                  ? 'bg-yellow-400 text-[#071630] font-extrabold shadow'
                  : 'text-cyan-200 hover:text-white'
              }`}
              title="Medium Tablet (iPad / Android Tablet) layout"
            >
              <Tablet className="w-3 h-3" />
              <span>Tablet</span>
            </button>
            <button
              onClick={() => onSelectDeviceMode && onSelectDeviceMode('mobile')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                deviceMode === 'mobile'
                  ? 'bg-yellow-400 text-[#071630] font-extrabold shadow'
                  : 'text-cyan-200 hover:text-white'
              }`}
              title="Compact Mobile Phone layout"
            >
              <Smartphone className="w-3 h-3" />
              <span>Mobile</span>
            </button>
          </div>
        </div>

        {/* Sync Across Devices Modal Button */}
        {onOpenSyncModal && (
          <button
            onClick={onOpenSyncModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0b244d] hover:bg-cyan-700 text-yellow-300 hover:text-yellow-200 font-bold text-xs rounded-xl border border-yellow-400/50 shadow-sm transition-all cursor-pointer"
            title="Open Mobile/Tablet QR Sync & Export/Import Bundle"
          >
            <Share2 className="w-3.5 h-3.5 text-yellow-400" />
            <span>Sync Mobile / Tablet</span>
          </button>
        )}
      </section>

      {/* Device Viewport Wrapper (renders simulated container if tablet/mobile mode is forced) */}
      <div
        className={
          deviceMode === 'mobile'
            ? 'max-w-[420px] mx-auto transition-all duration-300 ring-2 ring-cyan-500/40 rounded-3xl p-3 sm:p-4 bg-[#030d1d] shadow-2xl shadow-cyan-950/80 space-y-4'
            : deviceMode === 'tablet'
            ? 'max-w-[768px] mx-auto transition-all duration-300 ring-2 ring-cyan-500/30 rounded-3xl p-4 sm:p-6 bg-[#041126] shadow-2xl shadow-cyan-950/80 space-y-6'
            : 'w-full'
        }
      >
        {deviceMode !== 'auto' && (
          <div className="flex items-center justify-between text-xs px-2 py-1 bg-[#020b18] rounded-xl border border-cyan-900 text-cyan-300 font-mono">
            <span className="flex items-center gap-1.5">
              {deviceMode === 'mobile' ? <Smartphone className="w-3.5 h-3.5 text-yellow-400" /> : <Tablet className="w-3.5 h-3.5 text-yellow-400" />}
              <span>{deviceMode === 'mobile' ? 'Mobile Viewport (390px)' : 'Tablet Viewport (768px)'}</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Auto-Synced
            </span>
          </div>
        )}

        {/* Yearbook Landscape Albums Grid */}
        {filteredYearbooks.length > 0 ? (
          <div
            className={`grid gap-6 sm:gap-8 ${
              deviceMode === 'mobile'
                ? 'grid-cols-1'
                : deviceMode === 'tablet'
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
            }`}
          >
            {filteredYearbooks.map((yearbook) => {
              const safeCoverUrl =
                yearbook.coverImageUrl?.includes('utf8,') || !yearbook.coverImageUrl
                  ? generateCoverSvgDataUrl(yearbook.year, yearbook.title, 'darkBlue')
                  : yearbook.coverImageUrl;

              return (
                <article
                  key={yearbook.id}
                  className="group bg-[#071936] rounded-2xl border border-cyan-900/80 hover:border-cyan-400/80 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/15 transition-all duration-300 flex flex-col overflow-hidden"
                >
                  {/* Landscape Hardcover Album Presentation */}
                  <div
                    onClick={() => onSelectYearbook(yearbook)}
                    className="relative aspect-[16/10] w-full bg-[#020b18] overflow-hidden cursor-pointer p-3 sm:p-4 flex items-center justify-center group-hover:bg-[#031124] transition-colors"
                  >
                    {/* 3D Landscape Hardcover Album Container */}
                    <div className="relative w-full h-full rounded-xl shadow-2xl overflow-hidden ring-1 ring-cyan-500/30 group-hover:ring-yellow-400/70 transition-all bg-[#040f22] flex items-center justify-center">
                      <img
                        src={safeCoverUrl}
                        alt={`${yearbook.year} - ${yearbook.title} Album Cover`}
                        className="w-full h-full object-cover object-center transform group-hover:scale-[1.02] transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = generateCoverSvgDataUrl(yearbook.year, yearbook.title, 'darkBlue');
                        }}
                      />

                      {/* Left Spine Binding Bar (Authentic Album Hardcover Look) */}
                      <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-5 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none flex flex-col justify-around items-center py-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/80 shadow-sm" />
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/80 shadow-sm" />
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/80 shadow-sm" />
                      </div>

                      {/* Gilded Page Edges along Right Side */}
                      <div className="absolute right-0 top-1 bottom-1 w-1.5 bg-gradient-to-l from-yellow-400/60 to-transparent rounded-r pointer-events-none" />

                      {/* Foil Sheen Highlight overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-cyan-300/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                      {/* Academic Year Plaque */}
                      <div className="absolute top-2.5 right-2.5 bg-[#071630]/95 backdrop-blur-md border border-yellow-400/80 text-yellow-300 font-serif font-extrabold text-xs px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-yellow-400" />
                        <span>{yearbook.year}</span>
                      </div>

                      {/* Landscape Album Format Badge */}
                      <div className="absolute bottom-2.5 left-6 bg-[#071630]/90 backdrop-blur-md border border-cyan-500/50 text-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-cyan-400" />
                        <span>Landscape Album</span>
                      </div>

                      {/* Milestone ribbon if applicable */}
                      {yearbook.featured && (
                        <div className="absolute top-2.5 left-6 bg-yellow-400 text-[#071630] font-extrabold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded shadow-md">
                          Milestone
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Information & Metadata Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Academic Year Header */}
                      <div className="flex items-center justify-between text-xs text-cyan-200/80 mb-1">
                        <span className="flex items-center gap-1 font-bold text-yellow-400">
                          <Calendar className="w-3.5 h-3.5" />
                          Academic Year {yearbook.year}
                        </span>
                        <span className="font-mono text-[11px] text-cyan-300/90 font-semibold">
                          {yearbook.pageCount} certified pages
                        </span>
                      </div>

                      {/* Title */}
                      <h3
                        onClick={() => onSelectYearbook(yearbook)}
                        className="font-serif text-lg sm:text-xl font-bold text-white hover:text-yellow-400 transition-colors cursor-pointer line-clamp-1"
                        title={yearbook.title}
                      >
                        {yearbook.title}
                      </h3>

                      {/* UPLOADED FILE SPECIFICATIONS & CERTIFICATION BADGE (Prominently displayed right under title for instant visibility on mobile & tablet) */}
                      <div className="mt-2.5 p-2.5 rounded-xl bg-[#040e20] border border-cyan-900/80 text-[11px] text-cyan-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono gap-1">
                          <span className="flex items-center gap-1.5 text-yellow-300 font-bold truncate">
                            <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate" title={yearbook.fileName || `${yearbook.title}.pdf`}>
                              {yearbook.fileName || `${yearbook.title}.pdf`}
                            </span>
                          </span>
                          <span className="text-cyan-300 font-bold shrink-0">
                            {yearbook.fileSize || 'Archived'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-cyan-300/75 pt-1 border-t border-cyan-950">
                          <span>Updated {new Date(yearbook.dateUploaded).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                          {yearbook.driveFileId ? (
                            <span className="text-cyan-300 font-bold flex items-center gap-1">
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
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Certified PDF
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Action Buttons: Open Album and Download (Immediately visible without scrolling on mobile) */}
                    <div className="pt-2 border-t border-cyan-950/80 flex items-center gap-2">
                      <button
                        onClick={() => onSelectYearbook(yearbook)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-yellow-400/15 border border-yellow-300 transition-all cursor-pointer group-hover:scale-[1.01]"
                      >
                        <BookOpen className="w-4 h-4 stroke-[2.4]" />
                        <span>Open Album</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadYearbookFile(yearbook);
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#0b244d] hover:bg-[#0f2f63] text-cyan-200 hover:text-white font-bold text-xs rounded-xl border border-cyan-600/50 transition-all cursor-pointer"
                        title={`Download full PDF archive (${yearbook.fileSize})`}
                      >
                        <Download className="w-3.5 h-3.5 text-yellow-400" />
                        <span>PDF</span>
                      </button>

                      {adminUser && onEditYearbook && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditYearbook(yearbook);
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-cyan-950 hover:bg-yellow-400 hover:text-[#071630] text-yellow-300 font-bold text-xs rounded-xl border border-yellow-400/60 shadow-sm transition-all cursor-pointer"
                          title="Edit details (Admin Mode)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>

                    {/* Short Description & Tags (Cleanly clamped at bottom of card) */}
                    <div className="pt-1">
                      <p className="text-xs text-cyan-100/75 line-clamp-2 leading-relaxed">
                        {yearbook.description}
                      </p>

                      {yearbook.tags && yearbook.tags.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {yearbook.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0d2a54] text-cyan-300 border border-cyan-600/40"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
        /* Empty Search Result State */
        <div className="text-center py-16 px-4 bg-[#071936]/80 rounded-3xl border border-dashed border-cyan-900">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="font-serif text-xl font-bold text-white mb-2">No Yearbooks Found</h3>
          <p className="text-sm text-cyan-200/80 max-w-md mx-auto mb-6">
            We couldn't find any historical volumes matching "{searchQuery}". Try searching for another year (e.g. "2024" or "2025") or clear your search filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedDecade('all');
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-[#071630] font-extrabold text-xs shadow-md shadow-yellow-400/25 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Search Filters</span>
          </button>
        </div>
      )}
      </div>
    </div>
  );
};
