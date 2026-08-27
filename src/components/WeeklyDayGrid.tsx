'use client';

import React from 'react';
import type { Plugin } from '@/types/plugin';
import { PluginCard } from './PluginCard';
import { DAYS, DAY_INDEX_MAP, parseForumDate, getStaleLabel } from '@/lib/utils';
import { CalendarCheck, Clock, CalendarX, Bolt } from 'lucide-react';

interface WeeklyDayGridProps {
  plugins: Plugin[];
  topNewestIds: Set<string>;
  selectedDay: string;
  onSelectDay: (day: string) => void;
  onPluginClick: (plugin: Plugin) => void;
  accentColor: 'red' | 'green';
  filterFn: (plugin: Plugin) => boolean;
}

export function WeeklyDayGrid({
  plugins,
  topNewestIds,
  selectedDay,
  onSelectDay,
  onPluginClick,
  accentColor,
  filterFn,
}: WeeklyDayGridProps) {
  const now = new Date();
  const currentDayName = DAY_INDEX_MAP[now.getDay()];
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Group plugins by day of week
  const weeklyMap: Record<string, { plugin: Plugin; dt: Date }[]> = {
    Senin: [], Selasa: [], Rabu: [], Kamis: [], Jumat: [], Sabtu: [], Minggu: [],
  };

  plugins.forEach((plugin) => {
    if (filterFn(plugin)) {
      const dt = parseForumDate(plugin.uploadDate);
      if (dt && dt >= sevenDaysAgo) {
        const dayName = DAY_INDEX_MAP[dt.getDay()];
        if (weeklyMap[dayName]) weeklyMap[dayName].push({ plugin, dt });
      }
    }
  });

  const dayEntries = weeklyMap[selectedDay] || [];
  const isToday = selectedDay === currentDayName;
  const staleLabel = dayEntries.length > 0 ? getStaleLabel(dayEntries[0].dt, selectedDay) : '';

  const activeTabClass = accentColor === 'red' ? 'day-tab-red active' : 'day-tab-green active';
  const iconColor = accentColor === 'red' ? '#ef4444' : '#10b981';

  return (
    <div className="space-y-4">
      {/* Day tabs row */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {DAYS.map((day) => {
          const count = (weeklyMap[day] || []).length;
          const isActive = day === selectedDay;
          return (
            <button
              key={day}
              onClick={() => onSelectDay(day)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border ${
                isActive
                  ? activeTabClass
                  : 'bg-[#0b0d12] border-white/10 text-gray-400 hover:text-white hover:border-white/20'
              }`}
            >
              {day}
              {count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/10 text-gray-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Day column card */}
      <div className={`p-4 sm:p-6 rounded-xl border bg-[#0b0d12] ${
        isToday
          ? accentColor === 'red'
            ? 'border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
            : 'border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
          : 'border-white/10'
      }`}>
        <div className="flex flex-wrap justify-between items-center gap-2 pb-4 mb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            {accentColor === 'red' ? (
              <Bolt className="w-5 h-5 text-red-500" />
            ) : (
              <CalendarCheck className="w-5 h-5 text-emerald-500" />
            )}
            <h4 className="font-display font-bold text-base text-white">
              Hari {selectedDay}
            </h4>
            {isToday && (
              <span className={`px-2 py-0.5 text-[10px] font-bold text-white rounded-full uppercase ${
                accentColor === 'red' ? 'bg-red-500' : 'bg-emerald-500'
              }`}>
                Hari Ini
              </span>
            )}
            {staleLabel && (
              <span className="stale-tooltip" title={staleLabel}>
                <Clock className="w-3 h-3" /> {staleLabel}
              </span>
            )}
          </div>

          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
            accentColor === 'red'
              ? 'bg-red-500/15 text-red-400 border border-red-500/20'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
          }`}>
            Total {dayEntries.length} Plugin
          </span>
        </div>

        {dayEntries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dayEntries.map(({ plugin }) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                topNewestIds={topNewestIds}
                onClick={onPluginClick}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            <CalendarX className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              Belum ada update plugin di hari <strong className="text-gray-400">{selectedDay}</strong> pada minggu ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
