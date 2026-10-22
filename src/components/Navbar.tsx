/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, ShieldCheck, Lock, LogOut, HelpCircle, Home, Share2 } from 'lucide-react';
import { AdminUser } from '../types/yearbook';
import { BBSLogo } from './BBSLogo';

interface NavbarProps {
  currentView: 'gallery' | 'admin';
  setCurrentView: (view: 'gallery' | 'admin') => void;
  adminUser: AdminUser | null;
  onLogout: () => void;
  onOpenSetupGuide: () => void;
  onOpenSyncModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  adminUser,
  onLogout,
  onOpenSetupGuide,
  onOpenSyncModal,
}) => {

  const handleReturnToMain = () => {
    setCurrentView('gallery');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cyan-950/70 bg-[#071630]/95 backdrop-blur-md shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & School Branding - clicking returns to main page */}
          <button
            onClick={handleReturnToMain}
            className="flex items-center gap-3.5 text-left group transition-all cursor-pointer"
            title="Return to Main Page"
          >
            {/* Official BBS Pictogram Logo uploaded by user */}
            <div className="w-13 h-13 p-1 bg-white rounded-2xl shadow-md shadow-cyan-950/40 flex items-center justify-center border-2 border-cyan-400/40 group-hover:border-yellow-400 transition-all shrink-0">
              <BBSLogo size={44} />
            </div>

            {/* School Name & Campus descriptor */}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm sm:text-lg lg:text-xl tracking-tight text-white group-hover:text-yellow-400 transition-colors">
                  <span className="hidden sm:inline">Bina Bangsa School-Pantai Indah Kapuk</span>
                  <span className="sm:hidden">BBS Pantai Indah Kapuk</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-[#0a2347] text-cyan-300 border border-cyan-400/40 hidden md:inline-block">
                  BBS PIK
                </span>
              </div>
              <p className="text-xs text-cyan-200/80 hidden xs:block font-sans">
                Official Digital Yearbook Gallery & Archives • <span className="italic text-yellow-300/90 font-serif">Gloria Dei Vivens Homo</span>
              </p>
            </div>
          </button>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Primary Main Page / Return to Main Page Button */}
            {currentView === 'admin' ? (
              <button
                onClick={handleReturnToMain}
                className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-extrabold text-[#071630] bg-yellow-400 hover:bg-yellow-300 rounded-xl shadow-lg shadow-yellow-400/20 border border-yellow-300 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                title="Return to Main Page (Public Yearbook Gallery)"
              >
                <Home className="w-4 h-4 shrink-0 stroke-[2.5]" />
                <span className="hidden xs:inline">Return to Main Page</span>
                <span className="xs:hidden">Main Page</span>
              </button>
            ) : (
              <button
                onClick={handleReturnToMain}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-bold text-white bg-[#0a244b] hover:bg-[#0e2f5c] border border-cyan-400/40 hover:border-yellow-400 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Main Page (Public Yearbook Gallery)"
              >
                <Home className="w-4 h-4 text-yellow-400 shrink-0" />
                <span className="hidden xs:inline">Main Page</span>
              </button>
            )}

            {/* Sync Mobile/Tablet Devices Button */}
            {onOpenSyncModal && (
              <button
                onClick={onOpenSyncModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-yellow-300 hover:text-yellow-200 bg-[#0a2347] hover:bg-[#0e2f5c] border border-yellow-400/50 hover:border-yellow-400 rounded-xl transition-all cursor-pointer shadow-sm"
                title="Sync and view archives across Laptop, Tablet, and Mobile"
              >
                <Share2 className="w-3.5 h-3.5 text-yellow-400" />
                <span className="hidden sm:inline">Sync Devices</span>
                <span className="sm:hidden">Sync</span>
              </button>
            )}

            {/* Setup & Deployment Guide Button */}
            <button
              onClick={onOpenSetupGuide}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-cyan-100 hover:text-white bg-[#0b244d] hover:bg-[#0f2e63] border border-cyan-500/30 rounded-xl transition-colors cursor-pointer"
              title="View Setup & Deployment Instructions"
            >
              <HelpCircle className="w-4 h-4 text-cyan-300" />
              <span className="hidden md:inline">Setup Guide</span>
            </button>

            {/* Admin Access Button / Profile Indicator */}
            {adminUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-[#0a244b] border border-yellow-400/40 rounded-lg px-2 sm:px-2.5 py-1">
                <button
                  onClick={() => setCurrentView('admin')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-yellow-300 hover:text-yellow-200 transition-colors cursor-pointer"
                  title="Open Admin Dashboard"
                >
                  <ShieldCheck className="w-4 h-4 text-yellow-400" />
                  <span className="inline">Admin Dashboard</span>
                </button>
                <div className="h-4 w-px bg-yellow-400/30 mx-0.5 sm:mx-1"></div>
                <button
                  onClick={onLogout}
                  className="text-cyan-200 hover:text-rose-400 p-1 transition-colors cursor-pointer"
                  title="Sign out of Admin Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCurrentView('admin')}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-yellow-400 text-[#071630] font-extrabold shadow-md shadow-yellow-400/25'
                    : 'bg-[#0a2347] hover:bg-[#0e2f5c] text-white border border-cyan-500/40 hover:border-cyan-400'
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-yellow-400" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
