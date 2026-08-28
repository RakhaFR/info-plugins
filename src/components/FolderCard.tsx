'use client';

import React from 'react';
import { Folder, Trash2, Layers } from 'lucide-react';
import type { WishlistItem } from '@/lib/wishlist';

interface FolderCardProps {
  id: string;
  name: string;
  items: WishlistItem[];
  onClick: () => void;
  onDelete?: () => void;
  isDefault?: boolean;
}

export function FolderCard({ id, name, items, onClick, onDelete, isDefault }: FolderCardProps) {
  // Get top 3 preview images
  const previewImages = items
    .filter((item) => item.previewImage)
    .map((item) => item.previewImage!)
    .slice(0, 3);

  // Downloaded count vs total
  const downloadedCount = items.filter((i) => i.downloaded).length;

  return (
    <div
      onClick={onClick}
      className="group relative bg-[#13161e] hover:bg-[#1a1e28] border border-white/[0.08] hover:border-amber-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-amber-500/5 select-none"
    >
      {/* Delete folder button (non-default) */}
      {!isDefault && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Hapus Folder"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all z-20"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Top Floating Preview Images Stack */}
      <div className="relative h-28 w-full flex items-center justify-center mb-4 pt-2">
        {previewImages.length === 0 ? (
          <div className="w-20 h-20 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-center text-amber-500/40 group-hover:scale-105 transition-transform">
            <Layers className="w-8 h-8" />
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            {previewImages.map((imgUrl, idx) => {
              // Calculate stacked floating offsets
              const count = previewImages.length;
              let offsetClass = '';
              let zIndex = 10 - idx;
              let scale = 1;
              let rotate = 0;

              if (count === 1) {
                rotate = 0;
                scale = 1;
              } else if (count === 2) {
                rotate = idx === 0 ? -6 : 6;
                scale = idx === 0 ? 0.95 : 1;
              } else {
                if (idx === 0) { rotate = -10; scale = 0.9; }
                if (idx === 1) { rotate = 10; scale = 0.95; }
                if (idx === 2) { rotate = 0; scale = 1; }
              }

              return (
                <div
                  key={idx}
                  style={{
                    zIndex,
                    transform: `rotate(${rotate}deg) scale(${scale}) translateY(${idx * 2}px)`,
                  }}
                  className="absolute w-24 sm:w-28 aspect-[16/10] rounded-xl overflow-hidden border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.6)] bg-[#0b0d12] transition-transform group-hover:translate-y-[-4px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Folder Tab Visual Base (File Manager look) */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
            <Folder className="w-4 h-4 fill-current" />
          </div>
          <div className="min-w-0">
            <h4 className="font-display font-bold text-sm text-white group-hover:text-amber-400 transition-colors truncate">
              {name}
            </h4>
            <span className="text-[11px] text-gray-400 block truncate">
              {items.length} Plugin • {downloadedCount} Terdownload
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
