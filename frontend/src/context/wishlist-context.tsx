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
import { supabase } from '@/services/supabase';

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

  // When signed in, load wishlist from Supabase and subscribe to realtime changes.
  useEffect(() => {
    if (!isSignedIn || !user) return;
    const userId = user.id;

    async function loadWishlist() {
      const { data, error } = await supabase
        .from('wishlists')
        .select('product_id, products(*)')
        .eq('user_id', userId);
      if (error) {
        console.warn('[Wishlist] Load failed (RLS or network):', error.message ?? error);
        return;
      }
      const items = (data ?? [])
        .map((row) => row.products as unknown as Product)
        .filter(Boolean);
      setWishlist(items);
    }

    loadWishlist();

    // Realtime subscription
    const channel = supabase
      .channel(`wishlist-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wishlists', filter: `user_id=eq.${userId}` },
        () => { void loadWishlist(); },
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [isSignedIn, user]);

  const persistRemote = useCallback(
    async (productId: string, data: Product | null) => {
      if (!isSignedIn || !user) return;
      try {
        if (data) {
          await supabase
            .from('wishlists')
            .upsert({ user_id: user.id, product_id: productId });
        } else {
          await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', user.id)
            .eq('product_id', productId);
        }
      } catch (error) {
        console.error('Failed to sync wishlist to Supabase:', error);
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
