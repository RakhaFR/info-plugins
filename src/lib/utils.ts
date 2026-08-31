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

export function parseForumDate(dateStr: string | undefined, baseDate?: Date | string): Date | null {
  if (!dateStr) return null;
  const str = dateStr.trim();
  const lower = str.toLowerCase();
  const ref = baseDate ? new Date(baseDate) : new Date();

  if (lower.startsWith('today') || lower.startsWith('hari ini')) {
    const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
    const d = new Date(ref);
    if (timeMatch) {
      d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    }
    return d;
  }

  if (lower.startsWith('yesterday') || lower.startsWith('kemarin')) {
    const timeMatch = str.match(/(\d{1,2}):(\d{2})/);
    const d = new Date(ref);
    d.setDate(d.getDate() - 1);
    if (timeMatch) {
      d.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    }
    return d;
  }

  // Support "26 Aug 2026, 09:47" or "26 Aug 2026"
  const cleaned = str.replace(/,/g, '');
  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) return new Date(parsed);

  return null;
}

export function isPluginRecent(plugin: Plugin, topNewestIds: Set<string>): boolean {
  const isV1 = plugin.version === '1' || parseInt(plugin.version) === 1;
  return isV1;
}

export function getTopNewestIds(plugins: Plugin[], count = 40): Set<string> {
  return new Set(
    [...plugins].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, count).map(p => p.id)
  );
}

/**
 * Checks if a plugin date is within the last 24 hours (1 day).
 */
export function isWithin24Hours(dateStr: string | undefined, baseDate: Date = new Date()): boolean {
  if (!dateStr) return false;
  const dt = parseForumDate(dateStr, baseDate);
  if (!dt) return false;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const diff = baseDate.getTime() - dt.getTime();
  return diff >= 0 && diff <= ONE_DAY_MS;
}

export function getStaleLabel(dt: Date, selectedDay: string, referenceDate: Date = new Date()): string {
  if (dt.toDateString() !== referenceDate.toDateString() && DAY_INDEX_MAP[dt.getDay()] === selectedDay) {
    const diffDays = Math.round((referenceDate.getTime() - dt.getTime()) / 86400000);
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
