'use client';

import React from 'react';
import { LayoutGrid, CalendarDays } from 'lucide-react';

interface SectionTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabCardsId: string;
  tabTimelineId: string;
  accentColor: 'red' | 'green';
}

export function SectionTabs({
  activeTab,
  onTabChange,
  tabCardsId,
  tabTimelineId,
  accentColor,
}: SectionTabsProps) {
  const activeClass = accentColor === 'red' ? 'section-tab-red active' : 'section-tab-green active';

  return (
    <div className="flex gap-2 pb-3 mb-4 border-b border-white/10">
      <button
        onClick={() => onTabChange(tabCardsId)}
        className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
          activeTab === tabCardsId
            ? activeClass
            : 'bg-transparent border-white/10 text-gray-400 hover:text-white hover:border-white/20'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" /> Plugin
      </button>
      <button
        onClick={() => onTabChange(tabTimelineId)}
        className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
          activeTab === tabTimelineId
            ? activeClass
            : 'bg-transparent border-white/10 text-gray-400 hover:text-white hover:border-white/20'
        }`}
      >
        <CalendarDays className="w-3.5 h-3.5" /> Jadwal Mingguan
      </button>
    </div>
  );
}
