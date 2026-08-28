'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface WishlistButtonProps {
  plugin: { id: string; name: string; author: string };
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
      className={`${btnSize} rounded-lg transition-all ${
        isWishlisted
          ? 'text-red-400 bg-red-500/20 hover:bg-red-500/30'
          : 'text-gray-500 bg-white/5 hover:bg-white/10 hover:text-red-400'
      }`}
    >
      <Heart className={`${iconSize} ${isWishlisted ? 'fill-current' : ''}`} />
    </button>
  );
}
