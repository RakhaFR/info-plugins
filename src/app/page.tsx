'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCompactNumber, formatNumber } from '@/lib/utils';
import { PluginSkeleton } from '@/components/PluginSkeleton';
import {
  ArrowRight, LayoutGrid, ShieldCheck, Cpu, Download, Star, Loader2, X, Eye, Play, Building2
} from 'lucide-react';
import { InstallPwaButton } from '@/components/InstallPwaButton';
import { DriftWall } from '@/components/DriftWall';
import { TextMarquee } from '@/components/TextMarquee';
import { FAQSection } from '@/components/FAQSection';

import AOS from 'aos';
import 'aos/dist/aos.css';

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
  const [pageReady, setPageReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(15);
  const [stats, setStats] = useState({ totalPlugins: 0, totalDownloads: 0, certified: 0 });
  const [popularPlugins, setPopularPlugins] = useState<FeaturedPlugin[]>([]);
  const [heroImages, setHeroImages] = useState<{ image: string; title?: string }[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // Animated counter states
  const [displayPlugins, setDisplayPlugins] = useState(0);
  const [displayDownloads, setDisplayDownloads] = useState(0);
  const [displayCertified, setDisplayCertified] = useState(0);

  // Count-up helper function
  const animateCount = (target: number, setter: (v: number) => void, duration = 1500) => {
    if (target === 0) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setter(target);
        clearInterval(timer);
      } else {
        setter(start);
      }
    }, 16);
  };

  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: 'ease-out-quad' });

    // Progress bar simulation up to 88% while waiting for network
    const progressTimer = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 88) {
          clearInterval(progressTimer);
          return 88;
        }
        return prev + Math.floor(Math.random() * 15 + 8);
      });
    }, 180);

    // Loading screen ditutup setelah data API siap — TIDAK nunggu gambar selesai download
    fetch('/api/plugins')
      .then(res => res.json())
      .then(({ plugins, metadata }) => {
        const totalP = metadata.totalPlugins || plugins.length || 0;
        const totalD = metadata.totalDownloads || 0;
        const cert = metadata.certifiedCreators || 0;

        setStats({ totalPlugins: totalP, totalDownloads: totalD, certified: cert });

        // Pilih tile: mobile max 6, desktop max 12
        const isMobile = window.innerWidth < 768;
        const tileLimit = isMobile ? 6 : 12;

        const pluginImages = plugins
          .map((p: { previewImage?: string; name?: string }) => ({
            image: p.previewImage,
            title: p.name,
          }))
          .filter((item: { image?: string }) =>
            Boolean(item.image && !item.image.includes('placeholder') && !item.image.includes('icon.jpg'))
          )
          .slice(0, tileLimit);

        setHeroImages(pluginImages);

        // Preload gambar DriftWall di BACKGROUND (non-blocking, loading screen sudah terbuka)
        pluginImages.forEach((item: { image: string }) => {
          const img = new window.Image();
          img.src = item.image;
        });

        // Categories
        const catStats = metadata.categoryStats || {};
        const catNames = Object.keys(catStats);
        setCategories(
          catNames.length > 0
            ? catNames
            : ['Commercial', 'Residential', 'Industrial', 'Transport', 'Infrastructure', 'Parks', 'Public Buildings', 'Decoration', 'Water & Energy']
        );

        animateCount(totalP, setDisplayPlugins);
        animateCount(totalD, setDisplayDownloads);
        animateCount(cert, setDisplayCertified);

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
      .finally(() => {
        clearInterval(progressTimer);
        setLoadProgress(100);
        setTimeout(() => {
          setLoading(false);
          setPageReady(true);
        }, 320);
      });

    return () => clearInterval(progressTimer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0f14] text-[#f0f2f5] overflow-x-hidden font-body relative">

      {/* ── LOADING OVERLAY SCREEN ── */}
      {!pageReady && (
        <div className="fixed inset-0 z-[9999] bg-[#0d0f14] flex flex-col items-center justify-center gap-5 transition-opacity duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white font-display font-bold text-2xl shadow-xl shadow-red-600/30">
              <Building2 className="w-6 h-6" />
            </div>
            <span className="font-display font-bold text-2xl text-white">
              TheoTown<span style={{ color: LIME }}>Hub</span>
            </span>
          </div>

          <div className="w-56 h-2 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(229,57,53,0.8)]"
              style={{ width: `${Math.min(100, loadProgress)}%` }}
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono tracking-wider">
            <span>Memuat aset...</span>
            <span className="text-red-400 font-bold">{Math.min(100, loadProgress)}%</span>
          </div>
        </div>
      )}

      {/* ── NAV BAR ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-12 py-4 bg-[#0d0f14]/90 backdrop-blur-md border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.8)] border border-white/20 group-hover:border-red-500 transition-colors">
            <Image src="/icon.jpg" alt="Logo" fill className="object-cover" />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-xl tracking-tight text-white">
              TheoTown<span style={{ color: LIME }}>Hub</span>
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md">
              v1
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-xs font-semibold text-gray-400">
          <a href="#fitur" className="hover:text-white transition-colors">Fitur Utama</a>
          <a href="#populer" className="hover:text-white transition-colors">Plugin Populer</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <InstallPwaButton variant="compact" />
          <Link
            href="/plugins"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition-all shadow-lg shadow-red-600/20 hover:scale-105"
          >
            <Download className="w-3.5 h-3.5" /> Buka Plugin Hub
          </Link>
        </div>

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
          <a href="#faq" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300">FAQ</a>
          <InstallPwaButton variant="outline" className="w-full justify-center" />
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
        {/* DriftWall Background */}
        <DriftWall items={heroImages} columns={7} speed={30} dim={0.85} />

        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/15 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <h1
            data-aos="fade-up"
            data-aos-delay="100"
            className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl leading-none text-white tracking-tight drop-shadow-2xl"
          >
            Temukan Plugin & Mod <br />
            <span className="text-red-500">
              TheoTown Terbaik
            </span>
          </h1>

          <p
            data-aos="fade-up"
            data-aos-delay="200"
            className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Format pemberitahuan yang dirancang ulang agar nyaman dibaca, transparan, dan mudah dipahami oleh pemain TheoTown Indonesia. Pantau rilis baru & jadwal update mingguan!
          </p>

          <div
            data-aos="fade-up"
            data-aos-delay="300"
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
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

          {/* ── HERO STATS (Animated Count-Up) ── */}
          <div
            data-aos="fade-up"
            data-aos-delay="400"
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-10 max-w-2xl mx-auto border-t border-white/[0.08]"
          >
            <div className="p-3.5 bg-[#13161e] border border-white/[0.06] rounded-xl text-center shadow-lg">
              <span className="font-display font-extrabold text-xl sm:text-2xl text-white block">
                {formatNumber(displayPlugins)}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5 block">Total Plugin</span>
            </div>
            <div className="p-3.5 bg-[#13161e] border border-white/[0.06] rounded-xl text-center shadow-lg">
              <span className="font-display font-extrabold text-xl sm:text-2xl text-emerald-400 block">
                {formatCompactNumber(displayDownloads)}
                <span className="text-xs text-emerald-500/80 font-normal ml-1">({formatNumber(displayDownloads)})</span>
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5 block">Total Download</span>
            </div>
            <div className="p-3.5 bg-[#13161e] border border-white/[0.06] rounded-xl text-center shadow-lg">
              <span className="font-display font-extrabold text-xl sm:text-2xl text-amber-400 block">
                {formatNumber(displayCertified)}
              </span>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mt-0.5 block">Certified Creator</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── RUNNING CATEGORIES MARQUEE ── */}
      <TextMarquee items={categories} />

      {/* ── FEATURES SECTION ── */}
      <section id="fitur" className="py-20 px-6 sm:px-12 bg-[#0b0d12] border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3" data-aos="fade-up">
            <span className="text-xs font-bold tracking-widest text-lime-400 uppercase">Fitur Unggulan</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Kenapa Memakai TheoTown Plugin Hub?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
              data-aos="fade-up"
              data-aos-delay="100"
              className="p-8 bg-[#13161e] border border-white/[0.07] rounded-2xl space-y-4 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <LayoutGrid className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Log Jadwal Update Mingguan</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Pantau update plugin setiap hari dalam seminggu (Senin–Minggu). Dilengkapi tab visual per hari!
              </p>
            </div>

            <div
              data-aos="fade-up"
              data-aos-delay="200"
              className="p-8 bg-[#13161e] border border-white/[0.07] rounded-2xl space-y-4 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-white">Separasi Baru Rilis & Update</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Plugin baru rilis dan plugin yang baru diupdate dipisahkan secara rapi dengan 2-tab interface.
              </p>
            </div>

            <div
              data-aos="fade-up"
              data-aos-delay="300"
              className="p-8 bg-[#13161e] border border-white/[0.07] rounded-2xl space-y-4 hover:border-white/20 transition-colors"
            >
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

      {/* ── POPULAR PLUGINS SECTION (with Skeleton UI & Lazy Image) ── */}
      <section id="populer" className="py-20 px-6 sm:px-12 bg-[#0d0f14]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="flex flex-wrap items-end justify-between gap-4" data-aos="fade-up">
            <div className="space-y-2">
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase">Koleksi Terpopuler</span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">Plugin Paling Banyak Di-download</h2>
            </div>
            <Link href="/plugins" className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1">
              LIHAT SEMUA PLUGIN <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <PluginSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularPlugins.map((plugin, idx) => (
                <div
                  key={plugin.id}
                  data-aos="fade-up"
                  data-aos-delay={(idx % 3) * 100}
                  className="p-4 bg-[#13161e] border border-white/[0.07] rounded-xl flex flex-col justify-between hover:border-white/20 transition-all"
                >
                  <div className="space-y-3">
                    <div className="relative aspect-[16/9] bg-[#0b0d12] rounded-lg overflow-hidden">
                      <Image
                        src={plugin.previewImage}
                        alt={plugin.name}
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                      <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] bg-black/70 text-gray-300 rounded backdrop-blur-sm">
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

      {/* ── FAQ SECTION ── */}
      <FAQSection />

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 sm:px-12 bg-[#08090c] border-t border-white/[0.06] text-center sm:text-left">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-bold text-lg text-white">
            TheoTown<span style={{ color: LIME }}>Hub</span>
          </span>
          <p className="text-xs text-gray-500">
            © 2026 TheoTownHub · Situs Komunitas Unofficial (Tidak Resmi). Seluruh hak cipta game & plugin milik BlueFlower Games dan masing-masing Creator.
          </p>
        </div>
      </footer>
    </div>
  );
}
