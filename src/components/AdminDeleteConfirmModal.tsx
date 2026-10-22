/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Yearbook } from '../types/yearbook';

interface AdminDeleteConfirmModalProps {
  yearbook: Yearbook | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const AdminDeleteConfirmModal: React.FC<AdminDeleteConfirmModalProps> = ({
  yearbook,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !yearbook) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm Yearbook Deletion"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030d1d]/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-[#071630] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-cyan-300 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
          <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
        </div>

        <h3 className="font-serif text-lg font-bold text-white">
          Delete Yearbook Record?
        </h3>

        <p className="mt-2 text-xs text-cyan-100/90 leading-relaxed">
          Are you sure you want to permanently remove{' '}
          <strong className="text-white">"{yearbook.title}"</strong> ({yearbook.year}) from the Bina Bangsa School-Pantai Indah Kapuk public archives?
        </p>

        <div className="mt-3 p-3 rounded-xl bg-[#030d1d] border border-cyan-900 text-[11px] text-cyan-300">
          <div className="font-mono text-white">File: {yearbook.fileName}</div>
          <div className="text-rose-400/90 mt-1 font-semibold">
            Warning: This action will unpublish the volume immediately.
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-cyan-300 hover:text-white hover:bg-[#0b244d] rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(yearbook.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Yearbook</span>
          </button>
        </div>
      </div>
    </div>
  );
};
