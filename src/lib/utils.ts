import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Plugin } from '@/types/plugin';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DAY_INDEX_MAP: Record<number, string> = {
  1: 'Senin', 2: 'Selasa', 3: 'Rabu', 4: 'Kamis',
  5: 'Jumat', 6: 'Sabtu', 0: 'Minggu',
};

export const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export function parseForumDate(dateStr: string | undefined): Date | null {
  if (!dateStr) return null;
  const now = new Date();
  const str = dateStr.trim().toLowerCase();
  if (str.startsWith('today') || str.startsWith('hari ini')) return now;
  if (str.startsWith('yesterday') || str.startsWith('kemarin')) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    return y;
  }
  const parsed = Date.parse(dateStr.replace(/,/g, ''));
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

export function isPluginRecent(plugin: Plugin, topNewestIds: Set<string>): boolean {
  const isV1 = plugin.version === '1' || parseInt(plugin.version) === 1;
  return topNewestIds.has(plugin.id) || isV1;
}

export function getTopNewestIds(plugins: Plugin[], count = 40): Set<string> {
  return new Set(
    [...plugins].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, count).map(p => p.id)
  );
}

export function getStaleLabel(dt: Date, selectedDay: string): string {
  const now = new Date();
  if (dt.toDateString() !== now.toDateString() && DAY_INDEX_MAP[dt.getDay()] === selectedDay) {
    const diffDays = Math.round((now.getTime() - dt.getTime()) / 86400000);
    if (diffDays === 1) return 'Update kemarin';
    if (diffDays > 1) return `Update ${diffDays} hari lalu`;
  }
  return '';
}

export function formatNumber(n: number): string {
  return n.toLocaleString('id-ID');
}

export function formatCompactNumber(n: number): string {
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
