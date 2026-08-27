'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCompactNumber, formatNumber } from '@/lib/utils';
import {
  ArrowRight, LayoutGrid, ShieldCheck, Cpu, Download, Star, Loader2, X, Eye, Play, Sparkles, Building2
} from 'lucide-react';

const RED = '#e53935';
const LIME = '#c6e000';

interface FeaturedPlugin {
  id: string;
  name: string;
  category: string;
  downloads: number;
  previewImage: string;
  author: string;
  price: number;
}

export default function LandingPage() {
  const [stats, setStats] = useState({ totalPlugins: 0, totalDownloads: 0, certified: 0 });
  const [popularPlugins, setPopularPlugins] = useState<FeaturedPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/plugins')
      .then(res => res.json())
      .then(({ plugins, metadata }) => {
        setStats({
          totalPlugins: metadata.totalPlugins || plugins.length || 0,
          totalDownloads: metadata.totalDownloads || 0,
          certified: metadata.certifiedCreators || 0,
        });

        // Top 6 popular
        const top6 = [...plugins]
          .sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
          .slice(0, 6)
          .map(p => ({
            id: p.id,
            name: p.name,
            category: p.category || 'General',
            downloads: p.downloads || 0,
            previewImage: p.previewImage || 'https://via.placeholder.com/300x160?text=TheoTown',
            author: p.author || 'Unknown',
            price: p.price?.amount || 0,
          }));
        setPopularPlugins(top6);
      })
      .catch(err => console.error('Gagal fetch data landing:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-[#f0f2f5] overflow-x-hidden font-body">
      {/* ── NAV BAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-4 bg-[#0d0f14]/90 backdrop-blur-md border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-display font-bold text-lg">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">
            TheoTown<span style={{ color: LIME }}>Hub</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
          <a href="#fitur" className="hover:text-white transition-colors">Fitur Utama</a>
          <a href="#populer" className="hover:text-white transition-colors">Plugin Populer</a>
          <a href="#komunitas" className="hover:text-white transition-colors">Komunitas</a>
        </div>

        <Link
          href="/plugins"
          className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-red-600/20"
        >
          <Download className="w-3.5 h-3.5" /> Buka Plugin Hub
        </Link>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 text-gray-400 hover:text-white"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <LayoutGrid className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed top-[65px] left-0 right-0 z-40 bg-[#13161e] border-b border-white/10 p-6 flex flex-col gap-4 md:hidden">
          <a href="#fitur" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300">Fitur Utama</a>
          <a href="#populer" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300">Plugin Populer</a>
          <a href="#komunitas" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300">Komunitas</a>
          <Link
            href="/plugins"
            onClick={() => setMenuOpen(false)}
            className="w-full py-3 bg-red-600 text-white text-center text-xs font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" /> Buka Plugin Hub
          </Link>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center pt-24 pb-16 px-6 sm:px-12 overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[200px] bg-lime-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-medium text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pusat Informasi Plugin TheoTown Indonesia</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-none text-white tracking-tight">
            Temukan Plugin & Mod <br />
            <span className="text-red-500">
              TheoTown Terbaik
            </span>
          </h1>

          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Format pemberitahuan yang dirancang ulang agar nyaman dibaca, transparan, dan mudah dipahami oleh pemain TheoTown Indonesia. Pantau rilis baru & jadwal update mingguan!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/plugins"
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-all shadow-xl shadow-red-600/25 hover:scale-105"
            >
              Jelajahi Semua Plugin <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#fitur"
              className="px-8 py-4 bg-white/[0.05] hover:bg-white/10 text-white font-semibold text-sm rounded-xl border border-white/10 transition-colors"
            >
              Pelajari Fitur
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-10 max-w-2xl mx-auto border-t border-white/[0.08]">
            <div className="p-3.5 bg-[#13161e] border border-white/[0.06] rounded-xl text-center">
              <span className="font-display font-extrabold text-xl sm:text-2xl text-white block">
                {formatNumber(stats.totalPlugins)}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5 block">Total Plugin</span>
            </div>
            <div className="p-3.5 bg-[#13161e] border border-white/[0.06] rounded-xl text-center">
              <span className="font-display font-extrabold text-xl sm:text-2xl text-emerald-400 block" title={stats.totalDownloads.toLocaleString()}>
                {formatCompactNumber(stats.totalDownloads)}
                <span className="text-xs text-emerald-500/80 font-normal ml-1">({formatNumber(stats.totalDownloads)})</span>
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5 block">Total Download</span>
            </div>
            <div className="p-3.5 bg-[#13161e] border border-white/[0.06] rounded-xl text-center">
              <span className="font-display font-extrabold text-xl sm:text-2xl text-amber-400 block">
                {formatNumber(stats.certified)}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5 block">Certified Creator</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="fitur" className="py-20 px-6 sm:px-12 bg-[#0b0d12] border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold tracking-widest text-lime-400 uppercase">Fitur Unggulan</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Kenapa Memakai TheoTown Plugin Hub?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-8 bg-[#13161e] border border-white/[0.07] rounded-2xl space-y-4 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Log Jadwal Update Mingguan</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pantau update plugin setiap hari dalam seminggu (Senin–Minggu). Dilengkapi tab visual per hari!
              </p>
            </div>

            <div className="p-8 bg-[#13161e] border border-white/[0.07] rounded-2xl space-y-4 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Separasi Baru Rilis & Update</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Plugin baru rilis dan plugin yang baru diupdate dipisahkan secara rapi dengan 2-tab interface.
              </p>
            </div>

            <div className="p-8 bg-[#13161e] border border-white/[0.07] rounded-2xl space-y-4 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Live Data Scraper</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Data otomatis ter-sync dengan forum resmi TheoTown. Informasi harga, rating, dan ID selalu akurat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── POPULAR PLUGINS SECTION ── */}
      <section id="populer" className="py-20 px-6 sm:px-12 bg-[#0d0f14]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase">Koleksi Terpopuler</span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">Plugin Paling Banyak Di-download</h2>
            </div>
            <Link href="/plugins" className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1">
              LIHAT SEMUA PLUGIN <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-16 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularPlugins.map(plugin => (
                <div key={plugin.id} className="p-4 bg-[#13161e] border border-white/[0.07] rounded-xl flex flex-col justify-between hover:border-white/20 transition-all">
                  <div className="space-y-3">
                    <div className="relative aspect-[16/9] bg-[#0b0d12] rounded-lg overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={plugin.previewImage} alt={plugin.name} className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] bg-black/70 text-gray-300 rounded">
                        {plugin.category}
                      </span>
                    </div>

                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-display font-bold text-sm text-white line-clamp-1">{plugin.name}</h3>
                      <span className="text-[11px] text-gray-500 font-mono">#{plugin.id}</span>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-gray-400">
                    <span>Oleh <strong className="text-gray-200">{plugin.author}</strong></span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-400">
                      <Download className="w-3 h-3 text-gray-500" />
                      {plugin.downloads.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 sm:px-12 bg-[#08090c] border-t border-white/[0.06] text-center sm:text-left">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-lg text-white">
            TheoTown<span style={{ color: LIME }}>Hub</span>
          </span>
          <p className="text-xs text-gray-500">
            © 2026 · Format informasi plugin dirancang ulang untuk memudahkan komunitas TheoTown.
          </p>
        </div>
      </footer>
    </div>
  );
}
