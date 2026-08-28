'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { Plugin } from '@/types/plugin';
import { FolderCard } from './FolderCard';
import { PluginCard } from './PluginCard';
import {
  Bookmark,
  FolderPlus,
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  Circle,
  Trash2,
  Move,
  Layers,
  Sparkles,
} from 'lucide-react';

interface WishlistPageViewProps {
  allPlugins: Plugin[];
  topNewestIds: Set<string>;
  onSelectPlugin: (plugin: Plugin) => void;
  onLoginRequired: () => void;
}

export function WishlistPageView({
  allPlugins,
  topNewestIds,
  onSelectPlugin,
  onLoginRequired,
}: WishlistPageViewProps) {
  const {
    user,
    wishlist,
    folders,
    createNewFolder,
    removeFolder,
    toggleDownloaded,
    toggleWishlist,
    moveItem,
  } = useAuth();

  const [activeFolderId, setActiveFolderId] = useState<string | null>(null); // null = overview folders view
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [movingItem, setMovingItem] = useState<{ id: string; currentFolder: string } | null>(null);

  if (!user) {
    return (
      <div className="py-20 text-center bg-[#13161e] border border-white/[0.07] rounded-2xl space-y-4 max-w-lg mx-auto p-8">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
          <Bookmark className="w-7 h-7 fill-current" />
        </div>
        <div>
          <h3 className="text-lg font-display font-bold text-white mb-1">
            Fitur Wishlist & Folder Plugin
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Masuk ke akun kamu untuk mengelompokkan plugin favorit ke dalam folder-folder custom, tandai status download, dan salin nama plugin sekaligus ke game.
          </p>
        </div>
        <button
          onClick={onLoginRequired}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-red-600/20 transition-all"
        >
          Masuk / Buat Akun
        </button>
      </div>
    );
  }

  // Create full folder list including 'default'
  const allFolderList = [
    { id: 'default', name: 'Utama (Default)' },
    ...folders,
  ];

  // Group wishlist items by folder
  const itemsByFolder = (folderId: string) =>
    wishlist.filter((item) => item.folderId === folderId);

  // Active folder object
  const currentFolder = allFolderList.find((f) => f.id === activeFolderId);
  const currentFolderItems = activeFolderId ? itemsByFolder(activeFolderId) : [];

  // Map wishlist item to full plugin object if available
  const getFullPlugin = (pluginId: string): Plugin => {
    const found = allPlugins.find((p) => p.id === pluginId);
    if (found) return found;
    const item = wishlist.find((w) => w.pluginId === pluginId);
    return {
      id: pluginId,
      name: item?.name || `Plugin #${pluginId}`,
      author: item?.author || 'Unknown',
      previewImage: item?.previewImage || '',
      category: item?.category || 'General',
      description: '',
      uploadDate: '',
      version: '1',
      price: { amount: 0, currency: 'Dia' },
      rating: { label: 'N/A', score: 0, count: 0 },
      size: { raw: 'N/A', bytes: 0 },
      downloads: 0,
      platforms: ['Android', 'iOS'],
      url: `https://forum.theotown.com/viewtopic.php?t=${pluginId}`,
      minVersion: '1.0',
      certified: false,
    };
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    await createNewFolder(newFolderName.trim());
    setNewFolderName('');
    setCreatingFolder(false);
  };

  const copySelectedNames = (targetIds?: Set<string>) => {
    const target = targetIds ?? new Set(currentFolderItems.map((i) => i.pluginId));
    const text = currentFolderItems
      .filter((i) => target.has(i.pluginId))
      .map((i) => i.name)
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleSelect = (pluginId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      next.has(pluginId) ? next.delete(pluginId) : next.add(pluginId);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* ── OVERVIEW VIEW: GRID FOLDER ── */}
      {activeFolderId === null ? (
        <div className="space-y-6">
          {/* Header toolbar */}
          <div className="flex flex-wrap justify-between items-center gap-4 bg-[#13161e] border border-white/[0.07] p-5 rounded-2xl">
            <div>
              <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-amber-400 fill-current" /> Wishlist Saya
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Kelola koleksi plugin per folder & pantau status download kamu.
              </p>
            </div>

            <button
              onClick={() => setCreatingFolder(true)}
              className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
            >
              <FolderPlus className="w-4 h-4" /> Buat Folder Baru
            </button>
          </div>

          {/* Form input folder baru */}
          {creatingFolder && (
            <form
              onSubmit={handleCreateFolder}
              className="p-4 bg-[#13161e] border border-amber-500/30 rounded-2xl flex items-center gap-3 animate-fade-in"
            >
              <input
                type="text"
                placeholder="Nama folder (misal: Bangunan Modern, Jalan & Mobil)..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                className="flex-1 px-4 py-2 bg-[#0b0d12] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold text-xs rounded-xl transition-colors"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setCreatingFolder(false)}
                className="px-3 py-2 text-gray-400 hover:text-white text-xs"
              >
                Batal
              </button>
            </form>
          )}

          {/* Grid folders */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 pt-4">
            {allFolderList.map((folder, idx) => {
              const items = itemsByFolder(folder.id);
              // Palette colors for folders
              const colors = ['#2563eb', '#d97706', '#059669', '#7c3aed', '#db2777', '#0891b2'];
              const folderColor = colors[idx % colors.length];

              return (
                <FolderCard
                  key={folder.id}
                  id={folder.id}
                  name={folder.name}
                  items={items}
                  color={folderColor}
                  isDefault={folder.id === 'default'}
                  onClick={() => {
                    setActiveFolderId(folder.id);
                    setSelectedItems(new Set());
                  }}
                  onDelete={() => removeFolder(folder.id)}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* ── DETAIL FOLDER VIEW: PLUGIN LIST IN FOLDER ── */
        <div className="space-y-6">
          {/* Header folder */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-[#13161e] border border-white/[0.07] p-5 rounded-2xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveFolderId(null)}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-amber-400 fill-current" />
                  {currentFolder?.name}
                </h2>
                <span className="text-xs text-gray-400">
                  {currentFolderItems.length} Plugin tersimpan
                </span>
              </div>
            </div>

            {/* Bulk Actions */}
            {currentFolderItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() =>
                    selectedItems.size === currentFolderItems.length
                      ? setSelectedItems(new Set())
                      : setSelectedItems(new Set(currentFolderItems.map((i) => i.pluginId)))
                  }
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-gray-300 transition-colors"
                >
                  {selectedItems.size === currentFolderItems.length ? 'Batal Pilih' : 'Pilih Semua'}
                </button>

                <button
                  onClick={() => copySelectedNames(selectedItems.size > 0 ? selectedItems : undefined)}
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied
                    ? 'Tersalin!'
                    : selectedItems.size > 0
                    ? `Salin Terpilih (${selectedItems.size})`
                    : `Salin Semua (${currentFolderItems.length})`}
                </button>
              </div>
            )}
          </div>

          {/* Plugin list inside folder */}
          {currentFolderItems.length === 0 ? (
            <div className="py-20 text-center text-gray-500 bg-[#13161e] border border-white/[0.07] rounded-2xl">
              <Layers className="w-12 h-12 mx-auto mb-3 opacity-40 text-amber-400" />
              <h3 className="text-base font-display font-bold text-white mb-1">
                Folder Ini Masih Kosong
              </h3>
              <p className="text-xs text-gray-400">
                Jelajahi plugin lalu klik ikon <Bookmark className="w-3.5 h-3.5 inline text-amber-400" /> untuk menambahkannya ke folder ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentFolderItems.map((item) => {
                const plugin = getFullPlugin(item.pluginId);
                const isSelected = selectedItems.has(item.pluginId);

                return (
                  <div key={item.pluginId} className="relative group/wrapper">
                    {/* Checkbox select & status bar top overlay */}
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5">
                      <button
                        onClick={() => toggleSelect(item.pluginId)}
                        className={`p-1.5 rounded-lg border backdrop-blur-md transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-gray-950 border-amber-400'
                            : 'bg-black/60 text-white/50 border-white/20 hover:text-white'
                        }`}
                      >
                        {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>

                      {/* Downloaded status badge toggle */}
                      <button
                        onClick={() => toggleDownloaded(item.pluginId, item.downloaded)}
                        title={item.downloaded ? 'Sudah Di-download (Klik untuk ubah)' : 'Belum Di-download (Klik jika sudah)'}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-md border transition-all ${
                          item.downloaded
                            ? 'bg-emerald-500/80 text-white border-emerald-400'
                            : 'bg-black/60 text-gray-400 border-white/20 hover:text-white'
                        }`}
                      >
                        {item.downloaded ? '✓ Terdownload' : '+ Downloaded?'}
                      </button>
                    </div>

                    {/* Move to another folder action button */}
                    <button
                      onClick={() => setMovingItem({ id: item.pluginId, currentFolder: item.folderId })}
                      title="Pindahkan ke folder lain"
                      className="absolute top-2 right-12 z-20 p-1.5 bg-black/60 hover:bg-black text-gray-400 hover:text-amber-400 border border-white/10 rounded-lg backdrop-blur-md opacity-0 group-hover/wrapper:opacity-100 transition-all"
                    >
                      <Move className="w-3.5 h-3.5" />
                    </button>

                    {/* Standard Plugin Card */}
                    <PluginCard
                      plugin={plugin}
                      topNewestIds={topNewestIds}
                      onClick={onSelectPlugin}
                      onLoginRequired={onLoginRequired}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Move Item Modal */}
      {movingItem && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setMovingItem(null); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-xs bg-[#13161e] border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-bold text-sm text-white">
              Pindahkan Plugin ke Folder:
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {allFolderList.map((f) => (
                <button
                  key={f.id}
                  onClick={async () => {
                    await moveItem(movingItem.id, f.id);
                    setMovingItem(null);
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs text-left font-medium transition-colors flex items-center justify-between ${
                    movingItem.currentFolder === f.id
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'text-gray-300 hover:bg-white/5'
                  }`}
                >
                  <span>{f.name}</span>
                  {movingItem.currentFolder === f.id && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => setMovingItem(null)}
              className="w-full py-2 bg-white/5 hover:bg-white/10 text-xs text-gray-400 rounded-xl"
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
