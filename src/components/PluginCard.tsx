'use client';

import React from 'react';
import type { Plugin } from '@/types/plugin';
import { isPluginRecent, formatNumber } from '@/lib/utils';
import { Zap, RotateCw, Heart, Gift, Gem, Download, Star } from 'lucide-react';
import { WishlistButton } from './WishlistButton';

interface PluginCardProps {
  plugin: Plugin;
  topNewestIds: Set<string>;
  onClick: (plugin: Plugin) => void;
  onLoginRequired: () => void;
}

export function PluginCard({ plugin, topNewestIds, onClick, onLoginRequired }: PluginCardProps) {
  const isFree = plugin.price.amount === 0;
  const isRecent = isPluginRecent(plugin, topNewestIds);
  const isUpdated = parseInt(plugin.version) > 1;
  const ratingLabel = plugin.rating?.label || 'NO RATINGS';
  const ratingDisplay = plugin.rating?.count > 0 ? `${ratingLabel} (${plugin.rating.count})` : 'Belum Ada Rating';

  return (
    <div
      onClick={() => onClick(plugin)}
      className="group relative bg-[#13161e] hover:bg-[#1a1e28] border border-white/[0.07] hover:border-white/20 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Preview image + badges */}
        <div className="relative aspect-[16/9] bg-[#0b0d12] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={plugin.previewImage || 'https://via.placeholder.com/300x160?text=TheoTown'}
            alt={plugin.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
          />
          <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[11px] font-semibold bg-black/70 backdrop-blur-sm text-gray-300 rounded border border-white/10">
            {plugin.category || 'General'}
          </span>

          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            {isRecent && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-500/90 text-white rounded shadow-sm flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> BARU RILIS
              </span>
            )}
            {!isRecent && isUpdated && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/90 text-white rounded shadow-sm flex items-center gap-1">
                <RotateCw className="w-3 h-3" /> UPDATED (v{plugin.version})
              </span>
            )}
            {plugin.certified && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/90 text-white rounded shadow-sm flex items-center gap-1">
                <Heart className="w-3 h-3 fill-current" /> Certified
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <h3 className="font-display font-bold text-sm text-white line-clamp-1 group-hover:text-red-400 transition-colors flex-1 min-w-0">
              {plugin.name}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-gray-500">#{plugin.id}</span>
              <WishlistButton plugin={plugin} onLoginRequired={onLoginRequired} />
            </div>
          </div>

          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-4">
            {plugin.description || 'Tidak ada deskripsi.'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4 pt-0 border-t border-white/[0.05] mt-auto">
        <div className="flex justify-between items-center text-xs py-2">
          <span className="text-gray-400 truncate">
            Oleh <strong className="text-gray-200 font-medium">{plugin.author || 'Unknown'}</strong>
          </span>
          <span className={`px-2 py-0.5 rounded font-medium text-[11px] flex items-center gap-1 ${
            isFree ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {isFree ? <><Gift className="w-3 h-3" /> Gratis</> : <><Gem className="w-3 h-3" /> {plugin.price.amount}</>}
          </span>
        </div>

        <div className="flex justify-between items-center text-[11px] text-gray-400 pt-1">
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3 text-gray-500" />
            {formatNumber(plugin.downloads || 0)}
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-medium">
            <Star className="w-3 h-3 fill-current" />
            {ratingDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}
