'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Heart, Copy, Check, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';

interface WishlistPanelProps {
  onLoginRequired: () => void;
}

export function WishlistPanel({ onLoginRequired }: WishlistPanelProps) {
  const { user, wishlist, toggleWishlist } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <button
        onClick={onLoginRequired}
        className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-gray-400 hover:text-white hover:bg-white/[0.04] transition-colors"
      >
        <Heart className="w-4 h-4 text-red-500" /> Wishlist (Login)
      </button>
    );
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(wishlist.map((w) => w.pluginId)));
  const clearSelect = () => setSelected(new Set());

  const copyNames = (ids?: Set<string>) => {
    const target = ids ?? new Set(wishlist.map((w) => w.pluginId));
    const names = wishlist
      .filter((w) => target.has(w.pluginId))
      .map((w) => w.name)
      .join('\n');
    navigator.clipboard.writeText(names).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const removeSelected = async () => {
    for (const id of selected) {
      await toggleWishlist({ id, name: '', author: '' });
    }
    setSelected(new Set());
  };

  return (
    <div className="space-y-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors text-gray-400 hover:text-white hover:bg-white/[0.04]"
      >
        <span className="flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          Wishlist
          {wishlist.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold">
              {wishlist.length}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="bg-[#0d0f14] border border-white/[0.06] rounded-xl overflow-hidden">
          {wishlist.length === 0 ? (
            <p className="text-[11px] text-gray-500 text-center py-4 px-3">
              Belum ada plugin di wishlist.
            </p>
          ) : (
            <>
              {/* Toolbar */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06]">
                <button
                  onClick={() => selected.size === wishlist.length ? clearSelect() : selectAll()}
                  className="text-[10px] text-gray-400 hover:text-white transition-colors px-1.5 py-0.5 rounded hover:bg-white/5"
                >
                  {selected.size === wishlist.length ? 'Batal Semua' : 'Pilih Semua'}
                </button>
                <div className="ml-auto flex gap-1">
                  {selected.size > 0 && (
                    <>
                      <button
                        onClick={() => copyNames(selected)}
                        title="Salin yang dipilih"
                        className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={removeSelected}
                        title="Hapus yang dipilih"
                        className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => copyNames()}
                    title="Salin semua nama"
                    className="p-1 rounded text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                  >
                    {copied && selected.size === 0 ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* List */}
              <ul className="max-h-52 overflow-y-auto scrollbar-thin divide-y divide-white/[0.04]">
                {wishlist.map((item) => (
                  <li
                    key={item.pluginId}
                    className={`flex items-center gap-2 px-3 py-2 group cursor-pointer transition-colors ${
                      selected.has(item.pluginId) ? 'bg-red-500/10' : 'hover:bg-white/[0.03]'
                    }`}
                    onClick={() => toggleSelect(item.pluginId)}
                  >
                    <input
                      type="checkbox"
                      readOnly
                      checked={selected.has(item.pluginId)}
                      className="accent-red-500 w-3 h-3 shrink-0 pointer-events-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white font-medium truncate">{item.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{item.author}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleWishlist({ id: item.pluginId, name: item.name, author: item.author }); }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Footer copy all */}
              <div className="px-3 py-2 border-t border-white/[0.06]">
                <button
                  onClick={() => copyNames()}
                  className="w-full py-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copied && selected.size === 0 ? (
                    <><Check className="w-3.5 h-3.5" /> Tersalin!</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" /> Salin Semua ({wishlist.length})</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
