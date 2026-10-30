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
import { useToast } from '@/core/hooks/use-toast';
import { useRef } from 'react';
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

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, user } = useUser();
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const {toast} = useToast();
  const pending = useRef(new Set<string>());
  const account = useRef<string | null>(null);

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
      try {localStorage.setItem(WISHLIST_KEY, JSON.stringify(isSignedIn ? [] : wishlist));} catch { /* browser storage unavailable */ }
    }
  }, [wishlist, hasLoaded, isSignedIn]);

  // Clear prior account data on account changes. Guests keep a device-only list.
  useEffect(() => {
    let active = true;
    const id = isSignedIn && user ? user.id : null;
    if (account.current !== id) setWishlist([]);
    account.current = id;
    if (id) {
      fetch('/api/wishlist', {cache:'no-store'}).then(async response => {
        if (!response.ok) throw new Error('Wishlist unavailable');
        const items = await response.json();
        if(active)setWishlist(items);
      }).catch(() => {if(active)toast({title:'Wishlist unavailable',description:'Your saved items could not be loaded. Please retry.',variant:'destructive'});});
    }
    return () => {active=false;};
  }, [isSignedIn,user,toast]);

  const persistRemote = useCallback(async (productId: string, saved: boolean): Promise<boolean> => {
    if (!isSignedIn || !user) return true;
    try {
      const response = await fetch('/api/wishlist', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId,saved})});
      if (!response.ok) throw new Error('Save failed');
      return true;
    } catch {
      toast({title:'Wishlist was not updated',description:'Please retry when the connection is available.',variant:'destructive'});
      return false;
    }
  }, [isSignedIn,user,toast]);

  const isWishlisted = useCallback(
    (productId: string) => wishlist.some((item) => item.id === productId),
    [wishlist],
  );

  const toggleWishlist = useCallback(async (item: Product) => {
    if(pending.current.has(item.id))return;
    pending.current.add(item.id);
    const saved = !wishlist.some(p => p.id === item.id);
    const owner = account.current;
    try {
      if(await persistRemote(item.id,saved) && owner === account.current) {
        setWishlist(prev => saved ? [...prev.filter(p => p.id !== item.id),item] : prev.filter(p => p.id !== item.id));
      }
    } finally {pending.current.delete(item.id);}
  }, [wishlist,persistRemote]);
  const removeFromWishlist = useCallback(async (productId: string) => {
    if(pending.current.has(productId))return;
    pending.current.add(productId);
    const owner=account.current;
    try {if(await persistRemote(productId,false) && owner === account.current)setWishlist(prev=>prev.filter(p=>p.id!==productId));}
    finally{pending.current.delete(productId);}
  },[persistRemote]);

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
