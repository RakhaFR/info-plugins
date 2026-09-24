'use client';

import React, { useEffect, useState } from 'react';
import { Download, X, Share, Plus, Monitor, Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPwaButtonProps {
  className?: string;
  variant?: 'primary' | 'outline' | 'compact';
}

export function InstallPwaButton({ className = '', variant = 'primary' }: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  // Detect platform for modal instructions
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !(window.navigator as unknown as { standalone?: boolean }).standalone;

  if (isInstalled) return null;

  const buttonClass = {
    compact: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all ${className}`,
    outline: `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all ${className}`,
    primary: `flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-900/30 transition-all ${className}`,
  };

  return (
    <>
      <button onClick={handleInstallClick} title="Install TheoTownHub App" className={buttonClass[variant]}>
        <Download className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        <span>{variant === 'compact' ? 'Install App' : 'Install TheoTownHub'}</span>
      </button>

      {/* Custom PWA Install Modal */}
      {showModal && <PwaInstallModal isIOS={isIOS} hasNativePrompt={!!deferredPrompt} onClose={() => setShowModal(false)} />}
    </>
  );
}

function PwaInstallModal({ isIOS, hasNativePrompt, onClose }: { isIOS: boolean; hasNativePrompt: boolean; onClose: () => void }) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const steps = isIOS
    ? [
        { icon: <Share className="w-5 h-5" />, title: 'Tap Tombol Share', desc: 'Di Safari, tekan ikon Share (kotak dengan panah ke atas) di bar bawah.' },
        { icon: <Plus className="w-5 h-5" />, title: 'Pilih Add to Home Screen', desc: 'Scroll ke bawah di menu Share dan pilih "Add to Home Screen".' },
        { icon: <Check className="w-5 h-5" />, title: 'Konfirmasi', desc: 'Tekan "Add" untuk menambahkan TheoTownHub ke layar utama iPhone/iPad kamu.' },
      ]
    : [
        { icon: <Smartphone className="w-5 h-5" />, title: 'Android Chrome', desc: 'Buka menu titik tiga (⋮) di kanan atas → pilih "Add to Home screen" atau "Install app".' },
        { icon: <Monitor className="w-5 h-5" />, title: 'Desktop Chrome/Edge', desc: 'Klik ikon install (⊕) di address bar kanan, atau menu titik tiga → Install TheoTownHub.' },
        { icon: <Check className="w-5 h-5" />, title: 'Selesai', desc: 'TheoTownHub akan muncul sebagai aplikasi mandiri di Home Screen / Desktop kamu.' },
      ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fade-in_0.2s_ease]" onClick={onClose}>
      <div className="relative w-full max-w-md bg-[#0b0d12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/[0.06] bg-gradient-to-br from-emerald-600/15 via-teal-600/10 to-transparent">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-white">Install TheoTownHub</h2>
              <p className="text-[11px] text-gray-400">Pasang sebagai aplikasi — akses lebih cepat & notifikasi update.</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!hasNativePrompt && (
            <div className="px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>Browser kamu belum memicu prompt instalasi otomatis. Ikuti panduan manual di bawah:</span>
            </div>
          )}

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#13161e] border border-white/[0.06]">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono font-bold text-gray-300">
                      {idx + 1}
                    </span>
                    <h3 className="font-display font-semibold text-xs text-white">{step.title}</h3>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] bg-[#08090c] flex items-center justify-center">
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-300 transition-colors font-medium">
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}