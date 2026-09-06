'use client';

import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import type { Product } from '@/lib/types';
import { useUser } from '@clerk/nextjs';
import { db } from '@/services/firebase/firestore';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

interface WishlistContextType {
  wishlist: Product[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (item: Product) => void;
  removeFromWishlist: (productId: string) => void;
  wishlistCount: number;
}

const WISHLIST_KEY = 'viraasat-wishlist';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useUser();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load from localStorage once.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_KEY);
      if (saved) setWishlist(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to parse wishlist from localStorage', e);
    }
    setHasLoaded(true);
  }, []);

  // Persist to localStorage whenever it changes.
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    }
  }, [wishlist, hasLoaded]);

  // When signed in, treat Firestore users/{uid}/wishlist as the source of truth.
  useEffect(() => {
    if (!isSignedIn || !user || !db) return;
    const wishlistRef = collection(db, 'users', user.id, 'wishlist');

    const unsubscribe = onSnapshot(
      wishlistRef,
      (snapshot) => {
        const items: Product[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Product);
        });
        setWishlist(items);
      },
      (error) => {
        console.error('Wishlist sync failed:', error);
      },
    );

    return () => unsubscribe();
  }, [isSignedIn, user]);

  const persistRemote = useCallback(
    async (productId: string, data: Product | null) => {
      if (!isSignedIn || !user || !db) return;
      const ref = doc(db, 'users', user.id, 'wishlist', productId);
      try {
        if (data) {
          await setDoc(ref, data);
        } else {
          await deleteDoc(ref);
        }
      } catch (error) {
        console.error('Failed to sync wishlist to Firestore:', error);
      }
    },
    [isSignedIn, user],
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.some((item) => item.id === productId),
    [wishlist],
  );

  const toggleWishlist = useCallback(
    (item: Product) => {
      setWishlist((prev) => {
        const exists = prev.some((p) => p.id === item.id);
        if (exists) {
          void persistRemote(item.id, null);
          return prev.filter((p) => p.id !== item.id);
        }
        void persistRemote(item.id, item);
        return [...prev, item];
      });
    },
    [persistRemote],
  );

  const removeFromWishlist = useCallback(
    (productId: string) => {
      setWishlist((prev) => prev.filter((p) => p.id !== productId));
      void persistRemote(productId, null);
    },
    [persistRemote],
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}