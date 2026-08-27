'use client';

import React from 'react';

export function PluginSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-[#13161e] border border-white/[0.07] rounded-xl overflow-hidden animate-pulse flex flex-col justify-between"
        >
          <div>
            <div className="aspect-[16/9] bg-white/[0.05]" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-white/10 rounded w-3/4" />
              <div className="h-3 bg-white/5 rounded w-full" />
              <div className="h-3 bg-white/5 rounded w-2/3" />
            </div>
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-white/[0.05] flex justify-between items-center">
            <div className="h-3 bg-white/5 rounded w-1/3" />
            <div className="h-3 bg-white/10 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
