/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { PublicGallery } from './components/PublicGallery';
import { AdminPortal } from './components/AdminPortal';
import { YearbookViewerModal } from './components/YearbookViewerModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { AdminYearbookModal } from './components/AdminYearbookModal';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { Yearbook, AdminUser } from './types/yearbook';
import {
  getAllYearbooks,
  saveYearbook,
  deleteYearbook,
  resetYearbooks,
} from './services/yearbookStorage';
import {
  getActiveAdminSession,
  logoutAdmin,
} from './services/authService';
import { subscribeToSync, broadcastSync, DeviceMode } from './services/syncService';
import { CheckCircle2, Info, Shield } from 'lucide-react';
import { BBSLogo } from './components/BBSLogo';

export default function App() {
  const [yearbooks, setYearbooks] = useState<Yearbook[]>(() => getAllYearbooks());
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => getActiveAdminSession());
  const [currentView, setCurrentView] = useState<'gallery' | 'admin'>('gallery');
  const [selectedYearbook, setSelectedYearbook] = useState<Yearbook | null>(null);
  const [yearbookToEdit, setYearbookToEdit] = useState<Yearbook | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('auto');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const handleOpenEdit = (yearbook: Yearbook) => {
    if (!adminUser) {
      showToast('Administrator login required to edit yearbook archives.', 'info');
      return;
    }
    setYearbookToEdit(yearbook);
    setIsEditModalOpen(true);
  };

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  // Sync state with storage and auth changes
  useEffect(() => {
    const handleYearbooksUpdated = () => {
      setYearbooks(getAllYearbooks());
    };

    const handleAuthChanged = (e: CustomEvent<{ user: AdminUser | null }>) => {
      setAdminUser(e.detail.user);
      broadcastSync('AUTH_CHANGED');
    };

    const unsubscribeSync = subscribeToSync((event) => {
      if (event.type === 'YEARBOOKS_UPDATED') {
        setYearbooks(getAllYearbooks());
      } else if (event.type === 'AUTH_CHANGED') {
        setAdminUser(getActiveAdminSession());
      } else if (event.type === 'DEVICE_MODE_CHANGED' && event.deviceMode) {
        setDeviceMode(event.deviceMode);
      }
    });

    window.addEventListener('yearbooks_updated', handleYearbooksUpdated);
    window.addEventListener('storage', handleYearbooksUpdated);
    window.addEventListener('admin_auth_changed', handleAuthChanged as EventListener);

    return () => {
      unsubscribeSync();
      window.removeEventListener('yearbooks_updated', handleYearbooksUpdated);
      window.removeEventListener('storage', handleYearbooksUpdated);
      window.removeEventListener('admin_auth_changed', handleAuthChanged as EventListener);
    };
  }, []);

  const handleSelectDeviceMode = (mode: DeviceMode) => {
    setDeviceMode(mode);
    broadcastSync('DEVICE_MODE_CHANGED', { deviceMode: mode });
  };

  // Save/Upload action
  const handleSaveYearbook = (data: Yearbook) => {
    const updated = saveYearbook(data);
    setYearbooks(updated);
    showToast(`Yearbook "${data.title}" (${data.year}) saved and published successfully.`);
  };

  // Delete action
  const handleDeleteYearbook = (id: string) => {
    const updated = deleteYearbook(id);
    setYearbooks(updated);
    showToast('Yearbook record successfully removed from the archives.', 'info');
  };

  // Reset defaults action
  const handleResetDefaults = () => {
    const reset = resetYearbooks();
    setYearbooks(reset);
    showToast('Archive reset to official BBS PIK sample collection.', 'info');
  };

  // Logout action
  const handleLogout = () => {
    logoutAdmin();
    setAdminUser(null);
    setIsEditModalOpen(false);
    setYearbookToEdit(null);
    showToast('Admin session logged out successfully.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#040e20] text-slate-100 flex flex-col font-sans selection:bg-yellow-400 selection:text-[#071630]">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#071630] border border-cyan-400 text-white shadow-2xl text-xs sm:text-sm animate-fade-in backdrop-blur-md">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Global Navigation Bar */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        adminUser={adminUser}
        onLogout={handleLogout}
        onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {currentView === 'gallery' ? (
          <PublicGallery
            yearbooks={yearbooks}
            onSelectYearbook={(yb) => setSelectedYearbook(yb)}
            onEditYearbook={adminUser ? handleOpenEdit : undefined}
            adminUser={adminUser}
            deviceMode={deviceMode}
            onSelectDeviceMode={handleSelectDeviceMode}
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
          />
        ) : (
          <AdminPortal
            adminUser={adminUser}
            setAdminUser={setAdminUser}
            yearbooks={yearbooks}
            onSaveYearbook={handleSaveYearbook}
            onDeleteYearbook={handleDeleteYearbook}
            onResetYearbooks={handleResetDefaults}
            onPreviewYearbook={(yb) => setSelectedYearbook(yb)}
            onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
            onReturnToGallery={() => setCurrentView('gallery')}
          />
        )}
      </main>

      {/* Modal: In-browser Yearbook Reader / Preview */}
      <YearbookViewerModal
        yearbook={selectedYearbook}
        onClose={() => setSelectedYearbook(null)}
        onEdit={adminUser ? handleOpenEdit : undefined}
        adminUser={adminUser}
      />

      {/* Global Edit / Upload Modal - Only accessible when in Admin Login Mode */}
      {adminUser && (
        <AdminYearbookModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setYearbookToEdit(null);
          }}
          onSave={(data) => {
            handleSaveYearbook(data);
            setIsEditModalOpen(false);
            setYearbookToEdit(null);
            if (selectedYearbook && selectedYearbook.id === data.id) {
              setSelectedYearbook(data);
            }
          }}
          yearbookToEdit={yearbookToEdit}
          adminUser={adminUser}
        />
      )}

      {/* Modal: Setup & Deployment Instructions */}
      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />

      {/* Modal: Multi-Device Sync & QR Code Transfer */}
      <DeviceSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        yearbooks={yearbooks}
        deviceMode={deviceMode}
        onSelectDeviceMode={handleSelectDeviceMode}
      />

      {/* Footer in BBS PIK Palette: Dark Blue, Yellow, White & Turquoise */}
      <footer className="border-t border-cyan-950/80 bg-[#030a17] py-10 text-xs text-cyan-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 p-0.5 bg-white rounded-xl flex items-center justify-center border-2 border-cyan-400/50 shadow-md shrink-0">
              <BBSLogo size={34} />
            </div>
            <div>
              <p className="font-serif font-bold text-white text-sm">
                Bina Bangsa School-Pantai Indah Kapuk
              </p>
              <p className="text-[11px] text-cyan-200/80">
                Official Digital Yearbook Gallery & Historical Records • <span className="text-yellow-300 font-serif italic">Gloria Dei Vivens Homo</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setIsSetupGuideOpen(true)}
              className="text-yellow-400 hover:text-yellow-300 font-bold cursor-pointer transition-colors"
            >
              Setup & Admin Guide
            </button>
            <span className="text-cyan-900">•</span>
            {adminUser ? (
              <span className="text-cyan-300 flex items-center gap-1 font-mono font-bold">
                <Shield className="w-3 h-3 text-yellow-400" /> Authorized Admin
              </span>
            ) : (
              <button
                onClick={() => setCurrentView('admin')}
                className="text-cyan-200/80 hover:text-white cursor-pointer transition-colors font-medium"
              >
                Admin Area (Restricted)
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
