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
import { STORAGE_KEYS } from '@/core/config/constants';

interface WishlistContextType {
  wishlist: Product[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (item: Product) => void;
  removeFromWishlist: (productId: string) => void;
  wishlistCount: number;
}

const WISHLIST_KEY = STORAGE_KEYS.WISHLIST;

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveSupabaseUserId(user: { id: string; primaryEmailAddress?: { emailAddress?: string } | null }): Promise<string | null> {
  if (UUID_REGEX.test(user.id)) return user.id;

  const email = user.primaryEmailAddress?.emailAddress;
  if (!email) return null;

  try {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (data?.id && UUID_REGEX.test(data.id)) {
      return data.id;
    }
  } catch (err) {
    console.warn('[Wishlist] Could not resolve Supabase UUID:', err);
  }
  return null;
}

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

    let isMounted = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function initWishlist() {
      if (!user) return;
      const dbUserId = await resolveSupabaseUserId(user);
      if (!isMounted || !dbUserId) {
        // Fall back to local storage without throwing UUID query error
        return;
      }

      async function loadWishlist() {
        const { data, error } = await supabase
          .from('wishlists')
          .select('product_id, products(*)')
          .eq('user_id', dbUserId);
        if (error) {
          console.warn('[Wishlist] Load failed (RLS or network):', error.message ?? error);
          return;
        }
        if (!isMounted) return;
        const items = (data ?? [])
          .map((row) => row.products as unknown as Product)
          .filter(Boolean);
        setWishlist(items);
      }

      await loadWishlist();
      if (!isMounted) return;

      // Realtime subscription with unique channel ID to prevent reuse of already-subscribed channels
      const channelName = `wishlist-${dbUserId}-${Math.random().toString(36).slice(2, 8)}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'wishlists', filter: `user_id=eq.${dbUserId}` },
          () => { void loadWishlist(); },
        )
        .subscribe();
    }

    void initWishlist();

    return () => {
      isMounted = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [isSignedIn, user]);

  const persistRemote = useCallback(
    async (productId: string, data: Product | null) => {
      if (!isSignedIn || !user) return;
      try {
        const dbUserId = await resolveSupabaseUserId(user);
        if (!dbUserId) return;

        if (data) {
          await supabase
            .from('wishlists')
            .upsert({ user_id: dbUserId, product_id: productId });
        } else {
          await supabase
            .from('wishlists')
            .delete()
            .eq('user_id', dbUserId)
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
