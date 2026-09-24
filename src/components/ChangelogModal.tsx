'use client';

import React, { useEffect } from 'react';
import { X, Sparkles, Wrench, Bug, Plus, ChevronRight } from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangelogEntry {
  type: 'added' | 'fixed' | 'improved';
  text: string;
}

interface ChangelogVersion {
  version: string;
  date: string;
  highlights: ChangelogEntry[];
}

const changelog: ChangelogVersion[] = [
  {
    version: 'v1.2',
    date: 'Update Terkini',
    highlights: [
      { type: 'fixed', text: 'Tombol Install PWA tidak pernah muncul — penyebab: icon manifest pakai .jpg (Chrome wajib PNG)' },
      { type: 'fixed', text: 'Service Worker intercept request manifest.json sehingga Chrome gagal baca manifest' },
      { type: 'fixed', text: 'Layout rusak saat klik Install karena modal custom menumpuk di atas hero section 3D' },
      { type: 'fixed', text: 'themeColor di viewport tidak match dengan manifest (perbedaan warna)' },
      { type: 'improved', text: 'Tombol Install langsung trigger native browser prompt (dialog bawaan Chrome/Edge), tanpa modal panduan manual' },
      { type: 'improved', text: 'Icon PWA di-generate ulang ke PNG 192x192, 512x512, dan 512x512 maskable dengan safe zone 10%' },
      { type: 'improved', text: 'Manifest ditambah field id, scope, orientation, dan categories untuk validasi PWA Chrome' },
      { type: 'added', text: 'Tombol Install hanya muncul setelah beforeinstallprompt ter-fire (hidden sampai browser siap)' },
    ],
  },
  {
    version: 'v1.1',
    date: 'Update Sebelumnya',
    highlights: [
      { type: 'added', text: 'Tombol Update Log di navbar untuk melihat changelog' },
      { type: 'added', text: 'Custom modal panduan instalasi PWA untuk iOS Safari & browser yang belum support beforeinstallprompt' },
      { type: 'improved', text: 'Optimasi performa landing page (LCP, CLS, TBT mobile)' },
      { type: 'fixed', text: 'Bug React error #310 (useLayoutEffect di SSR) pada DriftWall' },
    ],
  },
  {
    version: 'v1.0',
    date: 'Rilis Perdana',
    highlights: [
      { type: 'added', text: 'Katalog 4.900+ plugin TheoTown lengkap dengan pencarian & filter' },
      { type: 'added', text: 'Wishlist Saya dengan folder 3D custom & export nama plugin ke game' },
      { type: 'added', text: 'Login via Google / Email dengan Firebase Auth' },
      { type: 'added', text: 'DriftWall Hero animasi 3D dari preview plugin resmi' },
      { type: 'added', text: 'PWA support — install TheoTownHub sebagai aplikasi standalone' },
      { type: 'added', text: 'FAQ, Text Marquee kategori, statistik real-time dari forum' },
    ],
  },
];

const typeStyles: Record<ChangelogEntry['type'], { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  added: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: <Sparkles className="w-3 h-3" />,
    label: 'Baru',
  },
  fixed: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: <Wrench className="w-3 h-3" />,
    label: 'Fix',
  },
  improved: {
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: <Plus className="w-3 h-3" />,
    label: 'Improve',
  },
};

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  // Lock body scroll when modal open
  useEffect(() => {
    if (isOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fade-in_0.2s_ease]"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[85vh] bg-[#0b0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-gradient-to-r from-red-600/10 via-amber-500/10 to-red-600/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">Update Log</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">TheoTownHub Changelog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {changelog.map((v, idx) => (
            <div key={v.version} className="space-y-3">
              {/* Version header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                    idx === 0
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10'
                  }`}>
                    {v.version}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">{v.date}</span>
                </div>
                {idx === 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 uppercase tracking-wider">
                    Latest
                  </span>
                )}
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Entries */}
              <ul className="space-y-2">
                {v.highlights.map((entry, eIdx) => {
                  const style = typeStyles[entry.type];
                  return (
                    <li
                      key={eIdx}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${style.bg} border ${style.border} transition-all hover:translate-x-0.5`}
                    >
                      <div className={`mt-0.5 ${style.color}`}>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                      <span className="flex-1 text-xs sm:text-sm text-gray-300 leading-relaxed">
                        {entry.text}
                      </span>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold ${style.color} ${style.bg} border ${style.border} flex items-center gap-1`}>
                        {style.icon}
                        {style.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-[#08090c] flex items-center justify-between text-[10px] text-gray-500">
          <span className="font-mono">TheoTownHub © 2026</span>
          <span className="flex items-center gap-1">
            <Bug className="w-3 h-3" /> Found a bug? Hubungi admin komunitas.
          </span>
        </div>
      </div>
    </div>
  );
}