import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import type { Product } from '@/lib/types';
import { products as staticProducts, getLocalProducts } from '@/lib/data';

export interface ProductsResult {
  products: Product[];
  loading: boolean;
  error: Error | null;
  isOnline: boolean;
}

function mapRow(r: Record<string, unknown>): Product {
  return {
    ...(r as Product),
    artisanId: (r.artisan_id as string) || (r.artisanId as string) || 'artisan-1',
    createdAt: (r.created_at as string) || (r.createdAt as string),
    aiInsights: (r.ai_insights || r.aiInsights) as Product['aiInsights'],
    price: Number(r.price) || 0,
    images: Array.isArray(r.images) && r.images.length > 0 ? (r.images as string[]) : ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=300'],
  };
}

function mergeAllProducts(dbRows: Record<string, unknown>[] = []): Product[] {
  const localProds = getLocalProducts();
  const mappedDb = dbRows.map(mapRow);
  const map = new Map<string, Product>();

  // Priority order: newly added local creations first, then live database, then static fallback catalog.
  // Deduplicate by normalized product name so items never duplicate or show stale mock variants.
  [...localProds, ...mappedDb, ...staticProducts].forEach((p) => {
    if (!p) return;
    const key = (p.name || '').trim().toLowerCase() || p.id;
    if (!map.has(key)) {
      map.set(key, {
        ...p,
        price: Number(p.price) || 0,
      });
    }
  });

  return Array.from(map.values());
}

/**
 * Real-time subscription to the  Supabase table.
 * Falls back to the static seed list from  on error.
 * Also reacts to local storage product updates instantly.
 */
export function useProducts(opts: { max?: number } = {}): ProductsResult {
  const [state, setState] = useState<ProductsResult>(() => ({
    products: mergeAllProducts([]),
    loading: true,
    error: null,
    isOnline: true,
  }));

  const { max = 100 } = opts;

  const refreshFromDb = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(max);

      if (error || !data) {
        console.warn('Supabase products unavailable — using local & static catalog.', error);
        setState({
          products: mergeAllProducts([]),
          loading: false,
          error: error || null,
          isOnline: false,
        });
        return;
      }

      setState({
        products: mergeAllProducts(data as Record<string, unknown>[]),
        loading: false,
        error: null,
        isOnline: true,
      });
    } catch (err) {
      console.warn('Error fetching products:', err);
      setState({
        products: mergeAllProducts([]),
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
        isOnline: false,
      });
    }
  }, [max]);

  useEffect(() => {
    // Initial fetch
    refreshFromDb();

    // Listen to local additions from artisan form
    const handleLocalUpdate = () => {
      setState((prev) => ({
        ...prev,
        products: mergeAllProducts([]),
      }));
    };

    window.addEventListener('storage', handleLocalUpdate);
    window.addEventListener('viraasat_products_updated', handleLocalUpdate);

    // Realtime subscription from Supabase
    const channel = supabase
      .channel(`products-list-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        refreshFromDb();
      })
      .subscribe();

    return () => {
      window.removeEventListener('storage', handleLocalUpdate);
      window.removeEventListener('viraasat_products_updated', handleLocalUpdate);
      void supabase.removeChannel(channel);
    };
  }, [refreshFromDb]);

  return state;
}

/** No-op kept for API compatibility — Supabase handles reconnections automatically. */
export const resumeFirestore = async (): Promise<void> => {};
