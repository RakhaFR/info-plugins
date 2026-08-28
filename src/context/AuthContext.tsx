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
import { subscribeWishlist, addToWishlist, removeFromWishlist, type WishlistItem } from '@/lib/wishlist';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  wishlist: WishlistItem[];
  wishlistIds: Set<string>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  toggleWishlist: (plugin: { id: string; name: string; author: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) { setWishlist([]); return; }
    const unsub = subscribeWishlist(user.uid, setWishlist);
    return unsub;
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

  const toggleWishlist = async (plugin: { id: string; name: string; author: string }) => {
    if (!user) return;
    if (wishlistIds.has(plugin.id)) {
      await removeFromWishlist(user.uid, plugin.id);
    } else {
      await addToWishlist(user.uid, plugin);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, wishlist, wishlistIds, signInEmail, signUpEmail, signInGoogle, signOut, toggleWishlist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
