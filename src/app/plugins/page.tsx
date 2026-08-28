'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Plugin, PluginMetadata } from '@/types/plugin';
import { getTopNewestIds, isPluginRecent, formatDate, DAY_INDEX_MAP } from '@/lib/utils';
import { PluginCard } from '@/components/PluginCard';
import { PluginModal } from '@/components/PluginModal';
import { WeeklyDayGrid } from '@/components/WeeklyDayGrid';
import { SectionTabs } from '@/components/SectionTabs';
import { PluginSkeleton } from '@/components/PluginSkeleton';
import {
  Building2, Search, LayoutGrid, Zap, CalendarDays, Award, FolderOpen, RotateCw, ChevronLeft, ChevronRight,
  ArrowUpDown, Grid, List, ChevronDown, RefreshCw, X, Menu, LogIn, LogOut, User as UserIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/AuthModal';
import { WishlistPanel } from '@/components/WishlistPanel';
import { WishlistButton } from '@/components/WishlistButton';

const ITEMS_PER_PAGE = 12;

export default function PluginsPage() {
  const [allPlugins, setAllPlugins] = useState<Plugin[]>([]);
  const [metadata, setMetadata] = useState<Partial<PluginMetadata>>({});
  const [loading, setLoading] = useState(true);

  const [activeMainMenu, setActiveMainMenu] = useState<'all' | 'recent' | 'schedule' | 'certified'>('all');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activePlatform, setActivePlatform] = useState<string>('all');
  const [activeSort, setActiveSort] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>(DAY_INDEX_MAP[new Date().getDay()] || 'Senin');
  const [selectedNewReleaseDay, setSelectedNewReleaseDay] = useState<string>(DAY_INDEX_MAP[new Date().getDay()] || 'Senin');

  const [activeRecentTab, setActiveRecentTab] = useState<'recent-cards' | 'recent-schedule'>('recent-cards');
  const [activeScheduleTab, setActiveScheduleTab] = useState<'schedule-cards' | 'schedule-timeline'>('schedule-cards');

  const [mainPage, setMainPage] = useState(1);
  const [recentPage, setRecentPage] = useState(1);
  const [schedulePage, setSchedulePage] = useState(1);

  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { user, signOut } = useAuth();

  useEffect(() => {
    fetchPlugins();
    const interval = setInterval(fetchPluginsSilently, 8000);
    return () => clearInterval(interval);
  }, []);

  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plugins');
      const data = await res.json();
      setAllPlugins(data.plugins || []);
      setMetadata(data.metadata || {});
    } catch (err) {
      console.error('Failed to load plugin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPluginsSilently = async () => {
    try {
      const res = await fetch('/api/plugins?t=' + Date.now());
      const data = await res.json();
      if (data.plugins?.length !== allPlugins.length || data.metadata?.scrapeDate !== metadata.scrapeDate) {
        setAllPlugins(data.plugins || []);
        setMetadata(data.metadata || {});
      }
    } catch {
      // Ignore
    }
  };

  const topNewestIds = useMemo(() => getTopNewestIds(allPlugins, 40), [allPlugins]);

  // Compute counts
  const recentCount = useMemo(() => allPlugins.filter(p => isPluginRecent(p, topNewestIds)).length, [allPlugins, topNewestIds]);
  const certifiedCount = useMemo(() => allPlugins.filter(p => p.certified).length, [allPlugins]);

  // Filter helper
  const matchesFilters = (plugin: Plugin) => {
    if (activeCategory !== 'all' && plugin.category !== activeCategory) return false;
    if (activePlatform !== 'all') {
      if (!plugin.platforms || !plugin.platforms.some(p => p.toLowerCase().includes(activePlatform.toLowerCase()))) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = plugin.name.toLowerCase().includes(q);
      const matchAuthor = plugin.author.toLowerCase().includes(q);
      const matchId = plugin.id.toLowerCase().includes(q);
      const matchDesc = plugin.description.toLowerCase().includes(q);
      if (!matchName && !matchAuthor && !matchId && !matchDesc) return false;
    }
    return true;
  };

  // Sort helper
  const sortFn = (a: Plugin, b: Plugin) => {
    switch (activeSort) {
      case 'newest': return parseInt(b.id) - parseInt(a.id);
      case 'downloads': return (b.downloads || 0) - (a.downloads || 0);
      case 'rating': return (b.rating?.score || 0) - (a.rating?.score || 0);
      case 'priceLow': return (a.price?.amount || 0) - (b.price?.amount || 0);
      case 'priceHigh': return (b.price?.amount || 0) - (a.price?.amount || 0);
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  };

  // Filtered lists
  const filteredMainPlugins = useMemo(() => {
    return allPlugins
      .filter(p => {
        if (activeMainMenu === 'certified' && !p.certified) return false;
        return matchesFilters(p);
      })
      .sort(sortFn);
  }, [allPlugins, activeMainMenu, activeCategory, activePlatform, searchQuery, activeSort]);

  const filteredRecentPlugins = useMemo(() => {
    return allPlugins
      .filter(p => isPluginRecent(p, topNewestIds) && matchesFilters(p))
      .sort(sortFn);
  }, [allPlugins, topNewestIds, activeCategory, activePlatform, searchQuery, activeSort]);

  const filteredSchedulePlugins = useMemo(() => {
    return allPlugins
      .filter(p => parseInt(p.version) > 1 && !isPluginRecent(p, topNewestIds) && matchesFilters(p))
      .sort(sortFn);
  }, [allPlugins, topNewestIds, activeCategory, activePlatform, searchQuery, activeSort]);

  // Categories list
  const categoryList = useMemo(() => {
    const stats = metadata.categoryStats || {};
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }, [metadata]);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-[#f0f2f5] flex flex-col md:flex-row">
      {/* ── MOBILE NAVBAR HEADER ── */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0b0d12] border-b border-white/[0.06] sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/20 shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            <Image src="/icon.jpg" alt="Logo" fill className="object-cover" />
          </div>
          <span className="font-display font-bold text-lg text-white">TheoTown Hub</span>
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-300">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ── SIDEBAR OVERLAY FOR MOBILE ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
        />
      )}

      {/* ── SIDEBAR NAVIGATION ── */}
      <aside className={`
        fixed md:sticky top-0 left-0 bottom-0 z-40 w-72 bg-[#0b0d12] border-r border-white/[0.06]
        p-6 flex flex-col justify-between overflow-y-auto scrollbar-thin transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        h-screen shrink-0
      `}>
        <div className="space-y-8">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.8)] border border-white/20 group-hover:border-red-500 transition-colors p-0.5 bg-[#13161e]">
              <div className="relative w-full h-full rounded-lg overflow-hidden">
                <Image src="/icon.jpg" alt="Logo" fill className="object-cover" />
              </div>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white leading-tight">
                TheoTown<span style={{ color: '#c6e000' }}>Hub</span>
              </h1>
              <span className="text-[11px] text-gray-400 font-medium">Plugin Showcase Hub</span>
            </div>
          </Link>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama, author, ID..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setMainPage(1); setRecentPage(1); setSchedulePage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-[#13161e] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          {/* Menu Utama */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2">Menu Utama</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => { setActiveMainMenu('all'); setActiveCategory('all'); setMainPage(1); setSidebarOpen(false); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    activeMainMenu === 'all' && activeCategory === 'all'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> Semua Plugin</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white font-mono">{allPlugins.length}</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => { setActiveMainMenu('recent'); setActiveCategory('all'); setRecentPage(1); setSidebarOpen(false); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    activeMainMenu === 'recent'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-red-500" /> Baru Rilis</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold">NEW</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => { setActiveMainMenu('schedule'); setActiveCategory('all'); setSchedulePage(1); setSidebarOpen(false); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    activeMainMenu === 'schedule'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-emerald-500" /> Baru Update</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">UPD</span>
                </button>
              </li>

              <li>
                <button
                  onClick={() => { setActiveMainMenu('certified'); setActiveCategory('all'); setMainPage(1); setSidebarOpen(false); }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    activeMainMenu === 'certified'
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="flex items-center gap-2"><Award className="w-4 h-4 text-amber-500" /> Certified Creators</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-400 font-bold">TOP</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Wishlist */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2">Wishlist Saya</h3>
            <WishlistPanel onLoginRequired={() => setAuthModalOpen(true)} />
          </div>

          {/* Kategori */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2">Kategori</h3>
            <ul className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
              {categoryList.map(([catName, count]) => (
                <li key={catName}>
                  <button
                    onClick={() => { setActiveCategory(catName); setActiveMainMenu('all'); setMainPage(1); setSidebarOpen(false); }}
                    className={`w-full px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeCategory === catName
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate"><FolderOpen className="w-3.5 h-3.5" /> {catName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-white/5 text-gray-400 font-mono">{count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Filter Platform */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider px-2">Filter Platform</h3>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'Android', 'iOS', 'Desktop'].map((platform) => (
                <button
                  key={platform}
                  onClick={() => { setActivePlatform(platform); setMainPage(1); setRecentPage(1); setSchedulePage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activePlatform === platform
                      ? 'bg-red-600 text-white'
                      : 'bg-[#13161e] border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {platform === 'all' ? 'Semua' : platform}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-white/[0.06] mt-6 space-y-3">
          {/* Auth section */}
          {user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                {user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                    <UserIcon className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <span className="text-[11px] text-gray-300 truncate flex-1">{user.displayName || user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="w-full px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center gap-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Keluar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <LogIn className="w-4 h-4" /> Masuk / Daftar
            </button>
          )}

          <div className="flex items-center gap-2.5 text-xs text-gray-400">
            <RefreshCw className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="text-[11px] text-gray-300 font-medium">
              Updated: <strong className="text-white">{metadata.scrapeDate ? formatDate(metadata.scrapeDate) : '--'}</strong>
            </span>
          </div>
          <p className="text-[10px] text-gray-500 leading-tight">
            Unofficial TheoTown Hub. Hak cipta milik BlueFlower Games & Creator.
          </p>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full min-w-0">

        {/* Controls Toolbar (hanya untuk view biasa) */}
        {activeMainMenu !== 'recent' && activeMainMenu !== 'schedule' && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#13161e] border border-white/[0.07] rounded-xl">
            <span className="text-xs text-gray-400 font-medium">
              Menampilkan <strong className="text-white">{filteredMainPlugins.length}</strong> plugin
            </span>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={activeSort}
                  onChange={(e) => setActiveSort(e.target.value)}
                  className="bg-[#0b0d12] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                >
                  <option value="newest">Terbaru Ditambahkan</option>
                  <option value="downloads">Paling Banyak Di-download</option>
                  <option value="rating">Rating Tertinggi</option>
                  <option value="priceLow">Harga Terendah</option>
                  <option value="priceHigh">Harga Tertinggi</option>
                  <option value="name">Nama (A-Z)</option>
                </select>
              </div>

              <div className="flex gap-1 border border-white/10 rounded-lg p-1 bg-[#0b0d12]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION: BARU RILIS (2 tabs: Plugin vs Jadwal) ── */}
        {activeMainMenu === 'recent' && (
          <div className="bg-[#13161e] border border-white/[0.07] rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-red-500" /> Baru Rilis
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Plugin yang baru saja dirilis. Lihat per jadwal mingguan atau jelajahi semua card plugin.
                </p>
              </div>
            </div>

            <SectionTabs
              activeTab={activeRecentTab}
              onTabChange={(t) => setActiveRecentTab(t as any)}
              tabCardsId="recent-cards"
              tabTimelineId="recent-schedule"
              accentColor="red"
            />

            {activeRecentTab === 'recent-cards' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredRecentPlugins
                    .slice((recentPage - 1) * ITEMS_PER_PAGE, recentPage * ITEMS_PER_PAGE)
                    .map(plugin => (
                      <PluginCard
                        key={plugin.id}
                        plugin={plugin}
                        topNewestIds={topNewestIds}
                        onClick={setSelectedPlugin}
                        onLoginRequired={() => setAuthModalOpen(true)}
                      />
                    ))}
                </div>

                {/* Pagination */}
                {filteredRecentPlugins.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                    <button
                      disabled={recentPage === 1}
                      onClick={() => setRecentPage(p => p - 1)}
                      className="px-4 py-2 bg-white/5 disabled:opacity-30 hover:bg-white/10 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Sebelumnya
                    </button>
                    <span className="text-xs text-gray-400">
                      Halaman {recentPage} dari {Math.ceil(filteredRecentPlugins.length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                      disabled={recentPage === Math.ceil(filteredRecentPlugins.length / ITEMS_PER_PAGE)}
                      onClick={() => setRecentPage(p => p + 1)}
                      className="px-4 py-2 bg-white/5 disabled:opacity-30 hover:bg-white/10 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                    >
                      Selanjutnya <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <WeeklyDayGrid
                plugins={allPlugins}
                topNewestIds={topNewestIds}
                selectedDay={selectedNewReleaseDay}
                onSelectDay={setSelectedNewReleaseDay}
                onPluginClick={setSelectedPlugin}
                onLoginRequired={() => setAuthModalOpen(true)}
                accentColor="red"
                filterFn={(p) => isPluginRecent(p, topNewestIds)}
              />
            )}
          </div>
        )}

        {/* ── SECTION: JADWAL UPDATE MINGGUAN (2 tabs: Plugin vs Jadwal) ── */}
        {activeMainMenu === 'schedule' && (
          <div className="bg-[#13161e] border border-white/[0.07] rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-500" /> Jadwal Update Mingguan
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Plugin yang mendapatkan update terbaru minggu ini.
                </p>
              </div>
            </div>

            <SectionTabs
              activeTab={activeScheduleTab}
              onTabChange={(t) => setActiveScheduleTab(t as any)}
              tabCardsId="schedule-cards"
              tabTimelineId="schedule-timeline"
              accentColor="green"
            />

            {activeScheduleTab === 'schedule-cards' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSchedulePlugins
                    .slice((schedulePage - 1) * ITEMS_PER_PAGE, schedulePage * ITEMS_PER_PAGE)
                    .map(plugin => (
                      <PluginCard
                        key={plugin.id}
                        plugin={plugin}
                        topNewestIds={topNewestIds}
                        onClick={setSelectedPlugin}
                        onLoginRequired={() => setAuthModalOpen(true)}
                      />
                    ))}
                </div>

                {/* Pagination */}
                {filteredSchedulePlugins.length > ITEMS_PER_PAGE && (
                  <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                    <button
                      disabled={schedulePage === 1}
                      onClick={() => setSchedulePage(p => p - 1)}
                      className="px-4 py-2 bg-white/5 disabled:opacity-30 hover:bg-white/10 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Sebelumnya
                    </button>
                    <span className="text-xs text-gray-400">
                      Halaman {schedulePage} dari {Math.ceil(filteredSchedulePlugins.length / ITEMS_PER_PAGE)}
                    </span>
                    <button
                      disabled={schedulePage === Math.ceil(filteredSchedulePlugins.length / ITEMS_PER_PAGE)}
                      onClick={() => setSchedulePage(p => p + 1)}
                      className="px-4 py-2 bg-white/5 disabled:opacity-30 hover:bg-white/10 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                    >
                      Selanjutnya <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <WeeklyDayGrid
                plugins={allPlugins}
                topNewestIds={topNewestIds}
                selectedDay={selectedScheduleDay}
                onSelectDay={setSelectedScheduleDay}
                onPluginClick={setSelectedPlugin}
                onLoginRequired={() => setAuthModalOpen(true)}
                accentColor="green"
                filterFn={(p) => parseInt(p.version) > 1 && !isPluginRecent(p, topNewestIds)}
              />
            )}
          </div>
        )}

        {/* ── SECTION: SEMUA / CERTIFIED (Grid biasa) ── */}
        {activeMainMenu !== 'recent' && activeMainMenu !== 'schedule' && (
          <div className="space-y-6">
            {loading ? (
              <PluginSkeleton count={12} />
            ) : filteredMainPlugins.length === 0 ? (
              <div className="py-20 text-center text-gray-500 bg-[#13161e] border border-white/[0.07] rounded-2xl">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <h3 className="text-base font-display font-bold text-white mb-1">Tidak Ada Plugin Ditemukan</h3>
                <p className="text-xs text-gray-400">Coba ubah kata kunci pencarian atau reset filter kategori.</p>
              </div>
            ) : (
              <div className={`grid gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                  : 'grid-cols-1'
              }`}>
                {filteredMainPlugins
                  .slice((mainPage - 1) * ITEMS_PER_PAGE, mainPage * ITEMS_PER_PAGE)
                  .map(plugin => (
                    <PluginCard
                      key={plugin.id}
                      plugin={plugin}
                      topNewestIds={topNewestIds}
                      onClick={setSelectedPlugin}
                      onLoginRequired={() => setAuthModalOpen(true)}
                    />
                  ))}
              </div>
            )}

            {/* Pagination */}
            {filteredMainPlugins.length > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center pt-4 border-t border-white/[0.06]">
                <button
                  disabled={mainPage === 1}
                  onClick={() => setMainPage(p => p - 1)}
                  className="px-4 py-2 bg-white/5 disabled:opacity-30 hover:bg-white/10 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Sebelumnya
                </button>
                <span className="text-xs text-gray-400">
                  Halaman {mainPage} dari {Math.ceil(filteredMainPlugins.length / ITEMS_PER_PAGE)}
                </span>
                <button
                  disabled={mainPage === Math.ceil(filteredMainPlugins.length / ITEMS_PER_PAGE)}
                  onClick={() => setMainPage(p => p + 1)}
                  className="px-4 py-2 bg-white/5 disabled:opacity-30 hover:bg-white/10 rounded-lg text-xs font-semibold text-white flex items-center gap-1"
                >
                  Selanjutnya <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── DETAIL MODAL ── */}
      <PluginModal plugin={selectedPlugin} onClose={() => setSelectedPlugin(null)} onLoginRequired={() => setAuthModalOpen(true)} />

      {/* ── AUTH MODAL ── */}
      {authModalOpen && <AuthModal onClose={() => setAuthModalOpen(false)} />}
    </div>
  );
}
