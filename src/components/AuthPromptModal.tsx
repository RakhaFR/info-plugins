'use client';

import React from 'react';
import { Bookmark, X, ArrowRight, Copy, Check } from 'lucide-react';

interface AuthPromptModalProps {
  onClose: () => void;
  onOpenAuth: () => void;
}

export function AuthPromptModal({ onClose, onOpenAuth }: AuthPromptModalProps) {
  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-sm bg-[#13161e] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4 text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Bookmark className="w-6 h-6 fill-current" />
        </div>

        <div className="space-y-1">
          <h3 className="font-display font-bold text-lg text-white">
            Simpan & Salin Plugin Favoritmu
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed px-2">
            Buat akun atau masuk untuk menggunakan fitur <strong className="text-amber-400 font-semibold">Wishlist</strong>. Salin judul plugin secara bulk/sekaligus untuk di-paste langsung di dalam game TheoTown!
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenAuth();
            }}
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
          >
            Masuk / Buat Akun <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-[11px] font-medium text-gray-500 hover:text-gray-300 transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
}
