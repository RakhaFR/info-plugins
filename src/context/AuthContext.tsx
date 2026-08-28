'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import {
  subscribeWishlist,
  subscribeFolders,
  addToWishlist,
  removeFromWishlist,
  toggleDownloadedStatus,
  createFolder,
  deleteFolder,
  moveWishlistItem,
  type WishlistItem,
  type WishlistFolder,
} from '@/lib/wishlist';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  wishlist: WishlistItem[];
  wishlistIds: Set<string>;
  folders: WishlistFolder[];
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  toggleWishlist: (
    plugin: { id: string; name: string; author: string; previewImage?: string; category?: string },
    folderId?: string
  ) => Promise<void>;
  toggleDownloaded: (pluginId: string, currentStatus: boolean) => Promise<void>;
  createNewFolder: (name: string) => Promise<string>;
  removeFolder: (folderId: string) => Promise<void>;
  moveItem: (pluginId: string, folderId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [folders, setFolders] = useState<WishlistFolder[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      setFolders([]);
      return;
    }
    const unsubW = subscribeWishlist(user.uid, setWishlist);
    const unsubF = subscribeFolders(user.uid, setFolders);
    return () => {
      unsubW();
      unsubF();
    };
  }, [user]);

  const wishlistIds = new Set(wishlist.map((w) => w.pluginId));

  const signInEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signInGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const toggleWishlist = async (
    plugin: { id: string; name: string; author: string; previewImage?: string; category?: string },
    folderId = 'default'
  ) => {
    if (!user) return;
    if (wishlistIds.has(plugin.id)) {
      await removeFromWishlist(user.uid, plugin.id);
    } else {
      await addToWishlist(user.uid, plugin, folderId);
    }
  };

  const toggleDownloaded = async (pluginId: string, currentStatus: boolean) => {
    if (!user) return;
    await toggleDownloadedStatus(user.uid, pluginId, currentStatus);
  };

  const createNewFolder = async (name: string) => {
    if (!user) return '';
    return await createFolder(user.uid, name);
  };

  const removeFolder = async (folderId: string) => {
    if (!user) return;
    await deleteFolder(user.uid, folderId);
  };

  const moveItem = async (pluginId: string, targetFolderId: string) => {
    if (!user) return;
    await moveWishlistItem(user.uid, pluginId, targetFolderId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        wishlist,
        wishlistIds,
        folders,
        signInEmail,
        signUpEmail,
        signInGoogle,
        signOut,
        toggleWishlist,
        toggleDownloaded,
        createNewFolder,
        removeFolder,
        moveItem,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
