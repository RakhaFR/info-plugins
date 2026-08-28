'use client';

import React, { useState } from 'react';
import { Trash2, Layers } from 'lucide-react';
import type { WishlistItem } from '@/lib/wishlist';

interface FolderCardProps {
  id: string;
  name: string;
  items: WishlistItem[];
  onClick: () => void;
  onDelete?: () => void;
  isDefault?: boolean;
  color?: string;
}

const darkenColor = (hex: string, percent: number): string => {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const num = parseInt(color.slice(0, 6), 16);
  let r = (num >> 16) & 0xff;
  let g = (num >> 8) & 0xff;
  let b = num & 0xff;
  r = Math.max(0, Math.min(255, Math.floor(r * (1 - percent))));
  g = Math.max(0, Math.min(255, Math.floor(g * (1 - percent))));
  b = Math.max(0, Math.min(255, Math.floor(b * (1 - percent))));
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export function FolderCard({
  id,
  name,
  items,
  onClick,
  onDelete,
  isDefault,
  color = '#2563eb', // Indigo/Blue theme by default
}: FolderCardProps) {
  const maxItems = 3;
  const previewImages = items
    .map((item) => item.previewImage)
    .filter(Boolean) as string[];

  const downloadedCount = items.filter((i) => i.downloaded).length;

  const [open, setOpen] = useState(false);
  const [paperOffsets, setPaperOffsets] = useState<{ x: number; y: number }[]>(
    Array.from({ length: maxItems }, () => ({ x: 0, y: 0 }))
  );

  const folderBackColor = darkenColor(color, 0.25);
  const paper1 = '#1e293b';
  const paper2 = '#334155';
  const paper3 = '#475569';

  const handleFolderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  const handlePaperMouseMove = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    if (!open) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const offsetX = (e.clientX - centerX) * 0.15;
    const offsetY = (e.clientY - centerY) * 0.15;
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: offsetX, y: offsetY };
      return newOffsets;
    });
  };

  const handlePaperMouseLeave = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    index: number
  ) => {
    setPaperOffsets((prev) => {
      const newOffsets = [...prev];
      newOffsets[index] = { x: 0, y: 0 };
      return newOffsets;
    });
  };

  // Transform offset calculation when open: left, right, center top
  const getOpenTransform = (index: number) => {
    if (index === 0) return 'translate(-115%, -65%) rotate(-14deg)';
    if (index === 1) return 'translate(15%, -65%) rotate(14deg)';
    if (index === 2) return 'translate(-50%, -95%) rotate(0deg)';
    return '';
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 group select-none">
      {/* Folder Object */}
      <div
        onClick={handleFolderClick}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="relative transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2"
      >
        {/* Folder Back Container */}
        <div
          className="relative w-[150px] h-[105px] rounded-tl-0 rounded-tr-[12px] rounded-br-[12px] rounded-bl-[12px] shadow-xl"
          style={{ backgroundColor: folderBackColor }}
        >
          {/* Folder Tab at top left */}
          <span
            className="absolute z-0 bottom-[98%] left-0 w-[50px] h-[14px] rounded-tl-[8px] rounded-tr-[8px] rounded-bl-0 rounded-br-0"
            style={{ backgroundColor: folderBackColor }}
          ></span>

          {/* Delete Button floating top right */}
          {!isDefault && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Hapus Folder"
              className="absolute -top-3 -right-3 z-40 p-1.5 bg-red-600/90 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 3 Floating Image Cards (Left, Right, Center) */}
          {[0, 1, 2].map((i) => {
            const item = items[i];
            const imgSrc = item?.previewImage;
            const sizeClasses =
              i === 0
                ? 'w-[75%] h-[80%]'
                : i === 1
                ? 'w-[82%] h-[80%]'
                : 'w-[90%] h-[80%]';

            const transformStyle = open
              ? `${getOpenTransform(i)} translate(${paperOffsets[i].x}px, ${
                  paperOffsets[i].y
                }px)`
              : undefined;

            return (
              <div
                key={i}
                onMouseMove={(e) => handlePaperMouseMove(e, i)}
                onMouseLeave={(e) => handlePaperMouseLeave(e, i)}
                className={`absolute z-20 bottom-[10%] left-1/2 rounded-lg overflow-hidden border border-white/30 shadow-lg transition-all duration-300 ease-in-out ${
                  !open
                    ? 'transform -translate-x-1/2 translate-y-[10%] group-hover:translate-y-0'
                    : 'hover:scale-105'
                } ${sizeClasses}`}
                style={{
                  ...(!open ? {} : { transform: transformStyle }),
                  backgroundColor: i === 0 ? paper1 : i === 1 ? paper2 : paper3,
                }}
              >
                {imgSrc ? (
                  <div className="relative w-full h-full bg-[#0d0f14]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imgSrc}
                      alt={item?.name || 'Preview'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex flex-col items-center justify-center p-1 text-center">
                    <div className="w-6 h-1 rounded bg-amber-400/40 mb-1" />
                    <div className="w-8 h-1 rounded bg-white/20 mb-0.5" />
                    <div className="w-5 h-1 rounded bg-white/10" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Folder Front Cover Overlay */}
          <div
            className={`absolute z-30 w-full h-full origin-bottom transition-all duration-300 ease-in-out ${
              !open ? 'group-hover:[transform:skew(12deg)_scaleY(0.65)]' : ''
            }`}
            style={{
              backgroundColor: color,
              borderRadius: '6px 12px 12px 12px',
              ...(open && { transform: 'skew(12deg) scaleY(0.65)' }),
            }}
          ></div>
        </div>
      </div>

      {/* Folder Name & Info below */}
      <div className="text-center mt-3 max-w-[170px] truncate cursor-pointer" onClick={handleFolderClick}>
        <h4 className="font-display font-bold text-xs text-white group-hover:text-amber-400 transition-colors truncate">
          {name}
        </h4>
        <span className="text-[10px] text-gray-400 block truncate mt-0.5">
          {items.length} Plugin • {downloadedCount} Terdownload
        </span>
      </div>
    </div>
  );
}
