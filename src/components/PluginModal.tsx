'use client';

import React from 'react';
import type { Plugin } from '@/types/plugin';
import { formatNumber } from '@/lib/utils';
import { X, ExternalLink, Heart, User, Gift, Gem } from 'lucide-react';

interface PluginModalProps {
  plugin: Plugin | null;
  onClose: () => void;
}

export function PluginModal({ plugin, onClose }: PluginModalProps) {
  if (!plugin) return null;
  const isFree = plugin.price.amount === 0;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-[#13161e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black text-gray-300 hover:text-white rounded-full transition-colors border border-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header preview */}
        <div className="relative h-48 sm:h-56 bg-[#0b0d12] overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={plugin.previewImage || 'https://via.placeholder.com/600x300?text=TheoTown'}
            alt={plugin.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#13161e] via-transparent to-transparent" />
        </div>

        {/* Modal content */}
        <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
          <div>
            <span className="text-xs font-mono text-gray-500">ID #{plugin.id}</span>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-white flex items-center gap-2 mt-1">
              {plugin.name}
              {plugin.certified && (
                <Heart className="w-5 h-5 text-red-500 fill-current" />
              )}
            </h2>
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-gray-500" />
              Diupload oleh <strong className="text-gray-200">{plugin.author}</strong> • {plugin.uploadDate}
            </p>
          </div>

          {/* Description */}
          <div className="p-4 bg-black/30 border border-white/[0.05] rounded-xl">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Pengumuman & Deskripsi Plugin
            </h4>
            {plugin.descriptionHtml ? (
              <div
                className="text-xs text-gray-300 leading-relaxed space-y-2 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: plugin.descriptionHtml }}
              />
            ) : (
              <p className="text-xs text-gray-300 leading-relaxed">
                {plugin.description || 'Tidak ada deskripsi.'}
              </p>
            )}
          </div>

          {/* Specs grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#1a1e28] rounded-lg border border-white/[0.05]">
              <span className="text-[11px] text-gray-400 block">Kategori</span>
              <span className="text-xs font-semibold text-white mt-0.5 block truncate">{plugin.category || 'N/A'}</span>
            </div>
            <div className="p-3 bg-[#1a1e28] rounded-lg border border-white/[0.05]">
              <span className="text-[11px] text-gray-400 block">Harga</span>
              <span className={`text-xs font-semibold mt-0.5 flex items-center gap-1 ${isFree ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isFree ? <><Gift className="w-3 h-3" /> Gratis</> : <><Gem className="w-3 h-3" /> {plugin.price.amount} Diamonds</>}
              </span>
            </div>
            <div className="p-3 bg-[#1a1e28] rounded-lg border border-white/[0.05]">
              <span className="text-[11px] text-gray-400 block">Ukuran File</span>
              <span className="text-xs font-semibold text-white mt-0.5 block">{plugin.size?.raw || 'N/A'}</span>
            </div>
            <div className="p-3 bg-[#1a1e28] rounded-lg border border-white/[0.05]">
              <span className="text-[11px] text-gray-400 block">Versi Minimum</span>
              <span className="text-xs font-semibold text-white mt-0.5 block">{plugin.minVersion || 'Any'}</span>
            </div>
            <div className="p-3 bg-[#1a1e28] rounded-lg border border-white/[0.05]">
              <span className="text-[11px] text-gray-400 block">Total Download</span>
              <span className="text-xs font-semibold text-white mt-0.5 block">{formatNumber(plugin.downloads || 0)}</span>
            </div>
            <div className="p-3 bg-[#1a1e28] rounded-lg border border-white/[0.05]">
              <span className="text-[11px] text-gray-400 block">Rating</span>
              <span className="text-xs font-semibold text-amber-400 mt-0.5 block">{plugin.rating?.label || 'NO RATINGS'}</span>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-2">
            <a
              href={plugin.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-red-600/20"
            >
              <ExternalLink className="w-4 h-4" /> Buka Forum TheoTown
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
