'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Download } from 'lucide-react';

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Deteksi apakah app sudah ter-install (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Cegah Chrome tampilin mini-infobar bawaan
      e.preventDefault();
      // Simpen event untuk dipanggil nanti saat user klik tombol kita
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsVisible(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = useCallback(async () => {
    if (!deferredPrompt) return;
    try {
      // ── PANGGIL NATIVE PROMPT BROWSER ──
      // Chrome/Edge akan nampilin dialog install native (Image 2 yang lu mau)
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {
      // diamkan jika user cancel / browser error
    } finally {
      // Prompt hanya bisa dipakai sekali, hapus setelah dipakai
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  }, [deferredPrompt]);

  // Sembunyikan kalau: app sudah ter-install ATAU browser belum fire event
  if (isInstalled || !isVisible) return null;

  const buttonClass = {
    compact: `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all ${className}`,
    outline: `flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all ${className}`,
    primary: `flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-900/30 transition-all ${className}`,
  };

  return (
    <button
      onClick={handleInstallClick}
      title="Install TheoTownHub App"
      className={buttonClass[variant]}
    >
      <Download className={variant === 'compact' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      <span>{variant === 'compact' ? 'Install App' : 'Install TheoTownHub'}</span>
    </button>
  );
}