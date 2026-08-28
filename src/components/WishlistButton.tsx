'use client';

import React from 'react';
import { Bookmark } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface WishlistButtonProps {
  plugin: { id: string; name: string; author: string; previewImage?: string; category?: string };
  onLoginRequired: () => void;
  size?: 'sm' | 'md';
}

export function WishlistButton({ plugin, onLoginRequired, size = 'sm' }: WishlistButtonProps) {
  const { user, wishlistIds, toggleWishlist } = useAuth();
  const isWishlisted = wishlistIds.has(plugin.id);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { onLoginRequired(); return; }
    await toggleWishlist(plugin);
  };

  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const btnSize = size === 'md' ? 'p-2' : 'p-1.5';

  return (
    <button
      onClick={handleClick}
      title={isWishlisted ? 'Hapus dari Wishlist' : 'Tambah ke Wishlist'}
      className={`${btnSize} rounded-lg transition-all border ${
        isWishlisted
          ? 'text-amber-400 bg-amber-500/20 border-amber-500/30 hover:bg-amber-500/30'
          : 'text-gray-400 bg-black/40 border-white/10 hover:border-amber-400/50 hover:text-amber-400 hover:bg-amber-500/10'
      }`}
    >
      <Bookmark className={`${iconSize} ${isWishlisted ? 'fill-current' : ''}`} />
    </button>
  );
}
